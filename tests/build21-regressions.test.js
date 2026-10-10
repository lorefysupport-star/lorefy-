const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const growth = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
const share = fs.readFileSync(path.join(root, 'modules/lorefy-share-studio.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');

test('review share previews keep a visible cover fallback when remote media fails', () => {
  const preview = growth.slice(
    growth.indexOf('function createCommunityReviewSharePreview('),
    growth.indexOf('function openCommunityReviewShareSheet(')
  );

  assert.match(preview, /data-share-src/);
  assert.match(preview, /lf-work-share-cover-fallback/);
  assert.match(preview, /addEventListener\("error"/);
  assert.match(fs.readFileSync(path.join(root, 'styles/lorefy-share-studio.css'), 'utf8'), /lf-work-share-cover-fallback/);
});

test('best-four works use the native editor and persist without opening the React sheet', () => {
  const opener = growth.slice(
    growth.indexOf('function openProfileFavouriteWorksEditor('),
    growth.indexOf('function syncProfileFavouriteWorksControls(')
  );

  assert.match(opener, /ovOpen\("lf-profile-top-works-editor", uiText\("المفضلة", "Favorites"\)\)/);
  assert.match(opener, /lorefy\.user\.favorites\.v2/);
  assert.match(opener, /write\("lorefy\.user\.favorites\.v2"/);
  assert.doesNotMatch(opener, /trigger\.click\(\)/);
});

test('best-four editors are protected against duplicate overlays', () => {
  const characterEditor = growth.slice(
    growth.indexOf('function openProfileTopCharactersEditor('),
    growth.indexOf('function renameProfileFavouriteWorksHeading(')
  );

  assert.match(characterEditor, /lf-profile-top-characters-editor/);
  assert.match(characterEditor, /querySelector\("\.lf-profile-top-characters-editor"\)/);
  assert.match(growth, /querySelector\("\.lf-profile-top-works-editor"\)/);
});

test('favourite work ids survive a partial catalog boot until the full catalog is ingested', () => {
  const start = app.indexOf('const a="lorefy.user.favorites.v2"');
  const cleanup = app.slice(start, app.indexOf('const p="lorefy.user.progress.v2"', start));

  assert.match(cleanup, /String\(v\|\|""\)\.trim\(\)/);
  assert.doesNotMatch(cleanup, /c\.filter\(v=>MANGA_BY_ID\.has\(String\(v\)\)\)/);
});

test('profile work lookup resolves records appended by progressive catalog loading', () => {
  const lookup = app.slice(app.indexOf('const workById='), app.indexOf('const SAMPLE_WORK_IDS', app.indexOf('const workById=')));

  assert.match(lookup, /MANGA_BY_ID\.get\(String\(e\)\)\|\|MANGA\.find/);
});

test('favourite state validation does not delete ids before progressive catalog loading completes', () => {
  const stateEffects = app.slice(app.indexOf('yo(r=>{const o=new Set'), app.indexOf('const Un=', app.indexOf('yo(r=>{const o=new Set')));
  const favouriteEffect = stateEffects.slice(0, stateEffects.indexOf('),Lt('));

  assert.match(favouriteEffect, /yo\(r=>\{const o=new Set/);
  assert.doesNotMatch(favouriteEffect, /\|\|!workById\(d\)\?\!1/);
});
