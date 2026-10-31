const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const design = require('../modules/lorefy-design-system');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const source = 'modules/lorefy-legal.js';
const api = fs.existsSync(path.join(root, source)) ? require('../modules/lorefy-legal') : {};
const hashes = {
  'privacy-policy': '98e6955b5c02bbc4aac905442aee5f716604fcea5e852cf2d9cebd7e9ee96150',
  terms: 'd4a0e6fdd94560564c210dbdc2e2edd937a777d1c6c376ddae285fc6dce273ba',
  support: 'b8ae5684717fcfd7360f0ab56c29544a7956c6245ef18646aa2962d3f81e2e1e',
  'community-guidelines': '67fb13cceb5036c5074b2650bcc8c84a1665f5316f450ead726ea58f3f6192dc'
};
for (const [name, hash] of Object.entries(hashes)) test(`${name} keeps the exact original legal article and date`, () => {
  const article = read(name + '.html').match(/<article[\s\S]*?<\/article>/)[0].replace(/\r\n/g, '\n');
  assert.equal(crypto.createHash('sha256').update(article).digest('hex'), hash);
});
for (const name of Object.keys(hashes)) test(`${name} loads shared theme before styles and progressive navigation`, () => {
  const html = read(name + '.html');
  assert.ok(html.indexOf('modules/lorefy-design-system.js?') >= 0);
  assert.ok(html.indexOf('modules/lorefy-legal.js?') < html.indexOf('styles/lorefy-legal.css?'));
  assert.match(html, /lorefy-legal\.(?:css|js)\?v=20261028-legal-studio-v1/);
  assert.match(html, /class="legal-skip" href="#legal-article"/);
  assert.match(html, /<html lang="ar" dir="rtl">/);
});
const url = 'http://127.0.0.1:8796/privacy-policy.html';
test('legal navigation preserves only known app preview flags through linked documents', () => {
  const ctx = api.navigation(url, 'http://127.0.0.1:8796/phone-preview.html?preview=demo&demo=ready&route=home&adaptive=1&decorationLab=1&token=secret');
  assert.equal(ctx.back, 'phone-preview.html?route=profile&preview=demo&demo=ready&adaptive=1&decorationLab=1');
  assert.equal(ctx.query, '?entry=phone&preview=demo&demo=ready&adaptive=1&decorationLab=1');
  assert.deepEqual(api.navigation(url + ctx.query, 'http://127.0.0.1:8796/terms.html'), ctx);
});
test('external, unrelated and path-spoofed referrers cannot change the app return target', () => {
  for (const ref of ['https://evil.test/phone-preview.html?preview=demo', 'http://127.0.0.1:8796/other.html', 'http://127.0.0.1:8796/other/phone-preview.html']) {
    assert.equal(api.navigation(url, ref).back, 'index.html?route=profile');
  }
  assert.equal(api.navigation(url + '?entry=https://evil.test&preview=evil&demo=wrong&next=https://evil.test', '').back, 'index.html?route=profile');
});
test('legal return paths work below a subdirectory and the native app origin', () => {
  assert.equal(api.navigation('capacitor://localhost/privacy-policy.html?entry=phone', '').back, 'phone-preview.html?route=profile');
  assert.equal(api.navigation('http://localhost/app/privacy-policy.html', 'http://localhost/app/index.html?adaptive=1').back, 'index.html?route=profile&adaptive=1');
});
for (const mode of ['dark', 'light', 'pink', 'custom-dark-207b69', 'custom-light-a53662']) test(`legal page reads ${mode} without writing preferences`, () => {
  const style = {}, attrs = {}, storage = {getItem: () => mode, setItem: () => assert.fail('read-only')};
  const result = api.applyTheme({style:{setProperty:(key,value) => style[key] = value}, setAttribute:(key,value) => attrs[key] = value}, design, storage);
  assert.equal(result, mode); assert.equal(attrs['data-legal-theme'], mode);
  assert.equal(style['--ui-bg'], design.tokens(mode)['--ui-bg']);
  assert.equal(style['--ui-glass-fill'], design.tokens(mode)['--ui-glass-fill']);
});
test('blocked local storage keeps the document readable with a safe default', () => {
  assert.equal(api.applyTheme({style:{setProperty:()=>{}},setAttribute:()=>{}}, design, {getItem:()=>{throw Error('blocked');}}), 'dark');
});
test('legal styles retain semantic glass, readable content and keyboard/touch layout', () => {
  const css = read('styles/lorefy-legal.css');
  for (const value of ['--ui-bg','--ui-ink','--ui-glass-fill','--ui-glass-backdrop','focus-visible','safe-area-inset-top','scroll-margin-top','overflow-wrap: anywhere','min-height: 44px']) assert.ok(css.includes(value), value);
  assert.doesNotMatch(css, /font-size:\s*clamp\(/);
});
test('legal offline core contains current styles, navigation and all linked policy pages', () => {
  const sw = read('sw.js');
  assert.ok(sw.includes('./modules/lorefy-legal.js?v=20261028-legal-studio-v1'));
  assert.ok(sw.includes('./styles/lorefy-legal.css?v=20261028-legal-studio-v1'));
  assert.ok(sw.includes('./community-guidelines.html'));
  assert.match(sw, /lorefy-v646-home-reading/);
});
