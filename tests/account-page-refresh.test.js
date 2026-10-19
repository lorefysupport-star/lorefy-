const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('backend/lorefy-backend.js','utf8');
const key='lorefy.user.library.v2',pending='lorefy.pendingState.v1';
function harness(){
 const values=new Map([[key,'local'],['lorefy.activeUser.v1','a'],['lorefy.stateBase.v1',JSON.stringify({userId:'a',data:{[key]:'base'},version:1})],[pending,JSON.stringify({[key]:'local'})]]),events=[];
 const ls={get length(){return values.size;},key:i=>[...values.keys()][i],getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const scope={localStorage:ls,document:{addEventListener(){},removeEventListener(){}},addEventListener(){},console:{warn(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},dispatchEvent:e=>events.push(e)};scope.window=scope;
 vm.runInNewContext(source,scope);const api=scope.LorefyBackend,hydrate=api._hydrateProfile;let reads=0,gate=Promise.resolve(),error=null;
 const client={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>{reads++;await gate;return error?{error}:{data:{data:{[key]:'remote','lorefy.user.favorites.v2':'["remote"]'},version:2}};}})})})};
 Object.assign(api,{mode:'live',user:{id:'a'},client,_communityEpoch:1,_hydrateProfile:async()=>true});
 return{api,values,events,hydrate,reads:()=>reads,hold(){let resolve;gate=new Promise(r=>resolve=r);return resolve;},fail(){error=Error('offline');}};
}
test('profile refresh preserves pending local edits and adopts unrelated cloud keys',async()=>{
 const h=harness();assert.equal(await h.api.refreshAccount(),true);assert.equal(h.values.get(key),'local');
 assert.equal(JSON.parse(h.values.get(pending))[key],'local');assert.equal(h.values.get('lorefy.user.favorites.v2'),'["remote"]');
 assert.ok(h.events.some(e=>e.type==='lorefy:stored-state'&&e.detail.key==='lorefy.user.favorites.v2'));
});
test('concurrent refreshes share the same account read',async()=>{
 const h=harness(),release=h.hold();const a=h.api.refreshAccount(),b=h.api.refreshAccount();
 await Promise.resolve();assert.equal(h.reads(),1);release();await Promise.all([a,b]);
});
test('mismatched local owner cannot refresh or clear another account',async()=>{
 const h=harness();h.values.set('lorefy.activeUser.v1','b');const before=JSON.stringify([...h.values]);
 await assert.rejects(h.api.refreshAccount());assert.equal(h.reads(),0);assert.equal(JSON.stringify([...h.values]),before);
});
for(const transition of ['account','client','epoch','generation','cancel'])test('pending refresh ignores '+transition+' changes',async()=>{
 const h=harness(),release=h.hold();let active=true;const job=h.api.refreshAccount({active:()=>active});
 await Promise.resolve();
 if(transition==='account'){h.api.user={id:'b'};h.values.set('lorefy.activeUser.v1','b');}
 if(transition==='client')h.api.client={};if(transition==='epoch')h.api._communityEpoch++;if(transition==='generation')h.api._pullGeneration++;if(transition==='cancel')active=false;
 release();await assert.rejects(job);assert.equal(h.values.get(key),'local');assert.equal(h.values.has('lorefy.user.favorites.v2'),false);
});
test('network failure is an error, not a successful refresh',async()=>{const h=harness();h.fail();await assert.rejects(h.api.refreshAccount(),/offline/);assert.equal(h.values.get(key),'local');});
test('remote profile hydration during refresh does not stage an automatic cloud write',async()=>{
 const h=harness(),from=h.api.client.from;let scheduled=0;h.api._hydrateProfile=h.hydrate;
 h.api._profileMediaUrl=async value=>value;h.api._schedulePush=()=>scheduled++;
 h.api.client.from=table=>table!=='profiles'?from(table):{select:()=>({eq:()=>({maybeSingle:async()=>({data:{name:'Cloud reader',username:'reader',social_links:{instagram:'reader'}}})})})};
 h.api.startSync();scheduled=0;await h.api.refreshAccount();
 assert.equal(scheduled,0);assert.equal(Object.hasOwn(JSON.parse(h.values.get(pending)),'lorefy.identity.v1'),false);
 assert.equal(JSON.parse(h.values.get('lorefy.identity.v1')).name,'Cloud reader');
});
