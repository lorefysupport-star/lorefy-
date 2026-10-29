const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
const source=fs.readFileSync('modules/lorefy-community.js','utf8');
function effect(fakeTimers=false){
 const start=app.indexOf('let i=false,n=null,feedPages=1,feedBusy=false;');
 const end=app.indexOf('},[]);useEffect',start);
 const events={},intervals=[],registered=new Map();let reads=0,resolve,timeout;
 const gate=new Promise(r=>resolve=r),values={followers:[],following:[]};
 const set=k=>update=>{values[k]=typeof update==='function'?update(values[k]):update;};
 const window={addEventListener:(n,f)=>events[n]=f,removeEventListener(){},dispatchEvent(){},
  LorefyPageRefresh:{register:(name,fn)=>{registered.set(name,fn);return()=>registered.delete(name);}}};
 const backend={user:{id:'owner'},listReviews:async()=>{reads++;await gate;return [];},listReviewCollection:async()=>[],
  getSession:async()=>({userId:'owner'}),listProfileFollowers:async()=>[],listProfileFollowing:async()=>[]};
 const scope={window,e:backend,CustomEvent:class{},console:{warn(){}},Promise,Map,Date,JSON,
  document:{hidden:false,addEventListener(){},removeEventListener(){}},
  setTimeout:fakeTimers?fn=>{timeout=fn;return 1;}:setTimeout,clearTimeout,setInterval:(f,ms)=>{intervals.push({f,ms});return 1;},clearInterval(){},
  localStorage:{getItem:()=>JSON.stringify({name:'Updated',un:'updated',bio:'New bio',avatar:'avatar',banner:'banner',isPrivate:false})},
  un:set('name'),fn:set('username'),hn:set('bio'),pn:set('avatar'),gn:set('banner'),En:set('private'),
  Io:set('comments'),co:set('likes'),po:set('hearts'),fo:set('reviews'),setCloudFollowers:set('followers'),setCloudFollowing:set('following')};
 Object.assign(values,{comments:{},likes:{},hearts:{},reviews:[]});
 const cleanup=vm.runInNewContext('(function(){'+app.slice(start,end)+'})()',scope);
 return {events,intervals,registered,values,cleanup,reads:()=>reads,resolve,timeout:()=>timeout(),async settle(){for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r));}};
}
test('realtime and manual refreshes share one in-flight review request',async()=>{
 const h=effect();h.events['lorefy:community-refresh']();h.events['lorefy:community-refresh']();
 assert.equal(h.reads(),1);h.resolve();await h.settle();h.cleanup();
});
test('live review feed does not run a blind 30-second polling loop',()=>{
 const h=effect();assert.equal(h.intervals.length,0);h.resolve();h.cleanup();
});
test('unchanged social graph keeps its React state references',async()=>{
 const h=effect(),before=[h.values.followers,h.values.following];h.resolve();await h.settle();
 assert.equal(h.values.followers,before[0]);assert.equal(h.values.following,before[1]);h.cleanup();
});
test('account profile refresh updates mounted identity without reloading the app',async()=>{
 const h=effect();h.events['lorefy:stored-state']({detail:{key:'lorefy.identity.v1'}});
 assert.equal(h.values.name,'Updated');assert.equal(h.values.avatar,'avatar');assert.equal(h.values.bio,'New bio');
 h.resolve();await h.settle();h.cleanup();
});
test('refresh exposes an awaitable lifecycle and unregisters it on unmount',async()=>{
 const h=effect();assert.equal(typeof h.registered.get('community-reviews'),'function');
 let done=false;const result=h.registered.get('community-reviews')().then(()=>{done=true;});
 await h.settle();assert.equal(done,false);h.resolve();await result;assert.equal(done,true);h.cleanup();
 assert.equal(h.registered.has('community-reviews'),false);
});
test('review refresh times out, permits a retry and discards an old result',async()=>{
 const h=effect(true),job=h.registered.get('community-reviews')();h.timeout();assert.equal(await job,false);
 h.resolve();await h.settle();assert.equal(h.values.reviews.length,0);
 assert.equal(await h.registered.get('community-reviews')(),true);assert.equal(h.reads(),2);h.cleanup();
});
test('feed keeps unchanged cards through loading, pagination and other-post updates',()=>{
 const Node=require('./helpers/render-dom'),list=new Node(),status=new Node();
 let now=0,created=0,viewer='owner';const one={id:'one',created_at:'2026-10-21'},two={id:'two',created_at:'2026-10-20'};
 const state={filter:'all',posts:[one,two]},host={querySelector:s=>s.includes('post-list')?list:status};
 const scope={Date:{now:()=>now,parse:Date.parse},doc:{documentElement:{lang:'en'},querySelector:()=>host},state,
  identity:()=>({id:viewer}),savedPosts:()=>({}),visibleCommunityPosts:()=>state.posts,uiText:(ar,en)=>en,
  el:(...args)=>new Node(...args),icon:()=>new Node('i'),timeLabel:()=>String(now),postCard:()=>{created++;const card=new Node('article'),time=new Node('small');card.appendChild(time);card.querySelector=()=>time;return card;},
  orderCommunityFeed(){},hydrateIcons(){},updatePostCounter(){}};
 const start=source.indexOf('  function renderPostFeed()'),end=source.indexOf('  function orderCommunityFeed()',start);
 vm.runInNewContext(source.slice(start,end),scope);scope.renderPostFeed();const original=list.children.slice();
 scope.renderPostFeed();assert.equal(created,2);
 state.loading=true;state.hasMore=true;scope.renderPostFeed();assert.equal(list.children[0],original[0]);assert.equal(list.children[1],original[1]);assert.equal(created,2);
 state.posts.push({id:'three'});scope.renderPostFeed();assert.equal(created,3);assert.equal(list.children[0],original[0]);
 one.replyCount=1;one.reactions={like:1,dislike:0,mine:{like:true,dislike:false}};scope.renderPostFeed();assert.equal(created,3);assert.equal(list.children[1],original[1]);assert.equal(list.children[0],original[0]);
 state.posts=state.posts.map(post=>({...post}));scope.renderPostFeed();assert.equal(created,3,'equivalent realtime objects retain cards and handlers');assert.equal(state.posts[0],one);
 one.body='edited';scope.renderPostFeed();assert.equal(created,4);assert.notEqual(list.children[0],original[0]);
 state.posts=[two,one];scope.renderPostFeed();assert.equal(created,4);assert.equal(list.children[0],original[1]);assert.equal(host.__lorefyPostCards.size,2);
 now=60000;scope.renderPostFeed();assert.equal(created,4,'timestamp updates keep the post cards');assert.match(list.children[0].children[0].textContent,/60000/);
 viewer='other';scope.renderPostFeed();assert.equal(created,6,'viewer-specific handlers are replaced');
});

