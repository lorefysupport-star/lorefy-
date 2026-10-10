const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backend = fs.readFileSync(path.resolve(__dirname, '..', 'backend', 'lorefy-backend.js'), 'utf8');

test('sign-out clears every account-owned local storage namespace', () => {
  assert.match(backend, /ACCOUNT_STORAGE_PREFIXES/);
  for (const prefix of [
    'lorefy.user.',
    'lorefy.characterRatings.',
    'lorefy.characterReview.',
    'lorefy.characterCustomImages.',
    'lorefy.customLists.',
    'lorefy.privacy.',
    'lorefy.recommendations.',
    'lorefy.review.saved.',
    'lorefy.reviewTop4.',
    'lorefy.safety.'
  ]) assert.match(backend, new RegExp(prefix.replace(/\./g, '\\.')));
  assert.match(backend, /ACCOUNT_STORAGE_PREFIXES\.some/);
  assert.match(backend, /owned\.forEach\(function\(key\)\{ localStorage\.removeItem\(key\)/);
});

test('sign-out and invalid-session cleanup clear locally retained diagnostics', () => {
  const clearDiagnostics = /window\.LorefyMonitoring\.clear\(\)/g;
  assert.equal((backend.match(clearDiagnostics) || []).length, 2);
});
