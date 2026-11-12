const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const design=require('../modules/lorefy-design-system');
function contrast(a,b){
 const lum=h=>h.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
 const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
const levels=['00','55','aa','ff'],grid=levels.flatMap(r=>levels.flatMap(g=>levels.map(b=>'#'+r+g+b)));
const modes=[...new Set(['light','dark','pink',...['#df7134','#ffffff','#000000','#ffff00','#18a985','#0000ff','#ff00ff',...grid].flatMap(c=>['light','dark'].map(b=>design.customMode(c,b)))])];
test('semantic text colors remain legible across all owned solid theme surfaces',()=>{
 for(const mode of modes){
  const p=design.palette(mode);
  for(const ink of ['text','text2','sub','sub2','placeholder','accentText','rating','red','green','gold','blue'])for(const bg of ['bg','card','field','fill2','accentSoft']){
   assert.ok(contrast(p[ink],p[bg])>=4.5,mode+' '+ink+'/'+bg+' '+contrast(p[ink],p[bg]).toFixed(2));
  }
  assert.ok(contrast(p.onAccent,p.accent)>=4.5,mode+' action label');
 }
});
test('returning to dark overwrites every stable alias from the previous custom theme',()=>{
 const before=design.tokens('custom-light-df7134'),dark=design.tokens('dark'),merged={...before,...dark};
 for(const key of ['bg','surface','ink','secondary','muted','action','on-action','danger','success','gold']){
  assert.equal(merged['--custom-'+key],dark['--ui-'+key],key);
 }
});
test('dark pages and portals use the same literal palette bridge as the other themes',()=>{
 const css=fs.readFileSync('styles/lorefy-custom-glass.css','utf8');
 assert.match(css,/\.is-custom,\.is-light,\.is-pink,\.is-dark/);
 assert.ok(css.includes("[data-lorefy-theme='dark']"));
 assert.match(css,/--ui-bg: var\(--custom-bg\)/);
});

test('glass chrome consumes its backdrop-safe ink rather than the opaque-page ink',()=>{
 for(const mode of modes){
  const t=design.tokens(mode);
  assert.ok(t['--ui-glass-muted'],mode);
  for(const key of ['ink','secondary','muted','action'])assert.equal(t['--custom-glass-'+key],t['--ui-glass-'+key]);
  const p=design.palette(mode),dark=design.isDark(mode),rgb=h=>h.slice(1).match(/../g).map(c=>parseInt(c,16));
  const mix=(a,b,w)=>'#'+rgb(a).map((c,i)=>Math.round(c*(1-w)+rgb(b)[i]*w).toString(16).padStart(2,'0')).join('');
  for(const raw of ['#000000',dark?'#7a7a7a':'#ffffff'])for(const glare of dark?[.015,.12]:[.015,.44]){
   const bg=mix(mix(raw,p.card,dark?.68:.62),'#ffffff',glare);
   for(const key of ['ink','secondary','muted','action'])assert.ok(contrast(t['--ui-glass-'+key],bg)>=4.5,mode+' glass '+key);
  }
 }
 const css=fs.readFileSync('styles/lorefy-glass-materials.css','utf8');
 assert.match(css,/\.lf-nav-item[^{}]*\{[^}]*color:var\(--ui-glass-secondary\)/);
 assert.match(css,/input::placeholder[^{}]*\{[^}]*color:var\(--ui-glass-muted\)/);
 assert.match(css,/\.lf-rating-footer>button:not\(:disabled\)[^{}]*\{[^}]*color:var\(--ui-on-action\)/);
});
