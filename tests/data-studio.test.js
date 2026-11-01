const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { harness } = require('./helpers/product-tools.js');

for (const lang of ['en', 'ar']) test(`data center is directly localized, visibly labels visibility and only reads saved values in ${lang}`, () => {
  const h = harness(lang, [{ id: 'old', name: 'Unchanged list', kind: 'works' }]), overlay = h.open();
  const sheet = overlay.querySelector('.lf-product-sheet');
  assert.equal(sheet.getAttribute('aria-label'), lang === 'en' ? 'Privacy and data' : 'الخصوصية والبيانات');
  assert.equal(sheet.getAttribute('dir'), lang === 'en' ? 'ltr' : 'rtl');
  assert.equal(sheet.classList.contains('lf-data-studio'), true);
  assert.ok(sheet.textContent.includes(lang === 'en' ? 'Export JSON' : 'تصدير JSON'));
  const selects = sheet.querySelectorAll('select'); assert.equal(selects.length, 2);
  assert.equal(selects[0].children.find(node => node.selected).getAttribute('value'), 'public');
  assert.equal(selects[1].children.find(node => node.selected).getAttribute('value'), 'unlisted');
  for (const select of selects) { assert.equal(select.parentNode.tag, 'label'); assert.ok(select.parentNode.textContent.includes(lang === 'en' ? 'Visibility' : 'الرؤية')); }
  assert.equal(sheet.querySelectorAll('a').length, 3);
  assert.deepEqual(h.writes, []);
});

test('data center copy does not promise a private default that profile lists do not use', () => {
  for (const lang of ['en', 'ar']) {
    const h = harness(lang), sheet = h.open();
    assert.doesNotMatch(sheet.textContent, /private by default|خاصة تلقائياً|تبدأ كقائمة خاصة/);
    assert.ok(sheet.querySelectorAll('strong').some(node => node.getAttribute('data-no-translate') === '' && node.getAttribute('dir') === 'auto'));
  }
});

test('product child dialog isolates its parent without clearing existing background isolation', () => {
  const h = harness(), overlay = h.open();
  assert.equal(h.parent.inert, true); assert.equal(h.app.inert, true);
  assert.equal(h.doc.activeElement, overlay.querySelector('button'));
  h.context.closeSheet(overlay);
  assert.equal(h.parent.inert, false); assert.equal(h.app.inert, true); assert.equal(h.doc.activeElement, h.opener);
  h.context.closeSheet(overlay); assert.equal(h.parent.inert, false);
});

test('product child Tab loop and Escape stay inside the active layer', () => {
  const h = harness(), overlay = h.open(), first = overlay.querySelector('button'), last = overlay.querySelectorAll('a').at(-1);
  let prevented = 0;
  const event = (key, shiftKey = false) => ({ key, shiftKey, preventDefault() { prevented++; }, stopPropagation() {} });
  overlay.handlers.keydown(event('Tab', true)); assert.equal(h.doc.activeElement, last);
  overlay.handlers.keydown(event('Tab')); assert.equal(h.doc.activeElement, first);
  overlay.handlers.keydown(event('Escape')); assert.equal(overlay.isConnected, false); assert.equal(h.doc.activeElement, h.opener); assert.equal(prevented, 3);
});

test('replacing a product sheet keeps its original opener and releases stale isolation', () => {
  const h = harness(), first = h.open(); first.querySelector('button').focus();
  h.context.openSheet('Next sheet', '', () => {});
  const next = h.host.querySelector('.lf-product-overlay');
  assert.notEqual(next, first); assert.equal(first.isConnected, false); assert.equal(h.parent.inert, true);
  h.context.closeSheet(next); assert.equal(h.doc.activeElement, h.opener); assert.equal(h.parent.inert, false);
});

test('removing the parent dialog closes its product child and restores only owned inert state', () => {
  const h = harness(), overlay = h.open(); h.parent.remove(); h.mutations();
  assert.equal(overlay.isConnected, false); assert.equal(h.app.inert, true);
  assert.ok(h.observers.every(observer => observer.disconnected));
});

test('externally removed product overlay releases its parent once', () => {
  const h = harness(), overlay = h.open(); overlay.remove(); h.mutations();
  assert.equal(h.parent.inert, false); assert.equal(h.doc.activeElement, h.opener);
  assert.ok(h.observers.every(observer => observer.disconnected));
});

test('data studio uses scoped semantic glass, wrapping text and usable controls', () => {
  const css = fs.existsSync('styles/lorefy-data-studio.css') ? fs.readFileSync('styles/lorefy-data-studio.css', 'utf8') : '';
  assert.match(css, /@layer lorefy-glass-materials/);
  assert.match(css, /var\(--glass-sheet\)/); assert.match(css, /var\(--glass-reflection\)/);
  assert.match(css, /font-size:16px !important/); assert.match(css, /min-height:44px !important/);
  assert.match(css, /white-space:normal !important/); assert.match(css, /overflow-wrap:anywhere/);
  assert.match(css, /focus-visible/); assert.doesNotMatch(css, /\.lf-home|\.lf-profile-banner|\.lf-explore-cinema/);
});

test('data studio assets and source use fresh offline versions', () => {
  for (const file of ['index.html', 'sw.js']) {
    const text = fs.readFileSync(file, 'utf8');
    for (const asset of ['modules/lorefy-product-tools.js', 'styles/lorefy-data-studio.css', 'styles/lorefy-glass-materials.css']) assert.ok(text.includes(asset + '?v=' + (asset.endsWith('.js') ? '20261028-report-studio-v1' : '20261028-trust-studio-v2')), asset);
  }
  assert.match(fs.readFileSync('sw.js', 'utf8'), /lorefy-v677-profile-dialogs/);
});

test('layered data row layout and narrow stacking override unlayered legacy flex/grid rules', () => {
  const css = fs.readFileSync('styles/lorefy-data-studio.css', 'utf8');
  assert.match(css, /\.lf-data-studio \.lf-product-list-row\s*\{[^}]*display:grid !important/);
  assert.match(css, /@media \(max-width:360px\)[\s\S]*\.lf-product-inline-actions\s*\{[^}]*grid-template-columns:minmax\(0,1fr\) !important/);
  assert.match(css, /@media \(max-width:360px\)[\s\S]*\.lf-product-list-row\s*\{[^}]*grid-template-columns:minmax\(0,1fr\) !important/);
});

test('data studio centers its capped desktop sheet within the overlay', () => {
  const css = fs.readFileSync('styles/lorefy-data-studio.css', 'utf8');
  assert.match(css, /\.lf-product-overlay:has\(\.lf-product-studio\)[^}]*justify-content:center !important/);
});

test('pending export keeps focus on an enabled close control instead of the disabled initiator', async () => {
  const h = harness(), overlay = h.open(), controls = overlay.querySelectorAll('button'), action = controls[1];
  let finish; const pending = new Promise(resolve => { finish = resolve; });
  action.focus(); const result = h.context.runExport({ currentTarget: action }, () => pending, 'Ready');
  assert.equal(action.disabled, true); assert.equal(h.doc.activeElement === controls[0], true);
  finish(); await result; assert.equal(action.disabled, false);
});
