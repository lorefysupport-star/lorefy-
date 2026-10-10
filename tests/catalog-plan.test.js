const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRouteType,
  initialCatalogPlan,
  remainingCatalogPlan,
  allCatalogParts,
  searchIndexParts,
  shouldWaitForInteraction,
  pickFeaturedWork
} = require('../modules/lorefy-catalog-plan.js');
const { extractCatalogRecords, prepareCatalogRecords } = require('../modules/lorefy-catalog-data.js');

const manifest = {
  types: {
    Manga: [5, 6, 15, 16, 17],
    Novel: [1, 2, 3, 10, 11, 12, 14, 15],
    Book: [1, 3, 10, 11, 12, 13, 14, 17]
  },
  workParts: {
    'mal-manga-13-one-piece': 5,
    'n-pride-and-prejudice': 1
  },
  featuredParts: [5]
};

test('normalizes Arabic and English route types', () => {
  assert.equal(normalizeRouteType('مانجا'), 'Manga');
  assert.equal(normalizeRouteType('Manga'), 'Manga');
  assert.equal(normalizeRouteType('كتاب'), 'Book');
  assert.equal(normalizeRouteType('unknown'), 'Manga');
});

test('detail routes load the exact catalog part first', () => {
  assert.deepEqual(initialCatalogPlan(manifest, {
    type: 'Manga',
    workId: 'mal-manga-13-one-piece'
  }), [5]);
});

test('browse routes load only one useful part at startup', () => {
  assert.deepEqual(initialCatalogPlan(manifest, { type: 'Novel' }), [1]);
  assert.deepEqual(initialCatalogPlan(manifest, { type: 'Manga' }), [5]);
});

test('remaining plan excludes parts already loaded and preserves order', () => {
  assert.deepEqual(
    remainingCatalogPlan(manifest, 'Manga', new Set([5, 15])),
    [6, 16, 17]
  );
});

test('search index finds Arabic and English work titles without loading full records', () => {
  const searchApi = require('../modules/lorefy-catalog-data');
  const entries = [
    {part: 2, work: {id:'one-piece',title:'One Piece',ar:'ون بيس',auth:'Eiichiro Oda',type:'مانجا'}},
    {part: 3, work: {id:'other',title:'The Long Novel',ar:'',auth:'Jane Doe',type:'رواية'}},
    {part: 4, work: {id:'alias',title:'Pirate Story',ar:'',auth:'Someone',type:'مانجا',altTitles:['One Piece']}}
  ];
  assert.deepEqual(searchIndexParts(entries, 'ون بيس', 'Manga', searchApi).map(row => row.part), [2]);
  assert.deepEqual(searchIndexParts(entries, 'One Piece', 'Manga', searchApi).map(row => row.part), [2,4]);
  assert.deepEqual(searchIndexParts(entries, 'Jane Doe', 'Novel', searchApi).map(row => row.part), [3]);
  assert.deepEqual(searchIndexParts(entries, 'Jane Doe', 'Manga', searchApi), []);
});

test('explicit full-catalog plan still lists every bundled part', () => {
  assert.deepEqual(
    allCatalogParts({ partCount: 17, featuredParts: [5, 1, 5] }),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  );
});

test('interaction-window helper preserves its standalone timing contract', () => {
  assert.equal(shouldWaitForInteraction(1_000, 2_700, 1_800), true);
  assert.equal(shouldWaitForInteraction(1_000, 2_800, 1_800), false);
  assert.equal(shouldWaitForInteraction(0, 10_000, 1_800), false);
});

