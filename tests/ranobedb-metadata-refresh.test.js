const test=require('node:test');
const assert=require('node:assert/strict');
const {enrichRecord}=require('../tools/refresh-ranobedb-metadata');

test('exact licensed source IDs fill missing metadata without changing personal fields or existing descriptions',()=>{
  const work={id:'ranobe-ln-42',title:'My title',type:'لايت نوفل',cover:'personal.jpg',sourceCoverUrl:'old.jpg',prog:{ch:8},synopsis:'Existing source description',genres:['Fantasy'],altTitles:['Old alias']};
  const candidate={id:work.id,type:work.type,language:'ja',genres:['Fantasy','Drama'],altTitles:['Original title'],synopsis:'New source description',sourceCoverUrl:'new.jpg',provenance:{url:'https://ranobedb.org/series/42',license:'ODbL-1.0'}};
  assert.equal(enrichRecord(work,candidate),true);
  assert.equal(work.language,'ja');assert.deepEqual(work.genres,['Fantasy','Drama']);
  assert.deepEqual(work.altTitles,['Old alias','Original title']);
  assert.equal(work.title,'My title');assert.equal(work.cover,'personal.jpg');assert.equal(work.sourceCoverUrl,'old.jpg');
  assert.equal(work.prog.ch,8);assert.equal(work.synopsis,'Existing source description');
  assert.equal(enrichRecord(work,candidate),false,'idempotent');
});

test('metadata refresh never confuses print and web originals or trusts unrelated and unsafe records',()=>{
  const work={id:'ranobe-web-42',title:'Work',type:'ويب نوفل'};
  const candidate={id:'ranobe-ln-42',type:'لايت نوفل',language:'ja',provenance:{url:'https://ranobedb.org/series/42',license:'ODbL-1.0'}};
  assert.equal(enrichRecord(work,candidate),false);
  assert.equal(enrichRecord({...work,id:'other'},{...candidate,id:'other'}),false);
  assert.equal(enrichRecord(work,{...candidate,id:work.id,type:work.type,genres:['Erotic']}),false);
  assert.equal(enrichRecord(work,{...candidate,id:work.id,type:work.type,provenance:{url:'https://example.com/',license:'ODbL-1.0'}}),false);
});
