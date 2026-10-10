'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {loadBundledCatalog}=require('./build-api-catalog-expansion');
const identity=require('../modules/lorefy-catalog-identity');
const policy=require('../modules/lorefy-catalog-policy');
const plan=require('../modules/lorefy-catalog-plan');
const search=require('../modules/lorefy-catalog-data');
const {auditMetadata}=require('./catalog-metadata-audit');
const root=path.resolve(__dirname,'..');
const types=['Manga','Manhwa','Manhua','Comics','Novel','Book','Light Novel','Web Novel'];
const works=loadBundledCatalog();
const bundledRaw=works.length;
const scope={window:{LorefyMangaData:works,LorefyCatalogPolicy:policy}};
for(const filename of ['uploads/lorefy-arabic-library.js','uploads/lorefy-booktok-library.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root,filename),'utf8'),scope,{filename});
}
const raw=works.length;
for(const filename of ['modules/lorefy-comics-taxonomy.js','modules/lorefy-bibliographic-overrides.js','uploads/lorefy-catalog-quality.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root,filename),'utf8'),scope,{filename});
}
policy.filterInPlace(works);
const filtered=works.length;
identity.organizeCatalog(works,{aliases:{}});
const counts=Object.fromEntries(types.map(type=>[type,0]));
for(const work of works) counts[plan.normalizeRouteType(work.type)]++;
const coverage=Object.fromEntries(types.map(type=>[type,{count:counts[type],target:7000,shortfall:Math.max(0,7000-counts[type]),met:counts[type]>=7000}]));
const writerRecords=works.filter(work=>/محفوظ|mahf|martin/i.test(String(work.auth || '')));
const report={generatedAt:new Date().toISOString(),bundledRaw,raw,policyExcluded:raw-filtered,knownDuplicatesRemoved:filtered-works.length,total:works.length,coverage,
  arabicExtensionCount:scope.window.LorefyArabicLibrary.count,
  metadataQuality:auditMetadata(works),
  mahfouzTitles:writerRecords.filter(work=>search.matchesCatalogQuery(work,'نجيب محفوظ')).map(work=>({id:work.id,title:work.title,type:work.type})),
  keywordChecks:['نجيب اللص','اللص محفوظ','Martin Thrones'].map(query=>({query,matches:writerRecords.filter(work=>search.matchesCatalogQuery(work,query)).map(work=>({id:work.id,title:work.title}))})),
  allTargetsMet:Object.values(coverage).every(value=>value.met),
  martinTitles:writerRecords.filter(work=>search.matchesCatalogQuery(work,'\u062c\u0648\u0631\u062c \u0645\u0627\u0631\u062a\u0646')).map(work=>({id:work.id,title:work.title})),
  newlyImported:works.filter(work=>work.provenance?.method==='monthly-work-dump' || work.provenance?.method==='metadata-api').length,
  limitations:['Totals do not certify human authorship. Explicit/declaration metadata and conservative publication cutoffs are screening signals.',
    'Provider works can contain translations or collections without canonical links; only known duplicate identities are merged.',
    'Counts include the Arabic and BookTok local extensions after the runtime quality pass; offline canonical IDs can differ from the worker-selected IDs.',
    'Coverage counts are bibliographic records, not a certification of every title, source genre, synopsis or cover.',
    'MangaDex integration requires free/no-ad use; AniList mass collection was not used.'],
  releaseStatus:'local-catalog-updated-not-uploaded-to-TestFlight'};
const output=path.join(root,'output','catalog-bulk','coverage-final.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
