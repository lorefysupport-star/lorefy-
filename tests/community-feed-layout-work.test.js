const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Node=require('./helpers/render-dom');
const source=fs.readFileSync('modules/lorefy-community.js','utf8');
function fixture(timeline=true){
 const list=new Node(),status=new Node();let reads=0;
 const scroll={get scrollTop(){reads++;return 0;},getBoundingClientRect(){throw Error('top-of-feed needs no anchor geometry');}};
 const page={closest:()=>scroll,matches:()=>timeline,querySelectorAll:()=>list.children};
 const state={page,filter:'all',posts:[],loading:true};
 const host={querySelector:selector=>selector.includes('post-list')?list:status};
 const scope={Date,doc:{documentElement:{lang:'en'},querySelector:()=>host},state,
  identity:()=>({id:'owner'}),savedPosts:()=>({}),visibleCommunityPosts:()=>state.posts,
  el:(...args)=>new Node(...args),icon:()=>new Node('i'),uiText:(ar,en)=>en,
  updatePostCounter(){},orderCommunityFeed(){},hydrateIcons(){},timeLabel:()=>'',postCard:()=>{const card=new Node('article');card.querySelector=()=>null;return card;}};
 const start=source.indexOf('  function renderPostFeed()');
 vm.runInNewContext(source.slice(start,source.indexOf('  function orderCommunityFeed()',start)),scope);
 return{state,list,render:scope.renderPostFeed,reads:()=>reads};
}

test('empty timeline loading and end-of-feed controls do not force scroll layout',()=>{
 const h=fixture();h.render();h.state.loading=false;h.render();
 h.state.reviewFeed={hasMore:true};h.render();
 assert.equal(h.reads(),0,'tail controls cannot move existing review cards');
});

test('incoming and removed posts still take the existing anchoring path',()=>{
 const h=fixture();h.state.posts=[{id:'one',created_at:'2026-11-01'}];h.render();
 assert.equal(h.reads(),1);h.state.posts=[];h.render();assert.equal(h.reads(),2);
});

test('appearing and removed error banners retain anchor measurement',()=>{
 const h=fixture();h.state.error=true;h.render();assert.equal(h.reads(),1);
 h.state.error=false;h.render();assert.equal(h.reads(),2);
});

test('non-timeline layouts keep conservative anchor behavior',()=>{
 const h=fixture(false);h.render();assert.equal(h.reads(),1);
});

test('the timeline keeps status and pagination after all timestamped cards',()=>{
 const css=fs.readFileSync('styles/lorefy-community.css','utf8');
 assert.match(css,/\.lf-social-timeline \.lf-community-load-more\s*\{[^}]*order:\s*2147483647/);
 assert.match(css,/\.lf-social-timeline \.lf-community-post-empty\s*\{[^}]*order:\s*2147483646/);
});
