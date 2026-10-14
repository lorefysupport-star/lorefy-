const test = require('node:test');
const assert = require('node:assert/strict');
const studio = require('../modules/lorefy-explore-studio');

test('format results scope title/author search and every ordering to the selected medium', () => {
  const rows = [
    {id:'a',title:'Journey A',auth:'Writer',type:'Manga',pop:20,r:4,rSrc:'Provider',yr:2020},
    {id:'b',title:'Journey B',auth:'Writer',type:'مانجا',pop:40,r:3,rSrc:'Provider',yr:2024},
    {id:'c',title:'Journey C',type:'Manhwa',pop:100,r:5,yr:2026},
    {id:'d',title:'Elsewhere',auth:'Other',type:'Manga',pop:10,r:0,yr:2018}
  ];
  assert.deepEqual(studio.catalogResults(rows,'Manga','Journey','popular').map(w=>w.id),['b','a']);
  assert.deepEqual(studio.catalogResults(rows,'مانجا','Writer','rating').map(w=>w.id),['a','b']);
  assert.deepEqual(studio.catalogResults(rows,'Manga','','newest').map(w=>w.id),['b','a','d']);
  assert.deepEqual(studio.catalogResults(rows,'Book','','popular'),[]);
});
test('top rated uses existing confidence scoring and never fabricates ratings for unrated works', () => {
  const rows = [{id:'a',type:'Book',r:5},{id:'b',type:'Book',r:3,rSrc:'Verified'}];
  assert.equal(studio.catalogResults(rows,'Book','','rating')[0].id,'b');
  assert.equal(studio.catalogResults(rows,'Book','','rating',w=>w.id==='a'?1:2)[0].id,'b');
  assert.equal(rows[0].rSrc,undefined);
});
test('format results canonicalize aliases and reject explicitly blocked works', () => {
  const oldAliases = global.LorefyCatalogAliases, oldPolicy = global.LorefyCatalogPolicy;
  global.LorefyCatalogAliases={alias:'canonical'};
  global.LorefyCatalogPolicy={isExcludedWork:w=>w.excluded,isExplicitWork:w=>w.adult,isAiGeneratedWork:w=>w.ai};
  try {
    const rows=[{id:'canonical',type:'Novel'},{id:'alias',type:'Novel'},{id:'adult',type:'Novel',adult:true},{id:'ai',type:'Novel',ai:true},{id:'excluded',type:'Novel',excluded:true}];
    assert.deepEqual(studio.catalogResults(rows,'رواية','','popular').map(w=>w.id),['canonical']);
  } finally { global.LorefyCatalogAliases=oldAliases;global.LorefyCatalogPolicy=oldPolicy; }
});
test('featured works use real popularity, reject ineligible records and remain bounded', () => {
  const rows=Array.from({length:5},(_,i)=>({id:String(i),pop:i,_discoveryEligible:true}));
  rows.push({id:'blocked',pop:100,_discoveryEligible:false});
  assert.deepEqual(studio.featuredWorks(rows).map(w=>w.id),['4','3','2']);
  assert.deepEqual(studio.featuredWorks([]),[]);
  assert.equal(rows[0].r,undefined);
});

test('inline media search spans formats and retains the same safety and alias rules',()=>{
 const rows=[{id:'m',type:'Manga',title:'Journey',pop:2},{id:'n',type:'Novel',title:'Journey',pop:3},{id:'x',type:'Book',title:'Other',pop:9}];
 assert.deepEqual(studio.catalogResults(rows,'الكل','Journey','popular').map(w=>w.id),['n','m']);
 assert.deepEqual(studio.catalogResults(rows,'all','Journey','popular').map(w=>w.id),['n','m']);
});
