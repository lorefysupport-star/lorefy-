const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

test('recommendation and discovery share one content-classification pass per unchanged work', () => {
  const context = vm.createContext({});
  vm.runInContext('globalThis.calls=[];const original=String.prototype.normalize;String.prototype.normalize=function(){calls.push(String(this));return original.apply(this,arguments);}', context);
  vm.runInContext(fs.readFileSync(path.join(root, 'modules/lorefy-catalog-policy.js'), 'utf8'), context);
  const work = { id:'fixture', title:'A journey', ar:'رحلة', genres:['Adventure'], tags:['Mystery'], isAdult:false, r:4 };
  assert.equal(context.LorefyCatalogPolicy.isRecommendationEligible(work), true);
  assert.equal(context.LorefyCatalogPolicy.isDiscoveryEligible(work), true);
  assert.equal(context.calls.filter(value => value === work.title).length, 1);
  assert.equal(context.calls.filter(value => value === work.ar).length, 1);
  const calls = context.calls.length;
  context.LorefyCatalogPolicy.isDiscoveryEligible(work);
  context.LorefyCatalogPolicy.isRecommendationEligible(work);
  assert.equal(context.calls.length, calls);
});

test('shared classification preserves unrated discovery and recommendation rating/source gates', () => {
  const policy = require('../modules/lorefy-catalog-policy.js');
  for (const r of [0, -1, 6, NaN, undefined]) {
    const work = { id:'safe', title:'A journey', isAdult:false, r };
    assert.equal(policy.isDiscoveryEligible(work), true);
    assert.equal(policy.isRecommendationEligible(work), false);
  }
  const work = { id:'fwn-novel-test', title:'A journey', isAdult:false, r:4 };
  assert.equal(policy.isDiscoveryEligible(work), true);
  assert.equal(policy.isRecommendationEligible(work), false);
  work.rSrc = 'Verified source';
  assert.equal(policy.isRecommendationEligible(work), true);
});

test('cached shared classification invalidates for nested labels, rating and classification changes', () => {
  const policy = require('../modules/lorefy-catalog-policy.js');
  const work = { id:'safe', title:'A journey', isAdult:false, r:4, tags:[{name:'Mystery'}] };
  assert.equal(policy.isRecommendationEligible(work), true);
  work.tags[0].name = 'AI generated';
  assert.equal(policy.isDiscoveryEligible(work), false);
  assert.equal(policy.isRecommendationEligible(work), false);
  work.tags[0].name = 'Mystery'; work.r = 0;
  assert.equal(policy.isDiscoveryEligible(work), true);
  assert.equal(policy.isRecommendationEligible(work), false);
  work.adult = true;
  assert.equal(policy.isDiscoveryEligible(work), false);
  work.adult = false; work.r = 4;
  assert.equal(policy.isRecommendationEligible(work), true);
});

test('retailer bookmarks are not bibliographic works, while books about bookmarks and craft remain valid',()=>{
  const policy=require('../modules/lorefy-catalog-policy');
  assert.equal(policy.isExcludedWork({id:'jarir-424717',title:'فاصل كتاب مطرز',genres:['فواصل الكتب']}),true);
  assert.equal(policy.isDiscoveryEligible({id:'jarir-424717',title:'فاصل كتاب',genres:['فواصل الكتب'],contentRating:'safe'}),false);
  assert.equal(policy.isExcludedWork({id:'ol-craft',title:'صناعة فواصل الكتب',genres:['الأشغال اليدوية']}),false);
  assert.equal(policy.isExcludedWork({id:'jarir-story',title:'قصص للأطفال',genres:['افلام الاطفال','كتب تكوين الشخصية للاطفال']}),false);
  const works=[{id:'jarir-424717',genres:['فواصل الكتب']},{id:'real-book',title:'كتاب'}];
  policy.filterInPlace(works);assert.deepEqual(works.map(w=>w.id),['real-book']);
});

test('discovery excludes scripture editions and tarot, but keeps religious scholarship', () => {
  const policy = require('../modules/lorefy-catalog-policy.js');
  for (const title of ['القرآن الكريم', 'The Holy Qur\'an', 'Holy Bible', 'Tarot for Beginners', 'تاروت']) {
    assert.equal(policy.isExcludedWork({ title }), true, title);
  }
  for (const title of ['تفسير القرآن العظيم', 'صحيح البخاري', 'كتاب الرحلة', 'The Bible of Physics']) {
    assert.equal(policy.isExcludedWork({ title }), false, title);
  }
});

test('catalog quality removes excluded discovery records before app ingest', () => {
  const policy = require('../modules/lorefy-catalog-policy.js');
  const sandbox = { window: { LorefyMangaData: [
    { id: 'scripture', title: 'القرآن الكريم' },
    { id: 'commentary', title: 'تفسير القرآن العظيم' },
    { id: 'tarot', title: 'Tarot for Beginners' }
  ], LorefyCatalogPolicy: policy } };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'uploads/lorefy-catalog-quality.js'), 'utf8'), sandbox);
  assert.deepEqual(sandbox.window.LorefyMangaData.map(work => work.id), ['commentary']);
});

test('local Arabic collection includes Ibn Battuta and primary philosophy texts', () => {
  const sandbox = { window: { LorefyMangaData: [] } };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'uploads/lorefy-arabic-library.js'), 'utf8'), sandbox);
  const titles = sandbox.window.LorefyMangaData.map(work => work.title);
  assert.ok(titles.includes('تحفة النظار في غرائب الأمصار وعجائب الأسفار'));
  assert.ok(titles.includes('تهافت الفلاسفة'));
  assert.ok(!titles.includes('القرآن الكريم'));
});

test('new novel and book shards grow, and new comics have source covers', () => {
  const policy = require('../modules/lorefy-catalog-policy.js');
  for (const [type, minimum] of [['novel', 900], ['book', 800], ['comics', 500]]) {
    const works = JSON.parse(fs.readFileSync(path.join(root, 'output/api-catalog', `${type}.json`), 'utf8')).works;
    assert.ok(works.length >= minimum, `${type}: ${works.length}/${minimum}`);
    assert.ok(works.every(work => !policy.isExcludedWork(work)), `${type} contains excluded works`);
    if (type === 'comics') assert.ok(works.every(work => work.sourceCoverUrl), 'comics shard has coverless works');
  }
});

test('expanded books include substantial philosophy coverage', () => {
  const works = JSON.parse(fs.readFileSync(path.join(root, 'output/api-catalog/book.json'), 'utf8')).works;
  const philosophy = works.filter(work => work.genres.some(genre => /philosoph/i.test(genre)));
  assert.ok(philosophy.length >= 50, `only ${philosophy.length} philosophy books`);
});

test('expanded books include works authored by major philosophers', () => {
  const works = JSON.parse(fs.readFileSync(path.join(root, 'output/api-catalog/book.json'), 'utf8')).works;
  for (const author of ['Plato', 'Aristotle', 'Kant', 'Descartes', 'Spinoza']) {
    assert.ok(works.some(work => new RegExp(author, 'i').test(String(work.auth).normalize('NFKD').replace(/[\u0300-\u036f]/g, ''))),
      `missing philosopher: ${author}`);
  }
});

test('search loads the full expanded novel and book shards by default', () => {
  const config = fs.readFileSync(path.join(root, 'config/lorefy-config.js'), 'utf8');
  const catalog = fs.readFileSync(path.join(root, 'modules/lorefy-api-catalog.js'), 'utf8');
  assert.match(config, /expandedTargets:\s*\{[^}]*900[^}]*800/s);
  assert.match(catalog, /cfg\.expandedTargets/);
});
