const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const folders = require('../modules/lorefy-profile-sections.js');
const {createMemoryStore} = require('../modules/lorefy-product-core.js');

function safetyHarness() {
  let resolve, reject;
  const backend = {mode:'live', user:{id:'a'}, _pullGeneration:1,
    setProfileBlock:() => new Promise((yes,no) => { resolve=yes; reject=no; })};
  const window = {LorefyBackend:backend};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../modules/lorefy-product-core.js'),'utf8'),{window});
  const store=createMemoryStore({'lorefy.activeUser.v1':'a','lorefy.safety.blocked.v1':'["blocked","keep"]'});
  const core=window.LorefyProductCore.createProductCore(store);
  return {backend,store,core,resolve:() => resolve(),reject:() => reject(Error('offline'))};
}
test('unblock waits for the server and preserves unrelated local edits',async()=>{
  const h=safetyHarness(), pending=h.core.safety.unblockUser('blocked');
  assert.equal(typeof pending.then,'function');
  assert.deepEqual(Array.from(h.core.safety.getBlockedUsers()),['blocked','keep']);
  h.store.setItem('lorefy.safety.blocked.v1','["blocked","keep","new"]');
  h.resolve(); await pending;
  assert.deepEqual(Array.from(h.core.safety.getBlockedUsers()),['keep','new']);
});
test('failed unblock keeps the block and rejects instead of reporting success',async()=>{
  const h=safetyHarness(), pending=h.core.safety.unblockUser('blocked');
  h.reject(); await assert.rejects(pending,/offline/);
  assert.deepEqual(Array.from(h.core.safety.getBlockedUsers()),['blocked','keep']);
});
for (const blocked of [false,true]) test(`late ${blocked?'block':'unblock'} cannot edit another account`,async()=>{
  const h=safetyHarness(), pending=blocked?h.core.safety.blockUser('target'):h.core.safety.unblockUser('blocked');
  h.store.setItem('lorefy.activeUser.v1','b'); h.backend.user={id:'b'};
  h.store.setItem('lorefy.safety.blocked.v1','["b-only"]');
  h.resolve(); await assert.rejects(pending,/account changed/);
  assert.equal(h.store.getItem('lorefy.safety.blocked.v1'),'["b-only"]');
});
test('a restarted sync generation rejects a stale unblock even for the same user',async()=>{
  const h=safetyHarness(), pending=h.core.safety.unblockUser('blocked');
  h.backend._pullGeneration++; h.resolve(); await assert.rejects(pending,/account changed/);
  assert.deepEqual(Array.from(h.core.safety.getBlockedUsers()),['blocked','keep']);
});
test('missing live blocking service cannot silently remove or add a local block',()=>{
  const h=safetyHarness(); h.backend.setProfileBlock=null;
  assert.throws(()=>h.core.safety.unblockUser('blocked'),/unavailable/);
  assert.throws(()=>h.core.safety.blockUser('target'),/unavailable/);
  assert.deepEqual(Array.from(h.core.safety.getBlockedUsers()),['blocked','keep']);
});
test('new list visibility uses the current folder without dropping contents or other lists',()=>{
  const store=createMemoryStore({'lorefy.activeUser.v1':'a'});
  folders.saveFolder(store,'a',{id:'one',name:'Updated name',description:'keep',items:[{id:'x',name:'X'}],isPublic:true});
  folders.saveFolder(store,'a',{id:'two',name:'Other',isPublic:true});
  folders.setFolderVisibility(store,'a','one',false);
  const rows=folders.foldersFor({},true,store), one=rows.find(row=>row.id==='one');
  assert.equal(one.name,'Updated name'); assert.equal(one.description,'keep'); assert.equal(one.items[0].id,'x');
  assert.equal(one.isPublic,false); assert.equal(rows.find(row=>row.id==='two').isPublic,true);
  assert.deepEqual(folders.foldersFor({profile_lists:rows},false,store).map(row=>row.id),['two']);
});
test('visibility cannot revive deleted lists, edit another account, or accept unlisted',()=>{
  const store=createMemoryStore({'lorefy.activeUser.v1':'a'});
  folders.saveFolder(store,'a',{id:'one',name:'One'});
  assert.throws(()=>folders.setFolderVisibility(store,'b','one',true),/account changed/);
  assert.throws(()=>folders.setFolderVisibility(store,'a','one','unlisted'),/Invalid/);
  folders.deleteFolder(store,'a','one');
  assert.throws(()=>folders.setFolderVisibility(store,'a','one',true),/no longer exists/);
  assert.deepEqual(folders.foldersFor({},true,store),[]);
});
