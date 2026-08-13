const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.resolve(__dirname, '..', 'backend', 'lorefy-secure-storage.js'),
  'utf8'
);

function runSecureStorage({ native, plugin }) {
  const window = {
    Capacitor: {
      isNativePlatform: () => native,
      Plugins: plugin ? { SecureStorage: plugin } : {}
    },
    localStorage: {
      length: 0,
      key: () => null,
      getItem: () => null,
      removeItem: () => {}
    }
  };
  vm.runInNewContext(source, { window, localStorage: window.localStorage, Promise, console });
  return window;
}

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
