const test=require('node:test'),assert=require('node:assert/strict'),activity=require('../modules/lorefy-friend-activity.js');
test('shelves only use followed public readers, ignoring own ratings and blocked readers',()=>{
  const rows=[{id:'a',userId:'friend',mid:'one',r:4.25,ts:100},{id:'b',userId:'stranger',mid:'two',r:5,ts:110},{id:'c',userId:'me',mid:'own',r:5,ts:120},{id:'d',userId:'blocked',mid:'secret',r:5,ts:130},{id:'e',userId:'friend',mid:'private',r:5,ts:140,is_public:false}];
  const value=activity.derive(rows,['friend','me','blocked'],{hidden:['blocked']});
  assert.deepEqual(value.recent.map(r=>r.id),['a']); assert.equal(value.popular.length,1);
});
test('new from friends keeps the latest review per reader and canonical work; popular counts distinct readers',()=>{
  const rows=[{id:'old',userId:'a',mid:'alias',r:1,ts:1},{id:'new',userId:'a',mid:'one',r:4.25,ts:2},{id:'other',userId:'b',mid:'one',r:4.75,ts:3},{id:'single',userId:'c',mid:'two',r:5,ts:4}];
  const value=activity.derive(rows,['a','b','c'],{aliases:{alias:'one'}});
  assert.deepEqual(value.recent.map(r=>r.id),['single','other','new']);
  assert.equal(value.popular[0].mid,'one');assert.equal(value.popular[0].count,2);assert.equal(value.popular[0].r,4.5);
});
test('empty, invalid or unrated data does not invent friend cards',()=>{
  assert.deepEqual(activity.derive([{userId:'a',mid:'one',r:0,ts:2},{userId:'a',mid:'bad',r:Infinity,ts:2}],['a']),{recent:[],popular:[]});
  assert.deepEqual(activity.derive([{userId:'a',mid:'one',r:4,ts:2}],[]),{recent:[],popular:[]});
});

test('friends intentional zero dislikes stay visible and contribute zero to the actual mean',()=>{
  const rows=[{id:'old',userId:'a',mid:'alias',r:5,ts:1},
    {id:'no',userId:'a',mid:'one',r:0,recVal:'no',ts:2},
    {id:'yes',user_id:'b',work_id:'one',rating:5,recommend:true,created_at:'2026-11-01T00:00:00Z'},
    {id:'raw-zero',user_id:'c',work_id:'two',rating:0,recommend:false,created_at:'2026-11-01T00:00:00Z'}];
  const result=activity.derive(rows,['a','b','c'],{aliases:{alias:'one'}});
  assert.equal(result.recent.find(row=>row.id==='no').r,0);
  assert.equal(result.recent.find(row=>row.id==='raw-zero').r,0);
  const one=result.popular.find(row=>row.mid==='one');assert.equal(one.count,2);assert.equal(one.r,2.5);
});

test('the newest private or unrated friend state cannot resurrect an older public score',()=>{
  for(const change of [{r:null},{r:0,recVal:null,rec:false},{r:4,is_public:false},{r:NaN}]){
    const rows=[{id:'old',userId:'a',mid:'one',r:5,ts:1},{id:'new',userId:'a',mid:'one',r:3,ts:2,...change},
      {id:'other',userId:'b',mid:'one',r:2,ts:3}];
    const result=activity.derive(rows,['a','b']);assert.deepEqual(result.recent.map(row=>row.id),['other']);
    assert.equal(result.popular[0].count,1);assert.equal(result.popular[0].r,2);
  }
});

test('missing or nonnumeric friend ratings never become zero dislikes or borrow stale raw ratings',()=>{
  const rows=[null,undefined,'',false,true,NaN,Infinity].map((r,i)=>({id:String(i),userId:'a',mid:'one-'+i,r,rating:4,rec:false,recVal:null,ts:1}));
  assert.deepEqual(activity.derive(rows,['a']),{recent:[],popular:[]});
});
test('friend shelves follow the published feed policy, even when editorial discovery lacks a classification',()=>{
  const policy=require('../modules/lorefy-catalog-policy.js');
  assert.equal(activity.eligible({id:'a',title:'A friend’s book',type:'رواية'},policy),true);
  assert.equal(activity.eligible({id:'b',title:'Blocked work',isAdult:true},policy),false);
});

