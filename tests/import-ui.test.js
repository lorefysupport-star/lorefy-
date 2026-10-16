const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles/lorefy-design-system.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');

function openImport(lang) {
  const nodes = [];
  const el = (tag, attrs = {}, children = []) => {
    const node = { tag, attrs, children, handlers: {}, value: '',
      appendChild(child) { this.children.push(child); },
      addEventListener(type, handler) { this.handlers[type] = handler; }
    };
    nodes.push(node);
    return node;
  };
  const scope = { el, ovOpen: () => ({ body: el('div') }),
    uiText: (ar, en) => lang === 'ar' ? ar : en,
    IM_DONE: 'done', IM_READING: 'reading', IM_WISH: 'wish', IM_PAUSED: 'paused', IM_DROPPED: 'dropped'
  };
  const start = source.indexOf('  function openImport()');
  vm.runInNewContext(source.slice(start, source.indexOf('  /* \u2500\u2500 profile character taste', start)), scope);
  scope.openImport();
  return nodes;
}

test('import primary actions use the theme foreground pair outside the app subtree', () => {
  const rule = css.match(/\.lf-im-page :is\(\.lf-im-go,\s*\.lf-im-reload,\s*\.lf-im-chip\.is-on\)\s*\{([^}]+)\}/);
  assert.ok(rule, 'overlay needs a selector independent of .lf-app');
  assert.match(rule[1], /background:\s*var\(--ui-action\)/);
  assert.match(rule[1], /color:\s*var\(--ui-on-action\)/);
  assert.match(rule[1], /min-height:\s*44px/);
});

for (const lang of ['ar', 'en']) test(`import fields retain accessible names in ${lang}`, () => {
  const nodes = openImport(lang);
  const usernameFields = nodes.filter(n => n.tag === 'input' && n.attrs.type === 'text');
  assert.equal(usernameFields.length, 2);
  for (const service of ['AniList', 'Kitsu']) {
    const field = usernameFields.find(n => n.attrs.placeholder.includes(service));
    assert.equal(field.attrs['aria-label'], lang === 'ar' ? `اسم المستخدم في ${service}` : `${service} username`);
  }
  assert.equal(nodes.find(n => n.tag === 'textarea').attrs['aria-label'], lang === 'ar' ? 'عناوين الأعمال للاستيراد' : 'Titles to import');
});
