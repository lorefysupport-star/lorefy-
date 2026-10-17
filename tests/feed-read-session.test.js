const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const friend='11111111-1111-4111-8111-111111111111', commentUser='22222222-2222-4222-8222-222222222222';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const stale=e=>e.code==='LOREFY_SESSION_INVALID';
function harness(action) {
  const values=new Map([['lorefy.activeUser.v1','a']]),calls=[],hooks={};
  const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  const window={localStorage:storage};
  vm.runInNewContext(source,{window,localStorage:storage,URL,console,setTimeout,clearTimeout});
  const api=window.LorefyBackend;let profileQueries=0,postQueries=0;
  async function step(phase,value){calls.push(phase);return hooks[phase]?hooks[phase](value):value;}
  function client(){return{from:table=>{
    let phase=table,data=[];
    if(table==='reviews')data=[{id:'review',user_id:friend,work_id:'work',rating:4.25,body:'review',spoiler:true,image_urls:['target/review-image'],is_public:true}];
    if(table==='profiles'){phase=++profileQueries===1?'authors':'commenters';data=[{id:phase==='authors'?friend:commentUser,avatar:'target/'+(phase==='authors'?'avatar':'comment-avatar')}];}
    if(table==='review_comments')data=[{id:'comment',review_id:'review',user_id:commentUser,body:'comment'}];
    if(table==='review_reactions')data=[{review_id:'review',user_id:'a',kind:'heart'}];
    if(table==='community_posts'){phase=++postQueries===1?'posts':'replies';data=phase==='posts'?[{id:'post',user_id:friend,body:'post',attachment:{image:'lorefy-artwork:target/attachment',items:[{image:'lorefy-artwork:target/attachment-item'}]}}]:[{id:'reply',parent_id:'post'}];}
    if(table==='community_post_reactions')data=[{post_id:'post',user_id:'a',kind:'like'}];
    if(table==='chapter_reviews')data=[{id:'chapter-review',user_id:friend,rating:3.75,spoiler:true,profile:{id:friend,avatar:'target/chapter-avatar'}}];
    const q={then:(resolve,reject)=>step(phase,{data,error:null}).then(resolve,reject)};
    for(const method of ['select','order','limit','eq','or','not','is','in','range'])q[method]=(...args)=>{calls.push({table,method,args});return q;};
    return q;
  }};}
  Object.assign(api,{mode:'live',user:{id:'a'},_communityEpoch:1,client:client(),
    getFollowedProfileIds:()=>step('follows',[friend]),
    _storageMediaUrl:(bucket,value)=>step(String(value).split('/').pop(),'signed:'+value)});
  return{api,hooks,calls,values,transition(kind='account'){
    if(kind==='account'){api.user={id:'b'};values.set('lorefy.activeUser.v1','b');}
    if(kind==='client')api.client=client();
    if(kind==='epoch')api._communityEpoch++;
    if(kind==='local-owner')values.set('lorefy.activeUser.v1','b');
    if(kind==='mode')api.mode='demo';
  }};
}
const actions={reviews:h=>h.api.listReviews({workId:'work',userId:friend}),friends:h=>h.api.listFriendRatings(),
  posts:h=>h.api.listCommunityPosts({userId:friend}),chapters:h=>h.api.listChapterReviews('work',7,20)};
const phases={reviews:['reviews','authors','avatar','review_comments','commenters','comment-avatar','review_reactions','review-image'],
  friends:['follows','reviews','authors','avatar'],
  posts:['posts','attachment','attachment-item','authors','avatar','community_post_reactions','replies'],
  chapters:['chapter_reviews','chapter-avatar']};
