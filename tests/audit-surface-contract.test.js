const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('legacy product surfaces resolve to the same adaptive theme tokens', () => {
  const css = fs.readFileSync('styles/lorefy-design-system.css','utf8');
  for (const [legacy, semantic] of [['surface','surface'],['surface-soft','fill-soft'],['surface-raised','surface'],['muted','muted'],['line','line'],['accent-soft','selected'],['purple','action']]) {
    assert.ok(css.includes(`--lf-${legacy}: var(--ui-${semantic});`), legacy);
  }
});
test('runtime catalog manifests are content-derived, not wall-clock-derived', () => {
  const source = fs.readFileSync('tools/build-runtime-catalog.js','utf8');
  assert.doesNotMatch(source,/generatedAt:new Date\(\)\.toISOString\(\)/);
});
test('browser zoom is not disabled', () => {
  const index = fs.readFileSync('index.html','utf8');
  assert.doesNotMatch(index,/user-scalable=no|maximum-scale=1[,\"]|minimum-scale=1[,\"]/);
});
test('product dialogs support Escape and keep keyboard focus inside the dialog', () => {
  const source=fs.readFileSync('modules/lorefy-product-tools.js','utf8');
  const start=source.indexOf('  function openSheet('),end=source.indexOf('  function section(',start);
  const dialog=source.slice(start,end);
  assert.match(dialog,/event\.key === "Escape"/);
  assert.match(dialog,/event\.key !== "Tab"/);
  assert.match(dialog,/overlay\.__returnFocus/);
});
