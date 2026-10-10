const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const config = fs.readFileSync(path.join(root, "config", "lorefy-config.js"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const backend = fs.readFileSync(path.join(root, "backend", "lorefy-backend.js"), "utf8");
const googleBridge = fs.readFileSync(path.join(root, "backend", "lorefy-ios-oauth.js"), "utf8");
const appleBridge = fs.readFileSync(path.join(root, "backend", "lorefy-ios-bridge.js"), "utf8");

test("first paint has a Lorefy bootstrap surface while deferred bundles load", () => {
  assert.match(index, /id="root">\s*<div class="lf-bootstrap-splash"/);
  assert.match(index, /aria-label="Loading Lorefy"/);
  assert.match(index, /\.lf-bootstrap-splash/);
});

test("OAuth fails closed until a real Supabase project is configured", () => {
  assert.doesNotMatch(config, /qsroxmltioxqozmykens\.supabase\.co/);
  assert.match(config, /window\.LOREFY_SUPABASE\s*=\s*window\.LOREFY_SUPABASE\s*\|\|\s*null/);
  assert.match(config, /google:\s*\{ enabled: !lorefyBetaGuest && \(lorefyCloudConfigured \|\| lorefyLocalHost\) \}/);
});

test("local unconfigured auth offers an explicit demo route instead of a dead provider", () => {
  assert.match(config, /id = "lorefy-local-demo-entry"/);
  assert.match(config, /params\.set\("preview", "demo"\)/);
  assert.match(config, /local demo only/i);
});

test("the local auth fallback uses a fresh config asset version", () => {
  const versionedAsset = "config/lorefy-config.js?v=20260924-catalog-v1";
  assert.ok(index.includes(versionedAsset));
  assert.ok(serviceWorker.includes(`./${versionedAsset}`));
  const backendAsset = index.match(/backend\/lorefy-backend\.js\?v=[^"']+/)?.[0];
  assert.ok(backendAsset, "the backend must have a versioned asset URL");
  assert.ok(index.includes(backendAsset));
  assert.ok(serviceWorker.includes(`./${backendAsset}`));
  const secureStorageAsset = "backend/lorefy-secure-storage.js?v=20260824-keychain-v2";
  assert.ok(index.includes(secureStorageAsset));
  assert.ok(serviceWorker.includes(`./${secureStorageAsset}`));
  const appleBridgeAsset = "backend/lorefy-ios-bridge.js?v=20261001-auth-recovery-v1";
  const googleBridgeAsset = "backend/lorefy-ios-oauth.js?v=20261003-beta-final-v1";
  assert.ok(index.includes(appleBridgeAsset));
  assert.ok(serviceWorker.includes(`./${appleBridgeAsset}`));
  assert.ok(index.includes(googleBridgeAsset));
  assert.ok(serviceWorker.includes(`./${googleBridgeAsset}`));
  const authThemeAsset = "styles/lorefy-cinema-ui.css?v=20261003-appearance-feather-v2";
  assert.ok(index.includes(authThemeAsset));
  assert.ok(serviceWorker.includes(`./${authThemeAsset}`));
});

test("an existing local demo session is preserved across reloads", () => {
  assert.match(index, /if \(directLocalDemo && BE && BE\.mode === "demo" && !sess\)/);
});

test("local preview exposes providers while native releases require an account", () => {
  assert.match(config, /google:\s*\{ enabled: !lorefyBetaGuest && \(lorefyCloudConfigured \|\| lorefyLocalHost\) \}/);
  assert.match(config, /nativeAppleSignInEnabled/);
  assert.doesNotMatch(index, /directBetaGuest/);
  assert.doesNotMatch(index, /betaGuestSession/);
  assert.doesNotMatch(index, /beta-guest/);
  assert.match(index, /if \(directLocalDemo && BE && BE\.mode === "demo" && !sess\)/);
  assert.match(backend, /params\.set\("preview", "demo"\)/);
  assert.match(backend, /params\.set\("demo", "ready"\)/);
  assert.match(backend, /local demo shortcut/i);
});

test("an unauthenticated native user always lands on the welcome gate", () => {
  assert.match(index, /else mountGate\('welcome'\)/);
  assert.doesNotMatch(index, /if \(directBetaGuest\) mountApp\(\)/);
});

test("local OAuth buttons have a UI-level direct demo fallback", () => {
  assert.match(config, /addEventListener\("click"/);
  assert.match(config, /Google\|Apple/);
  assert.match(config, /target\.closest\("\.lf-auth"\)/);
});

test("the direct local preview seeds a complete demo identity before mounting the app", () => {
  assert.match(index, /previewParams\.get\("demo"\) === "ready"/);
  assert.match(index, /await BE\.signInWithOAuth\("google"\)/);
  assert.match(index, /onboardingVersion:\s*2/);
});

test("native OAuth completion reloads the authenticated app", () => {
  assert.match(googleBridge, /global\.location\.reload\(\)/);
  assert.match(appleBridge, /global\.location\.reload\(\)/);
});
