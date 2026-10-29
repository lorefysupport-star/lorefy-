const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const design=require('../modules/lorefy-design-system.js');
const read=file=>fs.readFileSync(file,'utf8');

test('custom glass is loaded before fixed cinematic important layers and cached',()=>{
 const asset='styles/lorefy-custom-glass.css?v=20261027-theme-unity-v2';
 const html=read('index.html');assert.ok(html.includes(asset));assert.ok(read('sw.js').includes(asset));
 assert.ok(html.indexOf(asset)<html.indexOf('styles/lorefy-home-cinema.css'));
});

test('custom palette exports stable aliases that cannot cycle through cinematic token overrides',()=>{
 for(const base of ['light','dark'])for(const color of ['#18a985','#d45982','#ffef00','#000000','#ffffff']){
  const mode=design.customMode(color,base),tokens=design.tokens(mode);
  for(const key of ['bg','surface','fill','fill-soft','ink','secondary','muted','action','on-action','selected','line','rating','nav','bar']){
   assert.equal(tokens['--custom-'+key],tokens['--ui-'+key],mode+' '+key);
   assert.doesNotMatch(tokens['--custom-'+key],/var\(/);
  }
 }
 assert.equal(design.tokens('dark')['--custom-bg'],undefined,'default appearance stays unchanged');
});

test('custom glass covers cinematic pages, work sheets, community composer and navigation',()=>{
 const css=read('styles/lorefy-custom-glass.css');
 for(const selector of ['.lf-home-cinema','.lf-library-cinema','.lf-explore-cinema','.lf-detail-page','.lf-work-panel','.lf-character-page','.lf-bottom-nav','.lf-post-composer'])assert.ok(css.includes(selector),selector);
 for(const token of ['--custom-bg','--custom-fill','--custom-ink','--custom-action'])assert.ok(css.includes(token),token);
 assert.match(css,/@layer lorefy-custom-glass/);
 assert.match(css,/prefers-reduced-transparency/);assert.match(css,/@supports/);
 assert.doesNotMatch(css,/animation\s*:\s*none|display\s*:\s*none|filter\s*:\s*grayscale/);
});

test('arbitrary color, base switching and reload retain unrelated saved data',()=>{
 const values={'account':'untouched','lorefy.user.profileLayout.v1':'"reader"'};
 const store={getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v};
 assert.ok(design.saveMode(design.customMode('#D45982','dark'),store));
 assert.equal(design.readMode(store),'custom-dark-d45982');
 const light=design.withBase(design.readMode(store),'light');
 assert.ok(design.saveMode(light,store));assert.equal(design.readMode(store),'custom-light-d45982');
 assert.equal(values.account,'untouched');assert.equal(values['lorefy.user.profileLayout.v1'],'"reader"');
 assert.equal(design.customMode('not-a-color','dark'),null);
});

test('work overlays cannot reintroduce their local fixed rating or field palette',()=>{
 const css=read('styles/lorefy-custom-glass.css');
 const tokenRule=css.slice(css.indexOf('.lf-app'),css.indexOf('@supports'));
 for(const sheet of ['.lf-rating-sheet','.lf-work-cover-sheet','.lf-work-status-sheet'])assert.ok(tokenRule.includes(sheet),sheet);
 assert.ok(tokenRule.includes('--ui-danger: var(--custom-danger)'));
});

test('ready-made light and pink palettes reach the same cinematic bridge as custom colors',()=>{
 const css=read('styles/lorefy-custom-glass.css');
 for(const mode of ['light','pink']){
  const tokens=design.tokens(mode);
  for(const key of ['bg','ink','muted','action','surface','fill','selected'])assert.equal(tokens['--custom-'+key],tokens['--ui-'+key],mode+'/'+key);
  assert.ok(css.includes('.is-'+mode));
  assert.ok(css.includes("[data-lorefy-theme='"+mode+"']"));
 }
});

test('on-art copy has explicit contrast rather than inheriting light-page ink',()=>{
 const css=read('styles/lorefy-custom-glass.css');
 assert.match(css,/\.lf-social-header[^{}]*\.lf-icon-button[^{}]*\{[^}]*color:var\(--custom-ink\)/);
 assert.match(css,/\.lf-cinema-resume[^{}]*\{[^}]*color:var\(--custom-ink\)/);
});

test('friend and review scores use readable semantic ink on light and pink surfaces',()=>{
 const css=read('styles/lorefy-custom-glass.css');
 for(const selector of ['.lf-friend-reader','.lf-friend-score','.lf-cinema-rating','.lf-community-compose-fab'])assert.match(css,new RegExp(selector.replaceAll('.','\\.')+'[^{}]*\\{[^}]*color:var\\(--custom-(?:ink|action|secondary)\\)'));
});
