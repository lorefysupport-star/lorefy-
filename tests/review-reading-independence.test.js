const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const metrics = require('../modules/lorefy-reading-metrics');
const source = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');

function harness(status, saved = {chapter:12,page:30,volume:1,note:'My checkpoint'}) {
  let library = {work:status}, progress = {work:{...saved}}, removed = {}, reviews = [];
  const calls = [], scope = {
    m:{id:'work',title:'A work',ch:420}, G:4, J:'Reader', Y:'reader', Z:'', Fe:'yes', se:false,
    ct:{current:'My review'}, pt:{current:'My moment'}, ft:[], ze:{story:4}, gt:false,
    STATUS_DONE:'تم القراءة', window:{LorefyReadingMetrics:metrics,
      dispatchEvent:()=>calls.push('refresh'), LorefyBackend:{mode:'demo'}},
    CustomEvent:class {}, workChapterCount:()=>420, workVolumeCount:()=>40, workPageCount:()=>0,
    $:update=>{removed=update(removed);}, j:update=>{library=update(library);},
    Ee:update=>{progress=update(progress);}, fo:update=>{reviews=update(reviews);},
    A:()=>calls.push('error'), ht(){}, Wo(){}, bo(){}, setTimeout(){}, Se(){}, dt(){}, no(){}, ro(){}, io(){}
  };
  vm.createContext(scope);
  const completion = source.slice(source.indexOf('Zn=t=>'), source.indexOf(';useEffect(',source.indexOf('Zn=t=>')));
  const start = source.indexOf('tr=async()=>');
  vm.runInContext('const '+completion+';const '+source.slice(start,source.indexOf(',qo=async',start))+';this.publish=tr;',scope);
  return {scope,calls, state:()=>JSON.parse(JSON.stringify({library,progress,removed,reviews})),
    reconcile() { library=metrics.seedReviewedWorks(library,reviews.map(review=>review.mid),removed,'تم القراءة'); }};
}

for (const status of ['أقرأ حالياً','قائمة الأمنيات','توقف','توقف نهائي','تم القراءة']) {
  test('publishing a rating preserves explicit library state and checkpoint: '+status, async () => {
    const h=harness(status), before=h.state();
    await h.scope.publish(); h.reconcile();
    const after=h.state();
    assert.equal(after.reviews.length,1);
    assert.equal(after.reviews[0].r,4);
    assert.deepEqual(after.library,before.library);
    assert.deepEqual(after.progress,before.progress);
    assert.deepEqual(after.removed,before.removed);
  });
}

test('publishing a review preserves an explicit zero instead of capturing provider totals', async () => {
  const h=harness('أقرأ حالياً',{chapter:0,ch:80,note:'Start here'}), before=h.state();
  await h.scope.publish(); h.reconcile();
  assert.deepEqual(h.state().progress,before.progress);
  assert.equal(h.state().library.work,'أقرأ حالياً');
});

test('failed publication keeps the review draft, status and progress for retry', async () => {
  const h=harness('توقف'), before=h.state();
  h.scope.window.LorefyBackend={mode:'live',publishReview:async()=>{throw Error('Offline');}};
  assert.equal(await h.scope.publish(),false);
  assert.deepEqual(h.state(),before);
  assert.equal(h.scope.ct.current,'My review');
  assert.equal(h.scope.pt.current,'My moment');
  assert.deepEqual(h.calls,['error']);
});
