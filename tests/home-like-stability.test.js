const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Node=require('./helpers/render-dom'),growth=fs.readFileSync('modules/lorefy-growth-features.js','utf8'),community=fs.readFileSync('modules/lorefy-community.js','utf8');
test('Home Dislike paints immediately, clears Like and ignores duplicate pending taps',async()=>{
 const button=new Node('button'),card=new Node('article'),counter=new Node('span',{text:'0'});button.appendChild(counter);
 button.classList.add=()=>{};
 button.querySelector=selector=>selector.includes('span:not')?counter:selector.includes('dislike-icon')?{}:null;
 let resolve,requests=0;const values=new Map([['likes',{review:1}],['myLikes',{review:true}]]);
 const scope={communityCardKey:()=> 'review',K_COMMUNITY_DISLIKES:'dislikes',K_COMMUNITY_MY_DISLIKES:'myDislikes',K_COMMUNITY_LIKES:'likes',K_COMMUNITY_MY_LIKES:'myLikes',
  read:(key,fallback)=>values.get(key)||fallback,write:(key,value)=>values.set(key,value),paintCommunityDislike(){},toastSafe(){},
  syncCommunityReactionViews(){counter.textContent=String(values.get('dislikes').review);},persistReviewReaction(){requests++;return new Promise(r=>resolve=r);}};
 const start=growth.indexOf('  function wireCommunityDislike('),end=growth.indexOf('  function updateCommunityHero(',start);vm.runInNewContext(growth.slice(start,end),scope);scope.wireCommunityDislike(button,card);
 const event={preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
 const job=button.handlers.click(event);assert.equal(counter.textContent,'1');assert.equal(values.get('likes').review,0);
 await button.handlers.click(event);assert.equal(requests,1);resolve(true);await new Promise(setImmediate);resolve(true);await job;assert.equal(button.dataset.lfReactionSync,'0');
});
test('Home review Like paints immediately and ignores duplicate taps during the cloud request',async()=>{
 const button=new Node('button'),card=new Node('article'),counter=new Node('span',{text:'0'});button.appendChild(counter);
 button.querySelector=()=>counter;let resolve,requests=0,paints=0;
 const values=new Map(),scope={communityCardKey:()=> 'review:test',K_COMMUNITY_LIKES:'counts',K_COMMUNITY_MY_LIKES:'mine',K_COMMUNITY_MY_DISLIKES:'otherMine',K_COMMUNITY_DISLIKES:'otherCounts',
  read:(key,fallback)=>values.get(key)||fallback,write:(key,value)=>values.set(key,value),paintCommunityLike(){},paintCommunityDislike(){},toastSafe(){},
  syncCommunityReactionViews(){paints++;counter.textContent=String(values.get('counts')['review:test']);},
  persistReviewReaction:()=>{requests++;return new Promise(r=>resolve=r);}};
 const start=growth.indexOf('  function wireCommunityLike('),end=growth.indexOf('  function wireCommunityDislike(',start);vm.runInNewContext(growth.slice(start,end),scope);scope.wireCommunityLike(button,card,null);
 const event={preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};
 const job=button.handlers.click(event);assert.equal(requests,1);assert.equal(counter.textContent,'1');assert.equal(button.dataset.lfReactionSync,'1');assert.equal(paints,1);
 await button.handlers.click(event);assert.equal(requests,1);assert.equal(counter.textContent,'1');resolve(true);await job;assert.equal(button.dataset.lfReactionSync,'0');assert.equal(counter.textContent,'1');
});
test('realtime reaction acknowledgement arriving before RPC completion does not double the count',async()=>{
 let resolve;const post={id:'post',reactions:{like:0,dislike:1,mine:{like:false,dislike:true}}},button=new Node('button',{},[new Node('span')]),peer=new Node('button',{},[new Node('span')]);
 const scope={Intl,doc:{documentElement:{lang:'en'}},uiText:(ar,en)=>en,isDemo:()=>false,global:{LorefyBackend:{mode:'live',setCommunityPostReaction:()=>new Promise(r=>resolve=r)}},toast(){}};
 for(const control of [button,peer])control.getAttribute=name=>control.attrs[name]??null;
 const helpers=community.indexOf('  var communityNumbers =');vm.runInNewContext(community.slice(helpers,community.indexOf('  function avatar(',helpers)),scope);
 const start=community.indexOf('  function setPostReaction('),end=community.indexOf('  async function sharePost(',start);vm.runInNewContext(community.slice(start,end),scope);
 scope.setPostReaction(post,'like',button,peer);
 // A realtime feed refresh has already delivered the server's accepted state.
 post.reactions={like:1,dislike:0,mine:{like:true,dislike:false}};resolve(true);await Promise.resolve();await Promise.resolve();
 assert.equal(post.reactions.like,1);assert.equal(post.reactions.dislike,0);assert.equal(button.children[0].textContent,'1');assert.equal(button.attrs['aria-pressed'],'true');
});
test('Home review rendering keeps Like and Dislike counts aligned through a live Like acknowledgement',()=>{
 const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8'),React={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat().filter(Boolean)})};
 const scope={React,x:'main',lo:{review:false},De:{review:true},workById:()=>null,C:{green:'green',red:'red',sub:'gray'},W:'en',reviewReveals:{},fmt:()=>'',Jo:()=>0,
  Av:'Avatar',Stars:'Stars',MessageCircle:'Comment',Heart:'Heart',LorefyStableInline:'Stable',window:{LorefyUserExperience:{SpoilerGate:'Spoiler',reviewKey:()=> 'review'}}};
 const iconStart=app.indexOf('function LorefyReviewDislikeIcon('),iconEnd=app.indexOf('function lorefyReviewRequestScope(',iconStart);vm.runInNewContext(app.slice(iconStart,iconEnd),scope);
 const start=app.indexOf('Le=({rev:'),end=app.indexOf(',rr=()=>',start);vm.runInNewContext('var '+app.slice(start,end)+';',scope);
 const review={id:'review',userId:'reader',likeCount:0,myLike:false,dislikeCount:0,myDislike:false,likes:9,myHeart:true};
 function actions(){const walk=node=>[node,...(node.children||[]).filter(n=>typeof n==='object').flatMap(walk)];return walk(scope.Le({rev:review})).filter(n=>n.type==='Stable').map(n=>n.props);}
 let buttons=actions();assert.equal(buttons[1].Icon,'Heart');assert.equal(buttons[1].n,0);assert.equal(buttons[2].Icon,scope.LorefyReviewDislikeIcon);assert.equal(buttons[2].n,0);
 scope.lo.review=true;buttons=actions();assert.equal(buttons[1].n,1);assert.equal(buttons[2].n,0);
 review.likeCount=1;review.myLike=true;buttons=actions();assert.equal(buttons[1].n,1);assert.equal(buttons[2].n,0);
 const svg=scope.LorefyReviewDislikeIcon({});assert.equal(svg.props.className,'lf-community-dislike-icon','enhancement recognizes the original SVG and does not replace React-owned children');
});
