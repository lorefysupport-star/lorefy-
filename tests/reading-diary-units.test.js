const test = require('node:test');
const assert = require('node:assert/strict');
const diary = require('../modules/lorefy-reading-diary-core.js');

const reading = 'أقرأ حالياً';
function state(progress, status = reading) {
  return {library:{work:status},progress:{work:progress}};
}
function milestone(unit, value, type = 'progress') {
  return {id:'work',type,chapter:0,at:1000,anchorType:unit,anchorValue:value};
}

test('diary records page and volume increases in their own units', () => {
  for (const [before,after,unit,value] of [
    [{page:20},{page:35},'page',35],
    [{volume:1},{volume:2},'volume',2],
    [{vol:1},{vol:3},'volume',3],
    [{chapter:7,page:20},{chapter:7,page:40},'page',40],
  ]) assert.deepEqual(diary.transitions(state(before),state(after),1000),[milestone(unit,value)]);
});

test('started and completed milestones retain page or volume checkpoints', () => {
  for (const [unit,value] of [['page',45],['volume',3]]) {
    assert.deepEqual(diary.transitions({},state({[unit]:value}),1000),[milestone(unit,value,'started')]);
    assert.deepEqual(diary.transitions(state({[unit]:value}),state({[unit]:value},'تم القراءة'),1000),[milestone(unit,value,'completed')]);
  }
});

test('inactive, unchanged, decreasing and invalid checkpoints do not fabricate milestones', () => {
  for (const status of ['أرغب بالقراءة','متوقف مؤقتاً','توقفت نهائياً']) {
    assert.deepEqual(diary.transitions(state({page:1},status),state({page:50},status),1000),[]);
  }
  for (const unit of ['page','volume']) {
    for (const value of [0,1,2,null,NaN,Infinity,-1]) {
      assert.deepEqual(diary.transitions(state({[unit]:2}),state({[unit]:value}),1000),[]);
    }
  }
  assert.deepEqual(diary.transitions(state({volume:2,vol:8}),state({volume:0,vol:9}),1000),[]);
});

test('multi-unit updates produce one milestone and preserve the legacy chapter event shape', () => {
  assert.deepEqual(diary.transitions(state({chapter:1,page:10,volume:1}),state({chapter:2,page:30,volume:2}),1000),
    [{id:'work',type:'progress',chapter:2,at:1000}]);
  assert.deepEqual(diary.transitions(state({page:10,volume:1}),state({page:30,volume:2}),1000),[milestone('page',30)]);
  assert.deepEqual(diary.transitions({},state({page:0,volume:0}),1000),[{id:'work',type:'started',chapter:0,at:1000}]);
  assert.deepEqual(diary.transitions(state(1),state(2),1000),[{id:'work',type:'progress',chapter:2,at:1000}]);
});

test('merging milestones distinguishes units and positions but deduplicates equivalent chapter events', () => {
  const page = milestone('page',20), laterPage = milestone('page',21), volume = milestone('volume',20);
  const legacy = {id:'work',type:'progress',chapter:20,at:1000};
  const anchored = {...legacy,anchorType:'chapter',anchorValue:20};
  const result = diary.merge([page,volume,legacy],[laterPage,page,anchored]);
  assert.equal(result.length,4);
  assert.deepEqual(result.map(diary.anchor),[
    {type:'page',value:21},{type:'page',value:20},{type:'chapter',value:20},{type:'volume',value:20},
  ]);
});

test('page and volume milestones share localized positions without fake chapter counts', () => {
  for (const [unit,value,arabic,english] of [['page',35,'الصفحة','Page'],['volume',3,'المجلد','Volume']]) {
    const event = diary.transitions(state({[unit]:1}),state({[unit]:value}),1000)[0];
    assert.ok(event);
    assert.match(diary.shareText(event,'Book',false,'ar'),new RegExp(arabic+' '+value));
    assert.match(diary.shareText(event,'Book',false,'en'),new RegExp(english+' '+value));
    assert.doesNotMatch(diary.shareText(event,'Book',false,'en'),/Chapter/);
  }
});
