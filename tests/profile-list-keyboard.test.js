const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const api = require('../modules/lorefy-profile-sections');
const source = fs.readFileSync(require('node:path').join(__dirname, '../modules/lorefy-profile-sections.js'), 'utf8');

function harness(lang = 'en') {
  const doc = {documentElement: {lang}, activeElement: null};
  class Element {
    constructor(tag, attrs = {}, children = []) {
      this.tag = tag; this.attrs = attrs; this.children = []; this.handlers = {};
      this.value = attrs.value || ''; this._text = attrs.text || ''; this.disabled = false;
      for (const [key, value] of Object.entries(attrs)) if (key.startsWith('on')) this.handlers[key.slice(2)] = value;
      children.filter(Boolean).forEach(child => this.appendChild(child));
    }
    get isConnected() { return this === panel || !!this.parent?.isConnected; }
    appendChild(child) { child.parent = this; this.children.push(child); return child; }
    remove(){if(this.parent){const p=this.parent;p.children.splice(p.children.indexOf(this),1);this.parent=null;}}
    insertBefore(child,before){if(child===before)return;child.remove();const i=before?this.children.indexOf(before):this.children.length;child.parent=this;this.children.splice(i,0,child);}
    append(...children) { children.forEach(child => this.appendChild(child)); }
    replaceChildren(...children) {
      if (this.contains(doc.activeElement)) doc.activeElement = null;
      this.children.forEach(child => { child.parent = null; }); this.children = []; this._text = '';
      this.append(...children);
    }
    contains(element) { return this === element || this.children.some(child => child.contains(element)); }
    set textContent(value) { this.replaceChildren(); this._text = String(value); }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(' '); }
    setAttribute(key, value) { this.attrs[key] = value; }
    addEventListener(key, fn) { this.handlers[key] = fn; }
    focus() { if (this.isConnected && !this.disabled) doc.activeElement = this; }
    click() { if (!this.disabled) { this.focus(); this.handlers.click?.(); } }
    querySelectorAll(selector) {
      return this.children.flatMap(child => [child, ...child.querySelectorAll('*')]).filter(child =>
        selector === '*' || selector === child.tag || selector.startsWith('.') && (child.attrs.class || '').split(' ').includes(selector.slice(1)));
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  }
  const panel = new Element('div'), values = new Map([['lorefy.activeUser.v1', 'owner']]);
  let failSave = false;
  const storage = {getItem: key => values.get(key) || null, setItem(key, value) {
    if (failSave) throw Error('Quota exceeded'); values.set(key, value);
  }};
  const node = (tag, attrs, children) => new Element(tag, attrs, children);
  const button = (label, symbol, action, cls = '') => node('button', {
    'aria-label': label, class: cls, onclick: action
  });
  const folder = {id:'ranked',name:'Favorites',description:'Original description',kind:'works',isPublic:true,
    items:['Alpha','Beta','Gamma'].map(name => ({id:name,workId:name,name}))};
  api.saveFolder(storage, 'owner', folder);
  const scope = {...api, doc, root: {localStorage:storage}, node, button,
    text: () => api.labels(lang), current: () => true, hydrate() {}, image: () => node('span'),
    replacePanel: (state,...children) => state.panel.replaceChildren(...children), releaseListImages() {},
    catalog: () => [], read: (store, key, fallback) => JSON.parse(store.getItem(key) || 'null') || fallback,
    contentHeader: (title, action) => node('header', {}, [action]),
    renderFolders: () => panel.replaceChildren(node('p', {text:'Lists'}))};
  vm.runInNewContext(source.slice(source.indexOf('  function editFolder('), source.indexOf('  async function loadPosts(')), scope);
  scope.editFolder({panel,profile:{id:'owner'}}, folder);
  return {panel, doc, storage, folder, failSave: (value = true) => { failSave = value; },
    rows: () => panel.querySelector('.lf-profile-ranked-list').children,
    tools: index => panel.querySelector('.lf-profile-ranked-list').children[index].querySelectorAll('button'),
    name: () => panel.querySelector('input'),
    submit: () => panel.querySelector('form').handlers.submit({preventDefault() {}})};
}

