const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadSubscriptions({ hostname = 'localhost', search = '', billing = {}, backend } = {}) {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-subscriptions.js'), 'utf8');
  const window = {
    LOREFY_BILLING: billing,
    LorefyBackend: backend,
    location: { hostname, search }
  };
  vm.runInNewContext(source, {
    window,
    URLSearchParams,
    Promise,
    Error
  });
  return window.LorefySubscriptions;
}

test('premium entitlement is never synchronized as ordinary user state', () => {
  const source = fs.readFileSync(path.join(root, 'backend/lorefy-backend.js'), 'utf8');
  const syncBlock = source.match(/var SYNC_KEYS = \[(.*?)\];/s);
  assert.ok(syncBlock, 'SYNC_KEYS block is missing');
  assert.doesNotMatch(syncBlock[1], /lorefy\.user\.premium\.v2/);
});

test('billing facade is read-only until a verified provider is configured', async () => {
  const subscriptions = loadSubscriptions();
  assert.deepEqual(JSON.parse(JSON.stringify(subscriptions.status())), {
    mode: 'not-configured',
    provider: null,
    configured: false,
    checkoutEnabled: false,
    preview: false,
    entitlementsSource: 'server'
  });
  await assert.rejects(subscriptions.startCheckout(), (error) => error.code === 'LOREFY_BILLING_NOT_CONFIGURED');
  await assert.rejects(subscriptions.restorePurchases(), (error) => error.code === 'LOREFY_BILLING_NOT_CONFIGURED');
});

test('premium preview is scoped to localhost and explicit query only', () => {
  assert.equal(loadSubscriptions({ search: '?preview=premium' }).status().preview, true);
  assert.equal(loadSubscriptions({ hostname: 'example.com', search: '?preview=premium' }).status().preview, false);
  assert.equal(loadSubscriptions({ search: '?preview=1' }).status().preview, false);
});

test('configured billing still requires an explicit checkout flag', () => {
  const subscriptions = loadSubscriptions({
    billing: { mode: 'stripe', provider: 'stripe', configured: true, checkoutEnabled: false }
  });
  assert.equal(subscriptions.status().configured, true);
  assert.equal(subscriptions.status().checkoutEnabled, false);
});

test('configured checkout delegates to the live backend and never accepts an unknown product', async () => {
  const calls = [];
  const subscriptions = loadSubscriptions({
    billing: { mode: 'stripe', provider: 'stripe', configured: true, checkoutEnabled: true, products: ['monthly', 'yearly'] },
    backend: {
      mode: 'live',
      startCheckout(product) { calls.push(['checkout', product]); return Promise.resolve({ url: 'https://checkout.test/session' }); },
      restorePurchases() { calls.push(['restore']); return Promise.resolve({ restored: true }); }
    }
  });
  await assert.deepEqual(await subscriptions.startCheckout('yearly'), { url: 'https://checkout.test/session' });
  await assert.deepEqual(await subscriptions.restorePurchases(), { restored: true });
  assert.deepEqual(calls, [['checkout', 'yearly'], ['restore']]);
  await assert.rejects(subscriptions.startCheckout('lifetime'), (error) => error.code === 'LOREFY_BILLING_PRODUCT_INVALID' || error.code === 'LOREFY_BILLING_NOT_CONFIGURED');
});

test('entitlements are exposed only through a live server backend', async () => {
  const subscriptions = loadSubscriptions();
  await assert.rejects(subscriptions.getEntitlements(), (error) => error.code === 'LOREFY_BILLING_NOT_CONFIGURED');

  const source = fs.readFileSync(path.join(root, 'backend/lorefy-backend.js'), 'utf8');
  assert.match(source, /getEntitlements:\s*async function/);
  assert.match(source, /\.from\("entitlements"\)/);
  assert.doesNotMatch(source.slice(source.indexOf('getEntitlements:'), source.indexOf('getEntitlements:') + 1400), /localStorage/);
});

test('the entitlement migration is server-authoritative and RLS protected', () => {
  const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260722000100_entitlements.sql'), 'utf8');
  assert.match(migration, /create table if not exists public\.entitlements/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /auth\.uid\(\)\s*=\s*user_id/i);
  assert.match(migration, /revoke\s+insert,\s*update,\s*delete\s+on\s+(?:table\s+)?public\.entitlements\s+from\s+authenticated/i);
  assert.match(migration, /provider_subscription_id/i);
  assert.match(migration, /expires_at/i);
});

test('index loads the billing facade before the application bundle', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const billingAt = index.indexOf('modules/lorefy-subscriptions.js');
  const appAt = index.indexOf('uploads/files/lorefy-app.js');
  assert.ok(billingAt >= 0, 'billing facade is not loaded');
  assert.ok(appAt > billingAt, 'billing facade must load before the app bundle');
});

test('account foundation migration protects profile, state, and media ownership', () => {
  const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260722000000_account_foundation.sql'), 'utf8');
  assert.match(migration, /create table if not exists public\.profiles/i);
  assert.match(migration, /create table if not exists public\.user_state/i);
  assert.match(migration, /insert into storage\.buckets/i);
  assert.match(migration, /profile-media/i);
  assert.match(migration, /enable row level security/gi);
  assert.match(migration, /revoke all on table public\.profiles from anon/i);
  assert.match(migration, /revoke all on table public\.user_state from anon/i);
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)\)::text/i);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = id\)/i);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
});
