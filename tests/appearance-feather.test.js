const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const design = require('../modules/lorefy-design-system.js');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('three distinct palettes retain boolean compatibility and neutral dark actions', () => {
  assert.deepEqual(design.palette(true), design.palette('dark'));
  assert.deepEqual(design.palette(false), design.palette('light'));
  assert.equal(design.palette('dark').accentSoft, '#29292C');
  assert.equal(design.palette('pink').accent, '#A53662');
  assert.notEqual(design.palette('pink').bg, design.palette('light').bg);
});
test('appearance normalizes persisted values without treating pink as dark', () => {
  assert.equal(design.normalizeMode('pink'), 'pink');
  assert.equal(design.normalizeMode('invalid'), 'dark');
  assert.equal(design.normalizeMode(false), 'light');
});
test('rating glyph uses a feather and appearance settings remain integrated', () => {
  assert.match(read('uploads/files/lorefy-app.js'), /StarGlyph=.*?React.createElement\(Feather,/s);
  assert.match(read('modules/lorefy-interface-settings.js'), /lf-appearance-options/);
  assert.match(read('uploads/files/lorefy-app.js'), /React\.createElement\(window\.LorefyInterfaceSettings,/);
  assert.doesNotMatch(read('modules/lorefy-chapter-detail.js'), /icon\('star'/);
});
test('share ratings use the same feather library instead of a text star', () => {
  const source = read('modules/lorefy-share-studio.js');
  assert.ok(source.includes('icons.Feather'));
  assert.ok(!source.includes('ctx.fillText("★ '));
});
test('overlays outside React inherit the selected appearance from the document', () => {
  const css = read('styles/lorefy-design-system.css');
  assert.ok(css.includes(":root[data-lorefy-theme='pink']"));
  assert.ok(css.includes(":root[data-lorefy-theme='dark']"));
  assert.match(read('styles/lorefy-reading-diary.css'), /--diary-bg: var\(--ui-bg/);
});
test('dark utility styling cannot make every accessible button circular', () => {
  assert.ok(!read('styles/lorefy-cinema-ui.css').includes('.lf-app button[aria-label]'));
});
