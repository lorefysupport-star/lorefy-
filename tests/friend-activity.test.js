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
test('friend shelves follow the published feed policy, even when editorial discovery lacks a classification',()=>{
  const policy=require('../modules/lorefy-catalog-policy.js');
  assert.equal(activity.eligible({id:'a',title:'A friend’s book',type:'رواية'},policy),true);
  assert.equal(activity.eligible({id:'b',title:'Blocked work',isAdult:true},policy),false);
});

const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function backendHarness(from){
  const s=fs.readFileSync(path.join(__dirname,'../backend/lorefy-backend.js'),'utf8');const start=s.indexOf('    listFriendRatings:');const scope={isUuid:v=>/^[abcf]-id$/.test(v),invalidSessionError:()=>Error('stale session'),B:{_storageMediaUrl:async()=>''},PROFILE_MEDIA_BUCKET:'profile',PROFILE_MEDIA_TTL:1};
  vm.runInNewContext('this.backend={'+s.slice(start,s.indexOf('    listReviews:',start))+'};',scope);
  Object.assign(scope.backend,{mode:'live',user:{id:'owner'},getFollowedProfileIds:async()=>['a-id','b-id'],client:{from}});return scope.backend;
}
function query(data,log){return {select(v){log.push(['select',v]);return this;},in(k,v){log.push(['in',k,Array.from(v)]);return this;},eq(k,v){log.push(['eq',k,v]);return this;},order(){return this;},limit(v){log.push(['limit',v]);return this;},then(resolve){return Promise.resolve({data}).then(resolve);}};}
test('cloud shelves scope reads to actual follows and exclude private or inaccessible profiles',async()=>{
  const log=[];const b=backendHarness(table=>query(table==='profiles'?[{id:'a-id',name:'A'}]:[{id:'good',user_id:'a-id',work_id:'one',is_public:true,rating:4},{id:'private',user_id:'a-id',is_public:false},{id:'unfollowed',user_id:'c-id',is_public:true},{id:'blocked',user_id:'b-id',is_public:true}],log));
  const value=await b.listFriendRatings();assert.deepEqual(Array.from(value.ratings,r=>r.id),['good']);
  assert(log.some(x=>x[0]==='in' && x[1]==='user_id'));assert(log.some(x=>x[0]==='eq' && x[1]==='is_public' && x[2]===true));
  assert(log.filter(x=>x[0]==='select').every(x=>!x[1].includes('body')&&!x[1].includes('image_urls')));
});
test('changing accounts while a shelf request runs discards the previous account data',async()=>{
  const b=backendHarness(()=>{throw Error('should not query');});b.getFollowedProfileIds=async()=>{b.user={id:'other'};return ['a-id'];};
  await assert.rejects(b.listFriendRatings(),/stale session/);
});
