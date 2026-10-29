const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');
test('glass post composer separates author from full-width writing without replacing draft ownership',()=>{
 const source=read('modules/lorefy-community.js');
 assert.match(source,/lf-community-composer-author/);
 assert.match(source,/lf-community-compose-sheet lf-community-compose-glass/);
 assert.match(source,/composerDrafts\.get\(draftOwner\)/);
 assert.match(source,/closeComposerSheet\(true\)/);
 assert.match(source,/openAttachmentPicker\("quote"\)/);
});
test('glass composer tools are compact icon controls with viewport and keyboard support retained',()=>{
 const css=read('styles/lorefy-home-cinema.css');
 assert.match(css,/\.lf-community-compose-glass \.lf-community-compose-tools button\{[^}]*border-radius:50%/);
 assert.match(css,/\.lf-community-compose-glass \.lf-community-compose-tools button span\{[^}]*clip-path:inset\(50%\)/);
 assert.match(css,/\.lf-community-composer-author\{[^}]*display:flex/);
 assert.match(css,/composer-viewport-height/);assert.match(css,/is-keyboard-open/);
});
test('the frontmost attachment picker has Escape, a focus loop and returns to its tool',()=>{
 const src=read('modules/lorefy-community.js'),start=src.indexOf('  function openAttachmentPicker('),end=src.indexOf('  function syncComposerAttachment(',start),picker=src.slice(start,end);
 assert.match(picker,/function dismissPicker\(/);assert.match(picker,/event\.key === 'Escape'/);assert.match(picker,/event\.key !== 'Tab'/);
 assert.match(picker,/previous\.focus/);assert.match(picker,/close\.focus/);
});
test('work cinema is an isolated versioned layer, not a change to catalog or persistence',()=>{
 const css=read('styles/lorefy-work-cinema.css');
 assert.match(css,/@layer lorefy-work-cinema/);assert.match(css,/\.lf-detail-page/);
 assert.doesNotMatch(css,/\.lf-profile-page|\.lf-library-page|\.lf-explore-cinema/);
 assert.match(read('index.html'),/styles\/lorefy-work-cinema\.css\?v=/);
 assert.match(read('sw.js'),/styles\/lorefy-work-cinema\.css\?v=/);
});
test('work cinema uses sharp media, readable hierarchy, glass tabs and retained reading controls',()=>{
 const css=read('styles/lorefy-work-cinema.css');
 assert.match(css,/\.lf-work-title-line h1\{[^}]*font-size:28px/);
 assert.match(css,/\.lf-detail-hero>img\{[^}]*filter:none/);
 for(const name of ['lf-chapter-quick-add','lf-work-section-nav','lf-chapter-reading','lf-work-reader-tabs','lf-cover-choice','lf-character-rating-row','lf-rating-sheet'])assert.ok(css.includes(name),name);
 assert.match(css,/prefers-reduced-transparency/);assert.match(css,/focus-visible/);
});
test('Escape in a work sheet invokes its React-owned close control, not a swallowed overlay click',()=>{
 const vm=require('node:vm'),src=read('modules/lorefy-growth-features.js');
 const start=src.indexOf('var release = bindDialogKeys(sheet,');
 const end=src.indexOf('var cleanup = new MutationObserver',start);
 let callback,closed=0,overlaid=0;
 const close={isConnected:true,disabled:false,click:()=>closed++};
 vm.runInNewContext(src.slice(start,end),{sheet:{matches:()=>true,querySelector:()=>close},overlay:{isConnected:true,click:()=>overlaid++},initial:null,bindDialogKeys:(s,close)=>{callback=close;}});
 callback();assert.equal(closed,1);assert.equal(overlaid,0);
 close.disabled=true;callback();assert.equal(closed,1);assert.equal(overlaid,0,'a disabled close must not fall through to scrim dismissal');
});
test('work tool buttons name their familiar icons in hover tooltips',()=>{
 const src=read('modules/lorefy-chapter-detail.js');
 assert.match(src,/item\.setAttribute\('title', label\)/);
});
test('books without a chapter catalog still expose the real work actions without fabricating chapters',()=>{
 const vm=require('node:vm'),src=read('modules/lorefy-chapter-detail.js');
 const start=src.indexOf('  function enhance() {'),end=src.indexOf('  function schedule()',start);
 const actions={};let enhanced=0;
 const content={querySelector:()=>actions};
 vm.runInNewContext(src.slice(start,end)+';enhance();',{readingUndo:null,context:()=>null,doc:{querySelector:()=>content},enhanceActions:node=>{assert.equal(node,actions);enhanced++;}});
 assert.equal(enhanced,1);
});
test('a book about comics is not treated as serialized comics because of its title or publisher label',()=>{
 const vm=require('node:vm'),src=read('modules/lorefy-chapter-detail.js');
 const start=src.indexOf('  function context() {'),end=src.indexOf('  function reviewFor(',start);
 const work={id:'book',title:'How Comics Travel',type:'كتاب',ch:0};
 const content={children:[{textContent:'كتاب How Comics Travel Open Library Comics'}],querySelector:s=>s==='h1'?{textContent:work.title}:s==='.lf-work-facts'?{textContent:'Open Library Comics'}:null,closest:()=>({querySelector:()=>null})};
 const sandbox={URLSearchParams,doc:{querySelector:()=>content},global:{location:{search:'?novel=book'}},catalogWork:()=>work,core:{total:()=>0,isFinished:()=>true},metadata:{sourceFor:()=>null,catalogFor:()=>null},readingOwner:()=>'',result:null};
 vm.runInNewContext(src.slice(start,end)+';result=context();',sandbox);assert.equal(sandbox.result,null);
});
