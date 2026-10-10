'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const filename=path.join(__dirname,'../tools/arabic-open-catalog-core.js');
const core=fs.existsSync(filename)?require(filename):{};
const cell=value=>({value});

test('bootstrap catalog shards and worker hydration share the updated catalog cache version',()=>{
  const root=path.join(__dirname,'..');
  const loader=fs.readFileSync(path.join(root,'modules/lorefy-catalog-loader.js'),'utf8');
  const version=/var version = "([^"]+)"/.exec(loader)[1];
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(index.includes("'.js?v="+version+"\"><\\/script>"));
  assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('lorefy-data-part05.js?v='+version));
});
function row(extra={}) {
  return Object.fromEntries(Object.entries({work:'http://www.wikidata.org/entity/Q123',workLabel:'رواية عربية',author:'http://www.wikidata.org/entity/Q456',authorLabel:'كاتب معروف',authorEn:'Known Writer',kindLabel:'novel',date:'2010-01-01T00:00:00Z',...extra}).map(([key,value])=>[key,cell(value)]));
}

test('Arabic Wikidata rows produce one work rather than counting types, editions and author rows',()=>{
  assert.equal(typeof core.mapWikidata,'function');
  const works=core.mapWikidata([row({isbn:'9780000000001'}),row({kindLabel:'literary work',isbn:'9780000000002'}),row({author:'http://www.wikidata.org/entity/Q789',authorLabel:'كاتب ثان',authorEn:'Second Writer'})]);
  assert.equal(works.length,1);
  assert.equal(works[0].type,'رواية');assert.equal(works[0].yr,2010);
  assert.equal(works[0].auth,'كاتب معروف، كاتب ثان');
  assert.deepEqual(works[0].authorAliases,['Known Writer','Second Writer']);
  assert.equal(works[0].provenance.license,'CC0-1.0');
  assert.equal(works[0].r,0);assert.equal(works[0].pop,0);assert.equal(works[0].synopsis,'');
});

test('Arabic imports exclude films, articles, declared AI, explicit metadata and unresolved modern dates',()=>{
  assert.equal(typeof core.mapWikidata,'function');
  for(const extra of [{kindLabel:'film'},{kindLabel:'scientific article'},{workLabel:'AI-generated رواية'},{genreLabel:'erotic fiction'},{date:'2024-01-01T00:00:00Z'},{date:''},{authorLabel:''},{work:'https://evil.test/Q123'}]) {
    assert.equal(core.mapWikidata([row(extra)]).length,0,JSON.stringify(extra));
  }
  assert.equal(core.mapWikidata([row({kindLabel:'short story collection'})])[0].type,'كتاب');
  assert.ok(core.mapWikidata([row({kindLabel:'short story collection'})])[0].genres.includes('Short Stories'));
});

test('Wikidata literary form determines novels and collections while book editions are not separate works',()=>{
  const works=core.mapWikidata([row({kindLabel:'literary work',formLabel:'novel'})]);
  assert.equal(works[0].type,'رواية');
  assert.equal(core.mapWikidata([row({kindLabel:'literary work',formLabel:'short story collection'})])[0].type,'كتاب');
  assert.equal(core.mapWikidata([row({kindLabel:'book edition',formLabel:'novel'})]).length,0);
});

test('Wikidata disambiguation suffixes become aliases, not duplicate work titles or stripped volume numbers',()=>{
  assert.equal(core.mapWikidata([row({workLabel:'أم سعد (رواية)'})])[0].title,'أم سعد');
  assert.ok(core.mapWikidata([row({workLabel:'أم سعد (رواية)'})])[0].altTitles.includes('أم سعد (رواية)'));
  assert.equal(core.mapWikidata([row({workLabel:'التاريخ (الجزء الثاني)'})])[0].title,'التاريخ (الجزء الثاني)');
});

test('rerunning an import corrects its own generic classification without replacing personal state',()=>{
  const old={id:'wikidata-Q123',title:'عنوان',auth:'المؤلف',type:'كتاب',genres:['Literature'],cover:'custom',prog:{ch:4}};
  core.reconcile([old],[{...old,type:'رواية',genres:['Fiction'],provenance:{url:'https://www.wikidata.org/wiki/Q123'},language:'ar'}]);
  assert.equal(old.type,'رواية');assert.ok(old.genres.includes('Fiction'));assert.equal(old.cover,'custom');assert.equal(old.prog.ch,4);
});

