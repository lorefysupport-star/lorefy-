const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const file = '../modules/lorefy-interface-continuity.js';

test('FLIP geometry uses transforms, rejects zero and invalid bounds', () => {
  const { flip } = require(file);
  assert.equal(flip({x:0,y:0,width:0,height:20},{x:20,y:40,width:80,height:120}), null);
  assert.equal(flip({x:NaN,y:0,width:40,height:60},{x:20,y:40,width:80,height:120}), null);
  assert.deepEqual(flip({x:10,y:20,width:40,height:60},{x:30,y:50,width:80,height:120}),
    {transform:'translate3d(-20px,-30px,0) scale(0.5,0.5)', transformOrigin:'0 0'});
});

function harness(reduced = false) {
  const pending = [], frames = [], cancelled = [];
  const env = { matchMedia:()=>({matches:reduced}), document:{hidden:false,documentElement:{getAttribute:()=>null}} };
  const node = {isConnected:true, animate(keys,options){
    const p = {}; p.finished = new Promise((resolve,reject)=>Object.assign(p,{resolve,reject}));
    p.cancel=()=>{cancelled.push(p);p.reject(new Error('cancelled'));};
    pending.push(p);frames.push({keys,options});return p;
  }};
  return {env,node,pending,frames,cancelled};
}

test('animation owns one finite effect per element and cancels interrupted work', async () => {
  const api = require(file), h=harness(), motion=api.animator(h.env);
  let cleaned=0;
  motion.play(h.node,[{opacity:0},{opacity:1}],180,()=>cleaned++);
  motion.play(h.node,[{opacity:.5},{opacity:1}],180,()=>cleaned++);
  assert.equal(h.cancelled.length,1);assert.equal(cleaned,1);
  h.pending[1].resolve();await Promise.resolve();
  assert.equal(cleaned,2);assert.equal(motion.size(),0);
  assert.equal(h.frames[0].options.fill,'none');
  assert.ok(h.frames.every(x=>x.options.duration<=280));
});

test('reduced motion, hidden pages and unavailable WAAPI finish without delaying actions', () => {
  const api=require(file),h=harness(true),motion=api.animator(h.env);let cleaned=0;
  motion.play(h.node,[],240,()=>cleaned++);
  assert.equal(h.frames.length,0);assert.equal(cleaned,1);
  const normal=harness(),m=api.animator(normal.env);normal.env.document.hidden=true;
  m.play(normal.node,[],200);assert.equal(normal.frames.length,0);
  normal.env.document.hidden=false;normal.node.animate=undefined;
  m.play(normal.node,[],200);assert.equal(m.size(),0);
});

test('cancellation releases every layer even if an old finished promise resolves later', async () => {
  const api=require(file),h=harness(),motion=api.animator(h.env);let cleaned=0;
  motion.play(h.node,[],240,()=>cleaned++);motion.clear();
  h.pending[0].resolve();await Promise.resolve();
  assert.equal(cleaned,1);assert.equal(motion.size(),0);
});

test('continuity is activation-scoped, never an idle observer or recurring list animation', () => {
  const src=fs.readFileSync(path.join(__dirname,file),'utf8');
  assert.match(src,/addEventListener\('click', activate, true\)/);
  assert.match(src,/addEventListener\('focusin', focusSearch, true\)/);
  assert.match(src,/observer\.disconnect\(\)/);
  assert.match(src,/650/);
  assert.doesNotMatch(src,/setInterval|preventDefault|stopPropagation|startViewTransition|fetch\(/);
  assert.match(src,/visibilitychange/);
  assert.match(src,/lorefy:motion-change/);
});

test('real activation window is finite, ignores disabled controls and tears down on auth changes', () => {
  const api=require(file),listeners={},attrs=new Map(),timers=new Map();let observed=0,disconnected=0;
  const screen={},app={},control={disabled:false,closest:s=>s==='.lf-app'?app:null,matches:()=>false,
    querySelector:()=>null,getAttribute:()=>null,getBoundingClientRect:()=>({x:0,y:0,width:44,height:44})};
  const target={closest:s=>s.startsWith('button,')?control:null,matches:()=>false};
  const doc={hidden:false,body:app,documentElement:{hasAttribute:k=>attrs.has(k),setAttribute:(k,v)=>attrs.set(k,v),getAttribute:k=>attrs.get(k)},
    querySelector:s=>s==='.nc-screen'?screen:s==='.lf-app'?app:null,querySelectorAll:()=>[],addEventListener:(k,fn)=>listeners[k]=fn};
  const env={document:doc,matchMedia:()=>({matches:false}),requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},
    addEventListener:(k,fn)=>listeners[k]=fn,setTimeout:(fn,delay)=>{timers.set(1,{fn,delay});return 1;},clearTimeout:id=>timers.delete(id),
    MutationObserver:class{observe(){observed++;}disconnect(){disconnected++;}}};
  const runtime=api.mount(env);
  assert.equal(observed,0,'idle pages must not be observed');
  control.disabled=true;listeners.click({target});assert.equal(observed,0);
  control.disabled=false;listeners.click({target});assert.equal(observed,1);assert.equal(runtime.watching(),true);
  assert.equal(timers.get(1).delay,650);timers.get(1).fn();assert.equal(runtime.watching(),false);
  listeners.click({target});listeners['lorefy:auth-changed']();
  assert.equal(runtime.watching(),false);assert.equal(timers.size,0);assert.equal(disconnected,2);
});

test('return covers exclude backdrop art; crossflights require a decoded matching image', () => {
  const src=fs.readFileSync(path.join(__dirname,file),'utf8');
  assert.match(src,/\.lf-managed-cover-card img\.lf-cover-image,button img\.lf-cover-image/);
  assert.match(src,/img\.complete && img\.naturalWidth>0/);
  assert.match(src,/source\.src===to\.src/);
  assert.doesNotMatch(src,/cloneNode|innerHTML|localStorage|sessionStorage/);
});

test('entry and offline cache ship the shared engine and suppress duplicate route motion', () => {
  for(const name of ['index.html','sw.js']){
    const src=fs.readFileSync(path.join(__dirname,'..',name),'utf8');
    assert.ok(src.includes('modules/lorefy-interface-continuity.js?v=20261113-interface-continuity-v713'));
    assert.ok(src.includes('styles/lorefy-interface-continuity.css?v=20261113-interface-continuity-v713'));
  }
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-interface-continuity.css'),'utf8');
  assert.match(css,/data-lf-continuity.*\.nc-screen/);
  assert.match(css,/pointer-events:\s*none/);
  assert.doesNotMatch(css,/transition:\s*all|filter:\s*blur|will-change/);
});
