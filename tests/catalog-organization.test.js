const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function qualityFor(records) {
  const source = fs.readFileSync(path.join(root, 'uploads/lorefy-catalog-quality.js'), 'utf8');
  const window = { LorefyMangaData: records };
  vm.runInNewContext(source, { window });
  return window.LorefyCatalogQuality;
}

test('estimated Open Library popularity and rating do not masquerade as reader activity', () => {
  const estimated = {
    id: 'ol-comics-example', title: 'Example', pl: 'Open Library Comics',
    r: 4.1, pop: 17388, baseRatings: 64946, baseReviews: 7144,
    weeklyReads: 22082, listAdds: 11988,
    synopsis: 'Example is a comic. This Lorefy entry includes source rating, reading progress, lists, reviews, and community discovery.'
  };
  const measured = { id: 'anilist-example', title: 'Measured', pl: 'AniList', rSrc: 'AniList', r: 4.4, pop: 230, baseRatings: 50, synopsis: 'A real description.' };
  qualityFor([estimated, measured]);

  assert.equal(estimated.r, 0);
  assert.equal(estimated.pop, 0);
  assert.equal(estimated.baseRatings, 0);
  assert.equal(estimated.baseReviews, 0);
  assert.equal(estimated.weeklyReads, 0);
  assert.equal(estimated.listAdds, 0);
  assert.equal(estimated.synopsis, '');
  assert.equal(estimated.rec, false);
  assert.equal(measured.r, 4.4);
  assert.equal(measured.pop, 230);
});

test('templated Arabic Open Library descriptions are removed instead of claiming a false format', () => {
  const record = {
    id: 'ol-comics-example', title: 'Example', pl: 'Open Library Comics', type: 'كوميكس',
    synopsis: '«Example» عمل مصوّر من إبداع Author. يمزج بين Fantasy، Graphic Novels. مكتمل · صدر عام 2003.'
  };
  qualityFor([record]);
  assert.equal(record.synopsis, '');
});

test('declared synthetic ratings and engagement are removed for every provider, not just Open Library',()=>{
  const records=[
    {id:'jarir-one',title:'Book',pl:'Jarir catalog',rSrc:'تقدير',r:3.8,pop:309,baseRatings:235,baseReviews:30,weeklyReads:82,listAdds:50,sc:{story:3.9},cover:'personal.jpg',prog:{ch:4}},
    {id:'other',title:'Other',pl:'Publisher',rSrc:'Estimated',r:4,pop:100,baseRatings:40},
    {id:'real',title:'Real',pl:'AniList',rSrc:'AniList',r:4.2,pop:20,baseRatings:10}
  ];
  qualityFor(records);
  for(const work of records.slice(0,2)) {
    for(const field of ['r','pop','baseRatings','baseReviews','weeklyReads','listAdds']) assert.equal(work[field],0,field);
    assert.equal(work.rSrc,'');assert.deepEqual(Object.keys(work.sc),[]);
  }
  assert.equal(records[0].cover,'personal.jpg');assert.equal(records[0].prog.ch,4);
  assert.equal(records[2].r,4.2);assert.equal(records[2].baseRatings,10);
});

test('retailer catalog boilerplate is not treated as a story synopsis',()=>{
  const work={id:'jarir-one',title:'Book',pl:'Jarir catalog',synopsis:'Book من Writer. متاح ضمن فهرس مكتبة جرير في تصنيف القصة والرواية.'};
  const data=require('../modules/lorefy-catalog-data');
  assert.equal(data.sourceSynopsis(work,'en'),'No source synopsis available.');
  qualityFor([work]);assert.equal(work.synopsis,'');
});

test('Open Library source ratings stay intact without invented engagement counts', () => {
  const records = [
    { id: 'ol-rated', title: 'Rated', pl: 'Open Library', rSrc: 'Open Library', r: 4.2, pop: 18, baseRatings: 14 },
    { id: 'ol-estimated', title: 'Estimated', pl: 'Open Library', rSrc: 'تقدير', r: 3.9, pop: 17000, baseRatings: 64000 }
  ];
  const quality = qualityFor(records);
  quality.apply(records);
  assert.equal(records[0].r, 4.2);
  assert.equal(records[0].baseRatings, 0);
  assert.equal(records[0].pop, 0);
  assert.equal(records[1].r, 0);
  assert.equal(records[1].baseRatings, 0);
});

