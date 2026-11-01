const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
const start=source.indexOf('let i=false,n=null,feedPages=1,feedBusy=false;'),end=source.indexOf('},[]);useEffect',start);
const settle=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
function mount(options={}){
 const events={},timers=new Map(),counts={reviews:0,own:0,followers:0,following:0};let serial=0,notify,rows=[];
 const backend={user:{id:'owner'},getSession:async()=>({userId:'owner'}),
  listReviews:async()=>{counts.reviews++;return options.listReviews?options.listReviews(counts.reviews):[];},
  listReviewCollection:async()=>{counts.own++;return [];},
  listProfileFollowers:async()=>{counts.followers++;return [];},listProfileFollowing:async()=>{counts.following++;return [];},
  subscribeCommunity:async cb=>{notify=cb;return()=>{};}};
 const noop=()=>{},window={addEventListener:(name,fn)=>events[name]=fn,removeEventListener:noop,dispatchEvent:noop,
  LorefyPageRefresh:{register:()=>noop}};
 const scope={window,e:backend,document:{hidden:false,addEventListener:noop,removeEventListener:noop},
  CustomEvent:class{},console:{warn:noop},localStorage:{getItem:()=>null},
  setTimeout:(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;},clearTimeout:id=>timers.delete(id),
  Io:noop,co:noop,po:noop,fo:update=>{rows=update(rows);},setCloudFollowers:noop,setCloudFollowing:noop};
 const cleanup=vm.runInNewContext('(function(){'+source.slice(start,end)+'})()',scope);
 return{counts,cleanup,rows:()=>rows,emit:table=>notify({table}),events,
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
