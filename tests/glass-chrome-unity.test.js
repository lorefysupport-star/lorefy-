const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const design = require('../modules/lorefy-design-system');
const read = file => fs.readFileSync(file, 'utf8');

test('glass highlights and elevation adapt to the chosen brightness instead of a fixed white rim', () => {
  for (const mode of ['dark', 'light', 'pink', 'custom-dark-00806b', 'custom-light-df7134']) {
    const tokens = design.tokens(mode);
    assert.ok(tokens['--ui-glass-shadow'], mode);
    assert.ok(tokens['--ui-glass-edge'], mode);
    const alpha = Number(tokens['--ui-glass-highlight'].match(/,([\d.]+)\)/)[1]);
    assert.ok(design.isDark(mode) ? alpha <= .2 : alpha >= .4, mode);
  }
});

test('nested export dialogs receive shared materials without recoloring the exported image', () => {
  const css = read('styles/lorefy-glass-materials.css');
  assert.match(css, /\.lf-export-overlay\s*\{[^}]*--glass-fill:/s);
  const exportCss = read('styles/lorefy-share-composer.css');
  assert.match(exportCss, /\.lf-export-sheet[^{}]*\{[^}]*background:var\(--glass-reflection\),var\(--glass-sheet\)/s);
  assert.match(exportCss, /\.lf-export-footer[^{}]*\{[^}]*background:transparent/s);
  assert.doesNotMatch(css, /\.lf-export-preview[^{}]*\{/);
});

test('notification chrome cannot fall back to the old unlayered blur', () => {
  const css = read('styles/lorefy-notification-center.css');
  assert.match(css, /backdrop-filter:var\(--glass-blur\) !important/);
  assert.match(css, /border-bottom:1px solid var\(--glass-edge\) !important/);
});

test('community transient controls share material while timeline content stays unframed', () => {
  const css = read('styles/lorefy-glass-materials.css');
  for (const selector of ['.lf-community-post-menu>div', '.lf-community-edit>section', '.lf-community-undo']) {
    assert.ok(css.includes(selector), selector);
  }
  assert.match(css, /box-shadow:var\(--glass-shadow\) !important/);
  assert.doesNotMatch(css, /\.lf-community-post\s*\{|\.lf-community-post-card\s*\{/);
});

test('increased contrast and reduced transparency share an opaque material fallback', () => {
  const css = read('styles/lorefy-glass-materials.css');
  assert.match(css, /@media \(prefers-reduced-transparency:reduce\), \(prefers-contrast:more\)[^{]*\{[^]*?--glass-fill:var\(--ui-surface\)/);
  assert.match(css, /--glass-edge:var\(--ui-ink\)/);
});

test('desktop navigation keeps one bounded dock across all routes', () => {
  const css = read('styles/lorefy-glass-materials.css');
  assert.match(css, /@media \(min-width:700px\)[^{]*\{\s*\.lf-app \.lf-bottom-nav\s*\{[^}]*max-width:560px !important/);
});
