const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');

test('profile artwork fades through alpha into the real theme material, not a flat-color endpoint',()=>{
 const css=read('styles/lorefy-profile-header.css');
 const image=css.slice(css.indexOf('> :is(.lf-profile-banner,.lf-reader-banner) > img {'),css.indexOf('> :is(.lf-profile-banner,.lf-reader-banner)::after'));
 assert.match(image,/mask-image:\s*linear-gradient\(/);
 assert.match(image,/-webkit-mask-image:\s*linear-gradient\(/);
 assert.match(image,/var\(--profile-header-text-start\)/);
 assert.doesNotMatch(image,/mask-image:\s*none/);
 const after=css.slice(css.indexOf('> :is(.lf-profile-banner,.lf-reader-banner)::after'),css.indexOf('> :is(.lf-profile-banner,.lf-reader-banner):not('));
 assert.match(after,/display:\s*none\s*!important/);
 assert.doesNotMatch(after,/var\(--ui-bg\)/);
 const banner=css.slice(0,css.indexOf('> :is(.lf-profile-banner,.lf-reader-banner) > img'));
 assert.match(banner,/background:\s*transparent\s*!important/);
});

test('favorite cover edit badges are visually compact without shrinking their touch target',()=>{
 const css=read('styles/lorefy-cover-media.css');
 const rule=css.match(/\.lf-profile-favorites \.lf-profile-cover-edit\s*\{([^}]+)\}/);
 assert.ok(rule,'favorites must have their own compact treatment');
 assert.match(rule[1],/background:\s*transparent\s*!important/);
 assert.match(rule[1],/border:\s*0\s*!important/);
 assert.match(css,/\.lf-profile-cover-edit\s*\{[^}]*width:44px!important;[^}]*height:44px!important/);
 assert.match(css,/\.lf-profile-favorites \.lf-profile-cover-edit::before\s*\{[^}]*inset:9px[^}]*pointer-events:none/s);
 assert.match(css,/\.lf-profile-favorites \.lf-profile-cover-edit>svg\s*\{[^}]*width:14px!important;[^}]*height:14px!important/s);
});

test('the repair keeps all three profile layouts, geometry, original media and native web copies intact',()=>{
 const css=read('styles/lorefy-profile-header.css');
 assert.match(css,/#lf-profile-header,\[data-profile-header-ready='true'\]/);
 assert.match(css,/height:\s*var\(--profile-header-art-height\)\s*!important/);
 for(const f of ['styles/lorefy-profile-header.css','styles/lorefy-cover-media.css','index.html','sw.js'])for(const mirror of ['ios-web','ios/App/App/public'])assert.equal(read(mirror+'/'+f),read(f));
 assert.doesNotMatch(read('modules/lorefy-profile-header.js'),/localStorage|\.src\s*=/);
});

test('frame clearance reserves room even when the profile has no bio',()=>{
 const shop=require('../modules/lorefy-profile-shop.js');
 assert.equal(typeof shop.connectionInset,'function');
 assert.equal(shop.connectionInset(430,420),22);
 assert.equal(shop.connectionInset(430,442),0);
 assert.equal(shop.connectionInset(430,480),0);
 assert.equal(shop.connectionInset(NaN,420),0);
});

test('portrait photos extend beneath the ring rather than stopping short of its opening',()=>{
 const api=require('../modules/lorefy-crafted-motion.js');
 const measured={witch:156.5,moon:119,ink:149.5,theatre:145,dawn:177,dusk:160,garden:140.2,patchwork:131.2};
 for(const [id,radius]of Object.entries(measured)){
  const size=['witch','moon','ink','theatre'].includes(id)?520:620;
  assert.ok(api.portrait(id).size*size/2>=radius+1.5,id+' has a portrait gap');
  assert.ok(api.protectedPortrait(id).size<=api.portrait(id).size);
 }
});

test('compact reading metrics retain accessible labels and the Reader grid orders them before tabs',()=>{
 const css=read('styles/lorefy-profile-refined.css'),source=read('modules/lorefy-profile-sections.js');
 assert.match(css,/\.lf-profile-reading-metrics svg\s*\{[^}]*width:14px\s*!important/);
 assert.match(css,/\.lf-profile-reading-metrics[^}]*clip-path:inset\(50%\)/s);
 assert.match(source,/row\.title/);
 const reader=read('styles/lorefy-reader-layout.css');
 assert.match(reader,/grid-template-areas: 'name' 'handle' 'bio' 'social' 'metrics' 'tabs' 'favorites'/);
 assert.match(css,/\.lf-profile-reading-metrics\s*\{[^}]*grid-template-columns:repeat\(var\(--profile-metric-count,4\),minmax\(0,1fr\)\) !important/);
});

test('favorite presentation budget is bounded and stable while scrolling',()=>{
 const header=require('../modules/lorefy-profile-header.js');
 assert.equal(typeof header.favoriteBudget,'function');
 assert.equal(header.favoriteBudget(520,844,0),308);
 assert.equal(header.favoriteBudget(320,844,200),308);
 assert.equal(header.favoriteBudget(900,844,0),128);
 assert.equal(header.favoriteBudget(100,1000,0),400);
});

test('shelf sizing includes empty slots without resizing showcase covers',()=>{
 const css=read('styles/lorefy-profile-refined.css');
 assert.match(css,/\.is-spine-view>[^\n]*\.is-empty-spine/);
 assert.match(css,/\.lf-profile-favorites\.is-spine-view,\[data-profile-shelf='works'\] \.is-spine-view\) \.lf-profile-spine-cover/);
 assert.doesNotMatch(css,/:is\(\.lf-profile-favorites,\[data-profile-shelf='works'\]\) \.lf-profile-spine-cover/);
 assert.match(css,/@layer lorefy-profile-refined[\s\S]*padding-block-start:var\(--profile-frame-connections-space,0px\) !important/);
});

test('compact metric icons and their wrapper stay visible in Reader too',()=>{
 const css=read('styles/lorefy-profile-refined.css');
 assert.match(css,/\.lf-profile-reading-metrics svg\s*\{[^}]*display:block !important/);
 assert.match(css,/\.lf-profile-reading-metrics>div:not\(\.is-profile-social-stat\)>div:first-child\s*\{[^}]*display:flex !important/);
});

test('standalone Reader heading retains gutters and side showcase artwork scales proportionally',()=>{
 const css=read('styles/lorefy-profile-refined.css');
 assert.match(css,/\[data-profile-layout='reader'\]>.lf-profile-top-works-head\s*\{[^}]*margin-inline:var\(--reader-layout-inline,20px\) !important/);
 assert.match(css,/\[data-profile-layout='reader'\]>.lf-profile-top-works-head\s*\{[^}]*width:auto !important/);
 assert.match(css,/\[data-showcase-position='right'\]\) \.lf-showcase-cover\s*\{[^}]*width:120% !important/);
 assert.match(css,/\[data-showcase-position='right'\]\)\s*\{[^}]*padding-bottom:0 !important/);
});
