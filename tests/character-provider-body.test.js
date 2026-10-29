const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-character-system.js','utf8');
const flush=async()=>{for(let i=0;i<32;i++)await Promise.resolve();};
const deferred=()=>{let resolve;return{promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};};
function harness(provider){
 let now=0,serial=0;const timers=new Map(),requests=[],values=new Map();
 const window={localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}};
 vm.runInNewContext(source,{window,URL,URLSearchParams,console,fetch:(url,init)=>{requests.push(String(url));return provider(String(url),init);},
  setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{at:now+ms,fn});return id;},clearTimeout:id=>timers.delete(id)});
 return{api:window.LorefyCharacterSystem,window,requests,timers,values,async advance(ms){const end=now+ms;let steps=0;await flush();while(true){const next=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;if(++steps>1000)throw Error('Unbounded retry timers');now=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}now=end;await flush();}};
}
function observe(p){const result={state:'pending'};p.then(value=>{result.state='fulfilled';result.value=value;},error=>{result.state='rejected';result.error=error;});return result;}
const stalled=async()=>({ok:true,status:200,json:()=>new Promise(()=>{})});
const work={id:'novel-fixture',title:'Fixture',type:'Novel'};
const paths=[
 ['Jikan cast',a=>a.jikanCast(26),'rejected',1],
 ['AniList cast',a=>a.anilistCastById(30026),'rejected',1],
 ['Kitsu cast',a=>a.kitsuCastForWork(a.sourceKeysForWork({title:'Fixture'})),'rejected',2],
 ['Wikidata cast',a=>a.wikidataCast(work),'rejected',1],
 ['Wikipedia cast',a=>a.wikipediaCast(work),'rejected',1],
 ['Commons portraits',a=>a.commonsCharacterPictures({name:'Fixture Hero'}),'rejected',1],
 ['Fandom portrait gallery',a=>a.fandomCharacterPictures('https://fixture.fandom.com/api.php',{name:'Fixture Hero'}),'rejected',4],
 ['Fandom category cast',a=>a.fandomCategoryCast({id:'mal-manga-96792',title:'Demon Slayer: Kimetsu no Yaiba',type:'Manga'}),'rejected',2]
];
for(const [name,run,state,limit] of paths)test(`${name}: stalled response JSON settles with existing fallback policy`,async()=>{
 const h=harness(stalled),result=observe(run(h.api));await h.advance(60000);
 assert.equal(result.state,state);assert.ok(h.requests.length<=limit);assert.equal(h.timers.size,0);assert.equal(h.values.size,0);
 if(state==='fulfilled')assert.equal(result.value.length,0);
});
test('a timed-out portrait request preserves the verified seed rather than inventing another image',async()=>{
 const h=harness(stalled),result=observe(h.api.loadImageOptions({id:'mal-27',image:'https://example.com/seed.jpg'}));
 await h.advance(10000);assert.equal(result.state,'fulfilled');assert.deepEqual(Array.from(result.value),['https://example.com/seed.jpg']);assert.equal(h.timers.size,0);
});
test('a late Jikan body cannot complete an expired request and a new request can succeed',async()=>{
 const oldBody=deferred();let count=0;
 const h=harness(async()=>({ok:true,json:()=>++count===1?oldBody.promise:Promise.resolve({data:[{character:{mal_id:27,name:'Fresh Hero'}}]})}));
 const old=observe(h.api.jikanCast(26));await h.advance(10000);assert.equal(old.state,'rejected');
 oldBody.resolve({data:[{character:{mal_id:28,name:'Late Hero'}}]});await flush();assert.equal(old.state,'rejected');
 const next=await h.api.jikanCast(26);assert.equal(next[0].name,'Fresh Hero');assert.equal(h.requests.length,2);assert.equal(h.timers.size,0);
});
test('successful provider JSON releases both header and body timers',async()=>{
 const h=harness(async()=>({ok:true,json:async()=>({data:[{character:{mal_id:27,name:'Verified Hero'}}]})}));
 assert.equal((await h.api.jikanCast(26))[0].name,'Verified Hero');assert.equal(h.timers.size,0);
});
test('provider JSON parsing failure releases timers and remains a failure',async()=>{
 const h=harness(async()=>({ok:true,json:async()=>{throw new SyntaxError('Bad JSON');}}));
 await assert.rejects(h.api.jikanCast(26),/Bad JSON/);assert.equal(h.timers.size,0);
});
test('one stalled provider cannot hold the combined cast forever or mark a seed complete',async()=>{
 const h=harness(async url=>url.includes('api.tenrai.org')?stalled():{ok:false,status:503,json:async()=>({})});
 const manga={id:'mal-manga-26-fixture',title:'Fixture',type:'Manga'};
 h.window.LorefyCharacterCatalog={[manga.id]:[{id:'seed',name:'Verified Seed',image:'https://example.com/seed.jpg'}]};
 const result=observe(h.api.loadCast(manga));await h.advance(60000);
 assert.equal(result.state,'fulfilled');assert.equal(result.value[0].name,'Verified Seed');assert.equal(result.value.complete,false);
 const cache=JSON.parse(h.values.get('lorefy.characterCastCache.v20'));assert.equal(cache[manga.id].complete,false);assert.equal(h.timers.size,0);
});
