const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles/lorefy-interface-settings.css'), 'utf8');

test('library rows have a single continuous shelf instead of separate underlines', () => {
  assert.match(css, /\.lf-library-grid\.is-spine-view\s*\{[^}]*--lf-shelf-row:240px[^}]*grid-auto-rows:var\(--lf-shelf-row\)[^}]*repeating-linear-gradient[^}]*background-origin:content-box/s);
  assert.match(css, /\.lf-library-grid\.is-spine-view \.lf-library-card::after\s*\{[^}]*display:none/s);
  assert.match(css, /\.lf-library-grid\.is-spine-view:has\(\.lf-empty-state\)\s*\{[^}]*background-image:none/s);
  assert.match(css, /\.lf-library-page:has\(\.lf-library-grid\.is-spine-view\)\s*\{[^}]*scrollbar-width:none/s);
});

test('library and profile spines share curved crowns and readable single-line titles', () => {
  for (const selector of ['\\.lf-library-grid\\.is-spine-view \\.lf-library-cover', '\\.lf-profile-favorites\\.is-spine-view \\.lf-profile-spine-cover']) {
    assert.match(css, new RegExp(selector + '\\s*\\{[^}]*border-radius:50% 50% 4px 4px / 9px 9px 4px 4px', 's'));
  }
  for (const selector of ['\\.lf-library-grid\\.is-spine-view \\.lf-library-spine-title', '\\.lf-profile-favorites\\.is-spine-view \\.lf-profile-spine-title']) {
    assert.match(css, new RegExp(selector + '\\s*\\{[^}]*white-space:nowrap[^}]*text-overflow:ellipsis[^}]*font-size:14px', 's'));
  }
  assert.doesNotMatch(css, /border-top:3px double/);
});

test('book crowns use the actual images and keep the favorite shelf geometry intact', () => {
  assert.match(css, /\.lf-library-grid\.is-spine-view \.lf-library-cover\s*\{[^}]*height:calc\(var\(--spine-height,188px\) \+ 28px\)/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view \.lf-profile-spine-cover\s*\{[^}]*height:var\(--spine-height,192px\)/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view::after\s*\{[^}]*width:100%[^}]*height:8px/s);
  assert.match(css, /\.lf-interface-preview-books\[data-mode='spines'\] \.lf-interface-preview-book\s*\{[^}]*border-radius:50% 50% 4px 4px/s);
});
