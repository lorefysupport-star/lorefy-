const test=require('node:test');
const assert=require('node:assert/strict');
const {auditMetadata}=require('../tools/catalog-metadata-audit');

test('metadata audit counts actual gaps without treating an unrated work as defective',()=>{
  const report=auditMetadata([
    {id:'one',title:'Complete',auth:'Writer',type:'Book',yr:1990,genres:['History'],
      sourceCoverUrl:'https://example.com/cover.jpg',synopsis:'A genuine source synopsis.',r:0},
    {id:'two',title:'Batman',auth:'Unknown',type:'Comics',r:0}
  ]);
  assert.equal(report.scanned,2);assert.equal(report.unrated,2);
  assert.equal(report.missingSynopsis,1);assert.equal(report.missingCoverReference,1);
  assert.equal(report.missingAuthor,1);assert.equal(report.ambiguousComicTitles,1);
  assert.equal(report.recordsWithMetadataGaps,1);
});

test('an audit never auto-merges generic comic titles or guesses metadata',()=>{
  const works=[{id:'one',title:'Batman',type:'Comics',auth:'Writer A'},
    {id:'two',title:'Batman',type:'Comics',auth:'Writer B'}];
  const before=JSON.stringify(works);
  const report=auditMetadata(works);
  assert.equal(report.ambiguousComicTitles,2);
  assert.equal(JSON.stringify(works),before);
});
