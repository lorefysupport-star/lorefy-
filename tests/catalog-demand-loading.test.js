const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const loaderSource = fs.readFileSync(path.join(root, 'modules/lorefy-catalog-loader.js'), 'utf8');

function harness() {
  const documentEvents = new Map();
  const windowEvents = new Map();
  const scripts = [];
  const workers = [];
  const data = [{id:'initial',title:'Initial',type:'مانجا'}];
  const doc = {
    readyState: 'loading',
    scripts: [{src:'uploads/lorefy-data-part01.js'}],
    addEventListener(name, callback) { documentEvents.set(name, callback); },
    createElement() { return {dataset:{}}; },
    head: {appendChild(script) {
      scripts.push(script.src);
      if (/part02\.js/.test(script.src)) data.push({id:'search-hit',title:'One Piece',type:'مانجا'});
      if (/part03\.js/.test(script.src)) data.push({id:'direct-hit',title:'Book',type:'رواية'});
      queueMicrotask(() => script.onload());
    }}
  };
  class Worker {
    constructor(url) { this.url = url; workers.push(url); this.listeners = new Map(); }
    addEventListener(name, callback) { this.listeners.set(name, callback); }
    postMessage(request) {
      if (request.type === 'search') queueMicrotask(() => this.listeners.get('message')({data: {
        type:'result', requestId:request.requestId, matches:[{part:2,count:1,score:100}]
      }}));
    }
    terminate() {}
  }
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options && options.detail; } }
  const win = {
    document:doc, location:{search:''}, LorefyMangaData:data,
    LOREFY_INITIAL_CATALOG_PARTS:[1],
    LorefyCatalogManifest:{partCount:3,featuredParts:[1],types:{Manga:[1,2],Novel:[3]},workParts:{'direct-hit':3}},
    LorefyCatalogPlan:require('../modules/lorefy-catalog-plan'),
    Worker, CustomEvent, URLSearchParams,
    setTimeout(callback, ms) {
      if (ms >= 5000) { const timer=setTimeout(callback,ms);timer.unref();return timer; }
      queueMicrotask(callback);return 1;
    }, clearTimeout(timer) { clearTimeout(timer); },
    addEventListener(name, callback) { windowEvents.set(name, callback); },
    dispatchEvent() {},
    history:{pushState(){},replaceState(){}},
    __lorefyIngest(){}, __lorefyRefresh(){},
  };
  vm.runInNewContext(loaderSource, {window:win,CustomEvent,URLSearchParams,console});
  const settle = async () => {
    for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve));
  };
  return {win,doc,documentEvents,windowEvents,scripts,workers,settle};
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
