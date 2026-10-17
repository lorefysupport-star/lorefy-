const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a']]), calls = { clear: 0, flush: [], users: 0 };
  const window = { localStorage: { getItem: key => values.get(key) || null, setItem: (k, v) => values.set(k, String(v)) } };
  vm.runInNewContext(source, { window, localStorage: window.localStorage, console, URL, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1,
    client: { auth: { getSession: async () => ({ data: { session: { user: { id: api.user?.id || 'a' } } } }),
      getUser: async () => { calls.users++; return { data: { user: { id: api.user?.id || 'a' } } }; } } },
    _clearInvalidSession: async () => { calls.clear++; }, flushAppleAuthorization: async owner => calls.flush.push(owner) });
  return { api, values, calls, switchAccount() { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); } };
}
for (const result of [{ data: { user: { id: 'a' } } }, { data: { user: null }, error: { code: 'session_not_found' } }]) {
  test('old user verification cannot restore or clear the next account: ' + (result.error ? 'missing' : 'valid'), async () => {
    const h = harness(), gate = deferred(), entered = deferred();
    h.api.client.auth.getUser = async () => { entered.resolve(); return gate.promise; };
    const request = h.api.getSession(); await entered.promise; h.switchAccount(); gate.resolve(result);
    await assert.rejects(request, stale); assert.equal(h.api.user.id, 'b'); assert.equal(h.calls.clear, 0); assert.deepEqual(h.calls.flush, []);
  });
}
test('an old empty persisted session cannot null the next account user', async () => {
  const h = harness(), gate = deferred(); h.api.client.auth.getSession = () => gate.promise;
  const request = h.api.getSession(); h.switchAccount(); gate.resolve({ data: { session: null } });
  await assert.rejects(request, stale); assert.equal(h.api.user.id, 'b'); assert.equal(h.calls.users, 0);
});
for (const transition of ['client', 'local-owner', 'epoch']) {
  test('user verification is discarded after ' + transition + ' changes', async () => {
    const h = harness(), gate = deferred(), entered = deferred();
    h.api.client.auth.getUser = async () => { entered.resolve(); return gate.promise; };
    const request = h.api.getSession(); await entered.promise;
    if (transition === 'client') h.api.client = { ...h.api.client };
    if (transition === 'local-owner') h.values.set('lorefy.activeUser.v1', 'b');
    if (transition === 'epoch') h.api._communityEpoch++;
    gate.resolve({ data: { user: { id: 'a' } } }); await assert.rejects(request, stale); assert.deepEqual(h.calls.flush, []);
  });
}
test('a new account starts its own session check instead of reusing the previous account promise', async () => {
  const h = harness(), a = deferred(), b = deferred();
  h.api.client.auth.getUser = async () => { h.calls.users++; return h.calls.users === 1 ? a.promise : b.promise; };
  const first = h.api.getSession(); await tick(); h.switchAccount(); const second = h.api.getSession(); await tick();
  a.resolve({ data: { user: { id: 'a' } } }); b.resolve({ data: { user: { id: 'b' } } });
  const results = await Promise.allSettled([first, second]);
  assert.equal(h.calls.users, 2); assert.equal(results[0].status, 'rejected');
  assert.equal(results[1].status, 'fulfilled'); assert.equal(results[1].value.userId, 'b'); assert.equal(h.api.user.id, 'b');
});
test('the old promise finally cannot erase the new account single-flight slot', async () => {
  const h = harness(), a = deferred(), b = deferred();
  h.api.client.auth.getUser = async () => { h.calls.users++; return h.calls.users === 1 ? a.promise : b.promise; };
  const first = h.api.getSession(); await tick(); h.switchAccount(); const second = h.api.getSession(); await tick();
  a.resolve({ data: { user: { id: 'a' } } }); await Promise.allSettled([first]);
  const third = h.api.getSession(); await tick(); b.resolve({ data: { user: { id: 'b' } } });
  const results = await Promise.allSettled([second, third]);
  assert.equal(h.calls.users, 2); assert.ok(results.every(r => r.status === 'fulfilled' && r.value.userId === 'b'));
});
test('initial restore without a cached user and concurrent reads still work', async () => {
  const h = harness(); h.api.user = null;
  const results = await Promise.all([h.api.getSession(), h.api.getSession(), h.api.getSession()]);
  assert.ok(results.every(r => r.userId === 'a')); assert.equal(h.calls.users, 1); assert.equal(h.api.user.id, 'a');
});
test('a verified auth identity inconsistent with the opening owner cannot replace it silently', async () => {
  const h = harness(); h.api.client.auth.getUser = async () => ({ data: { user: { id: 'b' } } });
  await assert.rejects(h.api.getSession(), stale); assert.equal(h.api.user.id, 'a'); assert.deepEqual(h.calls.flush, []);
});
