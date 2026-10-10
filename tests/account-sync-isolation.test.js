const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../backend/lorefy-backend.js'), 'utf8');
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return {promise, resolve};
}
function profileHarness(wait) {
  const values = {'owner':'one', 'lorefy.identity.v1':'{"name":"Local"}'};
  const scope = {ACTIVE_USER_KEY:'owner', readPendingState:()=>({}), readLS:k=>values[k], writeLS:(k,v)=>{values[k]=v;}};
  const start = source.indexOf('    _hydrateProfile:');
  const end = source.indexOf('    push:', start);
  vm.runInNewContext('var B = {' + source.slice(start,end) + '};', scope);
  Object.assign(scope.B, {_pullGeneration:1, _profileMediaUrl:async()=>'', client:{from:()=>({select:()=>({eq:()=>({maybeSingle:()=>wait.promise})})})}});
  return {api:scope.B, values, scope};
}
test('profile hydration does not replace a pending offline identity edit', async()=>{
  const wait=deferred();
  const {api,values,scope}=profileHarness(wait);
  scope.readPendingState=()=>({'lorefy.identity.v1':values['lorefy.identity.v1']});
  wait.resolve({data:{name:'Old cloud profile'},error:null});
  assert.equal(await api._hydrateProfile('one'),false);
  assert.equal(JSON.parse(values['lorefy.identity.v1']).name,'Local');
});
test('profile response from the previous account cannot overwrite current identity', async()=>{
  const wait = deferred();
  const {api,values} = profileHarness(wait);
  const request = api._hydrateProfile('one');
  values.owner = 'two'; api._pullGeneration++;
  values['lorefy.identity.v1'] = '{"name":"Second"}';
  wait.resolve({data:{name:'First'},error:null});
  assert.equal(await request,false);
  assert.equal(JSON.parse(values['lorefy.identity.v1']).name,'Second');
});
test('profile hydration preserves an edit made while the request is pending', async()=>{
  const wait = deferred();
  const {api,values} = profileHarness(wait);
  const request = api._hydrateProfile('one');
  values['lorefy.identity.v1'] = '{"name":"New edit","avatar":"new-photo"}';
  wait.resolve({data:{name:'Old name',avatar:'old-photo'},error:null});
  assert.equal(await request,false);
  assert.equal(JSON.parse(values['lorefy.identity.v1']).avatar,'new-photo');
});
test('profile media signing also checks the active account after awaiting', async()=>{
  const wait = deferred();
  const media = deferred();
  const {api,values} = profileHarness(wait);
  api._profileMediaUrl = ()=>media.promise;
  const request = api._hydrateProfile('one');
  wait.resolve({data:{name:'First',avatar:'image'},error:null});
  await Promise.resolve();
  values.owner='two'; api._pullGeneration++;
  media.resolve('signed-url');
  assert.equal(await request,false);
  assert.equal(JSON.parse(values['lorefy.identity.v1']).name,'Local');
});
test('a stale push does not clear the next account journal or send its next batch', async()=>{
  const wait = deferred();
  const entered = deferred();
  let owner='one', calls=0, clears=0, writes=0;
  const payload=Object.fromEntries(Array.from({length:32},(_,i)=>['key'+i,'value'+i]));
  const scope={ACTIVE_USER_KEY:'owner',readLS:()=>owner,gather:()=>payload,readPendingState:()=>payload,
    accountStateKeys:()=>Object.keys(payload),clearPendingState:()=>{clears++;},writeStateBase:()=>{writes++;},console};
  const start=source.indexOf('    push:');
  vm.runInNewContext('var B = {'+source.slice(start,source.indexOf('    saveProfile:',start))+'};',scope);
  const api=scope.B;
  Object.assign(api,{mode:'live',_pullGeneration:1,_stateBase:{},_stateVersion:0,getSession:async()=>({userId:'one'}),
    client:{rpc:()=>{calls++;entered.resolve();return wait.promise;}}});
  const request=api.push();
  await entered.promise;
  owner='two'; api._pullGeneration++;
  api._stateBase={second:'safe'};
  wait.resolve({data:[{state_version:1,state_data:payload}],error:null});
  assert.equal(await request,false);
  assert.equal(calls,1);
  assert.equal(clears,0);
  assert.equal(writes,0);
  assert.deepEqual(api._stateBase,{second:'safe'});
});