test('moving a list entry retains focus on its move control for repeated keyboard actions', () => {
  const h = harness(); h.tools(0)[1].click();
  assert.equal(h.rows()[1].textContent.includes('Alpha'), true);
  assert.equal(h.doc.activeElement, h.tools(1)[1]);
  h.doc.activeElement.click();
  assert.equal(h.rows()[2].textContent.includes('Alpha'), true);
  assert.equal(h.doc.activeElement, h.tools(2)[0], 'at the boundary focus the available reverse action');
  h.doc.activeElement.click();
  assert.equal(h.doc.activeElement, h.tools(1)[0]);
});

test('removal focuses the next entry, then the previous entry, then search when empty', () => {
  const h = harness(); h.tools(1)[2].click();
  assert.equal(h.doc.activeElement, h.tools(1)[2]);
  h.doc.activeElement.click();
  assert.equal(h.doc.activeElement, h.tools(0)[2]);
  h.doc.activeElement.click();
  assert.equal(h.doc.activeElement, h.panel.querySelectorAll('input').find(input => input.attrs.type === 'search'));
});

test('rank actions identify their entry and announce its new position in both languages', () => {
  for (const lang of ['en','ar']) {
    const h = harness(lang);
    for (const control of h.tools(0)) assert.ok(control.attrs['aria-label'].includes('Alpha'));
    h.tools(0)[1].click();
    const status = h.panel.querySelectorAll('p').find(element => element.attrs.role === 'status');
    assert.ok(status.textContent.includes('Alpha'));
    assert.ok(status.textContent.includes('2 / 3'));
  }
});

test('reordering preserves the name draft and writes nothing until save', async () => {
  const h = harness(); h.name().value = 'New title'; h.tools(0)[1].click();
  assert.equal(h.name().value, 'New title');
  assert.deepEqual(api.foldersFor({}, true, h.storage)[0].items.map(item => item.name), ['Alpha','Beta','Gamma']);
  await h.submit();
  const saved = api.foldersFor({}, true, h.storage)[0];
  assert.equal(saved.name, 'New title');
  assert.deepEqual(saved.items.map(item => item.name), ['Beta','Alpha','Gamma']);
});

test('failed local save retains the reordered draft and a retry saves the same order', async () => {
  const h = harness(); h.tools(0)[1].click(); h.name().value = 'Draft'; h.failSave(); await h.submit();
  assert.equal(h.name().value, 'Draft');
  assert.equal(h.rows()[0].textContent.includes('Beta'), true);
  assert.equal(h.panel.querySelector('.lf-profile-list-error').textContent, api.labels('en').saveFailed);
  assert.deepEqual(api.foldersFor({}, true, h.storage)[0].items.map(item => item.name), ['Alpha','Beta','Gamma']);
  h.failSave(false); await h.submit();
  assert.equal(api.foldersFor({}, true, h.storage)[0].name, 'Draft');
  assert.deepEqual(api.foldersFor({}, true, h.storage)[0].items.map(item => item.name), ['Beta','Alpha','Gamma']);
});

test('cancelling a reordered draft leaves the saved name and order untouched', () => {
  const h = harness(); h.name().value = 'Unsaved'; h.tools(0)[1].click();
  h.panel.querySelector('header').querySelector('button').click();
  assert.equal(h.panel.textContent, 'Lists');
  const saved = api.foldersFor({}, true, h.storage)[0];
  assert.equal(saved.name, 'Favorites');
  assert.deepEqual(saved.items.map(item => item.name), ['Alpha','Beta','Gamma']);
});

test('rank moves and removal retain unaffected row and portrait nodes',()=>{
 const h=harness(),original=h.rows().slice(),portraits=original.map(row=>row.children[1]);
 h.tools(0)[1].click();assert.equal(h.rows()[1],original[0]);assert.equal(h.rows()[0],original[1]);
 h.tools(1)[2].click();assert.equal(h.rows()[0],original[1]);assert.equal(h.rows()[1],original[2]);
 assert.equal(h.rows()[0].children[1],portraits[1]);assert.equal(h.rows()[1].children[1],portraits[2]);
});
