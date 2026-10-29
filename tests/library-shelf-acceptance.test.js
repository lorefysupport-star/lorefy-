const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const views=require('../modules/lorefy-library-view.js');

test('Reader poster captions do not compete with spine or showcase geometry',()=>{
 const css=fs.readFileSync('styles/lorefy-profile-refined.css','utf8');
 const selectors=[...css.matchAll(/([^{}]+)\{[^{}]*display:\s*-webkit-box\s*!important[^{}]*\}/g)]
  .map(m=>m[1]).filter(s=>s.includes('.lf-reader-layout-cover-title'));
 assert.equal(selectors.length,1);
 assert.match(selectors[0],/\.lf-profile-favorites:not\(\.is-spine-view\):not\(\.is-showcase-view\)/);
});

test('partial and multiple library rows retain every work and stable triplet positions',()=>{
 for(const count of [1,2,3,4,7,8,10,14,15]){
  const positions=Array.from({length:count},(_,i)=>views.showcasePlacement(i));
  assert.equal(new Set(positions.map(p=>p.row+':'+p.position)).size,count);
  assert.equal(positions.at(-1).row,Math.ceil(count/3));
  assert.equal(views.favoriteLimit('showcase'),3);
  assert.equal(views.favoriteLimit('spines'),7);
 }
});

test('decorative spine titles cannot intercept the separate managed Open button',()=>{
 const css=fs.readFileSync('styles/lorefy-cover-media.css','utf8');
 assert.match(css,/\.lf-managed-cover-card :is\(\.lf-library-spine-title,\.lf-profile-spine-title\)\s*\{\s*pointer-events:none\s*\}/);
});
