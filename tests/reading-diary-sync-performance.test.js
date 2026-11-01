const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('../modules/lorefy-reading-diary-core.js');
const source = fs.readFileSync(require('node:path').join(__dirname, '../modules/lorefy-reading-diary.js'), 'utf8');

function setup(initialStore) {
  const store = initialStore || new Map([
    ['lorefy.user.library.v2', JSON.stringify({one:'أقرأ حالياً'})],
    ['lorefy.user.progress.v2', JSON.stringify({one:{chapter:1}})]
  ]);
  const reads = [], writes = [], stats = {parsed:0,serialized:0};
  const window = {
    document:{readyState:'loading',addEventListener(){},querySelector(selector){return selector === '#screen .lf-app' ? {} : null;}},
    LorefyReadingDiaryCore:core,
    localStorage:{getItem(key){reads.push(key);return store.get(key)??null;},setItem(key,value){writes.push(key);store.set(key,value);}},
  };
  vm.runInNewContext(source,{window,JSON:{parse(value){stats.parsed++;return JSON.parse(value);},stringify(value){stats.serialized++;return JSON.stringify(value);}}});
  return {sync:window.LorefyReadingDiary.sync,store,reads,writes,stats,window};
}

test('unchanged diary sync skips library parsing, serialization and writes',()=>{
  const h=setup();h.sync();const before={...h.stats};const writes=h.writes.length;
  for(let i=0;i<100;i++)h.sync();
  assert.deepEqual(h.stats,before);
  assert.equal(h.writes.length,writes);
});

test('diary raw-data shortcut still records real progress and completion exactly once',()=>{
  const h=setup();h.sync();
  h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{chapter:3}}));h.sync();h.sync();
  h.store.set('lorefy.user.library.v2',JSON.stringify({one:'تم القراءة'}));h.sync();h.sync();
  const events=JSON.parse(h.store.get('lorefy.user.readingDiary.v1'));
  assert.deepEqual(events.map(e=>[e.type,e.chapter]).sort(),[['completed',3],['progress',3]]);
  assert.equal(h.writes.filter(key=>key==='lorefy.user.readingDiarySnapshot.v1').length,3);
});

test('invalid diary data can recover and formatting-only changes do not rewrite snapshots',()=>{
  const h=setup();h.sync();const count=h.writes.length;
  h.store.set('lorefy.user.library.v2','{ "one": "أقرأ حالياً" }');h.sync();
  assert.equal(h.writes.length,count);
  h.store.set('lorefy.user.progress.v2','{broken');assert.doesNotThrow(h.sync);
  h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{chapter:4}}));h.sync();
  assert.equal(JSON.parse(h.store.get('lorefy.user.readingDiarySnapshot.v1')).progress.one.chapter,4);
});

test('temporary storage access errors do not poison the raw-data shortcut',()=>{
  const h=setup();h.sync();
  const read=h.window.localStorage.getItem;
  h.window.localStorage.getItem=()=>{throw Error('Storage unavailable');};
  assert.doesNotThrow(h.sync);
  h.window.localStorage.getItem=read;
  h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{chapter:5}}));h.sync();
  assert.equal(JSON.parse(h.store.get('lorefy.user.readingDiarySnapshot.v1')).progress.one.chapter,5);
});

test('actual diary sync persists page and volume milestones once without regressing the unchanged shortcut',()=>{
  for(const unit of ['page','volume']){
    const h=setup();
    h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{[unit]:1}}));h.sync();
    h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{[unit]:3}}));h.sync();
    const before={...h.stats};const writes=h.writes.length;h.sync();h.sync();
    assert.deepEqual(h.stats,before);assert.equal(h.writes.length,writes);
    const events=JSON.parse(h.store.get('lorefy.user.readingDiary.v1')||'[]');
    assert.equal(events.length,1);assert.equal(events[0].anchorType,unit);
    assert.equal(events[0].anchorValue,3);assert.equal(events[0].chapter,0);
  }
});

test('failed milestone write retains the old checkpoint and retries unchanged progress',()=>{
  for(const unit of ['chapter','page','volume']){
    const h=setup();h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{[unit]:1}}));h.sync();
    const snapshot=h.store.get('lorefy.user.readingDiarySnapshot.v1'),write=h.window.localStorage.setItem;
    h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{[unit]:3}}));
    h.window.localStorage.setItem=(key,value)=>{
      if(key==='lorefy.user.readingDiary.v1')throw Error('QuotaExceededError');
      write(key,value);
    };
    h.sync();h.sync();
    assert.equal(h.store.get('lorefy.user.readingDiarySnapshot.v1'),snapshot);
    assert.equal(h.store.get('lorefy.user.readingDiary.v1'),undefined);
    h.window.localStorage.setItem=write;h.sync();h.sync();
    const events=JSON.parse(h.store.get('lorefy.user.readingDiary.v1')||'[]');
    assert.equal(events.length,1);assert.deepEqual(core.anchor(events[0]),{type:unit,value:3});
    assert.equal(JSON.parse(h.store.get('lorefy.user.readingDiarySnapshot.v1')).progress.one[unit],3);
  }
});

test('recovery records the latest checkpoint after further progress without duplicates',()=>{
  const h=setup();h.sync();const write=h.window.localStorage.setItem;
  h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{chapter:3}}));
  h.window.localStorage.setItem=(key,value)=>{if(key==='lorefy.user.readingDiary.v1')throw Error('Storage unavailable');write(key,value);};
  h.sync();h.window.localStorage.setItem=write;
  h.store.set('lorefy.user.progress.v2',JSON.stringify({one:{chapter:5}}));h.sync();h.sync();
  const events=JSON.parse(h.store.get('lorefy.user.readingDiary.v1')||'[]');
  assert.deepEqual(events.map(event=>[event.type,event.chapter]),[['progress',5]]);
  assert.equal(JSON.parse(h.store.get('lorefy.user.readingDiarySnapshot.v1')).progress.one.chapter,5);
});

test('failed completion history can recover after reload without losing existing notes',()=>{
  const h=setup();h.sync();const write=h.window.localStorage.setItem;
  const note={id:'one',type:'note',note:'Keep this note',entryId:'existing-note',chapter:1,at:1};
  h.store.set('lorefy.user.readingDiary.v1',JSON.stringify([note]));
  h.store.set('lorefy.user.library.v2',JSON.stringify({one:'تم القراءة'}));
  h.window.localStorage.setItem=(key,value)=>{if(key==='lorefy.user.readingDiary.v1')throw Error('Storage unavailable');write(key,value);};
  h.sync();
  const reloaded=setup(h.store);reloaded.sync();reloaded.sync();
  const events=JSON.parse(h.store.get('lorefy.user.readingDiary.v1'));
  assert.equal(events.length,2);assert.equal(events[0].type,'completed');assert.deepEqual(events[1],note);
});
