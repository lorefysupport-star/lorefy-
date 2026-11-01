const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-review-editor.js','utf8');
function model(props={}){
 const states=[],scope={module:{exports:{}},React:{createElement:(type,attributes,...children)=>({type,attributes:attributes||{},children:children.flat(Infinity)}),useState:v=>[v,n=>states.push(n)],useRef:v=>({current:v}),useEffect(){}}};
 vm.runInNewContext(source,scope);
 const tree=scope.LorefyReviewComposer({language:'en',work:{id:'work',title:'Work'},rating:4,ratings:{},fields:[],textRef:{current:''},momentRef:{current:''},images:[],icons:{},...props});
 return {api:scope.module.exports,tree,scope,states};
}
function find(node,fn){if(!node||typeof node!=='object')return null;if(fn(node))return node;for(const c of node.children||[]){const n=find(c,fn);if(n)return n;}return null;}
test('an explicit dislike is publishable zero, not an empty rating',()=>{
 const {api}=model();assert.equal(api.canPublish(0,'no'),true);
 for(const rec of [null,undefined,'yes',''])assert.equal(api.canPublish(0,rec),false);
 for(const n of [null,'0',NaN,Infinity,-1,6])assert.equal(api.canPublish(n,'no'),false);
 assert.equal(api.canPublish(2,'no'),true);
});
test('Dislike selects zero; deselection stays unrated and a new positive slider clears dislike',()=>{
 const ratings=[],recs=[],m=model({onRating:n=>ratings.push(n),onRecommend:n=>recs.push(n)});
 const no=find(m.tree,n=>n.attributes['data-review-dislike']!==undefined);assert.ok(no);
 no.attributes.onClick();assert.deepEqual(ratings,[0]);assert.deepEqual(recs,['no']);
 const selected=model({rating:0,recommendation:'no',onRating:n=>ratings.push(n),onRecommend:n=>recs.push(n)});
 find(selected.tree,n=>n.attributes['data-review-dislike']!==undefined).attributes.onClick();assert.equal(recs.at(-1),null);
 find(selected.tree,n=>n.type==='input'&&n.attributes.type==='range').attributes.onChange({target:{value:'3.5'}});
 assert.equal(recs.at(-1),null);assert.equal(ratings.at(-1),3.5);
});
test('zero dislike publishes with no text, and keeps its draft when service fails',async()=>{
 let calls=0;const m=model({rating:0,recommendation:'no',onPublish:async()=>{calls++;return false;}});
 const footer=find(m.tree,n=>n.attributes.className==='lf-rating-footer'),button=find(footer,n=>n.type==='button');
 assert.equal(button.attributes.disabled,false);await button.attributes.onClick();assert.equal(calls,1);
 assert.ok(m.states.some(n=>typeof n==='string'&&n.includes('Your review is still here')));
});
test('restoring dislike and legacy not-recommend scores never reclassifies null as zero',()=>{
 const {api}=model();assert.equal(api.savedDraft({r:0,recVal:'no'}).recommendation,'no');
 assert.equal(api.savedDraft({r:0,rec:false}).recommendation,'no');
 assert.equal(api.savedDraft({r:2,recVal:'no'}).rating,2);
 assert.equal(api.savedDraft({r:null,rec:false}).recommendation,null);
 assert.equal(api.savedDraft({r:null,recVal:'no',rec:false}).recommendation,null);
});

test('legacy negative recommendations reopen with their original positive score and choice',()=>{
 const {api}=model();const review={r:2,rec:false,txt:'Keep my opinion',imgs:['image'],ratings:{story:3}};
 const before=JSON.stringify(review),draft=api.savedDraft(review);
 assert.equal(draft.rating,2);assert.equal(draft.recommendation,'no');assert.equal(draft.text,'Keep my opinion');
 assert.equal(draft.ratings.story,3);assert.equal(JSON.stringify(review),before);
});

test('legacy negative recommendation is visibly selected and toggles off without erasing its positive score',()=>{
 const ratings=[],recs=[],m=model({rating:2,recommendation:'no',onRating:n=>ratings.push(n),onRecommend:n=>recs.push(n)});
 const no=find(m.tree,n=>n.attributes['data-review-dislike']!==undefined);
 assert.equal(no.attributes['aria-pressed'],true);assert.ok(no.children.includes('Not for me'));
 no.attributes.onClick();assert.deepEqual(ratings,[]);assert.deepEqual(recs,[null]);
});

test('canonical unknown recommendation stays unknown instead of becoming a zero dislike',()=>{
 const {api}=model();assert.equal(api.savedDraft({r:0,recVal:null,rec:false}).recommendation,null);
 assert.equal(api.savedDraft({r:2,recVal:null,rec:false}).recommendation,null);
 assert.equal(api.savedDraft({r:0,recVal:'no',rec:false}).recommendation,'no');
});

