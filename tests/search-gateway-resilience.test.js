const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/lorefy-public/index.ts','utf8'));
function harness(fetch){let handler;vm.runInNewContext(source,{Deno:{serve:fn=>handler=fn},fetch,URL,URLSearchParams,Response,Request,TextEncoder,TextDecoder,AbortSignal,Uint8Array,console});return path=>handler(new Request('https://example.test/functions/v1/lorefy-public/'+path));}
test('rate limits remain retryable and browser consumers can read backoff headers',async()=>{
 const handle=harness(async()=>new Response('{"error":"rate limit"}',{status:429,headers:{'Retry-After':'37','X-RateLimit-Remaining':'0','X-RateLimit-Reset':'1234'}}));
 const response=await handle('catalog-mangadex?title=Fixture');assert.equal(response.status,429);
 assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('retry-after'),'37');
 assert.equal(response.headers.get('x-ratelimit-remaining'),'0');assert.match(response.headers.get('access-control-expose-headers'),/Retry-After/i);
});
test('transient provider failures are not public cached for five minutes',async()=>{
 const handle=harness(async()=>new Response('temporary',{status:503}));
 const response=await handle('catalog-openlibrary?q=Fixture');assert.equal(response.headers.get('cache-control'),'no-store');
});
test('successful public metadata remains cacheable and invalid routes remain rejected',async()=>{
 const handle=harness(async()=>new Response('{"docs":[]}'));
 const response=await handle('catalog-openlibrary?q=Fixture');assert.equal(response.headers.get('cache-control'),'public, max-age=300');
 assert.deepEqual(await response.json(),{docs:[]});assert.equal((await handle('catalog-jikan?path=../private')).status,400);
});
test('oversized chunked metadata is stopped before allocating the complete upstream response',async()=>{
 let reads=0,cancelled=false;
 const handle=harness(async()=>({ok:true,status:200,headers:new Headers(),body:{getReader:()=>({async read(){reads++;return {done:false,value:new Uint8Array(1024*1024)};},async cancel(){cancelled=true;},releaseLock(){}})},arrayBuffer(){throw Error('unbounded buffer must not be used');}}));
 const response=await handle('catalog-openlibrary?q=Fixture');assert.equal(response.status,413);assert.equal(cancelled,true);assert.equal(reads,5);
});
test('catalog error handling preserves successful cover/media HTTP caching',async()=>{
 const url='https://covers.openlibrary.org/b/id/1-L.jpg';
 const handle=harness(async()=>({ok:true,url,headers:new Headers({'Content-Type':'image/jpeg'}),arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer}));
 const response=await handle('media?url='+encodeURIComponent(url));assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'public, max-age=86400, stale-while-revalidate=604800');
});
