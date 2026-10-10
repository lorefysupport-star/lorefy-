'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {loadBundledCatalog}=require('./build-api-catalog-expansion');
const identity=require('../modules/lorefy-catalog-identity');
const policy=require('../modules/lorefy-catalog-policy');
const {auditMetadata}=require('./catalog-metadata-audit');
const root=path.resolve(__dirname,'..');
const works=loadBundledCatalog();
const scope={window:{LorefyMangaData:works,LorefyCatalogPolicy:policy}};
for(const file of ['uploads/lorefy-arabic-library.js','uploads/lorefy-booktok-library.js',
  'modules/lorefy-comics-taxonomy.js','modules/lorefy-bibliographic-overrides.js','uploads/lorefy-catalog-quality.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),scope,{filename:file});
}
policy.filterInPlace(works);
identity.organizeCatalog(works,{aliases:{}});
const hasArabicTitle=w=>{
  const letters=String(w.title||'').match(/\p{L}/gu)||[];
  const arabicLetters=letters.filter(c=>/\p{Script=Arabic}/u.test(c)).length;
  return arabicLetters>0&&arabicLetters/letters.length>=0.6;
};
const arabic=works.filter(hasArabicTitle);
const group=key=>Object.fromEntries([...new Set(arabic.flatMap(w=>key(w)))].sort().map(k=>[k,arabic.filter(w=>key(w).includes(k)).length]));
const names=['نجيب محفوظ','أحمد خالد توفيق','توفيق الحكيم','طه حسين','يوسف إدريس','يوسف زيدان',
  'رضوى عاشور','غسان كنفاني','عبد الرحمن منيف','إبراهيم نصر الله','أحلام مستغانمي',
  'نوال السعداوي','محمد شكري','جبرا إبراهيم جبرا','حنان لاشين','محمود درويش','نزار قباني',
  'جبران خليل جبران','ابن خلدون','الجاحظ','ابن سينا'];
const normalize=identity.normalizeText;
const authors=names.map(name=>{
  const key=normalize(name);
  const matches=arabic.filter(w=>[w.auth,...w.authorAliases||[]].some(a=>normalize(a)===key));
  return {name,count:matches.length,titles:matches.slice(0,12).map(w=>({id:w.id,title:w.title,type:w.type}))};
});
const report={generatedAt:new Date().toISOString(),canonicalTotal:works.length,arabicRecords:arabic.length,
  definition:'At least 60% of primary-title letters are Arabic, after quality/policy/identity passes. Includes Arabic translations, not Arabic search aliases alone. Provider language flags alone do not count.',
  distinctAuthorLabels:new Set(arabic.map(w=>normalize(w.auth)).filter(Boolean)).size,
  authorLabelCaveat:'Name variants and coauthor strings are not independently verified distinct people.',
  byType:group(w=>[w.type]),byGenre:group(w=>(w.genres||[]).filter(g=>g!=='Arabic')),
  bySource:group(w=>[w.source||w.pl||'Unspecified']),representativeAuthors:authors,
  newSourceRecords:arabic.filter(w=>/^wikidata-|^openiti-/.test(w.id)).length,
  metadataQuality:auditMetadata(arabic),
  limitations:['No claim to all Arabic literature or complete publisher bibliographies.',
    'OpenITI is predominantly historical; recent popular fiction still requires additional verified bibliographic feeds.',
    'Missing cover/year/synopsis remains missing rather than using reuse graphs, author death years or generated descriptions.',
    'AI/explicit metadata screening does not certify unseen full texts.'],releaseStatus:'local-only-no-TestFlight-upload'};
const output=path.join(root,'output/catalog-bulk/arabic-open/coverage.json');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,metadataQuality:undefined,representativeAuthors:authors.map(({name,count})=>({name,count}))},null,2));
