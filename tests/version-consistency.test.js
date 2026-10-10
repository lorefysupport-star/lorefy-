const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('service worker precaches the exact interface asset versions loaded by index', () => {
  const interfaceAssets = [...index.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((url) => !/^(?:https?:|data:|#)/.test(url))
    .filter((url) => /\.(?:js|css)(?:\?|$)/.test(url));

  const missing = interfaceAssets.filter((url) => !serviceWorker.includes(`'./${url}'`));
  assert.deepEqual(missing, []);
});

test('localhost preview removes stale service workers and caches before registration', () => {
  assert.match(index, /isLocalPreview/);
  assert.match(index, /serviceWorker\.getRegistrations\(\)/);
  assert.match(index, /registration\.unregister\(\)/);
  assert.match(index, /caches\.keys\(\)/);
  assert.match(index, /caches\.delete\(key\)/);
});

test('service worker does not cache arbitrary same-origin GET responses', () => {
  const fallback = serviceWorker.slice(serviceWorker.lastIndexOf("e.respondWith("));
  assert.match(fallback, /fetch\(e\.request\)\.catch\(\(\) => caches\.match\(e\.request\)\)/);
  assert.doesNotMatch(fallback, /caches\.open\(CACHE\).*c\.put/);
});
