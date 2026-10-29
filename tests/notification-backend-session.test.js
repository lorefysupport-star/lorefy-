const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const id = '11111111-1111-4111-8111-111111111111';
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a']]), calls = [], channels = [], removed = [];
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { localStorage: storage };
  vm.runInNewContext(source, { window, localStorage: storage, URL, console, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  const hooks = { session: async () => ({ userId: api.user.id }),
    write: async kind => ({ data: kind === 'query' ? [{ id: 'own', actor_id: 'a' }, { id: 'system', actor_id: null }, { id: 'other', actor_id: 'reader' }] : kind === 'mark_notifications_read' ? 2 : true }),
    remove: async () => true };
  function client(label) {
    return { rpc: async (name, args) => { calls.push({ name, args, client: label }); return hooks.write(name); },
      from: table => { const filters = {}; return { select() { return this; }, eq(k, v) { filters[k] = v; return this; }, order() { return this; },
        limit: async limit => { calls.push({ name: 'query', table, filters, limit, client: label }); return hooks.write('query'); } }; },
      channel: name => { const channel = { name, client: label, handlers: {}, on(event, filter, listener) { this.handlers[filter.event] = {filter,listener}; if(filter.event==='INSERT'){this.filter = filter; this.listener = listener;} return this; }, subscribe(state) { this.state = state; channels.push(this); return this; } }; return channel; },
      removeChannel: async channel => { removed.push({ channel, client: label }); return hooks.remove(); } };
  }
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1, getSession: () => hooks.session(), client: client('first') });
  return { api, hooks, calls, channels, removed, client,
    transition(kind = 'account') {
      if (kind === 'account') { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); }
      if (kind === 'client') api.client = client('second');
      if (kind === 'epoch') api._communityEpoch++;
      if (kind === 'local-owner') values.set('lorefy.activeUser.v1', 'b');
    } };
}
const actions = {
  register: h => h.api.registerPushDevice({ installationId: id, token: 'qa'.repeat(32), platform: 'ios', environment: 'development', locale: 'en', appVersion: 'qa' }),
  unregister: h => h.api.unregisterPushDevice(id),
  list: h => h.api.listNotifications(12),
  read: h => h.api.markNotificationsRead([id])
};
for (const name of ['register', 'list']) for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
  test(name + ': ' + transition + ' during auth prevents a subsequent request', async () => {
    const h = harness(), entered = deferred(), gate = deferred();
    h.hooks.session = async () => { entered.resolve(); return gate.promise; };
    const result = actions[name](h); await entered.promise; h.transition(transition); gate.resolve({ userId: 'a' });
    await assert.rejects(result, stale); assert.equal(h.calls.length, 0);
  });
}
for (const [name, action] of Object.entries(actions)) for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
  test(name + ': late database result is rejected after ' + transition + ' change', async () => {
    const h = harness(), entered = deferred(), gate = deferred();
    h.hooks.write = async () => { entered.resolve(); return gate.promise; };
    const result = action(h); await entered.promise; h.transition(transition);
    gate.resolve({ data: name === 'list' ? [{ id: 'private-old', actor_id: null }] : true });
    await assert.rejects(result, stale); assert.equal(h.calls.length, 1);
  });
}
for (const name of ['register', 'list']) test(name + ': session user must match the opening owner', async () => {
  const h = harness(); h.hooks.session = async () => ({ userId: 'b' });
  await assert.rejects(actions[name](h), stale); assert.equal(h.calls.length, 0);
});
test('same-session device metadata, self-event filtering and read selection are preserved', async () => {
  const h = harness(); assert.equal(await actions.register(h), true); assert.equal(await actions.unregister(h), true);
  assert.deepEqual(Array.from(await actions.list(h), row => row.id), ['system', 'other']);
  assert.equal(await actions.read(h), 2);
  assert.equal(h.calls[0].args.installation_ref, id); assert.equal(h.calls[0].args.push_environment, 'development');
  assert.equal(h.calls[0].args.device_locale, 'en'); assert.equal(h.calls[1].name, 'unregister_push_device');
  assert.equal(h.calls[2].filters.user_id, 'a'); assert.equal(h.calls[2].limit, 12);
  assert.equal(h.calls[3].args.notification_ids[0], id);
});
test('device and inbox service errors remain failures', async () => {
  for (const action of Object.values(actions)) { const h = harness(); h.hooks.write = async () => ({ error: Error('Denied') }); await assert.rejects(action(h), /Denied/); }
});
for (const transition of ['account', 'client', 'epoch', 'local-owner']) test('subscription auth cannot finish after ' + transition + ' change', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.hooks.session = async () => { entered.resolve(); return gate.promise; };
  const result = h.api.subscribeNotifications(() => {}); await entered.promise; h.transition(transition); gate.resolve({ userId: 'a' });
  await assert.rejects(result, stale); assert.equal(h.channels.length, 0);
});
test('old subscription callbacks are suppressed after account switch or unsubscribe', async () => {
  const h = harness(), received = [];
  const stop = await h.api.subscribeNotifications(row => received.push(row.id));
  const channel = h.channels[0];
  channel.listener({ new: { id: 'own', actor_id: 'a' } });
  channel.listener({ new: { id: 'system', actor_id: null } });
  assert.deepEqual(received, ['system']);
  h.transition(); channel.listener({ new: { id: 'old-account', actor_id: 'reader' } });
  stop(); channel.listener({ new: { id: 'after-stop', actor_id: 'reader' } });
  assert.deepEqual(received, ['system']);
});
test('awaiting old-channel removal cannot install a subscription after account switch', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  await h.api.subscribeNotifications(() => {});
  h.hooks.remove = async () => { entered.resolve(); return gate.promise; };
  const result = h.api.subscribeNotifications(() => {}); await entered.promise; h.transition(); gate.resolve(true);
  await assert.rejects(result, stale); assert.equal(h.channels.length, 1);
});
test('late same-account subscription attempt cannot replace a newer completed attempt', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.hooks.session = async () => { entered.resolve(); return gate.promise; };
  const first = h.api.subscribeNotifications(() => {}); await entered.promise;
  h.hooks.session = async () => ({ userId: 'a' });
  const stopNew = await h.api.subscribeNotifications(() => {}); const current = h.api._notificationChannel;
  gate.resolve({ userId: 'a' }); const stopOld = await first;
  assert.equal(h.api._notificationChannel, current); assert.equal(h.channels.length, 1);
  stopOld(); assert.equal(h.api._notificationChannel, current); stopNew();
});
test('channel replacement and old cleanup use the creating client and leave the new subscription intact', async () => {
  const h = harness(), received = [];
  const stopOld = await h.api.subscribeNotifications(() => received.push('old'));
  const old = h.channels[0]; h.transition('client');
  const stopNew = await h.api.subscribeNotifications(() => received.push('new'));
  const current = h.api._notificationChannel;
  assert.equal(h.removed[0].channel, old); assert.equal(h.removed[0].client, 'first');
  stopOld(); assert.equal(h.removed.at(-1).client, 'first'); assert.equal(h.api._notificationChannel, current);
  old.listener({ new: { actor_id: 'reader' } }); current.listener({ new: { actor_id: 'reader' } });
  assert.deepEqual(received, ['new']); stopNew(); assert.equal(h.api._notificationChannel, null);
});
test('a replacement waiting on removal cannot overwrite a newer subscription', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  await h.api.subscribeNotifications(() => {});
  h.hooks.remove = async () => { entered.resolve(); return gate.promise; };
  const pending = h.api.subscribeNotifications(() => {}); await entered.promise;
  h.hooks.remove = async () => true;
  const stopNew = await h.api.subscribeNotifications(() => {}), current = h.api._notificationChannel;
  gate.resolve(true); const stopOld = await pending;
  assert.equal(h.channels.length, 2); assert.equal(h.api._notificationChannel, current);
  stopOld(); assert.equal(h.api._notificationChannel, current); stopNew();
});
test('subscription session owner must match and cleanup absorbs an async transport rejection', async () => {
  const h = harness(); h.hooks.session = async () => ({ userId: 'b' });
  await assert.rejects(h.api.subscribeNotifications(() => {}), stale); assert.equal(h.channels.length, 0);
  h.hooks.session = async () => ({ userId: 'a' });
  const stop = await h.api.subscribeNotifications(() => {});
  h.hooks.remove = async () => { throw Error('Transport unavailable'); };
  stop(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.api._notificationChannel, null);
});
test('sign-out removes the notification channel with the client that created it', async () => {
  const h = harness(); await h.api.subscribeNotifications(() => {}); h.transition('client');
  await h.api.signOut(); assert.equal(h.removed[0].client, 'first');
  assert.equal(h.api._notificationChannel, null); assert.equal(h.api._notificationChannelClient, null);
});
test('non-live notification operations retain their local no-op contracts', async () => {
  const h = harness(); h.api.mode = 'demo';
  assert.equal(await actions.register(h), false); assert.equal(await actions.unregister(h), false);
  assert.deepEqual(Array.from(await actions.list(h)), []); assert.equal(await actions.read(h), 0);
  assert.equal(typeof await h.api.subscribeNotifications(() => {}), 'function'); assert.equal(h.calls.length, 0);
});

test('notification read updates retain the owner filter and carry an UPDATE discriminator', async () => {
  const h = harness(), received = [];
  await h.api.subscribeNotifications((row, change) => received.push({ row, change }));
  const update = h.channels[0].handlers.UPDATE;
  assert.ok(update, 'subscribe to read-state changes, not only inserts');
  assert.equal(update.filter.filter, 'user_id=eq.a');
  update.listener({ new: { id, user_id:'a', actor_id:'reader', read_at:'2026-10-30T00:00:00Z' } });
  assert.equal(received[0].change.event, 'UPDATE');
  assert.equal(received[0].row.id, id);
});

test('subscription state callbacks stop on account change, replacement and unsubscribe', async () => {
  const h = harness(), states = [];
  const stop = await h.api.subscribeNotifications(() => {}, status => states.push(status));
  const channel = h.channels[0];
  assert.equal(typeof channel.state, 'function');
  channel.state('SUBSCRIBED');
  h.transition(); channel.state('SUBSCRIBED'); stop(); channel.state('SUBSCRIBED');
  assert.deepEqual(states, ['SUBSCRIBED']);
});
