const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const home=require('../modules/lorefy-home-cinema.js');
function render(language='ar',works=[{id:1,title:'عنوان طويل للاختبار',ch:384},{id:2,title:'Second',ch:100}]){
 const events=[];global.React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat().filter(x=>x!=null&&x!==false)}),useState:v=>[v,value=>events.push(['select',value])],useRef:v=>({current:v}),useLayoutEffect(){}};
 global.NenIcons={BookOpen:'BookOpen'};global.LorefyLibraryCinema=null;
 const tree=home.Resume({language,works,progressFor:()=>({chapter:12}),percent:()=>3,cover:()=>'',fallback:()=>'',summary:work=>work.st?(language==='ar'?'12 فصل':'12 chapters'):(language==='ar'?'12 / 384 فصل':'12 / 384 chapters'),onOpen:w=>events.push(['open',w.id]),onLibrary:()=>events.push(['library'])});
 const walk=n=>[n,...(n.children||[]).filter(x=>typeof x==='object').flatMap(walk)];return {tree,nodes:walk(tree),events};
}
for(const language of ['ar','en'])test('Home checkpoint uses explicit isolated numeric order in '+language,()=>{
 const h=render(language),bdi=h.nodes.find(n=>n.type==='bdi'&&n.props.className==='lf-cinema-checkpoint');
 assert.ok(bdi);assert.equal(bdi.props.dir,'ltr');assert.ok(bdi.children[0].startsWith('12 / 384'));
});
test('current-reading options follow the resume content in normal document flow',()=>{
 const h=render(),content=h.tree.children.findIndex(n=>n.props?.className==='lf-cinema-resume-content'),switcher=h.tree.children.findIndex(n=>n.props?.className==='lf-cinema-reading-switch');
 assert(switcher>content);assert.ok(h.nodes.some(n=>n.props.className==='lf-cinema-reading-options'));
 assert.ok(h.nodes.some(n=>n.props.className==='lf-cinema-reading-label'&&n.children.includes('قراءاتك')));
});
for(const language of ['ar','en'])test('library action is explicit and does not open the current work in '+language,()=>{
 const h=render(language),button=h.nodes.find(n=>n.type==='button'&&n.props.className==='lf-cinema-library-link');
 assert.ok(button);assert(button.children.includes(language==='en'?'Library':'مكتبتي'));button.props.onClick();assert.deepEqual(h.events,[['library']]);
});
test('switching reading works is not opening or editing their saved progress',()=>{
 const h=render(),buttons=h.nodes.filter(n=>n.type==='button'&&n.props['aria-pressed']!=null);
 assert.equal(buttons.length,2);assert.equal(buttons[0].props['aria-pressed'],true);
 assert.equal(buttons[1].props.title,'Second');buttons[1].props.onClick();assert.deepEqual(h.events,[['select','2']]);
});
test('Home sticky material may change on scroll, but its height and title stay stable',()=>{
 const css=fs.readFileSync('styles/lorefy-home-immersive.css','utf8');
 assert.doesNotMatch(css,/data-home-chrome='scrolled'[^{}]*lf-social-header\s*\{[^}]*height:/);
 assert.doesNotMatch(css,/data-home-chrome='scrolled'[^{}]*lf-social-brand\s*\{[^}]*display:none/);
 assert.match(css,/\.lf-cinema-reading-switch\s*\{[^}]*position:static !important/);
});
for(const status of ['Publishing','ongoing','مستمرة','مستمر'])test('ongoing '+status+' shows the saved checkpoint, not a final completion meter',()=>{
 const h=render('en',[{id:'ongoing',title:'Ongoing',ch:420,st:status}]);
 assert.equal(h.nodes.some(n=>n.props.role==='progressbar'),false);
 assert(h.nodes.some(n=>n.props.className==='lf-cinema-checkpoint'&&n.children.includes('12 chapters')));
});
