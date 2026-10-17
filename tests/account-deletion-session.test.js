const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a'], ['lorefy.user.library.v2', 'a-library']]), calls = { invoke: [], logout: 0 };
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { localStorage: storage };
  vm.runInNewContext(source, { window, localStorage: storage, URL, console, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  const hooks = { session: async () => ({ userId: api.user.id }), invoke: async () => ({ data: null }) };
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1, getSession: () => hooks.session(),
    signOut: async () => { calls.logout++; },
    client: { functions: { invoke: async (name, args) => { calls.invoke.push({ name, args }); return hooks.invoke(); } } } });
  return { api, hooks, calls, values,
    transition(kind = 'account') {
      if (kind === 'account') { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); values.set('lorefy.user.library.v2', 'b-library'); }
      if (kind === 'client') api.client = { ...api.client };
      if (kind === 'epoch') api._communityEpoch++;
      if (kind === 'local-owner') values.set('lorefy.activeUser.v1', 'b');
    } };
}
for (const phase of ['session', 'invoke']) for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
  test('delete account: ' + transition + ' during ' + phase + ' cannot continue or log out another session', async () => {
    const h = harness(), entered = deferred(), gate = deferred();
    h.hooks[phase] = async () => { entered.resolve(); return gate.promise; };
    const result = h.api.deleteAccount(); await entered.promise; h.transition(transition);
    gate.resolve(phase === 'session' ? { userId: 'a' } : { data: null });
    await assert.rejects(result, stale); assert.equal(h.calls.invoke.length, phase === 'session' ? 0 : 1);
    assert.equal(h.calls.logout, 0);
    if (transition === 'account') assert.equal(h.values.get('lorefy.user.library.v2'), 'b-library');
  });
}
test('account deletion cannot use an auth identity different from the opening account', async () => {
  const h = harness(); h.hooks.session = async () => ({ userId: 'b' });
  await assert.rejects(h.api.deleteAccount(), stale); assert.equal(h.calls.invoke.length, 0);
});
test('old delete error JSON cannot return a result to another account', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.hooks.invoke = async () => ({ error: { context: { clone: () => ({ json: async () => { entered.resolve(); return gate.promise; } }) } } });
  const result = h.api.deleteAccount(); await entered.promise; h.transition();
  gate.resolve({ error: 'recent_authentication_required' });
  await assert.rejects(result, stale); assert.equal(h.calls.logout, 0);
});
test('new account gets its own pending deletion and the old finally cannot clear its request slot', async () => {
  const h = harness(), firstEntered = deferred(), firstGate = deferred(), secondEntered = deferred(), secondGate = deferred();
  h.hooks.invoke = async () => { firstEntered.resolve(); return firstGate.promise; };
  const first = h.api.deleteAccount(); await firstEntered.promise; h.transition();
  h.hooks.invoke = async () => { secondEntered.resolve(); return secondGate.promise; };
  const second = h.api.deleteAccount();
  // Let the new request reach its invoke; old code incorrectly reuses first.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.calls.invoke.length, 2);
  const currentSlot = h.api._deletionRunning;
  firstGate.resolve({ data: null }); await assert.rejects(first, stale);
  assert.equal(h.api._deletionRunning, currentSlot);
  secondGate.resolve({ data: null }); assert.equal(await second, true); assert.equal(h.calls.logout, 1);
});
test('same-account duplicate deletion remains a single request and confirmed success logs out once', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.hooks.invoke = async () => { entered.resolve(); return gate.promise; };
  const first = h.api.deleteAccount(), second = h.api.deleteAccount(); await entered.promise;
  gate.resolve({ data: null }); assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.equal(h.calls.invoke.length, 1); assert.equal(h.calls.logout, 1);
  assert.equal(h.calls.invoke[0].name, 'delete-account'); assert.equal(h.calls.invoke[0].args.body.confirm, true);
});
test('demo deletion stays local and a demo request cannot become a live deletion after awaiting auth', async () => {
  const h = harness(); h.api.mode = 'demo';
  assert.equal(await h.api.deleteAccount(), true); assert.equal(h.calls.invoke.length, 0); assert.equal(h.calls.logout, 1);
  const other = harness(), entered = deferred(), gate = deferred(); other.api.mode = 'demo';
  other.hooks.session = async () => { entered.resolve(); return gate.promise; };
  const result = other.api.deleteAccount(); await entered.promise; other.api.mode = 'live'; gate.resolve({ userId: 'a' });
  await assert.rejects(result, stale); assert.equal(other.calls.invoke.length, 0); assert.equal(other.calls.logout, 0);
});
