const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../modules/lorefy-growth-features.js'), 'utf8');

class Element {
  constructor(tag, attrs = {}, children = []) {
    this.tag = tag; this.attrs = { ...attrs }; this.children = []; this.handlers = {};
    this.value = ''; this.isConnected = true; this._text = attrs.text || '';
    this.classList = { contains: name => (this.attrs.class || '').split(' ').includes(name) };
    children.filter(Boolean).forEach(child => this.appendChild(child));
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; this._text = ''; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(' '); }
  setAttribute(name, value) { this.attrs[name] = value; }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  click() { this.handlers.click?.(); }
  focus() {}
}
function find(root, className) {
  return [root, ...root.children.flatMap(child => all(child))].find(node => (node.attrs.class || '').split(' ').includes(className));
}
function all(root) { return [root, ...root.children.flatMap(all)]; }
function harness() {
  let owner = 'account-a', selection = [], overlay, timers = new Map(), serial = 0;
  const writes = [], searches = [], messages = [];
  const item = { workId: 'work', character: { key: 'hero', name: 'Hero' }, workTitle: 'Work', score: 5 };
  const scope = {
    profileTopCharacterEditor: null, profileRatedCharacterCache: {}, K_SCORES: 'ratings', K_CHARCUSTOM: 'custom', K_CHARIMG: 'images',
    profileRatedCharacterOwner: () => owner, syncProfileRatedCharacterGallery() {},
    doc: { querySelector: () => null }, el: (tag, attrs, kids) => new Element(tag, attrs || {}, kids || []),
    ovOpen() { const page = new Element('div'), body = new Element('div'); page.appendChild(body);
      overlay = { page, body, close() { page.inert = true; page.isConnected = false; body.isConnected = false; } }; return overlay; },
    profileTopCharacterSelection: () => selection,
    profileCharacterEntries: () => ({ entries: [item], missing: [] }),
    profileTopCharacterRefKey: ref => ref?.characterKey || '', profileTopCharacterRef: row => ({ characterKey: row.character.key, character: row.character }),
    profileTopCharacterFromRef: ref => ref ? item : null,
    setProfileTopCharacterSelection: draft => writes.push({ owner, draft: JSON.stringify(draft) }), syncProfileTopCharacters() {},
    profileTopCharacterSearchText: value => value.toLowerCase(), profileTopCharacterSearchWorks: () => [],
    profileRatedCharacterPortrait: () => new Element('span'), profileRatedCharacterStars: () => new Element('span'),
    uiText: (ar, en) => en, toastSafe: message => messages.push(message), mlWorks: () => [],
    setTimeout: fn => { const id = ++serial; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
    global: { LorefyCharacterSystem: { characterMatches: () => true, searchCharacters: (query, works, options) => new Promise(resolve => searches.push({ resolve, options })) } }
  };
  let start = source.indexOf('  function syncProfileTopCharacterEditor(');
  if (start >= 0) vm.runInNewContext(source.slice(start, source.indexOf('  function profileRatedCharacterStateChanged(', start)), scope);
  start = source.indexOf('  function profileRatedCharacterStateChanged(');
  vm.runInNewContext(source.slice(start, source.indexOf('  function openProfileRatedCharacters(', start)), scope);
  start = source.indexOf('  function openProfileTopCharactersEditor()');
  vm.runInNewContext(source.slice(start, source.indexOf('  function renameProfileFavouriteWorksHeading(', start)), scope);
  return { scope, writes, searches, messages, setOwner: value => { owner = value; },
    open(saved = []) { selection = saved; scope.openProfileTopCharactersEditor(); return overlay; },
    stateChanged() { scope.profileRatedCharacterStateChanged({ detail: { key: 'lorefy.activeUser.v1' } }); },
    runTimers() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); }, timers };
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

