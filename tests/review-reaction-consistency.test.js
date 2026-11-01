const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Node=require('./helpers/render-dom'),source=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
const id='11111111-1111-4111-8111-111111111111',key='review:'+id;
const keys={like:'lorefy.communityLikes.v1',dislike:'lorefy.communityDislikes.v1',mine:'lorefy.communityMyLikes.v1',negative:'lorefy.communityMyDislikes.v1'};
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r));};
function mount({snapshot=null}={}){
 const store=new Map(),requests=[],messages=[],cards=[];
 const read=(key,fallback)=>store.has(key)?JSON.parse(JSON.stringify(store.get(key))):fallback;
 const write=(key,value)=>store.set(key,JSON.parse(JSON.stringify(value)));
 const backend={mode:'live',user:{id:'owner'},client:{},_communityEpoch:1,setReviewReaction:(...args)=>new Promise((resolve,reject)=>requests.push({args,resolve,reject}))};
 const doc={createElement:tag=>new Node(tag),querySelectorAll:()=>cards,documentElement:{lang:'en'}};
 const scope={doc,global:{LorefyBackend:backend,setTimeout,clearTimeout,dispatchEvent(){}},read,write,uiText:(ar,en)=>en,toastSafe:text=>messages.push(text),console:{warn(){}},Intl,setTimeout,clearTimeout};
 const start=source.indexOf('  var K_COMMUNITY_DISLIKES');vm.runInNewContext(source.slice(start,source.indexOf('  function updateCommunityHero(',start)),scope);
 const syncStart=source.indexOf('  function syncCommunityReactionViews(');vm.runInNewContext(source.slice(syncStart,source.indexOf('  function wireCommunitySave(',syncStart)),scope);
 function card(){
  const make=()=>{const span=new Node('span',{text:'0'}),button=new Node('button',{},[span]);button.getAttribute=name=>button.attrs[name]??null;button.classList.add=(...values)=>values.forEach(v=>button.classList.toggle(v,true));button.querySelector=s=>s.includes('dislike-icon')?{}:s.includes('action-label')&&!s.includes('span:not')?null:span;return button;};
  const like=make(),dislike=make(),root=new Node('article',{'data-review-id':id,...(snapshot?{'data-review-reactions':JSON.stringify(snapshot)}:{})});
  root.getAttribute=name=>root.attrs[name]??null;root.querySelector=s=>s.includes('dislike')?dislike:like;cards.push(root);
  scope.wireCommunityDislike(dislike,root);scope.wireCommunityLike(like,root,dislike);
  const click=button=>button.handlers.click({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});
  return{root,like,dislike,click};
 }
 return{store,requests,messages,backend,read,write,card,scope};
}

test('review like and dislike share a lock across both controls and duplicate cards',async()=>{
 const h=mount(),a=h.card(),b=h.card(),job=a.click(a.like);await settle();a.click(a.dislike);b.click(b.like);await settle();
 assert.equal(h.requests.length,1);h.requests[0].resolve(true);await job;
 assert.equal(a.like.attrs['aria-busy'],'false');assert.equal(a.dislike.attrs['aria-busy'],'false');
});
test('failed review reaction rolls back only its own optimistic values and does not promise a nonexistent sync queue',async()=>{
 const h=mount(),a=h.card(),job=a.click(a.like);await settle();h.write(keys.like,{...h.read(keys.like,{}),other:9});
 h.requests[0].reject(Error('offline'));await job;
 assert.equal(h.read(keys.mine,{})[key]||false,false);assert.equal(h.read(keys.like,{})[key]||0,0);
 assert.equal(h.read(keys.like,{}).other,9);assert.equal(h.messages.length,1);assert.doesNotMatch(h.messages[0],/سيُزامن|will.*sync|locally/i);
});
test('a failed first operation does not dispatch an opposite-action cleanup',async()=>{
 const h=mount();h.write(keys.negative,{[key]:true});h.write(keys.dislike,{[key]:1});const a=h.card(),job=a.click(a.like);await settle();
 h.requests[0].reject(Error('offline'));await settle();assert.equal(h.requests.length,1);await job;
});
test('failure from an old account cannot rewrite reaction caches or toast into its replacement',async()=>{
 const h=mount(),a=h.card(),job=a.click(a.like);await settle();h.backend.user={id:'other'};h.write(keys.like,{[key]:42});h.write(keys.mine,{[key]:true});
 h.requests[0].reject(Error('offline'));await job;assert.equal(h.read(keys.like,{})[key],42);assert.deepEqual(h.messages,[]);
});
test('fresh authoritative reaction metadata replaces a stale per-review cache including zero',()=>{
 const h=mount({snapshot:[0,2,false,true]});h.write(keys.like,{[key]:99});h.write(keys.mine,{[key]:true});const a=h.card();
 assert.equal(a.like.querySelector('span').textContent,'0');assert.equal(a.like.attrs['aria-pressed'],'false');
 assert.equal(a.dislike.querySelector('span').textContent,'2');assert.equal(a.dislike.attrs['aria-pressed'],'true');
 a.root.attrs['data-review-reactions']=JSON.stringify([5,0,true,false]);h.scope.wireCommunityDislike(a.dislike,a.root);h.scope.wireCommunityLike(a.like,a.root,a.dislike);
 assert.equal(a.like.querySelector('span').textContent,'5');assert.equal(a.dislike.querySelector('span').textContent,'0');
});

test('hanging review reaction releases both controls for retry and ignores its late response',async()=>{
 const h=mount(),a=h.card();let timeout;
 h.scope.global.setTimeout=(fn,ms)=>{assert.equal(ms,14000);timeout=fn;return 1;};h.scope.global.clearTimeout=()=>{};
 const first=a.click(a.like);await settle();timeout();await first;
 assert.equal(a.like.attrs['aria-busy'],'false');assert.equal(a.dislike.attrs['aria-disabled'],'false');
 const retry=a.click(a.like);await settle();assert.equal(h.requests.length,2);
 h.requests[1].resolve(true);await retry;h.requests[0].resolve(true);await settle();
 assert.equal(h.read(keys.mine,{})[key],true);assert.equal(h.read(keys.like,{})[key],1);
});

test('demo opposite toggles stay local without a remote cleanup or false rollback',async()=>{
 const h=mount();h.backend.mode='demo';const a=h.card();
 await a.click(a.like);await a.click(a.dislike);
 assert.equal(h.requests.length,0);assert.equal(h.read(keys.mine,{})[key]||false,false);
 assert.equal(h.read(keys.negative,{})[key],true);assert.deepEqual(h.messages,[]);
 await a.click(a.like);assert.equal(h.read(keys.negative,{})[key]||false,false);assert.equal(h.read(keys.mine,{})[key],true);
});
