const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Node=require('./helpers/render-dom'),source=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
const el=(...args)=>new Node(...args);
function extract(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}
test('favorite works keep seven saved slots, covers and results on editing',()=>{
 const works=Array.from({length:30},(_,i)=>({id:String(i+1),title:'Work '+i,cover:'cover'+i}));let overlay;
 let saved=['1','2','3','4','5','6','7'];
 const scope={doc:{documentElement:{lang:'en'},querySelector:()=>null},read:()=>saved.slice(),el,
  ovOpen(){const page=el('div'),body=el('div'),head=el('header',{},[el('button',{class:'lf-ov-back'})]);page.append(head,body);return overlay={page,head,body,close(){}};},
  uiText:(ar,en)=>en,profileWorkFor:id=>works.find(w=>w.id===id),mlTitleOf:w=>w.title,mlCoverOf:w=>w.cover,
  profileTopCharacterSearchText:v=>String(v).toLowerCase(),mlWorks:()=>works,write(key,value){saved=Array.from(value);},toastSafe(){},
  global:{addEventListener(){},removeEventListener(){},dispatchEvent(){}},CustomEvent:class{},setTimeout:f=>{f();return 1;},clearTimeout(){}};
 vm.runInNewContext(extract('  function openProfileFavouriteWorksEditor(','  function syncProfileFavouriteWorksControls('),scope);
 scope.openProfileFavouriteWorksEditor();const slots=overlay.body.querySelector('.lf-top-works-editor-slots'),results=overlay.body.querySelector('.lf-top-works-editor-results');
 assert.equal(slots.children.length,7);
 const firstSlot=slots.children[0],firstResult=results.children[0],cover=firstResult.children[0];
 slots.children[1].click();assert.equal(slots.children[0],firstSlot);assert.equal(results.children[0],firstResult);assert.equal(slots.children[1].attrs['aria-pressed'],'true');
 results.querySelector('.lf-top-works-editor-more').click();assert.equal(results.children.length,25);assert.equal(results.children[0],firstResult);assert.equal(firstResult.children[0],cover);
 const search=overlay.body.querySelector('input');search.value='work';search.handlers.input();assert.equal(slots.children[0],firstSlot);assert.equal(results.children[0],firstResult);
 results.children[2].click();assert.equal(slots.children[0],firstSlot);assert.equal(slots.children[1].attrs['aria-label'].includes('Work 2'),true);
 assert.equal(results.children[0],firstResult,'unchanged result survives another work selection');
 assert.equal(saved.length,7,'editing an early slot must not drop positions five through seven');
 overlay.page.querySelector('.lf-top-works-editor-save').click();
 assert.equal(saved.length,7,'explicit save retains every favorite');
 assert.equal(saved[6],'7');
});
test('review top characters preserve cast portraits and unaffected slots on selection and removal',()=>{
 let selected=[],cast=[{name:'Alpha',image:'a'},{name:'Beta',image:'b'}];
 const scope={el,top4Get:()=>selected,top4Set:(id,v)=>{selected=v;},top4LoadCast:(id,cb)=>cb(cast),top4Portrait:item=>el('img',{src:item.img})};
 vm.runInNewContext(extract('  function buildTop4Section(','  function directChildOf('),scope);
 const section=scope.buildTop4Section('work','en'),slots=section.querySelector('.lf-top4-slots');
 slots.children[0].click();const list=section.querySelector('.lf-top4-list'),alpha=list.children[0],beta=list.children[1],emptyLast=slots.children[3];
 alpha.click();const chosen=slots.children[0];assert.equal(list.children[0],alpha);assert.equal(list.children[1],beta);assert.equal(slots.children[3],emptyLast);assert.equal(alpha.children[2].textContent,'✓');
 beta.click();assert.equal(slots.children[0],chosen);assert.equal(list.children[0],alpha);
 slots.children[1].querySelector('button').click();assert.equal(slots.children[0],chosen);assert.equal(beta.children[2].textContent,'Add');assert.equal(selected.length,1);
});
test('legacy ranking updates selected badges without rebuilding the cast',()=>{
 const castHost=el('div'),castMeta=el('span'),castSearch={value:''},list={chars:[]};let paints=0;
 const scope={castHost,castMeta,castSearch,castVisible:30,CLX_CAST_BATCH:30,el,clFilterCast:cast=>cast,
  clFace:()=>el('img'),releaseCharacterPortraits(){},inList:ch=>list.chars.findIndex(c=>c.id===ch.id),list,persist(){},paintChosen(){paints++;},refreshHead(){},toastSafe(){}};
 const a=source.indexOf('      var castData = null;',source.indexOf('      function slotEl('));const b=source.indexOf('      paintChosen(); paintCast();',a);
 vm.runInNewContext(source.slice(a,b),scope);scope.castData=[{id:'a',name:'Alpha',image:'a'},{id:'b',name:'Beta',image:'b'}];scope.paintCast();
 const alpha=castHost.children[0],beta=castHost.children[1],image=beta.children[0];alpha.querySelector('.lf-clx-cast-select').click();assert.equal(castHost.children[0],alpha);assert.equal(castHost.children[1],beta);assert.equal(beta.children[0],image);assert.equal(alpha.querySelector('.lf-clx-cast-badge').textContent,'1');
 alpha.querySelector('.lf-clx-cast-select').click();assert.equal(alpha.querySelector('.lf-clx-cast-badge').hidden,true);assert.equal(paints,2);
});
test('custom list add/remove keeps search results, covers and unaffected ranked rows',()=>{
 const listSource=fs.readFileSync('modules/lorefy-profile-sections.js','utf8'),api=require('../modules/lorefy-profile-sections');
 const panel=el('div'),works=[{id:'new',title:'New work'}],folder={id:'list',name:'List',kind:'works',items:[{id:'old',workId:'old',name:'Old work'}]};
 const scope={root:{localStorage:{}},doc:{},text:()=>api.labels('en'),account:()=> 'owner',current:()=>true,read:()=>({}),node:el,hydrate(){},
  image:()=>el('img'),icon:name=>el('i',{'data-lucide':name}),catalog:()=>works,workItem:w=>({id:w.id,workId:w.id,name:w.title}),
  replacePanel:(state,...children)=>state.panel.replaceChildren(...children),releaseListImages(){},
  button(label,symbol,action,cls){const n=el('button',{class:cls},[el('i'),el('span',{text:label})]);n.addEventListener('click',action);return n;},contentHeader:()=>el('header')};
 vm.runInNewContext(listSource.slice(listSource.indexOf('  function editFolder('),listSource.indexOf('  async function loadPosts(')),scope);
 scope.editFolder({panel,profile:{id:'owner'}},folder);
 const form=panel.querySelector('form'),search=form.querySelectorAll('input').find(n=>n.attrs.type==='search');search.value='New';search.handlers.input();
 const results=panel.querySelector('.lf-profile-list-results'),result=results.children[0],cover=result.children[0],ranked=panel.querySelector('.lf-profile-ranked-list'),old=ranked.children[0];
 const select=result.querySelector('.lf-profile-list-select');select.click();assert.equal(results.children[0],result);assert.equal(result.children[0],cover);assert.equal(select.disabled,true);assert.equal(ranked.children[0],old);
 ranked.children[1].querySelectorAll('button')[2].click();assert.equal(results.children[0],result);assert.equal(select.disabled,false);assert.equal(ranked.children[0],old);
});
test('ranking podium keeps unchanged portraits when another position changes',()=>{
 const start=source.indexOf('      var chosenPodium='),end=source.indexOf('      var castData = null;',start),chosen=el('div'),list={chars:[{id:'a',name:'Alpha'}]};
 const scope={chosen,list,el,releaseCharacterPortraits(){},slotEl:(i)=>el('button',{},[el('img',{src:list.chars[i]?.id||''})])};vm.runInNewContext(source.slice(start,end),scope);
 scope.paintChosen();const podium=chosen.children[0],alpha=podium.children[1],portrait=alpha.children[0];
 list.chars.push({id:'b',name:'Beta'});scope.paintChosen();assert.equal(chosen.children[0],podium);assert.equal(podium.children[1],alpha);assert.equal(alpha.children[0],portrait);
});
