const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const modulePath = path.join(root, 'modules/lorefy-arabic-enrichment-loader.js');
const factory = fs.existsSync(modulePath) ? require(modulePath) : () => null;
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function harness(fetcher) {
  const requests = [], timers = new Map(), listeners = new Map();
  let serial = 0;
  const env = {
    fetch(url, options) { requests.push(url); return fetcher(url, options); },
    setTimeout(fn) { const id = ++serial; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); }, AbortController, URLSearchParams,
    location: {search: ''}, addEventListener(name, fn) { listeners.set(name, fn); },
    document: {readyState: 'complete', addEventListener(name, fn) { listeners.set(name, fn); }},
    LorefyArabicEnrichment: {},
  };
  const api = factory(env, {schema: 1, buckets: 256, contentHash: 'abc123'});
  assert.ok(api && typeof api.ensure === 'function', 'a demand loader must be available');
  return {api, env, requests, timers, listeners};
}

test('startup must not download the full Arabic synopsis map on a background timer', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const block = html.slice(html.indexOf('window.LOREFY_DEFERRED_ASSETS'), html.indexOf('<!-- Mount:'));
  assert.doesNotMatch(block, /uploads\/lorefy-ar-enrichment\.js/);
  assert.match(html, /modules\/lorefy-arabic-enrichment-loader\.js/);
});

test('initialization performs no data requests and empty IDs do not fetch', async () => {
  const h = harness(() => { throw new Error('unexpected fetch'); });
  assert.equal(await h.api.ensure(''), null);
  assert.equal(await h.api.ensure('__proto__'), null);
  assert.equal(h.requests.length, 0);
});

test('one selected work loads one local shard and preserves the shared map reference', async () => {
  const entry = {synopsisAr: 'ملخص عربي', source: 'curated'};
  const h = harness(async () => ({ok: true, json: async () => ({work: entry, unrelated: {synopsisAr: 'other'}})}));
  const map = h.env.LorefyArabicEnrichment;
  assert.deepEqual(await h.api.ensure('work'), entry);
  assert.equal(h.env.LorefyArabicEnrichment, map);
  assert.equal(map.work, entry);
  assert.equal(map.unrelated, undefined, 'do not merge every shard entry into the active catalog');
  assert.match(h.requests[0], /^uploads\/arabic-enrichment\/[a-f0-9]{2}\.json\?v=abc123$/);
  await h.api.ensure('work');
  assert.equal(h.requests.length, 1);
});

test('same-shard callers share one pending request but receive their exact entries', async () => {
  let finish;
  const h = harness(() => new Promise(resolve => { finish = resolve; }));
  const id = 'selected', bucket = h.api.bucketForId(id);
  const other = Array.from({length: 2000}, (_, i) => 'candidate-' + i).find(value => h.api.bucketForId(value) === bucket);
  assert.ok(other);
  const first = h.api.ensure(id), second = h.api.ensure(other);
  await flush();
  assert.equal(h.requests.length, 1);
  finish({ok: true, json: async () => ({[id]: {synopsisAr: 'one'}, [other]: {synopsisAr: 'two'}})});
  assert.equal((await first).synopsisAr, 'one');
  assert.equal((await second).synopsisAr, 'two');
});

test('failed and timed-out shard requests can retry without late response mutation', async () => {
  let attempt = 0, late;
  const h = harness(() => {
    if (++attempt === 1) return Promise.resolve({ok: false, status: 503});
    if (attempt === 2) return new Promise(resolve => { late = resolve; });
    return Promise.resolve({ok: true, json: async () => ({work: {synopsisAr: 'new'}})});
  });
  assert.equal(await h.api.ensure('work'), null);
  const pending = h.api.ensure('work'); await flush();
  for (const timer of [...h.timers.values()]) timer();
  assert.equal(await pending, null);
  assert.equal((await h.api.ensure('work')).synopsisAr, 'new');
  late({ok: true, json: async () => ({work: {synopsisAr: 'old'}})}); await flush();
  assert.equal(h.env.LorefyArabicEnrichment.work.synopsisAr, 'new');
  assert.equal(h.timers.size, 0);
});

test('missing IDs and malformed shard responses never become permanent failures', async () => {
  let bad = true;
  const h = harness(async () => ({ok: true, json: async () => bad ? [] : {work: {synopsisAr: 'valid'}}}));
  assert.equal(await h.api.ensure('work'), null);
  bad = false;
  assert.equal((await h.api.ensure('work')).synopsisAr, 'valid');
  assert.equal(h.requests.length, 2);
  assert.equal(await h.api.ensure('not-present'), null);
});

test('local shard requests use a bounded two-request queue', async () => {
  const pending = [];
  const h = harness(() => new Promise(resolve => pending.push(resolve)));
  const ids = Array.from({length: 4}, (_, i) => 'queue-' + i);
  assert.equal(new Set(ids.map(h.api.bucketForId)).size, 4);
  const jobs = ids.map(h.api.ensure);
  await flush(); assert.equal(h.requests.length, 2);
  while (pending.length) { pending.shift()({ok: true, json: async () => ({})}); await flush(); }
  await Promise.all(jobs);
  assert.equal(h.requests.length, 4);
});

test('successful shard cache retains at most eight buckets', async () => {
  const h = harness(async () => ({ok: true, json: async () => ({})}));
  const ids = Array.from({length: 9}, (_, i) => 'cache-' + i);
  assert.equal(new Set(ids.map(h.api.bucketForId)).size, 9);
  for (const id of ids) await h.api.ensure(id);
  await h.api.ensure(ids[0]);
  assert.equal(h.requests.length, 10, 'old unselected bucket must be evicted');
});

