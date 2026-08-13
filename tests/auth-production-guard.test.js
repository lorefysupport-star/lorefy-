const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

async function loadBackend({ hostname, search = '', demoAuthEnabled = true }) {
  const source = fs.readFileSync(path.join(root, 'backend/lorefy-backend.js'), 'utf8');
  const window = {
    LOREFY_SUPABASE: null,
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
