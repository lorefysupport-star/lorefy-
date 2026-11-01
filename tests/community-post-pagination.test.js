const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-community.js','utf8');
const id=n=>'11111111-1111-4111-8111-'+String(1000000000-n).padStart(12,'0');
const row=n=>({id:id(n),created_at:new Date(Date.UTC(2026,10,1)-n*1000).toISOString(),body:'Post '+n});
function order(a,b){return Date.parse(a.created_at)-Date.parse(b.created_at)||(a.id>b.id?1:a.id<b.id?-1:0);}
function mount(rows){
 const state={page:{isConnected:true},posts:[]},calls=[];let data=rows,failAt=0;
 const backend={mode:'live',user:{id:'owner'},listCommunityPosts:async options=>{
  calls.push(options);if(failAt&&calls.length===failAt)throw Error('offline');
  return data.filter(post=>!options.before||order(post,options.before)<0).slice(0,options.limit);
 }};
 const scope={state,global:{LorefyBackend:backend,setTimeout,clearTimeout},isDemo:()=>false,normalizePost:x=>({...x}),loadFollowedProfileIds:async()=>[],renderPostFeed(){}};
 const start=source.indexOf('  function loadPosts(');vm.runInNewContext(source.slice(start,source.indexOf('  function localSavePost(',start)),scope);
 return{state,calls,backend,load:scope.loadPosts,setData:rows=>data=rows,failNextPage:n=>failAt=calls.length+n};
}
async function twoPages(h){await h.load(true);await h.load(true,true);assert.equal(h.state.posts.length,120);}

test('refresh retains the complete loaded window through its old boundary despite new posts',async()=>{
 const data=Array.from({length:180},(_,i)=>row(i)),h=mount(data);await twoPages(h);
 h.setData([row(-2),row(-1),...data]);const previous=h.state.posts.at(-1).id;
 assert.equal(await h.load(true),true);assert.equal(h.state.posts.length,122);
 assert.equal(h.state.posts.at(-1).id,previous);assert.equal(h.state.posts[0].id,id(-2));assert.equal(h.state.hasMore,true);
 await h.load(true,true);assert.equal(h.state.posts.length,182);assert.equal(h.state.hasMore,true,'a full last page does not prove the end');
 await h.load(true,true);assert.equal(h.state.posts.length,182);assert.equal(h.state.hasMore,false);
});

test('refresh revalidates older loaded rows, removing withdrawn posts and applying edits',async()=>{
 const data=Array.from({length:180},(_,i)=>row(i)),h=mount(data);await twoPages(h);
 h.setData(data.filter(post=>post.id!==id(90)).map(post=>post.id===id(80)?{...post,body:'Edited'}:post));
 assert.equal(await h.load(true),true);assert.equal(h.state.posts.length,119);
 assert.equal(h.state.posts.some(post=>post.id===id(90)),false);assert.equal(h.state.posts.find(post=>post.id===id(80)).body,'Edited');
});

test('failed later refresh page keeps the previous complete window and pagination state',async()=>{
 const h=mount(Array.from({length:180},(_,i)=>row(i)));await twoPages(h);const before=h.state.posts,hasMore=h.state.hasMore;
 h.failNextPage(2);assert.equal(await h.load(true),false);assert.equal(h.state.posts,before);assert.equal(h.state.hasMore,hasMore);
});

test('refresh boundary uses id as well as timestamp when many posts share the same instant',async()=>{
 const data=Array.from({length:180},(_,i)=>({...row(i),created_at:row(0).created_at})),h=mount(data);await twoPages(h);
 h.setData([{...row(-1),created_at:row(0).created_at},...data]);
 assert.equal(await h.load(true),true);assert.equal(h.state.posts.length,121);assert.equal(h.state.posts.at(-1).id,id(119));
});

test('refresh does not keep old inaccessible rows when the server reaches the end early',async()=>{
 const h=mount(Array.from({length:180},(_,i)=>row(i)));await twoPages(h);h.setData([row(0),row(1)]);
 await h.load(true);assert.equal(h.state.posts.length,2);assert.equal(h.state.hasMore,false);
});

test('if the entire old window disappears, refresh can show the latest remaining older posts',async()=>{
 const h=mount(Array.from({length:180},(_,i)=>row(i)));await twoPages(h);
 h.setData(Array.from({length:80},(_,i)=>row(200+i)));await h.load(true);
 assert.equal(h.state.posts.length,60);assert.equal(h.state.posts[0].id,id(200));assert.equal(h.state.hasMore,true);
});

test('a repeated server cursor fails without looping or replacing the loaded window',async()=>{
 const data=Array.from({length:180},(_,i)=>row(i)),h=mount(data);await twoPages(h);const before=h.state.posts;
 let calls=0;h.backend.listCommunityPosts=async()=>{calls++;return data.slice(0,60);};
 assert.equal(await h.load(true),false);assert.equal(calls,2);assert.equal(h.state.posts,before);
});

test('account replacement between refresh pages cannot publish an incomplete old-owner window',async()=>{
 const data=Array.from({length:180},(_,i)=>row(i)),h=mount(data);await twoPages(h);const before=h.state.posts;
 const original=h.backend.listCommunityPosts;let calls=0;
 h.backend.listCommunityPosts=async options=>{const result=await original(options);if(++calls===2)h.backend.user={id:'other'};return result;};
 assert.equal(await h.load(true),false);assert.equal(h.state.posts,before);
});

function renderedTimeline(){
 const Node=require('./helpers/render-dom'),list=new Node(),status=new Node(),scroll={scrollTop:0,getBoundingClientRect:()=>({top:0,bottom:400})};
 const page={closest:()=>scroll,querySelectorAll:()=>list.children};
 const state={page,filter:'all',posts:[row(0),row(1)]},host={querySelector:selector=>selector.includes('post-list')?list:status};
 const scope={Date,doc:{documentElement:{lang:'en'},querySelector:()=>host},state,
  identity:()=>({id:'owner'}),savedPosts:()=>({}),visibleCommunityPosts:()=>state.posts,uiText:(ar,en)=>en,
  el:(...args)=>new Node(...args),icon:()=>new Node(),timeLabel:()=>'',updatePostCounter(){},orderCommunityFeed(){},hydrateIcons(){},
  postCard:()=>{const card=new Node('article');card.querySelector=()=>null;card.getBoundingClientRect=()=>({top:list.children.indexOf(card)*100-scroll.scrollTop,bottom:(list.children.indexOf(card)+1)*100-scroll.scrollTop});return card;}};
 const start=source.indexOf('  function renderPostFeed()');vm.runInNewContext(source.slice(start,source.indexOf('  function orderCommunityFeed()',start)),scope);scope.renderPostFeed();
 return{state,list,scroll,render:scope.renderPostFeed};
}
test('prepending fresh posts preserves the visible card position without native scroll anchoring',()=>{
 const h=renderedTimeline();h.scroll.scrollTop=100;const visible=h.list.children[1],top=visible.getBoundingClientRect().top;
 h.state.posts.unshift(row(-1));h.render();assert.equal(h.list.children[2],visible);
 assert.equal(visible.getBoundingClientRect().top,top);assert.equal(h.scroll.scrollTop,200);
});
test('fresh posts remain visible at the top instead of forcing a scroll offset',()=>{
 const h=renderedTimeline();h.state.posts.unshift(row(-1));h.render();assert.equal(h.scroll.scrollTop,0);
});
