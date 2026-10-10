const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles/lorefy-interface-settings.css'), 'utf8');

test('profile cover fades into the identity area without masking the avatar or controls', () => {
  assert.match(css, /\.lf-profile-banner::before\s*\{[^}]*bottom:-76px[^}]*background:inherit/s);
  assert.match(css, /\.lf-profile-banner::after\s*\{[^}]*content:''\s*!important[^}]*bottom:-76px[^}]*linear-gradient\(to bottom,transparent,var\(--ui-bg\)\)[^}]*pointer-events:none/s);
  assert.match(css, /\.lf-profile-banner > img\s*\{[^}]*height:calc\(100% \+ 76px\)[^}]*mask-image:none/s);
  assert.match(css, /\.lf-profile-banner > :is\(div:last-child,button,div:has\(> button\)\)\s*\{[^}]*z-index:3/s);
  assert.doesNotMatch(css, /\.lf-profile-banner\s*\{[^}]*(?:filter:blur|mask-image)/s);
});

test('profile bookshelf eliminates reserved space above the tallest book', () => {
  assert.match(css, /\.lf-profile-page > \.lf-profile-favorites\.is-spine-view\s*\{[^}]*grid-auto-rows:auto[^}]*margin-top:0px\s*!important/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view > div\s*\{[^}]*height:var\(--spine-height,192px\)\s*!important[^}]*min-height:0\s*!important/s);
  assert.match(css, /\.lf-profile-identity:has\(\+ \.lf-profile-favorites\.is-spine-view\) \.lf-profile-top-works-head\s*\{[^}]*margin-bottom:0\s*!important/s);
});

test('bookshelf header reserves enough space for the shelf above the fixed navigation', () => {
  assert.match(css, /\.lf-profile-identity:has\(\+ \.lf-profile-favorites\.is-spine-view\) \.lf-profile-metrics\s*\{[^}]*margin-bottom:8px\s*!important/s);
  assert.match(css, /\.lf-profile-identity:has\(\+ \.lf-profile-favorites\.is-spine-view\) \.lf-profile-top-works-head\s*\{[^}]*min-height:28px\s*!important/s);
  assert.doesNotMatch(css, /\.lf-profile-favorites\.is-spine-view\s*\{[^}]*margin-top:-/s);
});
