const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const backend = fs.readFileSync(path.resolve(__dirname, '../backend/lorefy-backend.js'), 'utf8');
const library = 'lorefy.user.library.v2';

function pullHarness() {
  const values = new Map([['lorefy.activeUser.v1', 'reader'], [library, 'old']]);
  let pending = {}, release;
  const response = new Promise(resolve => { release = resolve; });
  const scope = {
    ACTIVE_USER_KEY:'lorefy.activeUser.v1', ONBOARDING_DRAFT_KEY:'draft',
    readLS:key=>values.get(key) ?? null, writeLS:(key,value)=>values.set(key,value),
    localStorage:{removeItem:key=>values.delete(key)},
    canReuseLocalAccountState:(owner,user)=>owner===user,
    gather:()=>Object.fromEntries([...values].filter(([key])=>key===library)),
    readPendingState:()=>({...pending}), readStateBase:()=>({data:{[library]:'old'}}),
    stagePendingState:(key,value)=>{pending[key]=value;},
    clearUserData:()=>{values.delete(library); pending={};},
    clearPendingState:()=>{pending={};}, writeStateBase(){},
    isAccountStateKey:key=>key===library, console
  };
  const start = backend.indexOf('    pull: async function(');
  const end = backend.indexOf('    _profileMediaPath:',start);
  vm.runInNewContext('var B = {'+backend.slice(start,end)+'};',scope);
  Object.assign(scope.B,{mode:'live',_hydrateProfile:async()=>{}, client:{from:()=>({select:()=>({eq:()=>({maybeSingle:()=>response})})})}});
  return {api:scope.B, values, release, edit(value){
    if(value===null) values.delete(library); else values.set(library,value);
    pending[library]=value;
  }};
}

test('rating saved while cloud hydration is waiting survives the remote response', async () => {
  const h = pullHarness();
  const pull = h.api.pull('reader');
  h.edit('[{"mid":"hunter","r":4}]');
  h.release({data:{data:{[library]:'old'},version:1}});
  await pull;
  assert.equal(h.values.get(library),'[{"mid":"hunter","r":4}]');
});

test('deletion made while cloud hydration waits is not resurrected', async () => {
  const h = pullHarness();
  const pull = h.api.pull('reader');
  h.edit(null);
  h.release({data:{data:{[library]:'old'},version:1}});
  await pull;
  assert.equal(h.values.has(library),false);
});

test('cold reopen replays a persisted rating-only journal over an older cloud copy', async () => {
  const h = pullHarness();
  h.edit('[{"mid":"hunter","r":4}]');
  const pull = h.api.pull('reader');
  h.release({data:{data:{[library]:'old'},version:1}});
  await pull;
  assert.equal(h.values.get(library),'[{"mid":"hunter","r":4}]');
});

test('failed cold hydration leaves the local library and journal available', async () => {
  const h = pullHarness();
  h.edit('offline-rating');
  const pull = h.api.pull('reader');
  h.release({error:{message:'offline'}});
  assert.equal(await pull,false);
  assert.equal(h.values.get(library),'offline-rating');
});

test('unmodified acknowledged state adopts the newer cloud library', async () => {
  const h = pullHarness();
  const pull = h.api.pull('reader');
  h.release({data:{data:{[library]:'new-cloud-library'},version:2}});
  assert.equal(await pull,true);
  assert.equal(h.values.get(library),'new-cloud-library');
});

test('cold reopen preserves a local change missed by the sync observer', async () => {
  const h = pullHarness();
  h.values.set(library, 'offline-unobserved-library');
  const pull = h.api.pull('reader');
  h.release({data:{data:{[library]:'old'},version:1}});
  await pull;
  assert.equal(h.values.get(library),'offline-unobserved-library');
});

test('an unobserved local deletion is not resurrected on reopen', async () => {
  const h = pullHarness();
  h.values.delete(library);
  const pull = h.api.pull('reader');
  h.release({data:{data:{[library]:'old'},version:1}});
  await pull;
  assert.equal(h.values.has(library),false);
});

test('a response for a previous account cannot hydrate the next account', async () => {
  const h = pullHarness();
  const pull = h.api.pull('reader');
  h.values.set('lorefy.activeUser.v1','other-reader');
  h.values.set(library,'other-library');
  h.release({data:{data:{[library]:'old'},version:1}});
  await pull;
  assert.equal(h.values.get(library),'other-library');
  assert.equal(h.values.get('lorefy.activeUser.v1'),'other-reader');
});

test('sync observes Storage exotic objects without touching sessionStorage', () => {
  class Storage {
    constructor(){this.values=new Map();}
    getItem(key){return this.values.get(key) ?? null;}
    setItem(key,value){this.values.set(key,String(value));}
    removeItem(key){this.values.delete(key);}
  }
  // Web Storage named setters store method assignments rather than replacing
  // the prototype method. Plain-object mocks cannot reproduce this behavior.
  const local = new Proxy(new Storage(),{set(target,key,value){
    if(key==='setItem'||key==='removeItem'){target.values.set(key,String(value));return true;}
    target[key]=value;return true;
  }});
  const session = new Storage();
  const staged = [];
  const scope = {localStorage:local,global:{Storage},window:{addEventListener(){},removeEventListener(){}},
    document:{addEventListener(){},removeEventListener(){}},clearTimeout(){},
    isAccountStateKey:key=>key===library,stagePendingState:(key,value)=>staged.push([key,value])};
  const start = backend.indexOf('    startSync: function(');
  const end = backend.indexOf('    registerPushDevice:',start);
  vm.runInNewContext('var B = {'+backend.slice(start,end)+'};',scope);
  scope.B._schedulePush=()=>{};
  scope.B.startSync();
  local.setItem(library,'rating-only');
  session.setItem(library,'not-account-data');
  local.removeItem(library);
  assert.deepEqual(staged,[[library,'rating-only'],[library,null]]);
  scope.B.stopSync();
  local.setItem(library,'after-stop');
  assert.equal(staged.length,2);
});
