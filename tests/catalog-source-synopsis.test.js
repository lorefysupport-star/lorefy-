const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../modules/lorefy-catalog-data.js');

test('Arabic readers see the original source instead of an invented translation', () => {
  assert.equal(catalog.sourceSynopsis({synopsisEn:'A source description of the actual story.'}, 'ar'), 'A source description of the actual story.');
});
test('real Arabic synopsis is preferred and missing plot remains missing', () => {
  assert.equal(catalog.sourceSynopsis({synopsisAr:'وصف أصلي من المصدر',synopsisEn:'Original story.'}, 'ar'), 'وصف أصلي من المصدر');
  assert.equal(catalog.sourceSynopsis({title:'Book',genres:['Fantasy']}, 'en'), 'No source synopsis available.');
});
test('catalog placeholders are not presented as plot summaries', () => {
  for (const synopsis of ['Curated manga entry for readers.', 'Book is available in the Lorefy book catalog.', 'Book by Writer. Open Library subjects: Fantasy']) {
    assert.equal(catalog.sourceSynopsis({synopsis}, 'en'), 'No source synopsis available.');
  }
});
test('search cache follows record edits, including aliases', () => {
  const work={id:'a',title:'First',aliases:['Original']};
  assert.equal(catalog.matchesCatalogQuery(work,'first'),true);
  work.title='Second';work.aliases.push('Changed');
  assert.equal(catalog.matchesCatalogQuery(work,'first'),false);
  assert.equal(catalog.matchesCatalogQuery(work,'changed'),true);
});

test('generic generated Arabic plots cannot replace an actual source', () => {
  const fake = 'تدور القصة حول «العادات الذرية»، كتاب من تأليف جيمس كلير. يمزج العمل بين تطوير الذات. تتطور الأحداث عبر رحلة تكشف دوافع الشخصيات وعلاقاتها.';
  assert.equal(catalog.sourceSynopsis({synopsisAr: fake}, 'ar'), 'الوصف غير متوفر من المصدر.');
  assert.equal(catalog.sourceSynopsis({synopsisAr: fake, synopsisEn: 'A guide to building habits.'}, 'ar'), 'A guide to building habits.');
});

test('bibliographic boilerplate is not a plot in either language', () => {
  for (const synopsis of ['Completed web novel listed on FreeWebNovel with 2,037 chapters.', 'عمل باللغة العربية ضمن أدب عربي في فهرس Open Library.', 'عنوان عربي منتقى ضمن أدب عربي.']) {
    assert.equal(catalog.sourceSynopsis({synopsis}, 'en'), 'No source synopsis available.');
  }
});

test('Arabic author search accepts transliteration, reversed names and tatweel', () => {
  const work = {id:'mahfouz',title:'Palace Walk',auth:'Najīb Maḥfūẓ'};
  for (const query of ['نجيب محفوظ','محفوظ نجيب','نـجيب مـحفوظ','Naguib Mahfouz']) {
    assert.equal(catalog.matchesCatalogQuery(work,query),true,query);
  }
  assert.equal(catalog.matchesCatalogQuery({id:'other',title:'Different',auth:'Another author'},'نجيب محفوظ'),false);
});
