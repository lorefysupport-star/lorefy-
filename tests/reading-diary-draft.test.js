const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../modules/lorefy-reading-diary-core.js');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-reading-diary.js'),'utf8');
function runtime(){
 const values=new Map([['lorefy.activeUser.v1','a'],['lorefy.user.library.v2',JSON.stringify({work:'أقرأ حالياً'})],
  ['lorefy.user.progress.v2',JSON.stringify({work:{chapter:2}})],
  ['lorefy.user.readingDiarySnapshot.v1',JSON.stringify({library:{work:'أقرأ حالياً'},progress:{work:{chapter:1}}})]]);
 let open=true,renders=0;
 const page={remove:()=>{open=false;}};
 const doc={readyState:'loading',documentElement:{lang:'en'},addEventListener(){},querySelector:s=>s==='#screen .lf-app'?{}:s==='.lf-diary-page'&&open?page:null};
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const window={document:doc,localStorage:storage,LorefyReadingDiaryCore:core};
 const exposed=source.replace('global.LorefyReadingDiary = { open: open, sync: sync };',
  'global.LorefyReadingDiary = {sync:sync,createEntry:createEntry,state:state,owner:typeof diaryOwner==="function"?diaryOwner:function(){return "a";},setRender:function(fn){render=fn;}};');
 vm.runInNewContext(exposed,{window,Intl,URLSearchParams});
 const api=window.LorefyReadingDiary;api.state.owner=api.owner();api.state.composing=true;api.setRender(()=>{renders++;});
 return{api,storage,renders:()=>renders,open:()=>open};
}
test('same-account sync records progress without replacing an active diary composer',()=>{
 const h=runtime();h.api.sync();assert.equal(h.renders(),0);
 assert.equal(JSON.parse(h.storage.getItem('lorefy.user.readingDiary.v1'))[0].chapter,2);
 assert.equal(JSON.parse(h.storage.getItem('lorefy.user.readingDiarySnapshot.v1')).progress.work.chapter,2);
});
test('same-progress account switch closes the previous diary before fingerprint short circuit',()=>{
 const h=runtime();h.api.sync();h.storage.setItem('lorefy.activeUser.v1','b');h.api.sync();
 assert.equal(h.open(),false);assert.equal(h.api.state.composing,false);
});
test('stale diary composer cannot write its note into the next account before sync runs',()=>{
 const h=runtime();h.storage.setItem('lorefy.activeUser.v1','b');
 assert.equal(h.api.createEntry('work','account a draft','','chapter',2,false),false);
 assert.equal(h.storage.getItem('lorefy.user.readingDiary.v1'),null);
});
