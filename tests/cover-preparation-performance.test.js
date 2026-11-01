const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  let parses = 0;
  const maps = [];
  class CountedURL extends URL { constructor(...args) { super(...args); parses++; } }
  class CountedMap extends Map { constructor(...args) { super(...args); maps.push(this); } }
  const scope = { URL:CountedURL, URLSearchParams, Map:CountedMap, Set };
  scope.window = scope;
  vm.runInNewContext(fs.readFileSync('modules/lorefy-cover-api.js', 'utf8'), scope);
  return { api:scope.LorefyCoverAPI, scope, maps, parses:() => parses };
}
const cover = 'https://cdn.myanimelist.net/images/manga/1/12345l.jpg';

test('repeated cover preparation reuses pure URL validation and edition keys', () => {
  const { api, parses } = setup();
  const work = {sourceCoverUrl:cover};
  assert.equal(api.primary(work), cover);
  assert.equal(api.dedupeKey(cover), 'mal:manga:12345');
  const warm = parses();
  for (let i = 0; i < 500; i++) {
    assert.equal(api.primary(work), cover);
    assert.equal(api.dedupeKey(cover), 'mal:manga:12345');
  }
  assert.equal(parses(), warm, 'unchanged cards must not repeat URL parsing');
});

test('pure URL caches are bounded and evicted entries recompute correctly', () => {
  const { api, maps } = setup();
  for (let i = 0; i < 1400; i++) api.primary({cover:`https://covers.openlibrary.org/b/id/${i}-L.jpg`});
  assert.ok(maps.every(map => map.size <= 1024), 'no unbounded session cache');
  assert.equal(api.primary({cover}), cover);
  assert.equal(api.dedupeKey(cover), 'mal:manga:12345');
});

test('inline and oversized artwork is not retained in the session URL caches', () => {
  const { api, maps } = setup();
  const inline = 'data:image/png;base64,' + 'A'.repeat(3000);
  const long = cover + '?token=' + 'a'.repeat(3000);
  const before = maps.reduce((sum, map) => sum + map.size, 0);
  assert.equal(api.primary({cover:inline}), inline);
  assert.equal(api.primary({cover:long}), long);
  api.dedupeKey(inline); api.dedupeKey(long);
  assert.equal(maps.reduce((sum, map) => sum + map.size, 0), before);
});

test('display routing and rights remain live even after the source URL is warm', () => {
  const { api, scope } = setup();
  scope.LorefyDataProxy = {mediaUrl:url => '/first?url=' + encodeURIComponent(url)};
  assert.match(api.displayUrl(cover), /^\/first/);
  scope.LorefyDataProxy.mediaUrl = () => '/second';
  assert.equal(api.displayUrl(cover), '/second');
  scope.LorefyRightsSafeMedia = {coverUrl:() => '/rights-safe'};
  assert.equal(api.displayUrl(cover), '/rights-safe');
  for (const bad of ['javascript:alert(1)','https://evil.invalid/art.jpg','https://downloads.hindawi.org/other.svg']) {
    assert.equal(api.primary({cover:bad}), '');
    assert.equal(api.dedupeKey(bad), '');
  }
});
