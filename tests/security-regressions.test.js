const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('static server rejects prefix-confusion and traversal paths', () => {
  const { safeStaticPath, isAllowedMediaHost } = require('../tools/lorefy-api-server.js');
  assert.equal(safeStaticPath('/index.html'), path.resolve(__dirname, '..', 'index.html'));
  assert.equal(safeStaticPath('/../new-chat-secret.txt'), null);
  assert.equal(safeStaticPath('/%2e%2e/%2e%2e/Windows/win.ini'), null);
  assert.equal(safeStaticPath('/%5c%5cserver%5cshare%5csecret.txt'), null);
  assert.equal(safeStaticPath('/package.json'), null);
  assert.equal(safeStaticPath('/supabase/functions/delete-account/index.ts'), null);
  assert.equal(safeStaticPath('/tools/lorefy-api-server.js'), null);
  assert.equal(isAllowedMediaHost('upload.wikimedia.org'), true);
  assert.equal(isAllowedMediaHost('static.wikia.nocookie.net'), true);
  assert.equal(isAllowedMediaHost('evil.example'), false);
});

test('api proxy bounds JSON traffic and cannot serve SVG as same-origin media', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'tools', 'lorefy-api-server.js'), 'utf8');
  assert.match(server, /MAX_JSON_BODY_BYTES\s*=\s*256\s*\*\s*1024/);
  assert.match(server, /readBody\(req,\s*MAX_JSON_BODY_BYTES\)/);
  assert.match(server, /MAX_JSON_RESPONSE_BYTES\s*=\s*4\s*\*\s*1024\s*\*\s*1024/);
  assert.match(server, /readResponseText\(response,\s*MAX_JSON_RESPONSE_BYTES\)/);
  assert.match(server, /AbortSignal\.timeout\(UPSTREAM_TIMEOUT_MS\)/);
  assert.match(server, /image\/svg\+xml/);
  assert.match(server, /X-Content-Type-Options/);
  assert.match(server, /Content-Disposition.*inline/);
  assert.match(server, /redirect:\s*["']manual["']/);
  assert.match(server, /MAX_MEDIA_REDIRECTS\s*=\s*3/);
  assert.match(server, /\/api\/catalog\/mangadex-covers/);
  assert.match(server, /https:\/\/api\.mangadex\.org\/cover/);
  assert.match(server, /MAX_ACTIVE_API_REQUESTS\s*=\s*24/);
  assert.match(server, /LOREFY_ALLOW_PUBLIC_HOST/);
});

test('native Supabase sessions use Keychain storage', () => {
  const backend = fs.readFileSync(path.join(__dirname, '..', 'backend', 'lorefy-backend.js'), 'utf8');
  const bridge = fs.readFileSync(path.join(__dirname, '..', 'backend', 'lorefy-secure-storage.js'), 'utf8');
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(bridge, /Plugins\.SecureStorage/);
  assert.match(bridge, /setKeyPrefix\("lorefy-auth-"\)/);
  assert.match(bridge, /sb-\[a-z0-9\]\+-auth-token/);
  assert.match(backend, /authOptions\.storage\s*=\s*global\.LorefySecureAuthStorage/);
  assert.ok(index.indexOf('backend/lorefy-secure-storage.js') < index.indexOf('backend/lorefy-backend.js'));
});

test('catalog ingestion bounds identity keys, alias resolution, and delta indexing', () => {
  const identity = fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-identity.js'), 'utf8');
  const updater = fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-updater.js'), 'utf8');
  assert.match(identity, /MAX_AUTHOR_TOKENS\s*=\s*24/);
  assert.match(identity, /MAX_AUTHOR_PAIRS\s*=\s*96/);
  assert.match(identity, /WeakMap/);
  assert.match(updater, /new Map\(\)/);
  assert.match(updater, /response\.body[\s\S]*getReader/);
});

function loadUpdater(initial = []) {
  const writes = new Map();
  let organizeCalls = 0;
  const sandbox = {
    LorefyMangaData: initial,
    LorefyCatalogAliases: {},
    localStorage: {
      getItem(key) { return writes.has(key) ? writes.get(key) : null; },
      setItem(key, value) { writes.set(key, value); }
    },
    LorefyCatalogIdentity: {
      organizeCatalog() { organizeCalls += 1; }
    }
  };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-updater.js'), 'utf8'), sandbox, {
    filename: 'lorefy-catalog-updater.js'
  });
  return { updater: sandbox.LorefyCatalogUpdater, writes, data: sandbox.LorefyMangaData, organizeCalls: () => organizeCalls };
}

test('catalog updater rejects oversized deltas before persistence or organization', () => {
  const loaded = loadUpdater([{ id: 'existing', title: 'Existing', type: 'Manga' }]);
  const delta = {
    version: '2026-W31',
    upserts: Array.from({ length: 5001 }, (_, index) => ({
      id: `remote-${index}`,
      title: 'Same Title',
      type: 'Manga'
    }))
  };

  assert.throws(() => loaded.updater.applyDelta(delta, { cache: true, refresh: false }), (error) => {
    assert.equal(error.code, 'LOREFY_CATALOG_DELTA_TOO_LARGE');
    return true;
  });
  assert.equal(loaded.data.length, 1);
  assert.equal(loaded.writes.size, 0);
  assert.equal(loaded.organizeCalls(), 0);
});

test('catalog updater accepts the supported weekly expansion size', () => {
  const loaded = loadUpdater([]);
  loaded.updater.applyDelta({
    version: '2026-W31',
    upserts: Array.from({ length: 500 }, (_, index) => ({
      id: `remote-${index}`,
      title: `Work ${index}`,
      type: 'Manga'
    }))
  }, { cache: false, refresh: false });
  assert.equal(loaded.data.length, 500);
  assert.equal(loaded.organizeCalls(), 1);
});

test('catalog updater rejects prototype-polluting update keys before state changes', () => {
  const loaded = loadUpdater([{ id: 'existing', title: 'Existing', type: 'Manga' }]);
  const delta = JSON.parse('{"patches":[{"id":"existing","__proto__":{"polluted":"yes"}}],"aliases":{"__proto__":{"polluted":"yes"}}}');

  assert.throws(() => loaded.updater.applyDelta(delta, { cache: true, refresh: false }), (error) => {
    assert.equal(error.code, 'LOREFY_CATALOG_DELTA_UNSAFE_KEY');
    return true;
  });
  assert.equal(loaded.data[0].polluted, undefined);
  assert.equal(loaded.writes.size, 0);
  assert.equal(loaded.organizeCalls(), 0);
});

test('cloud state sync rejects stale whole-document writes', () => {
  const backend = fs.readFileSync(path.join(__dirname, '..', 'backend', 'lorefy-backend.js'), 'utf8');
  const migration = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260813_user_state_concurrency.sql'), 'utf8');

  assert.match(backend, /select\("data,version"\)/);
  assert.match(backend, /rpc\("sync_user_state"/);
  assert.match(backend, /expected_version:\s*expectedVersion/);
  assert.match(backend, /sync\(this\._stateVersion\)/);
  assert.match(migration, /add column if not exists version bigint not null default 0/i);
  assert.match(migration, /where user_id = uid\s+and version = expected_version/i);
  assert.match(migration, /raise exception 'state_conflict'/i);
  assert.match(migration, /revoke insert, update on public\.user_state from authenticated/i);
});
