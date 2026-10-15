const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-growth-features.js'),'utf8');
class Node {
 constructor(tag,props={},kids=[]){this.tag=tag;this.attrs={...props};this.children=[];this.handlers={};this.dataset={};this.value='';this.isConnected=true;this._text=props.text||'';if(props['data-mode'])this.dataset.mode=props['data-mode'];this.classList={contains:n=>(this.attrs.class||'').split(' ').includes(n)};(Array.isArray(kids)?kids:[kids]).filter(Boolean).forEach(k=>this.appendChild(k));}
 appendChild(n){this.children.push(n);return n;}
 set textContent(v){this._text=String(v);this.children=[];}
 get textContent(){return this._text+this.children.map(n=>n.textContent||'').join(' ');}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){this.handlers[k]=fn;}
 click(){if(this.handlers.click)this.handlers.click();}
 focus(){}
}
function nodes(root,predicate){return [root,...root.children.flatMap(n=>nodes(n,()=>true))].filter(predicate);}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function runtime(initial={a:{hero:5}}){
 let scores=initial,owner='account-a',opened=[],calls=[],provider=()=>Promise.resolve([]),paint=0;
 const storage={getItem:k=>k==='lorefy.activeUser.v1'?owner:null};
 const scope={K_SCORES:'ratings',K_CHARCUSTOM:'custom-images',K_CHARIMG:'images',read:(k,f)=>k==='ratings'?scores:f,global:{localStorage:storage},
  profileRatedCharacterCache:{},profileRatedCharacterLoads:{},profileRatedCharacterFailures:{},profileRatedCharacterGallery:null,profileTopCharacterEditor:null,
  castKey:c=>c.key,characterImageUrl:c=>c.image||'',profileWorkFor:id=>({id}),profileWorkTitle:id=>id,uiText:(ar,en)=>en,
  el:(tag,props,kids)=>new Node(tag,props||{},kids||[]),scheduleCharacterActionIcons(){},
  profileRatedCharacterShelfCard:item=>new Node('button',{class:'card',text:item.character.name}),
  workContext:({workId})=>({id:workId}),loadCast:work=>{calls.push(work.id);return provider(work);},
  paintProfileRatedCharacters:()=>{paint++;},syncProfileTopCharacters(){},
  doc:{documentElement:{lang:'en',dir:'ltr'},querySelector:()=>null},
  ovOpen:()=>{const page=new Node('div'),body=new Node('div');page.appendChild(body);const ov={page,body,close(){page.inert=true;page.isConnected=false;}};opened.push(ov);return ov;}};
 let start=source.indexOf('  function profileRatedScoreRows(');
 vm.runInNewContext(source.slice(start,source.indexOf('  function profileCharacterEntries(',start)),scope);
 start=source.indexOf('  function ratedCharacterGroups(');
 vm.runInNewContext(source.slice(start,source.indexOf('  function paintProfileRatedCharacters(',start)),scope);
 start=source.indexOf('  function hydrateProfileRatedCharacters(');
 vm.runInNewContext(source.slice(start,source.indexOf('  function syncProfileRatedCharacters(',start)),scope);
 return{scope,calls,opened,provider:fn=>{provider=fn;},setScores:s=>{scores=s;},setOwner:id=>{owner=id;},
  open(){scope.openProfileRatedCharacters();return opened.at(-1);},
  sync(){if(scope.syncProfileRatedCharacterGallery)scope.syncProfileRatedCharacterGallery();},paint:()=>paint};
}
const cards=ov=>nodes(ov.body,n=>n.attrs.class==='card').map(n=>n.textContent);

test('an initially loading gallery hydrates itself without closing and reopening',async()=>{
 const h=runtime(),request=deferred();h.provider(()=>request.promise);const ov=h.open();await flush();
 assert.deepEqual(h.calls,['a']);assert.match(ov.body.textContent,/Loading/);
 request.resolve([{key:'hero',name:'Hero'}]);await flush();
 assert.deepEqual(cards(ov),['Hero']);assert.equal(ov.page.isConnected,true);
});

test('zero saved ratings and an empty verified cast are not endless loading states',async()=>{
 const empty=runtime({}),ov=empty.open();await flush();
 assert.match(ov.body.textContent,/No rated characters yet/);assert.deepEqual(empty.calls,[]);
 const h=runtime(),partial=h.open();await flush();h.sync();await flush();
 assert.deepEqual(h.calls,['a']);assert.doesNotMatch(partial.body.textContent,/Loading character ratings/);
 assert.match(partial.body.textContent,/unavailable/i);
});

