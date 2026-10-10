const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
test('Noura previews the bunny bundle without changing the other readers',()=>{
  const data=require('../qa/tester-data.js');
  const noura=data.profiles.find(p=>p.username==='test_noura');
  assert.deepEqual(noura.profile_decoration,{frame:'pfpvibes-bunny-hug',page:'pfpvibes-bunny-hug',effect:'pfpvibes-bunny-hug'});
  assert.ok(data.profiles.filter(p=>p!==noura).every(p=>!p.profile_decoration));
});
test('ten local testers have distinct identities, artwork, libraries, ratings and top lists',()=>{
  const data=require('../qa/tester-data.js');
  assert.equal(data.profiles.length,10);assert.equal(data.reviews.length,10);
  for(const key of ['id','username','avatar','banner'])assert.equal(new Set(data.profiles.map(p=>p[key])).size,10);
  for(const key of ['library_entries','ratings','favorite_work_ids','top_work_ids'])assert.equal(new Set(data.profiles.map(p=>JSON.stringify(p[key]))).size,10);
  for(const p of data.profiles){assert.equal(p.favorite_work_ids.length,4);assert.equal(p.top_work_ids.length,10);assert.ok(p.fixture);}
  assert.equal(new Set(data.reviews.map(r=>r.userId)).size,10);
});
test('tester storage is isolated per persona and never writes regular account keys',()=>{
  const api=require('../qa/tester-boot.js'),values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),key:i=>Array.from(values.keys())[i],get length(){return values.size;}};
  storage.setItem('lorefy.identity.v1','real');
  const a=api.createStorage(storage,'test-01'),b=api.createStorage(storage,'test-02');
  a.setItem('lorefy.identity.v1','A');b.setItem('lorefy.identity.v1','B');a.clear();
  assert.equal(storage.getItem('lorefy.identity.v1'),'real');assert.equal(b.getItem('lorefy.identity.v1'),'B');
  assert.equal(a.getItem('lorefy.identity.v1'),null);
});
test('tester pages and fake reader directory are not production or native entry points',()=>{
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  assert.doesNotMatch(index,/qa\/tester/);assert.doesNotMatch(sw,/qa\/tester/);
  const boot=fs.readFileSync(path.join(root,'qa/tester-boot.js'),'utf8');
  assert.match(boot,/hostname/);assert.match(boot,/preview/);assert.match(boot,/qaTester/);
});
test('tester adapter waits for reader discovery and keeps follow changes in scoped storage',async()=>{
  const vm=require('node:vm'),data=require('../qa/tester-data.js'),values=new Map(),events={};
  const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
  const window={LorefyTesterLab:{data,profile:data.profiles[0],storage,storageFor:()=>storage},LorefyBackend:{},addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(fs.readFileSync(path.join(root,'qa/tester-adapter.js'),'utf8'),{window});
  window.LorefyUserDiscovery={demoReaders:[]};events.DOMContentLoaded();
  assert.equal(window.LorefyUserDiscovery.demoReaders.length,10);
  await window.LorefyBackend.toggleProfileFollow('qa-tester-02',false);
  assert.equal((await window.LorefyBackend.getFollowedProfileIds()).includes('qa-tester-02'),false);
  await window.LorefyBackend.toggleProfileFollow('qa-tester-02',true);
  assert.equal((await window.LorefyBackend.getFollowedProfileIds()).includes('qa-tester-02'),true);
});
