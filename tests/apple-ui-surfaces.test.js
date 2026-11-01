const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function surfaces() {
  const match = read('styles/lorefy-design-system.css').match(/\/\* Apple UI surfaces[\s\S]*?\/\* End Apple UI surfaces \*\//);
  assert.ok(match, 'shared surfaces must cover current components, not retired home tabs');
  return match[0];
}

test('current Home and Explore tabs share a bounded segmented treatment and semantic selection', () => {
  const css = surfaces();
  assert.match(css, /\.lf-social-timeline > \.lf-community-tabs/);
  assert.match(css, /\.lf-explore-studio \.lf-explore-tabs/);
  assert.match(css, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /button\[aria-selected='true'\]/);
  assert.match(css, /font-weight:\s*650/);
  assert.match(css, /min-height:\s*44px/);
});

test('library search and sort have stable responsive tracks and readable search text', () => {
  const css = surfaces();
  assert.match(css, /\.lf-library-controls\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(112px,\s*\.65fr\)/);
  assert.match(css, /\.lf-library-controls input\s*\{[^}]*font-size:\s*16px/);
  assert.match(css, /:focus-within/);
  assert.doesNotMatch(css, /font-size:[^;]*vw|letter-spacing:\s*-/);
});

test('navigation material has an opaque fallback and honors transparency and contrast preferences', () => {
  const css = surfaces();
  assert.match(css, /\.lf-bottom-nav\s*\{[^}]*background:\s*var\(--ui-surface\)/);
  assert.match(css, /@supports[^\n]*backdrop-filter/);
  for (const preference of ['prefers-reduced-transparency: reduce', 'prefers-contrast: more']) {
    assert.ok(css.includes(preference), preference);
  }
  const accessibility = css.slice(css.indexOf('@media (prefers-reduced-transparency'));
  assert.match(accessibility, /backdrop-filter:\s*none\s*!important/);
  assert.match(accessibility, /background:\s*var\(--ui-surface\)\s*!important/);
  assert.match(accessibility, /border-color:\s*var\(--ui-ink\)/);
});

test('panel appearance is short, opacity-only and disabled for reduced motion', () => {
  const css = surfaces();
  assert.match(css, /animation:\s*lf-ui-surface-in 140ms ease-out/);
  const frames = css.match(/@keyframes lf-ui-surface-in\s*\{\s*from\s*\{([^}]+)\}\s*to\s*\{([^}]+)\}/);
  assert.ok(frames);
  assert.match(frames[1], /opacity:\s*0/);
  assert.match(frames[2], /opacity:\s*1/);
  assert.doesNotMatch(frames[0], /transform|width|height|filter/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none\s*!important/);
  assert.doesNotMatch(css, /pointer-events:\s*none/);
});

test('refreshed UI cache references match the source entry', () => {
  const asset = 'styles/lorefy-design-system.css?v=20261102-profile-empty-v1';
  assert.ok(read('index.html').includes(asset));
  assert.ok(read('sw.js').includes(asset));
});

test('settings title balances equal-width sides despite legacy icon target sizing', () => {
  const css = surfaces();
  assert.match(css, /html \.lf-app\.lf-app\.lf-app \.lf-settings-head button\s*\{[^}]*width:\s*64px\s*!important;\s*min-width:\s*64px\s*!important/);
  assert.match(css, /\.lf-settings-head > span:first-child\s*\{[^}]*width:\s*64px\s*!important/);
});

test('settings grabber belongs to its sheet even after the entry animation ends', () => {
  assert.match(surfaces(), /\.lf-settings-sheet\s*\{\s*position:\s*relative/);
});

test('small-phone library controls stack so the selected sort label is not clipped', () => {
  assert.match(surfaces(), /@media \(max-width: 480px\)\s*\{\s*\.lf-app\.lf-app\.lf-app \.lf-library-controls\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test('Explore tabs keep the approved 18px content gutter at desktop widths too', () => {
  const css = surfaces();
  assert.match(css, /\.lf-explore-studio \.lf-explore-tabs\s*\{\s*--ui-segment-inline:\s*18px/);
  assert.match(css, /var\(--ui-segment-inline,\s*var\(--ui-inline\)\)/);
});
