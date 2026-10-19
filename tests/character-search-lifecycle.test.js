const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('modules/lorefy-character-system.js', 'utf8');
const flush = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
const payload = (name = 'Killua Zoldyck') => ({ data: { Page: { characters: [{
  id: 27, name: { full: name, native: null, alternative: [] },
  image: { large: 'https://example.com/portrait.jpg' },
  media: { nodes: [{ id: 30026, idMal: 26, title: { english: 'Hunter x Hunter' } }] }
}] } } });

function harness(provider) {
  let now = 0, serial = 0, requests = 0;
  const timers = new Map(), values = new Map();
  const work = { id: 'mal-manga-26-hunter-x-hunter', title: 'Hunter x Hunter', type: 'Manga' };
  const window = { localStorage: { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) } };
  vm.runInNewContext(source, {
    window, URL, console,
    fetch: (...args) => { requests++; return provider(...args); },
    setTimeout: (fn, delay) => { const id = ++serial; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id)
  });
  return {
    api: window.LorefyCharacterSystem, work, values, timers, requests: () => requests,
    search(query = 'Killua', options) { return window.LorefyCharacterSystem.searchCharacters(query, [work], options); },
    async advance(ms) {
      const end = now + ms;
      while (true) {
        const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].fn(); await flush();
      }
      now = end; await flush();
    }
  };
}

function observe(promise) {
  const result = { state: 'pending' };
  result.done = promise.then(value => { result.state = 'fulfilled'; result.value = value; }, error => { result.state = 'rejected'; result.error = error; });
  return result;
}

test('character search times out a request that never receives headers', async () => {
  const h = harness(() => new Promise(() => {})), result = observe(h.search());
  await h.advance(9999); assert.equal(result.state, 'pending');
  await h.advance(1); assert.equal(result.state, 'rejected'); assert.match(result.error.message, /timeout/);
  assert.equal(h.timers.size, 0); assert.equal(h.values.size, 0);
});

test('character search deadline includes a response body that never finishes', async () => {
  const h = harness(async () => ({ ok: true, json: () => new Promise(() => {}) })), result = observe(h.search());
  await flush(); await h.advance(9999); assert.equal(result.state, 'pending');
  await h.advance(1); assert.equal(result.state, 'rejected'); assert.match(result.error.message, /timeout/);
  assert.equal(h.timers.size, 0); assert.equal(h.values.size, 0);
});

test('headers and JSON share one deadline rather than a fresh timeout per phase', async () => {
  const headers = deferred(), body = deferred(), h = harness(() => headers.promise), result = observe(h.search());
  await h.advance(9000); headers.resolve({ ok: true, json: () => body.promise }); await flush();
  await h.advance(999); assert.equal(result.state, 'pending');
  await h.advance(1); assert.equal(result.state, 'rejected');
  assert.equal(h.values.size, 0);
});

test('late JSON after timeout cannot populate either cache and the same query can retry', async () => {
  const body = deferred(); let first = true;
  const h = harness(async () => ({ ok: true, json: () => first ? (first = false, body.promise) : Promise.resolve(payload()) }));
  const old = observe(h.search()); await flush(); await h.advance(10000);
  assert.equal(old.state, 'rejected'); body.resolve(payload('Late character')); await flush();
  assert.equal(h.values.size, 0);
  const rows = await h.search(); assert.equal(h.requests(), 2);
  assert.equal(rows[0].cast[0].name, 'Killua Zoldyck'); assert.equal(h.timers.size, 0);
});

test('successful character search releases its deadline and preserves work identity', async () => {
  const h = harness(async () => ({ ok: true, json: async () => payload() }));
  const rows = await h.search(); assert.equal(rows[0].workId, h.work.id); assert.equal(h.timers.size, 0);
  await h.advance(20000); assert.equal(h.requests(), 1);
});

test('failed JSON parsing remains retryable without caching an empty result', async () => {
  let first = true;
  const h = harness(async () => ({ ok: true, json: async () => { if (first) { first = false; throw new SyntaxError('Invalid JSON'); } return payload(); } }));
  await assert.rejects(h.search(), /Invalid JSON/); assert.equal(h.timers.size, 0); assert.equal(h.values.size, 0);
  assert.equal((await h.search()).length, 1); assert.equal(h.requests(), 2);
});
