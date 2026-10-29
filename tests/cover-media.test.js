const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const file='modules/lorefy-cover-media.js';
function harness(props={}){
 assert.ok(fs.existsSync(file),'managed cover module exists');
 const slots=[],effects=[],pending=[],timers=new Map(),images=new Map(),intersections=[];let cursor=0,seq=0,tree,outer;
 const h=(type,props,...children)=>({type,props:props||{},children:children.flat().filter(v=>v!==false&&v!=null)});
 const root={React:{createElement:h,useState(value){const i=cursor++;if(!(i in slots))slots[i]=typeof value==='function'?value():value;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(value){const i=cursor++;if(!(i in slots))slots[i]={current:value};return slots[i];},useEffect(fn,deps){const i=cursor++,old=effects[i];if(!old||deps.some((d,n)=>d!==old.deps[n]))pending.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()};});}},
  NenIcons:{BookOpen:'BookOpen',RotateCw:'RotateCw'},setTimeout(fn){const i=++seq;timers.set(i,fn);return i;},clearTimeout(i){timers.delete(i);},
  IntersectionObserver:class{constructor(fn){this.fn=fn;this.nodes=new Set();intersections.push(this);}observe(n){this.nodes.add(n);}disconnect(){this.nodes.clear();}}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),{window:root});
 const walk=n=>n&&typeof n==='object'?[n,...n.children.flatMap(walk)]:[];
 function render(){cursor=0;outer=root.LorefyCoverMedia({src:'https://example.invalid/cover.jpg',alt:'Original work',language:'en',...props});tree=typeof outer.type==='function'?outer.type(outer.props):outer;
  for(const node of walk(tree))if(node.type==='img'){
   const key=node.props.key??'image';let img=images.get(key);if(!img){const listeners={};img={complete:false,naturalWidth:0,isConnected:true,listeners,addEventListener(k,f){listeners[k]=f;},removeEventListener(k,f){if(listeners[k]===f)delete listeners[k];}};images.set(key,img);}node.props.ref.current=img;
  }
  while(pending.length)pending.shift()();return tree;
 }
 render();
 return{root,props,timers,images,intersections,render,nodes:()=>walk(tree),image:()=>[...images.values()].at(-1),
  error(){this.image().listeners.error?.();render();},load(){this.image().naturalWidth=100;this.image().complete=true;this.image().listeners.load?.();render();},
  expire(){const jobs=[...timers.values()];timers.clear();jobs.forEach(fn=>fn());render();},
  retry(){const n=walk(tree).find(n=>n.props.className==='lf-cover-retry');assert.ok(n,'visible retry control');n.props.onClick({preventDefault(){},stopPropagation(){}});render();},
  state(){return walk(tree).find(n=>n.props['data-cover-state'])?.props['data-cover-state'];},
  unmount(){effects.forEach(e=>e?.cleanup?.());}};
}
test('loading cover retains original URL and opts out of legacy generated fallbacks',()=>{
 const h=harness(),img=h.nodes().find(n=>n.type==='img');assert.equal(h.state(),'loading');assert.equal(img.props.src,'https://example.invalid/cover.jpg');assert.equal(img.props['data-lorefy-cover-managed'],'1');assert.equal(h.timers.size,1);
 assert.equal(img.props.onError,undefined);assert.equal(img.props['data-fallback'],undefined);
});

