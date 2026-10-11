const test = require('node:test');
const assert = require('node:assert/strict');
const metrics = require('../modules/lorefy-reading-metrics.js');

test('catalog enrichment never rewrites saved reading totals', () => {
  const options = {library:{a:'completed'}, progressById:{a:{chapter:23}}};
  const baseline = metrics.calculateReadingMetrics(options);
  for (const ch of [0,420,421,900]) {
    assert.deepEqual(metrics.calculateReadingMetrics({...options,getWork:()=>({ch})}), baseline);
    assert.equal(metrics.effectiveProgress({ch},{chapter:23},'completed').chapter,23);
  }
});

test('a completion captures totals once and legacy initialization is idempotent', () => {
  const snapshot = metrics.completionCheckpoint({ch:420,vol:38},{chapter:23,note:'saved'});
  assert.deepEqual(snapshot,{chapter:420,volume:38,page:0,note:'saved'});
  const options = {library:{a:'completed',b:'completed',c:'reading'},progressById:{b:{chapter:23}},getWork:()=>({ch:420})};
  const first = metrics.initializeCompletedProgress(options);
  assert.equal(first.progressById.a.chapter,420);
  assert.equal(first.progressById.b.chapter,23);
  assert.equal(first.progressById.c,undefined);
  const next = metrics.initializeCompletedProgress({...options,progressById:JSON.parse(JSON.stringify(first.progressById)),getWork:()=>({ch:900})});
  assert.deepEqual(next.changedIds,[]);
  assert.deepEqual(next.progressById,first.progressById);
});

test('legacy initialization waits for missing totals and preserves explicit zero', () => {
  const options = {library:{a:'completed',b:'completed'},progressById:{b:{chapter:0}},getWork:()=>null};
  const pending = metrics.initializeCompletedProgress(options);
  assert.deepEqual(pending.pendingIds,['a']);
  assert.deepEqual(pending.changedIds,[]);
  const ready = metrics.initializeCompletedProgress({...options,getWork:()=>({ch:100})});
  assert.deepEqual(ready.changedIds,['a']);
  assert.equal(ready.progressById.b.chapter,0);
});

test('legacy cleanup never deletes a saved completion checkpoint', () => {
  const progressById = {a:{chapter:420,volume:38}};
  const result = metrics.sanitizeLegacyProgress({library:{a:'completed'},progressById,getWork:()=>({ch:420,vol:38}),completedStatus:'completed'});
  assert.deepEqual(result.removedIds,[]);
  assert.deepEqual(result.progressById,progressById);
});

test('non-finite progress cannot poison profile counters', () => {
  assert.deepEqual(metrics.normalizeProgress({chapter:Infinity,page:NaN,volume:-2}),{chapter:0,page:0,volume:0,note:''});
  assert.equal(metrics.normalizeProgress(Infinity).chapter,0);
});
