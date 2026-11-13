const test=require('node:test'),assert=require('node:assert/strict');
const api=()=>require('../modules/lorefy-notification-center.js');
test('all interaction types have distinct categories and bilingual copy',()=>{
 const c=api();for(const [event,category] of [['post_like','likes'],['review_like','likes'],['post_reply','replies'],['review_reply','replies'],['post_mention','mentions'],['comment_mention','mentions'],['follow','follows']]){
  const row={kind:event==='follow'?'follow':'',data:{event,actorName:'Nora'}};
  assert.equal(c.category(row),category);assert.ok(c.copy(row,'en').body.includes('Nora'));assert.ok(c.copy(row,'ar').title);
 }
});
test('filtering keeps read history, isolates mentions and never mutates source order',()=>{
 const c=api(),rows=[{id:'old',kind:'follow',read_at:'x',created_at:'2026-01-01'},
 {id:'new',kind:'mention',created_at:'2026-11-13'},{id:'new',kind:'mention',created_at:'2026-11-13'}];
 assert.deepEqual(c.select(rows,'all').map(x=>x.id),['new','old']);
 assert.deepEqual(c.select(rows,'unread').map(x=>x.id),['new']);
 assert.equal(c.select(rows,'mentions').length,1);assert.equal(rows[0].id,'old');
});
test('unknown payloads are plain text, not synthesized links or HTML',()=>{
 const c=api(),row={title:'<script>',body:'literal',kind:'system'};
 assert.deepEqual(c.copy(row,'en'),{title:'<script>',body:'literal'});assert.equal(c.category(row),'other');
});

function dom(){
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.listeners={};this._text='';this.hidden=false;}
  get textContent(){return this._text;}set textContent(value){this._text=value;this.children=[];}
  appendChild(n){if(n.parentElement)n.remove();this.children.push(n);n.parentElement=this;return n;}
  insertBefore(n,before){if(n.parentElement)n.remove();const at=this.children.indexOf(before);this.children.splice(at<0?this.children.length:at,0,n);n.parentElement=this;}
  insertAdjacentElement(where,n){const p=this.parentElement,index=p.children.indexOf(this);p.children.splice(index+(where==='afterend'?1:0),0,n);n.parentElement=p;}
  remove(){const p=this.parentElement;if(p)p.children.splice(p.children.indexOf(this),1);this.parentElement=null;}
  setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}
  addEventListener(k,fn){this.listeners[k]=fn;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){const matches=n=>selector[0]==='.'?String(n.className||'').split(' ').includes(selector.slice(1)):n.tagName===selector.toUpperCase();return this.children.flatMap(n=>[...(matches(n)?[n]:[]),...n.querySelectorAll(selector)]);}
 }
 const doc={createElement:tag=>new Element(tag)},page=doc.createElement('main');page.appendChild(doc.createElement('header'));return {doc,page};
}

test('relative timestamps advance without replacing a notification row or its focused control',()=>{
 const {doc,page}=dom(),previous=global.document;global.document=doc;
 try{
  let time='1m ago';const props={page,rows:[{id:'one',created_at:'2026-11-13T00:00:00Z',data:{event:'post_like',actorName:'Nora'}}],language:'en',time:()=>time,refresh(){},older(){},open(){},hasOlder:false};
  api().render(props);const row=page._lfInboxCenter.rows.get('one');assert.equal(row.time.textContent,'1m ago');
  time='4m ago';api().render(props);assert.equal(page._lfInboxCenter.rows.get('one').button,row.button);
  assert.equal(row.time.textContent,'4m ago');assert.match(row.button.getAttribute('aria-label'),/4m ago/);
 }finally{global.document=previous;}
});
