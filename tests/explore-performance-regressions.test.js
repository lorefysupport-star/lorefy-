const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../modules/lorefy-catalog-data'),explore=require('../modules/lorefy-explore-studio');
test('top-rated browsing scores each eligible work once and preserves deterministic order',()=>{
 let calls=0;const works=[{id:'b',title:'B',type:'manga',r:4},{id:'a',title:'A',type:'manga',r:4},{id:'c',title:'C',type:'manga',r:5}];
 const rows=explore.catalogResults(works,'manga','','rating',w=>{calls++;return w.r});assert.deepEqual(rows.map(w=>w.id),['c','a','b']);assert.equal(calls,3);
});
test('incremental index warming preserves runtime-derived state and searches multilingual aliases',()=>{
 const work={id:'w',_catalogCompact:true,_indexed:true,title:'A story',ar:'قصة',auth:'Writer',altTitles:['Hidden title']};
 data.prepareSearchIndexes([work]);assert.equal(work._indexed,true);assert.equal(data.matchesCatalogQuery(work,'Hidden'),true);assert.equal(data.matchesCatalogQuery(work,'قصة'),true);
});
test('cached noncompact search notices in-place alias edits without stale matches',()=>{
 const work={id:'dynamic',title:'Story',aliases:['Old alias']};assert.equal(data.matchesCatalogQuery(work,'Old alias'),true);work.aliases[0]='New alias';assert.equal(data.matchesCatalogQuery(work,'Old alias'),false);assert.equal(data.matchesCatalogQuery(work,'New alias'),true);
});
