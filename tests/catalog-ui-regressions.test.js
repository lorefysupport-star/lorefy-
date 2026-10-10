const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const growth = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');

test('character poster headings keep the work name on its own line', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-share-studio.js'), 'utf8');
  const part = source.slice(source.indexOf('  function shelfHeadingLines('), source.indexOf('  function canvasFile('));
  const context = {};
  vm.runInNewContext(part, context);
  assert.deepEqual(Array.from(context.shelfHeadingLines('أفضل 10 شخصيات · Demon Slayer: Kimetsu no Yaiba', true)), ['أفضل 10 شخصيات', 'Demon Slayer: Kimetsu no Yaiba']);
  assert.deepEqual(Array.from(context.shelfHeadingLines('A · B', false)), ['A · B']);
});

test('an incomplete cast stops reporting loading after the final retry', () => {
  const part = growth.slice(growth.indexOf('  function characterLoadStatus('), growth.indexOf('  function openCharacterPage('));
  const context = {characterSourceLabel:()=> 'Source', uiText:(ar)=>ar};
  vm.runInNewContext(part, context);
  assert.match(context.characterLoadStatus({}, false, 0), /جاري/);
  assert.doesNotMatch(context.characterLoadStatus({}, false, 2), /جاري/);
  assert.match(context.characterLoadStatus({}, false, 2), /المتاح/);
  assert.equal(context.characterLoadStatus({}, true, 2), 'Source');
});

test('work display titles prefer English over native script and Arabic aliases', () => {
  const part = growth.slice(growth.indexOf('  function isSupportedDisplayTitle('), growth.indexOf('  function mlLists('));
  const context = {};
  vm.runInNewContext(part, context);
  assert.equal(context.mlTitleOf({title:'Demon Slayer: Kimetsu no Yaiba', ar:'鬼滅の刃'}), 'Demon Slayer: Kimetsu no Yaiba');
  assert.equal(context.mlTitleOf({title:'Dragon Ball', ar:'دراغون بول'}), 'Dragon Ball');
});

test('saved character-list titles resolve from the current work without changing rankings', () => {
  const part = growth.slice(growth.indexOf('  function clLists('), growth.indexOf('  function clSave('));
  const context = {K_CLISTS:'lists', read:()=>[{mid:'ds',title:'鬼滅の刃',chars:[{id:'tanjiro'}]}], mlWorkBy:()=>({title:'Demon Slayer'}), mlTitleOf:w=>w.title};
  vm.runInNewContext(part, context);
  const result = context.clLists();
  assert.equal(result[0].title,'Demon Slayer');
  assert.equal(result[0].chars[0].id,'tanjiro');
});
