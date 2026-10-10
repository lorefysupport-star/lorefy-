'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {Readable} = require('node:stream');
const {createGunzip} = require('node:zlib');
const {createInterface} = require('node:readline');
const {execFileSync} = require('node:child_process');
const {acquireCatalogLock} = require('./catalog-import-lock');
const {candidate,classify,parseDumpLine,mapWork} = require('./catalog-bulk-core');
const {loadBundledCatalog} = require('./build-api-catalog-expansion');
const {selectNewWorks} = require('./catalog-expansion-core');
const identity = require('../modules/lorefy-catalog-identity');
const policy = require('../modules/lorefy-catalog-policy');
const plan = require('../modules/lorefy-catalog-plan');
const root = path.resolve(__dirname,'..');
const cache = path.join(root,'output','catalog-bulk');
const dumpDate = process.env.LOREFY_DUMP_DATE || '2026-09-30';
const source = kind=>`https://archive.org/download/ol_dump_${dumpDate}/ol_dump_${kind}_${dumpDate}.txt.gz`;
const budgetMs = Number(process.env.LOREFY_DUMP_SECONDS || 600)*1000;
const types = ['Manga','Manhwa','Manhua','Comics','Novel','Book','Light Novel','Web Novel'];
const maxPerType = Number(process.env.LOREFY_BULK_CANDIDATES || 20000);
const requestedTypes=(process.env.LOREFY_BULK_TYPES || types.join(',')).split(',');
const read = (name,fallback)=>fs.existsSync(path.join(cache,name)) ? JSON.parse(fs.readFileSync(path.join(cache,name),'utf8')) : fallback;
function write(name,value) {
  const file=path.join(cache,name);
  fs.writeFileSync(file+'.tmp',JSON.stringify(value));
  fs.renameSync(file+'.tmp',file);
}

async function scan(kind,visit) {
  const controller=new AbortController();
  const deadline=Date.now()+budgetMs;
  const timer=setTimeout(()=>controller.abort(),budgetMs);
  let response,input,gunzip,lines=0,complete=false;
  try {
    response=await fetch(source(kind),{signal:controller.signal,headers:{'User-Agent':'LorefyCatalogBulk/1.0 (lorefysupport@gmail.com)'}});
    if(!response.ok) throw new Error(`Dump ${kind}: HTTP ${response.status}`);
    console.log(`${kind}: ${response.url}, compressed bytes ${response.headers.get('content-length')}`);
    input=Readable.fromWeb(response.body);
    gunzip=createGunzip();
    input.on('error',error=>gunzip.destroy(error));
    input.pipe(gunzip);
    const reader=createInterface({input:gunzip,crlfDelay:Infinity});
    for await(const line of reader) {
      lines++;
      const record=parseDumpLine(line,kind==='authors'?'author':'work');
      if(record && visit(record)===false) break;
      if(lines%100000===0) console.log(`${kind}: scanned ${lines.toLocaleString()} records`);
      if(Date.now()>deadline) break;
    }
    complete=Boolean(input.readableEnded && gunzip.readableEnded);
  } catch(error) {
    if(!controller.signal.aborted) throw error;
    console.log(`${kind}: time budget reached; keeping verified partial progress`);
  } finally {
    clearTimeout(timer);
    input?.destroy();
    gunzip?.destroy();
    controller.abort();
  }
  return {url:source(kind),lines,complete};
}

async function main() {
  fs.mkdirSync(cache,{recursive:true});
  const suffix=requestedTypes.length===types.length?'':`-${requestedTypes.join('-')}`;
  const candidatesFile=`candidates-${dumpDate}${suffix}.json`;
  let records=read(candidatesFile,null);
  let workScan=read(`work-scan-${dumpDate}.json`,null);
  if(!records || process.env.LOREFY_BULK_REFRESH==='1') {
    records=[];
    const counts=Object.fromEntries(types.map(type=>[type,0]));
    workScan=await scan('works',record=>{
      if(!candidate(record)) return;
      const type=classify(record);
      if(!requestedTypes.includes(type)) return;
      if(counts[type]>=maxPerType) return;
      records.push(record);
      counts[type]++;
      if(records.length%1000===0) console.log(`Candidates: ${JSON.stringify(counts)}`);
    });
    write(candidatesFile,records);
    write(`work-scan-${dumpDate}.json`,workScan);
  }
  const authorFile=`authors-${dumpDate}.json`;
  const authors=new Map(read(authorFile,[]));
  const needed=new Set(records.flatMap(record=>(record.authors || []).map(x=>x.author?.key).filter(key=>key && !authors.has(key))));
  let authorScan=null;
  if(needed.size) authorScan=await scan('authors',record=>{
    if(!needed.has(record.key)) return;
    authors.set(record.key,{name:record.name,alternate_names:record.alternate_names || []});
    needed.delete(record.key);
    if(!needed.size) return false;
  });
  write(authorFile,[...authors]);
  const release=await acquireCatalogLock(root);
  try {
  const base=loadBundledCatalog();
  const mapped=records.map(record=>mapWork(record,authors)).filter(Boolean);
  const additions=selectNewWorks(base,mapped,null,Number.MAX_SAFE_INTEGER);
  const combined=base.concat(additions);
  policy.filterInPlace(combined);
  identity.organizeCatalog(combined,{aliases:{}});
  const baseIds=new Set(base.map(work=>work.id));
  const accepted=combined.filter(work=>!baseIds.has(work.id));
  const uploads=path.join(root,'uploads');
  const existing=fs.readdirSync(uploads).map(name=>/^lorefy-data-part(\d+)\.js$/.exec(name)).filter(Boolean).map(match=>Number(match[1]));
  let next=Math.max(...existing)+1;
  const files=[];
  for(let offset=0;offset<accepted.length;offset+=750) {
    const name=`lorefy-data-part${String(next++).padStart(2,'0')}.js`;
    const batch=accepted.slice(offset,offset+750);
    fs.writeFileSync(path.join(uploads,name),`/* Open Library monthly metadata dump ${dumpDate}; works, not editions. */\nwindow.LorefyMangaData=window.LorefyMangaData||[];\nArray.prototype.push.apply(window.LorefyMangaData,${JSON.stringify(batch)});\n`);
    files.push(name);
  }
  execFileSync(process.execPath,[path.join(root,'tools','build-catalog-map.js')],{stdio:'inherit'});
  const final=loadBundledCatalog();
  policy.filterInPlace(final);
  identity.organizeCatalog(final,{aliases:{}});
  const counts=Object.fromEntries(types.map(type=>[type,0]));
  for(const work of final) counts[plan.normalizeRouteType(work.type)]++;
  const coverage=Object.fromEntries(types.map(type=>[type,{count:counts[type],target:7000,shortfall:Math.max(0,7000-counts[type]),met:counts[type]>=7000}]));
  const report={generatedAt:new Date().toISOString(),dumpDate,workScan,authorScan,unresolvedAuthorKeys:needed.size,candidates:records.length,
    mapped:mapped.length,added:accepted.length,files,total:final.length,coverage,allTargetsMet:Object.values(coverage).every(x=>x.met),
    exclusions:'Explicit metadata, declared AI tags, scripture/tarot. Newly imported works require publication date <=2021. This is not proof of human authorship.',
    sourcePolicy:'Open Library monthly dumps for bulk metadata; no AniList mass harvesting; no fabricated ratings or category padding.'};
  write('coverage-report.json',report);
  console.log(JSON.stringify(report,null,2));
  } finally { release(); }
}
if(require.main===module) main().catch(error=>{console.error(error);process.exitCode=1;});
