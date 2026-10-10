const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../modules/lorefy-catalog-policy.js');
const {mapMangaDex,mapAniList} = require('../tools/build-api-catalog-expansion.js');
const fs = require('node:fs');
const path = require('node:path');

test('explicit records are never recommendation eligible even with high ratings',()=>{
  for(const work of [{title:'Example',isAdult:true,r:5},{title:'Example',contentRating:'pornographic',r:5},{title:'Example',genres:['Hentai'],r:5}]) {
    assert.equal(policy.isRecommendationEligible(work),false);
  }
});
test('unknown content classification fails closed for automatic recommendations',()=>{
  assert.equal(policy.isRecommendationEligible({title:'Unknown work',r:5,baseRatings:100000}),false);
  assert.equal(policy.isRecommendationEligible({title:'Example',contentRating:'safe',r:4}),true);
  assert.equal(policy.isRecommendationEligible({title:'Example',isAdult:false,r:4}),true);
});
test('religious scholarship is not inherently explicit',()=>{
  assert.equal(policy.isExplicitWork({title:'Hindu philosophy',contentRating:'safe'}),false);
});
test('unrated records stay searchable but cannot be an automatic surprise',()=>{
  const work={id:'source-example',title:'Unrated',contentRating:'safe',r:0};
  assert.equal(policy.isRecommendationEligible(work),false);
  work.r=4;
  assert.equal(policy.isRecommendationEligible(work),true);
  work.r=0;
  assert.equal(policy.isRecommendationEligible(work),false);
});

test('discovery can recommend unrated classified works without weakening random-pick safety',()=>{
  const work={id:'safe',title:'Known work',contentRating:'safe',r:0};
  assert.equal(policy.isDiscoveryEligible(work),true);
  assert.equal(policy.isRecommendationEligible(work),false);
  work.genres=['Hentai'];assert.equal(policy.isDiscoveryEligible(work),false);
  assert.equal(policy.isDiscoveryEligible({title:'Unknown',r:5}),false);
  assert.equal(policy.isDiscoveryEligible({...work,genres:[],aiGenerated:true}),false);
});
test('importers retain the source content classification',()=>{
  const manga=mapMangaDex({id:'source',attributes:{title:{en:'Example'},contentRating:'safe'}},'Manga');
  assert.equal(manga.contentRating,'safe');
  const anilist=mapAniList({id:1,title:{english:'Example'},isAdult:false},'Manga');
  assert.equal(anilist.isAdult,false);
});

test('recommendation, editorial and catalog rows apply eligibility before selecting',()=>{
  const app=fs.readFileSync(path.resolve(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
  assert.match(app,/filter\(b=>recommendationEligible\(b\)&&!l\[b.id\]/);
  assert.match(app,/i\.filter\(p=>p.rec&&recommendationEligible\(p\)\)/);
  assert.match(app,/pickFeaturedWork\(g,o.filter\(recommendationEligible\)/);
});
