const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
global.LorefyCatalogData=require('../modules/lorefy-catalog-data');
const api=require('../modules/lorefy-explore-studio');
const works=fs.readdirSync(path.join(__dirname,'../uploads/catalog-runtime')).filter(f=>/^lorefy-data-part\d+\.json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,'../uploads/catalog-runtime',f),'utf8')));
function bench(name,run){const samples=[];let count;for(let i=0;i<6;i++){const start=performance.now();count=run().length;samples.push(performance.now()-start)}return {name,count,coldMs:+samples[0].toFixed(2),warmMedianMs:+samples.slice(1).sort((a,b)=>a-b)[2].toFixed(2)}}
let scoreCalls=0;const scoring=w=>{scoreCalls++;return Number(w.r)||0};
const cases=[bench('all popular',()=>api.catalogResults(works,'all','','popular')),bench('manga top rated',()=>api.catalogResults(works,'مانجا','','rating',scoring)),bench('Naruto name search',()=>api.catalogResults(works,'all','Naruto','popular'))];
const prepareStart=performance.now();global.LorefyCatalogData.prepareCatalogRecords(works);const preparationMs=performance.now()-prepareStart;const preparedSearch=bench('Naruto search with worker-prepared indexes',()=>api.catalogResults(works,'all','Naruto','popular'));
console.log(JSON.stringify({catalogCount:works.length,cases,ratingScoreCalls:scoreCalls,workerPreparationMs:+preparationMs.toFixed(2),preparedSearch,notes:'Node pure-function benchmark; not iPhone frame rate. Six passes per case, no network.'},null,2));
