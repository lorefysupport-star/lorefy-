const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('modules/lorefy-character-system.js', 'utf8');
const flush = async () => { for (let i = 0; i < 32; i++) await Promise.resolve(); };
const work = { id: 'manga-fixture', title: 'Fixture', type: 'Manga' };
const response = json => ({ ok: true, status: 200, json: async () => json });
const site = () => response({ query: { general: { sitename: 'Fixture Wiki' } } });
const category = () => response({ query: { pages: { 1: { pageid: 1, ns: 0, title: 'Verified Hero' } } } });

function harness(provider) {
  let now = 0, serial = 0;
  const timers = new Map(), requests = [], window = {};
  vm.runInNewContext(source, {
    window, URL, URLSearchParams, console,
    fetch: (url, init) => { requests.push(String(url)); return provider(String(url), init); },
    setTimeout: (fn, ms) => { const id = ++serial; timers.set(id, { at: now + ms, fn }); return id; },
    clearTimeout: id => timers.delete(id)
  });
  return {
    api: window.LorefyCharacterSystem, timers, requests,
    discoveryCount: () => requests.filter(url => url.includes('meta=siteinfo')).length,
    async advance(ms) {
      const end = now + ms;
      await flush();
      for (let step = 0; step < 100; step++) {
        const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) { now = end; await flush(); return; }
        now = next[1].at; timers.delete(next[0]); next[1].fn(); await flush();
      }
      throw Error('Unbounded retry timers');
    }
  };
}

for (const [label, fail] of [
  ['network rejection', async () => { throw Error('offline'); }],
  ['HTTP failure', async () => ({ ok: false, status: 503 })],
  ['invalid JSON', async () => ({ ok: true, json: async () => { throw new SyntaxError('Bad JSON'); } })],
  ['unverified fanon community', async () => response({ query: { general: { sitename: 'Fixture Fanon Wiki' } } })]
]) test(`Fandom discovery retries the same work after ${label}`, async () => {
  let ready = false;
  const h = harness(url => url.includes('meta=siteinfo') ? ready ? Promise.resolve(site()) : fail() : Promise.resolve(category()));
  await assert.rejects(h.api.fandomCategoryCast(work));
  assert.equal(h.discoveryCount(), 1); ready = true;
  const cast = await h.api.fandomCategoryCast(work);
  assert.equal(cast[0].name, 'Verified Hero'); assert.equal(cast.complete, true);
  assert.equal(h.discoveryCount(), 2); assert.equal(h.timers.size, 0);
});

test('concurrent discovery callers share one failure, then a fresh retry succeeds', async () => {
  let release, ready = false;
  const pending = new Promise(resolve => { release = resolve; });
  const h = harness(async url => url.includes('meta=siteinfo') ? ready ? site() : pending : category());
  const first = h.api.fandomCategoryCast(work), second = h.api.fandomCategoryCast(work);
  const settled = Promise.allSettled([first, second]);
  assert.equal(h.discoveryCount(), 1); release({ ok: false, status: 503 });
  assert.deepEqual((await settled).map(row => row.status), ['rejected', 'rejected']);
  ready = true;
  assert.equal((await h.api.fandomCategoryCast(work))[0].name, 'Verified Hero');
  assert.equal(h.discoveryCount(), 2); assert.equal(h.timers.size, 0);
});

test('successful discovery remains memoized while category contents can refresh', async () => {
  const h = harness(async url => url.includes('meta=siteinfo') ? site() : category());
  await h.api.fandomCategoryCast(work); await h.api.fandomCategoryCast(work);
  assert.equal(h.discoveryCount(), 1);
  assert.equal(h.requests.filter(url => url.includes('generator=categorymembers')).length, 2);
  assert.equal(h.timers.size, 0);
});

test('missing title candidates do not poison a work after its metadata arrives', async () => {
  const h = harness(async url => url.includes('meta=siteinfo') ? site() : category());
  await assert.rejects(h.api.fandomCategoryCast({ ...work, title: '' }));
  assert.equal(h.discoveryCount(), 0);
  assert.equal((await h.api.fandomCategoryCast(work))[0].name, 'Verified Hero');
  assert.equal(h.discoveryCount(), 1); assert.equal(h.timers.size, 0);
});

test('a timed-out discovery body can retry without a late response clearing its replacement', async () => {
  let release, ready = false;
  const pending = new Promise(resolve => { release = resolve; });
  const h = harness(async url => url.includes('meta=siteinfo') ? ready ? site() : { ok: true, json: () => pending } : category());
  const first = assert.rejects(h.api.fandomCategoryCast(work));
  await h.advance(4000); await first; ready = true;
  await h.api.fandomCategoryCast(work);
  release({ query: { general: { sitename: 'Fixture Fanon Wiki' } } }); await flush();
  await h.api.fandomCategoryCast(work);
  assert.equal(h.discoveryCount(), 2); assert.equal(h.timers.size, 0);
});

test('a later category failure does not evict the verified discovery source', async () => {
  let ready = false;
  const h = harness(async url => url.includes('meta=siteinfo') ? site() : ready ? category() : { ok: false, status: 503 });
  const first = assert.rejects(h.api.fandomCategoryCast(work));
  await h.advance(600); await first; ready = true;
  assert.equal((await h.api.fandomCategoryCast(work))[0].name, 'Verified Hero');
  assert.equal(h.discoveryCount(), 1); assert.equal(h.timers.size, 0);
});
