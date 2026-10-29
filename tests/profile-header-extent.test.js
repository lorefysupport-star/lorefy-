const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('header extent reaches the identity for each layout without depending on scroll',()=>{
  const header=require('../modules/lorefy-profile-header.js');
  for(const identityBottom of [280,340,430]) {
    const input={imageTop:66,bannerBottom:202,nameTop:identityBottom-60,identityBottom};
    const result=header.extent(input);
    assert.equal(66+result.height,identityBottom+20);
    const shifted=Object.fromEntries(Object.entries(input).map(([key,value])=>[key,value-500]));
    assert.deepEqual(header.extent(shifted),result);
    assert.ok(result.textStart>=0&&result.textStart<result.height);
  }
});

test('extent preserves a taller existing banner and rejects missing geometry',()=>{
  const header=require('../modules/lorefy-profile-header.js');
  assert.equal(header.extent({imageTop:0,bannerBottom:400,nameTop:170,identityBottom:240}).height,400);
  assert.equal(header.extent({imageTop:NaN,bannerBottom:200,nameTop:170,identityBottom:240}),null);
});

test('reader text clearance includes the asymmetric frame inset rather than width alone',()=>{
  const header=require('../modules/lorefy-profile-header.js');
  assert.equal(header.avatarSpace(176,29),219);
  assert.equal(header.avatarSpace(176,-12),190);
  assert.equal(header.avatarSpace(84,0),112);
});

test('header rendering extends existing artwork without rewriting identity or stored preferences',()=>{
  const source=fs.readFileSync('modules/lorefy-profile-header.js','utf8');
  const css=fs.readFileSync('styles/lorefy-profile-header.css','utf8');
  assert.doesNotMatch(source,/localStorage|innerHTML|appendChild|\.src\s*=/);
  assert.match(source,/ResizeObserver/);
  assert.match(source,/disconnect\(\)/);
  assert.match(css,/height:\s*var\(--profile-header-art-height\)\s*!important/);
  assert.match(css,/position:\s*absolute\s*!important/,'extended artwork must not grow its own flow anchor');
  assert.match(css,/\.lf-reader-surface/);
  assert.match(css,/pointer-events:\s*none/);
});

function fixture() {
  const rect=(top,bottom)=>({top,bottom,height:bottom-top,width:440});
  const node=(top,bottom)=>({getBoundingClientRect:()=>rect(top,bottom)});
  const image=node(66,202),banner=node(0,202),name=node(270,300),handle=node(304,326),frame=node(164,330),identity=node(202,600);
  banner.querySelector=()=>image;identity.querySelector=s=>s.includes('name')?name:handle;
  const values=new Map(),attributes=new Map();let writes=0;
  const page={isConnected:true,style:{getPropertyValue:k=>values.get(k)||'',setProperty:(k,v)=>{writes++;values.set(k,v);}},
    getAttribute:k=>attributes.get(k),setAttribute:(k,v)=>attributes.set(k,v),querySelector:s=>s.includes('banner')?banner:s.includes('identity')?identity:s.includes('frame')?frame:null};
  return {page,values,image,banner,name,handle,frame,get writes(){return writes;}};
}

test('geometry updates are idempotent and do not move existing content',()=>{
  const api=require('../modules/lorefy-profile-header.js'),f=fixture();
  assert.equal(api.update(f.page).height,284);
  assert.equal(f.values.get('--profile-header-art-height'),'284px');
  assert.equal(f.values.get('--profile-header-art-offset'),'66px');
  api.update(f.page);assert.equal(f.writes,3);
  assert.equal(f.handle.getBoundingClientRect().bottom,326);
  assert.equal(f.image.getBoundingClientRect().top,66);
});

test('observers release disconnected profiles and stop cleanly',()=>{
  const api=require('../modules/lorefy-profile-header.js'),f=fixture(),observers=[],queue=[];
  class Observer {constructor(callback){this.callback=callback;this.closed=false;observers.push(this);}observe(){}disconnect(){this.closed=true;}}
  const env={MutationObserver:Observer,ResizeObserver:Observer,addEventListener(){},removeEventListener(){},requestAnimationFrame:cb=>{queue.push(cb);return queue.length;},cancelAnimationFrame(){}};
  const doc={getElementById:()=>({}),querySelectorAll:()=>f.page.isConnected?[f.page]:[]};
  const stop=api.watch(doc,env);assert.equal(observers.length,3);
  f.page.isConnected=false;observers[0].callback();queue.shift()();
  assert.ok(observers[1].closed&&observers[2].closed);
  stop();assert.ok(observers.every(o=>o.closed));
});
