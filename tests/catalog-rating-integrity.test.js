const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { mapMangaDex } = require('../tools/build-api-catalog-expansion.js');

test('MangaDex imports do not manufacture ratings or engagement', () => {
  const work = mapMangaDex({ id: 'example', attributes: { title: { en: 'Example' } } }, 'Manga');
  for (const field of ['r', 'pop', 'baseRatings', 'baseReviews', 'weeklyReads', 'listAdds']) {
    assert.equal(work[field], 0, field);
  }
  assert.equal(work.rSrc, '');
});

test('legacy MangaDex records are cleaned without modifying personal progress', () => {
  const work = { id: 'md-example', r: 3.9, rSrc: 'MangaDex', pop: 800, baseRatings: 200,
    baseReviews: 20, weeklyReads: 80, listAdds: 40, prog: { ch: 12 }, mySt: 'reading', sc: { story: 3.9 } };
  const window = { LorefyMangaData: [work] };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'uploads/lorefy-catalog-quality.js'), 'utf8'), { window });
  for (const field of ['r', 'pop', 'baseRatings', 'baseReviews', 'weeklyReads', 'listAdds']) assert.equal(work[field], 0, field);
  assert.equal(work.rSrc, '');
  assert.equal(work.prog.ch, 12);
  assert.equal(work.mySt, 'reading');
  window.LorefyCatalogQuality.apply([work]);
  assert.equal(work.r, 0);
});

test('unattributed web novel scores and counters are not displayed as sourced ratings', () => {
  const work = {id:'fwn-novel-example',r:5,sc:{story:5},baseRatings:411660,baseReviews:45283,pop:100877,weeklyReads:139964,listAdds:48888,prog:{ch:12}};
  const window = {LorefyMangaData:[work]};
  vm.runInNewContext(fs.readFileSync(path.join(root,'uploads/lorefy-catalog-quality.js'),'utf8'),{window});
  for (const field of ['r','baseRatings','baseReviews','pop','weeklyReads','listAdds']) assert.equal(work[field],0,field);
  assert.equal(work.prog.ch,12);
});
