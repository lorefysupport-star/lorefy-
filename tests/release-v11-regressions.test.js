const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('cloud state includes the reader collections and character ranking state', () => {
  const source = read('backend/lorefy-backend.js');
  [
    'lorefy.reviewTop4.v1',
    'lorefy.charTopLists.v1',
    'lorefy.customLists.v1',
    'lorefy.profile.preferenceBoards.v1',
    'lorefy.profile.preferenceBoardCovers.v1'
  ].forEach((key) => assert.match(source, new RegExp('"' + key.replace(/[.]/g, '\\.') + '"')));
  assert.match(source, /function accountStateKeys\(\)/);
  assert.match(source, /Object\.keys\(data\)\.forEach/);
});

test('character ratings refresh their old preview cache and render more than 25 rows initially', () => {
  const cast = read('modules/lorefy-character-system.js');
  const growth = read('modules/lorefy-growth-features.js');
  assert.match(cast, /lorefy\.characterCastCache\.v20/);
  assert.match(growth, /var INITIAL_CHARACTER_RENDER_LIMIT = 60;/);
  assert.match(growth, /renderLimit \+= 60/);
  assert.match(growth, /renderLimit = INITIAL_CHARACTER_RENDER_LIMIT;/);
  assert.match(growth, /characterSystem\.loadCast\(w\.sourceWork \|\| w, \{ allowTitleSearch: true \}\)/);
});

test('cover alternatives are normalized before the picker renders them', () => {
  const app = read('uploads/files/lorefy-app.js');
  assert.match(app, /normalizeCoverChoices=e=>/);
  assert.match(app, /const r=normalizeCoverChoices\(/);
  const api = read('modules/lorefy-cover-api.js');
  assert.match(api, /lorefy-public\/catalog-/);
});

test('native sharing writes a real image file before opening the system share sheet', () => {
  const source = read('modules/lorefy-share-studio.js');
  const pkg = JSON.parse(read('package.json'));
  assert.match(source, /getCapacitorPlugin\("Filesystem"\)/);
  assert.match(source, /getCapacitorPlugin\("Share"\)/);
  assert.match(source, /persistNativeShareFile/);
  assert.match(source, /حفظ الصورة/);
  assert.equal(pkg.dependencies['@capacitor/filesystem'], '8.1.3');
  assert.equal(pkg.dependencies['@capacitor/share'], '8.0.1');
});

test('the public media proxy permits the trusted Open Library archive redirect', () => {
  const source = read('supabase/functions/lorefy-public/index.ts');
  assert.match(source, /"archive\.org"/);
  assert.match(source, /host\.endsWith\("\.archive\.org"\)/);
});

test('community reactions persist remotely and use semantic action mapping', () => {
  const source = read('modules/lorefy-growth-features.js');
  const like = source.slice(source.indexOf('function wireCommunityLike'), source.indexOf('function wireCommunityDislike'));
  const enhance = source.slice(source.indexOf('function enhanceCommunityCards'), source.indexOf('function enhanceCommunityPage'));
  assert.match(like, /async function/);
  assert.match(like, /await persistReviewReaction\(card, "like", adding\)/);
  assert.match(enhance, /communityActionType/);
  assert.match(enhance, /bookmark/);
});

test('native layout reserves variable safe areas for headers and bottom controls', () => {
  const html = read('index.html');
  const css = read('styles/lorefy-native-layout-fix.css');
  assert.match(html, /lorefy-native-layout-fix\.css/);
  assert.match(html, /--nc-top:max\(env\(safe-area-inset-top, 0px\), 48px\);/);
  assert.match(html, /--nc-bottom:max\(env\(safe-area-inset-bottom, 0px\), 26px\);/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /max\(8px,\s*var\(--lf-safe-bottom\)\)/);
  assert.match(css, /\.lf-home-header,[\s\S]*?padding-top: calc\(var\(--lf-safe-top\) \+ 14px\) !important;/);
  assert.match(css, /\.lf-character-page-top\s*\{\s*top: 0/);
  assert.match(css, /\.lf-character-page-top,[\s\S]*?padding-top:\s*calc\(var\(--lf-safe-top\) \+ 14px\)/);
  assert.match(css, /100dvh - var\(--lf-safe-top\) - var\(--lf-safe-bottom\)/);
});

test('native shell follows every modern iPhone and iPad viewport', () => {
  const html = read('index.html');
  const css = read('styles/lorefy-native-layout-fix.css');

  assert.match(html, /data-lorefy-adaptive-shell/);
  assert.match(html, /visualViewport\.addEventListener\(['"]resize['"],\s*fit\)/);
  assert.match(html, /params\.get\(['"]adaptive['"]\)\s*===\s*['"]1['"]/);
  assert.match(html, /width:100vw;height:100dvh;min-height:100svh/);
  assert.match(css, /@media\s*\(min-width:\s*700px\)/);
  assert.match(css, /--lf-tablet-content:\s*min\(calc\(100% -/);
  assert.match(css, /\.lf-bottom-nav\s*\{[^}]*max-width:\s*760px/s);
  assert.match(css, /html\[data-lorefy-adaptive-shell="true"\]\s+\.lf-app\s+\.lf-bottom-nav\s*\{[^}]*left:\s*50%\s*!important[^}]*width:[^;]+!important[^}]*transform:\s*translateX\(-50%\)\s*!important/s);
  assert.match(css, /\.lf-community-page\.lf-community-v2\s*\{[^}]*width:[^;]+!important[^}]*max-width:\s*760px\s*!important[^}]*margin-inline:\s*auto\s*!important/s);
});

test('review publishing upserts a reader work review rather than exposing the unique constraint', () => {
  const migration = read('supabase/migrations/20260825000000_release_v11_review_upsert.sql');
  assert.match(migration, /on conflict \(user_id, work_id\) do update/i);
  assert.match(migration, /returning \* into row_out/i);
});
