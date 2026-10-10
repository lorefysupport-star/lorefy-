'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {extractCatalogRecords}=require('../modules/lorefy-catalog-data');
const policy=require('../modules/lorefy-catalog-policy');
const {acquireCatalogLock}=require('./catalog-import-lock');

function enrichRecord(work,source) {
  const match=/^ranobe-(?:ln|web)-(\d+)$/.exec(String(work && work.id || ''));
  if(!match || !source || source.id!==work.id || source.type!==work.type ||
    source.provenance?.url!==`https://ranobedb.org/series/${match[1]}` || source.provenance?.license!=='ODbL-1.0' ||
    policy.isExcludedWork(source) || policy.isExplicitWork(source) || policy.isAiGeneratedWork(source) ||
    (source.genres || []).some(label=>/sexual content|^r18|erotic/i.test(label))) return false;
  let changed=false;
  for(const field of ['language','synopsis','sourceCoverUrl']) {
    if(!work[field] && source[field]) {work[field]=source[field];changed=true;}
  }
  for(const field of ['genres','altTitles']) {
    const old=work[field] || [];
    const merged=[...new Set([...old,...(source[field] || [])])];
    if(merged.length!==old.length) {work[field]=merged;changed=true;}
  }
  if(changed) {
    work.provenance={...work.provenance,...source.provenance,metadataRefreshedAt:'2026-10-08'};
    delete work._queryIndex;
    delete work._tasteGenreKeys;
    work._indexed=false;
  }
  return changed;
}

async function main() {
  const root=path.resolve(__dirname,'..');
  const source=JSON.parse(fs.readFileSync(path.join(root,'uploads/catalog-sources/ranobedb.json'),'utf8'));
  const byId=new Map(source.records.map(work=>[work.id,work]));
  const release=await acquireCatalogLock(root);
  const report={updated:0,files:[],fields:{language:0,synopsis:0,genres:0,altTitles:0}};
  try {
    const uploads=path.join(root,'uploads');
    for(const file of fs.readdirSync(uploads).filter(file=>/^lorefy-data-part\d+\.js$/.test(file))) {
      const filename=path.join(uploads,file);
      const text=fs.readFileSync(filename,'utf8');
      const records=extractCatalogRecords(text);
      let updated=0;
      for(const work of records) {
        const previous={language:work.language,synopsis:work.synopsis,genres:JSON.stringify(work.genres),altTitles:JSON.stringify(work.altTitles)};
        if(enrichRecord(work,byId.get(work.id))) {
          updated++;
          for(const field of Object.keys(previous)) {
            const value=Array.isArray(work[field])?JSON.stringify(work[field]):work[field];
            if(previous[field]!==value) report.fields[field]++;
          }
        }
      }
      if(!updated) continue;
      // Keep the existing shard wrapper and license notice; replace only its JSON payload.
      const marker='Array.prototype.push.apply(window.LorefyMangaData,';
      fs.writeFileSync(filename,text.slice(0,text.indexOf(marker)+marker.length)+JSON.stringify(records)+');\n');
      report.updated+=updated;report.files.push(file);
    }
    fs.writeFileSync(path.join(root,'output/catalog-bulk/ranobedb-metadata-refresh.json'),JSON.stringify(report,null,2));
    execFileSync(process.execPath,[path.join(root,'tools/build-catalog-map.js')],{stdio:'inherit'});
    console.log(JSON.stringify(report));
  } finally {release();}
}
if(require.main===module) main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={enrichRecord};
