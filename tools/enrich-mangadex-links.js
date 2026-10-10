'use strict';
const fs=require('node:fs');
const path=require('node:path');
const data=require('../modules/lorefy-catalog-data');
const root=path.resolve(__dirname,'..');
const cache=path.join(root,'output','catalog-bulk','mangadex');
const index=new Map();
for(const name of fs.readdirSync(cache).filter(name=>/^(Manga|Manhwa|Manhua)-\d+\.json$/.test(name))) {
  for(const item of JSON.parse(fs.readFileSync(path.join(cache,name),'utf8')).data || []) index.set(item.id,item.attributes);
}
let updated=0;
for(const name of fs.readdirSync(path.join(root,'uploads')).filter(name=>/^lorefy-data-part\d+\.js$/.test(name))) {
  const file=path.join(root,'uploads',name);
  const source=fs.readFileSync(file,'utf8');
  const records=data.extractCatalogRecords(source);
  let changed=false;
  for(const work of records) {
    if(!/^md-/.test(work.id || '')) continue;
    const attrs=index.get(work.id.slice(3));
    if(!attrs) continue;
    work.malId=Number(attrs.links?.mal)||undefined;
    work.anilistId=Number(attrs.links?.al)||undefined;
    work.altTitles=(attrs.altTitles || []).flatMap(value=>Object.values(value)).filter(value=>typeof value==='string');
    changed=true;
    updated++;
  }
  if(changed) fs.writeFileSync(file,source.slice(0,source.indexOf('Array.prototype.push.apply(window.LorefyMangaData,'))+`Array.prototype.push.apply(window.LorefyMangaData,${JSON.stringify(records)});\n`);
}
console.log(`Added verified cross-provider identifiers to ${updated} MangaDex records`);
