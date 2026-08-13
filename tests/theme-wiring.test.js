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
  assert.match(appSource, /i&&i\(a\)/);
  assert.match(appSource, /lf-app\$\{a\?" is-dark":" is-light"\}/);
});
