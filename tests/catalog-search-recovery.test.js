const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../modules/lorefy-catalog-data.js');

test('search accepts unindexed records and rejects invalid records without throwing',()=>{
  const rows=[null,{}, {id:'hunter',title:'Hunter x Hunter'}, {id:'numeric',title:42,auth:15}];
  assert.deepEqual(rows.filter(row=>data.matchesCatalogQuery(row,'hunter')).map(row=>row.id),['hunter']);
  assert.equal(data.matchesCatalogQuery(rows[3],'42'),true);
});
test('Arabic search handles diacritics and alef variants',()=>{
  assert.equal(data.matchesCatalogQuery({id:'book',ar:'إِبْن بَطُّوطَة'},'ابن بطوطة'),true);
});
test('search includes alternate titles and author names before indexing completes',()=>{
  const work={id:'work',title:'English title',auth:'A Writer',altTitles:['عنوان عربي']};
  assert.equal(data.matchesCatalogQuery(work,'عنوان'),true);
  assert.equal(data.matchesCatalogQuery(work,'writer'),true);
  assert.equal(data.matchesCatalogQuery(work,''),true);
});
