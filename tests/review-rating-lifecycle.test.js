const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
function model(current=true){
  const start=source.indexOf('function lorefyReviewAutoRating(');
  assert.ok(start>=0,'rating policy must distinguish restore from a reader edit');
  const scope={lorefyReviewEditorCurrent:()=>current};
  vm.runInNewContext(source.slice(start,source.indexOf('function lorefyProfileEditorCurrent(',start)),scope);
  return scope.lorefyReviewAutoRating;
}
const details={story:4.5,art:5,chars:4.75,world:4.75};
test('restoring a saved review does not overwrite its manual score with detailed averages',()=>{
  const editor={};assert.equal(model()(editor,{current:editor},{id:'work'},details),null);
});
test('editing detailed scores computes a quarter average once',()=>{
  const editor={metricEdited:true},average=model();
  assert.equal(average(editor,{current:editor},{id:'work'},details),4.75);
  assert.equal(editor.metricEdited,false);
  assert.equal(average(editor,{current:editor},{id:'work'},details),null);
});
test('the previous overall score is not averaged back into the four detail fields',()=>{
  assert.equal(model()({metricEdited:true},{},{},{story:4,art:4,chars:4,world:4,overall:5}),4);
});
test('partial or invalid detail values cannot erase a manual score',()=>{
  const average=model();for(const invalid of [0,NaN,Infinity,6,-1]){
    assert.equal(average({metricEdited:true},{},{},{...details,art:invalid}),null);
  }
});
test('an obsolete editor cannot trigger or consume an active rating calculation',()=>{
  const editor={metricEdited:true};assert.equal(model(false)(editor,{},{},details),null);assert.equal(editor.metricEdited,true);
});
test('explicit overall interaction cancels pending auto calculation and details opt in',()=>{
  assert.match(source,/onRating:guard\(value=>\{editor\.metricEdited=false;dt\(value\)\}\)/);
  assert.match(source,/onMetric:guard\(\(key,value\)=>\{editor\.metricEdited=true;/);
  assert.match(source,/lorefyReviewAutoRating\(reviewEditor\.current,reviewEditor,m,ze\)/);
});
