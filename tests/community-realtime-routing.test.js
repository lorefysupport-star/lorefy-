const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
const start=source.indexOf('let i=false,n=null,feedPages=1,feedBusy=false;'),end=source.indexOf('},[]);useEffect',start);
const settle=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
function mount(options={}){
 const events={},timers=new Map(),counts={reviews:0,own:0,followers:0,following:0},queries=[],notices=[];let serial=0,notify,rows=[];
 const backend={user:{id:'owner'},getSession:async()=>({userId:'owner'}),
  listReviews:async opts=>{queries.push(opts);counts.reviews++;return options.listReviews?options.listReviews(counts.reviews,opts):[];},
  listReviewCollection:async()=>{counts.own++;return [];},
  listProfileFollowers:async()=>{counts.followers++;return [];},listProfileFollowing:async()=>{counts.following++;return [];},
  subscribeCommunity:async cb=>{notify=cb;return()=>{};}};
 const noop=()=>{},window={addEventListener:(name,fn)=>events[name]=fn,removeEventListener:noop,dispatchEvent:event=>notices.push(event),
  LorefyPageRefresh:{register:()=>noop}};
 const scope={window,e:backend,document:{hidden:false,addEventListener:noop,removeEventListener:noop},
  CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail;}},console:{warn:noop},localStorage:{getItem:()=>null},
  setTimeout:(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;},clearTimeout:id=>timers.delete(id),
  Io:noop,co:noop,po:noop,fo:update=>{rows=update(rows);},setCloudFollowers:noop,setCloudFollowing:noop};
 const cleanup=vm.runInNewContext('(function(){'+source.slice(start,end)+'})()',scope);
 return{backend,counts,queries,notices,cleanup,rows:()=>rows,emit:table=>notify(typeof table==='string'?{table}:table),events,
  flush(){const jobs=[...timers].filter(([,job])=>job.ms<=200);for(const[id,job]of jobs){timers.delete(id);job.fn();}},
  reset(){for(const key in counts)counts[key]=0;}};
}

test('a burst of review reactions performs one review refresh and no social graph queries',async()=>{
 const h=mount();await settle();h.reset();
 for(let i=0;i<20;i++)h.emit('review_reactions');
 assert.equal(h.counts.reviews,0,'realtime burst is scheduled, not dispatched per event');
 h.flush();await settle();
 assert.equal(h.counts.reviews,1);assert.equal(h.counts.own,1);
 assert.equal(h.counts.followers,0);assert.equal(h.counts.following,0);h.cleanup();
});

test('loaded review reaction bursts fetch only the affected review, not all collections',async()=>{
 const row={id:'11111111-1111-4111-8111-111111111111',user_id:'friend',work_id:'work',rating:4,created_at:'2026-11-01',reactions:{like:1}};
 const h=mount({listReviews:(count,opts)=>[{...row,reactions:{like:opts.reviewId?8:1}}]});await settle();h.reset();
 for(let i=0;i<20;i++)h.emit({table:'review_reactions',new:{review_id:row.id}});
 h.flush();await settle();assert.equal(h.counts.reviews,1);assert.equal(h.queries.at(-1).reviewId,row.id);
 assert.equal(h.counts.own,0);assert.equal(h.rows()[0].likeCount,8);h.cleanup();
});

test('reaction events for unloaded reviews do not reread the timeline',async()=>{
 const h=mount();await settle();h.reset();h.emit({table:'review_comments',new:{review_id:'offscreen'}});h.flush();await settle();
 assert.equal(h.counts.reviews,0);assert.equal(h.counts.own,0);h.cleanup();
});

test('new remote reviews announce availability instead of replacing the reading timeline',async()=>{
 const h=mount();await settle();h.reset();
 h.emit({table:'reviews',eventType:'INSERT',new:{id:'new-review',user_id:'other'}});h.flush();await settle();
 assert.equal(h.counts.reviews,0);assert.ok(h.notices.some(e=>e.detail?.updates===true));
 await h.events['lorefy:community-refresh']();await settle();assert.equal(h.counts.reviews,1);
 assert.equal(h.notices.at(-1).detail.updates,false);h.cleanup();
});

