const test = require('node:test');
const assert = require('node:assert/strict');
const metrics = require('../modules/lorefy-reading-metrics.js');

test('completed progress shown in detail agrees with calculated totals', () => {
  const work = { ch: 420, vol: 38 };
  assert.deepEqual(metrics.effectiveProgress(work, {}, 'تمت القراءة'), { chapter: 420, volume: 38, page: 0, note: '' });
  assert.equal(metrics.effectiveProgress(work, { chapter: 23 }, 'completed').chapter, 420);
});

test('in-progress work keeps the actual stopping point and notes', () => {
  const work = { ch: 420 };
  assert.deepEqual(metrics.effectiveProgress(work, { chapter: 23, note: 'saved' }, 'reading'), { chapter: 23, volume: 0, page: 0, note: 'saved' });
  assert.equal(metrics.effectiveProgress({}, { chapter: 23 }, 'completed').chapter, 23);
});
