const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const apiSource=fs.readFileSync('modules/lorefy-api-catalog.js','utf8');
const CACHE='lorefy.api.catalog.cache.v3';
const media={id:99,title:{english:'Attack on Titan',romaji:'Shingeki no Kyojin',native:'進撃の巨人'},synonyms:['هجوم العمالقة','AOT'],countryOfOrigin:'JP',format:'MANGA'};
function harness(fetcher,extra={}){
 const store=new Map(),calls=[];let cacheParses=0;
 const window={document:{readyState:'loading',addEventListener(){}},location:{hostname:'lorefy.app',search:''},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout,clearTimeout,AbortController,
 LOREFY_REMOTE_CATALOG:{requestTimeoutMs:100,providers:{mangaDex:false,googleBooks:false}},
 LorefyCatalogIdentity:require('../modules/lorefy-catalog-identity.js'),
 fetch:(url,init)=>{calls.push({url:String(url),init});return fetcher(String(url),init);},...extra};
 const JSONProbe={stringify:JSON.stringify,parse(value){if(value&&value.includes('"works"'))cacheParses++;return JSON.parse(value);}};
 vm.runInNewContext(apiSource,{window,URL,URLSearchParams,AbortController,JSON:JSONProbe});
 return {window,api:window.LorefyApiCatalog,store,calls,cacheParses:()=>cacheParses};
}
const json=value=>new Response(JSON.stringify(value));
test('AniList preserves romanized, native, synonym and Arabic titles on the same stable work',async()=>{
 const h=harness(async()=>json({data:{Page:{media:[media]}}}));
 const result=await h.api.search('Shingeki no Kyojin','Manga',{providers:['anilist']});
 const work=result.works[0];assert.equal(work.id,'api-anilist-99-attack-on-titan');
 for(const title of ['Shingeki no Kyojin','進撃の巨人','هجوم العمالقة','AOT'])assert.ok(work.altTitles?.includes(title),title);
 assert.equal(work.ar,'هجوم العمالقة');assert.ok(JSON.parse(h.calls[0].init.body).query.includes('synonyms'));
});
test('MangaDex keeps every language alias and gives Arabic its own display field',async()=>{
 const h=harness(async()=>json({data:[{id:'fixture',attributes:{title:{en:'Attack on Titan',ja_ro:'Shingeki no Kyojin'},altTitles:[{en:'AOT'},{ar:'هجوم العمالقة'}],originalLanguage:'ja'}}]}));
 h.window.LOREFY_REMOTE_CATALOG.providers.mangaDex=true;
 const result=await h.api.search('Shingeki','Manga',{providers:['mangaDex']});const work=result.works[0];
 assert.equal(work.id,'md-fixture');assert.equal(work.ar,'هجوم العمالقة');
 for(const title of ['Shingeki no Kyojin','AOT','هجوم العمالقة'])assert.ok(work.altTitles?.includes(title),title);
});
test('fresh provider aliases enrich an existing identical work without replacing curated or saved fields',async()=>{
 const existing={id:'api-anilist-99-attack-on-titan',anilistId:99,title:'Attack on Titan',ar:'عنوان عربي منسق',type:'مانجا',mySt:'reading',prog:{ch:70}};
 const h=harness(async()=>json({data:{Page:{media:[media]}}}),{LorefyMangaData:[existing]});let ingests=0;
 h.window.__lorefyIngest=()=>ingests++;
 const result=await h.api.search('Shingeki','Manga',{providers:['anilist'],force:true});
 assert.equal(result.added,0);assert.equal(result.updatedWorks,1);assert.equal(existing.ar,'عنوان عربي منسق');
 assert.ok(existing.altTitles.includes('Shingeki no Kyojin'));assert.equal(existing.mySt,'reading');assert.equal(existing.prog.ch,70);assert.equal(ingests,1);
 await h.api.search('Shingeki','Manga',{providers:['anilist'],force:true});assert.equal(ingests,1,'unchanged aliases must not repeat ingestion');
});
test('GraphQL errors and malformed payloads remain retryable failures, never fourteen day empty cache hits',async()=>{
 for(const payload of [{errors:[{message:'Too many requests',status:429}]},{data:{Page:null}}]){
  const h=harness(async()=>json(payload));
  const result=await h.api.search('Fixture','Manga',{providers:['anilist']});
  assert.equal(result.providerErrors.length,1);assert.equal(h.store.has(CACHE),false);
 }
});
test('larger page sizes cannot hit a cache populated by a smaller lookup',async()=>{
 const h=harness(async()=>json({data:{Page:{media:[media]}}}));
 await h.api.search('Fixture','Manga',{providers:['anilist'],perPage:1});
 const result=await h.api.search('Fixture','Manga',{providers:['anilist'],perPage:50});
 assert.equal(h.calls.length,2);assert.notEqual(result.cached,true);
});
test('different Unicode queries cannot collide after Latin-only identifier normalization',async()=>{
 const h=harness(async()=>json({data:{Page:{media:[media]}}}));
 await h.api.search('進撃の巨人','Manga',{providers:['anilist']});
 await h.api.search('鬼滅の刃','Manga',{providers:['anilist']});
 assert.equal(h.calls.length,2);
});
test('explicit provider lists cannot dispatch the same source twice',async()=>{
 const h=harness(async()=>json({data:{Page:{media:[media]}}}));
 const result=await h.api.search('Fixture','Manga',{providers:['anilist','anilist']});
 assert.equal(h.calls.length,1);assert.equal(result.providers.length,1);
});
test('evicted batches cannot claim the remaining subset is the complete search response',async()=>{
 const records=Array.from({length:8},(_,i)=>({...media,id:200+i,title:{romaji:'Fixture '+i},description:'x'.repeat(90000)}));
 const h=harness(async()=>json({data:{Page:{media:records}}}));
 await h.api.search('Fixture','Manga',{providers:['anilist']});
 const cache=JSON.parse(h.store.get(CACHE));assert.ok(cache.works.length<records.length);
 await h.api.search('Fixture','Manga',{providers:['anilist']});assert.equal(h.calls.length,2);
});
test('partial cached successes still report unavailable providers until a successful retry',async()=>{
 const h=harness(async url=>{if(url.includes('mangadex'))throw Error('source unavailable');return json({data:{Page:{media:[media]}}});});
 h.window.LOREFY_REMOTE_CATALOG.providers.mangaDex=true;
 await h.api.search('Fixture','Manga',{providers:['anilist','mangaDex']});
 const result=await h.api.search('Fixture','Manga',{providers:['anilist','mangaDex']});
 assert.equal(result.cached,true);assert.equal(result.providerErrors?.length,1);assert.equal(h.api.state().status,'partial');assert.equal(h.calls.length,2);
});
test('unchanged cached metadata is parsed once while external storage edits stay visible',()=>{
 const h=harness(async()=>json({}));
 h.store.set(CACHE,JSON.stringify({works:[{id:'x',title:'Fixture',type:'كتاب'}],batches:{}}));
 for(let i=0;i<5;i++)assert.equal(h.api.state().cachedWorks,1);
 assert.equal(h.cacheParses(),1);
 h.store.set(CACHE,JSON.stringify({works:[],batches:{}}));assert.equal(h.api.state().cachedWorks,0);assert.equal(h.cacheParses(),2);
});
test('cached metadata is rechecked if a late policy module changes eligibility',()=>{
 const h=harness(async()=>json({}));h.store.set(CACHE,JSON.stringify({works:[{id:'x',title:'Fixture',type:'كتاب'}],batches:{}}));
 assert.equal(h.api.state().cachedWorks,1);
 h.window.LorefyCatalogPolicy={isExcludedWork:()=>true,isExplicitWork:()=>false,isAiGeneratedWork:()=>false};
 assert.equal(h.api.state().cachedWorks,0);
});
test('reused metadata snapshots cannot retain later library edits from mutable catalog records',async()=>{
 let id=100;const h=harness(async()=>json({data:{Page:{media:[{...media,id:id++}]}}}));
 await h.api.search('First','Manga',{providers:['anilist']});
 h.window.LorefyMangaData[0].mySt='private library state';h.window.LorefyMangaData[0].prog.ch=70;
 await h.api.search('Second','Manga',{providers:['anilist']});
 const original=JSON.parse(h.store.get(CACHE)).works.find(work=>work.anilistId===100);
 assert.equal(original.mySt,null);assert.equal(original.prog.ch,0);
});
test('typed book-family searches honor explicit source categories instead of relabeling other formats',async()=>{
 for(const [requested,subjects]of [['Novel',['Comics']],['Comics',['Fiction']],['Light Novel',['Nonfiction']],['Book',['Fiction']]]){
  const h=harness(async()=>json({docs:[{key:'/works/OL1W',title:'Fixture',subject:subjects}]}));
  const result=await h.api.search('Fixture',requested,{providers:['openLibrary']});
  assert.equal(result.works.length,0,`${requested} must not relabel ${subjects}`);
 }
 const h=harness(async()=>json({docs:[{key:'/works/OL1W',title:'Fixture'}]}));
 const result=await h.api.search('Fixture','Novel',{providers:['openLibrary']});assert.equal(result.works[0].type,'رواية');
});
test('rate-limited sources honor Retry-After without caching their failure as empty results',async()=>{
 const h=harness(async()=>new Response('{}',{status:429,headers:{'Retry-After':'30'}}));
 const first=await h.api.search('First','Manga',{providers:['anilist']});const second=await h.api.search('Second','Manga',{providers:['anilist']});
 assert.equal(first.providerErrors.length,1);assert.equal(second.providerErrors.length,1);assert.equal(h.calls.length,1);assert.equal(h.store.has(CACHE),false);
 assert.equal(second.providerErrors[0].status,429);assert.ok(second.providerErrors[0].retryAt>Date.now());
});
test('community API error envelopes cannot masquerade as a successful empty catalog',async()=>{
 const open=require('../modules/lorefy-open-catalog.js');
 const client=open.create({urlFor:(_p,url)=>url,fetchJson:async()=>({error:{code:'maxlag',info:'Waiting for replica'}})});
 await assert.rejects(client.wikidata('Dune','All'),/maxlag|replica|source/i);
});
test('community adapters distinguish malformed payloads from valid zero results',async()=>{
 const open=require('../modules/lorefy-open-catalog.js');
 const client=open.create({urlFor:(_p,url)=>url,fetchJson:async()=>({unexpected:true})});
 for(const name of ['bookBrainz','wikidata','gcd'])await assert.rejects(client[name]('Fixture','All'),/response|source/i);
 const empty=open.create({urlFor:(_p,url)=>url,fetchJson:async()=>({searchResult:[],search:[],results:[]})});
 for(const name of ['bookBrainz','wikidata','gcd'])assert.deepEqual(await empty[name]('Fixture','All'),[]);
});
test('public input listeners report partial availability and suppress cancelled completions',async()=>{
 const code=apiSource.slice(apiSource.indexOf('  function bindSearchInputs()'),apiSource.indexOf('  function hookHistory()'));
 for(const [result,status]of [[{providers:['one','two'],providerErrors:[{}]},'partial'],[{cancelled:true},null]]){
  const listeners={},queued=[],statuses=[],host={getAttribute:()=> 'Manga'};
  const target={tagName:'INPUT',value:'Fixture',isConnected:true,closest:s=>s.includes('search-local')?null:host};
  const global={document:{addEventListener:(name,fn)=>listeners[name]=fn,querySelector:()=>null},setTimeout:fn=>{queued.push(fn);return 1;},clearTimeout(){}};
  const scope={global,config:()=>({autoSearch:true}),cancelInputSearch(){},normalizeSpaces:v=>v,normalizeType:v=>v,notifyInputSearch:(_q,_t,s)=>statuses.push(s),SEARCH_DEBOUNCE_MS:1,inputEpoch:0,inputController:null,search:async()=>result};
  vm.runInNewContext(code+';bindSearchInputs();',scope);listeners.input({target});queued.shift()();
  for(let i=0;i<10;i++)await Promise.resolve();
  assert.deepEqual(statuses,status?['searching',status]:['searching']);
 }
});
