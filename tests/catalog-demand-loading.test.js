const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const loaderSource = fs.readFileSync(path.join(root, 'modules/lorefy-catalog-loader.js'), 'utf8');

function harness(options = {}) {
  const documentEvents = new Map();
  const windowEvents = new Map();
  const scripts = [];
  const workers = [];
  const searchRequests = [], searchReplies = [];
  const failures = new Set(), holdParts = new Set(), pendingScripts = new Map();
  const timers = new Map();
  let timerId = 0;
  const data = [{id:'initial',title:'Initial',type:'مانجا'}];
  const doc = {
    readyState: 'loading',
    scripts: [{src:'uploads/lorefy-data-part01.js'}],
    addEventListener(name, callback) { documentEvents.set(name, callback); },
    createElement() { return {dataset:{}}; },
    head: {appendChild(script) {
      scripts.push(script.src);
      const part = Number(script.dataset.lorefyCatalogPart);
      const finish = () => queueMicrotask(() => {
        if (failures.has(part)) { script.onerror(); return; }
        if (part === 2) data.push({id:'search-hit',title:'One Piece',type:options.matchType || 'مانجا'});
        if (part === 3) data.push({id:'direct-hit',title:'Book',type:'رواية'});
        script.onload();
      });
      if (holdParts.has(part)) pendingScripts.set(part, finish); else finish();
    }}
  };
  class Worker {
    constructor(url) { this.url = url; workers.push(url); this.listeners = new Map(); }
    addEventListener(name, callback) { this.listeners.set(name, callback); }
    postMessage(request) {
      if (request.type !== 'search') return;
      searchRequests.push(request);
      const reply = () => this.listeners.get('message')({data: {
        type:'result', requestId:request.requestId,
        matches:options.matches || [{part:2,count:1,score:100}], suggestions:options.suggestions || []
      }});
      if (options.holdSearch) searchReplies.push(reply); else queueMicrotask(reply);
    }
    terminate() {}
  }
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options && options.detail; } }
  const win = {
    document:doc, location:{search:''}, LorefyMangaData:data,
    LOREFY_INITIAL_CATALOG_PARTS:[1],
    LorefyCatalogManifest:{partCount:3,featuredParts:[1],types:options.types || {Manga:[1,2],Novel:[3]},workParts:{'direct-hit':3}},
    LorefyCatalogPlan:require('../modules/lorefy-catalog-plan'),
    Worker, CustomEvent, URLSearchParams,
    setTimeout(callback, ms) {
      if (ms >= 5000) { const timer=setTimeout(callback,ms);timer.unref();return timer; }
      const id = ++timerId;
      timers.set(id, callback);
      queueMicrotask(() => {
        const task = timers.get(id);
        if (!task) return;
        timers.delete(id); task();
      });
      return id;
    }, clearTimeout(timer) { timers.delete(timer); clearTimeout(timer); },
    addEventListener(name, callback) { windowEvents.set(name, callback); },
    dispatchEvent() {},
    history:{pushState(){},replaceState(){}},
    __lorefyIngest(){}, __lorefyRefresh(){},
  };
  vm.runInNewContext(loaderSource, {window:win,CustomEvent,URLSearchParams,console});
  const settle = async () => {
    for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve));
  };
  return {win,doc,documentEvents,windowEvents,scripts,workers,settle,
    searchRequests,searchReplies,failures,holdParts,pendingScripts};
}

test('startup uses the bootstrap part and does not start a full-catalog worker', async () => {
  const app = harness();
  app.documentEvents.get('DOMContentLoaded')();
  await app.settle();
  assert.equal(app.win.LorefyCatalogLoader.state().ready, true);
  assert.equal(app.win.LorefyCatalogLoader.state().partial, true);
  assert.deepEqual(app.workers, []);
  assert.deepEqual(app.scripts, []);
});

