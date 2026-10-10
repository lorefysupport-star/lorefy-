const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=()=>fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
test('legacy Paused stays valid while Dropped is a separate persisted status',()=>{
  const s=source(),start=s.indexOf('STATUS_READING='),end=s.indexOf(',hasAnyText=',start);
  const context={};vm.runInNewContext('const '+s.slice(start,end)+';this.statuses=STATUS_OPTIONS;this.paused=STATUS_PAUSED;this.dropped=STATUS_DROPPED;',context);
  assert.equal(context.paused,'توقف');
  assert.equal(context.dropped,'توقف نهائي');
  assert.equal(context.statuses.length,5);
  assert.notEqual(context.paused,context.dropped);
});
test('library and profile expose separate Dropped filters',()=>{
  assert.match(source(),/\[STATUS_DROPPED,/);
  assert.match(source(),/\{k:STATUS_DROPPED,l:/);
});
test('dropped works are a negative taste signal rather than a positive fallback',()=>{
  assert.ok(source().includes('u===STATUS_DROPPED?-70'));
});
test('imported Dropped and Paused lists retain separate meanings',()=>{
  const s=fs.readFileSync(path.join(__dirname,'../modules/lorefy-growth-features.js'),'utf8');
  const scope={IM_READING:'reading',IM_DONE:'done',IM_WISH:'later',IM_PAUSED:'paused',IM_DROPPED:'dropped'};
  const start=s.indexOf('  function imStatusFromAL(');
  vm.runInNewContext(s.slice(start,s.indexOf('  function imFetchAniList(',start)),scope);
  const at=s.indexOf('  function imStatusWord(');
  vm.runInNewContext(s.slice(at,s.indexOf('  /* generic CSV:',at)),scope);
  assert.equal(scope.imStatusFromAL('DROPPED'),'dropped');
  assert.equal(scope.imStatusFromAL('PAUSED'),'paused');
  assert.equal(scope.imStatusWord('abandoned'),'dropped');
  assert.equal(scope.imStatusWord('on-hold'),'paused');
});
