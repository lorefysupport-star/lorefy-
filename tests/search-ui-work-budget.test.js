const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const directory = require('../modules/lorefy-user-discovery.js');

function renderHarness(overrides={}) {
  const slots = [], memos = [], refs = [], effects = [], pendingEffects = new Map(), timers = new Map(), listeners = new Map();
  let stateIndex, memoIndex, refIndex, effectIndex, timerId = 0, tree, rankingCalls = 0, matchCalls = 0;
  const work = {id:'manga-one',title:'Naruto',type:'Manga',pop:10,genres:[]};
  const React = {
    Fragment:'fragment',createElement:(type, props, ...children) => ({type,props:props||{},children:children.flat(Infinity)}),
    useState(initial) { const index=stateIndex++;if(!(index in slots))slots[index]=initial;return [slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}]; },
    useRef(initial) { const index=refIndex++;return refs[index]||(refs[index]={current:initial}); },
    useMemo(fn,deps) {const index=memoIndex++,old=memos[index];if(!old||deps.some((dep,i)=>dep!==old.deps[i]))memos[index]={deps,value:fn()};return memos[index].value;},
    useEffect(fn,deps){const index=effectIndex++,old=effects[index];if(!old||!deps||deps.some((dep,i)=>dep!==old.deps[i])){effects[index]={deps,cleanup:old&&old.cleanup};pendingEffects.set(index,fn);}},useLayoutEffect(){}
  };
  const root = {React,clearTimeout:id=>timers.delete(id),setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},
    LorefyCatalogData:{matchesCatalogQuery(work,query){matchCalls++;return work.title.toLowerCase().includes(query.toLowerCase());}},
    addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener(){},document:{activeElement:null},
    sessionStorage:{getItem(){return null;}},localStorage:{getItem(){return null;}}};
  const context={window:root,globalThis:root,module:{exports:{}},console,Set,Map};
  vm.runInNewContext(fs.readFileSync('modules/lorefy-explore-studio.js','utf8'),context);
  const props={userKey:'budget-owner',language:'en',allType:'All',types:['All','Manga'],genres:[],preferences:{genres:[]},library:{},favorites:[],categories:[],
    getRanked(){rankingCalls++;return [work];},getCatalog:()=>[work],getWork:()=>work,typeLabel:value=>value,cover:()=>'',fallback:()=>'',onWork(){},...overrides};
  function render(){stateIndex=memoIndex=refIndex=effectIndex=0;tree=root.LorefyExploreStudio.Explore(props);return tree;}
  function nodes(node,out=[]){if(node&&typeof node==='object'){out.push(node);(node.children||[]).forEach(child=>nodes(child,out));}return out;}
  function find(fn){return nodes(tree).find(fn);}
  function flush(){const pending=[...timers.values()];timers.clear();pending.forEach(timer=>timer.fn());}
  function flushEffects(){const pending=[...pendingEffects];pendingEffects.clear();pending.forEach(([index,fn])=>{if(effects[index].cleanup)effects[index].cleanup();effects[index].cleanup=fn();});}
  function emit(name,detail){assert.ok(listeners.has(name),'listener registered: '+name);listeners.get(name)({detail});}
  return {render,find,flush,flushEffects,emit,slots,counts:()=>({rankingCalls,matchCalls}),root};
}

test('active media and people searches do not recalculate hidden personalized recommendations',()=>{
  const app=renderHarness();app.render();
  const input=app.find(node=>node.type==='input');input.props.onFocus();input.props.onChange({target:{value:'Naruto'}});app.flush();app.render();
  const before=app.counts().rankingCalls;
  // Catalog progress updates may change thousands of records while results arrive.
  app.slots[9]++;app.render();
  assert.equal(app.counts().rankingCalls,before);
  app.find(node=>node.props.role==='tab'&&node.children.includes('People')).props.onClick();app.render();
  app.slots[9]++;app.render();assert.equal(app.counts().rankingCalls,before);
});

test('format typing keeps a stable native input and postpones catalog scans until the query settles',()=>{
  const app=renderHarness();app.render();
  app.find(node=>node.props.role==='tab'&&node.children.includes('Types')).props.onClick();app.render();
  app.find(node=>String(node.props.className||'').split(' ').includes('lf-explore-category')).props.onClick();app.render();
  const input=app.find(node=>node.type==='input'),before=app.counts().matchCalls;
  input.props.onChange({target:{value:'N'}});app.render();
  input.props.onChange({target:{value:'Na'}});app.render();
  input.props.onChange({target:{value:'Naruto'}});app.render();
  assert.equal(app.counts().matchCalls,before);
  app.flush();app.render();assert.ok(app.counts().matchCalls>before);
});