function postLoader(){
 let resolve,reads=0,timeout,paints=0;const state={page:{},posts:[]};
 const backend={mode:'live',user:{id:'owner'},listCommunityPosts:()=>{reads++;return new Promise(r=>resolve=r);}};
 const scope={state,global:{LorefyBackend:backend,setTimeout:fn=>{timeout=fn;return 1;},clearTimeout(){}},
  isDemo:()=>false,normalizePost:x=>x,loadFollowedProfileIds:async()=>[],renderPostFeed:()=>paints++,console:{warn(){}},Promise,Map};
 const start=source.indexOf('  async function loadPosts(')>=0?source.indexOf('  async function loadPosts('):source.indexOf('  function loadPosts(');
 const end=source.indexOf('  function localSavePost(',start);
 vm.runInNewContext(source.slice(start,end),scope);
 return{state,api:scope.loadPosts,reads:()=>reads,timeout:()=>timeout(),resolve:rows=>resolve(rows),resolver:()=>resolve,paints:()=>paints};
}
test('post refresh callers wait for the same request instead of completing early',async()=>{
 const h=postLoader(),a=h.api(true),b=h.api(true);let done=false;b.then(()=>{done=true;});
 await Promise.resolve();assert.equal(done,false);assert.equal(h.reads(),1);h.resolve([]);await Promise.all([a,b]);
});
test('a hanging post request becomes retryable and cannot later replace a retry result',async()=>{
 const h=postLoader(),a=h.api(true);const oldResolve=h.resolver();
 h.timeout();assert.equal(await a,false);assert.equal(h.state.loading,false);assert.equal(h.state.error,true);
 const b=h.api(true);h.resolve([{id:'new'}]);await b;oldResolve([{id:'old'}]);await Promise.resolve();
 assert.equal(h.state.posts[0].id,'new');
});
test('post responses from an abandoned page cannot overwrite the new screen',async()=>{
 const h=postLoader(),a=h.api(true);h.state.page={};h.resolve([{id:'old'}]);assert.equal(await a,false);
 assert.equal(h.state.posts.length,0);
});
test('failed following refresh keeps the known following filter rather than showing a false empty feed',async()=>{
 const state={followedIds:['known-reader'],followsLoaded:true};
 const scope={state,global:{LorefyBackend:{getFollowedProfileIds:async()=>{throw Error('offline');}}},isDemo:()=>false,console:{warn(){}}};
 const start=source.indexOf('  async function loadFollowedProfileIds('),end=source.indexOf('  function loadPosts(',start);
 vm.runInNewContext(source.slice(start,end),scope);
 await assert.rejects(scope.loadFollowedProfileIds(true),/offline/);assert.deepEqual(state.followedIds,['known-reader']);
});
