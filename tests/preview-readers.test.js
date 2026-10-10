const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const api=require('../modules/lorefy-preview-readers.js');
const data=require('../qa/tester-data.js');
function storage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),values};}

test('fictional users activate only in a local authenticated demo, never live or production',()=>{
  assert.equal(api.allowed({hostname:'localhost',search:'?preview=demo&demo=ready'},'demo'),true);
  for(const [hostname,search,mode] of [['lorefy.app','?preview=demo&demo=ready','demo'],['localhost','?preview=demo&demo=ready','live'],['localhost','','demo']])
    assert.equal(api.allowed({hostname,search},mode),false);
});
test('main preview exposes ten searchable profiles with owner-specific artwork, favorites and libraries',async()=>{
  const community=api.createCommunity({data,storage:storage(),viewerId:'demo-owner'});
  const readers=await community.searchPublicProfiles('test_');assert.equal(readers.length,10);
  const profile=await community.getPublicProfile('qa-tester-03');
  assert.equal(profile.name,'ريم');assert.equal(profile.favorite_work_ids.length,4);
  assert.equal(Object.keys(profile.library_entries).length,10);assert.equal(profile.top_work_ids.length,10);
  assert.notEqual(profile.banner,readers[0].banner);
  const reviews=await community.listReviewCollection({userId:profile.id});assert.equal(reviews.length,1);
  assert.equal(reviews[0].profile.id,profile.id);assert.equal((await community.listReviews()).length,10);
});
test('viewer connections behave like app users and persist only under preview-scoped keys',async()=>{
  const store=storage();store.setItem('lorefy.user.following.v1','["real-user"]');
  let community=api.createCommunity({data,storage:store,viewerId:'demo-owner'});
  assert.equal((await community.listProfileFollowers('demo-owner')).length,3);
  assert.equal((await community.listProfileFollowing('demo-owner')).length,3);
  await community.toggleProfileFollow('qa-tester-01',false);
  community=api.createCommunity({data,storage:store,viewerId:'demo-owner'});
  assert.equal((await community.getFollowedProfileIds()).includes('qa-tester-01'),false);
  assert.equal(store.getItem('lorefy.user.following.v1'),'["real-user"]');
  assert.equal((await community.getPublicProfile('qa-tester-01')).is_following,false);
  const profile=await community.getPublicProfile('qa-tester-02');
  assert.equal((await community.listProfileFollowing(profile.id)).length,profile.following_count);
  assert.equal((await community.listProfileFollowers(profile.id)).length,profile.follower_count);
});
test('review state shows fixtures but never persists them in the real review collection',()=>{
  let local=[{id:'my-review',userId:'me',txt:'Keep me'}];let fixtureState;
  const React={useState:fn=>{fixtureState=fn();return [fixtureState,fn=>fixtureState=typeof fn==='function'?fn(fixtureState):fn];}};
  const community=api.createCommunity({data,storage:storage(),viewerId:'demo-owner'});
  const [shown,set]=api.reviewState(React,()=>[local,fn=>local=typeof fn==='function'?fn(local):fn],community);
  assert.equal(shown.length,11);
  set(rows=>rows.map(r=>r.id==='my-review'?{...r,txt:'Changed'}:r));
  assert.equal(local.length,1);assert.equal(local[0].txt,'Changed');assert.equal(fixtureState.length,10);
});
test('standard application prepares the preview directory before mounting and visitor profiles read it',()=>{
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(index,/LorefyPreviewReaders\.prepare\(BE, sess\)/);
  const view=fs.readFileSync(path.join(root,'modules/lorefy-public-profile.js'),'utf8');
  assert.match(view,/LorefyPreviewReaders\.isActive\(\)/);
  assert.match(view,/lf-reader-top-works/);
  const app=fs.readFileSync(path.join(root,'uploads/files/lorefy-app.js'),'utf8');
  assert.match(app,/LorefyPreviewReaders\.useReviews\(React,useStoredState\)/);
});
test('preview adapter never fetches fixture data in production and restores live endpoint behavior',async()=>{
  const vm=require('node:vm');let fetches=0;
  const B={mode:'demo',getPublicProfile:async()=>({id:'real-profile'}),searchPublicProfiles:async()=>[],
    getFollowedProfileIds:async()=>[],listProfileFollowers:async()=>[],listProfileFollowing:async()=>[],toggleProfileFollow:async()=>false};
  const window={location:{hostname:'lorefy.app',search:'?preview=demo&demo=ready'},localStorage:storage(),
    LorefyUserDiscovery:{demoReaders:[]},LorefyMangaData:[],fetch:async()=>{fetches++;return {ok:true,json:async()=>data};}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'modules/lorefy-preview-readers.js'),'utf8'),{window,URLSearchParams});
  const preview=window.LorefyPreviewReaders;
  assert.equal(await preview.prepare(B,{mode:'demo',userId:'demo-owner'}),false);assert.equal(fetches,0);
  window.location.hostname='localhost';assert.equal(await preview.prepare(B,{mode:'demo',userId:'demo-owner'}),true);
  assert.equal((await B.getPublicProfile('qa-tester-01')).id,'qa-tester-01');
  B.mode='live';assert.equal(preview.isActive(),false);assert.equal((await B.getPublicProfile('qa-tester-01')).id,'real-profile');
});
