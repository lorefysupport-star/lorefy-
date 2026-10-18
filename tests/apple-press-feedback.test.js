const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function feedback() {
  const css = read('styles/lorefy-design-system.css');
  const section = css.match(/\/\* Immediate press feedback[\s\S]*?\/\* End immediate press feedback \*\//);
  assert.ok(section, 'shared controls need an authoritative press-feedback contract');
  return section[0];
}

test('core press feedback is immediate and excludes disabled controls', () => {
  const css = feedback();
  for (const control of ['.lf-profile-banner button', '.lf-nav-item', '.lf-primary', '.lf-btn', '.lf-rating-pick', '.lf-settings-switch']) {
    assert.ok(css.includes(control), control);
  }
  assert.match(css, /:not\(:disabled\):not\(\[aria-disabled='true'\]\):active/);
  assert.match(css, /transition-duration:\s*0s\s*!important/);
  assert.match(css, /opacity:\s*\.76\s*!important/);
  assert.doesNotMatch(css, /pointer-events|width:|height:|padding:|margin:/);
});

test('reduced-motion feedback replaces legacy press scaling with a static cue', () => {
  const css = feedback();
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /:active\s*\{\s*transform:\s*none\s*!important/);
  assert.match(reduced, /\.lf-profile-banner button/);
  assert.match(reduced, /\.lf-nav-item/);
  assert.doesNotMatch(css, /\.lf-app\s+\*.*transform:/);
});

test('entry and service worker use the same refreshed feedback stylesheet', () => {
  const asset = 'styles/lorefy-design-system.css?v=20261018-apple-press-v1';
  assert.ok(read('index.html').includes(asset));
  assert.ok(read('sw.js').includes(asset));
});
