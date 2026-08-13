const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const config = fs.readFileSync(path.join(root, "config", "lorefy-config.js"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const backend = fs.readFileSync(path.join(root, "backend", "lorefy-backend.js"), "utf8");

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
  const versionedAsset = "config/lorefy-config.js?v=20260805-local-demo-v3";
  assert.ok(index.includes(versionedAsset));
  assert.ok(serviceWorker.includes(`./${versionedAsset}`));
  const backendAsset = "backend/lorefy-backend.js?v=20260813-security-v1";
  assert.ok(index.includes(backendAsset));
  assert.ok(serviceWorker.includes(`./${backendAsset}`));
  const secureStorageAsset = "backend/lorefy-secure-storage.js?v=20260813-keychain-v1";
  assert.ok(index.includes(secureStorageAsset));
  assert.ok(serviceWorker.includes(`./${secureStorageAsset}`));
});

test("local preview exposes providers while native releases require an account", () => {
  assert.match(config, /google:\s*\{ enabled: !lorefyBetaGuest && \(lorefyCloudConfigured \|\| lorefyLocalHost\) \}/);
  assert.match(config, /nativeAppleSignInEnabled/);
  assert.doesNotMatch(index, /directBetaGuest/);
  assert.doesNotMatch(index, /betaGuestSession/);
  assert.doesNotMatch(index, /beta-guest/);
  assert.match(index, /if \(directLocalDemo && BE && BE\.mode === "demo"\)/);
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
