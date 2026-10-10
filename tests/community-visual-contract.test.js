const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('post types use the same avatar and content-column geometry', () => {
  const css = read('styles/lorefy-design-system.css');
  assert.match(css, /--social-avatar: 48px/);
  assert.match(css, /grid-template-columns: var\(--social-avatar\) minmax\(0,1fr\)/);
  assert.match(css, /\.lf-community-post-header/);
  assert.match(css, /\.lf-community-review-body/);
  assert.match(css, /width: 100% !important; max-width: none !important; margin-inline: 0 !important/);
});

test('composer is a compact themed sheet with an accessible character meter', () => {
  const source = read('modules/lorefy-community.js');
  assert.match(source, /lf-community-compose-meter/);
  assert.match(source, /lf-community-compose-audience/);
  assert.match(source, /composerDrafts/);
  assert.match(source, /composerViewportCleanup/);
});

test('pink surface and supplementary accents are pink, not inherited teal and white', () => {
  const design = require('../modules/lorefy-design-system.js');
  const pink = design.palette('pink');
  assert.equal(pink.card, '#FFFAFC');
  assert.equal(pink.blue, pink.accent);
  assert.equal(pink.green, pink.accent);
  assert.notEqual(pink.shadow, design.palette('light').shadow);
});

test('pink default profile art and type badges use appearance tokens', () => {
  const css = read('styles/lorefy-design-system.css');
  assert.match(css, /\.is-pink \.lf-type-badge/);
  assert.match(css, /\.is-pink \.lf-profile-banner:has\(> img\[src\^="data:image\/svg\+xml"\]\)/);
});

test('closing the composer keeps account-scoped drafts and releases viewport listeners', () => {
  const source = read('modules/lorefy-community.js');
  const close = source.slice(source.indexOf('  function closeComposerSheet('), source.indexOf('  function openComposerSheet('));
  let cleaned = 0, removed = 0, focused = 0;
  const context = {composerDrafts:new Map(), composerViewportCleanup:()=>cleaned++, composerReturnFocus:{isConnected:true,focus:()=>focused++}, state:{composeSheet:{dataset:{draftOwner:'reader-a'},querySelector:()=>({value:'My draft'}),remove:()=>removed++},attachment:{kind:'list'}}};
  vm.runInNewContext(close + '\ncloseComposerSheet();', context);
  assert.equal(context.composerDrafts.get('reader-a').body, 'My draft');
  assert.equal(context.composerDrafts.has('reader-b'), false);
  assert.equal(context.state.composeSheet, null);
  assert.equal(context.state.attachment, null);
  assert.equal(context.composerViewportCleanup, null);
  assert.deepEqual([cleaned,removed,focused], [1,1,1]);
});

test('successful publishing clears only the current readers draft', () => {
  const source = read('modules/lorefy-community.js');
  const close = source.slice(source.indexOf('  function closeComposerSheet('), source.indexOf('  function openComposerSheet('));
  const context = {composerDrafts:new Map([['reader-a',{body:'A'}],['reader-b',{body:'B'}]]),composerViewportCleanup:null,composerReturnFocus:null,state:{composeSheet:{dataset:{draftOwner:'reader-a'},querySelector:()=>({value:'A'}),remove(){}},attachment:null}};
  vm.runInNewContext(close + '\ncloseComposerSheet(true);', context);
  assert.equal(context.composerDrafts.has('reader-a'), false);
  assert.equal(context.composerDrafts.get('reader-b').body, 'B');
});

test('composer placeholders follow the English interface language', () => {
  const i18n = require('../modules/lorefy-i18n.js');
  assert.equal(i18n.translate('اكتب منشورك','en'), 'Write your post');
  assert.equal(i18n.translate('ما الذي لفتك في هذا المقطع؟','en'), 'What stood out in this passage?');
});
