const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const planner = require('../modules/lorefy-catalog-plan');
const data = require('../modules/lorefy-catalog-data');
const entries = [
  {part:2,work:{id:'pirates',title:'One Piece',ar:'ون بيس',type:'Manga'}},
  {part:3,work:{id:'hunters',title:'Hunter x Hunter',ar:'هنتر هنتر',type:'Manga',altTitles:['Hunter Hunter']}},
  {part:4,work:{id:'berserk',title:'Berserk',ar:'بيرسيرك',type:'Manga'}},
  {part:5,work:{id:'another-edition',title:'One Piece',type:'Manga'}},
  {part:6,work:{id:'arabic-book',title:'Different title',ar:'أرض السَّلام',type:'Book'}},
  {part:7,work:{id:'postman',title:'The Postman',ar:'ساعي البريد',type:'Book'}}
];
function suggestions(query,type='All',records=entries) {
  return planner.searchIndexResult(records,query,type,data).suggestions;
}
for (const [query,expected] of [['One Peice','One Piece'],['Hnuter x Hunter','Hunter x Hunter'],['Bersrk','Berserk'],['Berseerk','Berserk'],['Berserkx','Berserk'],['Berserkz','Berserk'],['ساعي البرد','ساعي البريد'],['ارض السالم','أرض السَّلام'],['Hunter Hnuter','Hunter Hunter']]) {
  test('offers a title correction for one edit: '+query,()=>assert.ok(suggestions(query).includes(expected)));
}
test('suggestions leave the actual query and distinct editions unchanged',()=>{
  const before=JSON.stringify(entries),result=planner.searchIndexResult(entries,'One Peice','All',data);
  assert.deepEqual(result.matches,[]);assert.equal(result.suggestions.filter(x=>x==='One Piece').length,1);
  assert.deepEqual(planner.searchIndexResult(entries,result.suggestions[0],'All',data).matches.map(x=>x.part),[2,5]);
  assert.equal(data.matchesCatalogQuery(entries[0].work,'One Peice'),false);
  assert.equal(JSON.stringify(entries),before);
});
test('exact titles, author matches and aliases keep exact semantics without a correction',()=>{
  const records=entries.concat({part:9,work:{id:'auth',title:'A separate work',auth:'One Peice',type:'Manga'}});
  for(const query of ['One Piece','هنتر هنتر','Hunter Hunter','برسيرك','One Peice']) assert.deepEqual(suggestions(query,'All',records),[]);
});
test('type filters also constrain suggested titles',()=>{
  assert.deepEqual(suggestions('One Peice','Book'),[]);
  assert.ok(suggestions('One Peice','مانجا').includes('One Piece'));
});
test('unrelated, short, blank, oversized and multi-edit text has no guessed correction',()=>{
  for(const query of ['', 'One', 'zzzzz', 'Pne Peice', 'a'.repeat(81)]) assert.deepEqual(suggestions(query),[]);
});
test('suggestions are deterministic, capped at three and deduplicated by normalized query',()=>{
  const records=['Book house','Book mouse','Book louse','Book rouse','BOOK HOUSE'].map((title,i)=>({part:i+1,work:{id:String(i),title,type:'Book'}}));
  const first=suggestions('Book hause','All',records);assert.ok(first.length<=3);assert.equal(new Set(first.map(data.normalizeQuery)).size,first.length);
  assert.deepEqual(suggestions('Book hause','All',records),first);
  const many=suggestions('Book xouse','All',records);assert.equal(many.length,3);
});

const authored = [
  {part:11,work:{id:'pride',title:'Pride and Prejudice',auth:'Jane Austen',authorAliases:['جين أوستن'],type:'Book'}},
  {part:12,work:{id:'sense',title:'Sense and Sensibility',author:'Jane Austen',type:'Book'}},
  {part:13,work:{id:'hunter',title:'Hunter x Hunter',auth:'Yoshihiro Togashi',type:'Manga'}}
];
test('suggests a sourced author name without automatically returning their works',()=>{
  const result=planner.searchIndexResult(authored,'Jane Austne','Book',data);
  assert.deepEqual(result.matches,[]);
  assert.deepEqual(result.suggestions,['Jane Austen']);
  assert.deepEqual(planner.searchIndexResult(authored,result.suggestions[0],'Book',data).matches.map(x=>x.part),[11,12]);
});
test('suggests textual Arabic author aliases while respecting the format filter',()=>{
  assert.deepEqual(suggestions('جين اوستت','Book',authored),['جين أوستن']);
  assert.deepEqual(suggestions('Jane Austne','Manga',authored),[]);
  assert.deepEqual(suggestions('Yoshihiro Togahsi','Book',authored),[]);
});
test('long queries allow one typo in each of two separate words',()=>{
  assert.deepEqual(suggestions('Pride nad Prejudcie','Book',authored),['Pride and Prejudice']);
  assert.deepEqual(suggestions('Yoshihior Togahsi','Manga',authored),['Yoshihiro Togashi']);
});
test('two-word recovery rejects short, three-word, repeated and oversized corruption',()=>{
  for(const query of ['Pne Peice','Prdie nad Prejudcie','Pride and Prejxxice','Pride Prejudcie','a'.repeat(81)]) {
    assert.deepEqual(suggestions(query,'All',authored),[]);
  }
  assert.deepEqual(suggestions('Pride nad Prejudcie','Manga',authored),[]);
});
test('nontext author metadata is not suggested and entries remain untouched',()=>{
  const records=authored.concat({part:14,work:{id:'bad',title:'Unknown',auth:{name:'Jane Austen'},authorAliases:[{name:'Jane Austen'}],type:'Book'}});
  const before=JSON.stringify(records);
  assert.deepEqual(suggestions('Jane Austne','Book',records),['Jane Austen']);
  assert.equal(JSON.stringify(records),before);
});

