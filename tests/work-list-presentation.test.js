const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('work artwork has a responsive large banner and a larger readable poster', () => {
  const css = read('styles/lorefy-work-surface.css');
  assert.match(css, /\.lf-detail-hero \{[^}]*height: clamp\(240px,64vw,300px\)/);
  assert.match(css, /\.lf-work-poster \{[^}]*width: 120px; height: 180px/);
});

test('list previews use two folder columns with fanned contents and a front pocket', () => {
  const css = read('styles/lorefy-profile-sections.css');
  assert.match(css, /\.lf-profile-folder-grid \{[^}]*grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.lf-profile-folder-stage \{[^}]*aspect-ratio: 1\.12/s);
  assert.match(css, /\.lf-profile-folder-pocket \{[^}]*position: absolute/s);
  assert.match(css, /transform: rotate\(-10deg\)/);
  assert.match(css, /transform: rotate\(10deg\)/);
  assert.match(css, /\.lf-profile-list-intro/);
  assert.match(css, /\.lf-profile-ranked-list:not\(\.is-editing\) \.lf-profile-list-image \{[^}]*width: 64px; height: 86px/);
});

test('folder previews and detail summaries expose privacy without translating user content', () => {
  const source = read('modules/lorefy-profile-sections.js');
  assert.match(source, /class:'lf-profile-folder-caption'/);
  assert.match(source, /class:'lf-profile-list-intro'/);
  assert.match(source, /folder\.isPublic\?'globe':'lock'/);
  assert.match(source, /--list-art-count/);
  assert.match(source, /'aria-label':folder\.name\+' · '\+folderMeta\(folder,t\)/);
  assert.match(source, /'data-no-translate':'true',dir:'auto',text:folder\.name/);
});
