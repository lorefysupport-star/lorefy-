const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { harness } = require('./helpers/product-tools.js');
for (const lang of ['ar', 'en']) test(`safety center directly labels reports, block and mute controls in ${lang}`, () => {
  const h = harness(lang, [], { reports: [{ reason: 'spam', targetId: 'original-id', status: 'open' }, { reason: 'spoiler', targetId: 'local-id', status: 'pending' }], blocked: ['reader-one'], muted: ['reader-two'] });
  h.context.openSafetyCenter(); const sheet = h.host.querySelector('.lf-product-sheet');
  assert.equal(sheet.getAttribute('aria-label'), lang === 'ar' ? 'السلامة والمحتوى' : 'Safety and content');
  assert.equal(sheet.classList.contains('lf-safety-studio'), true);
  assert.ok(sheet.textContent.includes(lang === 'ar' ? 'قيد المراجعة' : 'Awaiting review'));
  assert.ok(sheet.textContent.includes(lang === 'ar' ? 'محفوظ على الجهاز' : 'Saved on device'));
  const actions = sheet.querySelectorAll('.lf-safety-remove'); assert.equal(actions.length, 2);
  assert.equal(actions[0].getAttribute('aria-label'), lang === 'ar' ? 'إلغاء حظر @reader-one' : 'Unblock @reader-one');
  assert.equal(actions[1].getAttribute('aria-label'), lang === 'ar' ? 'إلغاء كتم @reader-two' : 'Unmute @reader-two');
  assert.ok(sheet.querySelectorAll('strong').filter(node => node.textContent.startsWith('@')).every(node => node.getAttribute('data-no-translate') === '' && node.getAttribute('dir') === 'ltr'));
  assert.deepEqual(h.writes, []);
});

test('pending unblock is single-flight, visible and keeps keyboard focus on Close', async () => {
  const h = harness('en', [], { blocked: ['reader'] }); h.context.openSafetyCenter();
  let finish, calls = 0; h.hooks.unblock = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const sheet = h.host.querySelector('.lf-product-sheet'), action = sheet.querySelector('.lf-safety-remove'); action.focus();
  const pending = action.click(); action.click();
  assert.equal(calls, 1); assert.equal(action.disabled, true); assert.equal(action.getAttribute('aria-busy'), 'true');
  assert.equal(h.doc.activeElement === sheet.querySelector('.lf-product-icon-button'), true);
  assert.equal(sheet.querySelector('.lf-safety-feedback').hidden, false);
  finish(); await pending;
});

test('failed unblock keeps its row and shows inline retry feedback without losing the target', async () => {
  const h = harness('en', [], { blocked: ['reader'] }); h.context.openSafetyCenter();
  h.hooks.unblock = () => Promise.reject(Error('offline'));
  const sheet = h.host.querySelector('.lf-product-sheet'), action = sheet.querySelector('.lf-safety-remove'); await action.click();
  assert.equal(sheet.isConnected, true); assert.equal(action.disabled, false); assert.equal(action.getAttribute('aria-busy'), null);
  const feedback = sheet.querySelector('.lf-safety-feedback'); assert.equal(feedback.hidden, false); assert.equal(feedback.getAttribute('role'), 'alert');
  assert.match(feedback.textContent, /try again/i); assert.equal(h.doc.activeElement === feedback, true);
  assert.equal(action.getAttribute('aria-label'), 'Unblock @reader'); assert.deepEqual(h.writes, []);
});

test('stale safety action cannot change a new account or rebuild a disconnected dialog', async () => {
  const h = harness('en', [], { muted: ['reader'] }); h.context.openSafetyCenter();
  const action = h.host.querySelector('.lf-safety-remove'); h.storage.set('lorefy.activeUser.v1', 'next'); await action.click(); assert.deepEqual(h.writes, []);
  const other = harness('en', [], { blocked: ['reader'] }); other.context.openSafetyCenter();
  let finish; other.hooks.unblock = () => new Promise(resolve => { finish = resolve; });
  const pending = other.host.querySelector('.lf-safety-remove').click(); other.context.closeSheet(other.host.querySelector('.lf-product-overlay')); finish(); await pending;
  assert.equal(other.host.querySelector('.lf-product-overlay'), null);
});

test('safety report statuses are not all labeled pending or inferred from unknown values', () => {
  const h = harness('en', [], { reports: ['open', 'pending', 'resolved', 'closed', 'unknown'].map((status, index) => ({ status, targetId: 'target-' + index, reason: 'spam' })) });
  h.context.openSafetyCenter();
  assert.deepEqual(h.host.querySelectorAll('.lf-product-status').map(node => node.textContent), ['Awaiting review', 'Saved on device', 'Resolved', 'Closed', 'Status unavailable']);
});

test('safety row styles support wrapping names, readable states and full text actions', () => {
  const css = fs.readFileSync('styles/lorefy-trust-studio.css', 'utf8');
  assert.match(css, /\.lf-safety-remove/); assert.match(css, /\.lf-safety-feedback/);
  assert.match(css, /min-height:44px !important/); assert.match(css, /overflow-wrap:anywhere/);
});