test('partial hydration preserves the search input and work-grouping selection',async()=>{
 const h=runtime({a:{hero:5},b:{other:3}}),request=deferred();h.scope.profileRatedCharacterCache.a=[{key:'hero',name:'Hero'}];
 h.provider(()=>request.promise);const ov=h.open();await flush();
 const input=nodes(ov.body,n=>n.tag==='input')[0];input.value='Other';input.handlers.input();
 const byWork=nodes(ov.body,n=>n.dataset.mode==='work')[0];byWork.click();
 request.resolve([{key:'other',name:'Other'}]);await flush();
 assert.equal(nodes(ov.body,n=>n.tag==='input')[0],input);assert.equal(input.value,'Other');
 assert.equal(byWork.attrs['aria-selected'],'true');assert.deepEqual(cards(ov),['Other']);
});

test('network failure remains retryable without a request storm or a false empty cache',async()=>{
 const saved={a:{hero:5}},before=JSON.stringify(saved),h=runtime(saved);let tries=0;
 h.provider(()=>++tries===1?Promise.reject(Error('offline')):Promise.resolve([{key:'hero',name:'Hero'}]));
 const ov=h.open();await flush();h.sync();h.sync();await flush();
 assert.equal(tries,1);assert.equal(Object.hasOwn(h.scope.profileRatedCharacterCache,'a'),false);
 const retry=nodes(ov.body,n=>n.tag==='button'&&/Retry/.test(n.textContent))[0];assert.ok(retry,'retry action is visible');
 retry.click();await flush();assert.equal(tries,2);assert.deepEqual(cards(ov),['Hero']);assert.equal(JSON.stringify(saved),before);
});

test('a closed gallery is not repainted by late hydration',async()=>{
 const h=runtime(),request=deferred();h.provider(()=>request.promise);const ov=h.open();await flush();ov.close();
 const before=ov.body.textContent;request.resolve([{key:'hero',name:'Hero'}]);await flush();h.sync();
 assert.equal(ov.body.textContent,before);assert.equal(h.scope.profileRatedCharacterGallery,null);
});

test('account changes close the previous gallery before a pending response can render',async()=>{
 const h=runtime(),request=deferred();h.provider(()=>request.promise);const ov=h.open();await flush();
 h.setOwner('account-b');h.setScores({b:{other:2}});request.resolve([{key:'hero',name:'Private old choice'}]);await flush();
 assert.equal(ov.page.isConnected,false);assert.ok(!ov.body.textContent.includes('Private old choice'));
});

test('same-account rating edits update the open gallery without replacing its controls',async()=>{
 const h=runtime();h.scope.profileRatedCharacterCache.a=[{key:'hero',name:'Hero'}];const ov=h.open();
 const input=nodes(ov.body,n=>n.tag==='input')[0];h.setScores({});h.sync();
 assert.deepEqual(cards(ov),[]);assert.match(ov.body.textContent,/No rated characters yet/);
 assert.equal(nodes(ov.body,n=>n.tag==='input')[0],input);
});

test('storage events close a cached gallery on sign-out and unchanged syncs preserve its cards',()=>{
 const h=runtime();h.scope.profileRatedCharacterCache.a=[{key:'hero',name:'Hero'}];const ov=h.open();
 const card=nodes(ov.body,n=>n.attrs.class==='card')[0];h.sync();h.sync();
 assert.equal(nodes(ov.body,n=>n.attrs.class==='card')[0],card);
 h.setOwner('');h.scope.profileRatedCharacterStateChanged({detail:{key:'lorefy.activeUser.v1'}});
 assert.equal(ov.page.isConnected,false);
});

test('hydration coalesces in-flight requests and tolerates a synchronously throwing provider',async()=>{
 const h=runtime(),request=deferred();h.provider(()=>request.promise);
 const one=h.scope.hydrateProfileRatedCharacters('a'),two=h.scope.hydrateProfileRatedCharacters('a');
 assert.equal(one,two);await flush();assert.equal(h.calls.length,1);request.resolve([]);await one;
 const broken=runtime();broken.provider(()=>{throw Error('provider unavailable');});
 await broken.scope.hydrateProfileRatedCharacters('a');
 assert.equal(Object.hasOwn(broken.scope.profileRatedCharacterCache,'a'),false);
});
