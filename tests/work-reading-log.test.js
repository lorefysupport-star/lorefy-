const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-review-editor.js','utf8');
function harness(language='en',reviews=[],extra={}){
 const root={LorefyBackend:{user:{id:'owner'}},React:{createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useState:value=>[value,()=>{}],useRef:()=>({current:null}),useEffect(){}},NenIcons:{Feather:'feather'}};
 vm.runInNewContext(source,root);
 const tree=root.LorefyWorkIdentity({work:{id:'work',title:'Original title',type:'مانجا'},rating:4.7,ratingSource:'MAL',language,reviews,...extra});
 return{root,tree};
}
function all(node){return node&&typeof node==='object'?[node,...(node.children||[]).flatMap(all)]:[];}
function text(node){return node&&typeof node==='object'?(node.children||[]).map(text).join(' '):String(node??'');}
test('personal rating uses only the latest opening owner review for the current work',()=>{
 const {root}=harness();assert.equal(typeof root.LorefyPersonalWorkRating,'function');
 const rows=[{mid:'work',userId:'other',r:5,ts:30},{mid:'work',userId:'me',r:2,ts:10},{mid:'work',userId:'owner',r:0,recVal:'no',ts:20},{mid:'else',userId:'me',r:4,ts:40}];
 const result=root.LorefyPersonalWorkRating(rows,'work','owner');assert.equal(result.rating,0);assert.equal(result.disliked,true);
 assert.equal(root.LorefyPersonalWorkRating(rows,'work','new-owner').rating,2);
 assert.equal(root.LorefyPersonalWorkRating([{mid:'work',userId:'other',r:5}],'work','owner'),null);
 assert.equal(root.LorefyPersonalWorkRating([{mid:'work',userId:'me',r:0}],'work','owner'),null);
});
test('work log separates personal score from source score without adding a second action store',()=>{
 for(const language of ['ar','en']){
  const {tree}=harness(language,[{mid:'work',userId:'me',r:3.25}]),nodes=all(tree);
  const log=nodes.find(n=>n.props.className==='lf-work-log');assert.ok(log);
  assert.match(text(log),/3\.25/);assert.ok(log.children.some(n=>n?.props?.className==='lf-work-action-slot'));
  assert.match(text(nodes.find(n=>n.props.className==='lf-work-rating')),/MAL/);
  const tabs=nodes.filter(n=>n.props.role==='tab');assert.equal(tabs.length,3);assert.equal(tabs[0].props['data-work-tab'],'story');
  assert.match(text(tabs[0]),language==='en'?/Overview/:/نظرة عامة/);
 }
});
test('unrated and deliberate zero have different personal labels',()=>{
 for(const language of ['ar','en']){
  let nodes=all(harness(language).tree),score=nodes.find(n=>n.props.className==='lf-work-personal-rating');
  assert.match(text(score),language==='en'?/Not rated/:/لم تقيّم/);
  nodes=all(harness(language,[{mid:'work',userId:'me',r:0,recVal:'no'}]).tree);score=nodes.find(n=>n.props.className==='lf-work-personal-rating');
  assert.match(text(score),/0\.00/);assert.match(text(score),language==='en'?/Dislike/:/عدم إعجاب/);
 }
});
test('work composition has a responsive log column and visible secondary action names',()=>{
 const css=fs.readFileSync('styles/lorefy-work-cinema.css','utf8');
 assert.match(css,/\.lf-work-log\{/);assert.match(css,/\.lf-work-log-heading/);
 assert.match(css,/\.lf-work-log[\s\S]*minmax\(240px,300px\)/);
 assert.match(css,/@media\(max-width:359px\)[\s\S]*lf-chapter-quick-cover\)\{padding:6px!important;gap:4px!important;font-size:12px!important/);
 assert.doesNotMatch(css,/\.lf-detail-page :is\(\.lf-chapter-quick-characters,\.lf-chapter-quick-cover\)>span\{position:absolute!important;width:1px/);
 assert.match(css,/nav\.lf-work-section-nav\{[^}]*background:transparent!important/);
 assert.match(css,/lf-work-log-heading\{[^}]*margin-bottom:16px!important/);
 assert.match(css,/lf-chapter-quick-actions>button\{backdrop-filter:none!important/);
});
test('saved reading checkpoint belongs inside the log and unknown totals do not invent a percentage',()=>{
 const nodes=all(harness('en',[],{readingStatus:'Reading',readingProgress:'Chapter 12',readingKnown:true,readingPercent:30}).tree);
 const checkpoint=nodes.find(n=>n.props.className==='lf-work-log-checkpoint');assert.ok(checkpoint);assert.match(text(checkpoint),/Reading progress.*Chapter 12/);
 assert.equal(all(checkpoint).find(n=>n.type==='progress').props.value,30);
 const unknown=all(harness('en',[],{readingStatus:'Reading',readingProgress:'Chapter 12',readingKnown:false,readingPercent:0}).tree);
 assert.equal(unknown.filter(n=>n.type==='progress').length,0);
});

test('work hierarchy keeps creator with title, then groups public metrics',()=>{
 const {tree}=harness('en',[],{creator:'Creator'}),nodes=all(tree),copy=nodes.find(n=>n.props.className==='lf-work-copy');
 const creator=copy.children.findIndex(n=>n?.props?.className==='lf-work-creator');
 const metrics=copy.children.findIndex(n=>n?.props?.className==='lf-work-public-metrics');
 assert.ok(creator>=0&&metrics>creator);assert.ok(all(copy.children[metrics]).some(n=>n.props.className==='lf-work-rating'));
});

test('reading actions precede a single progress summary, without repeated reading state',()=>{
 for(const language of ['ar','en']){
  const nodes=all(harness(language,[],{readingStatus:'Completed',readingProgress:'Chapter 12'}).tree);
  const log=nodes.find(n=>n.props.className==='lf-work-log'),slot=log.children.findIndex(n=>n?.props?.className==='lf-work-action-slot');
  const progress=log.children.findIndex(n=>n?.props?.className==='lf-work-log-checkpoint');
  assert.ok(progress>slot);assert.ok(!text(log.children[progress]).includes('Completed'));
 }
});
