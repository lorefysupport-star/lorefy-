const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const i18n = require('../modules/lorefy-i18n.js');
const source = fs.readFileSync(path.join(__dirname, '../modules/lorefy-v2.js'), 'utf8');
const h = (type, props, ...children) => ({type, props:props || {}, children:children.flat(Infinity)});
const nodes = tree => tree && typeof tree === 'object' ? [tree, ...tree.children.flatMap(nodes)] : [];
const text = tree => tree && typeof tree === 'object' ? tree.children.map(text).join(' ') : String(tree ?? '');

function render(lang, ctx = {}, documentLang = lang) {
  const window = {React:{createElement:h}, LorefyI18n:i18n,
    document:{documentElement:{lang:documentLang}}, NenIcons:{ChevronLeft:'left-icon', ChevronRight:'right-icon'}};
  vm.runInNewContext(source, {window});
  return window.LorefyV2.StatsScreen({ctx:{lang, readHours:1234, achStats:{totalRead:3, totalChRead:420, reviewCount:2}, ...ctx}});
}

test('English statistics localize visible and accessible text on the first React render', () => {
  const tree = render('en', {typeStats:{'مانجا':4}});
  assert.equal(tree.props.dir, 'ltr');
  assert.equal(tree.props.lang, 'en');
  assert.equal(tree.props['aria-label'], 'Reading statistics');
  assert.equal(tree.props['data-no-translate'], true);
  const content = text(tree);
  for (const expected of ['Statistics', 'Estimated hours', 'Completed works', 'Chapters read', 'Reading activity', 'Format breakdown', 'Manga']) assert.ok(content.includes(expected), expected);
  assert.doesNotMatch(content, /[\u0600-\u06ff]/);
  assert.equal(nodes(tree).find(node => node.type === 'button').props['aria-label'], 'Back to profile');
});

test('Arabic statistics retain Arabic text, RTL and locale-specific digits', () => {
  const tree = render('ar');
  assert.equal(tree.props.dir, 'rtl');
  assert.equal(tree.props.lang, 'ar');
  assert.ok(text(tree).includes('١٬٢٣٤'));
  assert.ok(text(tree).includes('ساعات تقديرية'));
  assert.equal(nodes(tree).find(node => node.type === 'button').props['aria-label'], 'العودة للحساب');
});

test('explicit React language wins over a not-yet-updated document language', () => {
  const english = render('en', {}, 'ar');
  const arabic = render('ar', {}, 'en');
  assert.ok(text(english).includes('1,234'));
  assert.ok(!text(english).includes('١٬٢٣٤'));
  assert.ok(text(arabic).includes('١٬٢٣٤'));
  const app = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  assert.match(app, /Xo=\{C,TC,lang:W,/);
});

test('back control follows reading direction and meets the existing touch-target convention', () => {
  const en = nodes(render('en')).find(node => node.type === 'button');
  const ar = nodes(render('ar')).find(node => node.type === 'button');
  assert.ok(en.props.style.width >= 44 && en.props.style.height >= 44);
  assert.ok(nodes(en).some(node => node.type === 'left-icon'));
  assert.ok(nodes(ar).some(node => node.type === 'right-icon'));
});

test('English empty states are complete without post-render word replacement', () => {
  const content = text(render('en', {typeStats:[]}));
  assert.ok(content.includes('No format data yet'));
  assert.doesNotMatch(content, /[\u0600-\u06ff]/);
});

test('custom labels and input values are not translated or mutated', () => {
  const ctx = Object.freeze({typeStats:Object.freeze([Object.freeze({label:'تصنيف خاص', value:4})]),
    readLog:Object.freeze([Object.freeze({label:'ملاحظتي', value:2})])});
  const before = JSON.stringify(ctx);
  const content = text(render('en', ctx));
  assert.ok(content.includes('تصنيف خاص'));
  assert.ok(content.includes('ملاحظتي'));
  assert.equal(JSON.stringify(ctx), before);
});

test('zero and invalid display values remain zero in English instead of fake sessions', () => {
  const tree = render('en', {readHours:NaN, achStats:{}, typeStats:[]});
  assert.ok(nodes(tree).some(node => node.type === 'strong' && text(node) === '0'));
  assert.doesNotMatch(text(tree), /NaN|Infinity|[\u0660-\u0669]/);
});
