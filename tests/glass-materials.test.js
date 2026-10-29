const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const design=require('../modules/lorefy-design-system.js');
const read=file=>fs.readFileSync(file,'utf8');
const modes=['light','pink','dark','custom-light-3687bb','custom-dark-18a985','custom-light-000000','custom-dark-ffffff'];
function contrast(a,b){
 const lum=h=>h.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function composite(top,bottom,alpha){
 const rgb=h=>h.slice(1).match(/../g).map(c=>parseInt(c,16));const a=rgb(top),b=rgb(bottom);
 return '#'+a.map((n,i)=>Math.round(n*alpha+b[i]*(1-alpha)).toString(16).padStart(2,'0')).join('');
}
test('glass tokens are actually translucent and retain a visible three-stop theme gradient',()=>{
 for(const mode of modes){
  const t=design.tokens(mode);
  const match=t['--ui-glass-fill']?.match(/rgba\([\d,]+,([\d.]+)\)/);
  assert.ok(match,mode);assert.ok(Number(match[1])>=.6&&Number(match[1])<=.7,mode);
  assert.match(t['--ui-page-wash'],/^linear-gradient\(145deg,#[\da-f]{6} 0%,#[\da-f]{6} 48%,#[\da-f]{6} 100%\)$/i);
  assert.ok(new Set(t['--ui-page-wash'].match(/#[\da-f]{6}/ig)).size>=2,mode);
  assert.match(t['--ui-glass-backdrop'],/blur\(26px\).*brightness/);
 }
});
test('glass ink, secondary text and accent retain contrast over black and white backdrops',()=>{
 for(const mode of modes){
  const p=design.palette(mode),t=design.tokens(mode),dark=design.isDark(mode),alpha=dark?.68:.62;
  for(const raw of ['#000000',dark?'#7a7a7a':'#ffffff'])for(const glare of dark?[.015,.12]:[.015,.44]){
   const bg=composite('#ffffff',composite(p.card,raw,alpha),glare);
   for(const name of ['ink','secondary','action'])assert.ok(contrast(t['--ui-glass-'+name],bg)>=4.5,mode+'/'+name+'/'+bg);
  }
 }
});
test('shared materials load ahead of competing glass layers and are offline cached',()=>{
 const asset='styles/lorefy-glass-materials.css?v=20261028-trust-studio-v2',html=read('index.html');
 assert.ok(html.includes(asset));assert.ok(read('sw.js').includes(asset));
 assert.ok(html.indexOf(asset)<html.indexOf('styles/lorefy-custom-glass.css'));
 const css=read('styles/lorefy-glass-materials.css');
 for(const selector of ['.lf-profile-page','.lf-bottom-nav','.lf-work-panel','.lf-design-inline-search','.lf-profile-section-tabs'])assert.ok(css.includes(selector));
 assert.match(css,/background-image:var\(--ui-page-wash\)/);
 assert.match(css,/prefers-reduced-transparency/);assert.match(css,/@supports/);
 assert.doesNotMatch(css,/opacity\s*:\s*\.|animation\s*:\s*none|--ui-bg\s*:/);
});
test('small navigation and book text has explicit readable sizes without changing cover geometry',()=>{
 const css=read('styles/lorefy-glass-materials.css');
 assert.match(css,/\.lf-nav-item>span:last-child[^{}]*\{[^}]*font-size:12px/);
 assert.match(css,/\.lf-showcase-title[^{}]*\{[^}]*font-size:13px/);
 assert.doesNotMatch(css,/font-size:\s*[\d.]+vw/);
});