test('reader search starts without waiting for unrelated following hydration',async()=>{
  let calls=0;
  const api=directory.createUserDirectory({readers:[],adapter:{getFollowedProfileIds:()=>new Promise(()=>{}),searchPublicProfiles:async()=>{calls++;return [{id:'one',username:'reader'}];}}});
  const pending=api.search('reader',{strict:true});
  await Promise.resolve();await Promise.resolve();
  assert.equal(calls,1);
  assert.equal((await pending)[0].id,'one');
});

test('concurrent identical reader searches share transport and preserve strict caller errors',async()=>{
  let calls=0,resolve;
  const api=directory.createUserDirectory({adapter:{searchPublicProfiles:()=>{calls++;return new Promise(done=>{resolve=done;});}}});
  const first=api.search('@Reader',{strict:true}),second=api.search('reader',{strict:true});
  await Promise.resolve();await Promise.resolve();
  assert.equal(calls,1);resolve([{id:'one',username:'reader'}]);
  assert.deepEqual(await first,await second);
});

test('reader ranking collapses duplicate source IDs before the result limit',async()=>{
  const api=directory.createUserDirectory({readers:[{id:'same',username:'reader',name:'Reader'},{id:'same',username:'reader',name:'Reader'},{id:'another',username:'reader_two'}]});
  assert.deepEqual((await api.search('reader')).map(row=>row.id),['same','another']);
});

test('people-only results avoid fetching follow metadata they never display',async()=>{
  let followingCalls=0;
  const api=directory.createUserDirectory({adapter:{getFollowedProfileIds:async()=>{followingCalls++;return [];},searchPublicProfiles:async()=>[{id:'one',username:'reader'}]}});
  assert.equal((await api.search('reader',{strict:true,includeFollowing:false})).length,1);
  assert.equal(followingCalls,0);
});

test('a timed-out reader lookup releases its shared query and allows a successful retry',async()=>{
  let calls=0;
  const api=directory.createUserDirectory({searchTimeoutMs:20,adapter:{searchPublicProfiles:()=>++calls===1?new Promise(()=>{}):Promise.resolve([{id:'one',username:'reader'}])}});
  await assert.rejects(api.search('reader',{strict:true}),/timed out/);
  assert.equal((await api.search('reader',{strict:true}))[0].id,'one');
  assert.equal(calls,2);
});

test('shared reader failure honors each caller strictness and retries rather than caching failure',async()=>{
  let calls=0,reject;
  const api=directory.createUserDirectory({readers:[{id:'local',username:'reader'}],adapter:{searchPublicProfiles:()=>{calls++;return calls===1?new Promise((_,fail)=>{reject=fail;}):Promise.resolve([]);}}});
  const strict=assert.rejects(api.search('reader',{strict:true}),/offline/),fallback=api.search('reader');
  await Promise.resolve();reject(Error('offline'));await strict;
  assert.equal((await fallback)[0].id,'local');assert.equal(calls,1);
  assert.deepEqual(await api.search('reader',{strict:true}),[]);assert.equal(calls,2);
});

test('late follow hydration cannot overwrite a follow choice made while searching',async()=>{
  let hydrate;
  const api=directory.createUserDirectory({adapter:{getFollowedProfileIds:()=>new Promise(done=>{hydrate=done;}),searchPublicProfiles:async()=>[]}});
  await api.search('reader');api.applyFollowing('reader-one',true);hydrate([]);
  await Promise.resolve();await Promise.resolve();assert.equal(api.isFollowing('reader-one'),true);
});

test('relevance reuses mutation-safe multilingual indexes and still observes edited aliases',()=>{
  const root={},context=vm.createContext({window:root,self:root,globalThis:root,module:{exports:{}},console});
  vm.runInContext(fs.readFileSync('modules/lorefy-catalog-data.js','utf8'),context);
  vm.runInContext(fs.readFileSync('modules/lorefy-explore-studio.js','utf8'),context);
  vm.runInContext('var normalizations=0, originalNormalize=String.prototype.normalize;String.prototype.normalize=function(){normalizations++;return originalNormalize.apply(this,arguments);};',context);
  const rows=[{id:'alias',title:'Another work',auth:'Author',aliases:['أَحْلَام'],pop:1},{id:'prefix',title:'احلام أخرى',pop:100}];
  assert.deepEqual(Array.from(root.LorefyExploreStudio.rankSearchResults(rows,'أحلام'),row=>row.id),['alias','prefix']);
  const before=vm.runInContext('normalizations',context);
  root.LorefyExploreStudio.rankSearchResults(rows,'أحلام');
  assert.equal(vm.runInContext('normalizations',context)-before,1,'only the new query needs Unicode normalization');
  rows[0].aliases[0]='Different alias';
  assert.deepEqual(Array.from(root.LorefyExploreStudio.rankSearchResults(rows,'أحلام'),row=>row.id),['prefix','alias']);
});

