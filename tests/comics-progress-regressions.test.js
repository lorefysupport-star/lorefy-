const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const identity = require('../modules/lorefy-catalog-identity.js');

test('comic issues group by run while unrelated same-title works keep separate identities', () => {
  const works = [
    { id: 'dc-batman-14', title: 'Batman (2016-) #14', type: 'Comics', auth: 'Tom King', yr: 2017 },
    { id: 'dc-batman-15', title: 'Batman Issue 15', type: 'كوميكس', auth: 'Tom King', yr: 2017 },
    { id: 'ol-batman', title: 'Batman', type: 'كوميكس', auth: 'Bob Kane', yr: 1940 },
    { id: 'ol-batman-1988', title: 'Batman', type: 'كوميكس', auth: 'Alan Moore', yr: 1988 },
    { id: 'ol-batman-gothic', title: 'Batman Gothic', type: 'كوميكس', auth: 'Grant Morrison', yr: 1991 }
  ];

  assert.equal(identity.canonicalWorkKey(works[0].title), 'batman');
  assert.equal(identity.canonicalWorkKey(works[1].title), 'batman');

  const report = identity.organizeCatalog(works, { aliases: {} });

  assert.equal(report.after, 4);
  const batman = works.find((work) => work.id === 'dc-batman-14' || work.id === 'dc-batman-15');
  assert.ok(batman);
  assert.equal(batman._catalogEditions.length, 2);
  assert.deepEqual(
    batman._catalogEditions.map((edition) => edition.id).sort(),
    ['dc-batman-14', 'dc-batman-15']
  );
  assert.ok(works.some((work) => work.id === 'ol-batman'));
  assert.ok(works.some((work) => work.id === 'ol-batman-1988'));
  assert.ok(works.some((work) => work.title === 'Batman Gothic'));
});

