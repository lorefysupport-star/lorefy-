const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function loadArabicLibrary() {
  const source = fs.readFileSync(path.join(root, 'uploads', 'lorefy-arabic-library.js'), 'utf8');
  const sandbox = { window: { LorefyMangaData: [] } };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-arabic-library.js' });
  return { records: sandbox.window.LorefyMangaData, summary: sandbox.window.LorefyArabicLibrary };
}

test('Arabic library expansion provides a substantial, searchable local catalog', () => {
  const { records, summary } = loadArabicLibrary();
  assert.equal(summary.schema, 1);
  assert.ok(records.length >= 500, `expected at least 500 Arabic works, got ${records.length}`);
  assert.ok(records.every((work) => /^(?:ol-ar-|lorefy-ar-curated-)/.test(work.id)));
  assert.ok(records.every((work) => /[\u0600-\u06ff]/.test(`${work.title} ${work.auth || ''}`)));
  assert.ok(records.every((work) => ['كتاب', 'رواية'].includes(work.type)));
  assert.ok(records.every((work) => Array.isArray(work.tags) && work.tags.includes('عربي')));
  assert.ok(records.every((work) => work._apiDynamic === true));
  assert.equal(new Set(records.map((work) => work.id)).size, records.length);
  for (const title of ['صحيح البخاري', 'صحيح مسلم', 'رياض الصالحين', 'بين القصرين', 'موسم الهجرة إلى الشمال']) {
    assert.ok(records.some((work) => work.title === title), `missing curated title: ${title}`);
  }
});

test('Arabic religious books are explicitly classified without relying on title matching alone', () => {
  const { records } = loadArabicLibrary();
  const religious = records.filter((work) => work.tags.includes('إسلامي'));
  assert.ok(religious.length >= 250, `expected at least 250 religious Arabic books, got ${religious.length}`);
  assert.ok(religious.every((work) => work.type === 'كتاب'));
  assert.ok(religious.every((work) => work.tags.includes('عربي')));
});

test('catalog quality pass removes synthetic five-star defaults before the app mounts', () => {
  const source = fs.readFileSync(path.join(root, 'uploads', 'lorefy-catalog-quality.js'), 'utf8');
  const sandbox = {
    window: {
      LorefyMangaData: [
        { id: 'ol-works-1', title: 'Popular Fictions', type: 'رواية', r: 5, pop: 3248, baseRatings: 10000 },
        { id: 'ol-works-2', title: 'Popular Fiction', type: 'رواية', r: 5, pop: 1188, baseRatings: 900 },
        { id: 'fwn-1', title: 'Verified web serial', type: 'ويب نوفل', r: 5, pop: 22000, baseRatings: 92000 },
        { id: 'curated-1', title: 'موثوق', type: 'كتاب', r: 4.4, rSrc: 'Open Library', pop: 800, baseRatings: 0 }
      ]
    }
  };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-catalog-quality.js' });
  assert.equal(sandbox.window.LorefyMangaData[0].r, 0);
  assert.equal(sandbox.window.LorefyMangaData[0].rSrc, '');
  assert.equal(sandbox.window.LorefyMangaData[0].baseRatings, 0);
  assert.equal(sandbox.window.LorefyMangaData[1].r, 0);
  assert.equal(sandbox.window.LorefyMangaData[2].r, 5);
  assert.equal(sandbox.window.LorefyMangaData[3].r, 4.4);
  assert.equal(typeof sandbox.window.LorefyCatalogQuality.apply, 'function');
});

test('the Arabic library and quality pass load before catalog identity and the React app', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const arabicAt = index.indexOf('uploads/lorefy-arabic-library.js');
  const qualityAt = index.indexOf('uploads/lorefy-catalog-quality.js');
  const identityAt = index.indexOf('modules/lorefy-catalog-identity.js');
  const appAt = index.indexOf('uploads/files/lorefy-app.js');
  assert.ok(arabicAt > 0 && arabicAt < identityAt);
  assert.ok(qualityAt > arabicAt && qualityAt < identityAt);
  assert.ok(identityAt < appAt);
  const loader = fs.readFileSync(path.join(root, 'modules', 'lorefy-catalog-loader.js'), 'utf8');
  assert.match(loader, /LorefyCatalogQuality\.apply\(global\.LorefyMangaData\)/);
});
