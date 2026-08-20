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
