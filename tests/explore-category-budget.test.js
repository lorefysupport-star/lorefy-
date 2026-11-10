const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../modules/lorefy-explore-studio');
test('category summaries use one pass and preserve format order, counts and preferred artwork',()=>{
  assert.equal(typeof core.buildCategories,'function');
  let reads=0;const rows=Array.from({length:1000},(_,i)=>({id:i,get type(){reads++;return i%2?'Manga':'Novel';},cover:i===3?'https://cover.test/image':''}));
  const before=JSON.stringify(rows.map(w=>({id:w.id,cover:w.cover}))),result=core.buildCategories(rows,['Novel','Manga','Book'],w=>w.cover);
  assert.equal(reads,1000);assert.deepEqual(result.map(w=>[w.type,w.count,w.rep.id]),[['Novel',500,0],['Manga',500,3]]);
  assert.equal(JSON.stringify(rows.map(w=>({id:w.id,cover:w.cover}))),before);
});
test('actual app integration defers summaries instead of scanning hidden catalog categories',()=>{
  const source=fs.readFileSync('uploads/files/lorefy-app.js','utf8'),start=source.indexOf('pr=()=>{')+'pr=()=>{'.length,end=source.indexOf('if(window.LorefyExploreStudio)',start),body=source.slice(start,end);
  let reads=0;const rows=Array.from({length:100},(_,i)=>({id:i,get type(){reads++;return 'Manga';}}));
  const context={MANGA:rows,TYPES:['الكل','Manga','Novel'],DISCOVER_CACHE:{},rawSourceCoverOf:()=>'',window:{LorefyExploreStudio:core}};
  const getter=vm.runInNewContext('(function(){'+body+';return typeof getCategories==="function"?getCategories:null;})()',context);
  assert.equal(reads,0,'opening Explore/Search must not scan invisible summaries');assert.equal(typeof getter,'function');
  assert.equal(getter()[0].count,100);assert.equal(reads,100);getter();assert.equal(reads,100,'unchanged category summary is reused');
});
