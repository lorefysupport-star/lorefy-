const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function loadBookTokLibrary() {
  const source = fs.readFileSync(path.join(root, 'uploads', 'lorefy-booktok-library.js'), 'utf8');
  const sandbox = { window: { LorefyMangaData: [] } };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-booktok-library.js' });
  return { records: sandbox.window.LorefyMangaData, summary: sandbox.window.LorefyBookTokLibrary };
}

test('BookTok library ships a curated current-trends shelf with usable records', () => {
  const { records, summary } = loadBookTokLibrary();
  assert.equal(summary.schema, 1);
  assert.ok(records.length >= 30, `expected at least 30 BookTok works, got ${records.length}`);
  assert.ok(records.every((work) => work.id.startsWith('lorefy-booktok-')));
  assert.ok(records.every((work) => work.type === 'رواية'));
  assert.ok(records.every((work) => work._apiDynamic === true));
  assert.ok(records.every((work) => Array.isArray(work.tags) && work.tags.includes('BookTok')));
  assert.ok(records.every((work) => work.r >= 0 && work.r <= 5 && work.baseRatings === 0));
  assert.ok(records.every((work) => work.rSrc === 'اختيار BookTok'));
  assert.equal(new Set(records.map((work) => work.id)).size, records.length);
  for (const title of ['Daggermouth', 'Alchemised', 'The Housemaid', 'Fourth Wing', 'The Song of Achilles']) {
    assert.ok(records.some((work) => work.title === title), `missing BookTok title: ${title}`);
  }
});

test('BookTok library loads before catalog identity and is included in the offline shell', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const booktokAt = index.indexOf('uploads/lorefy-booktok-library.js');
  const identityAt = index.indexOf('modules/lorefy-catalog-identity.js');
  assert.ok(booktokAt > 0 && booktokAt < identityAt);
  const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(serviceWorker, /uploads\/lorefy-booktok-library\.js/);
});
