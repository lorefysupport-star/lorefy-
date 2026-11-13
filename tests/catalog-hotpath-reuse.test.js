const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function policyContext() {
  const maps = [];
  class CountedMap extends Map { constructor(...args) { super(...args); maps.push(this); } }
  const scope = vm.createContext({ Map:CountedMap });
  vm.runInContext('var normalizations=0; var originalNormalize=String.prototype.normalize; String.prototype.normalize=function(...args){normalizations++;return originalNormalize.apply(this,args);};', scope);
  vm.runInContext(fs.readFileSync('modules/lorefy-catalog-policy.js','utf8'), scope);
  return { api:scope.LorefyCatalogPolicy, scope, maps };
}

test('content checks reuse normalized strings across distinct catalog records', () => {
  const {api, scope} = policyContext();
  const work = {title:'A reader\u2019s story', ar:'قصة قارئ', genres:['Fantasy'], tags:['Adventure'], isAdult:false, r:4};
  assert.equal(api.isRecommendationEligible({...work}), true);
  const warm = scope.normalizations;
  for(let i=0;i<250;i++) {
    assert.equal(api.isRecommendationEligible({...work}), true);
    assert.equal(api.isExcludedWork({...work}), false);
    assert.equal(api.isExplicitWork({...work}), false);
  }
  assert.equal(scope.normalizations, warm);
});

test('normalization reuse is bounded and does not retain oversized input', () => {
  const {api, scope, maps} = policyContext();
  api.isExcludedTitle('First title');
  for(let i=0;i<1200;i++) api.isExcludedTitle('Title '+i);
  assert.ok(maps.length > 0, 'normalization has an inspectable bounded Map');
  assert.ok(maps.every(m=>m.size<=1024));
  const before = scope.normalizations;
  assert.equal(api.isExcludedTitle('First title'), false);
  assert.equal(scope.normalizations, before+1, 'evicted values recompute');
  const sizes = maps.map(m=>m.size);
  api.isExcludedTitle('A'.repeat(3000));
  assert.deepEqual(maps.map(m=>m.size), sizes);
});

test('cache never freezes content safety or in-place title and tag changes', () => {
  const {api} = policyContext();
  const work={title:'A story',genres:['Fantasy'],tags:[],r:4,isAdult:false};
  assert.equal(api.isRecommendationEligible(work),true);
  work.tags.push('Erótica');
  assert.equal(api.isRecommendationEligible(work),false);
  work.tags[0]='Adventure';
  assert.equal(api.isRecommendationEligible(work),true);
  work.title='The Holy Qur\u2019an';
  assert.equal(api.isRecommendationEligible(work),false);
  work.title='Another story';work.isAdult=true;
  assert.equal(api.isRecommendationEligible(work),false);
});

function taxonomy() {
  const scope={window:{LorefyMangaData:[]}};
  vm.runInNewContext(fs.readFileSync('modules/lorefy-comics-taxonomy.js','utf8'),scope);
  return scope.window.LorefyComicsTaxonomy;
}
for(const [name,extra] of [
  ['provider comic',{}],
  ['modern library comic',{pl:'Open Library',yr:2020}],
  ['explicit older graphic edition',{pl:'Open Library',yr:1900,subjects:['Comic books']}]
]) test('classification prepares the '+name+' description once per call', () => {
  const api=taxonomy();let reads=0;
  const work={title:'Batman: Year One',type:'كوميكس',...extra,get synopsis(){reads++;return 'A graphic story';}};
  assert.equal(api.classify(work).publisher,'DC');
  assert.equal(reads,1);
  Object.defineProperty(work,'synopsis',{get(){reads++;return 'Spider-Man graphic story';}});
  work.title='Spider-Man';
  assert.equal(api.classify(work).publisher,'Marvel');
  assert.equal(reads,2, 'new calls must see in-place edits');
});
