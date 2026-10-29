const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const home=require('../modules/lorefy-home-cinema.js');

function fixture(empty=false){
 const attrs={},handlers={},writes=[];
 const page={scrollTop:0,setAttribute:(k,v)=>{attrs[k]=v;writes.push(v);},removeAttribute:k=>delete attrs[k],addEventListener:(k,fn,options)=>{assert.equal(options.passive,true);handlers[k]=fn;},removeEventListener:(k,fn)=>{assert.equal(handlers[k],fn);delete handlers[k];}};
 const scene={closest:()=>page,classList:{contains:()=>empty}};
 return {page,scene,attrs,handlers,writes};
}
test('Home starts on sharp artwork and changes only the sticky chrome after scrolling',()=>{
 const f=fixture(),dispose=home.bindReadingChrome(f.scene);
 assert.equal(f.attrs['data-home-chrome'],'immersive');
 f.page.scrollTop=70;f.handlers.scroll();assert.equal(f.attrs['data-home-chrome'],'scrolled');
 const count=f.writes.length;f.handlers.scroll();assert.equal(f.writes.length,count,'equivalent scroll events do not repaint chrome');
 f.page.scrollTop=0;f.handlers.scroll();assert.equal(f.attrs['data-home-chrome'],'immersive');
 dispose();assert.equal(f.handlers.scroll,undefined);assert.equal(f.attrs['data-home-chrome'],undefined);
});
test('empty Home stays on readable normal chrome without inventing artwork or reading data',()=>{
 const f=fixture(true),dispose=home.bindReadingChrome(f.scene);
 assert.equal(f.attrs['data-home-chrome'],'plain');assert.equal(f.handlers.scroll,undefined);
 dispose();assert.equal(f.attrs['data-home-chrome'],undefined);
 assert.doesNotThrow(()=>home.bindReadingChrome(null)());
});
test('Home-only reference layer never changes approved Explore or other sections',()=>{
 const file='styles/lorefy-home-immersive.css',css=fs.readFileSync(file,'utf8');
 assert.doesNotMatch(css,/\.lf-explore|\.lf-library|\.lf-profile|--ui-[\w-]+\s*:/);
 assert.match(css,/data-home-chrome='immersive'[^{}]*lf-social-header\s*\{[^}]*backdrop-filter:none/);
 assert.match(css,/\.lf-cinema-resume-action\s*\{[^}]*width:max-content/);
 assert.match(css,/\.lf-cinema-backdrop\s*\{[^}]*filter:none/);
 const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8'),asset=file+'?v=20261028-reading-type-v1';
 assert.ok(html.includes(asset)&&sw.includes(asset));assert.ok(html.indexOf(asset)<html.indexOf('styles/lorefy-glass-materials.css'));
});