function harness(worker=false) {
  const events={},requests=[],pending=[],scripts=[];let held=null,fail=false;
  const rows=entries.map(e=>[e.part,e.work.id,e.work.title,e.work.ar,e.work.auth,e.work.type,e.work.altTitles]);
  const win={document:{readyState:'loading',scripts:[],addEventListener:(n,f)=>events[n]=f,createElement:()=>({dataset:{}}),head:{appendChild(script){scripts.push(Number(script.dataset.lorefyCatalogPart));queueMicrotask(()=>script.onload());}}},
    location:{search:''},history:{pushState(){},replaceState(){}},LorefyMangaData:[],LOREFY_INITIAL_CATALOG_PARTS:[1],
    LorefyCatalogManifest:{partCount:6,featuredParts:[1],types:{Manga:[1,2,3,4,5],Book:[6]}},LorefyCatalogPlan:planner,LorefyCatalogData:data,
    setTimeout(f,ms){if(ms>=5000){const t=setTimeout(f,ms);t.unref();return t;}queueMicrotask(f);return 1;},clearTimeout,
    addEventListener(){},dispatchEvent(){},__lorefyIngest(){},__lorefyRefresh(){},
    fetch(){return held|| (fail?Promise.reject(new Error('offline')):Promise.resolve({ok:true,json:async()=>({schema:1,records:rows})}));}};
  if(worker)win.Worker=class{constructor(){this.events={};}addEventListener(n,f){this.events[n]=f;}terminate(){}postMessage(request){requests.push(request);pending.push(result=>this.events.message({data:{type:'result',requestId:request.requestId,...result}}));}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../modules/lorefy-catalog-loader'),'utf8'),{window:win,URLSearchParams,CustomEvent:class{},console:{warn(){}}});
  return {loader:win.LorefyCatalogLoader,scripts,requests,pending,input(q){events.input({target:{tagName:'INPUT',value:q,closest:()=>true}});},
    hold(p){held=p;},fail(v){fail=v;},async settle(){for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));}};
}
test('fallback returns suggestions without loading approximate result shards',async()=>{
  const h=harness();h.input('One Peice');await h.settle();
  assert.deepEqual(Array.from(h.loader.state().suggestions),['One Piece']);assert.deepEqual(h.scripts,[]);
  assert.equal(h.loader.state().searchQuery,'One Peice');assert.equal(h.loader.state().searching,false);
  h.input('One Piece');await h.settle();assert.deepEqual(h.scripts,[2,5]);assert.deepEqual(Array.from(h.loader.state().suggestions),[]);
});
test('worker suggestions use the same state contract and are cleared on a new query',async()=>{
  const h=harness(true);h.input('One Peice');await h.settle();h.pending[0]({matches:[],suggestions:['One Piece']});await h.settle();
  assert.deepEqual(Array.from(h.loader.state().suggestions),['One Piece']);h.input('Other query');await h.settle();
  assert.deepEqual(Array.from(h.loader.state().suggestions),[]);assert.equal(h.loader.state().searching,true);
});
test('a late worker correction cannot replace the current query',async()=>{
  const h=harness(true);h.input('One Peice');await h.settle();h.input('No match anywhere');await h.settle();
  h.pending[1]({matches:[],suggestions:[]});await h.settle();h.pending[0]({matches:[],suggestions:['One Piece']});await h.settle();
  assert.deepEqual(Array.from(h.loader.state().suggestions),[]);assert.equal(h.loader.state().searchQuery,'No match anywhere');
});
test('failed and cleared searches never retain an earlier correction',async()=>{
  const h=harness(true);h.input('One Peice');await h.settle();h.pending[0]({matches:[],suggestions:['One Piece']});await h.settle();h.fail(true);h.input('Bersrk');await h.settle();h.pending[1]({type:'error',message:'worker failed'});await h.settle();
  assert.equal(h.loader.state().searchError,true);assert.deepEqual(Array.from(h.loader.state().suggestions),[]);
  h.input('');await h.settle();assert.deepEqual(Array.from(h.loader.state().suggestions),[]);
});
