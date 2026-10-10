const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('local preview explicitly unlocks Premium features', () => {
  const config = fs.readFileSync(path.join(root, 'config/lorefy-config.js'), 'utf8');
  assert.match(config, /premium:\s*!!\(window\.LOREFY_RELEASE && window\.LOREFY_RELEASE\.betaPremiumUnlocked\)/);
  assert.match(config, /premiumPreviewUnlocked:\s*true/);
});

test('Premium preview state is applied before the app starts', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const unlockAt = index.indexOf('lorefy.user.premium.v2');
  const appAt = index.indexOf('uploads/files/lorefy-app.js');
  assert.ok(unlockAt >= 0, 'Premium preview bootstrap is missing');
  assert.ok(appAt > unlockAt, 'Premium preview must be enabled before the app bundle');
  assert.match(index, /isLocalHost/);
  assert.match(index, /params\.get\("preview"\) === "premium"/);
  assert.match(index, /preparePremiumState/);
  assert.match(index, /window\.__LOREFY_LOCAL_PREMIUM_PREVIEW = localPremiumPreview/);
  assert.match(index, /BE\.getEntitlements/);
  assert.match(index, /localStorage\.removeItem\("lorefy\.user\.premium\.v2"\)/);
  assert.match(index, /if \(localPremiumPreview\) \{[\s\S]*localStorage\.setItem\("lorefy\.user\.premium\.v2",\s*"true"\)/);
  assert.match(index, /if \(preview\) return false/);
});

test('billing is explicitly unconfigured until server entitlements exist', () => {
  const config = fs.readFileSync(path.join(root, 'config/lorefy-config.js'), 'utf8');
  assert.match(config, /mode:\s*"not-configured"/);
  assert.match(config, /checkoutEnabled:\s*false/);
  assert.match(config, /provider:\s*null/);
});

test('advanced statistics screen is available in the Premium module', () => {
  const moduleSource = fs.readFileSync(path.join(root, 'modules/lorefy-v2.js'), 'utf8');
  assert.match(moduleSource, /StatsScreen/);
  assert.ok(moduleSource.includes('\\u0627\\u0644\\u0625\\u062D\\u0635\\u0627\\u0626\\u064A\\u0627\\u062A'));
  assert.ok(moduleSource.includes('\\u0646\\u0634\\u0627\\u0637 \\u0627\\u0644\\u0642\\u0631\\u0627\\u0621\\u0629'));
});
