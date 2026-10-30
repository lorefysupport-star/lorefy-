const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = require('../modules/lorefy-catalog-data');

test('query index exposes reusable normalized fields and notices every mutable metadata field', () => {
  assert.equal(typeof data.getCatalogQueryIndex, 'function');
  const row = {id:'edition',title:'Été',ar:'إِبْن',auth:'First Author',altTitles:['Old alias']};
  const first = data.getCatalogQueryIndex(row);
  assert.deepEqual(first.fields.slice(0,4), ['ete','ابن','first author','']);
  assert.equal(data.getCatalogQueryIndex(row), first);
  row.altTitles[0] = 'New alias';
  assert.notEqual(data.getCatalogQueryIndex(row), first);
  for (const field of ['title','ar','auth','author']) {
    const previous = data.getCatalogQueryIndex(row);
    row[field] = 'Changed ' + field;
    assert.notEqual(data.getCatalogQueryIndex(row), previous);
  }
  assert.equal(row.id, 'edition');
});

function loaderHarness() {
  let fetches = 0;
  const rows = [[1,'edition','Amber Archive','','Writer','كتاب']];
  const events = {};
  const win = {document:{readyState:'loading',scripts:[],addEventListener(name,fn){events[name]=fn;},createElement(){return {dataset:{}};},head:{appendChild(s){queueMicrotask(()=>s.onload());}}},
    location:{search:''},history:{},LorefyMangaData:[],LOREFY_INITIAL_CATALOG_PARTS:[1],LorefyCatalogManifest:{partCount:1,featuredParts:[1],types:{Book:[1]}},LorefyCatalogPlan:require('../modules/lorefy-catalog-plan'),LorefyCatalogData:data,
    setTimeout(fn,ms){if(ms<1000)queueMicrotask(fn);return 1;},clearTimeout(){},addEventListener(){},dispatchEvent(){},__lorefyRefresh(){},
    fetch(){fetches++;return Promise.resolve({ok:true,json:()=>Promise.resolve({schema:1,records:rows})});}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'modules/lorefy-catalog-loader.js'),'utf8'),{window:win,URLSearchParams,CustomEvent:class{},console});
  return {win,loader:win.LorefyCatalogLoader,fetches:()=>fetches};
}
test('fallback searches share the downloaded and parsed index across subsequent queries',async()=>{
  const h=loaderHarness();
  await h.loader.loadAuthor('Amber');
  await h.loader.loadAuthor('Writer');
  await Promise.all([h.loader.loadAuthor('Archive'),h.loader.loadAuthor('Missing')]);
  assert.equal(h.fetches(),1);
});

