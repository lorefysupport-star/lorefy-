'use strict';
const fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process'),{performance}=require('node:perf_hooks');
const baseline=process.argv[2]||'6781dcf';if(!/^[\w./-]+$/.test(baseline))throw Error('Invalid baseline revision');
const original=path=>execFileSync('git',['show',baseline+':'+path],{encoding:'utf8',maxBuffer:20*1024*1024});
const works=fs.readdirSync('uploads/catalog-runtime').filter(f=>/^lorefy-data-part\d+\.json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync('uploads/catalog-runtime/'+f,'utf8')));
async function run(label,read){
 const scope={};vm.createContext(scope);vm.runInContext(read('modules/lorefy-catalog-data.js'),scope);
 const data=scope.LorefyCatalogData;data.prepareSearchIndexes(works);
 const characterWindow={localStorage:{getItem:()=>null,setItem(){}}};
 vm.runInNewContext(read('modules/lorefy-character-system.js'),{window:characterWindow,URL,setTimeout,clearTimeout,console,fetch:async()=>({ok:true,json:async()=>({data:{Page:{characters:[]}}})})});
 const cs=[];for(let i=0;i<3;i++){const start=performance.now();await characterWindow.LorefyCharacterSystem.searchCharacters('No fixture match',works);cs.push(+(performance.now()-start).toFixed(2));}
 const src=read('modules/lorefy-growth-features.js'),a=src.indexOf('  function profileTopCharacterSearchWorks('),b=src.indexOf('  function profileRatedCharacterPortrait(',a),picker={global:{LorefyCatalogData:data},mlWorks:()=>works,profileTopCharacterSearchText:data.normalizeQuery};
 vm.runInNewContext(src.slice(a,b),picker);
 const queries=['Naruto','نجيب محفوظ','Hunter x Hunter','George Martin'],results=[];
 for(const query of queries){const start=performance.now(),rows=picker.profileTopCharacterSearchWorks(query);results.push({query,elapsedMs:+(performance.now()-start).toFixed(2),ids:Array.from(rows,r=>r.id)});}
 return {label,emptyCharacterSearchMs:cs,workPicker:results};
}
(async()=>{const before=await run('before '+baseline,original),after=await run('after working source',p=>fs.readFileSync(p,'utf8'));const same=before.workPicker.every((r,i)=>JSON.stringify(r.ids)===JSON.stringify(after.workPicker[i].ids));console.log(JSON.stringify({catalogCount:works.length,scope:'Node CPU/public bundled data only; no network, device or production claim',sameWorkPickerResults:same,before,after},null,2));if(!same)process.exitCode=1;})();
