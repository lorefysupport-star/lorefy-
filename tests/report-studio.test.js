const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { harness } = require('./helpers/product-tools.js');
const { createMemoryStore } = require('../modules/lorefy-product-core.js');
const target = { targetId: 'review-original', targetType: 'review', userId: 'reader-original' };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function setup(lang = 'en', live = false) {
  const h = harness(lang); if (live) h.context.global.LorefyBackend = { mode: 'live', user: { id: 'fixture-owner' }, _pullGeneration: 1, submitReport() {} };
  h.context.openReviewSafety(target); h.sheet = h.host.querySelector('.lf-product-sheet'); h.form = h.sheet.querySelector('form');
  h.submit = () => h.form.handlers.submit({ preventDefault() {} }); return h;
}
for (const lang of ['ar', 'en']) test(`review safety has direct labels, a real form and truthful device-only action in ${lang}`, () => {
  const h = setup(lang); assert.equal(h.sheet.getAttribute('aria-label'), lang === 'ar' ? 'خيارات المراجعة' : 'Review options');
  assert.equal(h.sheet.classList.contains('lf-report-studio'), true); assert.ok(h.form);
  assert.equal(h.form.querySelectorAll('select').length, 1); assert.equal(h.form.querySelector('select').children.length, 6);
  assert.equal(h.sheet.querySelectorAll('label').length, 2);
  for (const label of h.sheet.querySelectorAll('label')) assert.ok(h.sheet.querySelectorAll('select,textarea').some(node => node.getAttribute('id') === label.getAttribute('for')));
  assert.ok(h.sheet.textContent.includes(lang === 'ar' ? 'حفظ البلاغ على الجهاز' : 'Save report on device')); assert.deepEqual(h.writes, []);
});

test('report submit and reader actions share a single pending operation while Close remains enabled', async () => {
  const h = setup(), wait = deferred(); let calls = 0; h.hooks.report = () => { calls++; return wait.promise; };
  const send = h.form.querySelector('button'); send.focus(); const pending = h.submit(); h.submit(); h.sheet.querySelector('.lf-report-block').click();
  assert.equal(calls, 1); assert.equal(send.disabled, true); assert.equal(h.form.getAttribute('aria-busy'), 'true');
  assert.equal(h.doc.activeElement === h.sheet.querySelector('.lf-product-icon-button'), true); assert.equal(h.sheet.querySelector('.lf-product-icon-button').disabled, false);
  wait.resolve({ id: 'local-report', status: 'pending' }); await pending;
  assert.match(h.host.querySelector('.lf-product-toast').textContent, /saved on this device/i);
});

test('report failure retains reason and prose with safe inline retry instead of raw server text', async () => {
  const h = setup('en', true); h.form.querySelector('select').value = 'spoiler'; h.form.querySelector('textarea').value = 'Keep the evidence';
  h.hooks.report = () => Promise.reject(Error('RPC secret internal error')); await h.submit();
  assert.equal(h.sheet.isConnected, true); assert.equal(h.form.querySelector('select').value, 'spoiler'); assert.equal(h.form.querySelector('textarea').value, 'Keep the evidence');
  const feedback = h.sheet.querySelector('.lf-report-feedback'); assert.equal(feedback.hidden, false); assert.equal(feedback.getAttribute('role'), 'alert'); assert.match(feedback.textContent, /try again/i); assert.doesNotMatch(feedback.textContent, /RPC|secret/);
  assert.equal(h.doc.activeElement === feedback, true); assert.equal(h.form.querySelector('button').disabled, false);
});

test('report sends the original target and supported field contract once and distinguishes a cloud receipt', async () => {
  const h = setup('en', true); let input; h.hooks.report = value => { input = value; return Promise.resolve({ id: 'cloud-report', status: 'open' }); };
  h.form.querySelector('select').value = 'copyright'; h.form.querySelector('textarea').value = 'Evidence'; await h.submit();
  assert.equal(input.targetId, target.targetId); assert.equal(input.targetType, 'review'); assert.equal(input.reason, 'copyright'); assert.equal(input.note, 'Evidence');
  assert.match(h.host.querySelector('.lf-product-toast').textContent, /sent for review/i);
});

