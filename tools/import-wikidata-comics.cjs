'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {compactRecord,featuresRuntime}=require('./build-runtime-catalog');
const policy=require('../modules/lorefy-catalog-policy');
const root=path.resolve(__dirname,'..');
const QUERY=`SELECT DISTINCT ?item ?title ?ar ?kind
WHERE {
 ?item wdt:P31 wd:Q14406742.
 FILTER NOT EXISTS { ?item wdt:P31 wd:Q8274. }
 BIND(wd:Q14406742 AS ?kind)
 ?item rdfs:label ?title. FILTER(LANG(?title)="en")
 OPTIONAL { ?item rdfs:label ?ar. FILTER(LANG(?ar)="ar") }
} LIMIT 2000`;
const clean=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,300);
function mapBinding(row){
 const id=String(row?.item?.value||'').match(/^https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)$/);
 const title=clean(row?.title?.value);
 if(!id||!title||!/^https?:\/\/www\.wikidata\.org\/entity\/Q14406742$/.test(row?.kind?.value||''))return null;
 const year=String(row?.date?.value||'').match(/^(\d{4})-/);
 return {id:'wd-'+id[1],wikidataId:id[1],title,ar:clean(row?.ar?.value)||title,
  auth:clean(row?.authors?.value),type:'كوميكس',yr:year?Number(year[1]):0,
  genres:['Comics'],catalogLevel:'series',metadataOnly:true,
  source:'Wikidata',pl:'Wikidata',sourceUrl:'https://www.wikidata.org/wiki/'+id[1],sourceLicense:'CC0',
  r:0,rSrc:'',ch:0,vol:0,pages:0,st:'غير معروفة',synopsis:'',sourceCoverUrl:'',
  _apiDynamic:true,_apiSource:'Wikidata',_apiSourceId:id[1]};
}
async function main(args){
 const fetchIndex=args.indexOf('--fetch');
 if(fetchIndex>=0){
  const dest=args[fetchIndex+1];if(!dest)throw Error('--fetch requires an output path');
  const response=await fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(QUERY),{
   headers:{Accept:'application/sparql-results+json','User-Agent':'LorefyCatalog/1.0 (lorefysupport@gmail.com)'},signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw Error('Wikidata HTTP '+response.status);
  const body=await response.text();if(Buffer.byteLength(body)>5*1024*1024)throw Error('Response too large');
  const json=JSON.parse(body);if(!Array.isArray(json.results?.bindings))throw Error('Invalid response');
  fs.mkdirSync(path.dirname(path.resolve(dest)),{recursive:true});fs.writeFileSync(dest,body);
  console.log('Fetched',json.results.bindings.length,'series bindings');return;
 }
 const input=args[args.indexOf('--input')+1];if(!args.includes('--input')||!input)throw Error('Use --fetch <json> or --input <json>');
 const payload=fs.readFileSync(input,'utf8'),json=JSON.parse(payload);
 if(!Array.isArray(json.results?.bindings)||json.results.bindings.length>2000)throw Error('Invalid or oversized bindings');
 const uploads=path.join(root,'uploads'),runtime=path.join(uploads,'catalog-runtime');
 const files=fs.readdirSync(uploads).filter(n=>/^lorefy-data-part\d+\.js$/.test(n)).sort();
 const maxPart=Math.max(...files.map(n=>Number(n.match(/part(\d+)/)[1])));
 const index=JSON.parse(fs.readFileSync(path.join(uploads,'catalog-search-index.json'),'utf8'));
 const existing=new Set(index.records.map(r=>r[1])),seen=new Set(),rows=[];
 for(const row of json.results.bindings){const work=mapBinding(row);if(!work||existing.has(work.id)||seen.has(work.id))continue;
  seen.add(work.id);if(policy.isExcludedWork(work)||policy.isExplicitWork(work)||policy.isAiGeneratedWork(work))continue;rows.push(work);}
 if(!rows.length)throw Error('No new series; no files changed');
 rows.sort((a,b)=>a.id.localeCompare(b.id));
 const features=featuresRuntime(),added=[];
 for(let start=0;start<rows.length;start+=300){
  const part=maxPart+1+added.length,name='lorefy-data-part'+String(part).padStart(2,'0'),batch=rows.slice(start,start+300);
  const raw=path.join(uploads,name+'.js'),compact=path.join(runtime,name+'.json');
  if(fs.existsSync(raw)||fs.existsSync(compact))throw Error('Refusing to overwrite '+name);
  fs.writeFileSync(raw,'/* Wikidata CC0 comic series metadata; see catalog-sources/wikidata-comics.json. No full text or cover rights implied. */\nwindow.LorefyMangaData=window.LorefyMangaData||[];\nArray.prototype.push.apply(window.LorefyMangaData,'+JSON.stringify(batch)+');\n');
  fs.writeFileSync(compact,JSON.stringify(batch.map(w=>compactRecord(w,features))));added.push(part);
 }
 const hash=crypto.createHash('sha256');let sourceBytes=0,runtimeBytes=0,count=0;
 for(const name of fs.readdirSync(uploads).filter(n=>/^lorefy-data-part\d+\.js$/.test(n))){
  const raw=fs.readFileSync(path.join(uploads,name)),body=fs.readFileSync(path.join(runtime,name.replace('.js','.json')));
  sourceBytes+=raw.length;runtimeBytes+=body.length;count+=JSON.parse(body).length;hash.update(name).update(body);
 }
 fs.writeFileSync(path.join(runtime,'manifest.json'),JSON.stringify({sourceBytes,runtimeBytes,count,contentHash:hash.digest('hex')}));
 const sourceDir=path.join(uploads,'catalog-sources');fs.mkdirSync(sourceDir,{recursive:true});
 fs.writeFileSync(path.join(sourceDir,'wikidata-comics.json'),JSON.stringify({source:'Wikidata',license:'CC0',
  licenseUrl:'https://www.wikidata.org/wiki/Wikidata:Licensing',retrievedAt:new Date().toISOString(),query:QUERY,
  inputHash:crypto.createHash('sha256').update(payload).digest('hex'),count:rows.length,parts:added},null,2)+'\n');
 console.log(JSON.stringify({added:rows.length,parts:added,total:count}));
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={mapBinding,QUERY};