test('search loads a matching part, and a direct link loads its mapped part', async () => {
  const app = harness();
  app.documentEvents.get('DOMContentLoaded')();
  await app.settle();
  app.documentEvents.get('input')({target:{tagName:'INPUT',value:'One Piece',closest:selector => selector === '.lf-search-box'}});
  await app.settle();
  assert.equal(app.workers.length, 1);
  assert.match(app.workers[0], /lorefy-catalog-search-worker/);
  assert.ok(app.scripts.some(url => /lorefy-data-part02\.js/.test(url)));
  assert.ok(!app.scripts.some(url => /lorefy-data-part03\.js/.test(url)));

  app.win.location.search = '?route=detail&novel=direct-hit&type=Novel';
  app.windowEvents.get('lorefy:routechange')();
  await app.settle();
  assert.ok(app.scripts.some(url => /lorefy-data-part03\.js/.test(url)));
});

test('generated search index matches the bundled catalog snapshot', () => {
  const index = JSON.parse(fs.readFileSync(path.join(root,'uploads/catalog-search-index.json'),'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root,'uploads/catalog-runtime/manifest.json'),'utf8'));
  assert.equal(index.schema, 1);
  assert.equal(index.sourceHash, manifest.contentHash);
  assert.equal(index.records.length, manifest.count);
  assert.ok(index.records.every(row => Number.isInteger(row[0]) && row[0] >= 1 && row[0] <= 163 && row[1] && row[2]));
});

test('controlled inputs consume typing before catalog status refreshes their parent', async () => {
  const app=harness(),order=[];
  app.win.__lorefyRefresh=()=>order.push('refresh');
  app.documentEvents.get('input')({target:{tagName:'INPUT',value:'One Piece',closest:()=>true}});
  assert.deepEqual(order,[],'capture must not restore the old controlled value before React onChange');
  order.push('input handled');
  await app.settle();
  assert.equal(order[0],'input handled');assert.ok(order.includes('refresh'));
});

test('an input removed before the deferred search cannot restart an obsolete query', async () => {
  const app=harness(),target={tagName:'INPUT',value:'Old query',isConnected:true,closest:()=>true};
  app.documentEvents.get('input')({target});target.isConnected=false;
  await app.settle();assert.equal(app.workers.length,0);assert.equal(app.win.LorefyCatalogLoader.state().searching,false);
});

test('a zero-hit format query does not load its unrelated browse bootstrap', async () => {
  const app = harness({matches:[],suggestions:['Another title']});
  const loader = app.win.LorefyCatalogLoader;
  const request = loader.loadFormat('Novel', '  Missing title  ');
  assert.equal(typeof request.then, 'function');
  assert.equal(loader.state().searching, true);
  await request; await app.settle();
  assert.deepEqual(app.scripts, []);
  assert.equal(app.searchRequests.length, 1);
  assert.equal(app.searchRequests[0].catalogType, 'Novel');
  assert.equal(app.searchRequests[0].query, 'Missing title');
  assert.equal(loader.state().searchQuery, 'Missing title');
  assert.equal(loader.state().searching, false);
  assert.equal(loader.state().searchError, false);
  assert.equal(loader.state().hasMore, false);
  assert.deepEqual(Array.from(loader.state().suggestions), ['Another title']);
});

test('a format query loads its matched shard but not the format bootstrap', async () => {
  const app = harness({types:{Manga:[1],Novel:[3,2]},matchType:'رواية'});
  const loader = app.win.LorefyCatalogLoader;
  await loader.loadFormat('Novel', 'One Piece'); await app.settle();
  assert.deepEqual(app.scripts.map(url => Number(url.match(/part(\d+)/)[1])), [2]);
  assert.equal(app.win.LorefyMangaData.find(work => work.id === 'search-hit').type, 'رواية');
  assert.equal(loader.state().searching, false);
  assert.equal(loader.state().searchError, false);
  assert.equal(loader.state().hasMore, false);
});

for (const query of [undefined, null, '', ' \t ']) test('empty format input keeps bootstrap browsing: '+JSON.stringify(query), async () => {
  const app = harness({types:{Manga:[1],Novel:[3,2]}});
  const loader = app.win.LorefyCatalogLoader;
  await loader.loadFormat('Novel', query); await app.settle();
  assert.deepEqual(app.scripts.map(url => Number(url.match(/part(\d+)/)[1])), [3]);
  assert.equal(loader.state().searchQuery, '');
  assert.equal(loader.state().searching, false);
  assert.equal(loader.state().searchError, false);
  assert.equal(loader.state().hasMore, true);
  await loader.loadMore(); await app.settle();
  assert.deepEqual(app.scripts.map(url => Number(url.match(/part(\d+)/)[1])), [3,2]);
  assert.equal(loader.state().hasMore, false);
  assert.deepEqual(app.searchRequests, []);
});

for (const query of [' N ', '\u0642']) test('short format input cancels queued search without browsing: '+JSON.stringify(query), async () => {
  const app = harness();
  const loader = app.win.LorefyCatalogLoader;
  const pending = loader.loadFormat('Novel', 'One Piece');
  const cancelled = loader.loadFormat('Novel', query);
  await Promise.all([pending,cancelled]); await app.settle();
  loader.retrySearch(); await app.settle();
  await loader.loadMore(); await app.settle();
  assert.deepEqual(app.scripts, []);
  assert.deepEqual(app.searchRequests, []);
  assert.equal(loader.state().searchQuery, query.trim());
  assert.equal(loader.state().searching, false);
  assert.equal(loader.state().searchError, false);
  assert.equal(loader.state().hasMore, false);
});

test('short format input ignores a late result from the cancelled search', async () => {
  const app = harness({holdSearch:true});
  const loader = app.win.LorefyCatalogLoader;
  await loader.loadFormat('Novel', 'One Piece'); await app.settle();
  assert.equal(app.searchReplies.length, 1);
  await loader.loadFormat('Novel', 'O'); await app.settle();
  app.searchReplies[0](); await app.settle();
  assert.deepEqual(app.scripts, []);
  assert.equal(app.searchRequests.length, 1);
  assert.equal(loader.state().searchQuery, 'O');
  assert.equal(loader.state().searching, false);
  assert.equal(loader.state().searchError, false);
  assert.equal(loader.state().hasMore, false);
});

test('two-character format queries retain the matched-shard pipeline', async () => {
  const app = harness();
  await app.win.LorefyCatalogLoader.loadFormat('Novel', 'On'); await app.settle();
  assert.equal(app.searchRequests.length, 1);
  assert.equal(app.searchRequests[0].query, 'On');
  assert.deepEqual(app.scripts.map(url => Number(url.match(/part(\d+)/)[1])), [2]);
});

test('format query shard loading keeps pending, failure and same-query retry states', async () => {
  const app = harness({types:{Manga:[1],Novel:[3,2]},matchType:'رواية'});
  const loader = app.win.LorefyCatalogLoader;
  app.holdParts.add(2); app.failures.add(2);
  await loader.loadFormat('Novel', 'One Piece'); await app.settle();
  assert.equal(loader.state().searching, true);
  assert.equal(loader.state().searchError, false);
  assert.deepEqual(Array.from(loader.state().loading), [2]);
  app.pendingScripts.get(2)(); await app.settle();
  assert.equal(loader.state().searching, false);
  assert.equal(loader.state().searchError, true);
  assert.equal(loader.state().hasMore, true);
  assert.equal(loader.state().searchQuery, 'One Piece');
  assert.equal(loader.state().searchType, 'Novel');
  app.failures.delete(2); app.holdParts.delete(2);
  loader.retrySearch();
  assert.equal(loader.state().searching, true);
  assert.equal(loader.state().searchError, false);
  await app.settle();
  assert.equal(loader.state().searching, false);
  assert.equal(loader.state().searchError, false);
  assert.equal(loader.state().hasMore, false);
  assert.deepEqual(app.scripts.map(url => Number(url.match(/part(\d+)/)[1])), [2,2]);
  assert.equal(app.searchRequests.length, 2);
  assert.ok(app.searchRequests.every(request => request.query === 'One Piece' && request.catalogType === 'Novel'));
});