const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function backendHarness(from){
  const s=fs.readFileSync(path.join(__dirname,'../backend/lorefy-backend.js'),'utf8'),window={};
  vm.runInNewContext(s,{window,console,URL,setTimeout,clearTimeout});
  const b=window.LorefyBackend;
  Object.assign(b,{mode:'live',user:{id:'owner'},getFollowedProfileIds:async()=>['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'],client:{from},_storageMediaUrl:async()=>''});
  return b;
}
function query(data,log){return {select(v){log.push(['select',v]);return this;},in(k,v){log.push(['in',k,Array.from(v)]);return this;},eq(k,v){log.push(['eq',k,v]);return this;},order(){return this;},limit(v){log.push(['limit',v]);return this;},then(resolve){return Promise.resolve({data}).then(resolve);}};}
test('cloud shelves scope reads to actual follows and exclude private or inaccessible profiles',async()=>{
  const log=[];const b=backendHarness(table=>query(table==='profiles'?[{id:'11111111-1111-4111-8111-111111111111',name:'A'}]:[{id:'good',user_id:'11111111-1111-4111-8111-111111111111',work_id:'one',is_public:true,rating:4},{id:'private',user_id:'11111111-1111-4111-8111-111111111111',is_public:false},{id:'unfollowed',user_id:'33333333-3333-4333-8333-333333333333',is_public:true},{id:'blocked',user_id:'22222222-2222-4222-8222-222222222222',is_public:true}],log));
  const value=await b.listFriendRatings();assert.deepEqual(Array.from(value.ratings,r=>r.id),['good']);
  assert(log.some(x=>x[0]==='in' && x[1]==='user_id'));assert(log.some(x=>x[0]==='eq' && x[1]==='is_public' && x[2]===true));
  assert(log.filter(x=>x[0]==='select').every(x=>!x[1].includes('body')&&!x[1].includes('image_urls')));
  assert(log.some(x=>x[0]==='select' && x[1].split(',').includes('recommend')));
});
test('changing accounts while a shelf request runs discards the previous account data',async()=>{
  const b=backendHarness(()=>{throw Error('should not query');});b.getFollowedProfileIds=async()=>{b.user={id:'other'};return ['11111111-1111-4111-8111-111111111111'];};
  await assert.rejects(b.listFriendRatings(),e=>e.code==='LOREFY_SESSION_INVALID');
});
test('page refresh awaits current friend shelves and unregisters on unmount',async()=>{
 const effects=[],states=[],handlers=new Map();
 const window={React:{createElement:(type,props,...children)=>({type,props,children}),useState:value=>{const i=states.length;states.push(value);return[value,next=>{states[i]=typeof next==='function'?next(states[i]):next;}];},useEffect:fn=>effects.push(fn)},
  LorefyBackend:{mode:'live',user:{id:'owner'},listFriendRatings:async()=>({ratings:[],followingIds:['friend'],limited:false})},
  LorefyPageRefresh:{register:(name,fn)=>{handlers.set(name,fn);return()=>handlers.delete(name);}},addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../modules/lorefy-friend-activity.js'),'utf8'),{window});
 window.LorefyFriendActivity.Rails({language:'en',following:[],reviews:[],getWork:()=>null});
 const cleanup=effects.map(fn=>fn());await new Promise(r=>setImmediate(r));
 assert.equal(typeof handlers.get('community-friends'),'function');
 assert.equal(await handlers.get('community-friends')({active:()=>true}),true);
 assert.equal(states[0].following[0],'friend');cleanup.forEach(fn=>fn&&fn());assert.equal(handlers.size,0);
});
