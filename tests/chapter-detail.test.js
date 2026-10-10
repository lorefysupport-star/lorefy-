const test = require('node:test');
const assert = require('node:assert/strict');
const chapters = require('../modules/lorefy-chapter-detail-core.js');
const fs = require('node:fs');
const path = require('node:path');

test('uses verified chapter totals and never invents a count', () => {
  assert.equal(chapters.total({ ch: 0 }, 'Gotouge · 207 فصل'), 207);
  assert.equal(chapters.total({ chapters: 90 }, ''), 90);
  assert.equal(chapters.total({ ch: 0 }, '2016 · manga'), 0);
  assert.equal(chapters.total({ chapters: 90 }, '100 فصل'), 100);
});

test('chapter ranges are bounded and jumping picks the containing group', () => {
  assert.deepEqual(chapters.range(207, 1), { start: 1, end: 10 });
  assert.deepEqual(chapters.range(207, 11), { start: 11, end: 20 });
  assert.deepEqual(chapters.range(207, 204), { start: 201, end: 207 });
  assert.deepEqual(chapters.range(0, 5), { start: 0, end: 0 });
  assert.equal(chapters.validChapter(208, 207), false);
  assert.equal(chapters.validChapter(42, 0), true);
});

test('chapter review replaces its own slot and preserves other chapters and works', () => {
  const before = { one: { 1: { rating: 2, comment: 'old' }, 2: { rating: 5, comment: '' } }, two: { 1: { rating: 3 } } };
  const next = chapters.save(before, 'one', 1, 4, 'new', true, 1000, 207);
  assert.deepEqual(next.one['1'], { rating: 4, comment: 'new', spoiler: true, updatedAt: 1000 });
  assert.equal(next.one['2'].rating, 5);
  assert.equal(next.two['1'].rating, 3);
  assert.equal(before.one['1'].comment, 'old');
  assert.equal(chapters.save(before, 'one', 208, 4, '', false, 1000, 207), null);
  assert.equal(chapters.save(before, 'one', 1, 0, '', false, 1000, 207), null);
});

test('unknown totals show only chapters the reader has actually saved', () => {
  assert.deepEqual(chapters.knownChapters({ 12: { rating: 4 }, 3: { comment: 'note' }, bad: {} }), [3, 12]);
  assert.deepEqual(chapters.knownChapters({}), []);
});

test('verified chapter indexes render only sourced numbers in the current range', () => {
  assert.deepEqual(chapters.visibleChapters(502, 500, [1, 500, 501, 502], {}), [500]);
  assert.deepEqual(chapters.visibleChapters(502, 501, [1, 500, 501, 502], {}), [501, 502]);
  assert.deepEqual(chapters.visibleChapters(12, 11, null, {}), [11, 12]);
  assert.deepEqual(chapters.visibleChapters(0, 1, null, { 3: { rating: 4 } }), [3]);
});

test('the chapter page loads missing catalogs and offers retry without clearing saved reviews', () => {
  const source = fs.readFileSync(path.join(__dirname, '../modules/lorefy-chapter-detail.js'), 'utf8');
  assert.match(source, /metadata\.loadCatalog\(/);
  assert.match(source, /LorefyChapterData/);
  assert.match(source, /core\.visibleChapters\(/);
  assert.match(source, /lf-chapter-retry/);
  assert.match(source, /section\.isConnected/);
});

test('return shortcut targets the most recently saved valid chapter', () => {
  assert.equal(chapters.latestReviewChapter({ 1: { rating: 3, updatedAt: 100 }, 12: { comment: 'note', updatedAt: 400 }, 4: { rating: 5, updatedAt: 300 } }, 20), 12);
  assert.equal(chapters.latestReviewChapter({ 1: { rating: 3, updatedAt: 100 }, 12: { rating: 5, updatedAt: 400 } }, 5), 1);
  assert.equal(chapters.latestReviewChapter({ bad: { updatedAt: 999 } }, 20), 0);
});

test('direct chapter jump is an accessible secondary control', () => {
  const root = path.join(__dirname, '..');
  const detail = fs.readFileSync(path.join(root, 'modules/lorefy-chapter-detail.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles/lorefy-chapter-detail.css'), 'utf8');
  assert.match(detail, /lf-chapter-jump-toggle/);
  assert.match(detail, /aria-expanded/);
  assert.match(detail, /jump\.hidden/);
  assert.match(css, /\.lf-chapter-jump\[hidden\]/);
});

test('detail action bar accepts a review action that mounts after its first render', () => {
  const root = path.join(__dirname, '..');
  const detail = fs.readFileSync(path.join(root, 'modules/lorefy-chapter-detail.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles/lorefy-chapter-detail.css'), 'utf8');
  assert.match(detail, /if \(toolbar\) \{\s*if \(reviewTarget && !toolbar\.querySelector\('\.lf-chapter-quick-review'\)\) addReview\(toolbar, reviewTarget\)/);
  assert.match(detail, /toolbar\.insertBefore\(review, toolbar\.querySelector\('\.lf-chapter-more'\)\)/);
  assert.match(css, /\.lf-chapter-quick-actions:not\(:has\(\.lf-chapter-quick-review\)\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\) 44px/s);
});
