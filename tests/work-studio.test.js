const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const studio=require('../modules/lorefy-work-panels.js');
global.LorefyI18n=require('../modules/lorefy-i18n');
function nodes(n){return n&&typeof n==='object'?[n,...(n.children||[]).flatMap(nodes)]:[];}
function render(props={}){const events=[];global.React={createElement:(tag,props,...children)=>({tag,props:props||{},children:children.flat(Infinity).filter(x=>x!==null&&x!==false&&x!==undefined)}),useRef:v=>({current:v}),useEffect(){},useState:v=>[v,()=>{}]};global.NenIcons={BookOpen:'BookOpen',Check:'Check',X:'X',Trash2:'Trash2'};
 const p={work:{id:'work',title:'Actual work',type:'Manga'},cover:'cover.jpg',language:'en',choices:['reading','done','wish','paused','dropped'],status:'reading',progress:{chapter:12},trackProgress:true,isText:false,total:100,inLibrary:true,isCurrent:()=>true,onSelect:v=>events.push(['status',v]),onProgress:(k,v)=>events.push([k,v]),onSave:()=>events.push(['save']),onRemove:()=>events.push(['confirm-remove']),onClose:()=>events.push(['close']),...props};return{all:nodes(studio.Status(p)),p,events};}
test('reading studio keeps canonical stored values and has a real controlled radio group',()=>{
 const {all,events}=render(),choices=all.filter(n=>n.props.role==='radio');assert.equal(choices.length,5);assert.equal(choices.filter(n=>n.props['aria-checked']).length,1);
 choices[2].props.onClick();assert.deepEqual(events,[['status','wish']]);assert.ok(all.some(n=>n.props.role==='radiogroup'));
});
test('reading studio retains chapter/page/volume/note callbacks and existing save without direct storage writes',()=>{
 const {all,events}=render();const chapter=all.find(n=>n.props['data-progress-field']==='chapter');chapter.props.onChange({target:{value:'28'}});
 all.find(n=>n.props.className==='lf-studio-primary').props.onClick();assert.deepEqual(events,[['chapter','28'],['save']]);
 const src=fs.readFileSync('modules/lorefy-work-panels.js','utf8');assert.doesNotMatch(src,/localStorage\.setItem|fetch\(/);
});
test('reading studio separates destructive confirmation from save and protects obsolete callbacks',()=>{
 const {all,events}=render();all.find(n=>n.props.className==='lf-studio-destructive').props.onClick();assert.deepEqual(events,[['confirm-remove']]);
 const stale=render({isCurrent:()=>false});stale.all.find(n=>n.props.role==='radio').props.onClick();stale.all.find(n=>n.props.className==='lf-studio-primary').props.onClick();assert.deepEqual(stale.events,[]);
});
test('book progress uses pages and volume without inventing chapter fields',()=>{
 const {all}=render({isText:true,language:'ar'});assert.ok(all.some(n=>n.props['data-progress-field']==='page'));assert.ok(!all.some(n=>n.props['data-progress-field']==='chapter'));
});
test('reading studio has distinct responsive composition and destructive styling',()=>{
 const css=fs.readFileSync('styles/lorefy-work-studio.css','utf8');assert.match(css,/lf-status-choices/);assert.match(css,/lf-studio-work/);assert.match(css,/\.lf-studio-destructive\{[^}]*color:#ff969c/);assert.match(css,/max-height/);
});
test('review studio has three views, one writing field and guarded quarter-step controls',()=>{
 const vm=require('node:vm');render();const sandbox={React:global.React,NenIcons:global.NenIcons};vm.runInNewContext(fs.readFileSync('modules/lorefy-review-editor.js','utf8'),sandbox);
 const events=[],tree=sandbox.LorefyReviewComposer({work:{id:'w',title:'Actual'},language:'en',rating:3.5,ratings:{},fields:[],textRef:{current:''},momentRef:{current:''},icons:{},images:[],onRating:n=>events.push(n),isCurrent:()=>true});
 const all=nodes(tree);assert.equal(all.filter(n=>n.props['data-review-view']).length,3);assert.equal(all.filter(n=>n.props.id==='lf-rating-text').length,1);
 all.find(n=>n.props['aria-label']==='Increase rating').props.onClick();all.find(n=>n.props['aria-label']==='Decrease rating').props.onClick();assert.deepEqual(events,[3.75,3.25]);
});
test('character studio uses an actual portrait gallery while retaining source search and rating controls',()=>{
 const css=fs.readFileSync('styles/lorefy-work-studio.css','utf8'),src=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
 assert.match(src,/page\.classList\.add\("lf-character-studio"\)/);assert.match(css,/\.lf-character-studio \.lf-character-page-list\{[^}]*grid-template-columns:repeat\(2/);
 assert.match(src,/Character rating out of 5/);assert.match(src,/searchInput\.value/);
});
test('cover choices preserve real URLs, deduplicate without mutation and include the current cover',()=>{
 const input=[{img:'a.jpg',label:'A'},{img:'a.jpg',label:'Duplicate'},{img:'b.jpg',label:'B'}],before=JSON.stringify(input);
 assert.deepEqual(studio.coverChoices(input,'c.jpg','Current').map(x=>x.img),['c.jpg','a.jpg','b.jpg']);assert.equal(JSON.stringify(input),before);
});
test('cover studio uses preview/apply and explicit failed-image state rather than a blank selectable cover',()=>{
 const src=fs.readFileSync('modules/lorefy-work-panels.js','utf8');assert.match(src,/function Cover\(/);assert.match(src,/function CoverTile\(/);assert.match(src,/data-cover-state/);assert.match(src,/setState\('error'\)/);assert.match(src,/p\.onApply\(value\)/);assert.match(src,/lf-cover-studio-preview/);
});
test('work overflow is a named action palette with the existing keyboard menu contract',()=>{
 const src=fs.readFileSync('modules/lorefy-chapter-detail.js','utf8'),css=fs.readFileSync('styles/lorefy-work-studio.css','utf8');assert.match(src,/lf-work-palette-title/);assert.match(src,/setAttribute\('role', 'menu'\)/);assert.match(css,/\.lf-chapter-more-menu\{[^}]*grid-template-columns:repeat\(2/);
});

test('overflow placement stays inside the visible host when space below the toolbar runs out',()=>{
 const src=fs.readFileSync('modules/lorefy-chapter-detail.js','utf8'),vm=require('node:vm');
 const match=src.match(/function workMenuShift\(rect, top, bottom\)\s*\{[^}]+\}/);assert.ok(match);
 const scope={};vm.runInNewContext(match[0],scope);
 assert.equal(scope.workMenuShift({top:646,bottom:861},12,831),-30);
 assert.equal(scope.workMenuShift({top:-5,bottom:210},12,831),17);
 assert.equal(scope.workMenuShift({top:200,bottom:415},12,831),0);
});

function coverHarness(onApply){
 render();let cursor=0,slots=[],owner=true,closed=0;
 global.React.useState=initial=>{const at=cursor++;if(!(at in slots))slots[at]=initial;return[slots[at],v=>{slots[at]=typeof v==='function'?v(slots[at]):v;}];};
 global.React.useRef=initial=>{const at=cursor++;return slots[at]||(slots[at]={current:initial});};
 const props={work:{id:'w',title:'Actual',type:'Manga'},cover:'a.jpg',language:'en',options:[{img:'a.jpg',label:'A'},{img:'b.jpg',label:'B'}],onApply,isCurrent:()=>owner,onClose:()=>closed++,onUpload:()=>{}};
 function tree(){cursor=0;return nodes(studio.Cover(props));}
 function tile(src){return tree().find(n=>typeof n.tag==='function'&&n.props.src===src);}
 return{tree,tile,primary:()=>tree().find(n=>n.props.className==='lf-studio-primary'),closeCount:()=>closed,expire:()=>{owner=false;}};
}

test('cover selection is only a preview until apply; pending saves reject double taps',async()=>{
 let finish,calls=[];const h=coverHarness(value=>{calls.push(value);return new Promise(resolve=>{finish=resolve;});});
 h.tile('b.jpg').props.onReady('b.jpg');h.tile('b.jpg').props.onSelect('b.jpg');assert.deepEqual(calls,[]);assert.equal(h.primary().props.disabled,false);
 h.primary().props.onClick();h.primary().props.onClick();assert.deepEqual(calls,['b.jpg']);assert.equal(h.primary().props.disabled,true);
 finish(true);await Promise.resolve();assert.equal(h.closeCount(),1);
});

test('failed cover save preserves selection for retry and obsolete completion cannot close another panel',async()=>{
 const h=coverHarness(async()=>false);h.tile('b.jpg').props.onReady('b.jpg');h.tile('b.jpg').props.onSelect('b.jpg');h.primary().props.onClick();await Promise.resolve();
 assert.equal(h.closeCount(),0);assert.equal(h.tile('b.jpg').props.selected,true);assert.ok(h.tree().some(n=>n.props.role==='alert'));assert.equal(h.primary().props.disabled,false);
 let finish;const stale=coverHarness(()=>new Promise(resolve=>{finish=resolve;}));stale.tile('b.jpg').props.onReady('b.jpg');stale.tile('b.jpg').props.onSelect('b.jpg');stale.primary().props.onClick();stale.expire();finish(true);await Promise.resolve();assert.equal(stale.closeCount(),0);
});

test('an image that recovers after failure becomes selectable and savable again',()=>{
 const h=coverHarness(async()=>true);h.tile('b.jpg').props.onFailed('b.jpg');h.tile('b.jpg').props.onSelect('b.jpg');assert.equal(h.primary().props.disabled,true);
 h.tile('b.jpg').props.onReady('b.jpg');assert.equal(h.primary().props.disabled,false);
});

test('cover-owned loading states opt out of generic replacement artwork',()=>{
 const h=coverHarness(async()=>true),preview=h.tree().find(n=>n.tag==='img'&&n.props.src==='a.jpg');assert.equal(preview.props['data-cover-picker-image'],'1');
 const tile=h.tile('a.jpg');const image=nodes(tile.tag(tile.props)).find(n=>n.tag==='img');assert.equal(image.props['data-cover-picker-image'],'1');
});
