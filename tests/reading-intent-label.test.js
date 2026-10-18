const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('uploads/files/lorefy-app.js', 'utf8');
const growth = fs.readFileSync('modules/lorefy-growth-features.js', 'utf8');
const i18n = require('../modules/lorefy-i18n');
const storedStatus = 'قائمة الأمنيات';

test('the complete application containing the reading picker still parses', () => {
  assert.doesNotThrow(() => new vm.Script(source));
});

function label() {
  const start = source.indexOf('function lorefyReadingStatusLabel(');
  assert.ok(start >= 0, 'reading intent must have a display label separate from its storage key');
  const scope = {STATUS_WISHLIST: storedStatus};
  vm.runInNewContext(source.slice(start, source.indexOf('\nconst{useState', start)), scope);
  return scope.lorefyReadingStatusLabel;
}

test('wish-state display says want to read in Arabic and English without renaming the stored status', () => {
  const render = label();
  assert.equal(render(storedStatus, 'ar'), 'أرغب بالقراءة');
  assert.equal(render(storedStatus, 'en'), 'Want to read');
  const declaration = source.match(/STATUS_WISHLIST=("(?:[^"\\]|\\.)*")/);
  assert.equal(JSON.parse(declaration[1]), storedStatus);
});

test('other reading states and custom values are not rewritten by the display policy', () => {
  const render = label();
  for (const status of ['أقرأ حالياً', 'تم القراءة', 'توقف', 'توقف نهائي', 'Custom status']) {
    assert.equal(render(status, 'ar'), status);
    assert.equal(render(status, 'en'), status);
  }
});

test('the actual picker renders the display policy but retains the original save value', () => {
  assert.match(source, /lorefyReadingStatusLabel\(d\.k,W\)/);
  assert.match(source, /onClick:\(\)=>eo\(d\.k\)/);
});

test('Arabic display copy localizes without becoming a different saved reading status', () => {
  assert.equal(i18n.translate('أرغب بالقراءة', 'en'), 'Want to read');
  assert.equal(i18n.translate('أرغب بالقراءة', 'ar'), 'أرغب بالقراءة');
});

for (const name of ['أرغب بالقراءة', 'Want to read']) test('the new intent label remains in the keyboard radio group: ' + name, () => {
  const start = growth.indexOf('function enhanceReadingChoices(');
  const scope = {uiText: (ar, en) => en};
  vm.runInNewContext(growth.slice(start, growth.indexOf('function workReviewActionLabel(', start)), scope);
  const group = {classList: {add() {}}, setAttribute() {}};
  const options = ['Reading', 'Completed', name, 'Paused', 'Dropped'].map(textContent => ({
    textContent, children: [{}], parentElement: group, dataset: {}, attrs: {},
    contains: () => false, querySelector: () => null,
    setAttribute(key, value) { this.attrs[key] = value; }, addEventListener() {}
  }));
  scope.enhanceReadingChoices({querySelectorAll: () => options, classList: {add() {}}});
  assert.equal(options[2].attrs.role, 'radio');
  assert.equal(options[2].attrs['aria-checked'], 'false');
});
