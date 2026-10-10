const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('native Apple sign-in registers the one-time authorization code server-side', () => {
  const bridge = read('backend', 'lorefy-ios-bridge.js');
  const backend = read('backend', 'lorefy-backend.js');
  const fn = read('supabase', 'functions', 'apple-authorization', 'index.ts');

  assert.match(bridge, /resp\.authorizationCode/);
  assert.match(bridge, /queueAppleAuthorization/);
  assert.match(backend, /await this\.registerAppleAuthorization\(pending\.code\)/);
  assert.match(backend, /registerAppleAuthorization:\s*async/);
  assert.match(backend, /apple-authorization/);
  assert.match(fn, /appleid\.apple\.com\/auth\/token/);
  assert.match(fn, /grant_type/);
  assert.match(fn, /authorization_code/);
  assert.match(fn, /store_apple_authorization/);
  assert.match(fn, /target_user_id:\s*user\.id/);
  assert.match(fn, /verifyAppleIdentityToken/);
  assert.match(fn, /tokens\.id_token/);
  assert.match(fn, /appleSubject\s*!==\s*linkedAppleSubject/);
  assert.match(fn, /const admin = createClient\(supabaseUrl, serviceRoleKey/);
  assert.doesNotMatch(fn, /const admin = createClient[\s\S]{0,160}global:\s*\{\s*headers:\s*\{\s*Authorization:\s*authorization/);
  assert.doesNotMatch(bridge, /await BE\.signOut\(\)/);
  assert.match(bridge, /keeping the authenticated session/);
});

test('account deletion revokes the Apple grant before deleting the auth user', () => {
  const fn = read('supabase', 'functions', 'delete-account', 'index.ts');
  const migration = read('supabase', 'migrations', '20260813112236_apple_authorization_revocation_v2.sql');
  const cleanupMigration = read('supabase', 'migrations', '20260813113014_apple_authorization_cleanup.sql');

  assert.match(fn, /appleid\.apple\.com\/auth\/revoke/);
  assert.match(fn, /token_type_hint/);
  assert.match(fn, /refresh_token/);
  assert.match(migration, /private\.apple_authorizations/);
  assert.match(migration, /revoke all/);
  assert.match(cleanupMigration, /delete_apple_authorization/);
  assert.match(cleanupMigration, /delete from vault\.secrets/);
  assert.match(fn, /delete_apple_authorization/);
});
