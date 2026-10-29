const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync('modules/lorefy-growth-features.js', 'utf8');
const library = 'lorefy.user.library.v2', progress = 'lorefy.user.progress.v2', reviews = 'lorefy.user.privateReviews.v2';
function harness(initial = {}) {
  const values = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)])), events = [];
  const works = [{ id:'first', title:'First' }, { id:'second', title:'Second' }];
  const storage = { getItem:k => values.get(k) ?? null, setItem:(k,v) => values.set(k,String(v)), removeItem:k => values.delete(k) };
  const scope = { global:{ localStorage:storage, dispatchEvent:e => events.push(e), CustomEvent:function(type,options){this.detail=options.detail;} },
    uiText:(ar,en) => en, read:(k,f) => values.has(k) ? JSON.parse(values.get(k)) : f,
    write:(k,v) => { storage.setItem(k,JSON.stringify(v)); return true; },
    imFindByTitle:title => works.find(w => w.title === title), IM_DONE:'done', IM_READING:'reading', IM_WISH:'wish', IM_PAUSED:'paused', IM_DROPPED:'dropped' };
  vm.runInNewContext(source.slice(source.indexOf('  function imApply('),source.indexOf('  function imStatusFromAL(')),scope);
  const start=source.indexOf('  function imParseCsvLine(');
  vm.runInNewContext(source.slice(start,source.indexOf('  /* Kitsu',start)),scope);
  return { scope, values, works, events, read:k => JSON.parse(values.get(k)),
    apply:(rows,options) => scope.imApply(rows,options), row:(i=0,more={}) => ({work:works[i],status:'done',chapters:40,score:4.25,...more}) };
}

test('Goodreads retains quoted multiline review text, punctuation and Arabic', () => {
  const h=harness();
  const body='تفاصيل جميلة،\nA "quoted" ending.';
  const csv='Title,My Rating,Exclusive Shelf,My Review\nFirst,4,read,"تفاصيل جميلة،\nA ""quoted"" ending."';
  const rows=h.scope.imParseGoodreads(csv).rows;
  assert.equal(rows[0].review,body);
  const result=h.apply(rows), saved=h.read(reviews)[0];
  assert.equal(saved.txt,body); assert.equal(saved.r,4); assert.equal(result.reviews,1);
});

for(const column of ['Review','My Review','Review Text','المراجعة'])test('generic CSV accepts explicit review column '+column, () => {
  const h=harness(), rows=h.scope.imParseGenericCsv('Title,Rating,'+column+'\nFirst,4.5,"My exported review"').rows;
  assert.equal(rows[0].review,'My exported review');
  h.apply(rows); assert.equal(h.read(reviews)[0].txt,'My exported review');
});

test('private notes are not silently reclassified as a review', () => {
  const h=harness(), rows=h.scope.imParseGenericCsv('Title,Rating,Notes\nFirst,4.5,"Private reminder"').rows;
  h.apply(rows); assert.equal(h.read(reviews)[0].txt,'—');
});

test('text-only reviews remain unrated, not a zero-rating dislike', () => {
  const h=harness(), result=h.apply([h.row(0,{score:0,review:'An unrated review'})]);
  const saved=h.read(reviews)[0];
  assert.equal(saved.txt,'An unrated review');assert.equal(saved.r,null);assert.equal(saved.recVal,'');
  assert.equal(result.ratings,0);assert.equal(result.reviews,1);
});

test('an existing library status/progress does not prevent importing missing review content', () => {
  const h=harness({[library]:{first:'reading'},[progress]:{first:{chapter:7,note:'Keep'}}});
  const result=h.apply([h.row(0,{review:'A new imported review'})]);
  assert.equal(h.read(library).first,'reading');assert.equal(h.read(progress).first.chapter,7);
  assert.equal(h.read(progress).first.note,'Keep');assert.equal(h.read(reviews)[0].txt,'A new imported review');
  assert.equal(result.added,0);assert.equal(result.reviews,1);
});

test('import fills a missing text without overwriting an existing fractional rating or dislike', () => {
  for(const rating of [4.75,0]){
    const original={id:'saved',mid:'first',userId:'me',r:rating,txt:'—',recVal:'no',ts:123};
    const h=harness({[library]:{first:'paused'},[reviews]:[original]});
    const result=h.apply([h.row(0,{score:5,review:'Recovered exported text'})]);
    const saved=h.read(reviews)[0];
    assert.equal(saved.r,rating);assert.equal(saved.recVal,'no');assert.equal(saved.id,'saved');assert.equal(saved.ts,123);
    assert.equal(saved.txt,'Recovered exported text');assert.equal(result.ratings,0);assert.equal(result.reviews,1);
  }
});

test('authored reviews, legacy owner records and retry results remain unchanged without duplicates', () => {
  for(const user of [{userId:'me'},{}]){
    const original={id:'saved',mid:'first',r:3.75,txt:'My own current review',...user};
    const h=harness({[library]:{first:'paused'},[reviews]:[original]});
    h.apply([h.row(0,{review:'Different imported text'})]);
    h.apply([h.row(0,{review:'Different imported text'})]);
    assert.equal(h.read(reviews).length,1);assert.deepEqual(h.read(reviews)[0],original);
  }
});

test('duplicate rows and repeated imports produce one record per owner/work', () => {
  const h=harness(), rows=[h.row(0),h.row(0,{review:'Text from the second duplicate'})];
  h.apply(rows);h.apply(rows);
  assert.equal(h.read(reviews).length,1);assert.equal(h.read(reviews)[0].txt,'Text from the second duplicate');
});

test('multiple existing works get distinct local review IDs', () => {
  const h=harness({[library]:{first:'done',second:'reading'}});
  h.apply([h.row(0,{review:'First text'}),h.row(1,{review:'Second text'})]);
  const saved=h.read(reviews);assert.equal(saved.length,2);assert.equal(new Set(saved.map(r=>r.id)).size,2);
});

test('failed review-content save rolls all three keys back and permits explicit retry', () => {
  const h=harness({[library]:{first:'reading'},[reviews]:[{id:'saved',mid:'first',userId:'me',r:4.75,txt:'—'}]});
  const before=new Map(h.values), write=h.scope.write;
  h.scope.write=(key,value) => key===reviews ? false : write(key,value);
  assert.throws(()=>h.apply([h.row(0,{review:'Text to retry'})]),e=>e.code==='LOREFY_IMPORT_SAVE_FAILED');
  assert.deepEqual(h.values,before);assert.equal(h.events.length,0);
  h.scope.write=write;h.apply([h.row(0,{review:'Text to retry'})]);
  assert.equal(h.read(reviews).length,1);assert.equal(h.read(reviews)[0].txt,'Text to retry');
});

test('opting out keeps ratings but does not save review text', () => {
  const h=harness(),result=h.apply([h.row(0,{review:'Do not import this text'})],{reviews:false});
  assert.equal(h.read(reviews)[0].txt,'—');assert.equal(h.read(reviews)[0].r,4.25);assert.equal(result.reviews,0);
});

test('new imported reviews explicitly stay private instead of publishing automatically', () => {
  const h=harness();h.apply([h.row(0,{review:'Imported text'})]);
  assert.equal(h.read(reviews)[0].isPublic,false);
});
