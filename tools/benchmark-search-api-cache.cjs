const fs=require('node:fs'),vm=require('node:vm'),{performance}=require('node:perf_hooks');
const {execFileSync}=require('node:child_process');
const baseline=process.argv[2]||'6781dcf';
if(!/^[\w./-]+$/.test(baseline))throw Error('Invalid baseline revision');
const sources=[['before',execFileSync('git',['show',baseline+':modules/lorefy-api-catalog.js'],{encoding:'utf8'})],['after',fs.readFileSync('modules/lorefy-api-catalog.js','utf8')]];
const works=Array.from({length:180},(_,i)=>({id:'ol-OL'+i+'W',title:'Fixture '+i,ar:'Fixture '+i,type:'كتاب',synopsis:'x'.repeat(2200),genres:['Science'],_apiSource:'Open Library'}));
const raw=JSON.stringify({works,batches:{}});
for(const [label,source] of sources){
 const runs=[];let parses=0,serializations=0;
 for(let n=0;n<7;n++){
 const window={document:{readyState:'loading',addEventListener(){}},location:{hostname:'lorefy.app',search:''},localStorage:{getItem:key=>key.includes('.cache.')?raw:null},LOREFY_REMOTE_CATALOG:{},setTimeout,clearTimeout};
 const JSONProbe={parse:v=>{if(v.includes('"works"'))parses++;return JSON.parse(v);},stringify:v=>{serializations++;return JSON.stringify(v);}};
 vm.runInNewContext(source,{window,JSON:JSONProbe,URL,URLSearchParams});
 const start=performance.now();for(let i=0;i<100;i++)window.LorefyApiCatalog.state();runs.push(performance.now()-start);
 }
 runs.sort((a,b)=>a-b);console.log(JSON.stringify({source:label,cacheChars:raw.length,checksPerRun:100,runs:7,medianMs:+runs[3].toFixed(2),cacheParsesPerRun:parses/7,serializationsPerRun:serializations/7}));
}
