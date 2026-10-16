const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const core = require('../modules/lorefy-reading-diary-core.js');
const source = fs.readFileSync(path.join(__dirname, '../modules/lorefy-reading-diary.js'), 'utf8');
const flatten = node => [node, ...node.children.flatMap(flatten)];
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.listeners = {}; this.classList = { toggle() {} }; }
  set textContent(value) { this.content = String(value); this.children = []; }
  get textContent() { return (this.content || '') + this.children.map(child => child.textContent).join(''); }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key]; }
  appendChild(child) { this.children.push(child); return child; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  querySelectorAll(selector) { return flatten(this).filter(child => child !== this && child.tag === selector); }
}
function composer({ language = 'en', type = 'Book', progress = {}, editing = null, initialAnchor = null } = {}) {
  const body = new Element('div'), values = {
    'lorefy.user.library.v2': { book: 'أقرأ حالياً', manga: 'أقرأ حالياً' },
    'lorefy.user.progress.v2': { book: progress, manga: { chapter: 8 } }
  };
  const document = { readyState: 'loading', documentElement: { lang: language }, addEventListener() {}, createElement: tag => new Element(tag) };
  const window = { document, LorefyReadingDiaryCore: core,
    localStorage: { getItem: key => JSON.stringify(values[key] || null) },
    LorefyMangaData: [{ id: 'book', title: 'QA Book', type, pages: 300 }, { id: 'manga', title: 'QA Manga', type: 'Manga' }] };
  const exposed = source.replace('global.LorefyReadingDiary = { open: open, sync: sync };', 'global.LorefyReadingDiary = { compose: compose, state: state };');
  vm.runInNewContext(exposed, { window, Intl, URLSearchParams });
  Object.assign(window.LorefyReadingDiary.state, { selectedWork: 'book', editing, initialAnchor });
  window.LorefyReadingDiary.compose(body);
  const find = name => flatten(body).find(node => node.className === name);
  return { body, select: find('lf-diary-select'), position: find('lf-diary-position-input'),
    active: () => flatten(body).find(node => node.attrs['aria-pressed'] === 'true' && node.className.startsWith('lf-diary-position-kind')).textContent,
    choose: label => flatten(body).find(node => node.className?.startsWith('lf-diary-position-kind') && node.textContent === label).listeners.click() };
}
for (const [language, page, chapter] of [['ar', 'صفحة', 'فصل'], ['en', 'Page', 'Chapter']]) {
  test(`${language}: new Book and Novel notes start on a page without inventing progress`, () => {
    for (const type of ['Book', 'Novel', 'كتاب', 'رواية']) {
      const c = composer({ language, type }); assert.equal(c.active(), page); assert.equal(c.position.value, '');
    }
  });
  test(`${language}: sequential works keep chapter defaults`, () => {
    for (const type of ['Manga', 'Comics', 'Light Novel', 'Web Novel']) assert.equal(composer({ language, type }).active(), chapter);
  });
  test(`${language}: changing works updates the automatic unit without losing prose`, () => {
    const c = composer({ language, progress: { page: 20 } });
    const note = flatten(c.body).filter(n => n.tag === 'textarea').at(-1); note.value = 'Keep my draft';
    c.select.value = 'manga'; c.select.listeners.change();
    assert.equal(c.active(), chapter); assert.equal(c.position.value, '8'); assert.equal(note.value, 'Keep my draft');
  });
  test(`${language}: manual units and existing note anchors are never replaced by a type default`, () => {
    const c = composer({ language }); c.choose(page); c.select.value = 'manga'; c.select.listeners.change();
    assert.equal(c.active(), page); assert.equal(c.position.value, '');
    const existing = composer({ language, editing: { anchorType: 'chapter', anchorValue: 7 } });
    assert.equal(existing.active(), chapter); assert.equal(existing.position.value, 7);
  });
}
test('saved chapter checkpoints take precedence over book metadata and legacy aliases respect explicit zero', () => {
  assert.equal(composer({ progress: { chapter: 6, page: 20 } }).active(), 'Chapter');
  assert.equal(composer({ progress: { chapter: 0, ch: 99 } }).active(), 'Page');
});
test('volume-only progress and an explicit entry point retain their unit and position', () => {
  const volume = composer({ progress: { volume: 3 } }); assert.equal(volume.active(), 'Volume'); assert.equal(volume.position.value, 3);
  const explicit = composer({ initialAnchor: { type: 'chapter', value: 12 } }); assert.equal(explicit.active(), 'Chapter'); assert.equal(explicit.position.value, 12);
});
