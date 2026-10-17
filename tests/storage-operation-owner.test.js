const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const image = 'data:image/png;base64,YQ==';
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a']]), requests = [], owners = [];
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { localStorage: storage, LOREFY_SUPABASE: { url: 'https://storage.test', anonKey: 'public-qa' }, crypto: { randomUUID: () => 'qa-image' } };
  const context = { window, localStorage: storage, URL, console, setTimeout, clearTimeout, atob,
    fetch: async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ signedURL: '/object/sign/qa' }) }; } };
  vm.runInNewContext(source, context);
  const api = window.LorefyBackend;
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1,
    client: { auth: { getSession: async () => ({ data: { session: { user: { id: 'a' }, access_token: 'qa-a' } } }) } } });
  return { api, context, requests, owners, values,
    switchAccount() { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); } };
}
const actions = {
  profile: h => h.api._uploadProfileMedia('a', 'avatar', image),
  artwork: h => h.api._uploadCustomArtwork('a', 'covers', image),
  signing: h => h.api._storageMediaUrl('custom-covers', 'other-reader/covers/image.png', 99),
  removal: h => h.api._removeReviewMedia(['a/review/image.png'])
};
for (const [name, action] of Object.entries(actions)) {
  test(name + ': stale headers cannot dispatch an HTTP request', async () => {
    const h = harness(), gate = deferred();
    h.api._storageHeaders = async (type, owner) => { h.owners.push(owner); return gate.promise; };
    const result = action(h); h.switchAccount(); gate.resolve({ authorization: 'Bearer qa-a' });
    await assert.rejects(result, stale); assert.equal(h.requests.length, 0);
  });
  for (const transition of ['account', 'client', 'epoch', 'local-owner']) {
    test(name + ': late HTTP response is rejected after ' + transition + ' change', async () => {
      const h = harness(), entered = deferred(), gate = deferred();
      h.context.fetch = async (url, options) => { h.requests.push({ url, options }); entered.resolve(); return gate.promise; };
      const result = action(h); await entered.promise;
      if (transition === 'account') h.switchAccount();
      if (transition === 'client') h.api.client = { ...h.api.client };
      if (transition === 'epoch') h.api._communityEpoch++;
      if (transition === 'local-owner') h.values.set('lorefy.activeUser.v1', 'b');
      gate.resolve({ ok: true, json: async () => ({ signedURL: '/object/sign/qa' }) });
      await assert.rejects(result, stale); assert.equal(h.requests.length, 1);
    });
  }
}
for (const name of ['profile', 'artwork']) {
  test(name + ': upload path owner must match the initiating session', async () => {
    const h = harness(); h.switchAccount();
    h.api.client.auth.getSession = async () => ({ data: { session: { user: { id: 'b' }, access_token: 'qa-b' } } });
    await assert.rejects(actions[name](h), stale); assert.equal(h.requests.length, 0);
  });
}
test('signed URL JSON arriving after an account switch cannot escape the helper', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.context.fetch = async () => ({ ok: true, json: () => { entered.resolve(); return gate.promise; } });
  const result = actions.signing(h); await entered.promise; h.switchAccount();
  gate.resolve({ signedURL: '/object/sign/private-old-response' });
  await assert.rejects(result, stale);
});
test('same-session operations retain upload policy, signing other permitted readers and deletion', async () => {
  const h = harness();
  assert.equal(await actions.profile(h), 'a/avatar.png');
  assert.equal(await actions.artwork(h), 'a/covers/qa-image.png');
  assert.equal(await actions.signing(h), 'https://storage.test/storage/v1/object/sign/qa');
  assert.equal(await actions.removal(h), true);
  assert.equal(h.requests.length, 4);
  assert.equal(h.requests[0].options.headers['x-upsert'], 'true');
  assert.equal(h.requests[1].options.headers['x-upsert'], 'false');
  assert.match(h.requests[2].url, /other-reader\/covers\/image.png$/);
  assert.equal(JSON.parse(h.requests[2].options.body).expiresIn, 99);
  assert.equal(h.requests[3].options.method, 'DELETE');
});
