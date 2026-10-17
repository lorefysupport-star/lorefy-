const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const installation = '11111111-1111-4111-8111-111111111111';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a'], ['lorefy.user.library.v2', 'a-library'],
    ['lorefy.identity.v1', 'a-identity'], ['lorefy.pendingState.v1', 'a-pending'], ['lorefy.native.installation.v1', installation]]);
  const calls = { community: 0, unregister: 0, channel: [], sdk: [], emit: [], monitoring: [] };
  const storage = { get length() { return values.size; }, key: i => [...values.keys()][i],
    getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
  const window = { localStorage: storage, LorefyMonitoring: { setUserId: id => calls.monitoring.push(id), clear: () => calls.monitoring.push('clear') } };
  vm.runInNewContext(source, { window, localStorage: storage, URL, console, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  const hooks = { community: async () => true, unregister: async () => true, channel: async () => true, sdk: async () => ({ error: null }) };
  function client(label) { return {
    auth: { signOut: async options => { calls.sdk.push({ client: label, options }); return hooks.sdk(); } },
    removeChannel: async channel => { calls.channel.push({ channel, client: label }); return hooks.channel(); }
  }; }
  const firstClient = client('first'), oldChannel = { id: 'old' };
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1, client: firstClient,
    stopSync() {}, _stopCommunitySubscription: async () => { calls.community++; return hooks.community(); },
    unregisterPushDevice: async () => { calls.unregister++; return hooks.unregister(); },
    _notificationChannel: oldChannel, _notificationChannelClient: firstClient,
    _emit: value => calls.emit.push(value) });
  return { api, hooks, values, calls, oldChannel, client,
    transition(kind = 'account') {
      if (kind === 'account') {
        api.user = { id: 'b' }; api._communityEpoch++;
        values.set('lorefy.activeUser.v1', 'b'); values.set('lorefy.user.library.v2', 'b-library');
        values.set('lorefy.identity.v1', 'b-identity'); values.set('lorefy.pendingState.v1', 'b-pending');
      }
      if (kind === 'client') api.client = client('second');
      if (kind === 'epoch') api._communityEpoch++;
      if (kind === 'local-owner') values.set('lorefy.activeUser.v1', 'b');
      api._notificationChannel = { id: 'new' }; api._notificationChannelClient = api.client;
    } };
}
for (const action of ['signOut', '_clearInvalidSession']) {
  for (const phase of action === 'signOut' ? ['community', 'unregister', 'channel', 'sdk'] : ['community', 'sdk']) {
    for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
      test(action + ': ' + transition + ' during ' + phase + ' cannot clear current state', async () => {
        const h = harness(), gate = deferred(), entered = deferred();
        h.hooks[phase] = async () => { entered.resolve(); return gate.promise; };
        const result = h.api[action](); await entered.promise; h.transition(transition);
        const currentChannel = h.api._notificationChannel;
        gate.resolve(phase === 'sdk' ? { error: null } : true);
        await assert.rejects(result, stale);
        assert.equal(h.values.get('lorefy.user.library.v2'), transition === 'account' ? 'b-library' : 'a-library');
        assert.equal(h.values.get('lorefy.pendingState.v1'), transition === 'account' ? 'b-pending' : 'a-pending');
        assert.equal(h.api._notificationChannel, currentChannel);
        assert.equal(h.calls.emit.length, 0); assert.equal(h.calls.monitoring.length, 0);
        if (phase !== 'sdk') assert.equal(h.calls.sdk.length, 0);
        if (phase === 'community') assert.equal(h.calls.unregister, 0);
      });
    }
  }
}
for (const action of ['signOut', '_clearInvalidSession']) test(action + ': same-session cleanup still removes private state and emits sign-out once', async () => {
  const h = harness(); await h.api[action]();
  assert.equal(h.api.user, null); assert.equal(h.values.has('lorefy.activeUser.v1'), false);
  assert.equal(h.values.has('lorefy.user.library.v2'), false); assert.equal(h.values.has('lorefy.identity.v1'), false);
  assert.equal(h.values.has('lorefy.pendingState.v1'), false);
  assert.equal(h.calls.emit.length, 1); assert.equal(h.calls.emit[0], null);
  assert.equal(h.calls.sdk.length, 1); assert.equal(h.calls.sdk[0].options.scope, 'local');
  assert.equal(h.api._notificationChannel, null);
});
test('invalid-session cleanup flag does not skip a later account cleanup', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.hooks.community = async () => { entered.resolve(); return gate.promise; };
  const first = h.api._clearInvalidSession(); await entered.promise; h.transition();
  h.hooks.community = async () => true;
  await h.api._clearInvalidSession();
  assert.equal(h.api.user, null); assert.equal(h.values.has('lorefy.activeUser.v1'), false);
  gate.resolve(true); await assert.rejects(first, stale);
  assert.equal(h.calls.emit.length, 1); assert.equal(h.calls.sdk.length, 1);
});
test('repeated completed invalid-session cleanup remains idempotent', async () => {
  const h = harness(); await h.api._clearInvalidSession(); await h.api._clearInvalidSession();
  assert.equal(h.calls.sdk.length, 1); assert.equal(h.calls.emit.length, 1);
});
test('invalid-session cleanup cannot continue after a channel closes for an older account', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.hooks.channel = async () => { entered.resolve(); return gate.promise; };
  const result = h.api._clearInvalidSession(); await entered.promise; h.transition();
  const current = h.api._notificationChannel; gate.resolve(true);
  await assert.rejects(result, stale); assert.equal(h.calls.sdk.length, 0);
  assert.equal(h.values.get('lorefy.user.library.v2'), 'b-library'); assert.equal(h.api._notificationChannel, current);
});
test('same-owner transport failures do not prevent local privacy cleanup', async () => {
  for (const action of ['signOut', '_clearInvalidSession']) {
    const h = harness(); h.hooks.channel = async () => { throw Error('Offline channel'); };
    h.hooks.sdk = async () => { throw Error('Offline auth'); };
    await h.api[action](); assert.equal(h.api.user, null);
    assert.equal(h.values.has('lorefy.user.library.v2'), false); assert.equal(h.calls.emit.length, 1);
  }
});
test('demo sign-out and unavailable initialization still clear local state', async () => {
  const demo = harness(); demo.api.mode = 'demo'; await demo.api.signOut();
  assert.equal(demo.calls.sdk.length, 0); assert.equal(demo.calls.unregister, 0);
  assert.equal(demo.values.has('lorefy.user.library.v2'), false);
  const unavailable = harness(); unavailable.api.mode = 'unavailable'; unavailable.api.user = null;
  unavailable.values.delete('lorefy.activeUser.v1'); await unavailable.api._clearInvalidSession();
  assert.equal(unavailable.values.has('lorefy.user.library.v2'), false); assert.equal(unavailable.calls.emit.length, 1);
});
