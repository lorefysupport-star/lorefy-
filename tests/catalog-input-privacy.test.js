const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness() {
  const source = fs.readFileSync('modules/lorefy-api-catalog.js', 'utf8');
  const begin = source.indexOf('  var inputTimer = null;');
  const end = source.indexOf('  function hookHistory()', begin);
  const events = {}, timers = new Map(), calls = [];
  const scope = {
    global: {
      addEventListener(name, fn) { events[name] = fn; },
      document: {addEventListener(name, fn) { events[name] = fn; }},
      setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    config: () => ({autoSearch: true}), normalizeSpaces: s => s.trim(),
    readRouteType: () => 'Manga', SEARCH_DEBOUNCE_MS: 650,
    search(q, type) { calls.push({q, type}); return Promise.resolve(); }
  };
  vm.runInNewContext(source.slice(begin, end) + '\nbindSearchInputs();', scope);
  return {events, calls, flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); }};
}
function field(value, allowed = false, tagName = 'INPUT') {
  return {value, tagName, isConnected: true, closest: () => allowed ? {} : null};
}
test('private drafts, profile fields, chapter numbers and character search never reach catalog APIs', () => {
  const h = harness();
  for (const target of [field('private review', false, 'TEXTAREA'), field('private bio'), field('420'), field('Gon character')]) {
    h.events.input({target}); h.flush();
  }
  assert.equal(h.calls.length, 0);
});
test('catalog search still runs, and clearing or removing the field cancels queued requests', () => {
  const h = harness(), target = field('Hunter', true);
  h.events.input({target}); h.flush();
  assert.deepEqual(h.calls, [{q: 'Hunter', type: 'Manga'}]);
  h.events.input({target}); target.value = ''; h.events.input({target}); h.flush();
  target.value = 'Berserk'; h.events.input({target}); target.isConnected = false; h.flush();
  assert.equal(h.calls.length, 1);
});
test('navigation cancels a pending catalog query', () => {
  const h = harness();
  h.events.input({target: field('Hunter', true)});
  assert.equal(typeof h.events['lorefy:route-change'], 'function');
  h.events['lorefy:route-change'](); h.flush();
  assert.equal(h.calls.length, 0);
});
