const test=require('node:test');
const assert=require('node:assert/strict');
const views=require('../modules/lorefy-library-view.js');
const appearance=require('../modules/lorefy-public-appearance.js');

function element() {
  const classes=new Set(),attributes={};
  return {children:[],textContent:'',className:'',title:'',attributes,
    classList:{toggle(name,on){on?classes.add(name):classes.delete(name);},contains:name=>classes.has(name)},
    style:{setProperty(name,value){this[name]=value;}},
    setAttribute(name,value){attributes[name]=String(value);},getAttribute:name=>attributes[name]||null,
    appendChild(node){this.children.push(node);},
    querySelector(selector){return this.children.find(n=>'.'+n.className===selector)||null;}};
}
function fixture(titles) {
  const container=element();
  const cards=titles.map(title=>{
    const card=element(),cover=element(),image=title?{alt:title,parentElement:cover}:null;
    card.setAttribute('data-work-title',title||'');
    const query=card.querySelector.bind(card);
    card.querySelector=selector=>selector==='img'?image:query(selector);
    card.cover=cover;return card;
  });
  container.children=cards.slice();
  return {container,cards,doc:{createElement:element}};
}
test('showcase is additive, translated and saved without reinterpreting the old modes',()=>{
  assert.equal(views.normalizeMode('showcase'),'showcase');
  for(const mode of ['grid','spines','shelf'])assert.equal(views.normalizeMode(mode),mode);
  assert.equal(views.normalizeMode('unknown'),'grid');
  assert.equal(views.options('ar').find(o=>o.mode==='showcase').label,'عرض بارز');
  assert.equal(views.options('en').find(o=>o.mode==='showcase').label,'Showcase');
  const values={};const storage={setItem:(k,v)=>values[k]=v,getItem:k=>values[k]};
  assert.equal(views.setMode('showcase',storage),true);
  assert.equal(views.savedMode(storage),'showcase');
  assert.equal(views.setMode('showcase',{setItem(){throw Error('full');}}),false);
});
test('showcase fills triplets with first ranked work in the center and never drops the remainder',()=>{
  for(const count of [1,2,3,4,7,250]) {
    const positions=Array.from({length:count},(_,i)=>views.showcasePlacement(i));
    assert.equal(new Set(positions.map(p=>p.row+':'+p.position)).size,count);
    assert.equal(positions[0].position,'center');
    if(count>1)assert.equal(positions[1].position,'left');
    if(count>2)assert.equal(positions[2].position,'right');
    positions.forEach((p,i)=>assert.equal(p.row,Math.floor(i/3)+1));
  }
});
test('showcase mode clears incompatible classes and exposes its selected control',()=>{
  const {container}=fixture([]);
  const buttons=['grid','spines','showcase','shelf'].map(view=>({...element(),dataset:{view}}));
  for(const mode of ['spines','shelf','showcase','grid']) {
    views.applyMode(container,buttons,mode);
    for(const [name,value] of [['is-spine-view','spines'],['is-shelf-view','shelf'],['is-showcase-view','showcase']])assert.equal(container.classList.contains(name),mode===value);
    buttons.forEach(b=>assert.equal(b.attributes['aria-pressed'],String(b.dataset.view===mode)));
  }
});
test('showcase decorates existing cards without moving, replacing, or losing actions and images',()=>{
  const {container,cards,doc}=fixture(['Berserk','Vagabond','Hunter x Hunter','One Piece','']);
  const originals=container.children.slice(),covers=cards.map(c=>c.cover),clicked=[];
  cards[0].onclick=()=>clicked.push('original');
  views.syncShowcaseCards(doc,container,cards,true);
  views.syncShowcaseCards(doc,container,cards,true);
  assert.deepEqual(container.children,originals);
  assert.deepEqual(cards.map(c=>c.cover),covers);
  cards[0].onclick();assert.deepEqual(clicked,['original']);
  assert.equal(cards[0].attributes['data-showcase-position'],'center');
  assert.equal(cards[1].attributes['data-showcase-position'],'left');
  assert.equal(cards[2].attributes['data-showcase-position'],'right');
  assert.equal(cards[3].style['--showcase-row'],'2');
  assert.equal(cards[3].querySelector('.lf-showcase-caption').children[0].textContent,'4');
  assert.equal(cards[0].children.filter(n=>n.className==='lf-showcase-caption').length,1);
  assert.equal(cards[4].classList.contains('lf-showcase-empty'),true);
  cards[0].setAttribute('data-work-title','Changed title');
  views.syncShowcaseCards(doc,container,cards,true);
  assert.equal(cards[0].querySelector('.lf-showcase-caption').children[1].textContent,'Changed title');
  views.syncShowcaseCards(doc,container,cards,false);
  assert.equal(container.classList.contains('is-showcase-view'),false);
  assert.deepEqual(container.children,originals);
});
test('public appearance retains the owners showcase choice and rejects unknown values',()=>{
  assert.equal(appearance.normalize({library_view:'showcase'}).library_view,'showcase');
  assert.equal(appearance.normalize({library_view:'invalid'}).library_view,'grid');
});
test('empty showcase preserves placeholder geometry and recovers when a cover arrives',()=>{
  const {container,cards,doc}=fixture(['','','','']);
  views.syncShowcaseCards(doc,container,cards,true);
  assert.equal(container.classList.contains('is-showcase-empty'),true);
  assert.equal(cards[0].children.length,0);
  const filled=fixture(['Berserk']).cards[0];container.children[0]=filled;
  views.syncShowcaseCards(doc,container,container.children,true);
  assert.equal(container.classList.contains('is-showcase-empty'),false);
  assert.equal(filled.querySelector('.lf-showcase-caption').children[1].textContent,'Berserk');
  views.syncShowcaseCards(doc,container,container.children,false);
  assert.equal(container.classList.contains('is-showcase-empty'),false);
});

test('a missing managed cover is still a ranked book and the outer anchor receives geometry',()=>{
 const {container,cards,doc}=fixture(['','Real']);const cover=element(),oldQuery=cards[0].querySelector;
 cards[0].setAttribute('data-work-title','Missing source');cards[0].querySelector=s=>s==='[data-lorefy-book-cover]'?cover:oldQuery(s);
 views.syncShowcaseCards(doc,container,cards,true);
 assert.equal(container.classList.contains('is-showcase-empty'),false);assert.equal(cards[0].classList.contains('lf-showcase-book'),true);
 assert.equal(cover.classList.contains('lf-showcase-cover'),true);assert.equal(cards[0].attributes['data-showcase-position'],'center');
 assert.equal(cards[0].querySelector('.lf-showcase-caption').children[1].textContent,'Missing source');
});
