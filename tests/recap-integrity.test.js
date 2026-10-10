const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
test('zero-reading weeks have zero-height bars',()=>{
  const start=source.indexOf('  function wrBuildTimeline('),end=source.indexOf('  wrStats =',start);
  const scope={el:(tag,attrs,children)=>({tag,attrs,children,appendChild(node){(this.children||=[]).push(node);}}),wrNumber:String};
  vm.runInNewContext(source.slice(start,end),scope);
  const bars=scope.wrBuildTimeline([{label:'one',total:0},{label:'two',total:20}]).children;
  assert.equal(bars[0].children[0].attrs.style,'height:0%');
  assert.equal(bars[1].children[0].attrs.style,'height:100%');
});
test('annual target is explicitly saved, never inferred from completed chapters',()=>{
  assert.doesNotMatch(source,/Math\.ceil\(Math\.max\(chYear/);
  assert.match(source,/lorefy\.user\.readingGoal\.v1/);
});
