const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');
const file='styles/lorefy-profile-apple.css';

test('profile polish is loaded and cached before the named cinema layers',()=>{
 const html=read('index.html'),sw=read('sw.js'),asset=file+'?v=20261027-profile-colors-v1';
 assert.ok(html.includes(asset));assert.ok(sw.includes(asset));
 assert.ok(html.indexOf(asset)<html.indexOf('styles/lorefy-home-cinema.css'));
});

test('every shared polish rule covers all three original profile layouts',()=>{
 const css=read(file),rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
 assert.ok(rules.length>10);
 for(const [,selector]of rules){assert.ok(selector.includes(":is([data-profile-layout='normal'],[data-profile-layout='immersive'],[data-profile-layout='reader'])"),selector);}
});

test('polish leaves original artwork, frame anchors and section layout untouched',()=>{
 const css=read(file);
 assert.doesNotMatch(css,/(?:^|[;{])\s*(?:position|top|bottom|left|right|inset(?:-[\w-]+)?|transform|order|grid-area|grid-template[^:]*)\s*:/m);
 for(const [,selector,body]of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  if(/\.(?:lf-profile-avatar|lf-reader-avatar|lf-profile-banner|lf-reader-banner)/.test(selector)&&!/(?:button|svg|:hover)/.test(selector))assert.doesNotMatch(body,/(?:^|;)\s*(?:width|height|filter|object-fit|object-position|mask-image|display)\s*:/);
 }
 assert.doesNotMatch(css,/url\(|content\s*:/);
});

test('normal typography uses system fonts and zero tracking without hiding useful labels',()=>{
 const css=read(file);assert.match(css,/-apple-system/);assert.match(css,/letter-spacing:\s*0/);assert.match(css,/font-variant-numeric:\s*tabular-nums/);
 assert.match(css,/overflow-wrap:\s*(?:anywhere|break-word)/);assert.doesNotMatch(css,/font-size:\s*[\d.]+vw/);
 assert.doesNotMatch(css,/display:\s*none/);
});

test('profile materials keep owner colors and accessible interaction states',()=>{
 const css=read(file);
 for(const token of ['--ui-ink','--ui-muted','--ui-line','--ui-surface','--ui-selected','--ui-action'])assert.ok(css.includes(token));
 assert.doesNotMatch(css,/--ui-[\w-]+\s*:/);
 for(const state of [':focus-visible',':active',':disabled','[aria-selected=\'true\']'])assert.ok(css.includes(state));
 assert.match(css,/prefers-reduced-transparency/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/@supports/);
});

test('the four-book public preview sizes its wooden board from its own container, not seven book widths',()=>{
 const css=read(file);assert.match(css,/\.lf-reader-library-preview \.lf-reader-library-grid\.is-spine-view\s*\{[^}]*container-type:\s*inline-size/);
 assert.match(css,/\.lf-reader-library-preview \.lf-library-card::before\s*\{[^}]*width:\s*calc\(100cqw \+ 40px\)/);
});

test('browsers without color mixing keep opaque owner-theme materials',()=>{
 const css=read(file);assert.match(css,/--profile-apple-glass:\s*var\(--ui-surface\)/);assert.match(css,/--profile-apple-edge:\s*var\(--ui-line\)/);
 assert.match(css,/@supports\s*\(background:color-mix/);
});

test('Reader and Panoramic receive shared polish without a forced saved-layout change',()=>{
 const css=read(file),scopes=css.match(/:is\(\[data-profile-layout='normal'\],\[data-profile-layout='immersive'\],\[data-profile-layout='reader'\]\)/g)||[];
 assert.ok(scopes.length>20,'all shared detail rules must include every original layout');
 assert.match(css,/lf-reader-layout-tools button/);
});

test('glass chrome has a visible material layer and readable statistics rather than a font-only change',()=>{
 const css=read(file);assert.match(css,/--profile-apple-sheen:/);assert.match(css,/background:\s*var\(--profile-apple-sheen\),var\(--profile-apple-glass\)/);
 assert.match(css,/\.lf-profile-reading-metrics[^{}]*\{[^}]*font-size:\s*20px/);
 assert.match(css,/\.lf-profile-section-tabs\s*\{[^}]*padding:\s*4px/);
});
