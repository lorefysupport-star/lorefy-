const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles/lorefy-design-system.css'), 'utf8');
const growth = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');

test('editorial cover keeps its title and supporting copy legible over artwork', () => {
  assert.match(css, /\.lf-feature-meta\s*\{[^}]*color:\s*#fff\s*!important/s);
  assert.match(css, /\.lf-feature-meta\s+h3\s*\{[^}]*color:\s*#fff\s*!important/s);
  assert.match(css, /\.lf-feature-shade\s*\{[^}]*linear-gradient/s);
});

test('empty owner favorites offer one intentional selection action', () => {
  assert.match(growth, /favorites\.classList\.toggle\("is-empty",\s*!favorites\.querySelector\("img"\)\)/);
  assert.match(css, /\.lf-profile-favorites\.is-empty\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.lf-profile-favorites\.is-empty\s*>\s*\[role="button"\]:not\(:first-child\)\s*\{[^}]*display:\s*none/s);
});

test('profile character shelf has a distinct title and one useful empty action', () => {
  assert.match(growth, /el\("strong", \{ text: "الشخصيات المفضلة" \}\)/);
  assert.match(growth, /grid\.classList\.toggle\("is-empty", !items\.some\(Boolean\)\)/);
  assert.match(css, /\.lf-profile-top-characters-grid\.is-empty\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.lf-profile-top-characters-grid\.is-empty\s*>\s*\.lf-profile-top-character:not\(:first-child\)\s*\{[^}]*display:\s*none/s);
});

test('default profile banner uses reading photography while preserving custom banners', () => {
  assert.match(css, /\.lf-profile-banner:has\(> img\[src\^="data:image\/svg\+xml"\]\)\s*\{[^}]*lorefy-reading-scene\.jpg/s);
  assert.match(css, /\.lf-profile-banner > img\[src\^="data:image\/svg\+xml"\]\s*\{[^}]*opacity:\s*0/s);
});

test('sparse library and empty home replies do not leave dead space', () => {
  assert.match(css, /\.lf-library-grid:not\(\.is-shelf-view\):not\(\.is-spine-view\):has\(> \.lf-library-card:nth-child\(2\):last-child\)/);
  assert.match(css, /\.lf-home-reply-shelf:has\(\.lf-home-reply-empty\)\s*\{[^}]*display:\s*none/s);
});
