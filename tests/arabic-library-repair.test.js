const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = require('../modules/lorefy-catalog-data');
const identity = require('../modules/lorefy-catalog-identity');

function arabicImporter() {
  const filename = require.resolve('../tools/build-arabic-library');
  const source = fs.readFileSync(filename,'utf8');
  const scope = {require,__dirname:require('node:path').dirname(filename)};
  vm.runInNewContext(source.slice(0,source.lastIndexOf('\nmain().catch(')),scope);
  return scope;
}

test('verified Kanafani short stories override a provider novel label without guessing covers or changing personal state',()=>{
  const bibliography=require('../modules/lorefy-bibliographic-overrides');
  const w={id:'existing',title:'أرض البرتقال الحزين',auth:'غسان كنفاني',type:'رواية',cover:'personal',yr:1962};
  bibliography.apply(w);assert.equal(w.type,'كتاب');assert.ok(w.genres.includes('Short Stories'));
  assert.equal(w.id,'existing');assert.equal(w.cover,'personal');assert.equal(w.yr,1962);
  assert.equal(w.sourceCoverUrl,undefined);assert.match(w.provenance.bibliographyUrl,/library.alistiqlal.edu.ps/);
  const other={...w,auth:'مؤلف آخر',type:'رواية'};bibliography.apply(other);assert.equal(other.type,'رواية');
});

test('publisher-verified Taha Hussein forms distinguish novels from the Love Lost collection',()=>{
  const bibliography=require('../modules/lorefy-bibliographic-overrides');
  for(const [title,type,genre] of [['أديب','رواية','Fiction'],['دعاء الكروان','رواية','Fiction'],['الحب الضائع','كتاب','Short Stories']]) {
    const w={id:title,title,auth:'طه حسين',type:'كتاب',cover:'personal',r:0,yr:0};
    bibliography.apply(w);assert.equal(w.type,type);assert.ok(w.genres.includes(genre));
    assert.equal(w.cover,'personal');assert.equal(w.r,0);assert.equal(w.yr,0);
    assert.match(w.sourceCoverUrl,/downloads.hindawi.org\/covers\/svg/);
    assert.match(w.provenance.publisherUrl,/safahat.org\/books/);
  }
});

test('short-story collections stay books even when the provider also labels them fiction',()=>{
  const importer=arabicImporter();
  const search={q:'أدب',collection:'أدب عربي',genre:'Fiction'};
  const record={key:'/works/OL99W',title:'قصص عربية',author_name:['كاتب'],language:['ara'],subject:['Short stories','Fiction']};
  assert.equal(importer.mapRecord(record,search).type,'كتاب');
  assert.ok(importer.mapRecord(record,search).genres.includes('Short Stories'));
});

test('edition counts never become reader popularity and bibliographic context is not a synopsis',()=>{
  const importer=arabicImporter();
  const record=importer.mapRecord({key:'/works/OL99W',title:'رواية عربية',author_name:['كاتب معروف'],language:['ara'],edition_count:300,subject:['Arabic fiction']},{collection:'أدب عربي',genre:'Fiction'});
  assert.equal(record.pop,0);assert.equal(record.synopsis,'');assert.equal(record.editionCount,300);
});

