const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('theme state is wired from the app to the document shell', () => {
  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const appSource = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');

  assert.match(indexSource, /onTheme:\s*onTheme/);
  assert.match(appSource, /lorefy\.ui\.theme\.v1/);
  assert.match(appSource, /c\(n=>!n\)/);
  assert.match(appSource, /i&&i\(a,appearance\)/);
  assert.match(appSource, /lf-app is-\$\{window\.LorefyDesignSystem\.baseMode\(appearance\)\}/);
  assert.match(appSource, /LorefyDesignSystem\.withBase\(appearance/);
  assert.match(appSource, /LorefyDesignSystem\.tokens\(appearance\)/);
});

test('the dark authentication surface defines the core tokens used by account fields', () => {
  const cinemaSource = fs.readFileSync(path.join(root, 'styles', 'lorefy-cinema-ui.css'), 'utf8');

  assert.match(cinemaSource, /\.lf-auth\s*\{[\s\S]*?--lf-paper:\s*var\(--cinema-bg\)/);
  assert.match(cinemaSource, /\.lf-auth\s*\{[\s\S]*?--lf-surface:\s*var\(--cinema-surface\)/);
  assert.match(cinemaSource, /\.lf-auth\s*\{[\s\S]*?--lf-ink:\s*var\(--cinema-ink\)/);
  assert.match(cinemaSource, /\.lf-auth\s*\{[\s\S]*?--lf-ink-secondary:\s*var\(--cinema-muted\)/);
});
