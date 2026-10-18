const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');
test('welcome has no illustrative background and uses a restrained dark provider entry',()=>{
  const css=read('styles/lorefy-auth-flow.css');
  assert.doesNotMatch(css,/lorefy-reading-scene|background:\s*url\(/);
  assert.match(css,/--auth-paper:\s*#101214/);
  assert.match(css,/min-height:\s*56px/);
  assert.match(css,/\.lf-auth\[data-lf-auth-stage="welcome"\] \.lf-sub\s*\{\s*display:\s*none/);
});
test('welcome keeps exactly Apple and Google activations without adding email or image controls',()=>{
  const source=read('auth/lorefy-auth.js');
  const welcome=source.slice(source.indexOf('function de('),source.indexOf('function G('));
  assert.equal((welcome.match(/onClick:\(\)=>c\(/g)||[]).length,2);
  assert.match(welcome,/c\("apple"\)/);assert.match(welcome,/c\("google"\)/);
  assert.doesNotMatch(welcome,/createElement\("img"|onClick:i/);
});
test('bootstrap is a centered local monogram and indeterminate cue without old floating artwork',()=>{
  const html=read('index.html');
  const boot=html.slice(html.indexOf('class="lf-bootstrap-splash"'),html.indexOf('</div></div>',html.indexOf('class="lf-bootstrap-splash"')));
  assert.match(boot,/lf-launch-monogram/);
  assert.match(boot,/lf-bootstrap-dots/);
  assert.doesNotMatch(boot,/<img|<strong|<small/);
  assert.doesNotMatch(html,/lfBootstrapBreathe/);
  assert.match(html,/@media \(prefers-reduced-motion: reduce\)[\s\S]*lf-bootstrap-dots i[^}]*animation:\s*none/);
});
test('entry focus uses its own contrasting token after the shared stylesheet',()=>{
  assert.match(read('styles/lorefy-auth-flow.css'),/html \.lf-auth :is\(button,input\):focus-visible\s*\{[^}]*outline:\s*2px solid var\(--auth-action\)\s*!important/);
});
