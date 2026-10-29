const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');
const core=require('../modules/lorefy-explore-studio.js');
test('Explore uses the approved work-bound artwork without overriding a cover or rights-safe mode',()=>{
 global.LorefyHomeCinema=require('../modules/lorefy-home-cinema.js');
 const work={id:'mal-manga-2-berserk',title:'Berserk'},before=JSON.stringify(work);
 assert.equal(core.featureArtwork(work,'cover.jpg',false),'assets/home/berserk-home-v1.webp');
 assert.equal(core.featureArtwork(work,'cover.jpg',true),'cover.jpg');
 assert.equal(core.featureArtwork({id:'other',banner:'https://example.com/banner.jpg'},'cover.jpg',false),'https://example.com/banner.jpg');
 assert.equal(core.featureArtwork({id:'unknown'},'actual-cover.jpg',false),'actual-cover.jpg');
 assert.equal(JSON.stringify(work),before);
});
test('Explore artwork has a module-missing fallback, no network or persisted state',()=>{
 const previous=global.LorefyHomeCinema;delete global.LorefyHomeCinema;
 try{assert.equal(core.featureArtwork({id:'x'},'actual-cover.jpg',false),'actual-cover.jpg');}
 finally{global.LorefyHomeCinema=previous;}
});
test('Explore cinema is a scoped presentation layer and keeps search, formats and dialogs',()=>{
 const source=read('modules/lorefy-explore-studio.js');
 assert.match(source,/lf-explore-studio lf-explore-cinema/);
 assert.match(source,/lf-explore-work-caption/);
 assert.match(source,/lf-explore-work-author/);
 assert.match(source,/lf-explore-feature-rotation/);
 assert.match(source,/changeSearchMode/);assert.match(source,/function filtersBody/);assert.match(source,/function preferencesBody/);
 const css=read('styles/lorefy-explore-cinema.css');
 assert.match(css,/@layer lorefy-explore-cinema/);
 assert.match(css,/--ui-bg:#08090b/);
 assert.match(css,/\.lf-explore-feature-card\{[^}]*border-radius:0!important/);
 assert.match(css,/\.lf-explore-feature-art\{[^}]*filter:none!important/);
 assert.doesNotMatch(css,/\.lf-profile-page|\.lf-library-page|\.lf-home-cinema/);
 assert.match(css,/prefers-reduced-transparency/);
 assert.match(css,/focus-visible/);
});
test('Explore cinema stylesheet is versioned in the runtime and offline shell',()=>{
 const index=read('index.html'),sw=read('sw.js');
 assert.match(index,/styles\/lorefy-explore-cinema\.css\?v=/);
 assert.match(sw,/styles\/lorefy-explore-cinema\.css\?v=/);
 assert.ok(index.indexOf('styles/lorefy-explore-cinema.css')>index.indexOf('styles/lorefy-explore-studio.css'));
});
test('Global and format search inputs do not reuse stale uncontrolled DOM values',()=>{
 const source=read('modules/lorefy-explore-studio.js');
 assert.match(source,/key:'global-search'/);
 assert.match(source,/key:'format-search-'/);
});
test('Explore sheets stay above glass navigation and anchor to the viewport',()=>{
 const css=read('styles/lorefy-explore-cinema.css');
 assert.match(css,/\.lf-explore-cinema:has\(\.lf-explore-overlay\)\{z-index:81!important/);
 assert.match(css,/\.lf-explore-cinema \.lf-explore-overlay\{position:fixed!important/);
 assert.match(css,/:has\(\.lf-explore-cinema \.lf-explore-overlay\) \.lf-bottom-nav\{visibility:hidden!important/);
});
test('selected reference extends sharp artwork behind header and has three wide recommendations',()=>{
 const css=read('styles/lorefy-explore-cinema.css');
 assert.match(css,/\.lf-explore-immersive-art\{[^}]*position:absolute!important/);
 assert.match(css,/\.lf-explore-immersive-art>img\{[^}]*filter:none!important/);
 assert.match(css,/\.lf-explore-feature-poster\{[^}]*aspect-ratio:2\/3/);
 assert.match(css,/\.lf-explore-cinema\.has-feature \.lf-explore-header\{[^}]*z-index:2/);
 assert.match(css,/\.lf-explore-cinema \.lf-explore-rail\{[^}]*grid-auto-columns:calc\(\(100% - 28px\) \/ 3\)!important/);
 assert.match(css,/\.lf-explore-rail \.lf-explore-work\{width:100%!important/);
});
