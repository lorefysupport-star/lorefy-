const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fresh(){const scope={module:{exports:{}},AbortController,setTimeout,clearTimeout,URL};vm.runInNewContext(fs.readFileSync('modules/lorefy-chapter-metadata.js','utf8'),scope);return scope.module.exports;}
function response(numbers){return{ok:true,json:async()=>({query:{pages:Object.fromEntries(numbers.map(n=>[n,{title:'Chapter '+n,pageimage:'Chapter_'+n+'.png',thumbnail:{source:'https://static.wikia.nocookie.net/hunterxhunter/images/a/a1/Chapter_'+n+'.png'},revisions:[{slots:{main:{'*':'|chapter title = Title '+n}}}]}]))}})};}
const work='mal-manga-26-hunter-x-hunter';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('repeated chapter renders share one pending metadata request and retain source images',async()=>{
 const api=fresh();let calls=0;const releases=[];
 const fetcher=()=>{calls++;return new Promise(resolve=>releases.push(resolve));};
 const jobs=[api.load(work,[1,2],fetcher),api.load(work,[1,2],fetcher),api.load(work,[1,2],fetcher)];
 await tick();const count=calls;releases.forEach(release=>release(response([1,2])));const rows=await Promise.all(jobs);
 assert.equal(count,1,'same visible chapter group starts one request');
 for(const row of rows){assert.equal(row[1].title,'Title 1');assert.match(row[1].image,/hunterxhunter\/images/);assert.equal(row[2].number,2);}
 await api.load(work,[2,1],fetcher);assert.equal(calls,1,'completed data is reused');
});

test('alias identities and reordered repeated chapter inputs share the same pending group',async()=>{
 const api=fresh();let calls=0;const releases=[];
 const fetcher=()=>{calls++;return new Promise(resolve=>releases.push(resolve));};
 const a=api.load(work,[2,1,1],fetcher),b=api.load('anilist-30026',[1,2],fetcher);
 await tick();const count=calls;releases.forEach(release=>release(response([1,2])));const rows=await Promise.all([a,b]);assert.equal(count,1);
 assert.deepEqual(Object.keys(rows[0]).sort(),['1','2']);assert.deepEqual(Object.keys(rows[1]).sort(),['1','2']);
});

test('a failed shared request releases every consumer and can be retried without poisoned cache',async()=>{
 const api=fresh();let calls=0;const rejects=[];
 const fetcher=()=>{calls++;return new Promise((_,fail)=>rejects.push(fail));};
 const first=api.load(work,[1],fetcher),second=api.load(work,[1],fetcher),settled=Promise.allSettled([first,second]);
 await tick();const count=calls;rejects.forEach(reject=>reject(new Error('offline')));assert.ok((await settled).every(r=>r.status==='rejected'));assert.equal(count,1);
 const row=await api.load(work,[1],async()=>{calls++;return response([1]);});assert.equal(row[1].title,'Title 1');assert.equal(calls,2);
});

test('different source works and chapter groups do not reuse unrelated in-flight data',async()=>{
 const api=fresh(),requests=[],releases=[];
 const fetcher=url=>{requests.push(url);return new Promise(resolve=>releases.push(resolve));};
 const jobs=[api.load(work,[1],fetcher),api.load(work,[2],fetcher),api.load('mal-manga-16765-kingdom',[1],fetcher)];
 await tick();assert.equal(requests.length,3);releases.forEach((r,i)=>r(response([i===1?2:1])));
 const [one,two,other]=await Promise.all(jobs);assert.deepEqual(Object.keys(one),['1']);assert.deepEqual(Object.keys(two),['2']);assert.equal(other[1].image,'','image namespace stays bound to its work');
});

test('unsupported work identities never start shared or direct requests',async()=>{
 const api=fresh();let calls=0;assert.deepEqual(Object.keys(await api.load('unknown',[1],async()=>{calls++;return response([1]);})),[]);assert.equal(calls,0);
});
