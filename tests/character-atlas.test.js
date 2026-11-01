const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');

function grouping() {
  const start = source.indexOf('function ratedCharacterGroups(');
  const end = source.indexOf('function openProfileRatedCharacters()', start);
  assert.ok(start >= 0, 'exact-score grouping helper exists');
  const scope = {};
  vm.runInNewContext(source.slice(start, end), scope);
  return scope.ratedCharacterGroups;
}
const items = [
  { workId: 'boys', workTitle: '20th Century Boys', character: { name: 'Kenji' }, score: 4.5 },
  { workId: 'boys', workTitle: '20th Century Boys', character: { name: 'Kanna', latin: 'Endou' }, score: 3.75 },
  { workId: 'saw', workTitle: 'Chainsaw Man', character: { name: 'Power' }, score: 0.25 },
  { workId: 'boys', workTitle: '20th Century Boys', character: { name: 'Tomodachi' }, score: 5 }
];
test('character gallery preserves all quarter scores without rounding or hiding low ratings', () => {
  const groups = grouping()(items, '', 'rating');
  assert.deepEqual(Array.from(groups, g => g.label), ['5.00', '4.50', '3.75', '0.25']);
  assert.equal(groups.reduce((n, g) => n + g.items.length, 0), items.length);
  const allQuarters = Array.from({ length: 20 }, (_, i) => ({ ...items[0], score: (i + 1) / 4 }));
  assert.deepEqual(Array.from(grouping()(allQuarters, '', 'rating'), g => g.label), allQuarters.reverse().map(item => item.score.toFixed(2)));
});
test('character gallery searches both character names and work titles and groups by work', () => {
  const group = grouping();
  assert.equal(group(items, 'endou', 'rating')[0].items[0].character.name, 'Kanna');
  assert.equal(group(items, 'CHAINSAW', 'work')[0].label, 'Chainsaw Man');
  assert.equal(group(items, 'absent', 'rating').length, 0);
  assert.equal(group(items, '', 'work').find(g => g.key === 'boys').items.length, 3);
});
test('gallery cards expose the precise score and retain their work navigation', () => {
  const nodes = [];
  function el(tag, attrs, children) {
    const node = { tag, attrs: attrs || {}, children: [], handlers: {}, appendChild(n) { this.children.push(n); }, addEventListener(k, fn) { this.handlers[k] = fn; } };
    (Array.isArray(children) ? children : children ? [children] : []).forEach(n => node.appendChild(n));
    nodes.push(node); return node;
  }
  let opened;
  const scope = { el, uiText: (ar, en) => en, profileCharacterImageEdit:()=>el('button'),syncProfileRatedCharacterGallery(){},profileRatedCharacterPortrait: () => el('span'), profileRatedCharacterCache: {}, openCharacterPage: value => opened = value };
  const start = source.indexOf('function profileRatedCharacterShelfCard(');
  vm.runInNewContext(source.slice(start, source.indexOf('function ratedCharacterGroups(', start)), scope);
  const card = scope.profileRatedCharacterShelfCard(items[0]);
  const open = nodes.find(n => n.attrs.class === 'lf-profile-character-open');
  assert.ok(open.attrs['aria-label'].includes('4.50'));
  assert.equal(nodes.find(n => n.attrs.class === 'lf-character-rating-number').attrs.text, '4.50');
  open.handlers.click(); assert.equal(opened.workId, 'boys');
});
test('character gallery assets and portal-safe feather clipping are registered', () => {
  const css = fs.readFileSync(path.join(root, 'styles/lorefy-character-atlas.css'), 'utf8');
  assert.match(css, /html:root.*\.lf-profile-rated-character-star-fill\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.lf-rated-character-shelf-rail\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s);
  for (const file of ['index.html', 'sw.js']) assert.ok(fs.readFileSync(path.join(root, file), 'utf8').includes('styles/lorefy-character-atlas.css?v=20261101-character-studio-v1'));
});
test('English character roles are localized without changing the filter metadata', () => {
  const nodes = [];
  const scope = {
    castKey: c => c.name, characterPortrait: () => ({}), scoreControl: () => ({}), uiText: (ar, en) => en,
    el: (tag, attrs, children) => { const n = { tag, attrs: attrs || {}, children }; nodes.push(n); return n; }
  };
  const start = source.indexOf('function characterRow(');
  vm.runInNewContext(source.slice(start, source.indexOf('function reviewComposer(', start)), scope);
  const row = scope.characterRow({workId:'saw'}, {name:'Power', role:'رئيسية'});
  assert.equal(nodes.find(n => n.tag === 'em').attrs.text, 'Main');
  assert.equal(row.attrs['data-role'], 'رئيسية');
});
test('source labels use the selected language', () => {
  const start = source.indexOf('function characterSourceLabel(');
  const end = source.indexOf('\n  function ', start + 10);
  const scope = {uiText:(ar,en)=>en, isTextCharacterWork:()=>false, isComicCharacterWork:()=>false};
  vm.runInNewContext(source.slice(start,end),scope);
  assert.equal(scope.characterSourceLabel({}), 'Source: MAL · AniList');
});

test('character dialog, image actions and favorite slots have localized accessible names', () => {
  assert.match(source,/"aria-label": uiText\("تقييم شخصيات ", "Rate characters in "\)/);
  assert.match(source,/"aria-label": uiText\("تعديل صورة ", "Edit image for "\)/);
  assert.match(source,/character \? uiText\("تعديل "/);
});

test('incomplete character sources explain loading and retry in English', () => {
  const start=source.indexOf('function characterLoadStatus(');
  const scope={uiText:(ar,en)=>en,characterSourceLabel:()=> 'Source'};
  vm.runInNewContext(source.slice(start,source.indexOf('function openCharacterPage(',start)),scope);
  assert.equal(scope.characterLoadStatus({},true,0),'Source');
  assert.match(scope.characterLoadStatus({},false,0),/Checking/);
  assert.match(scope.characterLoadStatus({},false,2),/unavailable/);
});
