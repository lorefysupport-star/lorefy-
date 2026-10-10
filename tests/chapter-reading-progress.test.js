const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../modules/lorefy-chapter-detail-core.js');
test('reading checkpoint preserves other works and progress fields',()=>{
  const before={library:{other:'توقف'},progress:{work:{page:12,note:'keep'},other:{chapter:4}}};
  const result=core.updateReading(before,'work',7,20,false);
  assert.equal(result.library.work,'أقرأ حالياً');
  assert.deepEqual(result.progress.work,{page:12,note:'keep',chapter:7});
  assert.equal(result.progress.other.chapter,4);
  assert.equal(before.progress.work.chapter,undefined);
});
test('all available chapters of an ongoing work do not imply completion',()=>{
  assert.equal(core.updateReading({library:{},progress:{}},'work',20,20,false).library.work,'أقرأ حالياً');
});
test('finished work becomes completed only at the verified final chapter',()=>{
  assert.equal(core.updateReading({library:{},progress:{}},'work',20,20,true).library.work,'تم القراءة');
});
test('moving a completed work checkpoint back restores Reading status',()=>{
  const result=core.updateReading({library:{work:'تم القراءة'},progress:{work:{chapter:20}}},'work',6,20,true);
  assert.equal(result.library.work,'أقرأ حالياً');
  assert.equal(result.progress.work.chapter,6);
});
test('checkpoint rejects invalid counts rather than inventing read totals',()=>{
  for(const n of [-1,0,21,1.5,NaN]) assert.equal(core.updateReading({},'work',n,20,false),null);
  assert.equal(core.updateReading({},'work',1,0,false),null);
  assert.equal(core.updateReading({},'',1,20,false),null);
});
test('next chapter is bounded and completed progress has no next chapter',()=>{
  assert.equal(core.nextUnread({chapter:8},20),9);
  assert.equal(core.nextUnread({chapter:20},20),0);
  assert.equal(core.nextUnread(null,20),1);
  assert.equal(core.nextUnread({chapter:999},20),0);
  assert.equal(core.nextUnread(null,0),0);
});
test('completed legacy work with no checkpoint is shown as fully read',()=>{
  assert.equal(core.nextUnread(null,20,true),0);
  assert.equal(core.nextUnread({chapter:8},20,true),9);
});
test('failed library write restores the progress and keeps unrelated state',()=>{
  const values={'lorefy.user.progress.v2':'old-progress','lorefy.user.library.v2':'old-library'};
  let calls=0;
  const storage={getItem:k=>values[k]??null,removeItem:k=>delete values[k],setItem:(k,v)=>{if(++calls===2)throw new Error('quota');values[k]=v;}};
  assert.throws(()=>core.persistReading(storage,{progress:{work:{chapter:3}},library:{work:'أقرأ حالياً'}}),/quota/);
  assert.equal(values['lorefy.user.progress.v2'],'old-progress');
  assert.equal(values['lorefy.user.library.v2'],'old-library');
});
test('verified ongoing publisher status overrides stale completed catalog status',()=>{
  assert.equal(core.isFinished({st:'مكتملة'},{status:'مستمرة'}),false);
  assert.equal(core.isFinished({st:'مستمرة'},{status:'مكتملة'}),true);
  assert.equal(core.isFinished({st:'Unknown'}),false);
});
test('quick action label follows the latest React library status',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-chapter-detail.js'),'utf8');
  const label={textContent:'تم القراءة'};
  const toolbar={querySelector:selector=>selector==='.lf-chapter-quick-add span'?label:null};
  const actions={parentNode:{querySelector:()=>toolbar},querySelector:selector=>selector==='button:first-child'?{textContent:'أقرأ حالياً'}:null};
  const scope={};const start=source.indexOf('  function enhanceActions(');
  vm.runInNewContext(source.slice(start,source.indexOf('  function enhance()',start)),scope);
  scope.enhanceActions(actions);assert.equal(label.textContent,'أقرأ حالياً');
});
