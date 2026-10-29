const test=require('node:test');
const assert=require('node:assert/strict');
const {harness:pickerHarness,flush}=require('./helpers/character-image-picker.js');

function harness(lang,loader){
  return pickerHarness({lang,loader}).open();
}

test('English image-picker chrome and choices are localized on first render',async()=>{
  const picker=harness('en',async()=>['https://example.com/current.jpg','https://example.com/other.jpg']);
  assert.equal(picker.attrs['aria-label'],'Choose character image');
  await flush();
  assert.doesNotMatch(picker.textContent,/[\u0600-\u06ff]/);
  for(const text of ['Edit character image','Automatic image','Upload image','Current','From source'])assert.ok(picker.textContent.includes(text),text);
  assert.equal(picker.querySelector('.lf-image-choice-close').attrs['aria-label'],'Close');
});

test('Arabic image-picker keeps localized chrome and the original character name',async()=>{
  const picker=harness('ar',async()=>[]);await flush();
  assert.equal(picker.attrs['aria-label'],'اختيار صورة شخصية');
  for(const text of ['تعديل صورة الشخصية','الصورة التلقائية','رفع صورة','الحالية','Hero'])assert.ok(picker.textContent.includes(text),text);
});

test('English missing provider, failure and empty result messages stay distinct',async()=>{
  const unavailable=harness('en',null);assert.match(unavailable.textContent,/unavailable/i);
  const failed=harness('en',async()=>{throw Error('offline');});await flush();assert.match(failed.textContent,/Could not load/i);
  const empty=harness('en',async()=>[]);await flush();assert.match(empty.textContent,/No alternative images/i);
  for(const picker of [unavailable,failed,empty])assert.doesNotMatch(picker.textContent,/[\u0600-\u06ff]/);
});
