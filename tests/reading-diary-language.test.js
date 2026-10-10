const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../modules/lorefy-reading-diary-core.js');
const source = fs.readFileSync(path.join(__dirname, '../modules/lorefy-reading-diary.js'), 'utf8');

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.listeners = {}; this.classList = {add(){},toggle(){}}; }
  set textContent(value) { this.content = String(value); this.children = []; }
  get textContent() { return (this.content || '') + this.children.map(child => child.textContent).join(''); }
  get lastChild() { return this.children.at(-1); }
  setAttribute(key, value) { this.attrs[key] = value; }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
  addEventListener(event, callback) { this.listeners[event] = callback; }
  querySelector(selector) { return flatten(this).find(node => selector.includes('data-diary-spoiler') && selector.includes('"' + node.attrs['data-diary-spoiler'] + '"')) || null; }
  focus() { this.focused = true; }
}
function flatten(node) { return [node, ...node.children.flatMap(flatten)]; }
function runtime(lang = 'en', entries = []) {
  const page = new Element('section');
  const data = {'lorefy.user.readingDiary.v1':entries};
  const document = {documentElement:{lang}, readyState:'loading', addEventListener(){},
    createElement:tag => new Element(tag), querySelector:selector => selector === '.lf-diary-page' ? page : null};
  const window = {document, LorefyReadingDiaryCore:core, localStorage:{getItem:key => JSON.stringify(data[key] || null)},
    LorefyMangaData:[{id:'work',title:'عنوان عربي',cover:'/cover.jpg'}]};
  const exposed = source.replace('global.LorefyReadingDiary = { open: open, sync: sync };',
    'global.LorefyReadingDiary = { open: open, sync: sync, render: render, kind: kind, dateLabel: dateLabel, positionLabel: positionLabel };');
  vm.runInNewContext(exposed, {window, Intl, URLSearchParams});
  return {page, api:window.LorefyReadingDiary};
}
test('diary renders all system labels in English without translating source titles or private notes', () => {
  const note = 'ملاحظة خاصة لا تترجم';
  const {page,api} = runtime('en', [{id:'work',type:'note',note,at:Date.UTC(2026,9,5),anchorType:'chapter',anchorValue:4}]);
  api.render();
  assert.equal(page.dir,'ltr');
  assert.equal(page.lang,'en');
  assert.ok(page.textContent.includes('Every page leaves a mark'));
  assert.ok(page.textContent.includes('Chapter note'));
  assert.ok(page.textContent.includes(note));
  const nodes = flatten(page);
  assert.ok(nodes.some(node => node.attrs['aria-label'] === 'Back to profile'));
  assert.equal(nodes.find(node => node.className === 'lf-diary-note').attrs['data-no-translate'],'true');
  assert.doesNotMatch(page.textContent.replace(note,'').replaceAll('عنوان عربي',''), /[\u0600-\u06ff]/);
});
test('diary Arabic layout and event labels survive switching back', () => {
  const {page,api} = runtime('ar'); api.render();
  assert.equal(page.dir,'rtl');
  assert.ok(page.textContent.includes('كل صفحة لها أثر'));
  assert.equal(api.kind({type:'completed'}).label,'أكملت');
});
test('diary dates and reading positions use the selected language', () => {
  const {api} = runtime('en');
  assert.match(api.dateLabel(Date.UTC(2026,9,5)),/October/);
  assert.equal(api.positionLabel({anchorType:'volume',anchorValue:2}),'Volume 2');
  assert.equal(api.kind({anchorType:'page',anchorValue:2}).label,'Page note');
});
test('English duration labels handle minutes, hours and the sub-minute case', () => {
  assert.equal(core.durationLabel(1000,'en'),'Less than a minute');
  assert.equal(core.durationLabel(60000,'en'),'1 minute');
  assert.equal(core.durationLabel(120000,'en'),'2 minutes');
  assert.equal(core.durationLabel(3660000,'en'),'1 hour and 1 minute');
  assert.equal(core.durationLabel(7200000,'en'),'2 hours');
  assert.equal(core.durationLabel(60000),'دقيقة');
});
test('English external sharing localizes captions but preserves spoiler protection and user prose', () => {
  const event = {type:'quote',anchorType:'chapter',anchorValue:4,quote:'اقتباس شخصي',note:'رأيي الخاص',spoiler:true};
  const safe = core.shareText(event,'عنوان العمل',false,'en');
  assert.match(safe,/Reading quote.*عنوان العمل.*Chapter 4/);
  assert.match(safe,/Hidden because it contains spoilers/);
  assert.doesNotMatch(safe,/اقتباس شخصي|رأيي الخاص/);
  const full = core.shareText(event,'عنوان العمل',true,'en');
  assert.match(full,/اقتباس شخصي/); assert.match(full,/رأيي الخاص/);
});
test('spoiler reveal and hide restore focus through stable controls in English', () => {
  const {page,api} = runtime('en',[{id:'work',type:'note',note:'hidden',spoiler:true,entryId:'note',at:1,anchorType:'chapter',anchorValue:5}]);
  api.render();
  flatten(page).find(node => node.attrs['data-diary-spoiler'] === 'reveal').listeners.click();
  const hide = flatten(page).find(node => node.attrs['data-diary-spoiler'] === 'hide');
  assert.ok(hide.focused); assert.ok(page.textContent.includes('hidden'));
  hide.listeners.click();
  assert.ok(flatten(page).find(node => node.attrs['data-diary-spoiler'] === 'reveal').focused);
  assert.ok(!page.textContent.includes('hidden'));
});
test('chapter images and section names localize their accessibility labels at creation', () => {
  const chapter = fs.readFileSync(path.join(__dirname,'../modules/lorefy-chapter-detail.js'),'utf8');
  assert.match(chapter,/chapterImage\.alt = text\('غلاف العمل', 'Work cover'\)/);
  assert.match(chapter,/setAttribute\('aria-label', text\('فصول ', 'Chapters '\) \+ info\.title\)/);
});
