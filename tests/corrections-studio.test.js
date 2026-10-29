const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { harness } = require('./helpers/product-tools.js');
for (const lang of ['ar', 'en']) test(`correction center localizes its own chrome and accurately describes local records in ${lang}`, () => {
  const h = harness(lang, [], { corrections: [{ issue: 'cover', workId: 'original-work-id', createdAt: 'invalid', status: 'pending' }] });
  h.context.openCorrectionsCenter(); const sheet = h.host.querySelector('.lf-product-sheet');
  assert.equal(sheet.getAttribute('aria-label'), lang === 'ar' ? 'مركز التصحيحات' : 'Correction center');
  assert.equal(sheet.classList.contains('lf-corrections-studio'), true);
  assert.ok(sheet.textContent.includes(lang === 'ar' ? 'الغلاف غير صحيح' : 'Incorrect cover'));
  assert.ok(sheet.textContent.includes(lang === 'ar' ? 'محفوظ على الجهاز' : 'Saved on device'));
  assert.doesNotMatch(sheet.textContent, /Invalid Date/);
  assert.ok(sheet.querySelectorAll('small').some(node => node.getAttribute('data-no-translate') === ''));
  assert.deepEqual(h.writes, []);
});

for (const lang of ['ar', 'en']) test(`correction editor has native associated labels and inline required validation in ${lang}`, () => {
  const h = harness(lang); h.context.openCorrectionForm({ id: 'work', title: 'اسم غير مترجم' });
  const sheet = h.host.querySelector('.lf-product-sheet'), form = sheet.querySelector('form'); assert.ok(form);
  assert.equal(sheet.getAttribute('aria-label'), lang === 'ar' ? 'تصحيح بيانات العمل' : 'Correct work details');
  assert.equal(sheet.querySelectorAll('label').length, 3);
  for (const label of sheet.querySelectorAll('label')) assert.ok(sheet.querySelectorAll('select,input,textarea').some(node => node.getAttribute('id') === label.getAttribute('for')));
  const note = sheet.querySelector('textarea');
  form.handlers.submit({ preventDefault() {} });
  assert.equal(note.getAttribute('aria-invalid'), 'true');
  const error = sheet.querySelector('.lf-correction-feedback'); assert.equal(error.hidden, false);
  assert.equal(note.getAttribute('aria-describedby'), error.getAttribute('id')); assert.equal(h.doc.activeElement === note, true);
  assert.deepEqual(h.writes, []);
});

test('correction storage failure keeps the draft and exposes retryable inline feedback', () => {
  const h = harness(); h.context.openCorrectionForm({ id: 'work', title: 'Work' });
  const sheet = h.host.querySelector('.lf-product-sheet'), note = sheet.querySelector('textarea'); note.value = 'Keep this correction';
  h.hooks.submit = () => { throw Error('storage full'); };
  sheet.querySelector('form').handlers.submit({ preventDefault() {} });
  assert.equal(sheet.isConnected, true); assert.equal(note.value, 'Keep this correction');
  assert.equal(sheet.querySelector('.lf-correction-feedback').hidden, false);
  assert.match(sheet.querySelector('.lf-correction-feedback').textContent, /try again/i);
  assert.equal(sheet.querySelectorAll('button').at(-1).disabled, false);
});

test('correction editor rejects a stale account or disconnected form before saving', () => {
  for (const change of ['account', 'close']) {
    const h = harness(); h.context.openCorrectionForm({ id: 'work', title: 'Work' });
    const form = h.host.querySelector('form'); form.querySelector('textarea').value = 'Do not save';
    if (change === 'account') h.storage.set('lorefy.activeUser.v1', 'next-owner');
    else h.context.closeSheet(h.host.querySelector('.lf-product-overlay'));
    form.handlers.submit({ preventDefault() {} }); assert.deepEqual(h.writes, []);
  }
});

test('valid correction keeps stored field contracts and announces local save without claiming cloud delivery', () => {
  const h = harness(); h.context.openCorrectionForm({ id: 'work', title: 'Original title' });
  const form = h.host.querySelector('form'); form.querySelector('select').value = 'cover';
  form.querySelector('textarea').value = 'A clearer cover'; form.querySelector('input').value = 'A replacement value, not just a URL';
  form.handlers.submit({ preventDefault() {} });
  assert.equal(h.writes.length, 1); assert.equal(h.writes[0].workId, 'work'); assert.equal(h.writes[0].proposedValue, 'A replacement value, not just a URL');
  assert.equal(h.host.querySelector('.lf-product-overlay'), null); assert.match(h.host.querySelector('.lf-product-toast').textContent, /saved on this device/i);
});

test('correction surfaces use shared product chrome with scoped form styles', () => {
  const css = fs.existsSync('styles/lorefy-trust-studio.css') ? fs.readFileSync('styles/lorefy-trust-studio.css', 'utf8') : '';
  assert.match(css, /@layer lorefy-glass-materials/); assert.match(css, /font-size:16px !important/);
  assert.match(css, /var\(--ui-on-action\)/); assert.match(css, /aria-invalid/); assert.match(css, /focus-visible/);
  assert.doesNotMatch(css, /\.lf-profile-banner|\.lf-home-cinema|\.lf-explore-cinema/);
});
