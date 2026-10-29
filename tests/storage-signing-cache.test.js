const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const stale = error => error.code === 'LOREFY_SESSION_INVALID';
const image = 'data:image/png;base64,YQ==';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

function harness() {
  let now = 100000, authCalls = 0;
  const values = new Map([['lorefy.activeUser.v1', 'a']]), requests = [];
  const storage = { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
  const window = { localStorage: storage, LOREFY_SUPABASE: { url: 'https://storage.test', anonKey: 'public-qa' } };
  const context = { window, localStorage: storage, URL, console, setTimeout, clearTimeout, atob,
    Date: class extends Date { static now() { return now; } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => ({ signedURL: '/object/sign/qa?token=fixture-' + requests.length }) };
    } };
  vm.runInNewContext(source, context);
  const api = window.LorefyBackend;
  api.mode = 'live'; api.user = { id: 'a' }; api._communityEpoch = 1;
  api.client = { auth: { getSession: async () => { authCalls++; return { data: { session: { user: { id: api.user.id }, access_token: 'fixture' } } }; } } };
  return { api, context, values, requests, window, advance: ms => { now += ms; }, authCalls: () => authCalls,
    sign: (bucket = 'profile-media', object = 'a/avatar.png', ttl = 86400) => api._storageMediaUrl(bucket, object, ttl) };
}

test('twenty simultaneous avatar consumers share one signing request and reuse its exact URL', async () => {
  const h = harness();
  const urls = await Promise.all(Array.from({ length: 20 }, () => h.sign()));
  assert.equal(h.requests.length, 1);
  assert.equal(new Set(urls).size, 1);
  assert.equal(await h.sign(), urls[0]);
  assert.equal(h.requests.length, 1);
  assert.equal(h.authCalls(), 21, 'cache hits still validate the current session');
  assert.equal(h.values.size, 1, 'signed URLs must not enter localStorage');
});

test('cache lifetime is at most one minute and ends before a short signed URL expires', async () => {
  const h = harness();
  await h.sign(); h.advance(59999); await h.sign(); assert.equal(h.requests.length, 1);
  h.advance(1); await h.sign(); assert.equal(h.requests.length, 2);
  await h.sign('profile-media', 'a/short.png', 10);
  h.advance(5000); await h.sign('profile-media', 'a/short.png', 10);
  assert.equal(h.requests.length, 4);
});

test('bucket, path, lifetime and project are separate cache identities', async () => {
  const h = harness();
  await h.sign(); await h.sign('custom-covers'); await h.sign('profile-media', 'a/banner.png');
  await h.sign('profile-media', 'a/avatar.png', 3600);
  h.window.LOREFY_SUPABASE.url = 'https://other-project.test'; await h.sign();
  assert.equal(h.requests.length, 5);
});

for (const transition of ['owner', 'client', 'epoch', 'active']) {
  test('cached and in-flight signing stay isolated after ' + transition + ' changes', async () => {
    const h = harness(); await h.sign();
    const changed = () => {
      if (transition === 'owner') { const id = h.api.user.id === 'a' ? 'b' : 'a'; h.api.user = { id }; h.values.set('lorefy.activeUser.v1', id); }
      if (transition === 'client') h.api.client = { ...h.api.client };
      if (transition === 'epoch') h.api._communityEpoch++;
      if (transition === 'active') h.values.delete('lorefy.activeUser.v1');
    };
    changed(); await h.sign(); assert.equal(h.requests.length, 2);
    const gate = deferred(), entered = deferred();
    h.context.fetch = async () => { entered.resolve(); return gate.promise; };
    const pending = h.sign('profile-media', 'other-reader/avatar.png'); await entered.promise;
    if (transition === 'active') h.values.set('lorefy.activeUser.v1', h.api.user.id);
    else changed();
    gate.resolve({ ok: true, json: async () => ({ signedURL: '/old' }) });
    await assert.rejects(pending, stale);
  });
}

test('denials, network failures and empty signatures can be retried instead of being cached', async () => {
  for (const failure of ['denied', 'network', 'empty']) {
    const h = harness(), goodFetch = h.context.fetch;
    h.context.fetch = async () => {
      if (failure === 'network') throw new Error('offline');
      return { ok: failure === 'empty', json: async () => ({ message: 'denied' }) };
    };
    if (failure === 'empty') assert.equal(await h.sign(), '');
    else await assert.rejects(h.sign());
    h.context.fetch = goodFetch;
    assert.match(await h.sign(), /fixture/);
    assert.equal(h.requests.length, 1);
  }
});

test('a successful profile replacement or review deletion invalidates signed URL reuse', async () => {
  const h = harness();
  const first = await h.sign();
  await h.api._uploadProfileMedia('a', 'avatar', image);
  assert.notEqual(await h.sign(), first);
  const review = await h.sign('review-media', 'a/review/image.png');
  await h.api._removeReviewMedia(['a/review/image.png']);
  assert.notEqual(await h.sign('review-media', 'a/review/image.png'), review);
});

test('a signature started before upload cannot repopulate the invalidated cache', async () => {
  const h = harness(), gate = deferred(), entered = deferred(), goodFetch = h.context.fetch;
  h.context.fetch = async (url, options) => {
    if (url.includes('/sign/')) { entered.resolve(); return gate.promise; }
    return goodFetch(url, options);
  };
  const pending = h.sign(); await entered.promise;
  await h.api._uploadProfileMedia('a', 'avatar', image);
  gate.resolve({ ok: true, json: async () => ({ signedURL: '/old-signature' }) });
  await pending; h.context.fetch = goodFetch;
  assert.doesNotMatch(await h.sign(), /old-signature/);
});

test('cache is bounded and evicts old entries rather than retaining every viewed image', async () => {
  const h = harness();
  for (let i = 0; i < 257; i++) await h.sign('profile-media', 'reader-' + i + '/avatar.png');
  await h.sign('profile-media', 'reader-0/avatar.png');
  assert.equal(h.requests.length, 258);
  await h.sign('profile-media', 'reader-256/avatar.png');
  assert.equal(h.requests.length, 258);
});

test('a cache hit still rejects an auth result arriving after account switch', async () => {
  const h = harness(); await h.sign();
  const gate = deferred(); h.api._storageHeaders = () => gate.promise;
  const pending = h.sign(); h.api._communityEpoch++;
  gate.resolve({}); await assert.rejects(pending, stale);
  assert.equal(h.requests.length, 1);
});

test('sign out discards cached signatures before releasing the old session', async () => {
  const h = harness(); await h.sign();
  h.api.client.auth.signOut = async () => ({});
  h.api.stopSync = () => {};
  h.api._emit = () => {};
  await h.api.signOut();
  assert.equal(h.api._mediaUrlCache, null);
  assert.equal(h.api.user, null);
});

test('expired authentication cannot be bypassed by a previously cached signature', async () => {
  const h = harness(); await h.sign();
  h.api._clearInvalidSession = async () => { h.api._mediaUrlCache = null; };
  h.api.client.auth.getSession = async () => ({ data: { session: null } });
  await assert.rejects(h.sign(), stale);
  assert.equal(h.requests.length, 1);
});
