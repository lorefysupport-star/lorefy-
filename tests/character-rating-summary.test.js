const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-growth-features.js'),'utf8');

function harness(scores) {
  const cache={}, scope={K_SCORES:'ratings',read:()=>scores,profileRatedCharacterCache:cache,
    castKey:c=>c.key,profileWorkFor:id=>({id}),profileWorkTitle:id=>id};
  const start=source.indexOf('  function profileRatedScoreRows(');
  vm.runInNewContext(source.slice(start,source.indexOf('  function profileCharacterEntries(',start)),scope);
  return {scope,cache,data:()=>scope.profileRatedCharacterEntries()};
}
const saved={a:{hero:5,friend:1},b:{other:3}};

test('saved rating totals and average stay stable during partial cast hydration',()=>{
  const app=harness(saved),before=JSON.stringify(saved);
  let data=app.data();
  assert.equal(data.total,3);assert.equal(data.workCount,2);assert.equal(data.average,3);
  assert.equal(data.entries.length,0);assert.equal(data.unresolved,3);
  app.cache.a=[{key:'hero',name:'Hero'}];data=app.data();
  assert.equal(data.total,3);assert.equal(data.average,3);assert.equal(data.entries.length,1);assert.equal(data.unresolved,2);
  app.cache.a.push({key:'friend',name:'Friend'});app.cache.b=[{key:'other',name:'Other'}];data=app.data();
  assert.equal(data.total,3);assert.equal(data.workCount,2);assert.equal(data.average,3);assert.equal(data.unresolved,0);
  assert.equal(JSON.stringify(saved),before);
});

test('an unresolved key in a loaded cast still contributes its saved rating',()=>{
  const app=harness(saved);app.cache.a=[];app.cache.b=[{key:'other',name:'Other'}];
  const data=app.data();assert.equal(data.total,3);assert.equal(data.unresolved,2);assert.equal(data.average,3);
});

test('the profile counter counts saved ratings before and after their details load',()=>{
  const app=harness(saved),count={textContent:''};
  const start=source.indexOf('  function paintProfileRatedCharacters(');
  Object.assign(app.scope,{uiText:(ar,en)=>en});
  vm.runInNewContext(source.slice(start,source.indexOf('  function profileTopCharacterSlotImage(',start)),app.scope);
  const section={querySelector:selector=>selector==='[data-lf-rated-characters-count]'?count:null};
  app.scope.paintProfileRatedCharacters(section);assert.equal(count.textContent,'3 characters');
  app.cache.a=[{key:'hero',name:'Hero'}];app.scope.paintProfileRatedCharacters(section);
  assert.equal(count.textContent,'3 characters');
});

test('an empty saved rating set has zero totals, not a missing-data loading total',()=>{
  const data=harness({}).data();assert.equal(data.total,0);assert.equal(data.workCount,0);assert.equal(data.average,0);assert.equal(data.unresolved,0);
});
