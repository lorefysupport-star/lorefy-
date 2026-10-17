const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-growth-features.js'),'utf8');
const keys=['lorefy.user.library.v2','lorefy.user.progress.v2','lorefy.user.privateReviews.v2'];
function harness(failAt,options={}){
  const values=new Map([[keys[0],'{ "keep" : "paused" }'],[keys[1],'{ "keep" : { "chapter":8 } }'],[keys[2],'[ { "id":"kept","mid":"keep","userId":"me","r":3.25 } ]']]);
  if(options.absent){values.delete(keys[1]);values.delete(keys[2]);}
  const before=new Map(values),events=[];let writes=0,failed=false;
  const storage={getItem:k=>values.get(k)??null,setItem(k,v){
    if(options.rollbackFails&&failed&&k===keys[0]&&v===before.get(k))throw Error('restore unavailable');
    if(++writes===failAt){failed=true;throw Error('quota');}values.set(k,String(v));
  },removeItem:k=>values.delete(k)};
  const scope={global:{localStorage:storage,dispatchEvent:e=>events.push(e),CustomEvent:function(type,opts){this.type=type;this.detail=opts.detail;}},
    read:(k,f)=>values.has(k)?JSON.parse(values.get(k)):f,write:(k,v)=>{try{storage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}};
  vm.runInNewContext(source.slice(source.indexOf('  function imApply('),source.indexOf('  function imStatusFromAL(')),scope);
  return{apply:()=>scope.imApply([{work:{id:'new'},status:'reading',chapters:4,score:4.75}]),values,before,events,disableFailure(){failAt=-1;options.rollbackFails=false;}};
}
for(const failedWrite of [1,2,3])test('failure on import write '+failedWrite+' rejects, restores original raw values, and emits no success',()=>{
  const h=harness(failedWrite);assert.throws(h.apply,e=>e.code==='LOREFY_IMPORT_SAVE_FAILED');
  assert.deepEqual(h.values,h.before);assert.equal(h.events.length,0);
});
test('rollback removes keys that did not exist before the import',()=>{
  const h=harness(3,{absent:true});assert.throws(h.apply,e=>e.code==='LOREFY_IMPORT_SAVE_FAILED');
  assert.deepEqual(h.values,h.before);assert.equal(h.values.has(keys[1]),false);assert.equal(h.values.has(keys[2]),false);
});
test('a retry after restored failure writes once and retains earlier library/progress/rating',()=>{
  const h=harness(2);assert.throws(h.apply);h.disableFailure();const out=h.apply();
  assert.equal(out.added,1);assert.equal(out.ratings,1);assert.equal(h.events.length,3);
  const lib=JSON.parse(h.values.get(keys[0])),progress=JSON.parse(h.values.get(keys[1])),reviews=JSON.parse(h.values.get(keys[2]));
  assert.equal(lib.keep,'paused');assert.equal(progress.keep.chapter,8);assert.equal(reviews.find(r=>r.id==='kept').r,3.25);
  assert.equal(lib.new,'reading');assert.equal(progress.new.chapter,4);assert.equal(reviews.filter(r=>r.mid==='new').length,1);assert.equal(reviews.find(r=>r.mid==='new').r,4.75);
});
test('an incomplete rollback is reported separately, never as a success or fully restored state',()=>{
  const h=harness(2,{rollbackFails:true});assert.throws(h.apply,e=>e.code==='LOREFY_IMPORT_PARTIAL_SAVE');
  assert.notDeepEqual(h.values,h.before);assert.equal(h.events.length,0);
});
test('current successful imports still report success only after all three keys are saved',()=>{
  const h=harness(-1),out=h.apply();assert.equal(out.added,1);assert.equal(out.ratings,1);
  assert.equal(h.events.length,3);assert.deepEqual(h.events.map(e=>e.detail.key),keys);
});