test('Open Library results without a source rating do not invent scores or reader counts', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-api-catalog.js'), 'utf8');
  const window = { __lorefyCatalogReady: true, setTimeout, clearTimeout, addEventListener() {}, history: { pushState() {}, replaceState() {} } };
  window.window = window;
  vm.runInNewContext(source, { window, Date, Set, Map, Promise, URLSearchParams });
  const work = window.LorefyApiCatalog.mapOpenLibrary({
    key: '/works/OL100W', title: 'Unknown Rating', author_name: ['Writer'], edition_count: 20
  }, 'كتاب');
  assert.equal(work.r, 0);
  assert.equal(work.rSrc, '');
  assert.equal(work.pop, 0);
  assert.equal(work.baseRatings, 0);
  assert.equal(work.baseReviews, 0);
  assert.equal(work.weeklyReads, 0);
  assert.equal(work.listAdds, 0);
  assert.equal(work.synopsis, '');
});

test('editorial choice skips estimated entries when a sourced work is available', () => {
  const plan = require('../modules/lorefy-catalog-plan.js');
  const estimated = { id: 'estimated', _catalogEstimated: true };
  const sourced = { id: 'sourced', rSrc: 'AniList' };
  assert.equal(plan.pickFeaturedWork([estimated], [sourced], [], [], []), sourced);
  assert.equal(plan.pickFeaturedWork([estimated], [], [], [], []), estimated);
});

test('remote comics preserve source subtitles, full subjects and edition language availability', () => {
  const source=fs.readFileSync(path.join(root,'modules/lorefy-api-catalog.js'),'utf8');
  const window={__lorefyCatalogReady:true,setTimeout,clearTimeout,addEventListener(){},history:{pushState(){},replaceState(){}}};
  window.window=window;
  vm.runInNewContext(source,{window,Date,Set,Map,Promise,URLSearchParams});
  const doc={key:'/works/OL1W',title:'Batman',subtitle:'Year One',author_name:['Frank Miller'],language:['eng','ara'],subject:Array.from({length:12},(_,i)=>'Subject '+i)};
  const work=window.LorefyApiCatalog.mapOpenLibrary(doc,'كوميكس');
  assert.equal(work.title,'Batman: Year One');
  assert.ok(work.altTitles.includes('Batman'));
  assert.equal(work.genres.length,12);
  assert.deepEqual(Array.from(work.availableLanguages),['eng','ara']);
  assert.equal(work.language,undefined,'edition languages are not proof of an original language');
  assert.equal(window.LorefyApiCatalog.mapOpenLibrary({...doc,title:'Batman: Year One'},'كوميكس').title,'Batman: Year One');
});

test('comics search keeps different works with the same title separate', () => {
  const search = require('../modules/lorefy-comics-search.js');
  const works = [
    { id: 'batman-1988', title: 'Batman', type: 'كوميكس', auth: 'Alan Moore', yr: 1988 },
    { id: 'batman-1989', title: 'Batman', type: 'كوميكس', auth: 'Craig Shaw Gardner', yr: 1989 }
  ];
  assert.deepEqual(search.groupResults(works).map((work) => work.id), ['batman-1988', 'batman-1989']);
});

test('comics search groups actual duplicate editions while preserving alternate choices', () => {
  const search = require('../modules/lorefy-comics-search.js');
  const works = [
    { id: 'batman-a', title: 'Batman: Year One', type: 'كوميكس', auth: 'Frank Miller', yr: 1987 },
    { id: 'batman-b', title: 'Batman: Year One', type: 'كوميكس', auth: 'Frank Miller', yr: 1988 }
  ];
  const grouped = search.groupResults(works);
  assert.equal(grouped.length, 1);
  assert.deepEqual(grouped[0]._searchAlternates.map((work) => work.id), ['batman-a', 'batman-b']);
});

test('bundled expansion can be loaded from a local type shard without a catalog gateway', async () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-api-catalog.js'), 'utf8');
  const requested = [];
  const storage = new Map();
  const window = {
    URLSearchParams,
    location: { search: '?type=Book' },
    LOREFY_REMOTE_CATALOG: { autoWarmCurrentType: false, warmAllTypes: false, providers: {} },
    LorefyMangaData: [],
    __lorefyCatalogReady: true,
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    fetch: async (url) => {
      requested.push(String(url));
      if (!String(url).includes('output/api-catalog/book.json')) throw new Error('unexpected gateway request');
      return { ok: true, json: async () => ({ works: [
        { id: 'ol-new-a', title: 'New A', type: 'كتاب' },
        { id: 'ol-new-b', title: 'New B', type: 'كتاب' }
      ] }) };
    },
    setTimeout, clearTimeout,
    addEventListener() {},
    history: { pushState() {}, replaceState() {} }
  };
  window.window = window;
  vm.runInNewContext(source, { window, URLSearchParams, Date, Set, Map, Promise, console });

  const result = await window.LorefyApiCatalog.loadExpandedType('Book', { target: 2 });
  assert.equal(result.added, 2);
  assert.equal(window.LorefyMangaData.length, 2);
  assert.equal(requested.length, 1);
  assert.match(requested[0], /output\/api-catalog\/book\.json/);
});
