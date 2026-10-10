const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const googleSource = fs.readFileSync(path.join(root, 'backend', 'lorefy-ios-oauth.js'), 'utf8');
const appleSource = fs.readFileSync(path.join(root, 'backend', 'lorefy-ios-bridge.js'), 'utf8');
const secureStorageSource = fs.readFileSync(path.join(root, 'backend', 'lorefy-secure-storage.js'), 'utf8');
const nativeCryptoSource = fs.readFileSync(path.join(root, 'backend', 'lorefy-native-crypto.js'), 'utf8');
const sdkContext = { console, URL, URLSearchParams, Headers, Response, Request, fetch, AbortController, TextEncoder, TextDecoder, crypto: globalThis.crypto, setTimeout, clearTimeout, setInterval, clearInterval, atob, btoa, WebSocket };
vm.runInNewContext(fs.readFileSync(path.join(root, 'vendor/supabase.js'), 'utf8'), sdkContext);
const { createClient } = sdkContext.supabase;

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

function nativeWindow(plugins, backend, location = {}) {
  const values = new Map();
  const window = {
    Capacitor: {
      isNativePlatform: () => true,
      Plugins: plugins
    },
    LorefyBackend: backend,
    localStorage: {
      getItem: (key) => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key)
    },
    crypto: globalThis.crypto,
    TextEncoder,
    location,
    URL,
    Promise,
    Date,
    console,
    setTimeout,
    clearTimeout
  };
  return window;
}

function runGoogleBridge({ onOpen, onExchange, onAfterLogin = async () => {}, location = {}, launchUrl = null, listenerReady }) {
  let appUrlOpen;
  let browserFinished;
  let closed = false;
  const backend = {
    user: null,
    client: {
      auth: {
        signInWithOAuth: async () => ({ data: { url: 'https://example.test/authorize' }, error: null }),
        exchangeCodeForSession: onExchange
      }
    },
    signInWithOAuth: async () => { throw new Error('web fallback should not run'); },
    _afterLogin: onAfterLogin
  };
  const plugins = {
    App: {
      addListener: (_name, callback) => {
        if (listenerReady) return listenerReady.then(() => { appUrlOpen = callback; });
        appUrlOpen = callback;
      },
      getLaunchUrl: async () => launchUrl && ({ url: launchUrl })
    },
    Browser: {
      addListener: (name, callback) => {
        if (name === 'browserFinished') browserFinished = callback;
        return Promise.resolve({ remove: () => {} });
      },
      open: async (options) => onOpen(options, (url) => appUrlOpen({ url })),
      close: async () => { closed = true; }
    }
  };
  const window = nativeWindow(plugins, backend, location);
  vm.runInNewContext(googleSource, { window, URL, Promise, Date, console, setTimeout, clearTimeout });
  return {
    backend,
    window,
    dispatch: (url) => appUrlOpen({ url }),
    dismissBrowser: () => browserFinished && browserFinished(),
    browserClosed: () => closed
  };
}

test('Google waits for native callback listener registration before opening the provider', async () => {
  let register, opened = false;
  const listenerReady = new Promise(resolve => { register = resolve; });
  const bridge = runGoogleBridge({listenerReady,
    onOpen:async()=>{opened=true;},
    onExchange:async()=>({data:{session:{user:{id:'reader'}}}})});
  const signIn = bridge.backend.signInWithOAuth('google');
  await delay(10);
  const openedTooSoon = opened;
  register();
  // Release the test flow even if the old implementation missed its callback.
  await delay(10);
  bridge.dispatch('com.lorefy.app://auth/callback?code=ready-code');
  await signIn;
  assert.equal(openedTooSoon,false);
});

test('Google OAuth resolves when the app callback arrives before Browser.open returns', async () => {
  const bridge = runGoogleBridge({
    onOpen: async (_options, dispatch) => {
      dispatch('com.lorefy.app://auth/callback?code=fast-code');
      await delay();
    },
    onExchange: async () => ({ data: { session: { user: { id: 'google-user' } } }, error: null })
  });

  const result = await Promise.race([
    bridge.backend.signInWithOAuth('google'),
    delay(1500).then(() => ({ timedOut: true }))
  ]);

  assert.equal(result.userId, 'google-user');
  assert.equal(result.native, true);
});

test('Google OAuth exchanges a returned authorization code only once', async () => {
  let exchanges = 0;
  let releaseOpen;
  const opened = new Promise((resolve) => { releaseOpen = resolve; });
  const bridge = runGoogleBridge({
    onOpen: async () => opened,
    onExchange: async () => {
      exchanges += 1;
      await delay(10);
      return { data: { session: { user: { id: 'google-user' } } }, error: null };
    }
  });

  const signIn = bridge.backend.signInWithOAuth('google');
  await delay();
  const callback = 'com.lorefy.app://auth/callback?code=single-use-code';
  bridge.dispatch(callback);
  bridge.dispatch(callback);
  releaseOpen();
  await signIn;
  await delay(20);

  assert.equal(exchanges, 1);
});

