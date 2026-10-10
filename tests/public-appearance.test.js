const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('visitor appearance is owner-scoped and ignores viewer storage', () => {
  const api = require('../modules/lorefy-public-appearance.js');
  const a = api.normalize({theme:'custom-light-367faa',library_view:'spines',banner_position:0,favorite_type:'Manhua'});
  assert.equal(a.theme,'custom-light-367faa');
  assert.equal(a.library_view,'spines');
  assert.equal(a.banner_position,0);
  assert.equal(api.style(a)['--ui-bg'],require('../modules/lorefy-design-system.js').tokens(a.theme)['--ui-bg']);
  assert.equal(api.normalize({theme:'url(evil)',library_view:'other'}).theme,'dark');
  assert.equal(api.normalize({}).library_view,'grid');
});
test('deferred browser appearance resolves the design system after scripts load',()=>{
  const window={};
  vm.runInNewContext(read('modules/lorefy-public-appearance.js'),{window});
  window.LorefyDesignSystem=require('../modules/lorefy-design-system.js');
  assert.equal(window.LorefyPublicAppearance.normalize({theme:'pink'}).theme,'pink');
});
test('favorite format counts distinct owner works with canonical language-independent values', () => {
  const api = require('../modules/lorefy-public-appearance.js');
  const works = {a:{type:'مانجا'},b:{type:'مانهوا'},c:{type:'مانهوا'}};
  assert.equal(api.favoriteType({library_entries:{a:'reading',b:'completed',c:'reading'},favorite_work_ids:['a']},id=>works[id]),'Manhwa');
  assert.equal(api.favoriteType({favorite_type:'Manhua'},()=>null),'Manhua');
  assert.equal(api.favoriteType({},()=>null),'');
});
test('partial catalog loading does not erase the last synced favorite format',()=>{
  const api=require('../modules/lorefy-public-appearance.js');
  const state={'lorefy.user.library.v2':'{"a":"reading","b":"reading"}','lorefy.user.favorites.v2':'[]','lorefy.user.favoriteType.v1':'"Manhwa"'};
  assert.equal(api.fromState(state,[{id:'a',type:'Manga'}]),'Manhwa');
  assert.equal(api.fromState(state,[{id:'a',type:'Manga'},{id:'b',type:'Manga'}]),'Manga');
});
test('covers have bounded intrinsic dimensions and complete-image fit', () => {
  assert.match(read('styles/lorefy-public-profile.css'),/\.lf-reader-library-cover > img\s*\{[^}]*width:\s*100%[^}]*height:\s*100%[^}]*object-fit:\s*contain/s);
});
test('community card activation opens threads instead of suppressing the click', () => {
  assert.match(read('modules/lorefy-growth-features.js'),/function wireCommunityCardNavigation[\s\S]*?comment\.click\(\)/);
  assert.match(read('modules/lorefy-community.js'),/card\.addEventListener\('click'[\s\S]*?activateThread/);
  assert.match(read('styles/lorefy-community.css'),/\.lf-community-page\.lf-community-v2\s*\{[^}]*overflow:\s*visible\s*!important/s);
});
test('the community header cannot cover and intercept the sticky filters',()=>{
  assert.match(read('styles/lorefy-community.css'),/\.lf-home-screen:has\(\.lf-community-page\) > \.lf-social-header\s*\{[^}]*position:\s*relative\s*!important/s);
});
test('account sync includes appearance and search retains the owner type', () => {
  const backend=read('backend/lorefy-backend.js');
  assert.match(backend,/"lorefy.ui.theme.v1"/);
  assert.match(backend,/"lorefy.library.view.v1"/);
  assert.match(read('modules/lorefy-user-discovery.js'),/favorite_type:/);
  assert.match(read('modules/lorefy-user-discovery.js'),/lf-reader-result-type/);
});
test('review details localize the heading, reply counter and reply input',()=>{
  const i18n=require('../modules/lorefy-i18n.js');
  assert.equal(i18n.translate('المراجعة','en'),'Review');
  assert.equal(i18n.translate('أضف رداً...','en'),'Add a reply...');
  assert.equal(i18n.translate('0 رد','en'),'0 replies');
});
