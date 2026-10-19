const test=require('node:test'),assert=require('node:assert/strict');
const {createGesture,createRunner}=require('../modules/lorefy-page-refresh');
test('a downward pull arms only beyond the threshold and refreshes on release',()=>{
 const g=createGesture();g.start({x:10,y:20,id:1});assert.equal(g.move({x:11,y:50,id:1}),30);
 assert.equal(g.end(),false);g.start({x:10,y:20,id:1});g.move({x:12,y:120,id:1});assert.equal(g.end(),true);assert.equal(g.end(),false);
});
for(const change of [{x:100,y:30,id:1},{x:10,y:0,id:1},{x:10,y:120,id:2},{x:10,y:120,id:1,top:false}])test('gesture cancels for '+JSON.stringify(change),()=>{
 const g=createGesture();g.start({x:10,y:20,id:1});g.move(change);assert.equal(g.end(),false);
});
test('reversing or cancelling an armed pull never refreshes',()=>{
 const g=createGesture();g.start({x:0,y:0,id:1});g.move({x:0,y:130,id:1});g.move({x:0,y:20,id:1});assert.equal(g.end(),false);
 g.start({x:0,y:0,id:1});g.move({x:0,y:120,id:1});g.cancel();assert.equal(g.end(),false);
});
test('runner coalesces requests and releases its job after completion',async()=>{
 const r=createRunner();let calls=0,release;const gate=new Promise(resolve=>release=resolve);
 r.register('page',async()=>{calls++;await gate;return true;});const a=r.run('page'),b=r.run('page');
 await Promise.resolve();assert.equal(calls,1);release();assert.equal(await a,true);assert.equal(await b,true);await r.run('page');assert.equal(calls,2);
});
test('timeout stops busy state and invalidates a late result before retry',async()=>{
 let timeout;const r=createRunner({setTimeout:fn=>{timeout=fn;return 1;},clearTimeout(){}});let active;
 r.register('page',ctx=>{active=ctx.active;return new Promise(()=>{});});const job=r.run('page');await Promise.resolve();
 timeout();await assert.rejects(job,/timeout/);assert.equal(active(),false);
 r.register('page',async()=>true);assert.equal(await r.run('page'),true);
});
test('route cancellation prevents late successful status',async()=>{
 const r=createRunner();let current=true,release;r.register('page',()=>new Promise(resolve=>release=resolve));
 const job=r.run('page',{active:()=>current});await Promise.resolve();current=false;release(true);await assert.rejects(job,/cancelled/);
});
test('stale unregister cannot remove a replacement and missing handlers fail explicitly',async()=>{
 const r=createRunner(),stop=r.register('page',async()=>1);r.register('page',async()=>2);stop();assert.equal(await r.run('page'),2);
 await assert.rejects(r.run('missing'),/unavailable/);
});