test('Google OAuth reloads the native WebView after session exchange', async () => {
  let reloads = 0;
  const bridge = runGoogleBridge({
    location: { reload: () => { reloads += 1; } },
    onOpen: async (_options, dispatch) => {
      dispatch('com.lorefy.app://auth/callback?code=reload-code');
    },
    onExchange: async () => ({ data: { session: { user: { id: 'google-user' } } }, error: null })
  });

  await bridge.backend.signInWithOAuth('google');
  await delay();
  assert.equal(reloads, 1);
});

test('Google OAuth completes without waiting for redundant post-login synchronization', async () => {
  let releaseSync;
  const waitingForSync = new Promise((resolve) => { releaseSync = resolve; });
  const bridge = runGoogleBridge({
    onOpen: async (_options, dispatch) => {
      dispatch('com.lorefy.app://auth/callback?code=close-first-code');
    },
    onExchange: async () => ({ data: { session: { user: { id: 'google-user' } } }, error: null }),
    onAfterLogin: async () => waitingForSync
  });

  const signIn = bridge.backend.signInWithOAuth('google');
  const result = await Promise.race([signIn, delay(100).then(() => ({ timedOut: true }))]);

  assert.equal(bridge.browserClosed(), true);
  assert.equal(result.userId, 'google-user');
  releaseSync();
  await signIn;
});

test('Google OAuth cancellation clears the pending flow so the user can retry', async () => {
  const bridge = runGoogleBridge({
    onOpen: async () => {},
    onExchange: async () => ({ data: { session: null }, error: null })
  });

  const firstSignIn = bridge.backend.signInWithOAuth('google');
  await delay();
  bridge.dismissBrowser();

  const firstResult = await Promise.race([
    firstSignIn.then(() => ({ resolved: true }), (error) => ({ error })),
    delay(1500).then(() => ({ timedOut: true }))
  ]);
  assert.equal(firstResult.timedOut, undefined);
  assert.equal(firstResult.error && firstResult.error.code, 'LOREFY_OAUTH_CANCELLED');

  const secondSignIn = bridge.backend.signInWithOAuth('google');
  await delay();
  bridge.dismissBrowser();
  const secondResult = await Promise.race([
    secondSignIn.then(() => ({ resolved: true }), (error) => ({ error })),
    delay(1500).then(() => ({ timedOut: true }))
  ]);
  assert.equal(secondResult.timedOut, undefined);
  assert.equal(secondResult.error && secondResult.error.code, 'LOREFY_OAUTH_CANCELLED');
});

test('browser dismissal during Google code exchange does not cancel a successful login', async () => {
  let release;
  const exchange = new Promise(resolve => { release = resolve; });
  const bridge = runGoogleBridge({ onOpen: async () => {}, onExchange: () => exchange });
  const login = bridge.backend.signInWithOAuth('google');
  const result = login.then(value => value, error => ({ error }));
  await delay();
  bridge.dispatch('com.lorefy.app://auth/callback?code=in-flight');
  await delay();
  bridge.dismissBrowser();
  release({ data:{ session:{ user:{ id:'google-user' } } }, error:null });
  assert.equal((await result).userId, 'google-user');
});

test('Google browser dismissal before appUrlOpen preserves the native handoff', async () => {
  const bridge = runGoogleBridge({onOpen:async()=>{},onExchange:async()=>({data:{session:{user:{id:'late-return'}}},error:null})});
  const login = bridge.backend.signInWithOAuth('google').then(value=>value,error=>({error}));
  await delay();
  bridge.dismissBrowser();
  await delay(20);
  bridge.dispatch('com.lorefy.app://auth/callback?code=late-return');
  const result = await login;
  assert.equal(result.userId,'late-return');
});

test('Apple keeps a valid Supabase session when authorization-code storage is temporarily unavailable', async () => {
  let signedOut = 0;
  let afterLogin = 0;
  const backend = {
    client: {
      auth: {
        signInWithIdToken: async () => ({ data: { user: { id: 'apple-user' }, session: { user: { id: 'apple-user' } } }, error: null })
      }
    },
    signInWithOAuth: async () => { throw new Error('web fallback should not run'); },
    queueAppleAuthorization: async () => { throw new Error('Keychain queue temporarily unavailable'); },
    registerAppleAuthorization: async () => { throw new Error('edge function unavailable'); },
    signOut: async () => { signedOut += 1; },
    _afterLogin: async () => { afterLogin += 1; }
  };
  const plugins = {
    SignInWithApple: {
      authorize: async () => ({
        response: {
          identityToken: 'identity-token',
          authorizationCode: 'authorization-code'
        }
      })
    }
  };
  let reloads = 0;
  const window = nativeWindow(plugins, backend, { reload: () => { reloads += 1; } });
  vm.runInNewContext(appleSource, {
    window,
    Uint8Array,
    TextEncoder,
    Promise,
    console,
    setTimeout,
    clearTimeout
  });

  const result = await backend.signInWithApple();

  assert.equal(result.userId, 'apple-user');
  assert.equal(result.native, true);
  assert.equal(afterLogin, 0);
  assert.equal(signedOut, 0);
  await delay();
  assert.equal(reloads, 1);
});

