const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const metrics = require('../modules/lorefy-reading-metrics');
const source = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');

test('review-only hydration cannot create a completed library entry or catalog checkpoint', () => {
  for (const reviewIds of [['rated'], ['legacy', 'rated', 'rated']]) {
    const library = {}, progressById = {};
    const after = metrics.seedReviewedWorks(library, reviewIds, {}, 'تم القراءة');
    const initialized = metrics.initializeCompletedProgress({ library: after, progressById, getWork: () => ({ ch: 420, pages: 600 }) });
    assert.equal(after, library);
    assert.deepEqual(after, {});
    assert.equal(initialized.progressById, progressById);
    assert.deepEqual(initialized.changedIds, []);
  }
});

test('legacy review reconciliation preserves existing historical completions and explicit zero', () => {
  const library = { historical: 'تم القراءة', paused: 'توقف' }, progressById = { historical: { chapter: 0, note: 'saved' } };
  const after = metrics.seedReviewedWorks(library, ['historical', 'paused', 'review-only'], {}, 'تم القراءة');
  assert.equal(after, library);
  assert.deepEqual(after, { historical: 'تم القراءة', paused: 'توقف' });
  const initialized = metrics.initializeCompletedProgress({ library: after, progressById, getWork: () => ({ ch: 500 }) });
  assert.equal(initialized.progressById, progressById);
});

function deletion(status, fail = false) {
  const library = { work: status, other: 'أقرأ حالياً' };
  const progress = { work: { chapter: 0, page: 42, volume: 2, note: 'Keep this' }, other: { chapter: 5 } };
  let reviews = [{ id: 'own-review', mid: 'work', userId: 'me', r: 4 }, { id: 'other-review', mid: 'work', userId: 'other', r: 5 }];
  let comments = { 'own-review': ['reply'], 'other-review': ['keep'] }, active = 'own-review';
  const messages = [], values = new Map([['lorefy.activeUser.v1', 'owner']]);
  const scope = {
    window: { localStorage: { getItem: key => values.get(key) || null },
      LorefyBackend: { mode: 'live', user: { id: 'owner' }, deleteReview: async () => { if (fail) throw Error('Offline'); } }, dispatchEvent() {} },
    CustomEvent: class {}, fo: update => { reviews = update(reviews); },
    Io: update => { comments = update(comments); }, It: update => { active = update(active); },
    ve: null, A: (...args) => messages.push(args),
    j() { throw Error('Review deletion must not write library'); },
    Ee() { throw Error('Review deletion must not write progress'); },
    $() { throw Error('Review deletion must not write removal markers'); }
  };
  vm.createContext(scope);
  const guard = source.indexOf('function lorefyReviewRequestScope(');
  vm.runInContext(source.slice(guard, source.indexOf('const{useState', guard)), scope);
  const start = source.indexOf('qo=async t=>');
  vm.runInContext('const ' + source.slice(start, source.indexOf(',or=()=>', start)) + ';this.remove=qo;', scope);
  return { run: () => scope.remove('own-review'), state: () => JSON.parse(JSON.stringify({ library, progress, reviews, comments, active, messages })) };
}

for (const status of ['أقرأ حالياً', 'قائمة الأمنيات', 'توقف', 'توقف نهائي', 'تم القراءة']) {
  test('deleting only a review retains library status and exact checkpoint: ' + status, async () => {
    const h = deletion(status), before = h.state(); await h.run(); const after = h.state();
    assert.deepEqual(after.library, before.library); assert.deepEqual(after.progress, before.progress);
    assert.deepEqual(after.reviews.map(review => review.id), ['other-review']);
    assert.deepEqual(after.comments, { 'other-review': ['keep'] }); assert.equal(after.active, null);
    assert.equal(metrics.seedReviewedWorks(after.library, [], {}, 'تم القراءة').work, status);
  });
}

test('failed deletion preserves the review and reading state for retry', async () => {
  const h = deletion('أقرأ حالياً', true), before = h.state(); await h.run(); const after = h.state();
  assert.deepEqual({ ...after, messages: [] }, before);
  assert.equal(after.messages[0][1], 'err');
});