test('relevance computes numeric popularity and stable ID keys once per candidate',()=>{
  const core=require('../modules/lorefy-explore-studio.js');let conversions=0,ids=0;
  const rows=Array.from({length:100},(_,index)=>({id:{toString(){ids++;return String(index);}},title:'Story '+index,pop:{valueOf(){conversions++;return index%13;}}}));
  assert.equal(core.rankSearchResults(rows,'Story').length,100);
  assert.equal(conversions,200,'count validates and converts one popularity per candidate');
  assert.equal(ids,100);
});

test('partial remote failures retain visible results and retry rejects an obsolete input before ingest',async()=>{
  const app=renderHarness();app.render();
  const input=app.find(node=>node.type==='input');input.props.onFocus();input.props.onChange({target:{value:'Naruto'}});app.flush();app.render();
  app.slots[21]={query:'Naruto',type:'All',status:'partial'};app.render();
  const retry=app.find(node=>node.props.className==='lf-explore-search-retry');assert.ok(retry);
  let options;app.root.LorefyApiCatalog={search:async(query,type,value)=>{options=value;return {providers:['one'],providerErrors:[]};}};
  retry.props.onClick();await Promise.resolve();
  assert.equal(options.isCurrent(),true);
  input.props.onChange({target:{value:'Berserk'}});assert.equal(options.isCurrent(),false);
});

for(const status of ['partial','error','searching'])test('English remote '+status+' matches the Arabic All contract used by the app',async()=>{
  const app=renderHarness({allType:'الكل',types:['الكل','Manga']});app.render();app.flushEffects();
  const input=app.find(node=>node.type==='input');input.props.onFocus();input.props.onChange({target:{value:'Naruto'}});app.flush();app.render();app.flushEffects();app.flush();
  for(let index=0;index<6;index++)await Promise.resolve();app.render();
  app.emit('lorefy:catalog-remote-search',{query:'Naruto',type:'All',status});app.render();
  const message=app.find(node=>node.props.className==='lf-design-search-status');
  assert.equal(message.children[0],status==='searching'?'Updating results…':'Some sources are unavailable; showing available results');
  assert.equal(!!app.find(node=>node.props.className==='lf-explore-search-retry'),status!=='searching');
  assert.ok(app.find(node=>node.props.className==='lf-design-search-grid').children.length,'verified results remain visible');
});

test('an All-provider error without local hits stays retryable rather than appearing empty',async()=>{
  const app=renderHarness({allType:'الكل',types:['الكل','Manga'],getCatalog:()=>[]});app.render();app.flushEffects();
  const input=app.find(node=>node.type==='input');input.props.onFocus();input.props.onChange({target:{value:'Missing'}});app.flush();app.render();app.flushEffects();app.flush();
  for(let index=0;index<6;index++)await Promise.resolve();app.render();
  app.emit('lorefy:catalog-remote-search',{query:'Missing',type:'All',status:'error'});app.render();
  assert.ok(app.find(node=>node.type==='h2'&&node.children.includes('Could not connect')));
  assert.ok(app.find(node=>node.props.className==='lf-explore-search-retry'));
  assert.equal(app.find(node=>node.type==='h2'&&node.children.includes('No matching results')),undefined);
});

test('All canonicalization preserves every concrete bilingual format boundary',()=>{
  const core=require('../modules/lorefy-explore-studio.js');
  assert.equal(core.formatKey(' All '),core.formatKey('الكل'));
  for(const [english,arabic]of [['Manga','مانجا'],['Manhwa','مانهوا'],['Manhua','مانهوا صيني'],['Comics','كوميكس'],['Novel','رواية'],['Book','كتاب'],['Light Novel','لايت نوفل'],['Web Novel','ويب نوفل']]){
    assert.equal(core.formatKey(english),core.formatKey(arabic));assert.notEqual(core.formatKey(english),core.formatKey('All'));
  }
});