test('newest canonical unknown zero removes a prior local dislike without losing legacy explicit zero',()=>{
 const {api}=model(),rows=[{id:'old',mid:'work',userId:'reader',r:0,recVal:'no',ts:1},
 {id:'new',mid:'work',userId:'reader',r:0,recVal:null,rec:false,ts:2}];
 assert.equal(api.localDislikeCount(rows,'work'),0);
 assert.equal(api.localDislikeCount(rows.concat({mid:'work',userId:'other',r:0,rec:false,ts:3}),'work'),1);
});
test('demo dislike counts deduplicate owners and exclude unrated, private and different works',()=>{
 const {api}=model();assert.equal(typeof api.localDislikeCount,'function');
 const rows=[{mid:'work',r:0,recVal:'no',userId:'me'},{mid:'work',r:0,recVal:'no',userId:'owner'},
 {mid:'work',r:0,recVal:'no',userId:'other'}, {mid:'work',r:null,recVal:'no',userId:'unrated'},
 {mid:'work',r:2,recVal:'no',userId:'legacy'}, {mid:'work',r:0,recVal:'no',userId:'private',is_public:false},
 {mid:'else',r:0,recVal:'no',userId:'different'}];
 assert.equal(api.localDislikeCount(rows,'work','owner'),2);
});
test('stale dislike controls cannot change a replacement editor',()=>{
 let calls=0;const m=model({isCurrent:()=>false,onRating:()=>calls++,onRecommend:()=>calls++});
 const no=find(m.tree,n=>n.attributes['data-review-dislike']!==undefined);assert.ok(no);no.attributes.onClick();assert.equal(calls,0);
});
test('Home displays explicit zero as Dislike but unrated zero stays a dash',()=>{
 const scope={React:{createElement:(type,attributes,...children)=>({type,attributes:attributes||{},children:children.flat(Infinity)})},NenIcons:{ThumbsDown:'ThumbsDown',Star:'Star'}};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-home-cinema.js','utf8'),scope);
 const no=scope.LorefyHomeCinema.ReviewRating({value:0,recommendation:'no',language:'en'});
 assert.equal(no.attributes['data-rating'],'0');assert.match(no.attributes['aria-label'],/Dislike/);
 assert.ok(find(no,n=>n.type==='ThumbsDown'));
 assert.equal(scope.LorefyHomeCinema.ReviewRating({value:null,recommendation:'no',language:'en'}).attributes['data-rating'],'');
});
test('review sharing preserves explicit zero instead of borrowing another displayed number',()=>{
 const growth=fs.readFileSync('modules/lorefy-growth-features.js','utf8'),start=growth.indexOf('function reviewDetailRating('),end=growth.indexOf('function reviewAvatarSource(',start);
 const scope={communityRenderedStarRating:()=>4.5};vm.runInNewContext(growth.slice(start,end),scope);
 assert.equal(scope.reviewDetailRating({getAttribute:()=> '0'},[{textContent:'4.5'}]),'0');
 assert.equal(scope.reviewDetailRating({getAttribute:()=> null,setAttribute(){}},[]),'4.5');
});

function countModel(){
 const writes=[],events={},effects=[];let finish;
 const scope={localStorage:{getItem:()=> 'owner'},addEventListener:(n,f)=>events[n]=f,removeEventListener:(n,f)=>{if(events[n]===f)delete events[n];},
  React:{createElement:(type,attributes,...children)=>({type,attributes:attributes||{},children:children.flat(Infinity)}),useState:v=>[v,n=>writes.push(n)],useRef:v=>({current:v}),useEffect:fn=>effects.push(fn)},
  LorefyBackend:{mode:'live',user:{id:'owner'},client:{},_communityEpoch:1,countWorkDislikes:()=>new Promise(r=>finish=r)}};
 vm.runInNewContext(source,scope);const tree=scope.LorefyWorkDislikes({workId:'work',language:'en',reviews:[]}),cleanup=effects[0]();
 return {scope,tree,writes,events,cleanup,finish:n=>finish(n)};
}
test('live count starts unknown, not a fake zero, and current successful result is shown',async()=>{
 const h=countModel();assert.equal(find(h.tree,n=>n.attributes['data-work-dislike-count']!==undefined).children[0],'—');
 h.finish(734);await new Promise(r=>setImmediate(r));assert.equal(h.writes.at(-1).count,734);
});
for(const kind of ['owner','epoch','client','mode','backend','unmount'])test('count view ignores a response after '+kind,async()=>{
 const h=countModel();h.writes.length=0;
 if(kind==='owner')h.scope.LorefyBackend.user={id:'other'};if(kind==='epoch')h.scope.LorefyBackend._communityEpoch++;
 if(kind==='client')h.scope.LorefyBackend.client={};if(kind==='mode')h.scope.LorefyBackend.mode='demo';if(kind==='backend')h.scope.LorefyBackend={};if(kind==='unmount')h.cleanup();
 h.finish(99);await new Promise(r=>setImmediate(r));assert.equal(h.writes.length,0);
});
test('newest count refresh wins and cleanup removes the refresh subscription',async()=>{
 const h=countModel(),first=h.finish;let resolve;
 // Capture the first resolver before starting a replacement request.
 h.scope.LorefyBackend.countWorkDislikes=()=>new Promise(r=>resolve=r);
 h.events['lorefy:community-refresh']();resolve(3);await new Promise(r=>setImmediate(r));
 first(50);await new Promise(r=>setImmediate(r));assert.equal(h.writes.at(-1).count,3);
 h.cleanup();assert.equal(h.events['lorefy:community-refresh'],undefined);
});