test('an insert arriving after a refresh started keeps the new-activity notice after that older response',async()=>{
 let release;const h=mount({listReviews:count=>count===1?new Promise(r=>release=r):[]});await settle();
 h.emit({table:'reviews',eventType:'INSERT',new:{id:'arrived-later',user_id:'other'}});release([]);await settle();
 assert.equal(h.notices.at(-1).detail.updates,true);
 await h.events['lorefy:community-refresh']();await settle();assert.equal(h.notices.at(-1).detail.updates,false);h.cleanup();
});

test('targeted withdrawal removes the review from every loaded snapshot without clearing other cards',async()=>{
 const a={id:'11111111-1111-4111-8111-111111111111',user_id:'friend',work_id:'a',rating:4,created_at:'2026-11-01'},b={...a,id:'22222222-2222-4222-8222-222222222222',work_id:'b'};
 const h=mount({listReviews:(count,opts)=>opts.reviewId?[]:[a,b]});await settle();h.reset();
 h.emit({table:'reviews',old:{id:a.id}});h.flush();await settle();assert.deepEqual(Array.from(h.rows(),row=>row.id),[b.id]);h.cleanup();
});

test('manual refresh waits for a bounded target read, then still refreshes the full timeline',async()=>{
 const row={id:'11111111-1111-4111-8111-111111111111',user_id:'friend',work_id:'work',rating:4,created_at:'2026-11-01'};let release;
 const h=mount({listReviews:(count,opts)=>opts.reviewId?new Promise(r=>release=r):[row]});await settle();h.reset();
 h.emit({table:'review_reactions',new:{review_id:row.id}});h.flush();await settle();
 const manual=h.events['lorefy:community-refresh']();await settle();assert.equal(h.counts.reviews,1);
 release([row]);await manual;await settle();assert.equal(h.counts.reviews,2);assert.equal(h.counts.own,1);h.cleanup();
});

test('a follow event in the same burst cannot drop a targeted review update',async()=>{
 const row={id:'11111111-1111-4111-8111-111111111111',user_id:'friend',work_id:'work',rating:4,created_at:'2026-11-01'};
 const h=mount({listReviews:()=>[row]});await settle();h.reset();
 h.emit({table:'review_reactions',new:{review_id:row.id}});h.emit('profile_follows');h.flush();await settle();
 assert.equal(h.counts.followers,1);assert.equal(h.queries.at(-1).reviewId,row.id);h.cleanup();
});

test('a target result after account replacement cannot replace the visible reviews',async()=>{
 const row={id:'11111111-1111-4111-8111-111111111111',user_id:'friend',work_id:'work',rating:4,created_at:'2026-11-01'};let release;
 const h=mount({listReviews:(count,opts)=>opts.reviewId?new Promise(r=>release=r):[row]});await settle();
 h.emit({table:'review_reactions',new:{review_id:row.id}});h.flush();await settle();
 h.backend.user={id:'other'};release([{...row,rating:1}]);await settle();assert.equal(h.rows()[0].r,4);h.cleanup();
});

test('post events do not reload review collections or social graph',async()=>{
 const h=mount();await settle();h.reset();h.emit('community_posts');h.emit('community_post_reactions');h.flush();await settle();
 assert.deepEqual(h.counts,{reviews:0,own:0,followers:0,following:0});h.cleanup();
});

test('follow events refresh the graph without fetching all reviews',async()=>{
 const h=mount();await settle();h.reset();h.emit('profile_follows');h.flush();await settle();
 assert.deepEqual(h.counts,{reviews:0,own:0,followers:1,following:1});h.cleanup();
});

test('realtime events received during a request get one trailing catch-up with the latest rows',async()=>{
 let release;const old=new Promise(resolve=>release=resolve);
 const fresh={id:'11111111-1111-4111-8111-111111111111',user_id:'friend',work_id:'work',rating:4,created_at:'2026-11-01T00:00:00Z'};
 const h=mount({listReviews:count=>count===1?old:[fresh]});
 for(let i=0;i<10;i++)h.emit('reviews');h.flush();release([]);await settle();h.flush();await settle();
 assert.equal(h.counts.reviews,2);assert.equal(h.rows()[0]?.id,fresh.id);h.cleanup();
});

test('unmount cancels a queued realtime refresh before it dispatches',async()=>{
 const h=mount();await settle();h.reset();h.emit('reviews');h.cleanup();h.flush();await settle();
 assert.equal(h.counts.reviews,0);
});
