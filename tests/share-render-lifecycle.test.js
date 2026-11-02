const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('modules/lorefy-share-composer.js','utf8'),start=source.indexOf('  async function render(request){'),end=source.indexOf('  function changed(){',start);
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};}
function harness(stage){
 const gate=deferred(),calls={loads:0,images:0,canvases:0,draws:0,encodes:0,files:0,locks:0},plan={width:1080,height:1350},loaded={plan};let alive=true;
 const scope={job:1,root:{document:{fonts:{ready:stage==='fonts'?gate.promise:Promise.resolve()},createElement(){calls.canvases++;return{getContext:()=>({scale(){}}),toBlob(cb){calls.encodes++;cb({});},toDataURL(){return'preview';}};}},File:function(){calls.files++;},URL:{createObjectURL:()=> 'blob:preview',revokeObjectURL(){}}},
  current:()=>alive,closeEditor(){alive=false;},loadPage:async()=>{calls.loads++;return stage==='page'?gate.promise:loaded;},model:{kind:'list',profile:{avatar:stage==='avatar'?'avatar':''}},s:{showProfile:true},page:0,palette:()=>({}),theme:()=>({}),image:async()=>{calls.images++;return gate.promise;},draw(){calls.draws++;},en:true,preview:{style:{}},status:{},retry:{},thumbs:[],settings:s=>s,pageCount:()=>1,lock(){calls.locks++;},file:null,url:null};
 vm.runInNewContext(source.slice(start,end),scope);
 return{scope,calls,gate,loaded,close(){alive=false;}};
}
async function flush(){for(let i=0;i<8;i++)await Promise.resolve();}
for(const reason of ['close','supersede'])for(const stage of ['fonts','page','avatar'])test(reason+' during '+stage+' wait cannot start stale export work',async()=>{
 const h=harness(stage),job=h.scope.render(1);await flush();const before={...h.calls};
 if(reason==='close')h.close();else h.scope.job++;
 h.gate.resolve(h.loaded);await job;
 assert.equal(h.calls.loads,before.loads,'no obsolete image page loads');assert.equal(h.calls.canvases,0,'no obsolete canvas allocation');assert.equal(h.calls.draws,0,'no obsolete draw');assert.equal(h.calls.encodes,0,'no obsolete PNG encoding');assert.equal(h.calls.files,0);assert.equal(h.calls.locks,0);
});
test('current export still draws, encodes and unlocks a file',async()=>{
 const h=harness('ready');await h.scope.render(1);assert.equal(h.calls.draws,1);assert.equal(h.calls.encodes,1);assert.equal(h.calls.files,1);assert.equal(h.calls.locks,1);assert.equal(h.scope.preview.src,'blob:preview');
});
for(const valid of [false,true])test('async source resolution respects request validity '+valid,async()=>{
 const gate=deferred(),calls=[],context={current:()=>true,input:{resolveImage:()=>gate.promise},cache:new Map(),root:{LorefyShareStudio:{loadImage:async src=>{calls.push(src);return{};}}}};
 const imageStart=source.indexOf('  async function image(');vm.runInNewContext(source.slice(imageStart,start),context);let latest=true;
 const result=context.image('',{},()=>latest);latest=valid;gate.resolve('resolved-image');await result;assert.equal(calls.length,valid?1:0);
});
