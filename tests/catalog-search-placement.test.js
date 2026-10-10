const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

test('expanded works use the existing search results, not a second home browser', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-catalog-detail-cache.js'), 'utf8');
  assert.match(app, /lf-search-page/);
  assert.match(app, /lf-search-result/);
  assert.match(index, /modules\/lorefy-catalog-detail-cache\.js/);
  assert.doesNotMatch(index, /lorefy-comics-hub|lorefy-catalog-browser-core|lorefy-catalog-browser\.css/);
  assert.match(source, /\.lf-search-page \.lf-search-result/);
});

test('a search result keeps its exact expanded work available after detail reload', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-catalog-detail-cache.js'), 'utf8');
  const handlers = {};
  const stored = new Map();
  const pending = [];
  const work = { id: 'ol-expanded-work', title: 'Expanded Comic', type: 'كوميكس' };
  const window = {
    document: { addEventListener: (name, handler) => { handlers[name] = handler; } },
    location: { search: '?route=explore' },
    LorefyMangaData: [work],
    sessionStorage: { setItem: (key, value) => stored.set(key, value) },
    setTimeout: (handler) => { pending.push(handler); }
  };
  vm.runInNewContext(source, { window, URLSearchParams });
  const card = {};
  const target = { closest: (selector) => selector === '.lf-search-page .lf-search-result' ? card : null };
  handlers.click({ target });
  window.location.search = '?route=detail&novel=ol-expanded-work';
  pending.shift()();
  assert.deepEqual(JSON.parse(stored.get('lorefy.catalog.openWork.v1')), work);
});

test('adding a search result to a list does not replace the cached detail work', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-catalog-detail-cache.js'), 'utf8');
  const handlers = {};
  let scheduled = false;
  const window = {
    document: { addEventListener: (name, handler) => { handlers[name] = handler; } },
    location: { search: '?route=explore' }, LorefyMangaData: [],
    sessionStorage: { setItem: () => {} },
    setTimeout: () => { scheduled = true; }
  };
  vm.runInNewContext(source, { window, URLSearchParams });
  const card = {};
  const target = { closest: (selector) => selector === '.lf-search-page .lf-search-result' ? card : selector === 'button' ? {} : null };
  handlers.click({ target });
  assert.equal(scheduled, false);
});
