const test=require('node:test');
const assert=require('node:assert/strict');
const editor=require('../uploads/lorefy-editorial-picks');
const catalog=require('../modules/lorefy-catalog-data');
const cases=[
  [
    "editorial-hindawi-49160836",
    "https://www.safahat.org/books/49160836/"
  ],
  [
    "editorial-hindawi-25868315",
    "https://www.safahat.org/books/25868315/"
  ],
  [
    "editorial-hindawi-91719359",
    "https://www.safahat.org/books/91719359/"
  ]
];
for(const [id,url] of cases) test('reviewed discovery detail has bilingual publisher-grounded synopsis: '+id,()=>{
 const work=editor.apply([],true).find(w=>w.id===id);
 assert.ok(work,'reviewed work retained');
 assert.match(catalog.sourceSynopsis(work,'ar'),/[\u0600-\u06ff]/);
 assert.notEqual(catalog.sourceSynopsis(work,'ar'),'الوصف غير متوفر من المصدر.');
 assert.notEqual(catalog.sourceSynopsis(work,'en'),'No source synopsis available.');
 assert.equal(work.synopsisAttribution?.url,url);
 assert.equal(work.synopsisAttribution?.reviewedAt,'2026-10-17');
 assert.equal(work.synopsisAttribution?.method,'editorial-paraphrase');
 assert.equal(work.r,0);assert.equal(work.pop,0);
});
