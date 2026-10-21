const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const budget=require('../modules/lorefy-storage-budget');
function quotaStorage(max,initial){const data=new Map(Object.entries(initial));return{data,getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k),setItem(k,v){const size=[...data].filter(([key])=>key!==k).reduce((n,[key,value])=>n+key.length+value.length,0)+k.length+v.length;if(size>max){const error=Error('full');error.name='QuotaExceededError';throw error;}data.set(k,v);}};}
test('a quota-blocked slot save reclaims downloaded catalog only and survives reopening',()=>{
 const key='lorefy.user.profileTopCharacters.v1',cache='lorefy.api.catalog.cache.v3';
 const storage=quotaStorage(330,{[key]:'[null,null,null,null]',[cache]:'x'.repeat(200),'lorefy.user.library.v2':'{"book":"reading"}'});
 const choice=[null,{workId:'work',characterKey:'hero',character:{name:'Hero'}},null,null],value=JSON.stringify(choice);
 assert.throws(()=>storage.setItem(key,value),/full/);assert.equal(budget.write(storage,key,value),true);
 assert.equal(storage.getItem(cache),null);assert.equal(JSON.parse(storage.getItem(key))[1].character.name,'Hero');assert.equal(storage.getItem('lorefy.user.library.v2'),'{"book":"reading"}');
});
test('exhausted account storage reports failure and never removes account or sync data',()=>{
 const storage=quotaStorage(120,{'lorefy.user.library.v2':'x'.repeat(50),'lorefy.pendingState.v1':'pending'});
 assert.equal(budget.write(storage,'lorefy.user.profileTopCharacters.v1','x'.repeat(200)),false);
 assert.equal(storage.data.size,2);assert.equal(storage.getItem('lorefy.pendingState.v1'),'pending');
});
test('non-quota failures are not hidden or treated as permission to delete caches',()=>{
 const storage=quotaStorage(500,{'lorefy.api.catalog.cache.v3':'download'});storage.setItem=()=>{throw Error('blocked');};
 assert.throws(()=>budget.write(storage,'favorites','value'),/blocked/);assert.equal(storage.data.size,1);
});
test('oversized catalog downloads are bounded and batch references stay valid',()=>{
 const source=fs.readFileSync('modules/lorefy-api-catalog.js','utf8'),values=new Map(),works=Array.from({length:100},(_,i)=>({id:String(i),description:'x'.repeat(20000)}));
 const scope={MAX_CACHE_CHARS:512*1024,MAX_CACHED_WORKS:6000,CACHE_KEY:'cache',config:()=>({}),uniqueWorks:v=>v,nowIso:()=>new Date().toISOString(),write:(k,v)=>values.set(k,JSON.stringify(v))};
 const start=source.indexOf('  function saveCache('),end=source.indexOf('  function batchKey(',start);vm.runInNewContext(source.slice(start,end),scope);
 const cached={works,batches:{recent:{at:new Date().toISOString(),ids:works.map(w=>w.id)}}};scope.saveCache(cached);
 assert.ok(values.get('cache').length<=512*1024);assert.ok(cached.works.length>0);const ids=new Set(cached.works.map(w=>w.id));assert.ok(cached.batches.recent.ids.every(id=>ids.has(id)));
});
