const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.resolve(__dirname, '..', 'backend', 'lorefy-secure-storage.js'),
  'utf8'
);

function runSecureStorage({ native, plugin, legacy = {} }) {
  const legacyStore = new Map(Object.entries(legacy));
  const window = {
    Capacitor: {
      isNativePlatform: () => native,
      Plugins: plugin ? { SecureStorage: plugin } : {}
    },
    localStorage: {
      get length() { return legacyStore.size; },
      key: (index) => Array.from(legacyStore.keys())[index] || null,
      getItem: (key) => legacyStore.has(key) ? legacyStore.get(key) : null,
      setItem: (key, value) => legacyStore.set(key, String(value)),
      removeItem: (key) => legacyStore.delete(key)
    }
  };
  vm.runInNewContext(source, { window, localStorage: window.localStorage, Promise, console });
  return window;
}

test('failed legacy-session migration deletes web storage and fails closed', async () => {
  const legacyKey = 'sb-project-auth-token';
  const plugin = {
    setKeyPrefix: async () => {},
    getItem: async () => null,
    setItem: async () => { throw new Error('Keychain write failed'); },
    removeItem: async () => {}
  };
  const window = runSecureStorage({ native: true, plugin, legacy: { [legacyKey]: 'secret-session' } });

  await assert.rejects(window.LorefySecureAuthStorage.getItem('session'), /Keychain migration/i);
  assert.equal(window.localStorage.getItem(legacyKey), null);
  assert.equal(window.LorefySecureAuthStorageReady, false);
});

test('browser previews do not install the native Keychain adapter', () => {
  const window = runSecureStorage({ native: false });
  assert.equal(window.LorefySecureAuthStorage, undefined);
});

test('native auth fails closed when the Keychain plugin is unavailable', async () => {
  const window = runSecureStorage({ native: true });
  assert.equal(window.LorefySecureAuthStorageReady, false);
  await assert.rejects(window.LorefySecureAuthStorage.getItem('session'), /Keychain/);
  await assert.rejects(window.LorefySecureAuthStorage.setItem('session', 'value'), /Keychain/);
});

test('native auth uses the Keychain plugin when available', async () => {
  const calls = [];
  const plugin = {
    setKeyPrefix: async (value) => calls.push(['prefix', value]),
    getItem: async (key) => `stored:${key}`,
    setItem: async (key, value) => calls.push(['set', key, value]),
    removeItem: async (key) => calls.push(['remove', key])
  };
  const window = runSecureStorage({ native: true, plugin });

  assert.equal(window.LorefySecureAuthStorageReady, true);
  assert.equal(await window.LorefySecureAuthStorage.getItem('session'), 'stored:session');
  await window.LorefySecureAuthStorage.setItem('session', 'value');
  await window.LorefySecureAuthStorage.removeItem('session');
  assert.deepEqual(calls, [
    ['prefix', 'lorefy-auth-'],
    ['set', 'session', 'value'],
    ['remove', 'session']
  ]);
});

test('native OAuth keeps its temporary PKCE verifier outside the Keychain', async () => {
  const plugin = {
    setKeyPrefix: async () => {},
    getItem: async () => { throw new Error('Keychain read failed'); },
    setItem: async () => { throw new Error('Keychain write failed'); },
    removeItem: async () => { throw new Error('Keychain remove failed'); }
  };
  const window = runSecureStorage({ native: true, plugin });
  const verifierKey = 'sb-project-auth-token-code-verifier';

  await window.LorefySecureAuthStorage.setItem(verifierKey, 'temporary-verifier');
  assert.equal(await window.LorefySecureAuthStorage.getItem(verifierKey), 'temporary-verifier');
  await window.LorefySecureAuthStorage.removeItem(verifierKey);
  assert.equal(await window.LorefySecureAuthStorage.getItem(verifierKey), null);
  await assert.rejects(window.LorefySecureAuthStorage.setItem('sb-project-auth-token', 'session'), /Keychain write failed/);
});

test('native auth adapts the raw Capacitor 8 secure-storage bridge', async () => {
  const calls = [];
  const values = new Map();
  const plugin = {
    internalGetItem: async ({ prefixedKey, sync }) => {
      calls.push(['get', prefixedKey, sync]);
      return { data: values.has(prefixedKey) ? values.get(prefixedKey) : null };
    },
    internalSetItem: async ({ prefixedKey, data, sync }) => {
      calls.push(['set', prefixedKey, data, sync]);
      values.set(prefixedKey, data);
    },
    internalRemoveItem: async ({ prefixedKey, sync }) => {
      calls.push(['remove', prefixedKey, sync]);
      values.delete(prefixedKey);
      return { success: true };
    }
  };
  const window = runSecureStorage({ native: true, plugin });

  await window.LorefySecureAuthStorage.setItem('session', 'secure-value');
  assert.equal(await window.LorefySecureAuthStorage.getItem('session'), 'secure-value');
  await window.LorefySecureAuthStorage.removeItem('session');
  assert.equal(await window.LorefySecureAuthStorage.getItem('session'), null);
  assert.deepEqual(calls, [
    ['set', 'lorefy-auth-session', 'secure-value', false],
    ['get', 'lorefy-auth-session', false],
    ['remove', 'lorefy-auth-session', false],
    ['get', 'lorefy-auth-session', false]
  ]);
});
