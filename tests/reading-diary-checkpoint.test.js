const test=require('node:test'),assert=require('node:assert/strict');
const diary=require('../modules/lorefy-reading-diary-core.js');
function spoiler(type='chapter',value=5){return{id:'work',type:'note',spoiler:true,anchorType:type,anchorValue:value,note:'hidden'};}
test('current chapter zero or partial value cannot reveal spoilers through an older alias',()=>{
 for(const chapter of [0,2,null,NaN,Infinity,-1])assert.equal(diary.canReveal(spoiler(),{library:{work:'أقرأ حالياً'},progress:{work:{chapter,ch:12}}}),false,String(chapter));
 assert.equal(diary.canReveal(spoiler(),{progress:{work:{chapter:5,ch:12}}}),true);
});
test('current volume controls spoiler access independently from the legacy volume',()=>{
 assert.equal(diary.canReveal(spoiler('volume',3),{progress:{work:{volume:0,vol:8,chapter:100}}}),false);
 assert.equal(diary.canReveal(spoiler('volume',3),{progress:{work:{volume:3,vol:0}}}),true);
 assert.equal(diary.canReveal(spoiler('volume',3),{progress:{work:{vol:3}}}),true);
});
test('legacy checkpoints remain supported and units do not substitute for one another',()=>{
 assert.equal(diary.canReveal(spoiler(),{progress:{work:{ch:5}}}),true);
 assert.equal(diary.canReveal(spoiler('page',20),{progress:{work:{ch:100,page:19}}}),false);
 assert.equal(diary.canReveal(spoiler(),{progress:{work:5}}),true);
});
test('invalid and infinite checkpoint values cannot reveal spoilers or enter diary history',()=>{
 assert.equal(diary.canReveal(spoiler('page',20),{progress:{work:{page:Infinity}}}),false);
 assert.deepEqual(diary.transitions({library:{work:'أقرأ حالياً'},progress:{work:{chapter:2}}},
  {library:{work:'أقرأ حالياً'},progress:{work:{chapter:Infinity}}},1000),[]);
});
