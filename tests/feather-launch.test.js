const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
test('first paint uses a feather signature with no square icon, monogram, dots or loading copy',()=>{
  const start=html.indexOf('class="lf-bootstrap-splash"');
  const boot=html.slice(start,html.indexOf('id="island"',start));
  assert.match(boot,/lf-launch-feather/);
  assert.match(boot,/lf-launch-wordmark[^>]*>Lorefy</);
  assert.match(boot,/<svg[^>]+aria-hidden="true"/);
  assert.doesNotMatch(boot,/lf-launch-monogram|lf-bootstrap-dots|<img|<small|تجهيز مكتبتك/);
});
test('feather reveals before a finite left-to-right wordmark write',()=>{
  assert.match(html,/@keyframes lfLaunchFeather/);
  assert.match(html,/@keyframes lfLaunchWrite/);
  assert.match(html,/\.lf-launch-wordmark\s*\{[^}]*direction:ltr/);
  assert.match(html,/animation:lfLaunchWrite 1600ms/);
  assert.match(html,/35%\{[^}]*animation-timing-function:linear/);
  const boot=html.slice(html.indexOf('.lf-bootstrap-splash'),html.indexOf('/* Dynamic Island */'));
  assert.doesNotMatch(boot,/infinite|filter:|box-shadow:|setTimeout/);
});
test('reduced motion shows the complete mark immediately without clipping or displacement',()=>{
  const css=html.slice(html.indexOf('@media (prefers-reduced-motion: reduce)'),html.indexOf('/* Dynamic Island */'));
  assert.match(css,/animation:none !important/);
  assert.match(css,/clip-path:none/);
  assert.match(css,/stroke-dashoffset:0/);
  assert.match(css,/opacity:1/);
});
test('startup renderer remains immediate and never waits for the brand animation',()=>{
  const render=html.slice(html.indexOf('function renderSurface('),html.indexOf('/* Keep remote artwork'));
  assert.match(render,/root.render\(/);
  assert.doesNotMatch(render,/setTimeout|animationend|await|Promise/);
});
