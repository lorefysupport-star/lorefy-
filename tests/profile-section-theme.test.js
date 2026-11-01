const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('unframed profile sections reveal the continuous page material in every theme', () => {
  const css = fs.readFileSync('styles/lorefy-design-system.css', 'utf8');
  const sections = '.lf-app.lf-app.lf-app :is(.lf-profile-favorites, .lf-profile-recent, .lf-profile-top-characters)';
  const start = css.indexOf(sections + ' {');
  assert.notEqual(start, -1, 'section material must be separate from the page base');
  const rule = css.slice(start, css.indexOf('}', start));
  assert.match(rule, /background:\s*transparent\s*!important/);
  assert.doesNotMatch(rule, /var\(--ui-bg\)|linear-gradient|#[\da-f]/i);
  assert.match(css, /\.lf-app\.lf-app\.lf-app \.lf-profile-page\s*\{\s*background:\s*var\(--ui-bg\)\s*!important/);
});

test('theme continuity does not replace the wooden shelf or the book depth', () => {
  const css = fs.readFileSync('styles/lorefy-book-showcase.css', 'utf8');
  assert.match(css, /\.lf-profile-favorites\.is-spine-view[^}]*::after\s*\{[^}]*wall-walnut-v1\.png/s);
  const spine = fs.readFileSync('styles/lorefy-interface-settings.css', 'utf8');
  assert.match(spine, /\.lf-profile-spine-cover::after\s*\{[^}]*background:linear-gradient/s);
});
