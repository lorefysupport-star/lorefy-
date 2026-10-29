const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('notification header reserves separate space for Back, title and Mark all as read',()=>{
 const css=fs.readFileSync('styles/lorefy-notification-center.css','utf8');
 assert.match(css,/grid-template-columns:44px minmax\(0,1fr\) auto/);
 assert.match(css,/header>button:last-child\s*\{[^}]*width:auto/);
 assert.match(css,/white-space:nowrap/);
 assert.doesNotMatch(css,/\.lf-home-cinema|\.lf-explore|url\(/);
});
