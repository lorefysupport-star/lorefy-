const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-community.js','utf8');
function mount(){
 let owner='one',now=100000,page=null,feed=null,created=0,paints=0;const calls=[];
 const backend={user:{id:owner}},oldFeed={id:'lf-community-post-feed',remove(){},previousElementSibling:null};
 const state={page:null,posts:[{id:'cached'}],loaded:true,loadedAt:now,hasMore:true,filter:'all',followedIds:['friend'],followsLoaded:true,feedElement:oldFeed};
 const scope={state,Date:{now:()=>now},doc:{querySelector:s=>s==='.lf-community-page'?page:null,querySelectorAll:()=>[]},
  global:{LorefyBackend:backend},communitySession:()=>{const id=owner;return()=>id===owner;},
  communityFilterTabs:()=>null,filterForCommunityTab:()=> 'all',syncCommunityTabSemantics(){},
  createComposerFab(){},createPostFeed(){created++;return oldFeed;},markLegacyCommunitySections(){},orderCommunityFeed(){},
  renderPostFeed(){paints++;},loadPosts(force){calls.push({force,loaded:state.loaded,posts:state.posts.slice()});return Promise.resolve(true);}};
 state.feedScope=scope.communitySession();
 vm.runInNewContext(source.slice(source.indexOf('  function enhance()'),source.indexOf('  function scheduleRefresh(')),scope);
 return{state,calls,oldFeed,created:()=>created,paints:()=>paints,run:scope.enhance,
  enter(){feed=null;page={classList:{add(){}},children:[],closest:()=>null,querySelector:s=>s===':scope > .lf-community-post-feed'?feed:null,
   insertBefore:f=>{feed=f;},appendChild:f=>{feed=f;}};return page;},leave(){page=null;},advance(ms){now+=ms;},switch(){owner='two';backend.user.id=owner;}};
}
test('returning to community retains loaded posts, cursor and detached cards without a fresh read',()=>{
 const h=mount();h.enter();h.run();assert.equal(h.state.posts[0]?.id,'cached');assert.equal(h.state.loaded,true);
 assert.equal(h.state.hasMore,true);assert.equal(h.created(),0);assert.ok(h.paints()>0);
 h.leave();h.run();h.enter();h.run();assert.equal(h.state.posts[0]?.id,'cached');assert.equal(h.calls.at(-1).loaded,true);
});
test('an expired community snapshot paints immediately before background revalidation',()=>{
 const h=mount();h.advance(61000);h.enter();h.run();assert.equal(h.state.posts[0]?.id,'cached');
 assert.equal(h.calls.at(-1).loaded,false);assert.ok(h.paints()>0);
});
test('changing session clears rows, pagination and retained nodes even if the page node is reused',()=>{
 const h=mount();h.enter();h.run();h.switch();h.run();assert.equal(h.state.posts.length,0);
 assert.equal(h.state.loaded,false);assert.equal(h.state.hasMore,false);assert.equal(h.created(),1);
 assert.equal(h.state.followsLoaded,false);
});
