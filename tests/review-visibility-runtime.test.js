const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'backend/lorefy-backend.js'), 'utf8');
const id = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const row = (n, user = 'other', work = 'hunter') => ({ id:id(n), user_id:user, work_id:work, rating:4, body:'Review', created_at:'2026-10-01T00:00:00Z' });
const flush = async () => { for (let i = 0; i < 12; i++) await new Promise(resolve => setImmediate(resolve)); };

function effectHarness() {
  const start = app.indexOf('useEffect(()=>{const e=window.LorefyBackend;if(!e||e.mode!=="live"||!e.listReviews)return;');
  const end = app.indexOf('},[]);useEffect(', start);
  assert.ok(start >= 0 && end > start);
  const listeners = new Map(), calls = [];
  let reviews = [], feed = [row(1), row(2, 'reader')], own = [row(2, 'reader'), row(101, 'reader', 'old-work')];
  const api = { mode:'live', user:{id:'reader'},
    listReviews:async options => { calls.push(options); return options.userId ? feed.filter(r => r.user_id === options.userId) : feed; },
    listReviewCollection:async options => { calls.push(options); return options.userId === 'reader' ? own : feed.filter(r => r.user_id === options.userId); }
  };
  const window = { LorefyBackend:api, addEventListener:(name,fn)=>listeners.set(name,fn), removeEventListener(){}, dispatchEvent(){} };
  const scope = { window, console, document:{hidden:false,addEventListener(){},removeEventListener(){}},
    CustomEvent:function(name,options){this.type=name;this.detail=options?.detail;},
    setInterval:()=>0,clearInterval(){},useEffect:fn=>fn(),
    Io(){},co(){},po(){},fo:fn=>{ reviews = fn(reviews); },Ye(){},S(){},setCloudFollowers(){},setCloudFollowing(){}
  };
  vm.runInNewContext(app.slice(start,end+6),scope);
  return { api, calls, reviews:()=>reviews, event:async(name,detail)=>{listeners.get(name)?.({detail});await flush();}, setFeed:value=>{feed=value;},setOwn:value=>{own=value;} };
}

test('opening a reader profile does not remove other readers from the shared review collection', async () => {
  const h = effectHarness(); await flush();
  await h.event('lorefy:open-reader-profile',{id:'other'});
  assert.ok(h.reviews().some(r=>r.id===id(2)), 'own review disappeared after a profile-only response');
});

test('own older reviews survive the latest-100 timeline boundary and subsequent refreshes', async () => {
  const h = effectHarness(); await flush();
  assert.ok(h.reviews().some(r=>r.id===id(101)), 'own review beyond feed window was not loaded');
  await h.event('lorefy:community-refresh');
  assert.ok(h.reviews().some(r=>r.id===id(101)));
});

test('late review responses from a previous account are ignored', async () => {
  const h = effectHarness(); await flush();
  let release;
  h.api.listReviews=()=>new Promise(resolve=>{release=resolve;});
  const pending=h.event('lorefy:community-refresh'); await flush();
  h.api.user={id:'next-reader'};
  release([row(9,'reader')]); await pending;
  assert.equal(h.reviews().some(r=>r.id===id(9)),false);
});

test('refresh removes deleted cloud reviews rather than retaining an indefinite cached union', async () => {
  const h = effectHarness(); await flush();
  h.setFeed([]);h.setOwn([]);
  await h.event('lorefy:community-refresh');
  assert.equal(h.reviews().length,0);
});

test('older timeline reviews load on demand without discarding the first page', async () => {
  const h=effectHarness();await flush();
  const first=Array.from({length:100},(_,i)=>row(i+1));
  h.api.listReviews=async options=>options.before?[row(150)]:first;
  await h.event('lorefy:community-refresh');
  await h.event('lorefy:load-more-reviews');
  assert.ok(h.reviews().some(r=>r.id===id(150)));
  assert.ok(h.reviews().some(r=>r.id===id(1)));
});

test('opening a work loads reviews outside the global feed window', async () => {
  const h=effectHarness();await flush();
  h.api.listReviewCollection=async options=>options.workId?[row(160,'other','old-work')]:[];
  await h.event('lorefy:load-work-reviews',{workId:'old-work'});
  assert.ok(h.reviews().some(r=>r.id===id(160)));
  assert.ok(h.reviews().some(r=>r.id===id(1)));
});

