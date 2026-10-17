const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

async function loadBackend({ hostname, search = '', demoAuthEnabled = true, secureStorage }) {
  const source = fs.readFileSync(path.join(root, 'backend/lorefy-backend.js'), 'utf8');
  const window = {
    LOREFY_SUPABASE: null,
    LorefySecureAuthStorage: secureStorage,
    LOREFY_FEATURES: { demoAuthEnabled },
    location: { hostname, search, href: `http://${hostname}/${search}` },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  vm.runInNewContext(source, {
    window,
    URL,
    URLSearchParams,
    Promise,
    console,
    setTimeout,
    clearTimeout
  });
  await window.LorefyBackend.init();
  return window.LorefyBackend;
}

test('demo accounts are restricted to an explicit local preview', async () => {
  const backend = await loadBackend({ hostname: 'example.com', search: '?preview=demo' });
  assert.equal(backend.mode, 'unavailable');
  assert.equal(backend.isConfigured(), false);
  assert.equal(backend.isAvailable(), false);
  await assert.rejects(backend.signInWithOAuth('google'));
});

test('local demo accounts require the explicit demo preview flag', async () => {
  const backend = await loadBackend({ hostname: 'localhost' });
  assert.equal(backend.mode, 'unavailable');

  const preview = await loadBackend({ hostname: '127.0.0.1', search: '?preview=demo' });
  assert.equal(preview.mode, 'demo');
});

test('email auth methods honor the disabled policy', async () => {
  const preview = await loadBackend({ hostname: '127.0.0.1', search: '?preview=demo' });
  await assert.rejects(preview.signUpWithEmail('reader@example.com', 'password'), /disabled by policy/i);
  await assert.rejects(preview.signInWithEmail('reader@example.com', 'password'), /disabled by policy/i);
  await assert.rejects(preview.requestPasswordReset('reader@example.com'), /disabled by policy/i);
});

test('production config cannot enable demo auth accidentally', () => {
  const config = fs.readFileSync(path.join(root, 'config/lorefy-config.js'), 'utf8');
  const backend = fs.readFileSync(path.join(root, 'backend/lorefy-backend.js'), 'utf8');
  const appleBridge = fs.readFileSync(path.join(root, 'backend/lorefy-ios-bridge.js'), 'utf8');
  assert.match(config, /demoAuthEnabled:\s*true/);
  assert.match(config, /preview=demo/);
  assert.match(backend, /_requireEmailAuth/);
  assert.match(backend, /emailAuth/);
  assert.match(appleBridge, /getRandomValues/);
  assert.match(appleBridge, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(appleBridge, /nonce:\s*hashedNonce/);
  assert.match(appleBridge, /nonce:\s*rawNonce/);
  assert.doesNotMatch(appleBridge, /state:\s*["']lorefy-auth["']/);
});

test('temporary auth network failure never signs out or clears account data', async () => {
  const backend = await loadBackend({ hostname:'localhost' });
  let cleared = false;
  backend.mode = 'live';
  backend._clearInvalidSession = async () => { cleared = true; };
  backend.client = { auth:{ getUser:async () => ({ data:{ user:null }, error:{ name:'AuthRetryableFetchError', status:0 } }) } };
  await assert.rejects(backend.getSession());
  assert.equal(cleared, false);
});

test('native sign-in cannot use the web fallback before its provider bridge is ready', async () => {
  const backend = await loadBackend({ hostname: 'localhost' });
  backend.mode = 'live';
  let redirects = 0;
  backend.client = { auth: { signInWithOAuth: async () => { redirects += 1; return { data: {} }; } } };
  // The source must independently guard the native runtime, not rely on a provider script loading.
  const source = fs.readFileSync(path.join(root, 'backend/lorefy-backend.js'), 'utf8');
  const window = { Capacitor: { isNativePlatform: () => true }, LOREFY_FEATURES: { oauthProviders: { google: { enabled: true }, apple: { enabled: true } } }, location: { href: 'https://localhost/' }, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
  vm.runInNewContext(source, { window, location: window.location, URL, URLSearchParams, Promise, console, setTimeout, clearTimeout });
  const native = window.LorefyBackend;
  native.mode = 'live'; native.client = backend.client;
  await assert.rejects(native.signInWithOAuth('google'), /جاهز|تهيئة|ready/i);
  await assert.rejects(native.signInWithOAuth('apple'), /جاهز|تهيئة|ready/i);
  assert.equal(redirects, 0);
});

test('signed-out session checks do not repeatedly call the logout endpoint', async () => {
  const backend = await loadBackend({ hostname: 'localhost' });
  backend.mode = 'live';
  let logouts = 0, remoteChecks = 0;
  backend.client = { auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => { remoteChecks += 1; return { data: { user: null }, error: { name: 'AuthSessionMissingError' } }; },
    signOut: async () => { logouts += 1; }
  } };
  for (let i = 0; i < 4; i += 1) assert.equal(await backend.getSession(), null);
  assert.equal(logouts, 0);
  assert.equal(remoteChecks, 0);
});

test('concurrent session verification shares one remote request', async () => {
  const backend = await loadBackend({ hostname: 'localhost' });
  backend.mode = 'live';
  let requests = 0;
  backend.client = { auth: { getUser: async () => { requests += 1; await new Promise(resolve => setTimeout(resolve, 10)); return { data: { user: { id: 'owner' } } }; } } };
  const result = await Promise.all([backend.getSession(), backend.getSession(), backend.getSession()]);
  assert.equal(requests, 1);
  assert.ok(result.every(value => value.userId === 'owner'));
});

test('Apple authorization survives reload in secure storage and is only sent by its owner', async () => {
  const values = new Map();
  const storage = {
    getItem: async key => values.get(key) || null,
    setItem: async (key, value) => values.set(key, value),
    removeItem: async key => values.delete(key)
  };
  const first = await loadBackend({ hostname: 'localhost', secureStorage: storage });
  first.user = { id: 'owner' };
  await first.queueAppleAuthorization('apple-one-time-authorization');
  assert.equal(values.size, 1);
  const rebooted = await loadBackend({ hostname: 'localhost', secureStorage: storage });
  let registrations = 0;
  rebooted.registerAppleAuthorization = async code => { assert.equal(code, 'apple-one-time-authorization'); registrations += 1; };
  await rebooted.flushAppleAuthorization('other-owner');
  assert.equal(registrations, 0);
  assert.equal(values.size, 1);
  await rebooted.flushAppleAuthorization('owner');
  assert.equal(registrations, 1);
  assert.equal(values.size, 0);
});

test('failed Apple authorization registration retains its secure retry record', async () => {
  let value;
  const storage = { getItem: async () => value, setItem: async (_key, raw) => { value = raw; }, removeItem: async () => { value = null; } };
  const backend = await loadBackend({ hostname: 'localhost', secureStorage: storage });
  backend.user = { id: 'owner' };
  await backend.queueAppleAuthorization('apple-one-time-authorization');
  backend.registerAppleAuthorization = async () => { throw new Error('temporary network failure'); };
  await assert.rejects(backend.flushAppleAuthorization('owner'));
  assert.ok(value);
  assert.equal(backend._appleAuthorizationRunning, false);
});

test('Supabase requests abort at the deadline instead of leaving auth locked indefinitely', async () => {
  let options, deadline;
  const source = fs.readFileSync(path.join(root, 'backend/lorefy-backend.js'), 'utf8');
  const window = {
    LOREFY_SUPABASE: { url: 'https://project.supabase.co', anonKey: 'public-test-key' },
    supabase: { createClient: (_url, _key, config) => { options = config; return { auth: { onAuthStateChange: () => {} } }; } },
    AbortController,
    fetch: (_input, request) => new Promise((_resolve, reject) => request.signal.addEventListener('abort', () => reject(new Error('request aborted')))),
    setTimeout: (callback, ms) => { deadline = ms; return setTimeout(callback, 5); }, clearTimeout,
    location: { href: 'https://app.example.test/' },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  };
  vm.runInNewContext(source, { window, location: window.location, URL, URLSearchParams, Promise, console, setTimeout, clearTimeout });
  await window.LorefyBackend.init();
  await assert.rejects(options.global.fetch('https://project.supabase.co/auth/v1/user'), /request aborted/);
  assert.equal(deadline, 15000);
});

test('a revoked session is cleared instead of reused', async () => {
  const backend = await loadBackend({ hostname:'localhost' });
  let cleared = false;
  backend.mode = 'live';
  backend._clearInvalidSession = async () => { cleared = true; };
  backend.client = { auth:{ getUser:async () => ({ data:{ user:null }, error:{ code:'session_not_found', status:403 } }) } };
  assert.equal(await backend.getSession(), null);
  assert.equal(cleared, true);
});

test('saving an existing profile submits a username change through the owner RPC', async () => {
  const backend = await loadBackend({ hostname:'localhost' });
  backend.mode = 'live';
  backend.user = { id:'owner' };
  let submitted;
  backend._uploadProfileMedia = async () => '';
  backend._profileMediaUrl = async () => '';
  backend.client = {
    auth:{ getUser:async () => ({ data:{ user:{ id:'owner' } } }) },
    from:() => ({ select:() => ({ eq:() => ({ maybeSingle:async () => ({ data:{ username:'original' } }) }) }) }),
    rpc:async (name,args) => { submitted={name,args};return {data:{username:'replacement'}}; }
  };
  const result=await backend.saveProfile({ un:'@Replacement' });
  assert.equal(submitted.name,'save_my_profile');
  assert.equal(submitted.args.requested_username,'replacement');
  assert.equal(result.username,'replacement');
});

for (const [message, code] of [['username_change_cooldown','LOREFY_USERNAME_COOLDOWN'],['username_taken','LOREFY_USERNAME_TAKEN']]) {
  test(`profile saving surfaces ${code} without claiming a saved identity`, async () => {
    const backend = await loadBackend({ hostname:'localhost' });
    backend.mode = 'live';
    backend.user = { id:'owner' };
    backend._uploadProfileMedia = async () => '';
    backend.client = {
      auth:{ getUser:async () => ({ data:{ user:{ id:'owner' } } }) },
      from:() => ({ select:() => ({ eq:() => ({ maybeSingle:async () => ({ data:{ username:'original' } }) }) }) }),
      rpc:async () => ({ error:{ message } })
    };
    await assert.rejects(backend.saveProfile({ un:'replacement' }), error => error.code === code);
  });
}

test('an invalid replacement handle is rejected before uploading media or calling the RPC', async () => {
  const backend = await loadBackend({ hostname:'localhost' });
  backend.mode = 'live';
  backend.user = { id:'owner' };
  let writes = 0;
  backend._uploadProfileMedia = async () => { writes++; };
  backend.client = {
    auth:{ getUser:async () => ({ data:{ user:{ id:'owner' } } }) },
    from:() => ({ select:() => ({ eq:() => ({ maybeSingle:async () => ({ data:{ username:'original' } }) }) }) }),
    rpc:async () => { writes++; }
  };
  await assert.rejects(backend.saveProfile({ un:'bad handle!' }), error => error.code === 'LOREFY_USERNAME_INVALID');
  assert.equal(writes,0);
});
