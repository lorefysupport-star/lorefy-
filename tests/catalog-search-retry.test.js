const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../modules/lorefy-catalog-loader.js'), 'utf8');

function harness() {
  const documentEvents = new Map(), scripts = [], fetches = [], failures = new Set(), holdParts = new Set(), pendingScripts = new Map();
  let indexFails = false, heldIndex = null;
  const rows = [[2,'needle-a','Needle A','','Writer','مانجا'],[3,'needle-b','Needle B','','Writer','مانجا'],[4,'novel','Needle Novel','','Writer','رواية']];
  const data = [{id:'initial',title:'Initial',type:'مانجا'}];
  const doc = {readyState:'loading',scripts:[],addEventListener:(n,fn)=>documentEvents.set(n,fn),
    createElement:()=>({dataset:{}}),head:{appendChild(script) {
      const part = Number(script.dataset.lorefyCatalogPart); scripts.push(part);
      const finish = ()=>queueMicrotask(()=>{
        if(failures.has(part)) { script.onerror(); return; }
        data.push({id:'loaded-'+part,title:'Needle '+part,type:'مانجا'});script.onload();
      });
      if(holdParts.has(part)) pendingScripts.set(part,finish); else finish();
    }}};
  const win = {document:doc,location:{search:''},LorefyMangaData:data,
    LOREFY_INITIAL_CATALOG_PARTS:[1],LorefyCatalogManifest:{partCount:4,featuredParts:[1],types:{Manga:[1,2,3],Novel:[4]}},
    LorefyCatalogPlan:require('../modules/lorefy-catalog-plan'),LorefyCatalogData:require('../modules/lorefy-catalog-data'),
    setTimeout(fn,ms){if(ms>=5000){const timer=setTimeout(fn,ms);timer.unref();return timer;}queueMicrotask(fn);return 1;},clearTimeout(timer){clearTimeout(timer);},addEventListener(){},dispatchEvent(){},
    history:{pushState(){},replaceState(){}},__lorefyIngest(){},__lorefyRefresh(){},
    fetch(url){fetches.push(url);if(heldIndex)return heldIndex;return indexFails?Promise.reject(new Error('offline')):Promise.resolve({ok:true,json:async()=>({schema:1,records:rows})});}
  };
  class CustomEvent {constructor(type,options){this.type=type;this.detail=options?.detail;}}
  vm.runInNewContext(source,{window:win,CustomEvent,URLSearchParams,console:{warn(){}}});
  const settle=async()=>{for(let i=0;i<12;i++)await new Promise(r=>setImmediate(r));};
  const input=query=>documentEvents.get('input')({target:{tagName:'INPUT',value:query,closest:()=>true}});
  return {win,loader:win.LorefyCatalogLoader,scripts,fetches,failures,holdParts,pendingScripts,settle,input,
    failIndex(value){indexFails=value;},holdIndex(value){heldIndex=value;}};
}

test('failed index is recoverable for the same query without editing its text',async()=>{
  const h=harness();h.failIndex(true);h.input('Needle');await h.settle();
  assert.equal(h.loader.state().searchError,true);assert.equal(h.loader.state().searching,false);
  h.failIndex(false);h.loader.retrySearch();await h.settle();
  assert.equal(h.fetches.length,2);assert.equal(h.loader.state().searchError,false);
  assert.deepEqual(h.scripts,[2,3,4]);
});

test('reentering an unchanged failed query can retry it',async()=>{
  const h=harness();h.failIndex(true);h.input('Needle');await h.settle();
  h.failIndex(false);h.input('Needle');await h.settle();
  assert.equal(h.fetches.length,2);assert.equal(h.loader.state().searchError,false);
});

test('a failed matched shard remains an error and available for retry',async()=>{
  const h=harness();h.failures.add(2);h.input('Needle');await h.settle();
  assert.equal(h.loader.state().searchError,true);assert.equal(h.loader.state().hasMore,true);
  assert.equal(h.loader.state().searching,false);assert.ok(!h.loader.state().loaded.includes(2));
  h.failures.delete(2);h.loader.retrySearch();await h.settle();
  assert.equal(h.loader.state().searchError,false);assert.ok(h.loader.state().loaded.includes(2));
  assert.equal(h.scripts.filter(p=>p===2).length,2);
  assert.equal(h.scripts.filter(p=>p===3).length,1);assert.equal(h.scripts.filter(p=>p===4).length,1);
});

