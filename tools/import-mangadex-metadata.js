'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {acquireCatalogLock}=require('./catalog-import-lock');
const {loadBundledCatalog,mapMangaDex}=require('./build-api-catalog-expansion');
const {selectNewWorks}=require('./catalog-expansion-core');
const identity=require('../modules/lorefy-catalog-identity');
const policy=require('../modules/lorefy-catalog-policy');
const root=path.resolve(__dirname,'..');
const cache=path.join(root,'output','catalog-bulk','mangadex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function getPage(params,file) {
  if(fs.existsSync(file)) return JSON.parse(fs.readFileSync(file,'utf8'));
  for(let attempt=0;attempt<5;attempt++) {
    let response;
    try {
      response=await fetch('https://api.mangadex.org/manga?'+params,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'LorefyCatalogMetadata/1.0'}});
    } catch(error) {
      if(attempt===4) throw error;
      await pause(1000*(attempt+1));
      continue;
    }
    if(response.status===429 || response.status>=500 || response.status===400 && attempt<2) {
      await pause(Math.max(1000,Number(response.headers.get('retry-after') || 10)*1000));
      continue;
    }
    if(!response.ok) throw new Error(`MangaDex ${response.status}: ${(await response.text()).slice(0,500)}`);
    const page=await response.json();
    fs.writeFileSync(file,JSON.stringify(page));
    await pause(750);
    return page;
  }
  throw new Error('MangaDex retry budget exhausted');
}
async function main() {
  // The provider explicitly disallows advertising and paid services.
  if(process.env.LOREFY_MANGADEX_NONCOMMERCIAL!=='1') throw new Error('Confirm free/no-ad use with LOREFY_MANGADEX_NONCOMMERCIAL=1. Paid services require another source.');
  fs.mkdirSync(cache,{recursive:true});
  const sourceCounts={};
  for(const [type,languages] of [['Manga',['ja']],['Manhwa',['ko']],['Manhua',['zh','zh-hk']]]) {
    const candidates=[];
    let total=0;
    for(let offset=0;offset<10000;offset+=100) {
      const params=new URLSearchParams({limit:'100',offset:String(offset),'order[followedCount]':'desc'});
      languages.forEach(value=>params.append('originalLanguage[]',value));
      ['safe','suggestive'].forEach(value=>params.append('contentRating[]',value));
      ['cover_art','author'].forEach(value=>params.append('includes[]',value));
      const page=await getPage(params,path.join(cache,`${type}-${offset}.json`));
      total=Number(page.total)||0;
      for(const item of page.data || []) {
        const labels=(item.attributes?.tags || []).map(tag=>tag.attributes?.name?.en || '');
        if(policy.isExplicitWork({genres:labels}) || policy.isAiGeneratedWork({tags:labels})) continue;
        const title=item.attributes?.title || {};
        const options=[title.en,title['en-us'],title['ja-ro'],title['ko-ro'],...((item.attributes?.altTitles || []).flatMap(x=>Object.values(x))),...Object.values(title)];
        const english=options.find(value=>typeof value==='string' && /[a-z]/i.test(value) && !/[\u3040-\u30ff\u3400-\u9fff]/.test(value));
        if(!english) continue;
        const work=mapMangaDex({...item,attributes:{...item.attributes,title:{en:english}}},type);
        if(!work || !work.sourceCoverUrl || !work.auth || work.auth==='Unknown') continue;
        work.malId=Number(item.attributes?.links?.mal)||undefined;
        work.anilistId=Number(item.attributes?.links?.al)||undefined;
        work.altTitles=(item.attributes?.altTitles || []).flatMap(x=>Object.values(x)).filter(value=>typeof value==='string');
        work.provenance={url:`https://mangadex.org/title/${item.id}`,method:'metadata-api',acceptableUse:'free-no-ads-only',contentRating:work.contentRating};
        candidates.push(work);
      }
      if(offset%1000===0) console.log(`${type}: offset ${offset}/${total}; usable ${candidates.length}`);
      if(offset+100>=total || !(page.data || []).length) break;
    }
    const release=await acquireCatalogLock(root);
    try {
    const base=loadBundledCatalog();
    const additions=selectNewWorks(base,candidates,null,Number.MAX_SAFE_INTEGER);
    const combined=base.concat(additions);
    policy.filterInPlace(combined);
    identity.organizeCatalog(combined,{aliases:{}});
    const baseIds=new Set(base.map(work=>work.id));
    const accepted=combined.filter(work=>!baseIds.has(work.id));
    const uploads=path.join(root,'uploads');
    let next=Math.max(...fs.readdirSync(uploads).map(name=>/^lorefy-data-part(\d+)\.js$/.exec(name)).filter(Boolean).map(match=>Number(match[1])))+1;
    for(let offset=0;offset<accepted.length;offset+=750) {
      const name=`lorefy-data-part${String(next++).padStart(2,'0')}.js`;
      fs.writeFileSync(path.join(uploads,name),`/* Metadata source: MangaDex; https://api.mangadex.org/docs/api.yaml. Free/no-ad use only. No chapters. */\nwindow.LorefyMangaData=window.LorefyMangaData||[];\nArray.prototype.push.apply(window.LorefyMangaData,${JSON.stringify(accepted.slice(offset,offset+750))});\n`);
    }
    sourceCounts[type]={providerTotal:total,usable:candidates.length,added:accepted.length};
    console.log(`${type}: added ${accepted.length}`);
    } finally { release(); }
  }
  execFileSync(process.execPath,[path.join(root,'tools','build-catalog-map.js')],{stdio:'inherit'});
  fs.writeFileSync(path.join(cache,'report.json'),JSON.stringify({generatedAt:new Date().toISOString(),sources:sourceCounts},null,2));
}
if(require.main===module) main().catch(error=>{console.error(error);process.exitCode=1;});