for(const[action,steps]of Object.entries(phases))for(const phase of steps)test(action+': switching account during '+phase+' stops the old result and later requests',async()=>{
  const h=harness(action),gate=deferred(),entered=deferred();
  h.hooks[phase]=async value=>{entered.resolve();await gate.promise;return value;};
  const pending=actions[action](h);await entered.promise;const count=h.calls.length;h.transition();gate.resolve();
  await assert.rejects(pending,stale);assert.equal(h.calls.length,count);
});
for(const kind of ['client','epoch','local-owner','mode'])for(const action of Object.keys(actions))test(action+': '+kind+' invalidates a pending query',async()=>{
  const h=harness(action),gate=deferred(),entered=deferred();
  h.hooks[phases[action][0]]=async value=>{entered.resolve();await gate.promise;return value;};
  const pending=actions[action](h);await entered.promise;const count=h.calls.length;h.transition(kind);gate.resolve();
  await assert.rejects(pending,stale);assert.equal(h.calls.length,count);
});
for(const kind of ['account','client','epoch','local-owner','mode'])test('collection: '+kind+' after a page cannot fetch or combine another page',async()=>{
  const h=harness('reviews'),gate=deferred(),entered=deferred();let pages=0;
  h.api.listReviews=async()=>{pages++;entered.resolve();await gate.promise;return Array.from({length:100},(_,i)=>({id:String(i),created_at:'2026-10-17T00:00:00Z'}));};
  const pending=h.api.listReviewCollection({userId:friend});await entered.promise;h.transition(kind);gate.resolve();
  await assert.rejects(pending,stale);assert.equal(pages,1);
});
test('current-session reviews preserve filters, body, fractional score, spoiler, media, replies and own reactions',async()=>{
  const h=harness('reviews'),rows=await actions.reviews(h),r=rows[0];
  assert.equal(r.rating,4.25);assert.equal(r.body,'review');assert.equal(r.spoiler,true);
  assert.equal(r.images[0],'signed:target/review-image');assert.equal(r.profile.avatar,'signed:target/avatar');
  assert.equal(r.comments[0].profile.avatar,'signed:target/comment-avatar');assert.equal(r.reactions.heart,1);assert.equal(r.reactions.mine.heart,true);
  assert.ok(h.calls.some(c=>c.method==='eq'&&c.args[0]==='user_id'&&c.args[1]===friend));
});
test('current posts preserve attachment, replies and current-owner reaction',async()=>{
  const h=harness('posts'),r=(await actions.posts(h))[0];
  assert.equal(r.attachment.image,'signed:target/attachment');assert.equal(r.attachment.items[0].image,'signed:target/attachment-item');
  assert.equal(r.replyCount,1);assert.equal(r.reactions.like,1);assert.equal(r.reactions.mine.like,true);
});
test('current friend shelves use only followed public metadata',async()=>{
  const h=harness('friends'),value=await actions.friends(h);
  assert.equal(value.followingIds[0],friend);assert.equal(value.ratings[0].rating,4.25);
  assert.equal(value.ratings[0].profile.avatar,'signed:target/avatar');assert.equal(value.limited,false);
  const select=h.calls.find(c=>c.table==='reviews'&&c.method==='select').args[0];assert.ok(!select.includes('body')&&!select.includes('image_urls'));
});
test('current chapter reviews retain pagination, spoiler and avatar',async()=>{
  const h=harness('chapters'),r=(await actions.chapters(h))[0];
  assert.equal(r.rating,3.75);assert.equal(r.spoiler,true);assert.equal(r.profile.avatar,'signed:target/chapter-avatar');
  const range=h.calls.find(c=>c.method==='range');assert.deepEqual(Array.from(range.args),[20,39]);
});
test('collection retains stable page cursor and deduplicates without changing the target owner',async()=>{
  const h=harness('reviews'),seen=[];let count=0;
  h.api.listReviews=async opts=>{seen.push(opts);return ++count===1?Array.from({length:100},(_,i)=>({id:String(i),created_at:'2026-10-17T00:00:00Z'})):[{id:'99'},{id:'100'}];};
  const result=await h.api.listReviewCollection({userId:friend});assert.equal(result.length,101);
  assert.equal(seen[1].before.id,'99');assert.equal(seen[1].userId,friend);
});
test('media signing failures keep current-session text and fallback without suppressing database errors',async()=>{
  const h=harness('reviews');for(const k of ['avatar','comment-avatar','review-image'])h.hooks[k]=async()=>{throw Error('media offline');};
  const r=(await actions.reviews(h))[0];assert.equal(r.body,'review');assert.equal(r.images.length,0);assert.equal(r.profile.avatar,'');
  const bad=harness('posts');bad.hooks.posts=async()=>({error:Error('query failed')});await assert.rejects(actions.posts(bad),/query failed/);
});
test('demo readers keep empty contracts and do not query live services',async()=>{
  const h=harness('reviews');h.api.mode='demo';
  for(const action of ['reviews','posts','chapters'])assert.equal((await actions[action](h)).length,0);
  const friends=await actions.friends(h);assert.equal(friends.ratings.length,0);assert.equal(friends.followingIds.length,0);
  assert.equal((await h.api.listReviewCollection({userId:friend})).length,0);assert.equal(h.calls.length,0);
});

test('a changed request cannot launch the next bounded friend batch',async()=>{
  const h=harness('friends'),gate=deferred(),entered=deferred();let reads=0;
  const ids=Array.from({length:201},(_,i)=>'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
  h.api.getFollowedProfileIds=async()=>ids;
  h.hooks.reviews=async value=>{reads++;if(reads===1){entered.resolve();await gate.promise;}return value;};
  const pending=h.api.listFriendRatings();await entered.promise;h.transition('client');gate.resolve();
  await assert.rejects(pending,stale);assert.equal(reads,3);
});