test('native Google never falls back to browser OAuth while the client is unavailable', async () => {
  const bridge = runGoogleBridge({ onOpen: async () => {}, onExchange: async () => {} });
  bridge.backend.client = null;
  await assert.rejects(bridge.backend.signInWithOAuth('google'), /جاهز|تهيئة|ready/i);
});

test('a cold-launch Google callback waits for the Supabase client instead of dropping the login', async () => {
  let exchanges = 0, reloads = 0;
  const bridge = runGoogleBridge({
    launchUrl: 'com.lorefy.app://auth/callback?code=cold-launch',
    location: { reload: () => { reloads += 1; } },
    onOpen: async () => {},
    onExchange: async () => { exchanges += 1; return { data: { session: { user: { id: 'google-user' } } } }; }
  });
  bridge.window.localStorage.setItem('lorefy.oauth.google.pending.v1', JSON.stringify({ startedAt: Date.now() }));
  const client = bridge.backend.client;
  bridge.backend.client = null;
  await delay(10);
  bridge.backend.client = client;
  await delay(130);
  assert.equal(exchanges, 1);
  assert.equal(reloads, 1);
});

test('Apple does not wait for cloud hydration after storing a valid native session', async () => {
  let queued = false;
  let reloads = 0;
  const backend = {
    client: { auth: { signInWithIdToken: async () => ({ data: { user: { id: 'apple-user' }, session: { user: { id: 'apple-user' } } } }) } },
    signInWithOAuth: async () => { throw new Error('web fallback should not run'); },
    queueAppleAuthorization: async () => { queued = true; },
    registerAppleAuthorization: () => new Promise(() => {}),
    _afterLogin: () => new Promise(() => {})
  };
  const window = nativeWindow({ SignInWithApple: { authorize: async () => ({ response: { identityToken: 'token', authorizationCode: 'one-time-code' } }) } }, backend, { reload: () => { reloads += 1; } });
  vm.runInNewContext(appleSource, { window, Uint8Array, TextEncoder, Promise, console, setTimeout, clearTimeout });
  const result = await Promise.race([backend.signInWithApple(), delay(150).then(() => ({ timedOut: true }))]);
  assert.equal(result.userId, 'apple-user');
  assert.equal(queued, true);
  await delay();
  assert.equal(reloads, 1);
});

test('Apple can sign in from a native WebView without crypto.subtle', async () => {
  const { createHash } = require('node:crypto');
  const backend = {
    client: { auth: { signInWithIdToken: async () => ({ data: { user: { id: 'apple-user' }, session: { user: { id: 'apple-user' } } } }) } },
    signInWithOAuth: async () => { throw new Error('web fallback'); },
    queueAppleAuthorization: async () => {}
  };
  const window = nativeWindow({
    LorefyAuthCrypto: { sha256: async ({ value }) => ({ hex: createHash('sha256').update(value).digest('hex') }) },
    SignInWithApple: { authorize: async options => { assert.match(options.nonce, /^[a-f0-9]{64}$/); return { response: { identityToken: 'token' } }; } }
  }, backend, { reload: () => {} });
  window.crypto = { getRandomValues: values => globalThis.crypto.getRandomValues(values) };
  // Native hash is injected by the system bridge before auth scripts run.
  vm.runInNewContext(nativeCryptoSource, { window, Uint8Array });
  vm.runInNewContext(appleSource, { window, Uint8Array, TextEncoder, Promise, console, setTimeout, clearTimeout });
  assert.equal((await backend.signInWithApple()).userId, 'apple-user');
});

