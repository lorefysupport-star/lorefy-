// Pure CPU comparison over the checked-in catalog. No network or account data.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..'),baselineRef=process.argv[2]||'HEAD';
function source(name,before){return before?execFileSync('git',['show',baselineRef+':modules/'+name],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'modules',name),'utf8');}
function runtime(before){
  const window={},context=vm.createContext({window,self:window,globalThis:window,module:{exports:{}}});
  for(const name of ['lorefy-catalog-data.js','lorefy-explore-studio.js'])vm.runInContext(source(name,before),context);
  vm.runInContext('var normalizationCount=0,originalNormalize=String.prototype.normalize;String.prototype.normalize=function(){normalizationCount++;return originalNormalize.apply(this,arguments);};',context);
  return {data:window.LorefyCatalogData,explore:window.LorefyExploreStudio,normalizations:()=>vm.runInContext('normalizationCount',context)};
}
function rows(){return fs.readdirSync(path.join(root,'uploads/catalog-runtime')).filter(file=>/^lorefy-data-part\d+\.json$/.test(file)).sort().flatMap(file=>JSON.parse(fs.readFileSync(path.join(root,'uploads/catalog-runtime',file),'utf8')));}
function measure(before){
  const app=runtime(before),works=rows();app.data.prepareSearchIndexes(works);
  const cases=['Naruto','the','احلام'].map(query=>{
    const matches=works.filter(work=>app.data.matchesCatalogQuery(work,query));
    const start=performance.now(),first=app.explore.rankSearchResults(matches,query),coldMs=performance.now()-start;
    const calls=app.normalizations(),samples=[];
    for(let index=0;index<5;index++){const begin=performance.now();app.explore.rankSearchResults(matches,query);samples.push(performance.now()-begin);}
    return {query,count:first.length,coldMs:+coldMs.toFixed(2),warmMedianMs:+samples.sort((a,b)=>a-b)[2].toFixed(2),warmNormalizationsPerQuery:(app.normalizations()-calls)/5,orderHash:crypto.createHash('sha256').update(first.map(work=>String(work.id)).join('\n')).digest('hex')};
  });
  return {catalogCount:works.length,cases};
}
const before=measure(true),after=measure(false);
console.log(JSON.stringify({baselineRef,before,after,sameResultOrder:before.cases.every((entry,index)=>entry.orderHash===after.cases[index].orderHash),notes:'Node VM relevance sorting only; indexes prepared before measurement. Five warm passes; no network, browser or physical-device timing claim.'},null,2));
