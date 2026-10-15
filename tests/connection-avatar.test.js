const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness() {
  let failed = null;
  const React = {
    createElement:(type, props, ...children) => ({type, props:props || {}, children:children.flat(Infinity)}),
    useState:() => [failed, value => { failed = value; }]
  };
  const window = {React};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../modules/lorefy-user-experience.js'), 'utf8'), {window});
  return {React, window, render:props => {
    assert.equal(typeof window.LorefyUserExperience.ReaderAvatar, 'function', 'connection rows need a safe avatar renderer');
    return window.LorefyUserExperience.ReaderAvatar(props);
  }};
}
function nodes(tree) {return !tree || typeof tree !== 'object' ? [] : [tree, ...tree.children.flatMap(nodes)];}

test('missing connection avatars never request the document as an image', () => {
  const app = harness();
  for (const src of ['', '   ', null, undefined]) {
    const tree = app.render({src, name:'Reader'});
    assert.equal(nodes(tree).filter(n => n.type === 'img').length, 0);
    assert.ok(JSON.stringify(tree).includes('R'));
  }
});

test('a failed image retains a fixed avatar fallback and a replacement URL can load', () => {
  const app = harness(), src = 'https://example.com/expired.jpg';
  const first = app.render({src, name:'Reader'});
  const image = nodes(first).find(n => n.type === 'img');
  assert.equal(image.props.src, src);
  image.props.onError();
  const fallback = app.render({src, name:'Reader'});
  assert.equal(nodes(fallback).filter(n => n.type === 'img').length, 0);
  assert.equal(fallback.props.className, first.props.className);
  assert.equal(nodes(app.render({src:'https://example.com/new.jpg', name:'Reader'})).find(n => n.type === 'img').props.src, 'https://example.com/new.jpg');
});

test('a late image error does not hide the next reader image', () => {
  const app = harness();
  const old = nodes(app.render({src:'https://example.com/a.jpg', name:'A'})).find(n => n.type === 'img');
  app.render({src:'https://example.com/b.jpg', name:'B'});
  old.props.onError();
  assert.ok(nodes(app.render({src:'https://example.com/b.jpg', name:'B'})).some(n => n.type === 'img'));
});

test('the actual following row uses the safe renderer for missing avatars', () => {
  const app = harness();
  const source = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  const start = source.indexOf('mr=()=>{if(!Fo)');
  const renderer = source.slice(start, source.indexOf(',vr=', start));
  const React = {...app.React, createElement(type, props, ...children) {
    return typeof type === 'function' ? type(props || {}) : app.React.createElement(type, props, ...children);
  }};
  const context = {React, window:app.window, Fo:'following', W:'en', _o:0, Ht:1,
    C:{}, X:'X', Vt:[{id:'reader-a', name:'Reader', un:'reader', av:''}], cloudFollowers:[], cloudFollowing:[], Ue:() => {}};
  app.window.LorefyI18n = {connections:() => ({title:'Connections', following:'Following', followers:'Followers'})};
  const tree = vm.runInNewContext(renderer + ';mr()', context);
  assert.equal(nodes(tree).filter(n => n.type === 'img').length, 0);
  assert.ok(nodes(tree).some(n => n.props.className === 'lf-connection-avatar'));
});

test('the legacy renderer patch is scoped and repeatable', () => {
  const patch = require('../tools/patch-connection-avatar.js');
  const source = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  assert.equal(patch(source), source);
  assert.throws(() => patch('unrecognized app source'), /Connection renderer not found/);
});