test('a stale character editor cannot save into the next account', () => {
  const h = harness(), ov = h.open(); h.setOwner('account-b');
  find(ov.page, 'lf-top-characters-editor-save').click();
  assert.equal(h.writes.length, 0); assert.equal(h.messages.length, 0); assert.equal(ov.page.inert, true);
});

test('stale candidate selection and removal cannot overwrite the next account', () => {
  for (const action of ['lf-top-characters-editor-candidate', 'lf-top-characters-editor-remove']) {
    const h = harness(), ov = h.open(action.endsWith('remove') ? [{ characterKey: 'hero' }] : []);
    const button = find(ov.page, action); assert.ok(button); h.setOwner('account-b'); button.click();
    assert.equal(h.writes.length, 0, action); assert.equal(ov.page.inert, true);
  }
});

test('account storage events permanently invalidate the old editor even after returning to that account', () => {
  const h = harness(), ov = h.open(), save = find(ov.page, 'lf-top-characters-editor-save');
  h.setOwner('account-b'); h.stateChanged(); h.setOwner('account-a'); save.click();
  assert.equal(h.writes.length, 0); assert.equal(ov.page.inert, true);
});

test('a pending character search is cancelled for the old owner and cannot repaint the editor', async () => {
  const h = harness(), ov = h.open(), input = find(ov.page, 'lf-top-characters-editor-search');
  input.value = 'Hero'; input.handlers.input(); h.runTimers(); await flush();
  assert.equal(h.searches.length, 1); assert.equal(h.searches[0].options.active(), true);
  h.setOwner('account-b'); h.stateChanged(); const before = ov.body.textContent;
  assert.equal(h.searches[0].options.active(), false);
  h.searches[0].resolve([{ workId: 'old-search', cast: [{ name: 'Late character' }] }]); await flush();
  assert.equal(ov.body.textContent, before); assert.equal(Object.hasOwn(h.scope.profileRatedCharacterCache, 'old-search'), false);
});

test('leaving an editor prevents detached handlers from writing and clears pending timers', () => {
  const h = harness(), ov = h.open(), input = find(ov.page, 'lf-top-characters-editor-search');
  input.value = 'Hero'; input.handlers.input(); assert.ok(h.timers.size); ov.close();
  if (h.scope.syncProfileTopCharacterEditor) h.scope.syncProfileTopCharacterEditor();
  find(ov.page, 'lf-top-characters-editor-save').click();
  assert.equal(h.writes.length, 0); assert.equal(h.timers.size, 0);
});

test('switching accounts before the debounce expires sends no character search', async () => {
  const h = harness(), ov = h.open(), input = find(ov.page, 'lf-top-characters-editor-search');
  input.value = 'Hero'; input.handlers.input(); h.setOwner('account-b'); h.runTimers(); await flush();
  assert.equal(h.searches.length, 0); assert.equal(ov.page.inert, true);
});

test('a rejected old search neither repaints nor reports failure in the next account', async () => {
  const h = harness(), ov = h.open(), input = find(ov.page, 'lf-top-characters-editor-search');
  h.scope.global.LorefyCharacterSystem.searchCharacters = () => new Promise((resolve, reject) => h.searches.push({ reject }));
  input.value = 'Hero'; input.handlers.input(); h.runTimers(); await flush(); h.setOwner('');
  const before = ov.body.textContent; h.searches[0].reject(Error('offline')); await flush();
  assert.equal(ov.body.textContent, before); assert.equal(h.writes.length, 0); assert.equal(ov.page.inert, true);
});

test('the active owner can select, remove and save favorites normally', () => {
  const h = harness(), ov = h.open();
  find(ov.page, 'lf-top-characters-editor-candidate').click();
  find(ov.page, 'lf-top-characters-editor-remove').click();
  find(ov.page, 'lf-top-characters-editor-save').click();
  assert.equal(h.writes.length, 3); assert.ok(h.writes.every(row => row.owner === 'account-a'));
  assert.equal(h.messages.length, 1); assert.equal(ov.page.inert, true);
});
