const test=require('node:test'),assert=require('node:assert/strict');
const metrics=require('../modules/lorefy-reading-metrics.js');
test('a published review earns its completion once without changing the saved reading choice',()=>{
 const library={a:'أقرأ حالياً'},progressById={a:{chapter:12}};
 const review=metrics.withReviewCompletion({mid:'a',userId:'me',txt:'My review'}, {ch:384,vol:42});
 const totals=metrics.calculateReadingMetrics({library,progressById,reviews:[review]});
 assert.equal(totals.chapters,384);assert.equal(totals.hours,77);
 assert.deepEqual(library,{a:'أقرأ حالياً'});assert.deepEqual(progressById,{a:{chapter:12}});
});
test('review completion and later manual progress are alternate counts, never added twice',()=>{
 const review=metrics.withReviewCompletion({mid:'a',userId:'me'}, {ch:100});
 assert.equal(metrics.calculateReadingMetrics({library:{a:'تم القراءة'},progressById:{a:{chapter:150}},reviews:[review,review]}).chapters,150);
 const updated=metrics.withReviewCompletion({...review,txt:'Edited'}, {ch:500});
 assert.equal(updated.completionProgress.chapter,100);
 assert.equal(metrics.calculateReadingMetrics({library:{},reviews:[updated]}).chapters,100);
});
test('ratings belonging to another reader cannot inflate the current reader statistics',()=>{
 const review=metrics.withReviewCompletion({mid:'a',userId:'other'}, {ch:100});
 assert.equal(metrics.calculateReadingMetrics({library:{},reviews:[review],ownerId:'me-id'}).chapters,0);
 assert.equal(metrics.calculateReadingMetrics({library:{},reviews:[review],ownerId:'other'}).chapters,100);
});
test('unknown totals do not invent chapters or hours and pages do not duplicate volume time',()=>{
 const review=metrics.withReviewCompletion({mid:'a',userId:'me'}, {pages:200,vol:1});
 const totals=metrics.calculateReadingMetrics({library:{},reviews:[review]});
 assert.equal(totals.chapters,0);assert.equal(totals.minutes,300);
 assert.equal(metrics.calculateReadingMetrics({reviews:[metrics.withReviewCompletion({mid:'x',userId:'me'},{})]}).hours,0);
});
