const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = file => fs.readFileSync(file, 'utf8');
const community = source('modules/lorefy-community.js');
const growth = source('modules/lorefy-growth-features.js');
const app = source('uploads/files/lorefy-app.js');

function functionsBetween(text, from, to, scope) {
  const start = text.indexOf(from), end = text.indexOf(to, start);
  assert.ok(start >= 0 && end > start, `Missing function range: ${from}`);
  vm.runInNewContext(text.slice(start, end), scope);
  return scope;
}

test('library filter names remain their status names during a search', () => {
  const start = app.indexOf('className:"lf-library-tabs"');
  const label = app.slice(start).match(/React\.createElement\("span",null,(.*?)\),React\.createElement\("b"/)[1];
  const scope = { libraryQuery: 'Hunter', o:'تم القراءة', W:'en', lorefyReadingStatusLabel:require('../modules/lorefy-i18n').readingStatusLabel };
  vm.runInNewContext('result=' + label, scope);
  assert.equal(scope.result, 'Completed');
});

test('community reply counts are reconstructed from stored replies after reload', () => {
  const rows = [
    { id: 'root', user_id: 'me', body: 'hello', replyCount: 0 },
    { id: 'r1', user_id: 'me', body: 'one', parent_id: 'root' },
    { id: 'r2', user_id: 'me', body: 'two', parent_id: 'root' },
    { id: 'gone', user_id: 'me', parent_id: 'root', is_deleted: true }
  ];
  const scope = { read: (key, fallback) => key.includes('communityPosts') ? rows : fallback,
    global: {}, works: () => [], uuid: () => 'id', LOCAL_POSTS_KEY: 'communityPosts', LOCAL_REACTIONS_KEY: 'reactions' };
  functionsBetween(community, '  function normalizePost(', '  async function loadFollowedProfileIds(', scope);
  const result = scope.demoPosts();
  assert.equal(result.find(row => row.id === 'root').replyCount, 2);
  assert.equal(result.some(row => row.id === 'gone'), false);
});

test('title imports prefer the primary manga record independent of catalog order', () => {
  const rows = [
    { id: 'ol-naruto', title: 'Naruto', type: 'Comics', auth: 'Masashi Kishimoto', pl: 'Open Library' },
    { id: 'mal-manga-11-naruto', title: 'Naruto', type: 'Manga', ch: 700, pl: 'MyAnimeList' }
  ];
  const scope = { mlWorks: () => rows, global: {} };
  functionsBetween(growth, '  function imNorm(', '  /* rows:', scope);
  assert.equal(scope.imFindByTitle('Naruto').id, 'mal-manga-11-naruto');
  assert.equal(scope.imFindByTitle('zzzz-unmatched'), null);
});

test('import title index refreshes when the catalog gains records', () => {
  const rows = [{ id: 'a', title: 'First' }];
  const scope = { mlWorks: () => rows, global: {} };
  functionsBetween(growth, '  function imNorm(', '  /* rows:', scope);
  assert.equal(scope.imFindByTitle('Second'), null);
  rows.push({ id: 'b', title: 'Second' });
  assert.equal(scope.imFindByTitle('Second')?.id, 'b');
});

test('character loader keeps the live character search while the request finishes', () => {
  const marker = 'cbLoadWorkCharacters(w,cat.key).then(function(rows){';
  const start = growth.indexOf(marker) + marker.length;
  const end = growth.indexOf('}).catch(', start);
  const scope = { request: 4, workRequest: 4, workStatus: { isConnected: true },
    rows: [{ id: 'kurapika' }], workResults: {}, CB: { query: 'كورابيكا' },
    search: { value: 'كورابيكا' }, options: { setAttribute() {} }, cat: {},
    uiText: (ar, en) => en, isPickerCurrent:()=>true, fillPickerOptions() {} };
  vm.runInNewContext('(function(){' + growth.slice(start, end) + '})()', scope);
  assert.equal(scope.search.value, 'كورابيكا');
  assert.equal(scope.CB.query, 'كورابيكا');
  scope.isPickerCurrent=()=>false;scope.search.value='Obsolete query';
  vm.runInNewContext('(function(){' + growth.slice(start, end) + '})()', scope);
  assert.equal(scope.CB.query, 'كورابيكا');
});

test('English system labels cover privacy, corrections and image positioning', () => {
  const i18n = require('../modules/lorefy-i18n.js');
  for (const label of ['الخصوصية والبيانات', 'إدارة البلاغات والحسابات التي لا تريد رؤيتها',
    'نسخة من بياناتك', '⇕ اسحب لضبط الموضع', 'أغلفة جاهزة', 'شير', 'تعديل المنشور', 'حذف المنشور']) {
    assert.doesNotMatch(i18n.translate(label, 'en'), /[\u0600-\u06ff]/, label);
  }
});

test('import offers a review step before it changes the library', () => {
  assert.match(growth, /lf-im-preview/);
  assert.match(growth, /im-confirm/);
  assert.match(growth, /imApply\(selectedRows,\s*\{reviews:/);
  assert.doesNotMatch(growth, /function finish\(res, sourceLabel\)\s*\{\s*var out = imApply/);
});

test('profile reply activity merges standalone community replies without duplicates', () => {
  const scope = { homeReplyCloudItems: [], replyInbox: () => [{id:'c1',body:'one',createdAt:1}],
    global: { LorefyCommunity: { replyActivity: () => [{id:'c1',body:'one',createdAt:1},{id:'c2',body:'two',createdAt:2}] } },
    replyTimestamp: Number };
  functionsBetween(growth, '  function replyShelfItems()', '  function replyShelfItem(', scope);
  assert.deepEqual(Array.from(scope.replyShelfItems(), row => row.id), ['c2','c1']);
});

test('all standalone post types have ownership tools and a bookmark action', () => {
  assert.match(community, /function editPost\(/);
  assert.match(community, /function removePost\(/);
  assert.match(community, /function toggleSavedPost\(/);
  assert.match(community, /post\.user_id === identity\(\)\.id/);
});

test('audited compact surfaces use stable dimensions and appearance tokens', () => {
  const css = source('styles/lorefy-design-system.css');
  assert.ok(css.includes('.lf-community-edit > section'), 'Edit dialog has a defined surface');
  assert.ok(css.includes('.lf-im-preview-row'), 'Import matches have a responsive layout');
  assert.ok(/\.lf-library-grid\.is-shelf-view \.lf-library-card\s*\{[^}]*max-width:\s*none/.test(css), 'Shelf items fill their row');
  assert.ok(/\.lf-wr-summary-goal\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)/.test(css), 'Goal does not squeeze copy into a narrow column');
  assert.ok(css.includes('.lf-pref-share-sheet .lf-pref-share-sheet-card'), 'Share controls inherit appearance');
  assert.ok(css.includes('html .lf-wr-summary-goal {'), 'Goal styles also reach overlays outside the app root');
  assert.ok(css.includes('html .lf-pref-share-sheet .lf-pref-share-sheet-card,'), 'Share styles reach the shared screen host');
  assert.ok(css.includes('.lf-library-grid:not(.is-shelf-view):not(.is-spine-view):has('), 'Small grid exceptions do not shrink a list or book-spine row');
});

test('editing a review restores the saved rating and optional fields without sharing references', () => {
  const editor = require('../modules/lorefy-review-editor.js');
  const review = {r:4.5,txt:'A saved review',ratings:{story:4},imgs:['cover'],spoiler:true,recVal:'no',moment:'Scene'};
  const draft = editor.savedDraft(review);
  assert.equal(draft.rating,4.5);
  assert.equal(draft.text,'A saved review');
  assert.equal(draft.recommendation,'no');
  assert.equal(draft.spoiler,true);
  draft.images.push('other');
  assert.equal(review.imgs.length,1);
  assert.equal(editor.savedDraft(null).rating,0);
  assert.ok(app.includes('window.LorefySavedReviewDraft'), 'Review opener restores existing state');
});

test('related works exclude the current title across providers and duplicate suggestions', () => {
  const identity = require('../modules/lorefy-catalog-identity.js');
  const current = {id:'mal-26',title:'Hunter x Hunter',type:'Manga',auth:'Togashi Yoshihiro',yr:1998};
  const alternate = {...current,id:'ol-hunter',type:'Comics'};
  const other = {id:'other',title:'Naruto',type:'Manga'};
  assert.deepEqual(identity.relatedWorks(current,[current,alternate,other,{...other}]).map(w=>w.id),['other']);
  assert.ok(app.includes('LorefyCatalogIdentity.relatedWorks(m,'));
});

test('English preference labels and timestamps translate without changing a title', () => {
  const t = require('../modules/lorefy-i18n.js').translate;
  for(const label of ['تفضيلات مانجا','أفضل شخصيات مانجا','رتّب أفضل 10 شخصيات من تصنيف مانجا','3 / 10 شخصيات','تعديل خانة 1: Kurapika','خانة فارغة 2','2ي']) {
    assert.doesNotMatch(t(label,'en'),/[\u0600-\u06ff]/,label);
  }
  assert.equal(t('تعديل خانة 1: Kurapika','en'),'Edit slot 1: Kurapika');
});

test('community mutations require a session and server-side ownership without opening table writes', () => {
  const sql = source('supabase/migrations/20261005013539_beta_community_owner_tools.sql');
  const backend = source('backend/lorefy-backend.js');
  assert.match(sql,/uid uuid := auth\.uid\(\)/);
  assert.match(sql,/if uid is null then raise exception/);
  assert.equal((sql.match(/where id = post_ref and user_id = uid/g)||[]).length,2);
  assert.match(sql,/revoke all.*from public, anon/);
  assert.doesNotMatch(sql,/grant (update|delete|all).*community_posts/i);
  assert.ok(backend.includes('rpc("mutate_community_post"'));
});

test('replying to a reply retains the target instead of only inserting a mention', () => {
  assert.ok(community.includes('function replyContext('));
  assert.ok(community.includes('attachment:{replyTo:replyContext(replyTarget)}'));
  assert.ok(community.includes('lf-community-reply-target'));
  assert.ok(source('backend/lorefy-backend.js').includes('attachment:attachment || {}'));
});

test('localization observes the shared screen including imperative overlays', () => {
  assert.ok(app.includes('const t=document.getElementById("screen")||document.getElementById("nc-root")'));
});

test('English main surfaces follow a left-to-right layout', () => {
  const css = source('styles/lorefy-design-system.css');
  assert.match(css, /html\[lang='en'\] \.lf-app\.lf-app\.lf-app\s*\{[^}]*direction:ltr/);
});

test('import and reading navigation system labels are localized', () => {
  const t = require('../modules/lorefy-i18n.js').translate;
  for (const label of ['استيراد القائمة','رف','شبكة','بزر واحد — اكتب اسمك فقط','اسم المستخدم في AniList','العودة إلى آخر فصل قيّمته، الفصل 2','0 عمل أُضيف إلى مكتبتك']) {
    assert.doesNotMatch(t(label,'en'),/[\u0600-\u06ff]/,label);
  }
});

test('unsaving a post removes it from the open saved collection', () => {
  const saved = growth.slice(growth.indexOf('  function openSavedReviews()'), growth.indexOf('  function syncProfileSavedCard()'));
  assert.ok(saved.includes('if (!community.savedPosts()[post.id])'));
  assert.ok(saved.includes('card.remove()'));
});

test('opening a reply conversation dismisses the inbox that would cover it', () => {
  assert.ok(growth.includes('replyShelfItem(item, function () { ov.close(); })'));
  assert.ok(growth.includes('if (beforeOpen) beforeOpen();'));
});

test('saved-post tools dismiss their collection before opening an overlay', () => {
  assert.ok(community.includes('if (beforeOverlay) beforeOverlay();'));
  assert.ok(community.includes('if (beforeOverlay) beforeOverlay(); removePost(post,remove);'));
  assert.ok(growth.includes('community.postCard(post,false,null,function () { ov.close(); })'));
});

test('share artwork colors follow the appearance with readable badge text', () => {
  const text = source('modules/lorefy-share-studio.js');
  const scope = {doc:{documentElement:{getAttribute:()=> 'pink'}}};
  functionsBetween(text,'  function sharePalette(', '  function buildShelfStoryFile(',scope);
  assert.equal(scope.sharePalette().accent,'#a53662');
  assert.equal(scope.sharePalette('dark').background,'#0b0b0c');
  assert.equal(scope.sharePalette('dark').onAccent,'#171719');
  assert.ok(text.includes('var colors = sharePalette();'));
  assert.ok(text.includes('var useSingle = images.length === 1;'), 'A one-item list uses an inspectable full-size portrait');
});

test('annual recap numbers and goal captions respect English', () => {
  const scope = {doc:{documentElement:{lang:'en'}},Intl,uiText:(_,en)=>en};
  functionsBetween(growth,'  function wrNumber(', '  function wrEntryValue(',scope);
  assert.equal(scope.wrNumber(100),'100');
  assert.equal(scope.wrGoalCaption(12,100),'12 of 100 chapters');
  assert.equal(scope.wrGoalCaption(0,0),'Choose how many chapters you want to read this year');
});

test('the legacy positioned review-delete rule keeps a 44px touch target', () => {
  const css = source('styles/lorefy-community.css');
  const rule = css.slice(css.indexOf('.lf-community-card > .lf-community-delete-button {'));
  assert.match(rule.slice(0,rule.indexOf('}')), /height:\s*44px/);
  assert.match(rule.slice(0,rule.indexOf('}')), /min-height:\s*44px/);
});
