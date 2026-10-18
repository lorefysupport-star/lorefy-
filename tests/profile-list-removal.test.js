const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const api=require('../modules/lorefy-profile-sections');
function store(){const data=new Map([['lorefy.activeUser.v1','owner']]);return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};}
test('confirmed removal persists only the selected list and awaits cloud sync',async()=>{
  const storage=store();
  for(const id of ['a','b'])api.saveFolder(storage,'owner',{id,name:id,isPublic:true});
  let pushed=false;
  const synced=await api.removeFolderAndSync(storage,'owner',{id:'a'},{mode:'live',push:async()=>{pushed=true;assert.deepEqual(api.foldersFor({},true,storage).map(x=>x.id),['b']);return true;}});
  assert.equal(synced,true);assert.equal(pushed,true);
});
test('offline deletion remains local and reports pending instead of false cloud success',async()=>{
  const storage=store();api.saveFolder(storage,'owner',{id:'a',name:'A'});
  for(const push of [async()=>false,async()=>{throw Error('offline');}]){
    assert.equal(await api.removeFolderAndSync(storage,'owner',{id:'a'},{mode:'live',push}),false);
  }
  assert.deepEqual(api.foldersFor({},true,storage),[]);
});
test('removal refuses a stale account before mutation and ignores a stale sync completion',async()=>{
  const storage=store();api.saveFolder(storage,'owner',{id:'a',name:'A'});
  await assert.rejects(()=>api.removeFolderAndSync(storage,'other',{id:'a'}),/account/);
  assert.equal(api.foldersFor({},true,storage).length,1);
  await assert.rejects(()=>api.removeFolderAndSync(storage,'owner',{id:'a'},{mode:'live',push:async()=>{storage.setItem('lorefy.activeUser.v1','other');return true;}}),/account/);
});
test('legacy lists use their own adapter without writing the ranked-list key',async()=>{
  const storage=store(),calls=[];
  await api.removeFolderAndSync(storage,'owner',{id:'legacy-work:x',legacyId:'x',legacyKind:'works'},null,{remove:(row,owner)=>calls.push([row.legacyId,owner])});
  assert.deepEqual(calls,[['x','owner']]);assert.equal(storage.getItem(api.KEY),null);
});
test('folder cards expose owner-only removal and a named confirmation, not nested buttons',()=>{
  const src=fs.readFileSync('modules/lorefy-profile-sections.js','utf8');
  assert.match(src,/class:'lf-profile-folder-entry'/);
  assert.match(src,/state\.owner.*confirmDelete\(state,folder\)/);
  assert.match(src,/function confirmDelete\(state, folder\)/);
  assert.match(src,/removeFolderAndSync\(root\.localStorage/);
});
test('legacy removal checks owner and preserves unrelated work and character lists',()=>{
  const src=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
  const start=src.indexOf('global.LorefyLegacyLists = {'),end=src.indexOf('  function openListsHub',start);
  let works=[{id:'a'},{id:'b'}],chars=[{id:'a'}];
  const global={localStorage:{},LorefyProfileSections:{account:()=> 'owner'}};
  vm.runInNewContext(src.slice(start,end),{global,mlLists:()=>works,clLists:()=>chars,mlSave:v=>works=v,clSave:v=>chars=v});
  assert.throws(()=>global.LorefyLegacyLists.remove({legacyId:'a',legacyKind:'works'},'other'),/account/);
  global.LorefyLegacyLists.remove({legacyId:'a',legacyKind:'works'},'owner');
  assert.deepEqual(Array.from(works,x=>x.id),['b']);assert.equal(chars.length,1);
});
test('a failed visitor list fetch offers retry tied to the same viewer and profile',()=>{
  const src=fs.readFileSync('modules/lorefy-profile-sections.js','utf8');
  assert.match(src,/async function reloadFolders\(state\)/);
  assert.match(src,/button\(t.retry,'rotate-cw',\(\) => reloadFolders\(state\)\)/);
  assert.match(src,/viewer!==account\(root.localStorage\)/);
});
test('delete completion does not replace another active tab and retry survives the DOM observer',()=>{
  const src=fs.readFileSync('modules/lorefy-profile-sections.js','utf8');
  const remove=src.slice(src.indexOf('function confirmDelete('),src.indexOf('function catalog()'));
  assert.match(remove,/!current\(state\) \|\| state.tab!=='lists'/);
  const retry=src.slice(src.indexOf('async function reloadFolders('),src.indexOf('function showFolder('));
  assert.match(retry,/state.page.__lorefyProfileSnapshot=state.profile/);
});
