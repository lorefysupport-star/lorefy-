const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : [tree, ...tree.children.flatMap(nodes)]; }

for (const language of ['ar', 'en']) test(`inbox back button is named and returns to profile (${language})`, () => {
  const source = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  const start = source.indexOf('gr=()=>');
  const renderer = source.slice(start, source.indexOf(',ur=()=>', start));
  const routes = [];
  const context = {
    React: { createElement: (type, props, ...children) => ({ type, props:props || {}, children:children.flat(Infinity) }) },
    W:language, C:{}, Gt:[], uiText:(lang, ar, en) => lang === 'en' ? en : ar,
    S:route => routes.push(['screen',route]), v:route => routes.push(['tab',route]),
    BookOpen:'BookOpen', User:'User', Heart:'Heart', Award:'Award', ChevronLeft:'ChevronLeft', ChevronRight:'ChevronRight'
  };
  const tree = vm.runInNewContext(renderer + ';gr()', context);
  const back = nodes(tree).find(node => node.props.className === 'lf-navigation-back');
  assert.equal(back.props['aria-label'], language === 'en' ? 'Back' : '\u0631\u062c\u0648\u0639');
  assert.equal(back.children[0].type, language === 'en' ? 'ChevronLeft' : 'ChevronRight');
  back.props.onClick();
  assert.deepEqual(routes, [['screen','profile'], ['tab','profile']]);
});
