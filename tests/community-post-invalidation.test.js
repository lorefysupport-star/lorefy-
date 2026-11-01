const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-community.js','utf8');
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r));};
function invalidation(){
 const timers=new Map(),calls=[];let serial=0;
 const state={page:{isConnected:true},posts:[],loaded:true},backend={user:{id:'owner'}};
 const scope={state,global:{LorefyBackend:backend,setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)},
  loadPosts:(...args)=>{calls.push(args);return Promise.resolve(true);}};
 vm.runInNewContext(source.slice(source.indexOf('  function scheduleRefresh('),source.indexOf('  function boot()',source.indexOf('  function scheduleRefresh('))),scope);
 return{state,backend,scope,calls,send:scope.scheduleRefresh,flush(){const values=[...timers.values()];timers.clear();values.forEach(fn=>fn());}};
}
test('review changes do not invalidate standalone posts',()=>{
 const h=invalidation();for(const table of ['reviews','review_comments','review_reactions'])h.send({table});h.flush();assert.equal(h.calls.length,0);
});
test('post invalidations arriving during a request get one trailing refresh',async()=>{
 const h=invalidation();let finish;h.state.postJob={current:()=>true,promise:new Promise(r=>finish=r)};
 for(let i=0;i<20;i++)h.send({table:'community_posts'});h.flush();assert.equal(h.calls.length,0);
 h.state.postJob=null;finish(true);await settle();h.flush();assert.equal(h.calls.length,1);
});
test('offscreen or replaced-owner post invalidations cannot fetch under a later context',async()=>{
 const h=invalidation();h.state.page.isConnected=false;h.send({table:'community_posts'});h.flush();assert.equal(h.calls.length,0);
 h.state.page.isConnected=true;h.send({table:'community_post_reactions'});h.backend.user={id:'other'};h.flush();assert.equal(h.calls.length,0);
});
test('post data is published while an independent following lookup is still pending',async()=>{
 let postsResolve,followResolve,followReads=0,paints=0;const state={page:{isConnected:true},posts:[]};
 const backend={mode:'live',user:{id:'owner'},listCommunityPosts:()=>new Promise(r=>postsResolve=r)};
 const scope={state,global:{LorefyBackend:backend,setTimeout,clearTimeout},isDemo:()=>false,normalizePost:x=>x,
  loadFollowedProfileIds:()=>{followReads++;return new Promise(r=>followResolve=r);},renderPostFeed:()=>paints++};
 const start=source.indexOf('  function loadPosts(');vm.runInNewContext(source.slice(start,source.indexOf('  function localSavePost(',start)),scope);
 const job=scope.loadPosts(true);assert.equal(followReads,1,'independent lookups begin together');
 postsResolve([{id:'new'}]);await settle();assert.equal(state.posts[0]?.id,'new');assert.ok(paints>0);
 followResolve([]);assert.equal(await job,true);
});
