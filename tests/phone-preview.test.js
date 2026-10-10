const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('phone preview uses iPhone 16 Pro Max logical dimensions and fits the complete shell', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'phone-preview.html'), 'utf8');
  assert.match(html, /\.phone\s*\{[^}]*width:440px;\s*height:956px;/);
  assert.match(html, /iframe\s*\{[^}]*width:440px;\s*height:956px;/);
  assert.match(html, /\(innerWidth - 32\) \/ 440/);
  assert.match(html, /\(innerHeight - 32\) \/ 956/);
  assert.match(html, /title="Lorefy iPhone 16 Pro Max preview"/);
  assert.match(html, /\.phone\s*\{[^}]*padding:0;[^}]*background:transparent;[^}]*box-shadow:none/);
});