test('OpenITI Arabic catalog deduplicates text editions, keeps aliases and does not invent publication years or use graphs as covers',()=>{
  assert.equal(typeof core.mapOpeniti,'function');
  const item={version_uri:'0354Author.Book.Edition-ara1',title_ar:'عنوان كتاب :: الاسم الآخر',author_ar:'المؤلف العربي',author_lat:'Author Latin',title_lat:'Book Latin',date:'0354',tags:'PRIMARY_VERSION :: JK@التاريخ',thumbnail_url:'https://example.test/reuse-graph.jpg',text_url:'https://raw.githubusercontent.com/openiti/release/master/data/0354Author/0354Author.Book/edition'};
  const works=core.mapOpeniti([item,{...item,version_uri:'0354Author.Book.Other-ara1'},{...item,version_uri:'0354Author.Book.Other-per1'}]);
  assert.equal(works.length,1);assert.equal(works[0].yr,0);
  assert.equal(works[0].sourceCoverUrl,'');assert.equal(works[0].synopsis,'');
  assert.ok(works[0].altTitles.includes('الاسم الآخر'));
  assert.ok(works[0].genres.includes('History'));
  assert.equal(works[0].provenance.license,'CC-BY-NC-SA-4.0');
  assert.equal(works[0].provenance.authorDeathYearAH,354);
});

test('official OpenITI TSV keeps literal quotation marks without losing column alignment',()=>{
  assert.equal(typeof core.parseOpeniti,'function');
  const tsv='version_uri\tdate\tauthor_ar\ttitle_ar\n0354Author.Book.One-ara1\t0354\tالمؤلف "المعروف"\tكتاب "عنوان"\n';
  const rows=core.parseOpeniti(tsv);
  assert.equal(rows[0].author_ar,'المؤلف "المعروف"');
  assert.equal(rows[0].title_ar,'كتاب "عنوان"');
});

test('OpenITI author name variants are aliases and biography classes are not medical books',()=>{
  const w=core.mapOpeniti([{version_uri:'0354Author.Book.Edition-ara1',title_ar:'طبقات الشعراء',author_ar:'المؤلف :: الاسم الكامل للمؤلف',author_lat:'Writer',tags:'JK@الطبقات :: ShamAY@تراجم',date:'0354'}])[0];
  assert.equal(w.auth,'المؤلف');assert.ok(w.authorAliases.includes('الاسم الكامل للمؤلف'));
  assert.ok(w.genres.includes('Biography'));assert.equal(w.genres.includes('Medicine'),false);
  const medical=core.mapOpeniti([{version_uri:'0354Author.Medical.Edition-ara1',title_ar:'كتاب الطب',author_ar:'المؤلف',tags:'JK@الطب',date:'0354'}])[0];
  assert.ok(medical.genres.includes('Medicine'));
});

test('OpenITI aliases from later editions remain searchable without turning into coauthors',()=>{
  const item={version_uri:'0354Author.Book.One-ara1',title_ar:'كتاب',author_ar:'المؤلف',tags:''};
  const work=core.mapOpeniti([item,{...item,version_uri:'0354Author.Book.Two-ara1',author_ar:'المؤلف :: اسم عربي آخر'}])[0];
  assert.equal(work.auth,'المؤلف');assert.ok(work.authorAliases.includes('اسم عربي آخر'));
});

test('an empty or limit-truncated source cannot withdraw existing source records',()=>{
  assert.equal(typeof core.assertCompleteSource,'function');
  assert.throws(()=>core.assertCompleteSource([],20000),/empty/i);
  assert.throws(()=>core.assertCompleteSource(new Array(20000),20000),/limit/i);
  assert.doesNotThrow(()=>core.assertCompleteSource([row()],20000));
});

test('Arabic enrichment resolves exact provider IDs but preserves existing personal artwork and reading state',()=>{
  assert.equal(typeof core.reconcile,'function');
  const base={id:'ol-OL123W',title:'Arabic Novel',auth:'Known Writer',type:'رواية',_apiSourceId:'OL123W',cover:'personal-cover',prog:{ch:19},mySt:'read',yr:2014};
  const incoming={id:'wikidata-Q123',title:'الرواية العربية',auth:'كاتب معروف',type:'رواية',openLibraryId:'OL123W',authorAliases:['Known Writer'],language:'ar',genres:['Fiction'],r:0,pop:0};
  const result=core.reconcile([base],[incoming]);
  assert.equal(result.additions.length,0);assert.equal(result.enriched,1);
  assert.equal(base.id,'ol-OL123W');assert.equal(base.cover,'personal-cover');assert.equal(base.prog.ch,19);assert.equal(base.yr,2014);
  assert.ok(base.altTitles.includes('الرواية العربية'));assert.ok(base.authorAliases.includes('كاتب معروف'));
  assert.equal(core.reconcile([base],[incoming]).enriched,0);
  const adaptation={...base,id:'comic',type:'كوميكس'};
  assert.equal(core.reconcile([adaptation],[incoming]).additions.length,1);
});
