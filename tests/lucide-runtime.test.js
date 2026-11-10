const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const canonical = fs.readFileSync(path.join(root, 'vendor/lucide.js'), 'utf8');
const runtimePath = path.join(root, 'vendor/lucide.runtime.min.js');
const runtime = fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, 'utf8') : '';
const load = (source, document) => {
  const context = {document, console}; vm.runInNewContext(source, context);
  assert.ok(context.lucide, 'generated runtime must expose the same Lucide browser API');
  return context.lucide;
};
const plain = value => JSON.parse(JSON.stringify(value));

test('entry point loads the smaller icon runtime before the React icon adapter', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /src="vendor\/lucide\.runtime\.min\.js\?v=20261110-icons-v1"/);
  assert.doesNotMatch(html, /src="vendor\/lucide\.js"/);
  assert.ok(html.indexOf('vendor/lucide.runtime.min.js') < html.indexOf('var L = window.lucide'));
});

test('all icon exports, glyph geometry and alias references match the canonical library', () => {
  const before = load(canonical), after = load(runtime);
  assert.deepEqual(Object.keys(after), Object.keys(before));
  assert.deepEqual(Object.keys(after.icons), Object.keys(before.icons));
  assert.equal(Object.keys(after.icons).length, 1743);
  for (const key of Object.keys(before)) {
    assert.equal(typeof after[key], typeof before[key], key);
    if (Array.isArray(before[key])) assert.deepEqual(plain(after[key]), plain(before[key]), key);
  }
  for (const name of Object.keys(before.icons)) {
    assert.deepEqual(plain(after.icons[name]), plain(before.icons[name]), name);
    assert.equal(after.icons[name], after[name], 'alias/export identity: ' + name);
  }
  assert.equal(Object.isFrozen(after.icons), Object.isFrozen(before.icons));
});

test('generated icons retain Lorefy scoped hydration and never replace an existing SVG', () => {
  let replacements = 0;
  const rendered = {tagName: 'svg', matches: () => true, querySelectorAll: () => []};
  const placeholder = {tagName: 'I', attributes: [{name: 'data-lucide', value: 'test'}], getAttribute: () => 'test', parentNode: {replaceChild() { replacements++; }}};
  let current = placeholder;
  const host = {querySelectorAll: selector => selector === '[icon-name]' ? [] : [current]};
  const document = {querySelectorAll() { throw Error('unrelated document scan'); }, createElementNS: () => ({setAttribute() {}, appendChild() {}})};
  const api = load(runtime, document);
  api.createIcons({icons: {Test: ['svg', {}, []]}, root: host}); assert.equal(replacements, 1);
  current = rendered;
  api.createIcons({icons: {Test: ['svg', {}, []]}, root: host}); assert.equal(replacements, 1);
  api.createIcons({icons: {Test: ['svg', {}, []]}, nodes: [rendered]}); assert.equal(replacements, 1);
});

test('DOM creation yields identical shapes and attributes for representative controls', () => {
  const document = {createElementNS(namespace, tag) {
    return {namespace, tag, attrs: {}, children: [], setAttribute(name, value) {this.attrs[name] = value;}, appendChild(child) {this.children.push(child);}};
  }};
  const before = load(canonical, document), after = load(runtime, document);
  for (const name of ['Feather', 'Camera', 'ThumbsDown', 'BookOpen', 'Sparkles']) {
    assert.deepEqual(plain(after.createElement(after.icons[name])), plain(before.createElement(before.icons[name])), name);
  }
});

test('runtime is reproducible, retains the license and stays within its loading budget', async () => {
  const builderPath = path.join(root, 'tools/build-lucide-runtime.js');
  assert.ok(fs.existsSync(builderPath), 'minification must be reproducible from the checked-in source');
  const builder = require(builderPath);
  assert.equal(runtime, await builder.generate(canonical));
  assert.equal(runtime, await builder.generate(canonical.replace(/\r\n/g, '\n')));
  assert.match(fs.readFileSync(path.join(root, '.gitattributes'), 'utf8'), /^\*\*\/lucide\.runtime\.min\.js text eol=lf$/m);
  assert.match(runtime, /@license lucide v0\.469\.0 - ISC/);
  assert.ok(Buffer.byteLength(runtime) < 400 * 1024);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies.terser, '5.49.2');
  assert.equal(pkg.dependencies.terser, undefined, 'minifier must not become an application dependency');
});

test('offline and native entry points ship the generated runtime without its unused full copy', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(sw.includes("'./vendor/lucide.runtime.min.js?v=20261110-icons-v1'"));
  assert.ok(!sw.includes("'./vendor/lucide.js'"));
  const prepare = fs.readFileSync(path.join(root, 'tools/prepare-ios-web.mjs'), 'utf8');
  assert.match(prepare, /build-lucide-runtime\.js/);
  assert.match(prepare, /await rm\(path\.join\(output, "vendor", "lucide\.js"\), \{ force: true \}\)/);
  for (const bundle of ['ios-web', 'ios/App/App/public']) {
    assert.equal(fs.existsSync(path.join(root, bundle, 'vendor/lucide.js')), false);
    const file = path.join(root, bundle, 'vendor/lucide.runtime.min.js');
    assert.ok(fs.existsSync(file));
    assert.equal(fs.readFileSync(file, 'utf8'), runtime);
  }
});
