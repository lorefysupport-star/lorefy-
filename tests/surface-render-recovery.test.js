const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('modules/lorefy-ui-runtime.js', 'utf8');

function harness(lang = 'ar') {
  const logs = [], writes = [];
  class Component {
    constructor(props) { this.props = props; this.state = {}; }
    setState(update) { this.state = {...this.state, ...(typeof update === 'function' ? update(this.state) : update)}; }
  }
  const React = {Component, Fragment: 'fragment',
    createElement: (type, props, ...children) => ({type, props: props || {}, children}),
    useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useEffect() {}};
  const window = {React, document: {documentElement: {lang}},
    localStorage: {setItem: (...args) => writes.push(args), removeItem: (...args) => writes.push(args), clear: () => writes.push('clear')}};
  vm.runInNewContext(source, {window, console: {warn: (...args) => logs.push(args)}});
  return {api: window.LorefyUI, logs, writes};
}

function descendants(node) {
  return node && typeof node === 'object' ? [node, ...(node.children || []).flatMap(descendants)] : [];
}

test('the application shell contains a render boundary rather than unmounting the entire app on a child error', () => {
  const h = harness(), child = {page: 'work'};
  assert.equal(typeof h.api.RenderBoundary, 'function');
  assert.equal(descendants(h.api.AppShell({children: child})).some(node => node.type === h.api.RenderBoundary), true);
});

for (const lang of ['ar', 'en']) test('render failures have localized recovery and do not modify saved data: ' + lang, () => {
  const h = harness(lang), Boundary = h.api.RenderBoundary;
  assert.equal(typeof Boundary, 'function');
  const boundary = new Boundary({children: 'current-page'});
  Object.assign(boundary.state, Boundary.getDerivedStateFromError(new Error('private detail')));
  const fallback = boundary.render(), nodes = descendants(fallback);
  assert.equal(fallback.props.role, 'alert');
  assert.equal(fallback.props.dir, lang === 'en' ? 'ltr' : 'rtl');
  assert.equal(JSON.stringify(fallback).includes('private detail'), false);
  const retry = nodes.find(node => node.type === 'button');
  assert.ok(retry);
  assert.equal(retry.children.join(''), lang === 'en' ? 'Try again' : 'إعادة المحاولة');
  retry.props.onClick();
  assert.equal(boundary.state.failed, false);
  assert.deepEqual(h.writes, []);
});

test('a new auth surface can recover while the same failing child cannot trigger a retry loop', () => {
  const h = harness(), Boundary = h.api.RenderBoundary;
  assert.equal(typeof Boundary, 'function');
  const first = {page: 'work'}, next = {page: 'auth'};
  const boundary = new Boundary({children: first});
  boundary.state.failed = true;
  boundary.componentDidUpdate({children: first});
  assert.equal(boundary.state.failed, true);
  boundary.props = {children: next};
  boundary.componentDidUpdate({children: first});
  assert.equal(boundary.state.failed, false);
});

test('diagnostics never persist or emit the render error message, stack, or child content', () => {
  const h = harness(), Boundary = h.api.RenderBoundary;
  assert.equal(typeof Boundary, 'function');
  const boundary = new Boundary({children: 'private draft'});
  boundary.componentDidCatch({name: 'TypeError', message: 'private token', stack: 'private stack'});
  assert.equal(JSON.stringify(h.logs).includes('TypeError'), true);
  assert.equal(JSON.stringify(h.logs).includes('private'), false);
  assert.deepEqual(h.writes, []);
});
