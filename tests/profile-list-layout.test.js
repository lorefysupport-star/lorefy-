const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const css = read('styles/lorefy-profile-sections.css');

test('ranked list rows allocate the intrinsic width of all three touch controls', () => {
  assert.match(css, /\.lf-profile-ranked-list\.is-editing > li\s*\{[^}]*grid-template-columns:\s*22px 36px minmax\(0,1fr\) max-content/s);
  assert.match(css, /\.lf-profile-rank-tools\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(3,44px\);[^}]*gap:\s*4px/s);
  assert.doesNotMatch(css, /grid-template-columns:\s*22px 36px minmax\(0,1fr\) 84px/);
});

test('rank tool hit targets have matching width and height without shrinking', () => {
  assert.match(css, /\.lf-profile-section-button\.is-icon\s*\{[^}]*width:\s*44px;[^}]*min-height:\s*44px/s);
  assert.match(css, /\.lf-profile-rank-tools > button\s*\{[^}]*box-sizing:\s*border-box;[^}]*min-width:\s*44px/s);
});
