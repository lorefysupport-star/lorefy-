const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = require('../modules/lorefy-catalog-data');

test('the complete application bundle parses after performance transformations',()=>{
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(require.resolve('../uploads/files/lorefy-app.js'),'utf8')));
});

function runtime(works) {
  const source = fs.readFileSync(require.resolve('../uploads/files/lorefy-app.js'), 'utf8');
  const start = source.indexOf('const SEARCH_CACHE=');
  const end = source.indexOf('function App(', start);
  const context = {
    window: { LorefyCatalogPolicy: { isRecommendationEligible: () => true }, LorefyCatalogData: data },
    MANGA: works, workById: id => works.find(w => w.id === id),
    STATUS_READING: 'reading', STATUS_DONE: 'done', STATUS_WISHLIST: 'wish', STATUS_PAUSED: 'paused',
    normalizeProgress: x => x || {}, arGenreOf: x => x, sourceRating: w => w.r || 0,
    workWeight: () => 0, workYear: w => w.yr || 0, currentUILang: () => 'ar',
    ratingConfidenceScore: w => w.r || 0
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  return {...context.window.LorefyRecommendationDebug, homeRows:context.homeRows};
}

test('reading-language recommendations change with language instead of returning a stale account cache',()=>{
  const app=runtime([
    {id:'arabic',title:'حكاية عربية',auth:'كاتب',type:'رواية',language:'ar'},
    {id:'english',title:'English Story',auth:'Writer',type:'رواية',language:'en'}
  ]);
  assert.equal(app.personalizedWorks('الكل',{}, {},{userKey:'reader',language:'ar'})[0].id,'arabic');
  assert.equal(app.personalizedWorks('الكل',{}, {},{userKey:'reader',language:'en'})[0].id,'english');
});

test('Arabic interface does not override a reader who reads English books',()=>{
  const app=runtime([
    {id:'seed',title:'A Seed',auth:'One',type:'Novel',language:'en',genres:['Fantasy']},
    {id:'english',title:'Another',auth:'Two',type:'Novel',language:'en',genres:['Fantasy']},
    {id:'arabic',title:'عمل عربي',auth:'آخر',type:'Novel',language:'ar',genres:['Fantasy']}
  ]);
  assert.equal(app.personalizedWorks('الكل',{}, {seed:'reading'},{userKey:'reader',language:'ar'})[0].id,'english');
});

test('language is not inferred from a translated Arabic alias of a Japanese work',()=>{
  assert.equal(data.workLanguage({title:'Hunter x Hunter',ar:'هنتر',language:'ja'}),'ja');
  assert.equal(data.workLanguage({title:'حكايات عربية'}),'ar');
  assert.equal(data.workLanguage({title:'A Story'}),'');
});

test('book discovery uses recommendation eligibility and language before its bounded selection',()=>{
  const works=Array.from({length:120},(_,i)=>({id:'en-'+i,title:'English '+i,type:'كتاب',language:'en',r:4}));
  works.push({id:'ar',title:'كتاب عربي',type:'كتاب',language:'ar',r:0});
  works.push({id:'blocked',title:'Blocked',type:'كتاب',language:'ar',r:5,_catalogCompact:true,_recommendationEligible:false});
  const app=runtime(works);
  assert.equal(app.homeRows('الكل','ar').books[0].id,'ar');
  assert.ok(!app.homeRows('الكل','ar').books.some(w=>w.id==='blocked'));
  assert.equal(app.homeRows('الكل','en').books[0].language,'en');
});

test('rated and popular shelves do not promote missing scores or invented activity',()=>{
  const app=runtime([{id:'unrated',title:'Unrated',type:'كتاب',r:0,pop:0},
    {id:'rated',title:'Rated',type:'كتاب',r:4,rSrc:'Open Library',pop:12},
    {id:'unsourced',title:'Unsourced',type:'كتاب',r:5,pop:0}]);
  assert.deepEqual(Array.from(app.homeRows('الكل','ar').topRated,w=>w.id),['rated']);
  assert.deepEqual(Array.from(app.homeRows('الكل','ar').friendPopular,w=>w.id),['rated']);
});

test('bounded top ranking matches full sort without rescoring comparisons', () => {
  let calls = 0;
  const rows = Array.from({ length: 10000 }, (_, id) => ({ id, score: id % 89 }));
  const result = data.topRanked(rows, row => { calls++; return row.score; }, 100);
  assert.deepEqual(result.map(x => x.id), rows.slice().sort((a,b) => b.score-a.score || a.id-b.id).slice(0,100).map(x=>x.id));
  assert.equal(calls, rows.length);
});

test('full search ordering scores each record once and preserves tied source order',()=>{
  let calls=0;
  const rows=Array.from({length:10000},(_,id)=>({id,score:id%37}));
  const ranked=data.sortRanked(rows,row=>{calls++;return row.score;});
  assert.equal(calls,rows.length);
  assert.deepEqual(ranked.map(w=>w.id),rows.slice().sort((a,b)=>b.score-a.score).map(w=>w.id));
});

test('recommendation cache includes library statuses, not just work IDs', () => {
  const works = [
    {id:'seed',title:'Seed',auth:'Writer',type:'Novel',genres:['Fantasy']},
    {id:'fantasy',title:'F',auth:'A',type:'Novel',genres:['Fantasy']},
    {id:'romance',title:'R',auth:'B',type:'Novel',genres:['Romance']}
  ];
  const app = runtime(works);
  const positive = app.personalizedWorks('الكل', {}, {seed:'reading'}, {userKey:'one'});
  const negative = app.personalizedWorks('الكل', {}, {seed:'paused'}, {userKey:'one'});
  assert.notEqual(positive[0].id, negative[0].id);
});

test('precomputed taste features avoid repeated text analysis during ranking', () => {
  const work = {id:'cached',title:'Cached',type:'Novel',_tasteGenreKeys:['fantasy']};
  Object.defineProperty(work, 'genres', {get(){ throw new Error('repeated analysis'); }});
  const app = runtime([work]);
  assert.equal(app.personalizedWorks('الكل', {}, {}, {userKey:'one'})[0].id,'cached');
});

test('discovery uses only the active account reviews and immutable account ID', () => {
  const source = fs.readFileSync(require.resolve('../uploads/files/lorefy-app.js'), 'utf8');
  assert.match(source, /reviews:M\.filter/);
  assert.match(source, /userKey:window\.LorefyBackend\?\.user\?\.id/);
});

test('different reader tastes produce different recommendations and exclude already-read works',()=>{
  const works=[{id:'fantasy',title:'F',auth:'A',type:'Novel',genres:['Fantasy']},
    {id:'romance',title:'R',auth:'B',type:'Novel',genres:['Romance']}];
  const app=runtime(works);
  assert.equal(app.personalizedWorks('الكل',{genres:['Fantasy']},{},{userKey:'reader-one'})[0].id,'fantasy');
  assert.equal(app.personalizedWorks('الكل',{genres:['Romance']},{},{userKey:'reader-two'})[0].id,'romance');
  assert.ok(!app.personalizedWorks('الكل',{}, {fantasy:'done'}, {userKey:'reader-one'}).some(w=>w.id==='fantasy'));
});

test('explore feedback changes the account cache and excludes not interested works',()=>{
  const works=[{id:'seed',title:'Seed',type:'Novel',genres:['Fantasy']},
    {id:'fantasy',title:'Fantasy',type:'Novel',genres:['Fantasy']},
    {id:'romance',title:'Romance',type:'Novel',genres:['Romance']}];
  const app=runtime(works);
  const more=app.personalizedWorks('الكل',{}, {},{userKey:'same',feedback:{seed:{value:'more_like_this'}}});
  assert.equal(more[0].id,'fantasy');
  const hidden=app.personalizedWorks('الكل',{}, {},{userKey:'same',feedback:{fantasy:{value:'not_interested'}}});
  assert.ok(!hidden.some(w=>w.id==='fantasy'));
});

test('compact catalog keeps authors, identities and complete genre metadata', () => {
  const {compactRecord,featuresRuntime} = require('../tools/build-runtime-catalog');
  const work = {id:'one',title:'Story',ar:'Story',auth:'Writer',type:'Novel',
    genres:['Fantasy','Adventure'],synopsis:'magic '.repeat(1000),sourceCoverUrl:'https://example.com/cover.jpg'};
  const card = compactRecord(work,featuresRuntime());
  assert.equal(card.id,work.id);
  assert.equal(card.auth,work.auth);
  assert.deepEqual(card.genres,work.genres);
  assert.equal(card.synopsis.length,400);
  assert.equal(work.synopsis.length,6000);
  assert.ok(card._tasteGenreKeys.includes('fantasy'));
  assert.ok(card._catalogCompact);
});

test('detail cards preserve available source scores without requiring absent ones',()=>{
  const {compactRecord,featuresRuntime}=require('../tools/build-runtime-catalog');
  const work={id:'scores',title:'A Story',sc:{story:4.2}};
  assert.deepEqual(compactRecord(work,featuresRuntime()).sc,work.sc);
  const app=fs.readFileSync(require.resolve('../uploads/files/lorefy-app.js'),'utf8');
  assert.match(app,/m\.sc\?\.\[g\.k\]\?\?"-"/);
});

test('worker loads lightweight cards and full descriptions hydrate on detail navigation', () => {
  const worker = fs.readFileSync(require.resolve('../modules/lorefy-catalog-worker.js'),'utf8');
  const loader = fs.readFileSync(require.resolve('../modules/lorefy-catalog-loader.js'),'utf8');
  assert.match(worker,/catalog-runtime/);
  assert.match(loader,/hydrateWork\(route.workId\)/);
  assert.match(loader,/work\._catalogCompact = false/);
});

test('content eligibility refreshes after adult, AI or title metadata changes',()=>{
  const policy=require('../modules/lorefy-catalog-policy');
  const work={id:'dynamic',title:'A Story',r:4,rSrc:'source',contentRating:'safe',genres:['Fantasy']};
  assert.equal(policy.isRecommendationEligible(work),true);
  work.genres.push('Hentai');
  assert.equal(policy.isRecommendationEligible(work),false);
  work.genres.pop();work.aiGenerated=true;
  assert.equal(policy.isRecommendationEligible(work),false);
  work.aiGenerated=false;work.title='The Bible';
  assert.equal(policy.isRecommendationEligible(work),false);
});

test('background search indexes retain punctuation, Arabic aliases and changed author metadata',()=>{
  const rows=data.prepareCatalogRecords([{id:'one',_catalogCompact:true,title:'A Story',auth:'George R. R. Martin'}]);
  assert.ok(rows[0]._queryIndex);
  assert.equal(data.matchesCatalogQuery(rows[0],'George Martin'),true);
  assert.equal(data.matchesCatalogQuery(rows[0],'جورج مارتن'),true);
  rows[0].auth='Another Writer';
  assert.equal(data.matchesCatalogQuery(rows[0],'George Martin'),false);
  assert.equal(data.matchesCatalogQuery(rows[0],'Another Writer'),true);
});
