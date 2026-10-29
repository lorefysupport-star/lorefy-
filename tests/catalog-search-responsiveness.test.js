const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};};
const flush=async()=>{for(let i=0;i<50;i++)await Promise.resolve();};
const manga=id=>({id,idMal:id,title:{romaji:'Fixture '+id},countryOfOrigin:'JP',format:'MANGA',genres:[]});
function harness(fetcher){
 let time=0,id=0;const timers=new Map(),calls=[],store=new Map();
 const window={document:{readyState:'loading',addEventListener(){}},location:{hostname:'lorefy.app',search:''},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  setTimeout(fn,ms){const key=++id;timers.set(key,{at:time+ms,fn});return key;},clearTimeout:key=>timers.delete(key),
  AbortController,LOREFY_REMOTE_CATALOG:{enabled:true,requestTimeoutMs:100,providers:{googleBooks:false}},
  LorefyCatalogIdentity:require('../modules/lorefy-catalog-identity.js'),
  fetch:(url,init)=>{calls.push({url:String(url),init});return fetcher(String(url),init);}};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-api-catalog.js','utf8'),{window,URL,URLSearchParams,AbortController});
 return {api:window.LorefyApiCatalog,window,store,calls,timers,async advance(ms){const end=time+ms;await flush();let n=0;for(;;){const next=[...timers.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;if(++n>1000)throw Error('Timer loop');time=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}time=end;await flush();}};
}
test('fast provider results are usable while another provider is still pending',async()=>{
 const slow=deferred(),h=harness(async url=>url.includes('anilist')?new Response(JSON.stringify({data:{Page:{media:[manga(40)]}}})):slow.promise);
 let done=false;const task=h.api.search('Fixture','Manga',{force:true}).then(r=>{done=true;return r;});
 await flush();assert.equal((h.window.LorefyMangaData||[]).length,1,'first useful results must not wait for the slow provider');
 assert.equal(done,false);slow.resolve(new Response('{"data":[]}'));const result=await task;
 assert.equal(result.works[0].id,'api-anilist-40-fixture-40');assert.equal(result.providerErrors.length,0);
});
test('all-format search starts book coverage in the first pair of jobs',async()=>{
 const h=harness(async url=>url.includes('openlibrary')?new Response('{"docs":[{"key":"/works/OL77W","title":"Fixture Novel","subject":["Fiction"]}]}'):new Promise(()=>{}));
 const task=h.api.search('Fixture','All',{force:true});await flush();
 assert.ok(h.calls.some(c=>c.url.includes('openlibrary')),'slow manga lookups must not keep books queued');
 await h.advance(1000);await task;
});
test('cancelling a query aborts its active requests and settles without cached errors',async()=>{
 const controller=new AbortController(),h=harness(()=>new Promise(()=>{}));let result;
 const task=h.api.search('Fixture','Manga',{providers:['anilist'],signal:controller.signal,force:true}).then(r=>result=r);
 await flush();controller.abort();await flush();
 assert.ok(h.calls[0].init.signal.aborted,'the actual fetch must be aborted');
 assert.equal(result?.cancelled,true);await task;assert.equal(h.store.has(h.api.CACHE_KEY),false);assert.equal(h.timers.size,0);
});
test('late JSON from a cancelled query cannot enter the catalog',async()=>{
 const body=deferred(),controller=new AbortController(),h=harness(async()=>({ok:true,json:()=>body.promise}));
 const task=h.api.search('Fixture','Manga',{providers:['anilist'],signal:controller.signal,force:true});
 await flush();controller.abort();body.resolve({data:{Page:{media:[manga(41)]}}});await task;await flush();
 assert.equal((h.window.LorefyMangaData||[]).length,0);assert.equal(h.store.has(h.api.CACHE_KEY),false);
});
test('repeat cached searches do not ingest or refresh an unchanged catalog again',async()=>{
 const h=harness(async()=>new Response(JSON.stringify({data:{Page:{media:[manga(42)]}}})));let ingestions=0;
 h.window.__lorefyIngest=()=>ingestions++;
 await h.api.search('Fixture','Manga',{providers:['anilist']});const before=ingestions;
 await h.api.search('Fixture','Manga',{providers:['anilist']});assert.equal(h.calls.length,1);
 assert.equal(ingestions,before,'a cached hit with no additions must not rebuild the catalog');
});
test('cold multilingual query preparation normalizes each source field only once',()=>{
 const scope={};vm.createContext(scope);vm.runInContext(fs.readFileSync('modules/lorefy-catalog-data.js','utf8'),scope);
 vm.runInContext("this.normalizations=0;const normalize=String.prototype.normalize;String.prototype.normalize=function(...args){normalizations++;return normalize.apply(this,args);};",scope);
 scope.LorefyCatalogData.prepareSearchIndexes([{id:'one',title:'Hunter x Hunter',ar:'القناص',auth:'Togashi',altTitles:['HUNTER×HUNTER']}]);
 assert.ok(scope.normalizations<=8,`normalizations=${scope.normalizations}`);
});

test('cancelling all-format search stops queued format jobs',async()=>{
 const controller=new AbortController(),h=harness(()=>new Promise(()=>{}));
 const task=h.api.search('Fixture','All',{signal:controller.signal,force:true});await flush();const count=h.calls.length;
 controller.abort();const result=await task;assert.equal(result.cancelled,true);assert.equal(h.calls.length,count);assert.equal(h.timers.size,0);
});
test('open community adapters inherit the query abort signal',async()=>{
 const controller=new AbortController(),h=harness(()=>new Promise(()=>{}));
 h.window.location.hostname='127.0.0.1';h.window.LOREFY_REMOTE_CATALOG.openSourcesPreview=true;
 h.window.LorefyOpenCatalog=require('../modules/lorefy-open-catalog.js');
 const task=h.api.search('Fixture','Book',{providers:['bookBrainz','wikidata'],signal:controller.signal,force:true});
 await flush();assert.equal(h.calls.length,2);controller.abort();const result=await task;
 assert.equal(result.cancelled,true);assert.ok(h.calls.every(call=>call.init.signal.aborted));assert.equal(h.timers.size,0);
});
