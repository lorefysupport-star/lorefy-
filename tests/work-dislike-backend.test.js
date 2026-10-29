const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(){
 const values=new Map([['lorefy.activeUser.v1','owner']]),calls=[];
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const window={localStorage:storage};vm.runInNewContext(fs.readFileSync('backend/lorefy-backend.js','utf8'),{window,localStorage:storage,URL,console,setTimeout,clearTimeout});
 const api=window.LorefyBackend;let result={count:734,data:null,error:null},gate=null;
 const client={from:table=>{calls.push(['from',table]);const q={then:(a,b)=>Promise.resolve(gate?gate():result).then(a,b)};for(const key of ['select','eq'])q[key]=(...args)=>{calls.push([key,...args]);return q;};return q;}};
 Object.assign(api,{mode:'live',user:{id:'owner'},client,_communityEpoch:1});
 return {api,values,calls,setResult:r=>result=r,setGate:g=>gate=g};
}
test('work count uses exact public zero-dislike HEAD metadata, not a paged review feed',async()=>{
 const h=harness();assert.equal(typeof h.api.countWorkDislikes,'function');assert.equal(await h.api.countWorkDislikes('work'),734);
 assert.deepEqual(JSON.parse(JSON.stringify(h.calls)),[['from','reviews'],['select','id',{count:'exact',head:true}],['eq','work_id','work'],['eq','is_public',true],['eq','rating',0],['eq','recommend',false]]);
});
for(const kind of ['account','client','epoch','local-owner','mode'])test('late count rejected after '+kind,async()=>{
 const h=harness();assert.equal(typeof h.api.countWorkDislikes,'function');let finish;h.setGate(()=>new Promise(r=>finish=r));
 const pending=h.api.countWorkDislikes('work');
 await new Promise(r=>setImmediate(r));
 if(kind==='account')h.api.user={id:'other'};if(kind==='client')h.api.client={};if(kind==='epoch')h.api._communityEpoch++;
 if(kind==='local-owner')h.values.set('lorefy.activeUser.v1','other');if(kind==='mode')h.api.mode='demo';
 finish({count:12,error:null});await assert.rejects(pending,e=>e.code==='LOREFY_SESSION_INVALID');
});
test('missing count or transport failure cannot masquerade as zero dislikes',async()=>{
 const h=harness();assert.equal(typeof h.api.countWorkDislikes,'function');h.setResult({count:null,error:null});await assert.rejects(h.api.countWorkDislikes('work'),/count/i);
 h.setResult({error:Error('offline')});await assert.rejects(h.api.countWorkDislikes('work'),/offline/);
 h.setResult({count:0,error:null});assert.equal(await h.api.countWorkDislikes('work'),0);
});
test('invalid work references fail before querying and demo never queries production',async()=>{
 const h=harness();assert.equal(typeof h.api.countWorkDislikes,'function');for(const id of ['',null,' '.repeat(4),'x'.repeat(201)])await assert.rejects(h.api.countWorkDislikes(id));assert.equal(h.calls.length,0);
 h.api.mode='demo';assert.equal(await h.api.countWorkDislikes('work'),null);assert.equal(h.calls.length,0);
});
test('the existing publishing RPC preserves a deliberate zero and false recommendation',async()=>{
 const h=harness();let payload;
 h.api._requireAvailable=()=>{};h.api.getSession=async()=>({userId:'owner'});h.api._hydrateReview=async row=>row;
 h.api.client.rpc=async(name,args)=>{assert.equal(name,'publish_review');payload=args;return {data:{id:'saved',rating:args.review_rating,recommend:args.review_recommend},error:null};};
 const row=await h.api.publishReview({workId:'work',rating:0,recommend:false,body:'',images:[]});
 assert.equal(row.rating,0);assert.equal(row.recommend,false);assert.equal(payload.review_rating,0);assert.equal(payload.review_recommend,false);
});
