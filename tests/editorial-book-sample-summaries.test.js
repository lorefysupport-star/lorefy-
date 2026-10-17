const test=require('node:test'),assert=require('node:assert/strict');
const editor=require('../uploads/lorefy-editorial-picks'),catalog=require('../modules/lorefy-catalog-data');
const cases=[["editorial-hindawi-96094025","https://www.safahat.org/books/96094025/"],["editorial-hindawi-72680850","https://www.safahat.org/books/72680850/"],["editorial-hindawi-91702848","https://www.safahat.org/books/91702848/"],["editorial-hindawi-13692027","https://www.safahat.org/books/13692027/"],["editorial-hindawi-42937527","https://www.safahat.org/books/42937527/"],["editorial-hindawi-24060925","https://www.safahat.org/books/24060925/"],["editorial-hindawi-16869631","https://www.safahat.org/books/16869631/"],["editorial-hindawi-27197141","https://www.safahat.org/books/27197141/"],["editorial-hindawi-71964748","https://www.safahat.org/books/71964748/"],["editorial-hindawi-14057418","https://www.safahat.org/books/14057418/"],["editorial-hindawi-28639404","https://www.safahat.org/books/28639404/"],["editorial-hindawi-69290757","https://www.safahat.org/books/69290757/"],["editorial-hindawi-52748271","https://www.safahat.org/books/52748271/"],["editorial-hindawi-96942429","https://www.safahat.org/books/96942429/"],["editorial-hindawi-37282530","https://www.safahat.org/books/37282530/"],["editorial-hindawi-42902931","https://www.safahat.org/books/42902931/"],["editorial-hindawi-85837484","https://www.safahat.org/books/85837484/"],["editorial-hindawi-79469294","https://www.safahat.org/books/79469294/"]];
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

test('all curated book cards retain attributed Arabic and English summaries',()=>{
 const books=editor.picks.filter(w=>w.type==='كتاب');assert.ok(books.length>=24);
 for(const w of books){assert.notEqual(catalog.sourceSynopsis(w,'ar'),'الوصف غير متوفر من المصدر.',w.id);assert.notEqual(catalog.sourceSynopsis(w,'en'),'No source synopsis available.',w.id);assert.match(w.synopsisAttribution?.url||'',/^https:\/\//,w.id);}
});
