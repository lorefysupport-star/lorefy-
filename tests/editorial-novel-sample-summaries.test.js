const test=require('node:test'),assert=require('node:assert/strict');
const editor=require('../uploads/lorefy-editorial-picks'),catalog=require('../modules/lorefy-catalog-data');
const cases=[["n-wuthering-heights","https://www.penguinrandomhouse.com/books/836206/wuthering-heights-by-emily-bronte-with-an-introduction-by-margot-livesey/"],["n-little-women","https://www.penguinrandomhouse.com/books/1688/little-women-by-louisa-may-alcott/"],["n-great-gatsby","https://www.penguinrandomhouse.com/books/653881/the-great-gatsby-by-f-scott-fitzgerald/"],["n-war-and-peace","https://www.penguinrandomhouse.com/books/179305/war-and-peace-by-leo-tolstoy/9780375760648/"],["n-crime-and-punishment","https://www.penguinrandomhouse.com/books/318117/crime-and-punishment-by-fyodor-dostoyevsky-translated-with-an-introduction-and-notes-by-oliver-ready-cover-by-zohar-lazar/"],["n-moby-dick","https://www.penguinrandomhouse.com/books/832154/moby-dick-or-the-whale-by-herman-melville/"],["n-frankenstein","https://www.penguinrandomhouse.com/books/595367/frankenstein-by-mary-shelley/"],["n-dracula","https://www.penguinrandomhouse.com/books/832200/dracula-by-bram-stoker/"],["n-count-of-monte-cristo","https://www.penguinrandomhouse.com/books/832247/the-count-of-monte-cristo-by-alexandre-dumas/"],["n-three-musketeers","https://www.penguinrandomhouse.com/books/218581/the-three-musketeers-by-alexandre-dumas/"],["n-don-quixote","https://www.penguinrandomhouse.com/books/38511/don-quixote-by-miguel-de-cervantes/"],["n-alice-wonderland","https://www.penguin.co.uk/books/59520/alices-adventures-in-wonderland-by-carroll-lewis/9780241430651"],["n-wizard-of-oz","https://www.penguinrandomhouse.com/books/299225/the-wonderful-wizard-of-oz-by-l-frank-baum/9780451530295/"],["editorial-hindawi-52627375","https://www.safahat.org/books/52627375/"],["editorial-hindawi-63631953","https://www.safahat.org/books/63631953/"],["editorial-hindawi-61715937","https://www.safahat.org/books/61715937/"],["editorial-hindawi-96841847","https://www.safahat.org/books/96841847/"],["editorial-hindawi-61803142","https://www.safahat.org/books/61803142/"]];
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

test('all curated novel cards retain attributed Arabic and English summaries',()=>{
 const books=editor.picks.filter(w=>w.type==='رواية');assert.ok(books.length>=23);
 for(const w of books){assert.notEqual(catalog.sourceSynopsis(w,'ar'),'الوصف غير متوفر من المصدر.',w.id);assert.notEqual(catalog.sourceSynopsis(w,'en'),'No source synopsis available.',w.id);assert.match(w.synopsisAttribution?.url||'',/^https:\/\//,w.id);}
});
