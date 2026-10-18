const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('legacy control tokens follow the current light and dark accent', () => {
  const light = read('styles/lorefy-apple-ui.css');
  const dark = read('styles/lorefy-cinema-ui.css');
  assert.match(light, /\.lf-app\s*\{[^}]*--lf-purple:\s*var\(--apple-blue\)/s);
  assert.match(light, /\.lf-app\s*\{[^}]*--lf-purple-soft:\s*var\(--apple-blue-soft\)/s);
  assert.match(light, /\.lf-app\s*\{[^}]*--lf-sub:\s*var\(--apple-label-2\)/s);
  assert.match(light, /\.lf-app \.nc-sheet \[style\*="background: color-mix\(in srgb, rgb\(123, 47, 214\)"\]/);
  assert.match(dark, /\.lf-auth,\s*\.lf-app\.is-dark\s*\{[^}]*--lf-purple:\s*var\(--cinema-active\)/s);
  assert.match(dark, /\.lf-auth,\s*\.lf-app\.is-dark\s*\{[^}]*--cinema-active:\s*#0a84ff/s);
});

test('icon-only suggested-people search button has a specific accessible name', () => {
  const source = read('modules/lorefy-growth-features.js');
  assert.match(source, /m21 21-4\.3-4\.3/);
  assert.ok(source.includes(String.raw`\u0628\u062d\u062b \u0639\u0646 \u0623\u0634\u062e\u0627\u0635`));
});

test('updated UI assets use fresh cache keys', () => {
  const html = read('index.html');
  assert.match(html, /lorefy-apple-ui\.css\?v=20260925-ui-coherence-v1/);
  assert.match(html, /lorefy-cinema-ui\.css\?v=20261003-appearance-feather-v2/);
  assert.match(html, /lorefy-community\.css\?v=20261009-public-appearance-v4/);
  for (const asset of ['modules/lorefy-growth-features.js', 'modules/lorefy-i18n.js',
    'modules/lorefy-v2.js', 'modules/lorefy-public-profile.js', 'uploads/files/lorefy-app.js',
    'modules/lorefy-catalog-loader.js', 'modules/lorefy-explore-studio.js', 'styles/lorefy-explore-studio.css']) {
    const versions = {
      'modules/lorefy-growth-features.js':'20261018-editor-search-direction-v1',
      'modules/lorefy-public-profile.js':'20261016-reading-estimate-v1',
      'modules/lorefy-i18n.js':'20261016-statistics-activity-v1',
      'modules/lorefy-v2.js':'20261016-statistics-activity-v1',
      'uploads/files/lorefy-app.js':'20261018-image-preparation-deadline-v1',
      'modules/lorefy-catalog-loader.js':'20261018-search-all-formats-v1',
      'modules/lorefy-explore-studio.js':'20261018-search-all-formats-v1',
      'styles/lorefy-explore-studio.css':'20261018-search-suggestions-v1'
    };
    const version = versions[asset];
    const versioned = asset + '?v=' + version;
    assert.ok(html.includes(versioned), asset + ' entry cache key');
    assert.ok(read('sw.js').includes(versioned), asset + ' service worker cache key');
  }
});

test('thread body fills available height and its posts are unframed rows', () => {
  const css = read('styles/lorefy-community.css');
  assert.match(css, /\.lf-community-thread-body\s*\{[^}]*flex:\s*1 1 auto/s);
  assert.match(css, /\.lf-community-thread \.lf-community-post-card\s*\{[^}]*border-radius:\s*0/s);
  assert.match(css, /\.lf-community-thread \.lf-community-post-card\s*\{[^}]*box-shadow:\s*none/s);
});

test('detail character actions use the shared icon library, not text glyphs', () => {
  const source = read('modules/lorefy-growth-features.js');
  assert.match(source, /"data-lucide": "feather"/);
  assert.match(source, /"data-lucide": "trophy"/);
  assert.match(source, /function scheduleCharacterActionIcons\(\)/);
  assert.match(source, /global\.requestAnimationFrame\(function \(\) \{/);
  assert.doesNotMatch(source, /class: "lf-cab-icon", "aria-hidden": "true", text:/);
});
