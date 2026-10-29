const test=require('node:test'),assert=require('node:assert/strict');
const make=options=>require('../tools/catalog-provider-gateway.js').create(options);
test('gateway fixes upstream origins, validates entity paths and never forwards client credentials',async()=>{
  const calls=[],g=make({allowAnonymousGcd:true,fetch:async(url,init)=>{calls.push({url,init});return new Response('{}',{status:200});},sleep:async()=>{},env:{GOOGLE_BOOKS_API_KEY:'server-only'}});
  assert.equal((await g.request('bookbrainz',new URLSearchParams('path=https://evil.test'))).status,400);
  assert.equal((await g.request('gcd',new URLSearchParams('q=Watchmen&page=1&next=https://evil.test'))).status,200);
  assert.ok(calls[0].url.startsWith('https://www.comics.org/api/series/name/Watchmen/'));
  await g.request('googlebooks',new URLSearchParams('q=Watchmen&key=client-key'));
  assert.equal(new URL(calls.at(-1).url).searchParams.get('key'),'server-only');
  assert.equal(calls[0].init.headers.Authorization,undefined);
});
test('identical searches share one in-flight request and successful cached results',async()=>{
  let count=0;const g=make({fetch:async()=>{count++;return new Response('{"docs":[]}',{status:200});},sleep:async()=>{}}),q=new URLSearchParams('q=Dune&limit=3');
  await Promise.all([g.request('openlibrary',q),g.request('openlibrary',q)]);await g.request('openlibrary',q);assert.equal(count,1);
});
test('rate-limit failures are not cached as empty results and respect Retry-After',async()=>{
  let now=0,count=0;const g=make({now:()=>now,sleep:async()=>{},fetch:async()=>{count++;return new Response('{}',{status:429,headers:{'Retry-After':'30'}});}}),q=new URLSearchParams('q=Dune');
  assert.equal((await g.request('openlibrary',q)).status,429);
  assert.equal((await g.request('openlibrary',q)).status,429);assert.equal(count,1);
  now=31000;await g.request('openlibrary',q);assert.equal(count,2);
});
test('anonymous GCD access is bounded and cannot become an unrestricted production backend',async()=>{
  const g=make({allowAnonymousGcd:false,fetch:async()=>new Response('{}'),sleep:async()=>{},env:{}});
  assert.equal((await g.request('gcd',new URLSearchParams('q=Dune'))).status,503);
});
