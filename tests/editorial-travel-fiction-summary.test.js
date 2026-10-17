const test=require('node:test'),assert=require('node:assert/strict');
const editor=require('../uploads/lorefy-editorial-picks'),catalog=require('../modules/lorefy-catalog-data');
const cases=[["editorial-hindawi-59728170","https://www.safahat.org/books/59728170/"],["editorial-hindawi-49140393","https://www.safahat.org/books/49140393/"],["ol-comics-works-ol17095216w","https://www.abramsbooks.com/product/el-deafo_9781419712173/"]];
for(const[id,url]of cases){
test('a selected book/novel/comic has an attributed bilingual source summary: '+id,()=>{
 const work=editor.apply([],true).find(w=>w.id===id);assert.ok(work);
 assert.notEqual(catalog.sourceSynopsis(work,'ar'),'الوصف غير متوفر من المصدر.');
 assert.notEqual(catalog.sourceSynopsis(work,'en'),'No source synopsis available.');
 assert.match(work.synopsisAr,/[\u0600-\u06ff]/);assert.match(work.synopsisEn,/[A-Za-z]/);
 assert.equal(work.synopsisAttribution.url,url);assert.equal(work.synopsisAttribution.reviewedAt,'2026-10-17');assert.equal(work.synopsisAttribution.method,'editorial-paraphrase');
});
test('summary enrichment preserves the chosen ID, cover, saved progress and ratings: '+id,()=>{
 const original=editor.picks.find(w=>w.id===id),work={...original,cover:'qa-personal-cover',prog:{chapter:0,page:17},r:2.75,pop:12};
 editor.apply([work]);assert.equal(work.id,id);assert.equal(work.cover,'qa-personal-cover');assert.deepEqual(work.prog,{chapter:0,page:17});assert.equal(work.r,2.75);assert.equal(work.pop,12);
 const mismatch={id,title:'Different work',auth:original.auth};editor.apply([mismatch]);assert.equal(mismatch.synopsisAttribution,undefined);
});
}
