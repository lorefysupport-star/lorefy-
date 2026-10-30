/* Read-only, low-volume public metadata probes. No account, keys or database writes. */
'use strict';
const {performance}=require('node:perf_hooks');
const publicBase='https://qsroxmltioxqozmykens.supabase.co/functions/v1/lorefy-public';
const aniBody=JSON.stringify({query:'query($search:String){Page(page:1,perPage:3){media(search:$search,type:MANGA,isAdult:false){id idMal title{romaji english native}}}}',variables:{search:'Naruto'}});
const allProbes=[
 ['AniList work search','enabled',publicBase+'/catalog-anilist',{method:'POST',headers:{'Content-Type':'application/json'},body:aniBody},j=>j.data?.Page?.media?.length],
 ['AniList character search','enabled',publicBase+'/catalog-anilist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'query{Page(perPage:3){characters(search:"Killua"){id name{full native}}}}'})},j=>j.data?.Page?.characters?.length],
 ['MangaDex search','enabled',publicBase+'/catalog-mangadex?title=Naruto&limit=3&contentRating%5B%5D=safe',{},j=>j.data?.length],
 ['Open Library English search','enabled',publicBase+'/catalog-openlibrary?q=Dune&limit=3&fields=key,title,author_name,subject',{},j=>j.docs?.length],
 ['Open Library Arabic search','enabled',publicBase+'/catalog-openlibrary?q='+encodeURIComponent('نجيب محفوظ')+'&limit=3&fields=key,title,author_name,subject',{},j=>j.docs?.length],
 ['Open Library editions','enabled for exact work',publicBase+'/catalog-openlibrary-editions?work=OL45804W&limit=3',{},j=>j.entries?.length],
 ['Tenrai MAL title search','enabled', 'https://api.tenrai.org/v1/manga?q=Naruto&limit=3',{},j=>j.data?.length],
 ['Tenrai MAL character search','enabled','https://api.tenrai.org/v1/characters?q=Killua&limit=3',{},j=>j.data?.length],
 ['Google Books search','disabled in current client config',publicBase+'/catalog-googlebooks?q=Dune&maxResults=3',{},j=>j.items?.length],
 ['Wikidata search','local preview; public enrichment route exists',publicBase+'/catalog-wikidata?action=wbsearchentities&format=json&search=Dune&language=en&limit=3',{},j=>j.search?.length],
 ['BookBrainz search','local preview; not enabled for production','https://api.bookbrainz.org/1/search?q=Dune&size=3',{},j=>j.searchResult?.length],
 ['GCD search','local preview; not enabled for production','https://www.comics.org/api/series/name/Watchmen/?page=1',{},j=>j.results?.length]
];
const requested=process.argv.slice(2).map(value=>value.toLowerCase());
const probes=allProbes.filter(row=>!requested.length||requested.some(value=>row[0].toLowerCase().includes(value)));
async function probe([name,configuration,url,init,count]){
 const start=performance.now();try{
  const response=await fetch(url,{...init,headers:{Accept:'application/json',...(init.headers||{})},signal:AbortSignal.timeout(12000)});
  const text=await response.text();if(Buffer.byteLength(text)>4*1024*1024)throw Error('Response exceeds probe budget');
  let json;try{json=JSON.parse(text);}catch{}
  const records=count(json||{});return {name,configuration,status:response.status,elapsedMs:Math.round(performance.now()-start),records:records??null,
   valid:response.ok&&!(json?.errors&&(!Array.isArray(json.errors)||json.errors.length))&&typeof records==='number',
   retryAfter:response.headers.get('retry-after'),cacheControl:response.headers.get('cache-control'),cors:response.headers.get('access-control-allow-origin'),
   error:(json?.errors?.[0]?.message||json?.error?.message||(typeof json?.error==='string'?json.error:undefined))?.replace(/project_number:\d+/g,'project_number:[redacted]')};
 }catch(error){return {name,configuration,status:null,elapsedMs:Math.round(performance.now()-start),valid:false,error:error.name==='TimeoutError'?'Probe timeout':error.message};}
}
(async()=>{
 const results=[];let cursor=0;
 async function worker(){while(cursor<probes.length){const row=await probe(probes[cursor++]);results.push(row);}}
 await Promise.all([worker(),worker()]);
 results.sort((a,b)=>probes.findIndex(p=>p[0]===a.name)-probes.findIndex(p=>p[0]===b.name));
 console.log(JSON.stringify({checkedAt:new Date().toISOString(),scope:'Public metadata only. Individual observations; not peak-load or device certification.',results},null,2));
 if(results.some(r=>r.configuration.startsWith('enabled')&&!r.valid))process.exitCode=1;
})();
