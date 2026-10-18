const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const source=html.slice(html.indexOf('function installImageResilience(){'),html.indexOf('function mountApp(){'));
function harness({picker=false,lazy=false,alreadyFailed=false}={}) {
  const timers=new Map(),timerHistory=[],frames=[],observed=new Set();let observer,intersection,id=0;
  function image() {
    const attrs={src:'https://example.invalid/first.jpg',srcset:''},listeners=new Map(),once=new Set();
    const img={tagName:'IMG',nodeType:1,isConnected:true,dataset:{},style:{},loading:lazy?'lazy':'eager',complete:alreadyFailed,naturalWidth:0,alt:'Cover',className:'cover',dispatched:[],
      get src(){return attrs.src;},set src(v){attrs.src=v;this.complete=false;this.naturalWidth=0;},
      getAttribute:n=>attrs[n]||'',setAttribute(n,v){attrs[n]=String(v);},hasAttribute:n=>n==='data-cover-picker-image'&&picker||!!attrs[n],
      removeAttribute(n){delete attrs[n];},closest(){return null;},querySelectorAll(){return[];},
      addEventListener(n,fn,options){if(!listeners.has(n))listeners.set(n,new Set());listeners.get(n).add(fn);if(options?.once)once.add(fn);},removeEventListener(n,fn){listeners.get(n)?.delete(fn);once.delete(fn);},
      dispatchEvent(e){this.dispatched.push(e.type);for(const f of [...listeners.get(e.type)||[]]){if(once.has(f)){listeners.get(e.type).delete(f);once.delete(f);}f(e);}},listeners,
      getBoundingClientRect(){throw Error('No synchronous layout');}};
    return img;
  }
  const img=image(),win={IntersectionObserver:true,setTimeout(fn){const timer=++id;timers.set(timer,fn);timerHistory.push(fn);return timer;},clearTimeout:timer=>timers.delete(timer),requestAnimationFrame:fn=>frames.push(fn)};
  vm.runInNewContext(source+'installImageResilience();',{window:win,document:{documentElement:{},querySelectorAll:()=>[img]},Set,Event,encodeURIComponent,
    IntersectionObserver:class{constructor(fn){intersection=fn;}observe(i){observed.add(i);}unobserve(i){observed.delete(i);}},MutationObserver:class{constructor(fn){observer=fn;}observe(){}}});
  function mutate(attribute='src'){observer([{type:'attributes',attributeName:attribute,target:img}]);while(frames.length)frames.shift()();}
  function setSource(src){img.src=src;mutate();}
  return{img,image,timers,timerHistory,observed,mutate,setSource,
    error(){img.complete=true;img.naturalWidth=0;img.dispatchEvent(new Event('error'));},
    load(){img.complete=true;img.naturalWidth=300;img.dispatchEvent(new Event('load'));},
    expire(){const pending=[...timers.entries()];timers.clear();pending.forEach(([,fn])=>fn());},
    intersect(){intersection([{target:img,isIntersecting:true}]);},
    remove(){img.isConnected=false;observer([{type:'childList',addedNodes:[],removedNodes:[img]}]);while(frames.length)frames.shift()();}};
}
test('a deadline from an older source cannot replace a newly loading source',()=>{
  const h=harness(),old=h.timerHistory[0];h.setSource('https://example.invalid/second.jpg');old();
  assert.equal(h.img.src,'https://example.invalid/second.jpg');assert.equal(h.timers.size,1);
  h.expire();assert.match(h.img.src,/^data:image/);
});
test('the second source still receives an error fallback after the first has loaded',()=>{
  const h=harness();h.load();h.setSource('https://example.invalid/second.jpg');h.error();assert.match(h.img.src,/^data:image/);
});
test('a failed source can be retried and fail safely a second time',()=>{
  const h=harness();h.error();assert.match(h.img.src,/^data:image/);
  h.setSource('https://example.invalid/retry.jpg');assert.notEqual(h.img.dataset.lorefyFallbackApplied,'1');
  h.error();assert.match(h.img.src,/^data:image/);
});
test('an old error callback cannot act on a newer source',()=>{
  const h=harness(),old=[...h.img.listeners.get('error')][0];h.setSource('https://example.invalid/second.jpg');old();assert.equal(h.img.src,'https://example.invalid/second.jpg');
});
test('successful image load releases its deadline and failure listeners',()=>{
  const h=harness();h.load();assert.equal(h.timers.size,0);assert.equal(h.img.listeners.get('error')?.size||0,0);
});
test('removed images release observations and deadlines; queued callbacks are inert',()=>{
  const h=harness(),old=h.timerHistory[0];h.remove();assert.equal(h.timers.size,0);old();assert.match(h.img.src,/first\.jpg$/);
  const lazy=harness({lazy:true});lazy.remove();assert.equal(lazy.observed.size,0);
});
test('cover picker timeouts emit errors once and never install a selectable generated cover',()=>{
  const h=harness({picker:true}),old=h.timerHistory[0];h.expire();old();assert.deepEqual(h.img.dispatched,['error']);assert.match(h.img.src,/^https:/);
  h.setSource('https://example.invalid/next-choice.jpg');h.expire();assert.deepEqual(h.img.dispatched,['error','error']);assert.match(h.img.src,/^https:/);
});
test('an explicit retry of the same URL starts a new deadline after success',()=>{
  const h=harness();h.load();h.setSource('https://example.invalid/first.jpg');assert.equal(h.timers.size,1);h.expire();assert.match(h.img.src,/^data:image/);
});
test('srcset changes supersede the old deadline and can independently fail',()=>{
  const h=harness(),old=h.timerHistory[0];h.img.setAttribute('srcset','https://example.invalid/retina.jpg 2x');h.mutate('srcset');old();assert.match(h.img.src,/first\.jpg$/);
  h.error();assert.match(h.img.src,/^data:image/);assert.equal(h.img.getAttribute('srcset'),'');
});
test('replacing a remote source by local media cancels obsolete fallback work',()=>{
  const h=harness(),old=h.timerHistory[0];h.setSource('data:image/png;base64,local');old();assert.equal(h.img.src,'data:image/png;base64,local');assert.equal(h.timers.size,0);
});
test('a new source uses its current explicit fallback',()=>{
  const h=harness();h.error();h.img.setAttribute('data-fallback','data:image/svg+xml,new-placeholder');h.setSource('https://example.invalid/second.jpg');h.error();assert.equal(h.img.src,'data:image/svg+xml,new-placeholder');
});
test('each lazy source waits for visibility before its timeout is armed',()=>{
  const h=harness({lazy:true});assert.equal(h.timers.size,0);h.intersect();assert.equal(h.timers.size,1);
  h.setSource('https://example.invalid/second.jpg');assert.equal(h.timers.size,0);assert.ok(h.observed.has(h.img));h.intersect();assert.equal(h.timers.size,1);
});
test('clearing a remote source releases the previous request immediately',()=>{
  const h=harness(),old=h.timerHistory[0];h.setSource('');assert.equal(h.timers.size,0);old();assert.equal(h.img.src,'');
});
test('non-image source mutations never receive image fallbacks or deadlines',()=>{
  const h=harness();h.load();h.img.tagName='SOURCE';h.setSource('https://example.invalid/movie.mp4');
  assert.equal(h.timers.size,0);h.expire();assert.match(h.img.src,/movie\.mp4$/);
});
test('a native picker error cancels its deadline without dispatching a second error',()=>{
  const h=harness({picker:true});h.error();assert.equal(h.timers.size,0);h.expire();assert.deepEqual(h.img.dispatched,['error']);assert.match(h.img.src,/^https:/);
});
test('an error before the observer frame keeps a bounded fallback without replacing queued native events',()=>{
  const h=harness({alreadyFailed:true});assert.match(h.img.src,/^https:/);assert.equal(h.timers.size,1);h.expire();assert.match(h.img.src,/^data:image/);assert.equal(h.timers.size,0);
});
test('an already failed picker is not notified a second time by the observer',()=>{
  const h=harness({picker:true,alreadyFailed:true});assert.equal(h.timers.size,0);assert.deepEqual(h.img.dispatched,[]);assert.match(h.img.src,/^https:/);
});
