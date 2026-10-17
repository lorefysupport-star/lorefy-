const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
const review = { id: 'review', workId: 'work', rating: 4, body: 'First account draft', images: ['image-1', 'image-2'] };
function harness() {
  const values = new Map([['lorefy.activeUser.v1', 'a']]), calls = { uploads: [], rpc: [], cleanup: [], hydrate: [], fetch: [], clear: 0 };
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { localStorage: storage, LOREFY_SUPABASE: { url: 'https://project.test', anonKey: 'public-qa' } };
  const context = { window, localStorage: storage, console, URL, setTimeout, clearTimeout, atob,
    fetch: async (url, options) => { calls.fetch.push({ url, options }); return { ok: true }; } };
  vm.runInNewContext(source, context);
  const api = window.LorefyBackend;
  const realUpload = api._uploadReviewMedia;
  Object.assign(api, { mode: 'live', user: { id: 'a' }, _communityEpoch: 1,
    getSession: async () => ({ userId: 'a' }),
    _uploadReviewMedia: async (owner, id, image) => { calls.uploads.push({ owner, id, image }); return owner + '/' + id + '/' + image; },
    _removeReviewMedia: async (paths, owner) => { calls.cleanup.push({ paths, owner }); },
    _hydrateReview: async row => { calls.hydrate.push(row); return row; },
    _clearInvalidSession: async () => { calls.clear++; },
    client: { auth: { getSession: async () => ({ data: { session: { user: { id: 'a' }, access_token: 'qa-a' } } }) },
      rpc: async (name, args) => { calls.rpc.push({ name, args }); return { data: { id: 'saved' } }; } }
  });
  return { api, calls, context, values, realUpload,
    switchAccount() { api.user = { id: 'b' }; api._communityEpoch++; values.set('lorefy.activeUser.v1', 'b'); } };
}
test('account change while verifying the session cannot publish the old draft as the new account', async () => {
  const h = harness(), gate = deferred(); h.api.getSession = () => gate.promise;
  const result = h.api.publishReview(review); h.switchAccount(); gate.resolve({ userId: 'b' });
  await assert.rejects(result, stale); assert.equal(h.calls.rpc.length, 0); assert.equal(h.calls.uploads.length, 0);
});
for (const transition of ['account', 'epoch', 'client', 'local-owner']) {
  test('upload completion cannot continue publication after transition: ' + transition, async () => {
    const h = harness(), entered = deferred(), gate = deferred();
    h.api._uploadReviewMedia = async () => { entered.resolve(); return gate.promise; };
    const result = h.api.publishReview(review); await entered.promise;
    if (transition === 'account') h.switchAccount();
    if (transition === 'epoch') h.api._communityEpoch++;
    if (transition === 'client') h.api.client = { ...h.api.client };
    if (transition === 'local-owner') h.values.set('lorefy.activeUser.v1', 'b');
    gate.resolve('a/review/image'); await assert.rejects(result, stale);
    assert.equal(h.calls.rpc.length, 0); assert.equal(h.calls.cleanup.length, 0);
  });
}
test('a committed RPC response after an account change is not hydrated or cleaned with the next account', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.api.client.rpc = async () => { entered.resolve(); return gate.promise; };
  const result = h.api.publishReview(review); await entered.promise; h.switchAccount(); gate.resolve({ data: { id: 'saved' } });
  await assert.rejects(result, stale); assert.equal(h.calls.hydrate.length, 0); assert.equal(h.calls.cleanup.length, 0);
});
test('account changes during media hydration reject the returned review without removing published images', async () => {
  const h = harness(), entered = deferred(), gate = deferred();
  h.api._hydrateReview = async () => { entered.resolve(); return gate.promise; };
  const result = h.api.publishReview(review); await entered.promise; h.switchAccount(); gate.resolve({ id: 'saved' });
  await assert.rejects(result, stale); assert.equal(h.calls.cleanup.length, 0);
});
test('successful publication and failed RPC cleanup still work for the same owner', async () => {
  const h = harness(); assert.equal((await h.api.publishReview(review)).id, 'saved');
  assert.equal(h.calls.uploads.length, 2); assert.equal(h.calls.rpc.length, 1); assert.equal(h.calls.cleanup.length, 0);
  h.api.client.rpc = async () => ({ error: Error('RPC failed') });
  await assert.rejects(h.api.publishReview(review), /RPC failed/);
  assert.equal(h.calls.cleanup.length, 1); assert.equal(h.calls.cleanup[0].paths.length, 2);
});
test('post-commit hydration failure never deletes images already referenced by a saved review', async () => {
  const h = harness(); h.api._hydrateReview = async () => { throw Error('Signing failed'); };
  await assert.rejects(h.api.publishReview(review), /Signing failed/); assert.equal(h.calls.cleanup.length, 0);
});
test('storage headers reject a different token owner before starting a review image request', async () => {
  const h = harness();
  h.api.client.auth.getSession = async () => ({ data: { session: { user: { id: 'b' }, access_token: 'qa-b' } } });
  await assert.rejects(h.api._storageHeaders('image/png', 'a'), stale); assert.equal(h.calls.clear, 0);
});
test('storage calls without an explicit owner still reject a token from another account', async () => {
  const h = harness();
  h.api.client.auth.getSession = async () => ({ data: { session: { user: { id: 'b' }, access_token: 'qa-b' } } });
  await assert.rejects(h.api._storageHeaders('application/json'), stale); assert.equal(h.calls.clear, 0);
});
test('the real image upload path uses only the opening owner token and object namespace', async () => {
  const h = harness(); h.api._uploadReviewMedia = h.realUpload;
  const result = await h.api.publishReview({ ...review, images: ['data:image/png;base64,YQ=='] });
  assert.equal(result.id, 'saved'); assert.equal(h.calls.fetch.length, 1);
  assert.match(h.calls.fetch[0].url, /review-media\/a\/review\//);
  assert.equal(h.calls.fetch[0].options.headers.authorization, 'Bearer qa-a');
  assert.equal(h.calls.fetch[0].options.body.byteLength, 1);
  assert.equal(h.calls.rpc.length, 1);
});
test('a stale auth failure cannot clear the next account session', async () => {
  const h = harness(), gate = deferred(); h.api.client.auth.getSession = () => gate.promise;
  const result = h.api._storageHeaders('image/png', 'a'); h.switchAccount(); gate.resolve({ error: Error('Old session'), data: {} });
  await assert.rejects(result, stale); assert.equal(h.calls.clear, 0);
});
test('real image upload rejects stale header preparation before making any HTTP request', async () => {
  const h = harness(), gate = deferred(), entered = deferred();
  // Use a second full-module instance so the real uploader and helper scope run.
  const window = { ...h.context.window };
  vm.runInNewContext(source, { ...h.context, window });
  const api = window.LorefyBackend;
  Object.assign(api, { mode: 'live', user: { id: 'a' }, client: h.api.client,
    _storageHeaders: async () => { entered.resolve(); return gate.promise; } });
  const result = api._uploadReviewMedia('a', 'review', 'data:image/png;base64,YQ==');
  await entered.promise; api.user = { id: 'b' }; h.values.set('lorefy.activeUser.v1', 'b'); gate.resolve({ authorization: 'Bearer qa-b' });
  await assert.rejects(result, stale); assert.equal(h.calls.fetch.length, 0);
});
