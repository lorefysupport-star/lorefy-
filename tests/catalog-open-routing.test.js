const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(fetch,extra={}){
 const store=new Map(),calls=[],window={location:{hostname:'127.0.0.1',search:''},document:{readyState:'loading',addEventListener(){}},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout,clearTimeout,AbortController,
  LOREFY_REMOTE_CATALOG:{enabled:true,openSourcesPreview:true,requestTimeoutMs:30,providers:{anilist:false,mangaDex:false,openLibrary:false,googleBooks:false}},
  LorefyOpenCatalog:require('../modules/lorefy-open-catalog.js'),LorefyCatalogIdentity:require('../modules/lorefy-catalog-identity.js'),
  fetch:(...args)=>{calls.push(args);return fetch(...args);},...extra};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-api-catalog.js','utf8'),{window,URLSearchParams,URL,AbortController,setTimeout,clearTimeout});
 return {api:window.LorefyApiCatalog,window,calls,store};
}
test('novel online search includes BookBrainz and Wikidata without relabeling a returned comic',async()=>{
 const h=harness(async url=>new Response(JSON.stringify(url.includes('wbsearchentities')?{search:[]} :{searchResult:[]})));
 const r=await h.api.search('Golden Son','Novel',{force:true});
 assert.ok(r.providers.includes('bookBrainz'));assert.ok(r.providers.includes('wikidata'));
});
test('comics includes GCD and Google no longer excludes collected books with a magazines-only filter',async()=>{
 const h=harness(async()=>new Response('{"items":[]}'));
 h.window.LOREFY_REMOTE_CATALOG.providers.googleBooks=true;
 const r=await h.api.search('Watchmen','Comics',{providers:['googleBooks','gcd'],force:true});
 assert.ok(r.providers.includes('gcd'));assert.equal(new URL(h.calls.find(c=>c[0].includes('googleapis'))[0]).searchParams.get('printType'),'all');
});
test('a source that never settles reaches a bounded failure rather than an endless searching state',async()=>{
 const h=harness(()=>new Promise(()=>{}));
 h.window.LOREFY_REMOTE_CATALOG.providers.openLibrary=true;
 const r=await h.api.search('Dune','Novel',{providers:['openLibrary'],force:true});
 assert.equal(r.providerErrors.length,1);assert.match(r.providerErrors[0].error,/timeout/i);
});
test('late results for an obsolete query do not enter the catalog',async()=>{
 const h=harness(async()=>new Response('{"docs":[{"key":"/works/OL1W","title":"Dune"}]}'));
 h.window.LOREFY_REMOTE_CATALOG.providers.openLibrary=true;
 const r=await h.api.search('Dune','Novel',{providers:['openLibrary'],force:true,isCurrent:()=>false});
 assert.equal((h.window.LorefyMangaData||[]).length,0);assert.equal(r.cancelled,true);
});
test('new community providers are fail-closed in production until an approved gateway is configured',async()=>{
 const h=harness(async()=>new Response('{}'),{location:{hostname:'lorefy.app',search:''}});
 const r=await h.api.search('Dune','Novel',{providers:['bookBrainz','wikidata','gcd'],force:true});
 assert.equal(h.calls.length,0);assert.equal(r.skipped,'no-providers');
});
test('late-loaded search module resumes an already populated opted-in media input',()=>{
 const source=fs.readFileSync('modules/lorefy-api-catalog.js','utf8');
 const code=source.slice(source.indexOf('  function bindSearchInputs()'),source.indexOf('  function hookHistory()'));
 let queued=0;const host={getAttribute:()=> 'All'},input={tagName:'INPUT',value:'Watchmen',isConnected:true,closest:s=>s.includes('search-local')?null:host};
 const global={document:{addEventListener(){},querySelector:()=>input},setTimeout(){queued++;return 1;},clearTimeout(){}};
 vm.runInNewContext(code+';bindSearchInputs();',{global,config:()=>({autoSearch:true}),cancelInputSearch(){},normalizeSpaces:s=>s,notifyInputSearch(){},SEARCH_DEBOUNCE_MS:1,inputEpoch:0,inputController:null});
 assert.equal(queued,1);
});
test('catalog bootstrap warming cannot cancel a populated media search',()=>{
 const source=fs.readFileSync('modules/lorefy-api-catalog.js','utf8');
 const code=source.slice(source.indexOf('  function scheduleRouteLoad()'),source.indexOf('  function applyCached('));
 let cancelled=false;const global={document:{querySelector:()=>({value:'Watchmen',closest:()=>null})}};
 vm.runInNewContext(code+';scheduleRouteLoad();',{global,normalizeSpaces:s=>s,cancelInputSearch(){cancelled=true;},config:()=>({autoWarmCurrentType:false})});
 assert.equal(cancelled,false);
});
test('partial provider success has a short retry cache rather than hiding a failed source for days',async()=>{
 const h=harness(async url=>{if(url.includes('wikidata'))throw Error('unavailable');return new Response('{"docs":[{"key":"/works/OL1W","title":"Dune"}]}');});
 h.window.LOREFY_REMOTE_CATALOG.providers.openLibrary=true;
 await h.api.search('Dune','Novel',{providers:['openLibrary','wikidata'],force:true});
 const cached=JSON.parse(h.store.get(h.api.CACHE_KEY));assert.ok(Object.values(cached.batches).some(batch=>batch.partial===true));
});
test('returning to media clears stale busy state and resumes only a current media input',()=>{
 const source=fs.readFileSync('modules/lorefy-explore-studio.js','utf8');
 const code=source.slice(source.indexOf('    function changeSearchMode('),source.indexOf('    function searchBody('));
 let callback,cleared=false,mode,query,events=0,cancelled=false;
 const input={value:'Dune',isConnected:true,closest:()=>null,dispatchEvent:()=>events++};
 const sandbox={searchRetry:{current:0},inputTimer:{current:1},setSearchQuery:value=>query=value,setRemoteSearch(value){cleared=value===null;},setSearchMode:value=>mode=value,searchInput:{current:input},root:{clearTimeout(){cancelled=true;},setTimeout:fn=>callback=fn,Event:class{}}};
 vm.runInNewContext(code+';changeSearchMode("media");',sandbox);assert.ok(cleared);assert.equal(mode,'media');callback();assert.equal(events,1);
 input.closest=()=>({});callback();assert.equal(events,1,'a subsequent People mode blocks the queued media lookup');
 assert.equal(sandbox.searchRetry.current,1);assert.ok(cancelled);assert.equal(query,'Dune','mode changes commit the current field, not stale debounced text');
});
