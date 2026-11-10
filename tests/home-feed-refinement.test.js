const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const home=require('../modules/lorefy-home-cinema.js');
global.LorefyLibraryCinema=require('../modules/lorefy-library-cinema.js');
global.NenIcons={BookOpen:'BookOpen'};
global.React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat().filter(x=>x!=null&&x!==false)}),useState:v=>[v,()=>{}],useRef:v=>({current:v}),useLayoutEffect(){}};
const walk=n=>[n,...(n.children||[]).filter(x=>typeof x==='object').flatMap(walk)];
function render(work,progress,percent=25){return walk(home.Resume({works:[work],language:'en',cover:()=>'',fallback:()=>'',progressFor:()=>progress,summary:()=> 'Saved checkpoint',percent:()=>percent}));}
test('Home shows the saved unit and its real total beside a bounded progress label',()=>{
 const nodes=render({id:'book',title:'Book',pages:400},{page:100});
 assert.ok(nodes.some(n=>n.children.includes('100 / 400 pages')));
 assert.ok(nodes.some(n=>n.props.className==='lf-cinema-progress-label'&&n.children.includes('25%')));
});
test('an unrelated known total cannot imply progress for the saved unit',()=>{
 const nodes=render({id:'book',title:'Book',ch:100},{page:80});
 assert.ok(nodes.some(n=>n.children.includes('Saved checkpoint')));
 assert.ok(!nodes.some(n=>n.props.role==='progressbar'||n.props.className==='lf-cinema-progress-label'));
});
for(const [work,progress,expected] of [
 [{id:'book',pages:400},{page:100},25],
 [{id:'manga',ch:200},{chapter:50},25],
 [{id:'volumes',vol:20},{volume:4},20]
])test('Home percentage follows the same saved unit as its checkpoint for '+work.id,()=>{
 const nodes=render(work,progress,0),meter=nodes.find(n=>n.props.role==='progressbar');
 assert.equal(meter.props['aria-valuenow'],expected);
});
test('Home feed refinement keeps headers in flow and touch actions at 44px',()=>{
 const css=fs.readFileSync('styles/lorefy-home-immersive.css','utf8');
 assert.match(css,/\.lf-community-review-body\s*\{[^}]*display:grid/);
 assert.match(css,/\.lf-cinema-review-score\s*\{[^}]*position:static/);
 assert.match(css,/\.lf-community-action-row button\s*\{[^}]*min-width:44px/);
 assert.doesNotMatch(css,/data-home-chrome='scrolled'[^{}]*lf-social-header\s*\{[^}]*height:/);
 assert.match(css,/\.lf-home-cinema\s*\{[^}]*overflow-anchor:none/,'material changes must not move the reading position');
});

test('post actions keep Home order in threads and public-profile posts in both directions',()=>{
 const css=fs.readFileSync('styles/lorefy-community.css','utf8');
 assert.match(css,/\.lf-community-post-actions\s*\{[^}]*display:\s*grid;\s*grid-template-columns:\s*repeat\(5,minmax\(0,1fr\)\);\s*direction:\s*ltr;/s);
 for(const [selector,order] of [['.lf-community-post-like',0],['.lf-community-post-replies',1],['.lf-community-post-dislike',2],['button:nth-child(4)',3],['button:nth-child(5)',4]]) {
  assert.ok(css.includes(`.lf-community-post-actions ${selector} { order: ${order}; }`),selector);
 }
});
