const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../modules/lorefy-chapter-detail-core.js');
const metrics=require('../modules/lorefy-reading-metrics.js');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-chapter-detail.js'),'utf8');

test('next chapter respects explicit current zero instead of stale legacy progress',()=>{
  for(const chapter of [0,'0',null,NaN,Infinity,-2]) {
    const saved={chapter,ch:12};
    assert.equal(core.nextUnread(saved,20),1,String(chapter));
    assert.equal(metrics.normalizeProgress(saved).chapter,0);
  }
  assert.equal(core.nextUnread({ch:12},20),13);
  assert.equal(core.nextUnread({chapter:4,ch:12},20),5);
});

function harness() {
  const values=new Map([['lorefy.activeUser.v1','a'],['lorefy.user.library.v2',JSON.stringify({work:'توقف',other:'تم القراءة'})],
    ['lorefy.user.progress.v2',JSON.stringify({work:{chapter:3,note:'prior checkpoint'},other:{chapter:9}})]]);
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const messages=[],scope={core,global:{localStorage:storage},readingUndo:null,notifyReading(){},render(){},
    announce:(_,message)=>messages.push(message),text:(_,en)=>en};
  const start=source.indexOf('  function readingOwner(')>=0?source.indexOf('  function readingOwner('):source.indexOf('  function readingState(');
  vm.createContext(scope);
  vm.runInContext(source.slice(start,source.indexOf('  function notifyReading()',start)),scope);
  vm.runInContext(source.slice(source.indexOf('  function saveReading('),source.indexOf('  function chapterDiscussion(')),scope);
  const info={id:'work',total:20,finished:false,owner:scope.readingOwner?scope.readingOwner():null};
  return {scope,storage,messages,info,state:()=>JSON.parse(storage.getItem('lorefy.user.progress.v2'))};
}
test('undo restores the same owner checkpoint without changing other works',()=>{
  const h=harness();h.scope.saveReading({},h.info,6);
  assert.equal(h.state().work.chapter,6);
  h.storage.setItem('lorefy.user.progress.v2',JSON.stringify({...h.state(),other:{chapter:15}}));
  h.scope.undoReading({},h.info);
  assert.equal(h.state().work.chapter,3);assert.equal(h.state().work.note,'prior checkpoint');
  assert.equal(h.state().other.chapter,15);
});
test('undo from a previous account cannot restore its data into identical next-account progress',()=>{
  const h=harness();h.scope.saveReading({},h.info,6);
  h.storage.setItem('lorefy.activeUser.v1','b');
  // Equal checkpoints are possible for two readers of the same work.
  const expected=h.storage.getItem('lorefy.user.progress.v2');
  h.scope.undoReading({},h.info);
  assert.equal(h.storage.getItem('lorefy.user.progress.v2'),expected);
  assert.match(h.messages.at(-1),/Could not undo/);
});
test('a mounted reading action from the old account cannot update the new account',()=>{
  const h=harness(),before=h.storage.getItem('lorefy.user.progress.v2');
  h.storage.setItem('lorefy.activeUser.v1','b');h.scope.saveReading({},h.info,10);
  assert.equal(h.storage.getItem('lorefy.user.progress.v2'),before);
  assert.match(h.messages.at(-1),/Could not save/);
});
test('undo refuses to overwrite a newer edit to the same work',()=>{
  const h=harness();h.scope.saveReading({},h.info,6);
  h.storage.setItem('lorefy.user.progress.v2',JSON.stringify({...h.state(),work:{chapter:7,note:'new edit'}}));
  h.scope.undoReading({},h.info);assert.equal(h.state().work.chapter,7);assert.equal(h.state().work.note,'new edit');
});
