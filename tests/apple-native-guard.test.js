const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Apple native credential patch removes forced unwraps and is repeatable', async () => {
  const { patchAppleSource } = await import('../tools/patch-apple-sign-in.mjs');
  const source = fs.readFileSync(path.join(__dirname, '../node_modules/@capacitor-community/apple-sign-in/ios/Sources/SignInWithApple/Plugin.swift'), 'utf8');
  const patched = patchAppleSource(source);
  assert.doesNotMatch(patched, /appleIDCredential\.(identityToken|authorizationCode)!/);
  assert.match(patched, /guard let tokenData/);
  assert.match(patched, /LOREFY_APPLE_MISSING_TOKEN/);
  assert.equal(patchAppleSource(patched), patched);
  assert.throws(() => patchAppleSource('changed upstream'), /source changed/);
});

test('Apple SPM compatibility patch survives clean installation and rejects unknown manifests', async () => {
  const { patchApplePackage } = await import('../tools/patch-apple-sign-in.mjs');
  const dependency = '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")';
  const patched = patchApplePackage(dependency);
  assert.match(patched, /from: "8.0.0"/);
  assert.equal(patchApplePackage(patched), patched);
  assert.throws(() => patchApplePackage('changed upstream'), /package changed/);
});
