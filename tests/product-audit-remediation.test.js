const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('rating sort uses vote confidence instead of a raw five-star average', () => {
  const app = read('uploads/files/lorefy-app.js');
  assert.match(app, /ratingConfidenceScore=e=>/);
  assert.match(app, /topRated:a\(i,p=>ratingConfidenceScore\(p\)\)/);
  assert.match(app, /he==="rating"\?r=window\.LorefyCatalogData\.sortRanked\(r,ratingConfidenceScore\)/);
});

test('library resolves saved work parts and derives every tab count from visible records', () => {
  const loader = read('modules/lorefy-catalog-loader.js');
  const app = read('uploads/files/lorefy-app.js');
  assert.match(loader, /function loadWorks\(workIds\)/);
  assert.match(loader, /loadWorks:\s*loadWorks/);
  assert.match(app, /LorefyCatalogLoader\.loadWorks\(Object\.keys\(b\)\)/);
  assert.match(app, /const t=Object\.entries\(b\)\.map\(\(\[o,n\]\)=>\(\{id:o,m:workById\(o\),st:n\}\)\)\.filter\(o=>o\.m\)/);
  assert.match(app, /const s=t\.filter\(\(\{id:o,st:n\}\)=>de\(o,n\)\)\.length/);
});

test('search exposes catalog indexing state instead of presenting a partial count as final', () => {
  const app = read('uploads/files/lorefy-app.js');
  assert.match(app, /catalogSearchStatus=\(e,lang=currentUILang\(\)\)=>/);
  assert.match(app, /catalogSearchStatus\(r\.length,W\)/);
  assert.match(app, /جارٍ فهرسة بقية المكتبة/);
});

test('large character catalogs are loaded only when a character surface needs them', () => {
  const index = read('index.html');
  const characters = read('modules/lorefy-character-system.js');
  const worker = read('sw.js');
  const core = worker.slice(worker.indexOf('const CORE'), worker.indexOf('const CATALOG'));

  assert.doesNotMatch(index, /<script defer src="uploads\/lorefy-character-catalog\.js/);
  assert.match(index, /window\.LOREFY_CHARACTER_ASSETS/);
  assert.match(characters, /function ensureBundledCharacterCatalogs\(work\)/);
  assert.match(characters, /assetKey === "visual"/);
  assert.match(characters, /assets\[assetKey\]/);
  assert.match(characters, /return ensureBundledCharacterCatalogs\(work\)\.then\(function \(\) \{\s*return loadCastReady\(work, options\);/s);
  assert.doesNotMatch(core, /uploads\/lorefy-character-catalog\.js/);
});

test('community and profile controls expose descriptive accessible names and full touch targets', () => {
  const app = read('uploads/files/lorefy-app.js');
  const growth = read('modules/lorefy-growth-features.js');
  const social = read('styles/lorefy-review-social.css');

  assert.match(app, /aria-label":"الحسابات التي أتابعها/);
  assert.match(app, /aria-label":"الحسابات التي تتابعني/);
  assert.match(growth, /function setCommunityCountLabel\(btn, label, count\)/);
  assert.match(growth, /setCommunityCountLabel\(btn, "إعجاب", count\)/);
  assert.match(growth, /setCommunityCountLabel\(btn, "عدم إعجاب", count\)/);
  assert.match(social, /\.lf-community-card > \.lf-community-delete-button\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s);
});

test('adaptive tablet layout targets the actual home screen and uses the wider canvas', () => {
  const css = read('styles/lorefy-native-layout-fix.css');
  assert.match(css, /\.lf-home-screen/);
  assert.match(css, /@media\s*\(min-width:\s*900px\)/);
  assert.match(css, /--lf-tablet-content:\s*min\(calc\(100% -/);
  assert.match(css, /\.lf-profile-page[\s\S]*max-width:\s*980px/);
});