test('shipped SDK uses native S256 without WebCrypto and restores Google and Apple from Keychain', async (t) => {
  const { createHash } = require('node:crypto');
  const originalCrypto = sdkContext.crypto;
  sdkContext.crypto = { getRandomValues: values => globalThis.crypto.getRandomValues(values) };
  t.after(() => { sdkContext.crypto = originalCrypto; });
  const keychain = new Map();
  let appCallback;
  let exchangeBody;
  let providerUrl;
  const user = { id: 'native-google-owner', email: 'reader@example.test' };
  const appleUser = { id: 'native-apple-owner', email: 'apple-reader@example.test' };
  const token = ['header', Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'signature'].join('.');
  const plugins = {
    LorefyAuthCrypto: { sha256: async ({ value }) => ({ hex: createHash('sha256').update(value).digest('hex') }) },
    SecureStorage: {
      internalGetItem: async ({ prefixedKey }) => ({ data: keychain.get(prefixedKey) || null }),
      internalSetItem: async ({ prefixedKey, data }) => { keychain.set(prefixedKey, data); },
      internalRemoveItem: async ({ prefixedKey }) => { keychain.delete(prefixedKey); }
    },
    App: { addListener: (_event, handler) => { appCallback = handler; }, getLaunchUrl: async () => null },
    Browser: {
      addListener: async () => ({ remove: () => {} }), close: async () => {},
      open: async ({ url }) => {
        providerUrl = new URL(url);
        assert.equal(new URL(url).searchParams.get('redirect_to'), 'com.lorefy.app://auth/callback');
        assert.equal(providerUrl.searchParams.get('code_challenge_method'), 's256');
        appCallback({ url: 'com.lorefy.app://auth/callback?code=provider-code' });
      }
    }
  };
  const backend = { signInWithOAuth: async () => { throw new Error('web fallback'); }, _afterLogin: () => new Promise(() => {}) };
  const window = nativeWindow(plugins, backend, { reload: () => {} });
  window.crypto = sdkContext.crypto;
  window.btoa = btoa;
  vm.runInNewContext(nativeCryptoSource, { window, Uint8Array });
  vm.runInNewContext(secureStorageSource, { window, localStorage: window.localStorage, Promise, console });
  const options = {
    auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'pkce', storage: window.LorefySecureAuthStorage },
    global: { fetch: async (url, request) => {
      assert.match(String(url), /\/token\?grant_type=(pkce|id_token)/);
      exchangeBody = JSON.parse(request.body);
      const signedInUser = String(url).includes('grant_type=id_token') ? appleUser : user;
      return new Response(JSON.stringify({ access_token: token, refresh_token: 'refresh-token', token_type: 'bearer', expires_in: 3600, user: signedInUser }), { status: 200, headers: { 'content-type': 'application/json' } });
    } }
  };
  backend.client = createClient('https://native-test.supabase.co', 'public-test-key', options);
  vm.runInNewContext(googleSource, { window, URL, Promise, Date, console, setTimeout, clearTimeout });
  const result = await backend.signInWithOAuth('google');
  assert.equal(result.userId, user.id);
  assert.equal(exchangeBody.auth_code, 'provider-code');
  assert.ok(exchangeBody.code_verifier.length > 30);
  assert.equal(providerUrl.searchParams.get('code_challenge'), createHash('sha256').update(exchangeBody.code_verifier).digest('base64url'));
  assert.ok(keychain.has('lorefy-auth-sb-native-test-auth-token'));
  const rebooted = createClient('https://native-test.supabase.co', 'public-test-key', options);
  const restored = await rebooted.auth.getSession();
  assert.equal(restored.data.session.user.id, user.id);
  assert.equal(window.localStorage.getItem('sb-native-test-auth-token'), null);
  plugins.SignInWithApple = { authorize: async () => ({ response: { identityToken: 'apple-identity-token', authorizationCode: 'apple-authorization-code' } }) };
  backend.queueAppleAuthorization = code => window.LorefySecureAuthStorage.setItem('pending-apple', code);
  vm.runInNewContext(appleSource, { window, Uint8Array, TextEncoder, Promise, console, setTimeout, clearTimeout });
  const apple = await backend.signInWithApple();
  assert.equal(apple.userId, appleUser.id);
  assert.equal(exchangeBody.provider, 'apple');
  assert.equal(exchangeBody.id_token, 'apple-identity-token');
  assert.ok(exchangeBody.nonce.length >= 32);
  const appleRebooted = createClient('https://native-test.supabase.co', 'public-test-key', options);
  assert.equal((await appleRebooted.auth.getSession()).data.session.user.id, appleUser.id);
  assert.equal(keychain.get('lorefy-auth-pending-apple'), 'apple-authorization-code');
});

test('the native hash plugin is registered in the active iOS controller and uses system CryptoKit', () => {
  const swift = fs.readFileSync(path.join(root, 'ios/App/App/LorefyAuthCrypto.swift'), 'utf8');
  const scene = fs.readFileSync(path.join(root, 'ios/App/App/SceneDelegate.swift'), 'utf8');
  const project = fs.readFileSync(path.join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
  assert.match(swift, /import CryptoKit/);
  assert.match(swift, /SHA256\.hash\(data:/);
  assert.match(swift, /registerPluginInstance\(LorefyAuthCrypto\(\)\)/);
  assert.match(scene, /rootViewController = LorefyBridgeViewController\(\)/);
  assert.match(project, /LorefyAuthCrypto\.swift in Sources/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'))).server.iosScheme, 'capacitor');
});
