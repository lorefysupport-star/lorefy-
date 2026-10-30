const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(payload={data:{Page:{characters:[]}}}){
 const values=new Map();let classifications=0,requests=0;
 const work={id:'fixture-work',title:'Fixture',get type(){classifications++;return 'Manga';}};
 const window={localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-character-system.js','utf8'),{window,URL,console,setTimeout,clearTimeout,fetch:async()=>{requests++;return{ok:true,json:async()=>payload};}});
 return{api:window.LorefyCharacterSystem,work,values,get classifications(){return classifications;},get requests(){return requests;}};
}
test('a character cache miss does not classify or index the entire work catalog',()=>{
 const h=harness();assert.equal(h.api.cachedCharacterMatches('Absent',Array(1000).fill(h.work)).length,0);assert.equal(h.classifications,0);
});
test('empty character source results skip catalog identity/title indexing',async()=>{
 const h=harness();assert.equal((await h.api.searchCharacters('Absent',Array(1000).fill(h.work))).length,0);assert.equal(h.requests,1);assert.equal(h.classifications,0);
});
test('only works with a matching cached cast need classification; book exclusion and order survive',()=>{
 const h=harness(),a={id:'a',title:'A',type:'Manga'},b={id:'b',title:'B',type:'Book'};
 h.values.set('lorefy.characterCastCache.v20',JSON.stringify({b:{cast:[{name:'Hero'}]},a:{cast:[{name:'Hero'}]}}));
 assert.deepEqual(Array.from(h.api.cachedCharacterMatches('Hero',[h.work,a,b]),r=>r.workId),['a']);assert.equal(h.classifications,0);
});
test('already inactive character callers do not begin network or catalog work',async()=>{
 const h=harness();assert.equal((await h.api.searchCharacters('Hero',[h.work],{active:()=>false})).length,0);assert.equal(h.requests,0);assert.equal(h.classifications,0);
});
test('By work character picker normalizes source fields only for matched works',()=>{
 const src=fs.readFileSync('modules/lorefy-growth-features.js','utf8'),start=src.indexOf('  function profileTopCharacterSearchWorks('),end=src.indexOf('  function profileRatedCharacterPortrait(',start);
 const data=require('../modules/lorefy-catalog-data.js'),works=Array.from({length:500},(_,i)=>({id:'work-'+i,title:i===7?'Fixture manga':'Other '+i,ar:'',type:'Manga'}));
 data.prepareSearchIndexes(works);let normalizations=0;
 const scope={global:{LorefyCatalogData:data},mlWorks:()=>works,profileTopCharacterSearchText:v=>{normalizations++;return data.normalizeQuery(v);}};
 vm.runInNewContext(src.slice(start,end),scope);assert.equal(scope.profileTopCharacterSearchWorks('Fixture')[0].id,'work-7');assert.ok(normalizations<=3,'normalizations='+normalizations);
});