test('eager hero requests retain their explicit browser fetch priority',()=>{
 const h=harness({loading:'eager',fetchPriority:'high'}),img=h.nodes().find(n=>n.type==='img');assert.equal(img.props.fetchPriority,'high');assert.equal(img.props.loading,'eager');h.unmount();
});
test('error shows an honest state and does not substitute any generated image',()=>{
 const h=harness();h.error();assert.equal(h.state(),'error');assert.equal(h.timers.size,0);
 assert.equal(h.nodes().find(n=>n.type==='img').props.src,'https://example.invalid/cover.jpg');
 assert.ok(h.nodes().some(n=>n.props['aria-label']==='Retry cover'));
});
test('explicit retry starts one new request and repeated taps while loading do not retry',()=>{
 const h=harness();h.error();const retry=h.nodes().find(n=>n.props.className==='lf-cover-retry').props.onClick;h.retry();assert.equal(h.state(),'loading');assert.equal(h.images.size,2);assert.equal(h.timers.size,1);
 retry({preventDefault(){},stopPropagation(){}});h.render();assert.equal(h.images.size,2);h.load();assert.equal(h.state(),'ready');assert.equal(h.timers.size,0);
});
test('a visible timeout ends once without an automatic retry loop',()=>{
 const h=harness();h.expire();assert.equal(h.state(),'error');assert.equal(h.images.size,1);assert.equal(h.timers.size,0);h.expire();assert.equal(h.images.size,1);
});
test('late callbacks from the previous attempt cannot fail a retry',()=>{
 const h=harness(),old=h.image().listeners.error,deadline=[...h.timers.values()][0];h.error();h.retry();old();deadline();h.render();assert.equal(h.state(),'loading');h.load();assert.equal(h.state(),'ready');
});
test('successful cover ignores a late failure and releases its timer/listeners',()=>{
 const h=harness(),old=h.image().listeners.error;h.load();old();h.render();assert.equal(h.state(),'ready');assert.equal(h.timers.size,0);assert.equal(Object.keys(h.image().listeners).length,0);
});
test('unmount releases deadline and observation; queued callbacks become inert',()=>{
 const h=harness(),old=h.image().listeners.error;h.unmount();old();assert.equal(h.timers.size,0);assert.equal(Object.keys(h.image().listeners).length,0);
 const lazy=harness({loading:'lazy'});lazy.unmount();assert.ok(lazy.intersections.every(o=>o.nodes.size===0));
});
test('lazy images wait for intersection before the bounded timeout starts',()=>{
 const h=harness({loading:'lazy'});assert.equal(h.timers.size,0);assert.equal(h.intersections[0].nodes.size,1);
 h.intersections[0].fn([{isIntersecting:true}]);assert.equal(h.timers.size,1);h.expire();assert.equal(h.state(),'error');
});
test('missing and explicit generated fallback sources show a neutral unavailable surface without a request',()=>{
 for(const props of [{src:''},{src:'data:image/svg+xml,generated',fallback:'data:image/svg+xml,generated'}]){
  const h=harness(props);assert.equal(h.state(),'missing');assert.equal(h.nodes().filter(n=>n.type==='img').length,0);assert.equal(h.timers.size,0);assert.ok(!h.nodes().some(n=>n.props.className==='lf-cover-retry'));
 }
});
test('custom local images remain eligible rather than being treated as generated fallback artwork',()=>{
 const h=harness({src:'data:image/png;base64,user-cover',fallback:'data:image/svg+xml,generated'});assert.equal(h.state(),'loading');h.load();assert.equal(h.state(),'ready');
});
test('surface and retry can be placed as siblings so no native button is nested',()=>{
 const h=harness({render:(surface,retry)=>({type:'article',props:{},children:[{type:'button',props:{},children:[surface]},retry].filter(Boolean)})});h.error();
 const article=h.nodes().find(n=>n.type==='article');assert.equal(article.children[1].type,'button');assert.equal(article.children[0].children[0].type,'span');
});
test('Arabic copy and source identity are explicit, source changes remount a clean request',()=>{
 const h=harness({language:'ar'});h.error();assert.ok(h.nodes().some(n=>n.props['aria-label']==='إعادة تحميل الغلاف'));
 const a=h.root.LorefyCoverMedia({src:'first',workId:'a'}),b=h.root.LorefyCoverMedia({src:'second',workId:'a'});assert.notEqual(a.props.key,b.props.key);
});

test('review pictures have image-specific loading, missing and recovery copy in both languages',()=>{
 for(const language of ['ar','en']){
  const h=harness({language,kind:'image'});assert.ok(h.nodes().some(n=>n.props['aria-label']===(language==='en'?'Loading image':'جارٍ تحميل الصورة')));h.error();assert.ok(h.nodes().some(n=>n.props['aria-label']===(language==='en'?'Retry image':'إعادة تحميل الصورة')));h.unmount();
  const missing=harness({language,kind:'image',src:''});assert.ok(missing.nodes().some(n=>n.props['aria-label']===(language==='en'?'No image':'لا توجد صورة')));missing.unmount();
 }
});
test('Work and Explore cards opt in without changing hero art or picker behavior',()=>{
 const work=fs.readFileSync('modules/lorefy-review-editor.js','utf8'),explore=fs.readFileSync('modules/lorefy-explore-studio.js','utf8');
 assert.match(work,/root\.LorefyCoverMedia/);assert.match(explore,/root\.LorefyCoverMedia/);
 assert.match(explore,/renderCard\(surface, retry\)/);assert.match(explore,/function cover\(work, eager, featured\)/);
 const index=fs.readFileSync('index.html','utf8');assert.match(index,/data-lorefy-cover-managed/);
});
test('cover material reserves space, uses theme tokens and does not animate layout dimensions',()=>{
 assert.ok(fs.existsSync('styles/lorefy-cover-media.css'));
 const css=fs.readFileSync('styles/lorefy-cover-media.css','utf8');
 assert.match(css,/aspect-ratio:2\/3/);assert.match(css,/--ui-glass-fill/);assert.match(css,/--ui-glass-ink/);
 assert.match(css,/min-width:44px!important/);assert.match(css,/focus-visible/);
 assert.doesNotMatch(css,/animation:|transition:(?:width|height)/);
});
test('cover media is present before consumers with matching offline keys',()=>{
 const entry=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
 for(const file of ['modules/lorefy-cover-media.js','styles/lorefy-cover-media.css','modules/lorefy-review-editor.js','modules/lorefy-explore-studio.js','modules/lorefy-profile-sections.js']){
  const version=file==='styles/lorefy-cover-media.css'?'20261029-shelf-acceptance-v1':file==='modules/lorefy-profile-sections.js'?'20261029-profile-list-media-v1':file==='modules/lorefy-explore-studio.js'?'20261029-search-editions-v1':file==='modules/lorefy-review-editor.js'?'20261029-work-editor-media-v1':'20261029-category-board-v1';
  assert.ok(entry.includes(file+'?v='+version));
  assert.ok(sw.includes(file+'?v='+version));
 }
 assert.ok(entry.indexOf('modules/lorefy-cover-media.js')<entry.indexOf('modules/lorefy-review-editor.js'));
 assert.match(sw,/lorefy-v640-inbox-reconnect/);
});
