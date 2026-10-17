const test=require('node:test'),assert=require('node:assert/strict');
const editor=require('../uploads/lorefy-editorial-picks'),catalog=require('../modules/lorefy-catalog-data');
const cases=[["ol-comics-works-ol265609w","https://kids.scholastic.com/content/kids64/en/books/bone/books.html"],["ol-comics-works-ol8842598w","https://www.scholastic.com/parents/books-and-reading/book-lists-and-recommendations/series-characters-authors/amulet-series.print.html"],["ol-comics-works-ol1800611w","https://www.mouseguard.net/fall"],["ol-OL19670795W","https://www.scholastic.ca/our-books/book/target-practice-9780545528436"],["ol-comics-works-ol20024169w","https://us.macmillan.com/books/9781626726529/thenamelesscity/"],["ol-OL24244816W","https://meganwagnerlloyd.com/allergic/"],["ol-OL20919671W","https://varianjohnson.com/books/twins/"],["ol-comics-works-ol8756330w","https://www.scholastic.com/raina/smile/index.html"],["ol-comics-works-ol20152649w","https://jerrycraft.com/books/new-kid/"],["ol-comics-works-ol17342469w","https://www.penguinrandomhouse.com/books/313687/roller-girl-by-victoria-jamieson/"],["ol-comics-works-ol19743879w","https://www.penguinrandomhouse.com/books/552031/the-cardboard-kingdom-by-chad-sell/"],["ol-comics-works-ol19671690w","https://www.penguinrandomhouse.com/books/236029/hilo-book-1-the-boy-who-crashed-to-earth-by-judd-winick/"],["ol-OL16050250W","https://www.simonandschuster.com/books/Calvin-and-Hobbes/Bill-Watterson/Calvin-and-Hobbes/9780836220889"],["ol-comics-works-ol25897w","https://openlibrary.org/books/OL5616395M/Peanuts_Treasury"],["ol-comics-works-ol17610986w","https://www.scholastic.com/site/dav-pilkey-books/dog-man-books/dog-man.html"],["ol-comics-works-ol15528w","https://www.penguinrandomhouse.com/books/695243/marvels-the-remastered-edition-by-kurt-busiek/"],["ol-OL24444057W","https://www.dc.com/graphic-novels/kingdom-come-1996/kingdom-come-new-edition"],["ol-OL6670904W","https://www.dc.com/graphic-novels/all-star-superman-2005/all-star-superman-vol-2"],["ol-OL19670109W","https://www.penguinrandomhouse.com/the-read-down/coming-of-age-graphic-novels/"],["ol-OL19730671W","https://www.marvel.com/comics/issue/61529/"],["ol-OL25641243W","https://www.penguinrandomhouse.com/books/114571/batman-year-one-by-frank-miller-david-mazzucchelli/"]];
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

test('all curated comic cards retain attributed Arabic and English summaries',()=>{
 const books=editor.picks.filter(w=>w.type==='كوميكس');assert.ok(books.length>=24);
 for(const w of books){assert.notEqual(catalog.sourceSynopsis(w,'ar'),'الوصف غير متوفر من المصدر.',w.id);assert.notEqual(catalog.sourceSynopsis(w,'en'),'No source synopsis available.',w.id);assert.match(w.synopsisAttribution?.url||'',/^https:\/\//,w.id);}
});