test('explicit full-catalog import remains available for maintenance', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-loader.js'), 'utf8');
  assert.match(source, /PART_LOAD_GAP_MS = 1600/);
  assert.match(source, /backgroundLoadInFlight/);
  assert.match(source, /if \(backgroundLoadInFlight\)/);
  assert.match(source, /loadAllInWorker\(parts\)/);
  assert.match(source, /enqueue\(parts, \{ gapMs: PART_LOAD_GAP_MS \}\)/);
  assert.match(source, /WORKER_BATCH_ACK_DELAY_MS = 12/);
  assert.match(source, /function keepDynamicRecords/);
  assert.match(source, /lorefy:catalog-ready/);
  assert.doesNotMatch(source, /planner\.shouldWaitForInteraction\(lastInteractionAt/);
  assert.match(source, /global\.setTimeout\(function \(\) \{\s*try \{ worker\.postMessage\(\{ type: "ack" \}\); \} catch/, 'worker batches yield before acknowledgement');
});

test('route updates request only the first useful type or detail part', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-loader.js'), 'utf8');
  assert.match(source, /return enqueue\(planner\.initialCatalogPlan\(manifest, route\)/);
  assert.doesNotMatch(source, /global\.setTimeout\(scheduleFullCatalog/);
});

test('worker-safe catalog extraction reads only the bundled records payload', () => {
  const fixture = [
    'window.LorefyMangaData=window.LorefyMangaData||[];',
    'Array.prototype.push.apply(window.LorefyMangaData,[{"id":"work-1","title":"A"},{"id":"work-2","title":"B"}]);'
  ].join('\n');
  assert.deepEqual(extractCatalogRecords(fixture), [
    { id: 'work-1', title: 'A' },
    { id: 'work-2', title: 'B' }
  ]);
  assert.deepEqual(extractCatalogRecords('window.LorefyMangaData=[];'), []);
});

test('worker records always retain the search fields required by the app', () => {
  const records = prepareCatalogRecords([
    { id: 'work-1', title: 'My Hero Academia', auth: 'Kohei Horikoshi', _indexed: true },
    { id: 'work-2', title: null, ar: null, auth: null }
  ]);

  assert.deepEqual(records.map((record) => ({
    id: record.id,
    _tl: record._tl,
    _al: record._al,
    ar: record.ar,
    _indexed: record._indexed
  })), [
    { id: 'work-1', _tl: 'my hero academia', _al: 'kohei horikoshi', ar: '', _indexed: false },
    { id: 'work-2', _tl: '', _al: '', ar: '', _indexed: false }
  ]);
});

test('the catalog worker canonicalizes records before returning them to the UI thread', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const worker = fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-worker.js'), 'utf8');
  const loader = fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-loader.js'), 'utf8');
  assert.match(worker, /importScripts\(\s*"lorefy-catalog-data\.js\?v=[^"]+",\s*"lorefy-catalog-identity\.js\?v=[^"]+",\s*"lorefy-catalog-policy\.js/);
  assert.match(worker, /LorefyCatalogQuality\.apply\(records\)/);
  assert.match(worker, /LorefyCatalogIdentity\.organizeCatalog\(records, \{ aliases: aliases \}\)/);
  assert.match(worker, /LorefyCatalogData\.prepareCatalogRecords\(records\)/);
  assert.match(loader, /workerCatalogReady/);
  assert.match(loader, /if \(!workerCatalogReady && global\.LorefyCatalogIdentity/);
});

test('explicit full-catalog canonicalization preserves the route bootstrap part', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const loader = fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-loader.js'), 'utf8');
  assert.match(loader, /var parts = planner\.allCatalogParts\(manifest\);/);
  assert.doesNotMatch(loader, /allCatalogParts\(manifest\)\.filter\(function \(part\) \{ return !loaded\.has\(part\); \}\)/);
  assert.match(loader, /workerStagedRecords/);
  assert.match(loader, /keepDynamicRecords\(workerStagedRecords, global\.LorefyMangaData\)/);
  assert.doesNotMatch(loader, /Array\.prototype\.push\.apply\(global\.LorefyMangaData, message\.records\)/);
});

test('catalog ingest is cooperative once the React app has mounted', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const app = fs.readFileSync(path.join(__dirname, '..', 'uploads', 'files', 'lorefy-app.js'), 'utf8');
  assert.match(app, /__lorefyIngestRunning/);
  assert.match(app, /__lorefyIdle/);
  assert.match(app, /h<260/);
  assert.match(app, /Date\.now\(\)-d<9/);
  assert.match(app, /window\.__lorefyIngestAsync=!0/);
});

test('featured work selection is safe when catalog loading fails', () => {
  const work = { id: 'one-piece' };
  assert.equal(pickFeaturedWork([], [], [], [], []), null);
  assert.equal(pickFeaturedWork([work], [], [], [], []), work);
  assert.equal(pickFeaturedWork([], [work], [], [], []), work);
});

test('offline shell precaches the first useful catalog part', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  const core = source.slice(source.indexOf('const CORE'), source.indexOf('const CATALOG'));
  assert.match(core, /lorefy-data-part05\.js/);
});
test('background replacement preserves known reading totals across catalog aliases', () => {
  const plan = require('../modules/lorefy-catalog-plan');
  const incoming = [{id:'canonical',ch:0,pages:0}, {id:'other',ch:10}];
  plan.preserveReadingTotals(incoming, [{id:'old',ch:700,pages:320}, {id:'other',ch:50}], {old:'canonical'});
  assert.equal(incoming[0].ch,700);
  assert.equal(incoming[0].pages,320);
  assert.equal(incoming[1].ch,10);
  assert.equal(incoming[1].pages,undefined);
  const updated = [{id:'updated',chapterCount:720}];
  plan.preserveReadingTotals(updated,[{id:'updated',ch:700}],{});
  assert.equal(updated[0].ch,undefined,'a newer total in another field must take precedence');
});
