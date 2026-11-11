const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-profile-sections.js','utf8');
const selection=require('../modules/lorefy-profile-sections.js');
test('profile posts mount only the visible mixed post/review batch before requesting older data',()=>{
 const mounted=[],requests=[];
 const make=(tag,attrs={},children=[])=>({tag,attrs,children,appendChild(child){this.children.push(child);}});
 const state={tab:'posts',owner:true,profile:{id:'reader'},posts:Array.from({length:50},(_,i)=>({id:'p'+i,user_id:'reader',created_at:new Date(100000-i).toISOString()})),panel:make('section'),more:true};
 const reviews=Array.from({length:30},(_,i)=>({id:'r'+i,userId:'reader',ts:99000-i}));
 const context={root:{LorefyCommunity:{postCard:row=>{mounted.push(row.id);return make('article');}},LorefyProfileReviews:()=>reviews,
   LorefyProfileReviewCard:()=>{},ReactDOM:{createRoot:()=>({unmount(){},render:element=>mounted.push(element.props.rev.id)})},React:{createElement:(type,props)=>({type,props})}},
   text:()=>({tabs:['Overview','Lists','Posts'],write:'Write',more:'Show more',older:'Older',loading:'Loading'}),node:make,
   replacePanel:(s,...children)=>{mounted.length=0;s.panel.children=children;},contentHeader:()=>make('header'),button:(label,icon,click)=>make('button',{label,click}),
   profileEntries:selection.profileEntries,hydrate:()=>{},loadPosts:(s,append)=>requests.push(append)};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function renderPosts(state)'),source.indexOf('  function selectTab(state')),context);
 const render=()=>{mounted.length=0;context.renderPosts(state);};
 render();assert.equal(mounted.length,24);assert.equal(requests.length,0);
 let more=state.panel.children.find(n=>n.tag==='button');assert.equal(more.attrs.label,'Show more');more.attrs.click();assert.equal(mounted.length,48);
 for(let i=0;i<2;i++){mounted.length=0;state.panel.children.find(n=>n.tag==='button').attrs.click();}
 assert.equal(mounted.length,80);more=state.panel.children.find(n=>n.tag==='button');assert.equal(more.attrs.label,'Older');more.attrs.click();assert.deepEqual(requests,[true]);
});
