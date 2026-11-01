const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-friend-activity.js','utf8');
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
const sample={ratings:[{id:'rating',user_id:'friend',work_id:'work',rating:4,created_at:'2026-11-01T00:00:00Z'}],followingIds:['friend'],limited:false};
function mount(){
 const hooks=[],effects=[],pending=[],handlers=new Map(),events=new Map(),timers=new Map(),requests=[];let cursor=0,timerId=0,listener;
 const props={language:'en',following:['friend'],reviews:[],getWork:()=>({id:'work',title:'Book'}),cover:()=>'/cover',fallback:()=>'',Stars:()=>null};
 const backend={mode:'live',user:{id:'owner'},listFriendRatings:()=>new Promise((resolve,reject)=>requests.push({resolve,reject})),subscribeCommunity:async fn=>{listener=fn;return()=>{listener=null;};}};
 const window={LorefyBackend:backend,
  setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),
  addEventListener:(key,fn)=>{if(!events.has(key))events.set(key,new Set());events.get(key).add(fn);},removeEventListener:(key,fn)=>events.get(key)?.delete(fn),
  LorefyPageRefresh:{register:(key,fn)=>{handlers.set(key,fn);return()=>handlers.delete(key);}},React:{
   createElement:(type,props,...children)=>({type,props,children}),
   useState(initial){const index=cursor++;if(!(index in hooks))hooks[index]=typeof initial==='function'?initial():initial;return[hooks[index],value=>{hooks[index]=typeof value==='function'?value(hooks[index]):value;}];},
   useRef(initial){const index=cursor++;if(!(index in hooks))hooks[index]={current:initial};return hooks[index];},
   useEffect(fn,deps){const index=cursor++,old=effects[index];if(!old||deps.some((value,i)=>value!==old.deps[i])){old?.cleanup?.();effects[index]={deps};pending.push(()=>{effects[index].cleanup=fn();});}},
  }};
 vm.runInNewContext(source,{window});
 const h={props,backend,requests,handlers,state:()=>hooks[0],
  render(){cursor=0;const tree=window.LorefyFriendActivity.Rails(props);while(pending.length)pending.shift()();return tree;},
  emit(key,payload){for(const fn of events.get(key)||[])fn(payload);},
  realtime(table){assert.equal(typeof listener,'function','friend rails subscribe to the shared change channel');listener(typeof table==='string'?{table}:table);},
  timers(ms){for(const[id,job]of[...timers])if(job.ms===ms){timers.delete(id);job.fn();}},
  cleanup(){for(const effect of effects)effect?.cleanup?.();}};
 h.render();return h;
}

test('initial friend load and pull refresh share one request and completion',async()=>{
 const h=mount();await settle();const pull=h.handlers.get('community-friends')({active:()=>true});await settle();
 assert.equal(h.requests.length,1);h.requests[0].resolve(sample);assert.equal(await pull,true);await settle();
 assert.equal(h.state().rows.length,1);h.cleanup();
});

test('background refresh and failure retain already loaded friend rows',async()=>{
 const h=mount();await settle();h.requests[0].resolve(sample);await settle();h.render();const rows=h.state().rows;
 h.emit('lorefy:community-refresh');await settle();h.render();
 assert.equal(h.state().rows,rows);assert.equal(h.state().loading,false);
 h.requests[1].reject(Error('offline'));await settle();assert.equal(h.state().rows,rows);assert.equal(h.state().error,true);h.cleanup();
});

test('unrelated review array updates do not restart friend requests',async()=>{
 const h=mount();await settle();h.requests[0].resolve(sample);await settle();
 h.props.reviews=[{id:'unrelated',ts:2,r:5}];h.render();await settle();
 assert.equal(h.requests.length,1);h.cleanup();
});

test('friend loading deadline releases retry and ignores an older late response',async()=>{
 const h=mount();await settle();h.timers(14000);await settle();assert.equal(h.state().loading,false);assert.equal(h.state().error,true);
 const next=h.handlers.get('community-friends')({active:()=>true});await settle();assert.equal(h.requests.length,2);
 h.requests[1].resolve(sample);assert.equal(await next,true);h.requests[0].resolve({ratings:[],followingIds:[]});await settle();
 assert.equal(h.state().rows.length,1);h.cleanup();
});

test('friend realtime ignores reaction noise and catches new ratings received while loading',async()=>{
 const h=mount();await settle();for(let i=0;i<10;i++)h.realtime('review_reactions');h.timers(180);assert.equal(h.requests.length,1);
 for(let i=0;i<10;i++)h.realtime('reviews');h.timers(180);h.requests[0].resolve({ratings:[],followingIds:['friend']});await settle();h.timers(180);await settle();
 assert.equal(h.requests.length,2);h.requests[1].resolve(sample);await settle();assert.equal(h.state().rows.length,1);h.cleanup();
});

test('old friend results cannot enter a replaced account and cleanup removes refresh ownership',async()=>{
 const h=mount();await settle();h.backend.user={id:'other'};h.render();await settle();
 h.requests[0].resolve(sample);await settle();assert.equal(h.state().rows.length,0);
 h.requests[1].resolve({ratings:[],followingIds:[]});await settle();assert.equal(h.state().owner,'other');
 h.cleanup();assert.equal(h.handlers.size,0);
});

test('known stranger and own-review events do not reload friends, but incomplete delete payloads still catch up',async()=>{
 const h=mount();await settle();h.requests[0].resolve(sample);await settle();
 h.realtime({table:'reviews',new:{user_id:'stranger'}});
 h.realtime({table:'reviews',new:{user_id:'owner'}});
 h.timers(180);await settle();assert.equal(h.requests.length,1);
 h.realtime({table:'reviews',new:{user_id:'friend'}});h.timers(180);await settle();assert.equal(h.requests.length,2);
 h.requests[1].resolve(sample);await settle();
 h.realtime({table:'reviews',eventType:'DELETE',old:{id:'unknown'}});h.timers(180);await settle();assert.equal(h.requests.length,3);
 h.requests[2].resolve(sample);await settle();h.cleanup();
});