test('verified collection correction preserves IDs and never reclassifies a comic adaptation or another author',()=>{
  const records=[
    {id:'old',title:'همس الجنون، كتاب إلكتروني',auth:'نجيب محفوظ',type:'رواية'},
    {id:'other',title:'همس الجنون',auth:'شخص آخر',type:'رواية'},
    {id:'comic',title:'همس الجنون',auth:'نجيب محفوظ',type:'كوميكس'}
  ];
  const scope={window:{LorefyMangaData:records,LorefyBibliographicOverrides:require('../modules/lorefy-bibliographic-overrides')}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-catalog-quality'),'utf8'),scope);
  assert.equal(records[0].id,'old');
  assert.equal(records[0].type,'كتاب');
  assert.ok(records[0].genres.includes('Short Stories'));
  assert.equal(records[1].type,'رواية');
  assert.equal(records[2].type,'كوميكس');
});

test('verified Mahfouz collections have real publisher metadata without invented ratings',()=>{
  const scope={window:{LorefyMangaData:[]}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-arabic-library'),'utf8'),scope);
  for(const title of ['همس الجنون','حكاية بلا بداية ولا نهاية','صباح الورد','أصداء السيرة الذاتية','أحلام فترة النقاهة']) {
    const w=scope.window.LorefyMangaData.find(w=>w.title===title&&w.auth==='نجيب محفوظ');
    assert.ok(w,title);assert.equal(w.type,'كتاب');assert.equal(w.r,0);
    assert.match(w.provenance.publisherUrl,/safahat.org\/books\//);
    assert.match(w.sourceCoverUrl,/downloads.hindawi.org\/covers\//);
  }
});

test('verified publisher identity merges a later collection edition but not an adaptation',()=>{
  const publisher=require('../modules/lorefy-bibliographic-overrides');
  const anchor={id:'lorefy-ar-curated-dawn',title:'الفجر الكاذب',auth:'نجيب محفوظ',type:'كتاب',yr:1989};
  const edition={id:'ol-OL99W',title:'الفجر الكاذب',auth:'محفوظ، نجيب',type:'كتاب',yr:2009};
  publisher.apply(anchor);publisher.apply(edition);
  assert.equal(identity.sameWork(anchor,edition,{}),true);
  assert.equal(identity.sameWork(anchor,{...edition,type:'كوميكس'},{}),false);
});

test('all 55 authored works in the verified publisher index are present in the Arabic catalog',()=>{
  const bibliography=require('../modules/lorefy-bibliographic-overrides');
  assert.equal(bibliography.entries.length,55);
  const scope={window:{LorefyMangaData:[]}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-arabic-library'),'utf8'),scope);
  for(const entry of bibliography.entries) {
    const work=scope.window.LorefyMangaData.find(w=>w.auth==='نجيب محفوظ'&&bibliography.find(w)?.title===entry.title);
    assert.ok(work,entry.title);
    assert.equal(work.provenance.publisherUrl,entry.publisherUrl);
    assert.ok(work.sourceCoverUrl,entry.title);
    if(entry.type) assert.equal(work.type,entry.type);
  }
});

test('publisher synopsis fills a cleaned legacy template without changing personal artwork or progress',()=>{
  const work={id:'ol-OL99W',title:'دنيا الله',auth:'نجيب محفوظ',type:'رواية',pl:'Open Library',
    synopsis:'This Lorefy entry includes source rating, reading progress, lists, reviews, and community discovery.',
    sourceCoverUrl:'https://example.com/provider.jpg',cover:'personal.jpg',prog:{ch:12}};
  const scope={window:{LorefyMangaData:[work],LorefyBibliographicOverrides:require('../modules/lorefy-bibliographic-overrides')}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-catalog-quality'),'utf8'),scope);
  assert.match(work.synopsis,/أربع عشرة/);
  assert.equal(work.cover,'personal.jpg');assert.equal(work.prog.ch,12);
  assert.equal(work.sourceCoverUrl,'https://example.com/provider.jpg');
});

test('detail hydration applies the quality pass and retains publisher synopsis attribution',async()=>{
  const work={id:'ol-OL99W',title:'دنيا الله',auth:'نجيب محفوظ',type:'كتاب',_catalogCompact:true,cover:'personal.jpg',prog:{ch:12}};
  const full={...work,_catalogCompact:undefined,pl:'Open Library',synopsis:'This Lorefy entry includes source rating, reading progress, lists, reviews, and community discovery.'};
  const scope={URLSearchParams,CustomEvent:class {},document:{scripts:[],readyState:'loading',addEventListener(){}},
    location:{search:''},history:{},setTimeout(){return 1;},clearTimeout(){},addEventListener(){},dispatchEvent(){},
    LorefyMangaData:[work],LorefyCatalogData:data,LorefyCatalogManifest:{workParts:{'ol-OL99W':1}},
    LorefyCatalogPlan:require('../modules/lorefy-catalog-plan'),LorefyBibliographicOverrides:require('../modules/lorefy-bibliographic-overrides'),
    fetch:async()=>({ok:true,text:async()=>`Array.prototype.push.apply(window.LorefyMangaData,${JSON.stringify([full])});`})};
  scope.window=scope;
  vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-catalog-quality'),'utf8'),scope);
  vm.runInNewContext(fs.readFileSync(require.resolve('../modules/lorefy-catalog-loader'),'utf8'),scope);
  delete work.synopsis;delete work.synopsisAr;delete work.synopsisAttribution;
  await scope.LorefyCatalogLoader.hydrateWork(work.id);
  assert.match(work.synopsis,/أربع عشرة/);
  assert.equal(work.synopsisAttribution,'https://www.safahat.org/books/14831357/');
  assert.equal(work._catalogCompact,false);assert.equal(work.cover,'personal.jpg');assert.equal(work.prog.ch,12);
});

test('Arabic imports classify source subjects, not the search term that found the book', () => {
  const importer=arabicImporter();
  const literature={q:'الأدب',type:'رواية',collection:'أدب عربي',genre:'Fiction'};
  const record={key:'/works/OL42W',title:'مقالات في الأدب والفكر',author_name:['كاتب معروف'],language:['ara'],subject:['Literature']};
  assert.equal(importer.mapRecord(record,literature).type,'كتاب');
  assert.equal(importer.mapRecord({...record,title:'الرواية المصرية',subject:['History and criticism','Fiction']},literature).type,'كتاب');
  assert.equal(importer.mapRecord({...record,title:'عمل روائي',subject:['Arabic fiction']},literature).type,'رواية');
  assert.equal(importer.mapRecord({...record,subject:['Graphic novels']},literature),null);
});

test('Arabic import rejects missing authors, non-Arabic editions and declared AI or explicit content', () => {
  const importer=arabicImporter();
  const search={q:'رواية',type:'رواية',collection:'أدب عربي',genre:'Fiction'};
  const record={key:'/works/OL42W',title:'رواية عربية',author_name:['كاتب معروف'],language:['ara'],subject:['Arabic fiction']};
  assert.equal(importer.mapRecord({...record,author_name:[]},search),null);
  assert.equal(importer.mapRecord({...record,language:['per']},search),null);
  assert.equal(importer.mapRecord({...record,subject:['AI-generated']},search),null);
  assert.equal(importer.mapRecord({...record,subject:['Erotic fiction']},search),null);
});

test('a book about modern farming is not Islamic just because its title contains الحديث', () => {
  const importer=arabicImporter();
  const record={key:'/works/OL42W',title:'المرجع الحديث في المحاصيل الحقلية',author_name:['كاتب معروف'],language:['ara'],subject:['Agriculture']};
  const work=importer.mapRecord(record,{q:'الحديث',type:'كتاب',collection:'إسلامي',genre:'Religion'});
  assert.equal(work.tags.includes('إسلامي'),false);
  assert.equal(work.genres.includes('Religion'),false);
});

test('search combines title and author words, including Arabic prefixes and normalization', () => {
  for (const compact of [false, true]) {
    const work = {id:'thief',title:'اللص والكلاب',auth:'نجيب محفوظ',_catalogCompact:compact};
    data.prepareCatalogRecords([work]);
    for (const query of ['نجيب اللص','نَجيب محفوظ اللص','اللص محفوظ','نجيب الكلا']) {
      assert.equal(data.matchesCatalogQuery(work,query),true,query);
    }
    assert.equal(data.matchesCatalogQuery(work,'نجيب مارتن'),false);
    assert.equal(data.matchesCatalogQuery(work,'جيب اللص'),false);
    const martin = {id:'martin',title:'A Game of Thrones',auth:'George R. R. Martin'};
    assert.equal(data.matchesCatalogQuery(martin,'Martin Thrones'),true);
    assert.equal(data.matchesCatalogQuery(martin,'Martin Tolkien'),false);
  }
});

test('verified Arabic novel anchors reconcile provider reprint years, without merging unrelated works', () => {
  const anchor = {id:'lorefy-ar-curated-palace',title:'قصر الشوق',auth:'نجيب محفوظ',type:'رواية',yr:1957};
  const edition = {id:'ol-OL1W',title:'قصر الشوق',auth:'محفوظ، نجيب',type:'رواية',yr:1991};
  assert.equal(identity.sameWork(anchor,edition,{}),true);
  assert.equal(identity.sameWork({...anchor,id:'unverified'},edition,{}),false);
  assert.equal(identity.sameWork(anchor,{...edition,auth:'كاتب آخر'},{}),false);
  assert.equal(identity.sameWork(anchor,{...edition,title:'قصر الشوق - Graphic Novel',type:'كوميكس'},{}),false);
});

test('merging catalog records retains alternate title and author search aliases', () => {
  const primary = {id:'one',title:'Work',altTitles:['First'],authorAliases:['Author One']};
  identity.mergeRecord(primary,{id:'two',title:'Work',altTitles:['Second'],authorAliases:['Author Two']});
  assert.deepEqual(primary.altTitles,['First','Second']);
  assert.deepEqual(primary.authorAliases,['Author One','Author Two']);
});

test('worker completion retains editorial metadata and old work IDs instead of dropping Arabic anchors', async () => {
  let listener;
  const edition = {id:'ol-OL1W',title:'قصر الشوق',auth:'نجيب محفوظ',type:'رواية',yr:1991,_catalogCompact:true};
  const anchor = {id:'lorefy-ar-curated-palace',title:'قصر الشوق',auth:'نجيب محفوظ',type:'رواية',yr:1957,
    _apiDynamic:true,tags:['عربي'],altTitles:['Palace of Desire']};
  const scope = {URLSearchParams,CustomEvent:class {},document:{scripts:[],readyState:'loading',addEventListener(){}},
    location:{search:''},history:{},setTimeout(fn){fn();return 1;},clearTimeout(){},addEventListener(){},dispatchEvent(){},
    LorefyMangaData:[anchor],LorefyCatalogIdentity:identity,LorefyCatalogData:data,
    LorefyCatalogAliases:{'ol-OL1W':anchor.id,'old-edition':anchor.id},
    LorefyCatalogPlan:{...require('../modules/lorefy-catalog-plan'),allCatalogParts:()=>[1]},
    Worker:class {addEventListener(type,fn){if(type==='message')listener=fn;} postMessage(){} terminate(){}}};
  scope.window=scope;
  vm.runInNewContext(fs.readFileSync(require.resolve('../modules/lorefy-catalog-loader'),'utf8'),scope);
  const loading=scope.LorefyCatalogLoader.loadAll();
  listener({data:{type:'records',records:[edition]}});
  listener({data:{type:'complete',parts:[1],aliases:{}}});
  await loading;
  assert.equal(scope.LorefyMangaData.length,1);
  assert.equal(scope.LorefyMangaData[0].id,'ol-OL1W');
  assert.ok(scope.LorefyMangaData[0].tags.includes('عربي'));
  assert.equal(scope.LorefyCatalogAliases[anchor.id],edition.id);
  assert.equal(scope.LorefyCatalogAliases[edition.id],undefined,'no canonical alias cycle');
  assert.equal(scope.LorefyCatalogAliases['old-edition'],edition.id,'old aliases remain directly resolvable');
  assert.equal(data.matchesCatalogQuery(scope.LorefyMangaData[0],'Palace Desire'),true);
});

test('Arabian Nights and Days belongs in the novel filter, not books or graphic adaptations', () => {
  const work={id:'ol-OL1599691W',title:'ليالي ألف ليلة',auth:'نجيب محفوظ',type:'كتاب',pl:'Open Library'};
  const adaptation={...work,id:'other',title:'ليالي ألف ليلة - Graphic Novel',type:'كوميكس'};
  const scope={window:{LorefyMangaData:[work,adaptation]}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../modules/lorefy-comics-taxonomy'),'utf8'),scope);
  assert.equal(work.type,'رواية');
  assert.equal(adaptation.type,'كوميكس');
});

test('Chinese manhua provider labels use the actual app category so imported works remain visible', () => {
  const records=[{id:'old',type:'مانهوا صيني'},{id:'imported',type:'مانهوا صينية'},{id:'english',type:'Manhua'}];
  const scope={window:{LorefyMangaData:records}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-catalog-quality'),'utf8'),scope);
  for (const record of records) assert.equal(record.type,'مانهوا صيني');
  assert.equal(identity.sameWork({id:'one',title:'Same',auth:'Writer',type:'مانهوا صيني',yr:2000},
    {id:'two',title:'Same',auth:'Writer',type:'مانهوا صينية',yr:2000},{}),true);
});

test('Arabic writer coverage includes missing major Mahfouz novels with source provenance', () => {
  const scope={window:{LorefyMangaData:[]}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-arabic-library'),'utf8'),scope);
  for (const title of ['عبث الأقدار','رادوبيس','كفاح طيبة','خان الخليلي','القاهرة الجديدة','الشحاذ','الكرنك','رحلة ابن فطومة']) {
    const work=scope.window.LorefyMangaData.find(w=>w.title===title&&w.auth==='نجيب محفوظ');
    assert.ok(work,title);
    assert.equal(work.type,'رواية');
    assert.ok(work.provenance.url.startsWith('https://'));
  }
});