test('the background catalog worker uses the current identity implementation', () => {
  const worker = fs.readFileSync(path.join(root, 'modules', 'lorefy-catalog-worker.js'), 'utf8');
  const loader = fs.readFileSync(path.join(root, 'modules', 'lorefy-catalog-loader.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const identityVersion = html.match(/modules\/lorefy-catalog-identity\.js\?v=([^" ]+)/)[1];
  assert.ok(worker.includes('lorefy-catalog-identity.js?v=' + identityVersion));
  const loaderVersion = html.match(/modules\/lorefy-catalog-loader\.js\?v=([^" ]+)/)[1];
  assert.ok(loader.includes('var version = "' + loaderVersion + '"'));
});

test('comic search keeps different Batman runs separate despite matching titles', () => {
  const search = require('../modules/lorefy-comics-search.js');
  const works = [
    { id: 'batman-moore', title: 'Batman', type: 'كوميكس', auth: 'Alan Moore', yr: 1988 },
    { id: 'batman-gothic', title: 'Batman Gothic', type: 'كوميكس', auth: 'Grant Morrison', yr: 1991 },
    { id: 'batman-starlin', title: 'Batman', type: 'كوميكس', auth: 'Jim Starlin', yr: 1988 }
  ];
  const grouped = search.groupResults(works);
  assert.equal(grouped.length, 3);
  assert.equal(grouped[0]._searchAlternates, undefined);
  assert.equal(grouped[1].id, 'batman-gothic');
  assert.equal(works[0]._searchAlternates, undefined);
  assert.match(fs.readFileSync(path.join(root, 'uploads', 'files', 'lorefy-app.js'), 'utf8'), /LorefyComicsSearch\.groupResults/);
});

test('Open Library edition count is metadata, not a comic volume count', () => {
  const source = fs.readFileSync(path.join(root, 'modules', 'lorefy-api-catalog.js'), 'utf8');
  const listeners = {};
  const sandbox = {
    window: {
      LorefyMangaData: [],
      LOREFY_REMOTE_CATALOG: { enabled: false },
      localStorage: { getItem: () => null, setItem: () => {} },
      document: { readyState: 'loading', addEventListener: (name, fn) => { listeners[name] = fn; } },
      addEventListener: () => {},
      setTimeout,
      clearTimeout,
      URL,
      Promise
    }
  };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(source, sandbox, { filename: 'lorefy-api-catalog.js' });

  assert.equal(typeof sandbox.window.LorefyApiCatalog.mapOpenLibrary, 'function');
  const mapped = sandbox.window.LorefyApiCatalog.mapOpenLibrary({
    key: '/works/OL1W',
    title: 'Batman',
    author_name: ['Bob Kane'],
    first_publish_year: 1940,
    edition_count: 37
  }, 'كوميكس');

  assert.equal(mapped.vol, 0);
  assert.equal(mapped.editionCount, 37);
});

test('reading totals infer completed works and preserve explicit partial progress', () => {
  const modulePath = path.join(root, 'modules', 'lorefy-reading-metrics.js');
  assert.ok(fs.existsSync(modulePath), 'missing explicit reading metrics module');
  const metrics = require(modulePath);
  const works = {
    batman: { id: 'batman', ch: 220, vol: 30 },
    berserk: { id: 'berserk', ch: 380, vol: 42 },
    hunter: { id: 'hunter', ch: 400, vol: 38 }
  };
  const library = {
    batman: 'تمت القراءة',
    berserk: 'أقرأ حالياً',
    hunter: 'قائمة الأمنيات'
  };

  assert.deepEqual(metrics.calculateReadingMetrics({
    library,
    progressById: {},
    getWork: (id) => works[id]
  }), {
    chapters: 220,
    pages: 0,
    volumes: 30,
    minutes: 2640,
    hours: 44
  });

  assert.deepEqual(metrics.calculateReadingMetrics({
    library: {...library,batman:'أقرأ حالياً'},
    progressById: {
      batman: { chapter: 7, volume: 1 },
      berserk: { chapter: 2, page: 18 }
    },
    getWork: (id) => works[id]
  }), {
    chapters: 9,
    pages: 18,
    volumes: 1,
    minutes: 108,
    hours: 2
  });
});

test('legacy auto-completed progress is removed without touching real partial progress', () => {
  const metrics = require('../modules/lorefy-reading-metrics.js');
  const works = {
    batman: { id: 'batman', ch: 220, vol: 30 },
    berserk: { id: 'berserk', ch: 380, vol: 42 },
    hunter: { id: 'hunter', ch: 400, vol: 38 }
  };
  const result = metrics.sanitizeLegacyProgress({
    library: {
      batman: 'تمت القراءة',
      berserk: 'تمت القراءة',
      hunter: 'تمت القراءة'
    },
    progressById: {
      batman: { chapter: 220, volume: 30 },
      berserk: { chapter: 25, volume: 2 },
      hunter: { chapter: 400, volume: 38, note: 'أنهيته فعلاً' }
    },
    getWork: (id) => works[id],
    completedStatus: 'تمت القراءة'
  });

  assert.deepEqual(result.removedIds, ['batman']);
  assert.deepEqual(result.progressById.berserk, { chapter: 25, volume: 2 });
  assert.equal(result.progressById.hunter.note, 'أنهيته فعلاً');
  assert.equal(result.progressById.batman, undefined);
});

test('legacy progress migration waits for unloaded completed works', () => {
  const metrics = require('../modules/lorefy-reading-metrics.js');
  const result = metrics.sanitizeLegacyProgress({
    library: { batman: 'تم القراءة', berserk: 'تم القراءة' },
    progressById: { batman: { chapter: 50 }, berserk: { chapter: 12 } },
    getWork: (id) => id === 'berserk' ? { ch: 200 } : null,
    completedStatus: 'تم القراءة'
  });
  assert.deepEqual(result.pendingIds, ['batman']);
  assert.deepEqual(result.progressById.batman, { chapter: 50 });
  assert.deepEqual(result.progressById.berserk, { chapter: 12 });
  const unknownTotal = metrics.sanitizeLegacyProgress({
    library: { bleach: 'تم القراءة' },
    progressById: { bleach: { chapter: 706 } },
    getWork: () => ({ ch: 0, vol: 0 }),
    completedStatus: 'تم القراءة'
  });
  assert.deepEqual(unknownTotal.pendingIds, ['bleach']);
  const app = fs.readFileSync(path.join(root, 'uploads', 'files', 'lorefy-app.js'), 'utf8');
  assert.match(app, /sanitizeLegacyProgress.*lorefy:catalog-ingested/);
  assert.match(app, /lorefy\.progress\.explicit-v6/);
  assert.match(app, /sanitizeLegacyProgress\(\{library:b,progressById:r,getWork:.*workChapterCount/);
});

test('the app does not synthesize completed progress from catalog totals', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'uploads', 'files', 'lorefy-app.js'), 'utf8');

  assert.match(index, /modules\/lorefy-reading-metrics\.js/);
  assert.match(app, /LorefyReadingMetrics\.calculateReadingMetrics/);
  assert.match(app, /LorefyReadingMetrics\.sanitizeLegacyProgress/);
  assert.doesNotMatch(app, /completedProgressFor\(t,r\[t\.id\]\)/);
  assert.doesNotMatch(app, /Math\.max\(s\.chapter,completedFallbackChapterCount\(n\)\)/);
});
