const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const metrics = require('../modules/lorefy-reading-metrics.js');

test('only an explicit checkpoint increase contributes reading history', () => {
  assert.equal(metrics.checkpointChapterDelta({ chapter: 4 }, { chapter: 9 }), 5);
  assert.equal(metrics.checkpointChapterDelta({ chapter: 9 }, { chapter: 4 }), 0);
  assert.equal(metrics.checkpointChapterDelta(null, { chapter: 7 }), 7);
});

test('saved progress remains countable while catalog metadata is unavailable', () => {
  const result = metrics.calculateReadingMetrics({ library: { a: 'completed' }, progressById: { a: { chapter: 10 } } });
  assert.equal(result.chapters, 10);
  assert.equal(result.hours, 2);
});

test('rendering metrics and removing a library item never rewrite historical reading', () => {
  const source = fs.readFileSync(require('node:path').join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  assert.ok(!source.includes('const t=ce-Qe.current'));
  assert.ok(!source.includes('Mo(d=>subtractReadLogChapters(d,s))'));
  assert.ok(source.includes('getTotals:work=>({ch:workChapterCount(work)'));
  assert.ok(source.includes('checkpointChapterDelta(le[E.id],saved)'));
  assert.ok(source.includes('[E.id]:saved'));
});