test('search worker skips superseded input jobs while retaining independent author requests',async()=>{
  const handlers={},posts=[];let finish;
  const self={location:{href:'https://example.test/modules/lorefy-catalog-search-worker.js'},LorefyCatalogPlan:{searchIndexResult(entries,query){return {matches:[{part:1,count:1,score:query.length}],suggestions:[]};}},LorefyCatalogData:{},addEventListener(name,fn){handlers[name]=fn;},postMessage(message){posts.push(message);}};
  let computations=0;
  const original=self.LorefyCatalogPlan.searchIndexResult;
  self.LorefyCatalogPlan.searchIndexResult=(...args)=>{computations++;return original(...args);};
  vm.runInNewContext(fs.readFileSync(path.join(root,'modules/lorefy-catalog-search-worker.js'),'utf8'),{self,importScripts(){},URL,fetch(){return new Promise(resolve=>{finish=()=>resolve({ok:true,json:()=>Promise.resolve({schema:1,records:[]})});});}});
  handlers.message({data:{type:'search',requestId:1,query:'O',channel:'input'}});
  handlers.message({data:{type:'search',requestId:2,query:'Old',channel:'input'}});
  handlers.message({data:{type:'search',requestId:3,query:'Writer'}});
  handlers.message({data:{type:'search',requestId:4,query:'Newest',channel:'input'}});
  finish();
  for(let i=0;i<6;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(computations,2);
  assert.equal(posts.length,4,'every request settles even when superseded');
  assert.equal(posts.find(row=>row.requestId===1).cancelled,true);
  assert.equal(posts.find(row=>row.requestId===2).cancelled,true);
  assert.equal(posts.find(row=>row.requestId===3).matches.length,1);
  assert.equal(posts.find(row=>row.requestId===4).matches.length,1);
});

test('yielding fallback preserves exact rankings and suggestions across slice boundaries',async()=>{
  const plan=require('../modules/lorefy-catalog-plan');
  const entries=Array.from({length:2401},(_,i)=>({part:i%7+1,work:{id:'edition-'+i,title:i%3?'Amber Archive':'Different book',auth:'Writer',type:'كتاب'}}));
  for(const query of ['Amber Archive','Amber Archvie','Missing work']){
    let yields=0;
    const actual=await plan.searchIndexResultAsync(entries,query,'All',data,true,async()=>{yields++;});
    assert.deepEqual(actual,plan.searchIndexResult(entries,query,'All',data));
    assert.ok(yields>=2);
  }
});
test('superseded fallback scan stops at the next slice without publishing partial matches',async()=>{
  const plan=require('../modules/lorefy-catalog-plan');
  const entries=Array.from({length:2401},(_,i)=>({part:1,work:{id:'edition-'+i,title:'Amber Archive',type:'كتاب'}}));
  let active=true,yields=0;
  const result=await plan.searchIndexResultAsync(entries,'Amber','All',data,true,async()=>{active=false;yields++;},()=>active);
  assert.equal(result.cancelled,true);
  assert.deepEqual(result.matches,[]);
  assert.equal(yields,1);
});

test('fast normalization retains Unicode, Arabic, accents and ASCII punctuation semantics',()=>{
  const baseline=value=>String(value==null?'':value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
  for(const value of [' A\t Writer\n  Vol. 2 ', 'a___b--c!!!d', 'ÉTÉ À PARIS','إِبْن بَطُّوطَة','１２３　ＡＢＣ','進撃の巨人','Ⅳ № 32','كتاب🙂Book',42,null,'',{},'\u0000a\u007fb\u0011']) assert.equal(data.normalizeQuery(value),baseline(value));
});

test('source object metadata edits invalidate indexes without stringifying arbitrary values as identity',()=>{
  const row={id:'original',title:'Story',auth:{name:'First Writer'}};
  assert.equal(data.matchesCatalogQuery(row,'First Writer'),true);
  row.auth.name='Revised Writer';
  assert.equal(data.matchesCatalogQuery(row,'First Writer'),false);
  assert.equal(data.matchesCatalogQuery(row,'Revised Writer'),true);
  assert.equal(row.id,'original');
});

test('typo recovery reuses normalized source fields after the exact scan',()=>{
  const plan=require('../modules/lorefy-catalog-plan');
  const entries=Array.from({length:2401},(_,i)=>({part:1,work:{id:'edition-'+i,title:'Amber Archive',auth:'A Writer',altTitles:['Archive Story',{en:'Excluded object alias'}],authorAliases:['Alias Author']}}));
  data.prepareSearchIndexes(entries.map(entry=>entry.work));
  let calls=0;const counted={...data,normalizeQuery(value){calls++;return data.normalizeQuery(value);}};
  assert.deepEqual(plan.searchIndexResult(entries,'Amber Archvie','All',counted).suggestions,['Amber Archive']);
  assert.ok(calls<10,'normalize only the query, not every already indexed candidate: '+calls);
});

test('embedded separators in one alias do not corrupt later title correction fields',()=>{
  const plan=require('../modules/lorefy-catalog-plan');
  const work={id:'separators',title:'Unrelated',altTitles:['Early\u0000alias','Amber Archive']};
  assert.deepEqual(plan.searchIndexResult([{part:1,work}],'Amber Archvie','All',data).suggestions,['Amber Archive']);
});


test('obsolete worker failures do not start an unnecessary fallback download',async()=>{
  const h=loaderHarness(),workers=[];
  h.win.Worker=class{constructor(){this.handlers={};this.requests=[];workers.push(this);}addEventListener(name,fn){this.handlers[name]=fn;}postMessage(request){this.requests.push(request);}terminate(){}};
  async function settle(){for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));}
  h.loader.loadFormat('Book','Old query');await settle();
  h.loader.loadFormat('Book','New query');await settle();
  const worker=workers[0];
  worker.handlers.message({data:{type:'error',requestId:worker.requests[0].requestId,message:'old failure'}});
  await settle();
  assert.equal(h.fetches(),0);
  assert.equal(h.loader.state().searching,true);
  worker.handlers.message({data:{type:'result',requestId:worker.requests[1].requestId,matches:[],suggestions:[]}});
  await settle();
  assert.equal(h.loader.state().searching,false);
  assert.equal(h.loader.state().searchError,false);
});
