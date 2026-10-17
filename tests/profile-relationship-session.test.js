const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const targetId = '22222222-2222-4222-8222-222222222222';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a']]), writes = [];
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { localStorage: storage };
  vm.runInNewContext(source, { window, localStorage: storage, URL, console, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  const hooks = { session: async () => ({ userId: 'a' }), write: async () => ({ error: null }) };
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1,
    getSession: () => hooks.session(),
    client: { from: table => {
      const filters = {};
      return { upsert: async (row, options) => { writes.push({ table, kind: 'upsert', row, options }); return hooks.write(); },
        delete() { return this; }, eq(key, value) { filters[key] = value; return this; },
        then(resolve, reject) { writes.push({ table, kind: 'delete', filters }); return hooks.write().then(resolve, reject); } };
    } } });
  return { api, hooks, writes, values,
    transition(kind) {
      if (kind === 'account') { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); }
      if (kind === 'client') api.client = { ...api.client };
      if (kind === 'epoch') api._communityEpoch++;
      if (kind === 'local-owner') values.set('lorefy.activeUser.v1', 'b');
    } };
}
const actions = {
  follow: h => h.api.toggleProfileFollow(targetId, true),
  unfollow: h => h.api.toggleProfileFollow(targetId, false),
  block: h => h.api.setProfileBlock(targetId, true),
  unblock: h => h.api.setProfileBlock(targetId, false)
};
for (const [name, action] of Object.entries(actions)) {
  for (const phase of ['session', 'write']) {
    for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
      test(name + ': ' + transition + ' during ' + phase + ' cannot authorize or confirm an old request', async () => {
        const h = harness(), entered = deferred(), gate = deferred();
        h.hooks[phase] = async () => { entered.resolve(); return gate.promise; };
        const result = action(h); await entered.promise; h.transition(transition);
        gate.resolve(phase === 'session' ? { userId: 'a' } : { error: null });
        await assert.rejects(result, stale); assert.equal(h.writes.length, phase === 'session' ? 0 : 1);
      });
    }
  }
  test(name + ': auth must identify the opening owner', async () => {
    const h = harness(); h.hooks.session = async () => ({ userId: 'b' });
    await assert.rejects(action(h), stale); assert.equal(h.writes.length, 0);
  });
  test(name + ': same-account writes retain actor, target and result', async () => {
    const h = harness(); assert.equal(await action(h), name === 'follow' || name === 'block');
    assert.equal(h.writes.length, 1);
    const write = h.writes[0], follow = /follow/.test(name);
    assert.equal(write.table, follow ? 'profile_follows' : 'profile_blocks');
    const row = write.kind === 'upsert' ? write.row : write.filters;
    assert.equal(row[follow ? 'follower_id' : 'blocker_id'], 'a');
    assert.equal(row[follow ? 'following_id' : 'blocked_id'], targetId);
  });
  test(name + ': service rejection stays a failure', async () => {
    const h = harness(); h.hooks.write = async () => ({ error: Error('Denied') });
    await assert.rejects(action(h), /Denied/);
  });
}
test('demo follow toggles retain local behavior without cloud queries', async () => {
  const h = harness(); h.api.mode = 'demo';
  assert.equal(await actions.follow(h), true); assert.equal(await actions.unfollow(h), false);
  assert.deepEqual(JSON.parse(h.values.get('lorefy.user.following.v1')), []); assert.equal(h.writes.length, 0);
});