test('load more can recover the failed batch instead of skipping it',async()=>{
  const h=harness();h.failures.add(2);h.input('Needle');await h.settle();
  h.failures.delete(2);await h.loader.loadMore();await h.settle();
  assert.ok(h.loader.state().loaded.includes(2));assert.equal(h.loader.state().searchError,false);
});

test('retry keeps the selected format and never loads another format',async()=>{
  const h=harness();h.failIndex(true);h.loader.loadFormat('Novel','Needle');await h.settle();
  h.scripts.length=0;h.failIndex(false);h.loader.retrySearch();await h.settle();
  assert.equal(h.loader.state().searchError,false);assert.ok(!h.scripts.includes(2));assert.ok(!h.scripts.includes(3));
});

test('retry with no search does not request an index',async()=>{
  const h=harness();h.loader.retrySearch();await h.settle();assert.equal(h.fetches.length,0);
});

test('retry while an index request is pending does not duplicate it',async()=>{
  const h=harness();let finish;h.holdIndex(new Promise(r=>finish=r));h.input('Needle');await h.settle();
  h.loader.retrySearch();h.loader.retrySearch();await h.settle();assert.equal(h.fetches.length,1);
  finish({ok:true,json:async()=>({schema:1,records:[]})});await h.settle();assert.equal(h.loader.state().searching,false);
});

test('an obsolete index failure cannot replace a newer successful search',async()=>{
  const h=harness();let fail;h.holdIndex(new Promise((r,j)=>fail=j));h.input('Old query');await h.settle();
  h.holdIndex(null);h.input('Needle');await h.settle();fail(new Error('old failure'));await h.settle();
  assert.equal(h.loader.state().searchError,false);assert.equal(h.loader.state().searching,false);
  assert.deepEqual(h.scripts,[2,3,4]);
});

test('successful empty search stays distinct from a transport failure',async()=>{
  const h=harness();h.input('Absent unrelated title');await h.settle();
  assert.equal(h.loader.state().searchError,false);assert.equal(h.loader.state().hasMore,false);
  assert.equal(h.loader.state().searching,false);assert.deepEqual(h.scripts,[]);
});

test('an obsolete failed shard cannot rewind or mark a newer empty search as failed',async()=>{
  const h=harness();h.holdParts.add(2);h.failures.add(2);h.input('Needle');await h.settle();
  h.input('Absent unrelated title');await h.settle();h.pendingScripts.get(2)();await h.settle();
  assert.equal(h.loader.state().searchError,false);assert.equal(h.loader.state().hasMore,false);
  assert.equal(h.loader.state().searching,false);assert.deepEqual(h.scripts,[2]);
});

test('worker failure falls back to the index and remains retryable if both fail',async()=>{
  const h=harness();let posts=0;
  h.win.Worker=class {constructor(){this.events={};}addEventListener(n,fn){this.events[n]=fn;}terminate(){}postMessage(request){posts++;queueMicrotask(()=>this.events.message({data:{type:'error',requestId:request.requestId,message:'worker failed'}}));}};
  h.failIndex(true);h.input('Needle');await h.settle();assert.equal(h.loader.state().searchError,true);
  h.failIndex(false);h.loader.retrySearch();await h.settle();
  assert.equal(posts,2);assert.equal(h.fetches.length,2);assert.equal(h.loader.state().searchError,false);
  assert.deepEqual(h.scripts,[2,3,4]);
});

test('collection pagers do not load until next is requested and keep independent type cursors',async()=>{
 const h=harness(),manga=h.loader.createCollectionPager('Manga'),novel=h.loader.createCollectionPager('Novel');
 await h.settle();assert.deepEqual(h.scripts,[]);
 assert.equal(manga.hasMore(),true);await manga.next(()=>true);assert.deepEqual(h.scripts,[2]);
 await novel.next(()=>true);assert.deepEqual(h.scripts,[2,4]);
 await manga.next(()=>true);assert.deepEqual(h.scripts,[2,4,3]);assert.equal(manga.hasMore(),false);
});
test('closed collection cancels queued loading and later calls can retry',async()=>{
 const h=harness(),pager=h.loader.createCollectionPager('Manga');
 await pager.next(()=>false);assert.deepEqual(h.scripts,[]);assert.equal(pager.hasMore(),true);
 await pager.next(()=>true);assert.deepEqual(h.scripts,[2]);
});
