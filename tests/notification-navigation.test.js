const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : [tree, ...tree.children.flatMap(nodes)]; }

for (const language of ['ar', 'en']) test(`inbox back button is named and delegates to the origin-aware handler (${language})`, () => {
  const source = fs.readFileSync(path.join(__dirname, '../uploads/files/lorefy-app.js'), 'utf8');
  const start = source.indexOf('gr=()=>');
  const renderer = source.slice(start, source.indexOf(',ur=()=>', start));
  const routes = [];
  const context = {
    React: { createElement: (type, props, ...children) => ({ type, props:props || {}, children:children.flat(Infinity) }) },
    W:language, C:{}, Gt:[], uiText:(lang, ar, en) => lang === 'en' ? en : ar,
    leaveInbox:() => routes.push('leave'),
    BookOpen:'BookOpen', User:'User', Heart:'Heart', Award:'Award', ChevronLeft:'ChevronLeft', ChevronRight:'ChevronRight'
  };
  const tree = vm.runInNewContext(renderer + ';gr()', context);
  assert.equal(nodes(tree).find(node => node.type === 'h1')?.children[0], language === 'en' ? 'Notifications' : 'الإشعارات');
  assert.equal(nodes(tree).find(node => node.props['data-inbox-mark-all'])?.children[0], language === 'en' ? 'Mark all as read' : 'قراءة الكل');
  assert.equal(nodes(tree).find(node => node.type === 'p')?.children[0], language === 'en' ? 'No notifications yet' : 'لا إشعارات بعد');
  const back = nodes(tree).find(node => node.props.className === 'lf-navigation-back');
  assert.equal(back.props['aria-label'], language === 'en' ? 'Back' : '\u0631\u062c\u0648\u0639');
  assert.equal(back.children[0].type, language === 'en' ? 'ChevronLeft' : 'ChevronRight');
  back.props.onClick();
  assert.deepEqual(routes, ['leave']);
});
