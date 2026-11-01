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
  assert.match(html, /lorefy-community\.css\?v=20261028-community-copy-v1/);
  for (const asset of ['modules/lorefy-growth-features.js', 'modules/lorefy-i18n.js',
    'modules/lorefy-v2.js', 'modules/lorefy-public-profile.js', 'uploads/files/lorefy-app.js',
    'modules/lorefy-catalog-loader.js', 'modules/lorefy-explore-studio.js', 'styles/lorefy-explore-studio.css',
    'modules/lorefy-library-cinema.js','styles/lorefy-library-cinema.css','modules/lorefy-library-view.js','styles/lorefy-explore-cinema.css',
    'styles/lorefy-work-cinema.css','styles/lorefy-home-cinema.css','styles/lorefy-community.css','modules/lorefy-chapter-detail.js','modules/lorefy-community.js',
    'styles/lorefy-work-studio.css','modules/lorefy-work-panels.js','modules/lorefy-review-editor.js',
    'backend/lorefy-native-runtime.js','modules/lorefy-reading-metrics.js','styles/lorefy-notification-center.css',
    'backend/lorefy-backend.js','modules/lorefy-home-cinema.js']) {
    const versions = {
      'modules/lorefy-growth-features.js':'20261101-character-studio-v1',
      'modules/lorefy-community.js':'20261101-feed-layout-v1',
      'modules/lorefy-chapter-detail.js':'20261101-completed-progress-v1',
      'styles/lorefy-work-studio.css':'20261029-cover-editions-v1',
      'modules/lorefy-work-panels.js':'20261029-cover-editions-v1',
      'modules/lorefy-review-editor.js':'20261101-recommendation-logic-v1',
      'styles/lorefy-work-cinema.css':'20261028-byline-type-v1',
      'styles/lorefy-home-cinema.css':'20261026-work-cinema-v1',
      'styles/lorefy-community.css':'20261028-community-copy-v1',
      'modules/lorefy-public-profile.js':'20261101-profile-count-v1',
      'modules/lorefy-i18n.js':'20261028-reading-terms-v1',
      'modules/lorefy-v2.js':'20261016-statistics-activity-v1',
      'uploads/files/lorefy-app.js':'20261101-reading-favorite-type-v1',
      'backend/lorefy-backend.js':'20261101-friend-logic-v1',
      'modules/lorefy-home-cinema.js':'20261101-home-reading-v1',
      'backend/lorefy-native-runtime.js':'20261030-inbox-receipt-scope-v1',
      'modules/lorefy-reading-metrics.js':'20261101-completed-progress-v1',
      'styles/lorefy-notification-center.css':'20261027-inbox-durable-v1',
      'modules/lorefy-library-cinema.js':'20261101-home-reading-v1',
      'styles/lorefy-library-cinema.css':'20261026-library-plain-v3',
      'modules/lorefy-library-view.js':'20261029-library-media-v1',
      'modules/lorefy-catalog-loader.js':'20261021-search-audit',
      'modules/lorefy-catalog-map-loader.js':'20261018-runtime-cleanup-v1',
      'uploads/lorefy-catalog-summary.js':'20261018-runtime-cleanup-v1',
      'modules/lorefy-explore-studio.js':'20261029-search-editions-v1',
      'styles/lorefy-explore-cinema.css':'20261029-search-editions-v1',
      'styles/lorefy-explore-studio.css':'20261021-explore-refine-v2'
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
