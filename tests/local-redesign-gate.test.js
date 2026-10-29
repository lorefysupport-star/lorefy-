'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../modules/lorefy-local-redesign.js'), 'utf8');
function run(hostname, search) {
  const sheets = [];
  const document = { documentElement: {dataset: {}}, createElement: () => ({}), head: {appendChild: sheet => sheets.push(sheet)} };
  vm.runInNewContext(source, {location: {hostname, search}, document, URLSearchParams});
  return {sheets, dataset: document.documentElement.dataset};
}
test('local redesign never activates on production, even with the query parameter', () => {
  for (const host of ['lorefy.app','preview.lorefy.app','localhost.example.com']) {
    assert.deepEqual(run(host, '?redesign=profile'), {sheets: [], dataset: {}});
  }
});
test('baseline and other sections are not opted into the profile redesign', () => {
  for (const query of ['', '?route=profile', '?redesign=library']) {
    assert.deepEqual(run('127.0.0.1', query), {sheets: [], dataset: {}});
  }
});
test('explicit local profile experiment loads exactly one section sheet', () => {
  const state = run('127.0.0.1', '?redesign=profile');
  assert.equal(state.dataset.lfRedesign, 'profile');
  assert.equal(state.sheets.length, 1);
  assert.equal(state.sheets[0].rel, 'stylesheet');
  assert.match(state.sheets[0].href, /^styles\/redesign\/profile.css/);
});
test('PromptSite direction is a separate local profile sheet', () => {
  const state = run('localhost', '?redesign=profile-promptsite');
  assert.equal(state.dataset.lfRedesign, 'profile');
  assert.equal(state.sheets.length, 1);
  assert.match(state.sheets[0].href, /^styles\/redesign\/profile-promptsite.css/);
  assert.deepEqual(run('lorefy.app', '?redesign=profile-promptsite'), {sheets: [], dataset: {}});
});
