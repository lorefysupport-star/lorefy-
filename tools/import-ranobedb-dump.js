'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {Readable}=require('node:stream');
const {createGunzip}=require('node:zlib');
const readline=require('node:readline');
const {execFileSync}=require('node:child_process');
const policy=require('../modules/lorefy-catalog-policy');
const identity=require('../modules/lorefy-catalog-identity');
const {loadBundledCatalog}=require('./build-api-catalog-expansion');
const {selectNewWorks}=require('./catalog-expansion-core');
const {acquireCatalogLock}=require('./catalog-import-lock');
const root=path.resolve(__dirname,'..');

function decode(value){
  if(value==='\\N')return null;
  return value.replace(/\\([btnrfv\\]|[0-7]{1,3})/g,(_,key)=>
    /^[0-7]/.test(key)?String.fromCharCode(parseInt(key,8)):({b:'\b',t:'\t',n:'\n',r:'\r',f:'\f',v:'\v','\\':'\\'})[key]);
}
async function readDump(){
  const response=await fetch('https://dumps.ranobedb.org/rndb-db-public-latest.dump.gz',{signal:AbortSignal.timeout(120000)});
  if(!response.ok)throw Error('RanobeDB '+response.status);
  const keep=new Set(['series','series_title','series_tag','series_book','book','book_staff_alias','staff_alias','tag','image']);
  const tables={};
  let name=null,columns=[],pending='';
  const lines=readline.createInterface({input:Readable.fromWeb(response.body).pipe(createGunzip()),crlfDelay:Infinity});
  for await(const line of lines){
    const header=/^COPY public\.(\w+) \(([^)]+)\) FROM stdin;$/.exec(line);
    if(header){if(pending)throw Error('Incomplete COPY record in '+name);name=header[1];columns=header[2].split(', ');if(keep.has(name))tables[name]=[];continue;}
    if(line==='\\.'){if(pending)throw Error('Incomplete COPY record in '+name);name=null;continue;}
    if(!name||!keep.has(name))continue;
    const record=pending?pending+'\n'+line:line;
    const cells=record.split('\t');
    if(cells.length<columns.length){pending=record;continue;}
    pending='';
    if(cells.length!==columns.length)throw Error('Malformed COPY record in '+name+': '+cells.length+'/'+columns.length);
    tables[name].push(Object.fromEntries(columns.map((key,index)=>[key,decode(cells[index])])));
  }
  if(pending)throw Error('Incomplete COPY record in '+name);
  return tables;
}
function mapSeries(series,{titles,tags,books,authors,images}){
  const year=Math.floor(Number(series.c_start_date||series.start_date)/10000);
  if(series.hidden==='t'||!Number.isFinite(year)||year<1800||year>2021)return [];
  const labels=tags||[];
  if(policy.isExplicitWork({genres:labels})||policy.isAiGeneratedWork({tags:labels})||
    labels.some(x=>/sexual content|^r18|erotic/i.test(x)))return [];
  const english=(titles||[]).find(t=>t.lang==='en')?.title;
  const roman=(titles||[]).find(t=>t.romaji&&/[a-z]/i.test(t.romaji))?.romaji;
  const original=(titles||[]).find(t=>t.lang===series.olang)?.title || (titles||[]).find(t=>t.lang==='ja')?.title;
  const title=english||roman||original;
  const author=[...new Set(authors.filter(Boolean))].join(', ');
  const cover=images.find(image=>image&&image.nsfw==='f'&&image.spoiler==='f');
  if(!title||!author||!cover)return [];
  const id='ranobe-ln-'+series.id;
  const base={id,title,ar:title,auth:author,yr:year,type:'لايت نوفل',language:series.olang||'',
    sourceCoverUrl:'https://images.ranobedb.org/'+encodeURIComponent(cover.filename),
    r:0,baseRatings:0,baseReviews:0,pop:0,ch:0,vol:books.length,
    synopsis:series.description||'',genres:labels,st:series.publication_status,
    pl:'RanobeDB',_apiSource:'RanobeDB',coverContentRating:'safe',
    malId:Number(series.mal_id)||undefined,anilistId:Number(series.anilist_id)||undefined,
    provenance:{url:'https://ranobedb.org/series/'+series.id,method:'official-dump',license:'ODbL-1.0'},
    altTitles:titles.flatMap(t=>[t.title,t.romaji]).filter(Boolean)};
  const result=[base];
  if(/^https?:\/\//.test(series.web_novel||'')){
    const web={...base,id:'ranobe-web-'+series.id,type:'ويب نوفل',vol:0,malId:undefined,anilistId:undefined,
      related:[id],provenance:{...base.provenance,webNovelUrl:series.web_novel}};
    result.push(web);
  }
  return result;
}
function group(rows,key){const result=new Map();for(const row of rows||[]){const id=row[key];if(!result.has(id))result.set(id,[]);result.get(id).push(row);}return result;}
async function main(){
  const t=await readDump();
  const titles=group(t.series_title,'series_id'),links=group(t.series_book,'series_id'),tags=group(t.series_tag,'series_id');
  const bookAuthors=group(t.book_staff_alias,'book_id');
  const tagNames=new Map(t.tag.map(r=>[r.id,r.name]));
  const images=new Map(t.image.map(r=>[r.id,r]));
  const books=new Map(t.book.map(r=>[r.id,r]));
  const aliases=new Map(t.staff_alias.map(r=>[r.id,r.romaji||r.name]));
  const candidates=[];
  for(const series of t.series){
    const members=(links.get(series.id)||[]).filter(x=>x.book_type==='main');
    const authors=members.flatMap(book=>(bookAuthors.get(book.book_id)||[]).filter(a=>a.role_type==='author').map(a=>aliases.get(a.staff_alias_id)));
    const covers=members.map(book=>images.get(books.get(book.book_id)?.c_image_id));
    candidates.push(...mapSeries(series,{titles:titles.get(series.id)||[],tags:(tags.get(series.id)||[]).map(tag=>tagNames.get(tag.tag_id)).filter(Boolean),books:members,authors,images:covers}));
  }
  const release=await acquireCatalogLock(root);
  try{
    const base=loadBundledCatalog();
    const additions=selectNewWorks(base,candidates,null,Number.MAX_SAFE_INTEGER);
    const combined=base.concat(additions);policy.filterInPlace(combined);identity.organizeCatalog(combined,{aliases:{}});
    const ids=new Set(base.map(w=>w.id));const accepted=combined.filter(w=>!ids.has(w.id));
    const uploads=path.join(root,'uploads');
    let next=Math.max(...fs.readdirSync(uploads).map(x=>/^lorefy-data-part(\d+)\.js$/.exec(x)).filter(Boolean).map(x=>Number(x[1])))+1;
    for(let offset=0;offset<accepted.length;offset+=750){
      fs.writeFileSync(path.join(uploads,'lorefy-data-part'+String(next++).padStart(2,'0')+'.js'),
        '/* RanobeDB metadata, ODbL-1.0; https://ranobedb.org/database-dumps */\nwindow.LorefyMangaData=window.LorefyMangaData||[];\nArray.prototype.push.apply(window.LorefyMangaData,'+JSON.stringify(accepted.slice(offset,offset+750))+');\n');
    }
    const exportDir=path.join(uploads,'catalog-sources');fs.mkdirSync(exportDir,{recursive:true});
    fs.writeFileSync(path.join(exportDir,'ranobedb.json'),JSON.stringify({source:'RanobeDB',sourceUrl:'https://ranobedb.org/database-dumps',license:'https://opendatacommons.org/licenses/odbl/1-0/',contentsLicense:'https://opendatacommons.org/licenses/dbcl/1-0/',records:candidates}));
    console.log({sourceSeries:t.series.length,eligible:candidates.length,added:accepted.length,lightNovel:accepted.filter(w=>w.type==='لايت نوفل').length,webNovel:accepted.filter(w=>w.type==='ويب نوفل').length});
    execFileSync(process.execPath,[path.join(root,'tools/build-catalog-map.js')],{stdio:'inherit'});
  }finally{release();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={decode,mapSeries,readDump};
