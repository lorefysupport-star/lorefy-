const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const library=require('../modules/lorefy-library-cinema.js');
const walk=n=>[n,...(n.children||[]).filter(x=>typeof x==='object').flatMap(walk)];
global.React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat().filter(Boolean)})};
global.NenIcons={Search:'Search',BookOpen:'BookOpen',Compass:'Compass'};
test('Library empty search offers recovery instead of claiming the library is empty',()=>{
 let clear=0;const nodes=walk(library.Empty({language:'en',query:'missing',onClear:()=>clear++}));
 assert.ok(nodes.some(n=>n.children.includes('No matching works')));
 nodes.find(n=>n.type==='button').props.onClick();assert.equal(clear,1);
});
test('a genuinely empty collection routes to Explore without adding sample books',()=>{
 let opened=0;const nodes=walk(library.Empty({language:'ar',query:'',onExplore:()=>opened++}));
 nodes.find(n=>n.type==='button').props.onClick();assert.equal(opened,1);assert.equal(nodes.filter(n=>n.type==='img').length,0);
});
test('Library refinement preserves plain artwork-free background and readable checkpoints',()=>{
 const css=fs.readFileSync('styles/lorefy-library-refined.css','utf8');
 assert.doesNotMatch(css,/url\(|\.lf-explore|\.lf-profile|--ui-[\w-]+\s*:/);
 assert.match(css,/\.lf-library-copy>span\s*\{[^}]*color:var\(--ui-secondary\)/);
 assert.match(css,/\.lf-library-view-switch button\s*\{[^}]*min-width:44px/);
 const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8');assert.match(app,/LorefyLibraryCinema\.Empty/);
});
