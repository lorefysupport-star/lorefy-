const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('long featured titles wrap within a track that reserves the poster width',()=>{
 const css=fs.readFileSync('styles/lorefy-explore-cinema.css','utf8');
 assert.match(css,/\.lf-design-feature-copy\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.lf-design-feature-copy\{[^}]*width:calc\(100% - var\(--explore-poster-width\) - 60px\)/);
 assert.match(css,/\.lf-explore-feature-open\{[^}]*width:100%/);
 assert.match(css,/\.lf-explore-feature-open>strong\{[^}]*white-space:normal/);
 assert.match(css,/\.lf-explore-feature-poster\{[^}]*width:var\(--explore-poster-width\)/);
});