test('publishing a review preserves reviews by other authors for the same work', async () => {
  const start=app.indexOf('tr=async()=>'),end=app.indexOf(',qo=async',start);
  let reviews=[{id:id(1),mid:'hunter',userId:'other'},{id:id(2),mid:'hunter',userId:'me'}];
  const scope={window:{dispatchEvent(){},LorefyBackend:null,localStorage:{getItem:key=>key==='lorefy.activeUser.v1'?'reader':null}},CustomEvent:function(){},m:{id:'hunter',title:'Hunter'},G:4,J:'Reader',Y:'reader',Z:'',Fe:null,se:false,ct:{current:'My review'},ft:[],ze:{},pt:{current:''},gt:false,
    fo:fn=>{reviews=fn(reviews);},Zn(){},ht(){},Wo(){},bo(){},setTimeout(){},Se(){},dt(){},no(){},ro(){},io(){},A(){}};
  vm.createContext(scope);
  const guardStart=app.indexOf('function lorefyReviewRequestScope(');
  assert.ok(guardStart>=0);
  vm.runInContext(app.slice(guardStart,app.indexOf('const{useState',guardStart)),scope);
  scope.reviewEditor={current:{owner:scope.lorefyReviewRequestScope(),workId:'hunter',id:1,closed:false}};
  vm.runInContext('var '+app.slice(start,end)+';',scope);await scope.tr();
  assert.ok(reviews.some(r=>r.userId==='other'));
  assert.equal(reviews.filter(r=>r.userId==='me'&&r.mid==='hunter').length,1);
});

test('completed-work review evidence excludes other readers', () => {
  const start=app.indexOf('const Un=new Set('),end=app.indexOf(',de=',start);
  const scope={M:[{mid:'other-work',userId:'other'},{mid:'mine',userId:'me'}],Y:'reader',window:{LorefyBackend:{user:{id:'reader'}}}};
  vm.runInNewContext(app.slice(start,end)+';globalThis.result=[...Un];',scope);
  assert.deepEqual(Array.from(scope.result),['mine']);
});

test('review queries have a stable tie-breaker and accept only validated older-page cursors', async () => {
  const start=backend.indexOf('    listReviews: async function('),end=backend.indexOf('    publishCommunityPost:',start);
  const calls=[];
  const query={select(){return this;},order(...args){calls.push(['order',...args]);return this;},limit(){return this;},eq(){return this;},or(value){calls.push(['or',value]);return this;},then(resolve){return Promise.resolve({data:[]}).then(resolve);}};
  const scope={isUuid:value=>/^[0-9a-f-]{36}$/.test(value)};
  vm.runInNewContext('var B={'+backend.slice(start,end)+'};',scope);
  Object.assign(scope.B,{mode:'live',client:{from:()=>query}});
  await scope.B.listReviews({before:{id:id(100),created_at:'2026-10-01T00:00:00Z'}});
  assert.ok(calls.some(c=>c[0]==='order'&&c[1]==='id'));
  assert.ok(calls.some(c=>c[0]==='or'&&c[1].includes('id.lt.'+id(100))));
  calls.length=0;
  await scope.B.listReviews({before:{id:'bad,filter',created_at:'bad'}});
  assert.equal(calls.some(c=>c[0]==='or'),false);
});

test('scoped collection fetches every page and keeps tied timestamps without duplicate rows', async () => {
  const start=backend.indexOf('    listReviewCollection: async function('),end=backend.indexOf('    publishCommunityPost:',start);
  const scope={invalidSessionError:()=>new Error('Account changed')};
  vm.runInNewContext('var B={'+backend.slice(start,end)+'};',scope);
  const pages=[Array.from({length:100},(_,i)=>row(i+1,'reader')),[row(100,'reader'),row(101,'reader')]];
  const calls=[];
  Object.assign(scope.B,{user:{id:'reader'},listReviews:async options=>{calls.push(options);return pages.shift();}});
  const result=await scope.B.listReviewCollection({userId:'reader'});
  assert.equal(result.length,101);
  assert.equal(calls[1].before.id,id(100));
  assert.equal(calls[1].userId,'reader');
  await assert.rejects(scope.B.listReviewCollection({}),/scoped/);
});
