'use strict';
const fs=require('node:fs');
const path=require('node:path');
const data=require('../modules/lorefy-catalog-data');
const bulk=require('./catalog-bulk-core');
const {TYPE_LABELS}=require('./catalog-expansion-core');
const root=path.resolve(__dirname,'..');
let changed=0;
for(const name of fs.readdirSync(path.join(root,'uploads')).filter(name=>/^lorefy-data-part\d+\.js$/.test(name))) {
  const file=path.join(root,'uploads',name);
  const source=fs.readFileSync(file,'utf8');
  const records=data.extractCatalogRecords(source);
  let dirty=false;
  for(const work of records) {
    if(work.provenance?.method!=='monthly-work-dump') continue;
    const type=bulk.classify({subjects:work.genres || []}) || 'Book';
    if(type && work.type!==TYPE_LABELS[type]) {
      work.type=TYPE_LABELS[type];
      dirty=true;
      changed++;
    }
  }
  if(dirty) fs.writeFileSync(file,source.slice(0,source.indexOf('Array.prototype.push.apply(window.LorefyMangaData,'))+`Array.prototype.push.apply(window.LorefyMangaData,${JSON.stringify(records)});\n`);
}
console.log(`Corrected ${changed} imported classifications; no quota padding`);
