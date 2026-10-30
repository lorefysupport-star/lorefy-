// Run with Node. Optional LOREFY_BENCH_DATA_PATH / LOREFY_BENCH_PLAN_PATH let
// maintainers compare a saved baseline without modifying runtime sources.
const fs = require('node:fs');
const path = require('node:path');
const {performance} = require('node:perf_hooks');
const {createHash} = require('node:crypto');
const data = require(process.env.LOREFY_BENCH_DATA_PATH || '../modules/lorefy-catalog-data');
const plan = require(process.env.LOREFY_BENCH_PLAN_PATH || '../modules/lorefy-catalog-plan');
const index = JSON.parse(fs.readFileSync(path.join(__dirname,'../uploads/catalog-search-index.json'),'utf8'));
function entries() { return index.records.map(row=>({part:Number(row[0]),work:{id:row[1],title:row[2],ar:row[3],auth:row[4],type:row[5],altTitles:row[6],aliases:row[7],authorAliases:row[8]}})); }
function rounded(value) { return +value.toFixed(2); }
async function main() {
  const records=entries();
  const cases=[['Naruto','All'],['ون بيس','All'],['نجيب محفوظ','All'],['One Peice','All'],['كتاب','Book'],['Pride and Prejudice','Novel'],['The','All']];
  const results=[];
  for(const [query,type] of cases){
    let result;const samples=[];
    for(let i=0;i<4;i++){const start=performance.now();result=plan.searchIndexResult(records,query,type,data);samples.push(performance.now()-start);}
    results.push({query,type,parts:result.matches.length,matchedRecords:result.matches.reduce((n,row)=>n+row.count,0),suggestions:result.suggestions,coldMs:rounded(samples[0]),warmMedianMs:rounded(samples.slice(1).sort((a,b)=>a-b)[1]),resultHash:createHash('sha256').update(JSON.stringify(result)).digest('hex')});
  }
  let fallback=null;
  if(plan.searchIndexResultAsync){
    let slices=0,maxSlice=0,startSlice=performance.now();const start=startSlice;
    const result=await plan.searchIndexResultAsync(entries(),'Naruto','All',data,true,async()=>{maxSlice=Math.max(maxSlice,performance.now()-startSlice);slices++;await new Promise(resolve=>setImmediate(resolve));startSlice=performance.now();});
    maxSlice=Math.max(maxSlice,performance.now()-startSlice);
    fallback={elapsedMs:rounded(performance.now()-start),maxSliceMs:rounded(maxSlice),yields:slices,matchedRecords:result.matches.reduce((n,row)=>n+row.count,0)};
  }
  console.log(JSON.stringify({indexRecords:records.length,cases:results,fallback,notes:'Local Node CPU measurements with actual compact index; no network, browser or physical-device certification. First query includes cold index preparation. Hashes cover full ranked shard counts/scores and suggestions.'},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
