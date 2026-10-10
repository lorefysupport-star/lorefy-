const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
test('library search and sorting are independent of catalog search',()=>{
  const start=app.indexOf('libraryVisible='),end=app.indexOf(';return React.createElement',start);
  assert.ok(start>0);
  const ctx={r:[{m:{title:'Z Hunter'},id:'z'},{m:{title:'Other'},id:'o'},{m:{title:'A Hunter'},id:'a'}],libraryQuery:'Hunter',libraryOrder:'title',window:{LorefyCatalogData:{matchesCatalogQuery:(w,q)=>w.title.includes(q)}}};
  vm.runInNewContext('const '+app.slice(start,end)+';result=libraryVisible;',ctx);
  assert.deepEqual(Array.from(ctx.result,x=>x.id),['a','z']);
});
test('own reviews do not get a moderation menu',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../modules/lorefy-product-tools.js'),'utf8');
  assert.match(src,/if\s*\(context\.own\)\s*return/);
  assert.match(src,/own:\s*Boolean/);
});
test('Togashi manga volumes are not western comics',()=>{
  const ctx={window:{LorefyMangaData:[]}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../modules/lorefy-comics-taxonomy.js'),'utf8'),ctx);
  const taxonomy=ctx.window.LorefyComicsTaxonomy;
  for(const title of ['Hunter X Hunter Vol.15','Yuyu Hakusho Vol.18']){
    const work={title,auth:'Togashi, Yoshihiro',type:'Comics',pl:'Open Library'};
    taxonomy.classify(work);
    assert.equal(work.type,'مانجا');
  }
  const guide={title:'Guide to drawing manga',auth:'Yoshihiro Togashi',type:'Comics',pl:'Open Library'};
  taxonomy.classify(guide); assert.equal(guide.type,'كتاب');
});
test('onboarding inherits the selected appearance',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-auth-flow.css'),'utf8');
  assert.match(css,/--auth-paper:\s*var\(--ui-bg\)/);
  assert.match(css,/background:\s*var\(--ui-surface\)/);
});
test('followers dialog supports Escape and traps focus',()=>{
  assert.match(app,/lf-followers-dialog/);
  assert.match(app,/key==="Escape"\)\{e.preventDefault\(\);Ue\(null\)/);
  assert.match(app,/aria-modal":true/);
});
test('growth dialogs share keyboard dismissal and return focus',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../modules/lorefy-growth-features.js'),'utf8');
  assert.match(src,/function bindDialogKeys\(/);
  assert.match(src,/bindDialogKeys\(page, closePage, back\)/);
  assert.match(src,/bindDialogKeys\(overlay, closeConnections, close\)/);
});
test('Following empty state has a reader discovery action',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../modules/lorefy-community.js'),'utf8');
  assert.match(src,/lorefy:find-readers/);
  const readers=fs.readFileSync(path.join(__dirname,'../modules/lorefy-user-discovery.js'),'utf8');
  assert.match(readers,/function openReaderSearch\(/);
  assert.match(readers,/lorefy:find-readers/);
});
test('preference work and character boards share the locale direction',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-design-system.css'),'utf8');
  assert.match(css,/html\[dir='rtl'\][^\n]*lf-pref-board-cover-grid[^\n]*lf-cb-cover-grid[^\n]*direction:\s*rtl\s*!important/);
  assert.match(css,/html\[dir='ltr'\][^\n]*lf-pref-board-cover-grid[^\n]*lf-cb-cover-grid[^\n]*direction:\s*ltr\s*!important/);
});
