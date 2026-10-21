const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
const draft = { name: 'First account name', un: 'reader_a', bio: 'First account bio', avatar: 'a/avatar.png', banner: 'a/banner.png' };
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a'], ['lorefy.identity.v1', JSON.stringify({ name: 'First', isPrivate: false })]]);
  const calls = { writes: [], query: [], rpc: [], upload: [], sign: [], clear: 0, push: 0 };
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => { calls.writes.push(k); values.set(k, String(v)); }, removeItem() {} };
  const window = { localStorage: storage };
  vm.runInNewContext(source, { window, localStorage: storage, console, URL, setTimeout, clearTimeout });
  const api = window.LorefyBackend;
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1,
    client: { auth: { getUser: async () => ({ data: { user: { id: 'a' } } }) },
      from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => { calls.query.push('profile'); return { data: { name: 'First', username: 'reader_a', avatar: 'a/avatar.png', banner: 'a/banner.png', is_private: false } }; } }),
      rpc: async (name, args) => { calls.rpc.push({ name, args }); return { data: { username: 'reader_a', avatar: 'a/avatar.png', banner: 'a/banner.png', is_private: args.profile_is_private } }; } },
    _uploadProfileMedia: async (owner, kind, value) => { calls.upload.push({ owner, kind }); return value; },
    _profileMediaUrl: async value => { calls.sign.push(value); return 'signed:' + value; },
    _clearInvalidSession: async () => { calls.clear++; }, push: async () => { calls.push++; return true; } });
  return { api, calls, values,
    switchAccount() { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); values.set('lorefy.identity.v1', '{"name":"Second","isPrivate":false}'); } };
}

for (const action of ['saveProfile', 'setProfilePrivacy']) {
  test(action + ': stale auth result cannot begin another profile request or clear the next session', async () => {
    for (const failed of [false, true]) {
      const h = harness(), gate = deferred(); h.api.client.auth.getUser = () => gate.promise;
      const result = h.api[action](action === 'saveProfile' ? draft : true); h.switchAccount();
      gate.resolve(failed ? { error: Error('Old auth failed'), data: {} } : { data: { user: { id: 'a' } } });
      await assert.rejects(result, stale); assert.equal(h.calls.query.length, 0); assert.equal(h.calls.clear, 0); assert.equal(h.calls.rpc.length, 0);
    }
  });
  for (const transition of ['account', 'client', 'epoch']) {
    test(action + ': profile read cannot resume after ' + transition + ' changes', async () => {
      const h = harness(), gate = deferred(), entered = deferred();
      h.api.client.from = () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => { entered.resolve(); return gate.promise; } });
      const result = h.api[action](action === 'saveProfile' ? draft : true); await entered.promise;
      if (transition === 'account') h.switchAccount();
      if (transition === 'client') h.api.client = { ...h.api.client };
      if (transition === 'epoch') h.api._communityEpoch++;
      gate.resolve({ data: { username: 'reader_a' } }); await assert.rejects(result, stale);
      assert.equal(h.calls.upload.length, 0); assert.equal(h.calls.rpc.length, 0); assert.equal(h.calls.writes.length, 0);
    });
  }
}
for (const phase of ['avatar', 'banner']) {
  test('profile upload after account switch cannot upload the next image or call save RPC: ' + phase, async () => {
    const h = harness(), gate = deferred(), entered = deferred();
    h.api._uploadProfileMedia = async (owner, kind) => { h.calls.upload.push(kind); if (kind === phase) { entered.resolve(); return gate.promise; } return owner + '/' + kind; };
    const result = h.api.saveProfile(draft); await entered.promise; h.switchAccount(); gate.resolve('a/' + phase);
    await assert.rejects(result, stale); assert.equal(h.calls.rpc.length, 0);
    assert.equal(h.calls.upload.length, phase === 'avatar' ? 1 : 2);
  });
}
test('stale profile RPC success or foreign-key error cannot hydrate data or clear a new session', async () => {
  for (const failed of [false, true]) {
    const h = harness(), gate = deferred(), entered = deferred();
    h.api.client.rpc = async () => { entered.resolve(); return gate.promise; };
    const result = h.api.saveProfile(draft); await entered.promise; h.switchAccount();
    gate.resolve(failed ? { error: { code: '23503' } } : { data: { username: 'reader_a' } });
    await assert.rejects(result, stale); assert.equal(h.calls.sign.length, 0); assert.equal(h.calls.clear, 0);
  }
});
test('profile signing cannot return an old result or start the next signing request', async () => {
  const h = harness(), gate = deferred(), entered = deferred();
  h.api._profileMediaUrl = async value => { h.calls.sign.push(value); entered.resolve(); return gate.promise; };
  const result = h.api.saveProfile(draft); await entered.promise; h.switchAccount(); gate.resolve('old-avatar-url');
  await assert.rejects(result, stale); assert.equal(h.calls.sign.length, 1);
});
test('privacy result cannot overwrite the next account identity after saveProfile completes', async () => {
  const h = harness(), gate = deferred(), entered = deferred();
  h.api.saveProfile = async () => { entered.resolve(); return gate.promise; };
  const result = h.api.setProfilePrivacy(true); await entered.promise; h.switchAccount(); gate.resolve({ isPrivate: true });
  await assert.rejects(result, stale); assert.equal(h.calls.writes.length, 0);
  assert.equal(JSON.parse(h.values.get('lorefy.identity.v1')).isPrivate, false);
});
test('onboarding cannot persist the old profile or preferences after switching accounts during save', async () => {
  const h = harness(), gate = deferred(), entered = deferred();
  h.api.saveProfile = async () => { entered.resolve(); return gate.promise; };
  const result = h.api.completeOnboarding(draft, { formats: ['Book'] }); await entered.promise; h.switchAccount(); gate.resolve({});
  await assert.rejects(result, stale); assert.equal(h.calls.writes.length, 0); assert.equal(h.calls.push, 0);
});
test('unchanged owner still saves profile, privacy and onboarding', async () => {
  const h = harness();
  assert.equal((await h.api.saveProfile(draft)).username, 'reader_a');
  assert.equal(await h.api.setProfilePrivacy(true), true);
  assert.equal(JSON.parse(h.values.get('lorefy.identity.v1')).isPrivate, true);
  const result = await h.api.completeOnboarding(draft, { formats: ['Book'] });
  assert.equal(result.profile.name, draft.name); assert.equal(h.calls.push, 1);
});
test('verified auth identity must match the opening owner even before local auth state catches up', async () => {
  const h = harness(); h.api.client.auth.getUser = async () => ({ data: { user: { id: 'b' } } });
  await assert.rejects(h.api.saveProfile(draft), stale); assert.equal(h.calls.query.length, 0); assert.equal(h.calls.rpc.length, 0);
});
test('a profile mutation with no opening owner fails before contacting the cloud', async () => {
  const h = harness(); h.api.user = null; h.values.delete('lorefy.activeUser.v1');
  h.api.client.auth.getUser = async () => { throw Error('must not query'); };
  await assert.rejects(h.api.saveProfile(draft), stale); assert.equal(h.calls.rpc.length, 0);
});

test('explicitly clearing profile media does not restore the previous storage path',()=>{
 const h=harness();
 assert.equal(h.api._profileMediaPath('a','banner','','a/banner.jpg'),'');
 assert.equal(h.api._profileMediaPath('a','avatar','','a/avatar.jpg'),'');
 assert.equal(h.api._profileMediaPath('a','banner',undefined,'a/banner.jpg'),'a/banner.jpg');
});
