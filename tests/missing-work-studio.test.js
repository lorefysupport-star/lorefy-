const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { harness } = require('./helpers/product-tools.js');
const api = require('../modules/lorefy-catalog-requests.js');
function setup(lang = 'en', rows = []) {
  const h = harness(lang); h.context.global.location = { search: '?preview=demo' };
  h.context.global.localStorage.setItem = (key, value) => { if (h.hooks.storageError) throw Error('quota'); h.storage.set(key, value); };
  h.context.global.LorefyCatalogRequests = api;
  const queue = api.create(h.context.global.localStorage, 'fixture-owner'); rows.forEach(row => queue.save(row));
  h.context.openMissingRequests();
  h.form = h.host.querySelector('form'); h.queue = queue;
  h.submit = () => h.form.handlers.submit({ preventDefault() {} });
  return h;
}
for (const lang of ['ar', 'en']) test(`missing work editor exposes local draft scope, shared chrome and empty state in ${lang}`, () => {
  const h = setup(lang), sheet = h.host.querySelector('.lf-product-sheet');
  assert.equal(sheet.classList.contains('lf-request-studio'), true);
  assert.ok(sheet.textContent.includes(lang === 'ar' ? 'لا توجد طلبات محفوظة' : 'No saved drafts'));
  assert.equal(sheet.querySelectorAll('label').length, 4); assert.equal(sheet.getAttribute('dir'), lang === 'ar' ? 'rtl' : 'ltr');
  assert.equal(h.queue.list().length, 0);
});

test('missing title and invalid reference errors are beside and linked to their fields without saving', () => {
  const h = setup(), title = h.form.querySelector('input'), url = h.form.querySelectorAll('input')[1];
  h.form.querySelector('select').value = 'Novel'; h.submit();
  assert.equal(title.getAttribute('aria-invalid'), 'true'); assert.ok(title.parentNode.querySelector('.lf-request-error')); assert.equal(h.doc.activeElement === title, true);
  title.value = 'A real draft'; url.value = 'http://127.0.0.1/private'; h.submit();
  assert.equal(url.getAttribute('aria-invalid'), 'true'); assert.equal(url.getAttribute('aria-describedby'), url.parentNode.querySelector('.lf-request-error').getAttribute('id'));
  assert.equal(h.doc.activeElement === url, true); assert.equal(h.queue.list().length, 0);
});

test('missing work storage failure retains draft fields and provides retry feedback', () => {
  const h = setup(), inputs = h.form.querySelectorAll('input'); inputs[0].value = 'Keep this title'; inputs[1].value = 'https://openlibrary.org/works/OL1W'; h.form.querySelector('select').value = 'Novel';
  h.hooks.storageError = true; h.submit();
  assert.equal(inputs[0].value, 'Keep this title'); assert.equal(h.queue.list().length, 0);
  assert.match(h.form.querySelector('.lf-request-feedback').textContent, /try again/i);
});

test('missing work draft cannot be saved by a stale account or detached form', () => {
  for (const change of ['account', 'close']) {
    const h = setup(); h.form.querySelector('input').value = 'Do not save'; h.form.querySelectorAll('input')[1].value = 'https://openlibrary.org/works/OL1W'; h.form.querySelector('select').value = 'Novel';
    if (change === 'account') h.storage.set('lorefy.activeUser.v1', 'next'); else h.context.closeSheet(h.host.querySelector('.lf-product-overlay'));
    h.submit(); assert.equal(h.queue.list().length, 0);
  }
});

test('draft title remains original and its delete control names the target without squeezing text into an icon button', () => {
  const h = setup('en', [{ title: 'العنوان الأصلي', type: 'Novel', url: 'https://openlibrary.org/works/OL1W' }]);
  const row = h.host.querySelector('.lf-catalog-request-drafts').querySelector('.lf-product-list-row');
  assert.equal(row.querySelector('strong').getAttribute('data-no-translate'), '');
  const remove = row.querySelector('button'); assert.equal(remove.getAttribute('aria-label'), 'Delete draft: العنوان الأصلي');
  assert.equal(remove.querySelector('span').textContent, ''); assert.equal(h.queue.list().length, 1);
});

test('draft field values use regular text weight instead of inheriting the label weight', () => {
  const css = fs.readFileSync('styles/lorefy-trust-studio.css', 'utf8');
  assert.match(css, /\.lf-catalog-request-form :is\(input,select,textarea\)[^}]*font-weight:400 !important/);
});
