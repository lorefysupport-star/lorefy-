const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('privacy and safety tools are mounted in settings instead of the profile body', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-product-tools.js'), 'utf8');
  assert.match(source, /function enhanceSettings\(/);
  assert.doesNotMatch(source, /function enhanceProfile\(/);
  assert.match(source, /\.lf-product-hub[^\n]*remove/);
});

test('community enhancement never creates the promotional hero or feed label', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const start = source.indexOf('function enhanceCommunityPage()');
  const end = source.indexOf('function renderReviewDetailDislikeIcon()', start);
  const enhancement = source.slice(start, end);
  assert.doesNotMatch(enhancement, /buildCommunityHero\(/);
  assert.doesNotMatch(enhancement, /el\([^\n]*lf-community-feed-label/);
  assert.match(enhancement, /lf-community-feed-label[^\n]*remove/);
  assert.match(enhancement, /hero\.remove\(\)/);
});

test('community actions ignore the review options menu and enhance the real action row', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const start = source.indexOf('function enhanceCommunityCards(page)');
  const end = source.indexOf('function enhanceCommunityPage()', start);
  const enhancement = source.slice(start, end);
  assert.match(enhancement, /querySelector\("\.lf-product-review-menu"\)/);
  assert.match(enhancement, /button !== menu/);
  assert.match(enhancement, /Array\.prototype\.filter\.call\(card\.querySelectorAll\("button"\)/);
  assert.match(enhancement, /button.parentElement !== card && communityActionType\(button\) === 'comment'/);
  assert.match(enhancement, /var row = rowButton && rowButton.parentElement/);
});

test('community cards use the compact review-detail visual treatment', () => {
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-product-tools.css'), 'utf8');
  assert.match(styles, /Unified community review feed/);
  assert.match(styles, /\.lf-community-card::before\s*\{\s*display:\s*none/);
  assert.match(styles, /\.lf-community-card \.lf-community-action-row/);
});

test('home screen renders a retry state instead of crashing with an empty catalog', () => {
  const source = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  assert.match(source, /LorefyCatalogPlan\.pickFeaturedWork/);
  assert.match(source, /if\(!P&&!MANGA.length\)return/);
  assert.match(source, /P&&React.createElement\("div",\{className:"lf-feature-card"/);
  assert.match(source, /\\u0625\\u0639\\u0627\\u062F\\u0629 \\u0627\\u0644\\u0645\\u062D\\u0627\\u0648\\u0644\\u0629/);
});

test('large image galleries keep the first paint bounded while retaining pagination', () => {
  const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  const characters = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  assert.match(app, /const COVER_PICKER_BATCH=18,PROFILE_LIBRARY_BATCH=60/);
  assert.match(app, /loading:"lazy",decoding:"async"/);
  assert.match(characters, /var INITIAL_CHARACTER_RENDER_LIMIT = 60;/);
  assert.match(characters, /var renderLimit = INITIAL_CHARACTER_RENDER_LIMIT;/);
  assert.match(characters, /renderLimit = INITIAL_CHARACTER_RENDER_LIMIT/);
  assert.match(characters, /renderLimit \+= 60/);
  assert.match(characters, /searchTimer = global\.setTimeout/);
});

test('list work search results render a cover thumbnail instead of text-only rows', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const charListEditor = source.slice(source.indexOf('function renderCharEditor('), source.indexOf('function renderEditor('));
  const workListEditor = source.slice(source.indexOf('function renderEditor('), source.indexOf('if (opts.charListId)'));

  assert.match(source, /function mlResultCover\(w\)/);
  assert.match(source, /class: "lf-ml-result-cover"/);
  assert.match(charListEditor, /mlResultCover\(w\)/);
  assert.match(workListEditor, /mlResultCover\(w\)/);
});

test('share and review labels stay valid Arabic UTF-8', () => {
  const source = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  const reviewLabel = source.slice(source.indexOf('lf-rev-top4-label') - 80, source.indexOf('lf-rev-top4-label') + 260);
  const shareCanvas = source.slice(source.indexOf('const createProfileBoardShareImage'), source.indexOf('const isProfileBoard'));
  assert.match(reviewLabel, /أفضل الشخصيات/);
  assert.match(shareCanvas, /لوحة قابلة للمشاركة كصورة من تطبيق Lorefy/);
  assert.doesNotMatch(reviewLabel, /âک|ط£ط|ظ…ط/);
  assert.doesNotMatch(shareCanvas, /ط£ط|ظ…ط|ط®ط/);
});

test('interface motion avoids broad transition-all rules', () => {
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-system.css'), 'utf8');
  const reviewStyles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');
  assert.doesNotMatch(styles, /transition:\s*all\b/);
  assert.doesNotMatch(reviewStyles, /transition:\s*all\b/);
});

test('review, profile, and home social layers use the new review design hooks', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(source, /function syncProfileRatedCharacters\(/);
  assert.match(source, /class: "lf-profile-rated-characters"/);
  assert.match(source, /function syncHomeReplyShelf\(/);
  assert.match(source, /lorefy\.user\.replyInbox\.v1/);
  assert.match(source, /function captureReplyActivity\(/);
  assert.match(source, /lf-review-composer-metrics-grid/);
  assert.match(styles, /\.lf-review-composer-v2/);
  assert.match(styles, /\.lf-profile-rated-characters/);
  assert.match(styles, /\.lf-home-reply-shelf/);
  assert.match(index, /lorefy-review-social\.css/);
});

test('character ratings use quarter sliders with a feather emblem and the profile shelf mirrors favourites', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');
  const scoreControl = source.slice(source.indexOf('function scoreControl('), source.indexOf('function characterRow('));
  const profileTile = source.slice(source.indexOf('function profileRatedCharacterPortrait('), source.indexOf('function openProfileRatedCharacters('));

  assert.match(scoreControl, /"data-lucide": "feather"/);
  assert.match(scoreControl, /type: "range"[^\n]*step: "0\.25"/);
  assert.match(scoreControl, /Number\(v\)\.toFixed\(2\)/);
  assert.match(scoreControl, /row\.setAttribute\("data-score", String\(v \|\| 0\)\)/);
  assert.doesNotMatch(source, /اضغط رقمًا من 1 إلى 5 لكل شخصية/);
  assert.match(profileTile, /class: "lf-profile-rated-character-stars"/);
  assert.match(profileTile, /aria-label": item\.score \+ uiText\(" من 5", " out of 5"\)/);
  assert.doesNotMatch(profileTile, /lf-profile-rated-character-score/);
  assert.match(styles, /\.lf-profile-rated-characters-rail\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/s);
  assert.match(styles, /\.lf-character-page \.lf-character-score-button\.is-active[^}]*var\(--lf-review-amber/s);
  assert.match(styles, /\.lf-character-page \.lf-character-meta strong[^}]*var\(--apple-label/s);
  assert.match(styles, /\.lf-app\.is-dark \.lf-character-page-top/);
});

test('rated-character view-all control is rewired when the profile section already exists', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const sync = source.slice(source.indexOf('function syncProfileRatedCharacters('), source.indexOf('function syncProfileCommunitySummary('));

  assert.match(sync, /section\.querySelector\("\.lf-profile-rated-characters-all"\)/);
  assert.match(sync, /showAll\.dataset\.lfProfileRatedCharactersWired/);
  assert.match(sync, /showAll\.addEventListener\("click", openProfileRatedCharacters\)/);
});

test('profile character sections preserve the requested order and responsive grids', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');

  assert.match(source, /function syncProfileTopCharacters\(/);
  assert.match(source, /lorefy\.user\.profileTopCharacters\.v1/);
  assert.match(source, /function profileTopCharacterSelection\(/);
  assert.match(source, /function openProfileTopCharactersEditor\(/);
  assert.match(source, /class: "lf-profile-top-characters"/);
  assert.match(source, /text: "الشخصيات المفضلة"/);
  assert.match(source, /text: "تعديل"/);
  assert.match(source, /textContent = "المفضلة"/);
  assert.match(source, /page\.insertBefore\(topCharacters, favorites\.nextSibling\)/);
  assert.match(source, /page\.insertBefore\(recent, rated\)/);
  assert.match(source, /var anchor = doc\.querySelector\("\.lf-profile-reading-results"\) \|\| rated \|\| recent \|\| topCharacters \|\| favorites/);
  assert.match(styles, /\.lf-profile-top-characters-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/s);
  assert.match(source, /class: "lf-rated-character-shelf"/);
  assert.match(source, /class: "lf-rated-character-shelf-rail"/);
  assert.match(source, /class: "lf-rated-character-shelf-card"/);
  const atlas = fs.readFileSync(path.join(root, 'styles/lorefy-character-atlas.css'), 'utf8');
  assert.match(atlas, /\.lf-rated-character-shelf-rail\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[^}]*grid-auto-flow:\s*row/s);
  assert.match(styles, /\.lf-profile-rated-characters-page \.lf-ov-body\s*\{[^}]*display:\s*block/s);
});

test('every best-four character tile uses a direct native button editor trigger', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const tile = source.slice(source.indexOf('function profileTopCharacterTile('), source.indexOf('function profileTopCharacterSelection('));

  assert.match(tile, /"aria-label": character \? uiText\("تعديل ", "Edit "\) \+ name/);
  assert.match(tile, /el\("button", \{/);
  assert.match(tile, /type: "button"/);
  assert.match(tile, /"data-lf-top-character-editor": "slot"/);
  assert.match(tile, /tile\.addEventListener\("click", openProfileTopCharactersEditorFromControl, true\)/);
  assert.doesNotMatch(tile, /openCharacterPage\(/);
});

test('best-four character controls survive React replacing a pressed profile card', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');
  const controls = source.slice(source.indexOf('function openProfileTopCharactersEditorFromControl('), source.indexOf('function profileTopCharacterSelection('));
  const sync = source.slice(source.indexOf('function syncProfileTopCharacters('), source.indexOf('function hydrateProfileRatedCharacters('));
  const boot = source.slice(source.indexOf('function boot()'), source.indexOf('if (doc.readyState'));

  assert.match(source, /function wireProfileTopCharacterEditorDelegation\(/);
  assert.match(source, /doc\.addEventListener\("click", function \(event\)/);
  assert.match(source, /closest\('\[data-lf-top-character-editor\]'\)/);
  assert.match(boot, /wireProfileTopCharacterEditorDelegation\(\)/);
  assert.match(controls, /event\.stopPropagation\(\)/);
  assert.match(controls, /event\.stopImmediatePropagation\(\)/);
  assert.match(controls, /tile\.addEventListener\("click", openProfileTopCharactersEditorFromControl, true\)/);
  assert.match(sync, /header\.addEventListener\("click", openProfileTopCharactersEditorFromControl, true\)/);
  assert.match(controls, /openProfileTopCharactersEditor\(\)/);
  assert.match(styles, /\.lf-profile-top-character-image\s*\{[^}]*pointer-events:\s*none/s);
});

test('best-four character shelf keeps stable press targets and opens from its heading', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const sync = source.slice(source.indexOf('function syncProfileTopCharacters('), source.indexOf('function hydrateProfileRatedCharacters('));

  assert.match(sync, /data-lf-top-character-signature/);
  assert.match(sync, /if \(grid\.getAttribute\("data-lf-top-character-signature"\) !== signature\)/);
  assert.match(sync, /el\("button", \{/);
  assert.match(sync, /type: "button"/);
  assert.match(sync, /"data-lf-top-character-editor": "heading"/);
  assert.match(sync, /header\.addEventListener\("click", openProfileTopCharactersEditorFromControl, true\)/);
});

test('best-four character cards keep the shelf shape in dark mode', () => {
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');

  assert.match(styles, /\.lf-app\.is-dark \.lf-profile-top-character\s*\{[^}]*border-radius:\s*9px !important/s);
  assert.match(styles, /\.lf-app\.is-dark \.lf-profile-top-characters-head\s*\{[^}]*border-radius:\s*0 !important/s);
});

test('best-four characters reuse the exact favorite-works shelf structure', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');
  const tile = source.slice(source.indexOf('function profileTopCharacterTile('), source.indexOf('function profileTopCharacterSelection('));
  const sync = source.slice(source.indexOf('function syncProfileTopCharacters('), source.indexOf('function hydrateProfileRatedCharacters('));

  assert.match(sync, /class: "lf-profile-favorites lf-profile-top-characters-grid"/);
  assert.match(tile, /el\("button", \{/);
  assert.match(tile, /type: "button"/);
  assert.match(tile, /profileTopCharacterSlotImage\(item\)/);
  assert.doesNotMatch(sync, /text: "اختيارك الشخصي"/);
  assert.match(styles, /\.lf-profile-top-characters\s*\{[^}]*margin:\s*0 0 24px/s);
  assert.match(styles, /\.lf-profile-top-characters-head\s*\{[^}]*padding:\s*0 var\(--apple-inline, 16px\)/s);
  assert.match(styles, /\.lf-profile-top-characters-head\s*\{[^}]*justify-content:\s*flex-end/s);
});

test('best-four character editor can search the full catalog and keeps unrated selections', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const editor = source.slice(source.indexOf('function openProfileTopCharactersEditor('), source.indexOf('function renameProfileFavouriteWorksHeading('));

  assert.match(source, /function profileTopCharacterSearchWorks\(/);
  assert.match(source, /function profileCharacterEntries\(/);
  assert.match(editor, /class: "lf-top-characters-editor-search"/);
  assert.match(editor, /placeholder: uiText\("ابحث عن عمل أو شخصية", "Search works or characters"\)/);
  assert.match(editor, /hydrateProfileRatedCharacters\(workId/);
  assert.match(editor, /profileTopCharacterSearchWorks\(query\)/);
  assert.match(source, /character: ref\.character/);
  assert.doesNotMatch(editor, /قيّم بعض الشخصيات أولاً لتتمكن من اختيار/);
});

test('best-four character editor explicitly targets a slot and replaces a full selection', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const editor = source.slice(source.indexOf('function openProfileTopCharactersEditor('), source.indexOf('function renameProfileFavouriteWorksHeading('));

  assert.match(editor, /var activeSlot = 0/);
  assert.match(editor, /draft\[activeSlot\] = ref/);
  assert.match(editor, /selectSlot\(slotIndex\)/);
  assert.match(editor, /lf-top-characters-editor-slot-remove/);
  assert.doesNotMatch(editor, /text: uiText\("إزالة الشخصية من هذه الخانة", "Remove from this slot"\)/);
  assert.doesNotMatch(editor, /else if \(draft\.length < 4\)/);
  assert.doesNotMatch(editor, /draft\.push\(ref\)/);
});

test('best-four works use the native editor from the heading while shelf slots remain stable', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const opener = source.slice(source.indexOf('function openProfileFavouriteWorksEditor('), source.indexOf('function syncProfileFavouriteWorksControls('));
  const sync = source.slice(source.indexOf('function syncProfileFavouriteWorksControls('), source.indexOf('function syncProfileTopCharacters('));

  assert.match(source, /function openProfileFavouriteWorksEditor\(/);
  assert.match(source, /function enhanceProfileFavouriteWorksEditor\(/);
  assert.match(opener, /ovOpen\("lf-profile-top-works-editor", uiText\("المفضلة", "Favorites"\)\)/);
  assert.match(opener, /lorefy\.user\.favorites\.v2/);
  assert.doesNotMatch(opener, /trigger\.click\(\)/);
  assert.match(sync, /header\.setAttribute\("role", "button"\)/);
  assert.match(sync, /header\.setAttribute\("tabindex", "0"\)/);
  assert.match(sync, /header\.addEventListener\("click"/);
  assert.match(sync, /header\.addEventListener\("keydown"/);
  assert.match(sync, /Array\.prototype\.forEach\.call\(favorites\.children/);
  assert.match(sync, /slot\.setAttribute\("role", "button"\)/);
  assert.match(sync, /slot\.setAttribute\("tabindex", "0"\)/);
  assert.match(sync, /slot\.addEventListener\("click", openSlot, true\)/);
  assert.match(sync, /event\.stopPropagation\(\)/);
  assert.match(source, /title\.textContent = "المفضلة"/);
  assert.match(source, /button\.textContent = "حفظ المفضلة"/);
  assert.doesNotMatch(source, /أفضل 4 (?:أعمال|شخصيات)/);
  assert.match(source, /syncProfileFavouriteWorksControls\(\)/);
});

test('profile page does not ship the removed profile customization studio', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');

  assert.doesNotMatch(source, /lorefy\.user\.profileCustomization\.v1/);
  assert.doesNotMatch(source, /openProfileCustomizationStudio/);
  assert.doesNotMatch(source, /syncProfileCustomization/);
  assert.doesNotMatch(source, /data-lf-profile-section-id/);
  assert.doesNotMatch(styles, /lf-profile-customize-trigger/);
  assert.doesNotMatch(styles, /lf-profile-customization-editor/);
});

test('yearly summary is a single clean reading dashboard instead of nested tabs', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-system.css'), 'utf8');
  const summary = source.slice(source.indexOf('openWrapped = function openWrappedInteractive()'), source.indexOf('/* ── IMPORT LIBRARY'));

  assert.match(summary, /class: "lf-wr-dashboard"/);
  assert.match(summary, /class: "lf-wr-summary-hero"/);
  assert.match(summary, /class: "lf-wr-summary-band/);
  assert.match(summary, /class: "lf-wr-summary-kpis"/);
  assert.doesNotMatch(summary, /class: "lf-wr-tabs"/);
  assert.match(styles, /\.lf-wr-dashboard/);
  assert.match(styles, /\.lf-wr-summary-hero/);
  assert.match(styles, /\.lf-wr-summary-band/);
});

test('review overall score uses an isolated summary instead of styling source text as a circle', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');

  assert.match(source, /function ensureReviewOverallSummary\(/);
  assert.match(source, /class: "lf-review-composer-overall-score"/);
  assert.match(source, /data-lf-review-overall-value/);
  assert.match(source, /function paintReviewOverallSummary\(/);
  assert.match(styles, /\.lf-review-composer-overall-summary/);
  assert.doesNotMatch(styles, /\.lf-review-composer-overall\s*>\s*span/);
  assert.match(styles, /\.lf-review-composer-v2 \.lf-review-composer-submit\s*\{[^}]*position:\s*relative\s*!important/s);
});

test('review criteria use descriptive icons and profile exposes the community activity hub', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');

  assert.match(source, /kind: "characters", icon: "users"/);
  assert.match(source, /kind: "world", icon: "globe"/);
  assert.match(source, /function syncProfileCommunitySummary\(/);
  assert.match(source, /class: "lf-profile-community-summary"/);
  assert.match(source, /text: "نشاط المجتمع"/);
  assert.match(source, /openHomeReplyInbox/);
  assert.match(source, /openSavedReviews/);
  assert.match(styles, /\.lf-profile-community-summary/);
  assert.match(styles, /\.lf-profile-community-actions/);
});

test('light bottom navigation reuses the dark floating dock geometry', () => {
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');

  assert.match(styles, /\.lf-app:not\(\.is-dark\) \.lf-bottom-nav\s*\{[^}]*left:\s*14px\s*!important[^}]*right:\s*14px\s*!important[^}]*bottom:\s*max\(10px, calc\(var\(--nc-bottom\) - 2px\)\)\s*!important/s);
  assert.match(styles, /\.lf-app:not\(\.is-dark\) \.lf-bottom-nav\s*\{[^}]*min-height:\s*76px\s*!important[^}]*padding:\s*6px\s*!important[^}]*border-radius:\s*30px\s*!important/s);
  assert.match(styles, /\.lf-app:not\(\.is-dark\) \.lf-nav-item\s*\{[^}]*min-height:\s*54px\s*!important[^}]*border-radius:\s*22px\s*!important/s);
  assert.match(styles, /\.lf-app:not\(\.is-dark\) \.lf-nav-item\.is-active\s*\{[^}]*background:\s*var\(--apple-blue-soft\)\s*!important/s);
});

test('device safe-area variables resolve inside the app instead of collapsing at root', () => {
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-native-layout-fix.css'), 'utf8');

  assert.match(styles, /#device,\s*\.lf-app\s*\{[^}]*--lf-safe-top:\s*max\(env\(safe-area-inset-top, 0px\), var\(--nc-top, 0px\)\)[^}]*--lf-safe-bottom:\s*max\(env\(safe-area-inset-bottom, 0px\), var\(--nc-bottom, 0px\)\)/s);
});

test('library filter pills size to their label and badge instead of the header icon width', () => {
  const styles = fs.readFileSync(path.join(root, 'styles/lorefy-review-social.css'), 'utf8');

  assert.match(styles, /\.lf-library-header \.lf-library-tabs button\s*\{[^}]*flex:\s*0 0 auto\s*!important[^}]*width:\s*max-content\s*!important[^}]*min-width:\s*max-content\s*!important/s);
  assert.match(styles, /\.lf-library-header \.lf-library-tabs button > b\s*\{[^}]*flex:\s*0 0 auto/s);
});
