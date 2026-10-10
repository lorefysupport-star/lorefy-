const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('community feed uses continuous rows while attachments retain their own treatment', () => {
  const css = read('styles/lorefy-community.css');
  const base = read('styles/lorefy-system.css');
  assert.match(css, /\.lf-community-post-list\s*\{[^}]*gap:\s*0;/s);
  assert.match(css, /\.lf-community-post-card\s*\{[^}]*border-bottom:\s*1px solid var\(--lf-border/s);
  assert.doesNotMatch(css, /\.lf-community-post-card\[data-community-post-kind="(?:list|top)"\]::before/);
  assert.match(css, /\.lf-community-post-card \.lf-community-attachment\s*\{[^}]*background:/s);
  assert.match(base, /\.lf-community-page article:not\(\.lf-community-post-card\)/);
});

test('search filters have full touch targets', () => {
  const css = read('styles/lorefy-apple-ui.css');
  assert.match(css, /\.lf-search-header > div:nth-of-type\(2\) > button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.lf-search-header > div:nth-of-type\(3\) > button\s*\{[^}]*min-height:\s*44px/s);
});

test('profile reading progress shares the navigation accent', () => {
  const css = read('styles/lorefy-apple-ui.css');
  assert.match(css, /\.lf-app svg\[stroke="#7b2fd6" i\]\s*\{[^}]*stroke:\s*var\(--apple-blue\)/s);
  assert.match(css, /\.lf-profile-page \[style\*="background: color-mix\(in srgb, rgb\(123, 47, 214\)"\]\s*\{[^}]*background:\s*var\(--apple-blue\)/s);
});

test('profile shortcuts use library icons and a single row style', () => {
  const js = read('modules/lorefy-growth-features.js');
  const css = read('styles/lorefy-system.css');
  const legacy = read('styles/lorefy-redesign.css');
  assert.match(js, /function extraIcon\(name\)/);
  assert.match(js, /extraIcon\("list"\)/);
  assert.match(js, /extraIcon\("chart-no-axes-column"\)/);
  assert.match(js, /extraIcon\("download"\)/);
  assert.match(js, /extraIcon\("bookmark"\)/);
  assert.doesNotMatch(js, /class: "lf-extra-ic", text: "[▤✦⇄▱]"/);
  assert.match(css, /\.lf-extras-row\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(css, /\.lf-extra-card\s*\{[^}]*min-height:\s*64px;/s);
  assert.doesNotMatch(legacy, /\.lf-extra-card\s*,/);
});
