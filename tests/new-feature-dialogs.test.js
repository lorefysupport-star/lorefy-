const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../modules/lorefy-growth-features.js'), 'utf8');

function fixture() {
  const doc = { activeElement: null };
  function node(name, tabIndex = 0) {
    return {name, children:[], parentElement:null, inert:false, isConnected:true, tabIndex, disabled:false, handlers:{},
      append(n) {this.children.push(n); n.parentElement=this;},
      addEventListener(k, fn) {this.handlers[k]=fn;}, removeEventListener(k) {delete this.handlers[k];},
      querySelectorAll() {return this.controls || [];}, getClientRects() {return [1];},
      focus() {doc.activeElement=this;}
    };
  }
  doc.body=node('body'); const host=node('host'), app=node('app'), previous=node('previous'); previous.inert=true;
  doc.body.append(host); doc.body.append(previous); host.append(app);
  const opener=node('opener'); app.append(opener); doc.activeElement=opener;
  const scope={doc}; const start=source.indexOf('function bindDialogKeys(');
  vm.runInNewContext(source.slice(start,source.indexOf('function ovOpen(',start)),scope);
  function dialog(name) {const page=node(name), back=node('back'), inactive=node('inactive',-1), last=node('last'); page.controls=[back,inactive,last]; page.append(back);page.append(inactive);page.append(last);host.append(page);return {page,back,last,inactive};}
  return {doc,app,previous,opener,dialog,bind:scope.bindDialogKeys,node};
}
test('dialog isolates ancestors without clearing pre-existing inert state', () => {
  const f=fixture(),d=f.dialog('gallery'), release=f.bind(d.page,()=>{},d.back);
  assert.equal(f.doc.activeElement,d.back);assert.equal(f.app.inert,true);assert.equal(f.previous.inert,true);
  release();assert.equal(f.app.inert,false);assert.equal(f.previous.inert,true);assert.equal(f.doc.activeElement,f.opener);
});
test('nested character dialog restores the gallery before the original page', () => {
  const f=fixture(),gallery=f.dialog('gallery'),closeGallery=f.bind(gallery.page,()=>{},gallery.back);
  gallery.last.focus(); const character=f.dialog('character'),closeCharacter=f.bind(character.page,()=>{},character.back);
  assert.equal(gallery.page.inert,true);assert.equal(f.app.inert,true);
  closeCharacter();assert.equal(gallery.page.inert,false);assert.equal(f.app.inert,true);assert.equal(f.doc.activeElement,gallery.last);
  closeGallery();assert.equal(f.app.inert,false);assert.equal(f.doc.activeElement,f.opener);
});
test('keyboard stays inside dialog and cleanup is idempotent', () => {
  const f=fixture(),d=f.dialog('gallery');let closed=0;
  const release=f.bind(d.page,()=>closed++,d.back),keys=d.page.handlers.keydown;
  let prevented=0;const event=(key,shiftKey=false)=>({key,shiftKey,preventDefault(){prevented++;},stopPropagation(){}});
  keys(event('Tab',true));assert.equal(f.doc.activeElement,d.last);
  keys(event('Tab'));assert.equal(f.doc.activeElement,d.back);
  keys(event('Escape'));assert.equal(closed,1);assert.equal(prevented,3);
  release();d.last.focus();release();assert.equal(f.doc.activeElement,d.last);
});
test('character page uses the shared modal lifecycle instead of a document Escape listener', () => {
  const open=source.slice(source.indexOf('function openCharacterPage('),source.indexOf('function withTimeout('));
  const close=source.slice(source.indexOf('function closePage()'),source.indexOf('function characterLoadStatus('));
  assert.match(open,/page\._releaseDialog\s*=\s*bindDialogKeys\(page, closePage,/);
  assert.doesNotMatch(open,/doc\.addEventListener\("keydown", onKey\)/);
  assert.match(close,/p\._releaseDialog\(\)/);
});

test('work options return focus to the persistent trigger before opening a dialog', () => {
  const chapter=fs.readFileSync(path.resolve(__dirname,'../modules/lorefy-chapter-detail.js'),'utf8');
  assert.match(chapter,/dismissMenu\(\); more\.focus\(\); target\.click\(\)/);
});

test('overlay saves and navigation share the close lifecycle', () => {
  assert.match(source,/return \{ page: page, head: head, body: body, close: closePage \}/);
  assert.doesNotMatch(source,/ov\.page\.remove\(\)/);
});

test('profile favorites request their catalog records without waiting for the complete catalog', () => {
  const start=source.indexOf('function syncProfileFavouriteWorksControls(');
  const sync=source.slice(start,source.indexOf('function syncProfileTopCharacters(',start));
  assert.match(sync,/LorefyCatalogLoader\.loadWorks\(favoriteIds\)/);
  assert.match(sync,/favorites\.dataset\.lfFavoriteCatalogRequested/);
  assert.match(sync,/read\("lorefy\.user\.favorites\.v2", \[\]\)/);
});
