const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('only row anchors disable paint culling so the shelf can span seven books',()=>{
  const css=fs.readFileSync('styles/lorefy-book-showcase.css','utf8');
  assert.match(css,/\.lf-library-card:nth-child\(7n\+1\)\s*\{[^}]*content-visibility:\s*visible\s*!important/s);
  assert.doesNotMatch(css,/\.lf-library-card\s*\{[^}]*content-visibility:\s*visible/s);
});

test('shelf fixture reproduces production card culling and incomplete rows',()=>{
  const fixture=fs.readFileSync('qa/wood-shelf.html','utf8');
  assert.match(fixture,/content-visibility:auto/);
  assert.match(fixture,/params\.get\('count'\)/);
});

test('library spines use a bounded consistent height and no inherited cover margin',()=>{
  const css=fs.readFileSync('styles/lorefy-book-showcase.css','utf8');
  assert.match(css,/\.lf-library-cover\s*\{[^}]*height:\s*196px\s*!important[^}]*margin:\s*0\s*!important/s);
  assert.match(css,/\.lf-library-done\s*\{[^}]*top:\s*8px\s*!important/s);
  assert.match(css,/\.lf-library-spine-title\s*\{[^}]*inset:\s*36px 0 12px\s*!important/s);
});

test('shelves respect the reading direction and reserve matching space for both ends',()=>{
  const css=fs.readFileSync('styles/lorefy-book-showcase.css','utf8');
  assert.match(css,/padding-inline:\s*20px\s*!important[^}]*direction:\s*inherit/s);
  assert.match(css,/\.lf-library-card:nth-child\(7n\+1\)::before\s*\{[^}]*inset-inline-start:\s*-20px[^}]*width:\s*calc\(700% \+ 64px\)/s);
});