for (const change of ['closed', 'replaced', 'account', 'generation', 'mode', 'backend', 'client']) test(`late report ${change} cannot close another sheet, toast or alter visible content`, async () => {
  const h = setup('en', true), wait = deferred(); h.hooks.report = () => wait.promise;
  const pending = h.submit();
  if (change === 'closed') h.context.closeSheet(h.host.querySelector('.lf-product-overlay'));
  if (change === 'replaced') h.context.openSheet('Replacement', '', () => {});
  if (change === 'account') h.storage.set('lorefy.activeUser.v1', 'next');
  if (change === 'generation') h.context.global.LorefyBackend._pullGeneration++;
  if (change === 'mode') h.context.global.LorefyBackend.mode = 'demo';
  if (change === 'backend') h.context.global.LorefyBackend = { ...h.context.global.LorefyBackend };
  if (change === 'client') h.context.global.LorefyBackend.client = {};
  wait.resolve({ id: 'cloud-report', status: 'open' }); await pending;
  assert.equal(h.host.querySelector('.lf-product-toast'), null);
  if (change === 'replaced') assert.equal(h.host.querySelector('.lf-product-sheet').getAttribute('aria-label'), 'Replacement');
});

test('a stale open report or own review cannot start any safety mutation', async () => {
  const h = setup(); h.storage.set('lorefy.activeUser.v1', 'next'); await h.submit(); h.sheet.querySelector('.lf-report-mute').click(); assert.deepEqual(h.writes, []);
  const own = harness(); own.context.openReviewSafety({ ...target, own: true }); assert.equal(own.host.querySelector('.lf-product-sheet'), null);
});

test('report studio styles are scoped and retain semantic action pairs and readable native fields', () => {
  const css = fs.readFileSync('styles/lorefy-trust-studio.css', 'utf8');
  assert.match(css, /\.lf-report-studio/); assert.match(css, /\.lf-report-feedback/); assert.match(css, /\.lf-report-form/);
  assert.match(css, /var\(--ui-on-action\)/); assert.match(css, /font-size:16px !important/);
});

function coreFixture() {
  const wait = deferred(), store = createMemoryStore({ 'lorefy.activeUser.v1': 'owner-a' });
  const backend = { mode: 'live', user: { id: 'owner-a' }, _pullGeneration: 1, client: {}, submitReport: () => wait.promise }, window = { LorefyBackend: backend };
  vm.runInNewContext(fs.readFileSync('modules/lorefy-product-core.js', 'utf8'), { window });
  return { wait, store, backend, window, core: window.LorefyProductCore.createProductCore(store) };
}
for (const change of ['account', 'generation', 'mode', 'backend', 'client']) test(`core does not store a late report receipt after ${change}`, async () => {
  const h = coreFixture(), pending = h.core.safety.report({ targetId: 'review', reason: 'spam' });
  if (change === 'account') h.store.setItem('lorefy.activeUser.v1', 'owner-b');
  if (change === 'generation') h.backend._pullGeneration++;
  if (change === 'mode') h.backend.mode = 'demo';
  if (change === 'backend') h.window.LorefyBackend = { ...h.backend };
  if (change === 'client') h.backend.client = {};
  h.wait.resolve({ id: 'receipt', status: 'open' }); await assert.rejects(pending, /account changed/i); assert.equal(h.core.safety.getReports().length, 0);
});

test('concurrent report receipts merge with current records rather than overwriting each other', async () => {
  const h = coreFixture(), second = deferred(); let calls = 0; h.backend.submitReport = () => ++calls === 1 ? h.wait.promise : second.promise;
  const a = h.core.safety.report({ targetId: 'a', reason: 'spam' }), b = h.core.safety.report({ targetId: 'b', reason: 'spoiler' });
  second.resolve({ id: 'b', status: 'open' }); await b; h.wait.resolve({ id: 'a', status: 'open' }); await a;
  assert.deepEqual(Array.from(h.core.safety.getReports(), row => row.id).sort(), ['a', 'b']);
});

test('report behavior and sheet styles have fresh offline asset keys', () => {
  for (const file of ['index.html', 'sw.js']) for (const asset of ['modules/lorefy-product-core.js', 'modules/lorefy-product-tools.js', 'styles/lorefy-trust-studio.css']) assert.ok(fs.readFileSync(file, 'utf8').includes(asset + '?v=20261028-report-studio-v1'), asset);
  assert.match(fs.readFileSync('sw.js', 'utf8'), /lorefy-v664-post-reaction-order/);
});