test('direct work routes recover late catalog data without refreshing a different route', async () => {
  let finish, refreshes = 0;
  const h = harness(() => new Promise(resolve => { finish = resolve; }));
  h.env.location.search = '?route=detail&novel=work';
  const work = {id: 'work', progress: 7, rating: 0};
  h.env.LorefyMangaData = [work];
  h.env.LorefyEnrich = {applyCachedAll(records) { records[0].synopsisAr = 'ready'; return 1; }};
  h.env.__lorefyRefresh = () => refreshes++;
  h.listeners.get('lorefy:routechange')(); await flush();
  h.env.location.search = '?route=home';
  finish({ok: true, json: async () => ({work: {synopsisAr: 'ready'}})}); await flush();
  assert.equal(refreshes, 0);
  assert.equal(work.synopsisAr, undefined);
  h.env.location.search = '?route=detail&novel=work';
  h.listeners.get('lorefy:catalog-ingested')(); await flush();
  assert.equal(refreshes, 1);
  assert.equal(work.synopsisAr, 'ready');
  assert.equal(work.progress, 7); assert.equal(work.rating, 0);
});

test('selected-work enrichment waits for the local synopsis and keeps user fields', async () => {
  let finish, refreshes = 0;
  const env = {
    localStorage: {getItem: () => null, setItem() {}},
    LorefyArabicEnrichment: {},
    LorefyArabicEnrichmentLoader: {ensure: () => new Promise(resolve => { finish = resolve; })},
    __lorefyRefresh() { refreshes++; },
    setTimeout, fetch: async () => { throw new Error('Books must not query manga APIs'); },
  };
  env.window = env;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'uploads/files/lorefy-enrich.js'), 'utf8'), env);
  const work = {id: 'novel', title: 'Novel', type: 'Novel', cover: 'personal', ch: 50, progress: 12, rating: 0};
  const job = env.LorefyEnrich.enrichOne(work);
  await flush(); assert.equal(typeof finish, 'function', 'selected details must request their local synopsis');
  env.LorefyArabicEnrichment.novel = {synopsisAr: 'ملخص محلي', source: 'curated'};
  finish(env.LorefyArabicEnrichment.novel); await job;
  assert.equal(work.synopsisAr, 'ملخص محلي'); assert.equal(refreshes, 1);
  assert.equal(work.cover, 'personal'); assert.equal(work.ch, 50);
  assert.equal(work.progress, 12); assert.equal(work.rating, 0);
});

test('direct links resolve a catalog alias before requesting the canonical synopsis', async () => {
  const h = harness(async () => ({ok: true, json: async () => ({canonical: {synopsisAr: 'canonical summary'}})}));
  h.env.location.search = '?route=detail&novel=old-work-id';
  h.env.LorefyCatalogAliases = {'old-work-id': 'canonical'};
  h.env.LorefyMangaData = [{id: 'canonical'}];
  let applied;
  h.env.LorefyEnrich = {applyCachedAll(records) { applied = records[0].id; return 0; }};
  h.listeners.get('lorefy:routechange')(); await flush();
  assert.equal(applied, 'canonical');
  assert.ok(h.requests[0].includes('/' + h.api.bucketForId('canonical') + '.json'));
});

test('generated shards preserve every legacy entry and metadata byte-for-value', () => {
  const context = {}; vm.runInNewContext(fs.readFileSync(path.join(root, 'uploads/lorefy-ar-enrichment.js'), 'utf8'), context);
  const dir = path.join(root, 'uploads/arabic-enrichment');
  assert.ok(fs.existsSync(dir), 'generated demand shards must be checked in');
  const merged = {};
  const api = factory({}, {});
  let bytes = 0;
  for (const file of fs.readdirSync(dir).filter(name => /^[a-f0-9]{2}\.json$/.test(name))) {
    const source = fs.readFileSync(path.join(dir, file)); bytes += source.length;
    assert.ok(source.length < 64 * 1024, 'each decode is bounded below 64KiB');
    const entries = JSON.parse(source);
    for (const id of Object.keys(entries)) assert.equal(api.bucketForId(id) + '.json', file);
    Object.assign(merged, entries);
  }
  assert.deepEqual(merged, JSON.parse(JSON.stringify(context.LorefyArabicEnrichment)));
  assert.equal(Object.keys(merged).length, 12071);
  assert.ok(bytes > 1024 * 1024, 'do not silently drop the large source data');
  const manifestContext = {window: {}};
  vm.runInNewContext(fs.readFileSync(path.join(dir, 'manifest.js'), 'utf8'), manifestContext);
  assert.deepEqual(JSON.parse(JSON.stringify(manifestContext.window.LorefyArabicEnrichmentRuntime.meta)), JSON.parse(JSON.stringify(context.LorefyArabicEnrichmentMeta)));
});

test('native preparation generates the shards but excludes the unused legacy runtime copy', () => {
  const source = fs.readFileSync(path.join(root, 'tools/prepare-ios-web.mjs'), 'utf8');
  assert.match(source, /build-arabic-enrichment\.js/);
  assert.match(source, /await rm\(path\.join\(output, "uploads", "lorefy-ar-enrichment\.js"\), \{ force: true \}\)/);
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(worker.includes("url.pathname.includes('/uploads/arabic-enrichment/')"));
  const core = worker.slice(worker.indexOf('const CORE'), worker.indexOf('const CATALOG'));
  assert.doesNotMatch(core, /arabic-enrichment\/[a-f0-9]{2}\.json/);
  for (const bundle of ['ios-web', 'ios/App/App/public']) {
    assert.equal(fs.existsSync(path.join(root, bundle, 'uploads/lorefy-ar-enrichment.js')), false);
  }
});
