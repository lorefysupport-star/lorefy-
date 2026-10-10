'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const data = require('../modules/lorefy-catalog-data');
const policy = require('../modules/lorefy-catalog-policy');
const root = path.resolve(__dirname, '..');

function featuresRuntime() {
  const source = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  const start = source.indexOf('const SEARCH_CACHE=');
  const end = source.indexOf('function App(', start);
  const context = {window:{}, arGenreOf:x=>x};
  vm.createContext(context);
  vm.runInContext(source.slice(start,end) + ';window.features={workGenreKeys,normTasteKey};', context);
  return context.window.features;
}
function compactRecord(record, features) {
  const fields = ['id','title','ar','auth','type','yr','ch','vol','pages','r','rSrc','pop',
    'weeklyReads','listAdds','baseRatings','baseReviews','sourceCoverUrl','coverImage',
    'cover','sourceCover','genres','tags','altTitles','authorAliases','st','rec',
    'contentRating','isAdult','adult','aiGenerated','isAiGenerated','language','originalLanguage','malId','anilistId','_apiDynamic','_apiSource','pl','related','sc',
    '_catalogMergedIds','_catalogEditions','alternateCovers'];
  const card = {_catalogCompact:true};
  for (const key of fields) if(record[key]!==undefined) card[key]=record[key];
  card._tasteGenreKeys = features.workGenreKeys(record).filter(key=>key.length<=40).slice(0,32);
  card._tasteType = features.normTasteKey(record.type);
  card._tasteAuthor = features.normTasteKey(record.auth);
  card._recommendationEligible = policy.isRecommendationEligible(record);
  card._discoveryEligible = policy.isDiscoveryEligible(record);
  for (const key of ['synopsis','synopsisAr','synopsisEn','description','sourceSynopsis','originalSynopsis']) {
    if (typeof record[key] === 'string' && record[key]) card[key] = record[key].slice(0,400);
  }
  if(record.provenance) card.provenance={url:record.provenance.url,acceptableUse:record.provenance.acceptableUse,license:record.provenance.license,webNovelUrl:record.provenance.webNovelUrl,publisherUrl:record.provenance.publisherUrl};
  if (card.ar === card.title) card.ar = '';
  return card;
}
function main() {
  const features = featuresRuntime();
  const dir = path.join(root, 'uploads/catalog-runtime');
  fs.mkdirSync(dir,{recursive:true});
  let sourceBytes=0, runtimeBytes=0, count=0;
  const contentHash = crypto.createHash('sha256');
  for (const name of fs.readdirSync(path.join(root,'uploads')).filter(x=>/^lorefy-data-part\d+\.js$/.test(x))) {
    const source = fs.readFileSync(path.join(root,'uploads',name),'utf8');
    const rows = data.extractCatalogRecords(source);
    policy.filterInPlace(rows);
    const payload = JSON.stringify(rows.map(row=>compactRecord(row,features)));
    contentHash.update(name).update(payload);
    const outputName = name.replace('.js','.json');
    fs.writeFileSync(path.join(dir,outputName),payload);
    sourceBytes+=Buffer.byteLength(source); runtimeBytes+=Buffer.byteLength(payload); count+=rows.length;
  }
  const report={sourceBytes,runtimeBytes,count,contentHash:contentHash.digest('hex')};
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(report));
  console.log(report);
}
if(require.main===module)main();
module.exports={compactRecord,featuresRuntime};
