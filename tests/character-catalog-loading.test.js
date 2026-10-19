const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-character-system.js','utf8');
const flush=async()=>{for(let i=0;i<18;i++)await Promise.resolve();};
function harness(mode='',seed=true){
 let serial=0;const scripts=[],timers=new Map(),values=new Map();
 const work={id:'fixture-work',title:'',type:'Manga'},cast=[{id:'hero',name:'Fixture Hero',latin:'Fixture Hero'}];
 const window={LOREFY_CHARACTER_ASSETS:{visual:'/fixture-characters.js'},LorefyCharacterCatalog:seed?{[work.id]:cast}:{},
  localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}};
 window.document={querySelector:()=>scripts.find(s=>!s.removed)||null,createElement:()=>({dataset:{},remove(){this.removed=true;}}),head:{appendChild(script){scripts.push(script);if(mode==='throw')throw Error('append failed');if(mode==='error')script.onerror();}}};
 vm.runInNewContext(source,{window,URL,URLSearchParams,console,fetch:()=>{throw Error('Unexpected network');},setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)});
 return{api:window.LorefyCharacterSystem,window,work,cast,scripts,timers,values,async expire(){const pending=[...timers.values()];timers.clear();pending.forEach(t=>t.fn());await flush();}};
}
function observe(p){const out={state:'pending'};p.then(value=>{out.state='fulfilled';out.value=value;},error=>{out.state='rejected';out.error=error;});return out;}

test('concurrent cast loads share the pending bundled script and release the deadline on load',async()=>{
 const h=harness(),a=h.api.loadCast(h.work),b=h.api.loadCast(h.work);assert.equal(h.scripts.length,1);
 h.scripts[0].onload();assert.equal((await a)[0].name,'Fixture Hero');assert.equal((await b).length,1);assert.equal(h.timers.size,0);
});
test('a silent bundled-script request has a ten-second deadline and can retry',async()=>{
 const h=harness(),first=observe(h.api.loadCast(h.work));assert.equal(h.timers.size,1);assert.equal([...h.timers.values()][0].ms,10000);
 await h.expire();assert.equal(first.state,'fulfilled');assert.equal(h.scripts[0].removed,true);
 const next=h.api.loadCast(h.work);assert.equal(h.scripts.length,2);h.scripts[1].onload();assert.equal((await next).length,1);
});
test('a failed bundled script is removed and the next cast load can retry',async()=>{
 const h=harness(),first=h.api.loadCast(h.work);h.scripts[0].onerror();assert.equal((await first).length,1);assert.equal(h.timers.size,0);
 const next=h.api.loadCast(h.work);assert.equal(h.scripts.length,2);h.scripts[1].onload();await next;
});
test('late old script callbacks cannot settle or delete a newer pending attempt',async()=>{
 const h=harness(),first=observe(h.api.loadCast(h.work)),oldLoad=h.scripts[0].onload,oldError=h.scripts[0].onerror;
 await h.expire();assert.equal(first.state,'fulfilled');const next=observe(h.api.loadCast(h.work));
 oldLoad();oldError();await flush();assert.equal(next.state,'pending');assert.equal(h.timers.size,1);
 const coalesced=h.api.loadCast(h.work);assert.equal(h.scripts.length,2);h.scripts[1].onload();await coalesced;await flush();assert.equal(next.state,'fulfilled');
});
test('an append failure releases the bundled attempt instead of retaining a rejected promise',async()=>{
 const h=harness('throw'),first=observe(h.api.loadCast(h.work));await flush();assert.equal(first.state,'fulfilled');assert.equal(h.timers.size,0);
 const next=observe(h.api.loadCast(h.work));await flush();assert.equal(next.state,'fulfilled');assert.equal(h.scripts.length,2);
});
test('a synchronous script error cannot poison the bundled promise slot',async()=>{
 const h=harness('error');await h.api.loadCast(h.work);await h.api.loadCast(h.work);assert.equal(h.scripts.length,2);assert.equal(h.timers.size,0);
});
test('successful bundled loads stay memoized without another script or live timer',async()=>{
 const h=harness(),first=h.api.loadCast(h.work);h.scripts[0].onload();await first;await h.api.loadCast(h.work);
 assert.equal(h.scripts.length,1);assert.equal(h.timers.size,0);
});
test('a timed-out bundle without verified cast is a retryable failure, never a saved empty cast',async()=>{
 const h=harness('',false),first=observe(h.api.loadCast(h.work));await h.expire();assert.equal(first.state,'rejected');assert.equal(h.values.size,0);
 h.window.LorefyCharacterCatalog[h.work.id]=h.cast;const next=h.api.loadCast(h.work);h.scripts[1].onload();assert.equal((await next).length,1);
});
