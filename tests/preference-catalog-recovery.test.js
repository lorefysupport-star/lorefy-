const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../modules/lorefy-growth-features.js'),'utf8');
const app = fs.readFileSync(require('node:path').join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
test('work preference search filters the full category before paging',()=>{
  const start=app.indexOf('  const pickerCandidates='),end=app.indexOf('\n',start);
  const works=Array.from({length:100},(_,i)=>({id:String(i),type:'Manga',title:'Book '+i,r:5}));
  works.push({id:'wanted',type:'Manga',title:'Rare Work',r:1});
  const ctx={MANGA:works,editingBoard:{type:'Manga'},editingSlotIds:new Set(),editingWorkId:'',pickerQuery:'Rare',pickerLimit:80,
    window:{LorefyCatalogData:{matchesCatalogQuery:(w,q)=>w.title.toLowerCase().includes(q.toLowerCase())}},hasExternalCover:()=>true};
  vm.runInNewContext(app.slice(start,end)+'\nresult=pickerCandidates;',ctx);
  assert.deepEqual(Array.from(ctx.result,w=>w.id),['wanted']);
});
test('search is nested inside discovery rather than a duplicate navigation destination',()=>{
  const start=app.indexOf('Nr=['),end=app.indexOf('],jr=',start);
  assert.ok(start>0 && end>start);
  assert.doesNotMatch(app.slice(start,end),/k:"search"/);
});
test('Arabic title aliases are available to every catalog picker',()=>{
  const data=require('../modules/lorefy-catalog-data.js');
  assert.equal(data.matchesCatalogQuery({id:'hunter',title:'Hunter x Hunter'},'هُنـتر'),true);
});
function scope() {
  const stored = {};
  const work = {id:'hunter',title:'Hunter x Hunter',type:'Manga'};
  const ctx = {CB_CATALOG:{manga:[{id:'gon',name:'غون',latin:'Gon'}]},
    global:{LorefyMangaData:[work],LorefyCharacterCatalog:{hunter:[{id:'kurapika',name:'Kurapika',latin:'Kurapika',image:'correct.jpg'}]}},
    read:(k,fallback)=>stored[k] || fallback,write:(k,v)=>{stored[k]=v;},
    profileTopCharacterSearchText:v=>String(v||'').normalize('NFKD').replace(/[\u064b-\u065f\u0640]/g,'').replace(/[أإآ]/g,'ا').toLowerCase(),
    mlTitleOf:w=>w.title,mlWorks:()=>[work],normalizeType:t=>t};
  vm.runInNewContext(source.slice(source.indexOf('  function cbCatalog('),source.indexOf('  function cbImageWork(')),ctx);
  return ctx;
}
test('preference character picker includes bundled cast beyond the short curated list',()=>{
  const ctx=scope();
  assert.ok(ctx.cbCatalog('manga').some(c=>c.latin==='Kurapika'));
});
test('loading a selected work adds its full remote cast to the category picker',async()=>{
  const ctx=scope();
  ctx.global.LorefyCharacterSystem={loadCast:async()=>Array.from({length:126},(_,i)=>({id:'remote-'+i,name:'Cast '+i,image:'image-'+i+'.jpg'}))};
  assert.equal(typeof ctx.cbLoadWorkCharacters,'function');
  await ctx.cbLoadWorkCharacters({id:'remote',title:'Other manga',type:'Manga'},'manga');
  assert.equal(ctx.cbCatalog('manga').filter(c=>c.workId==='remote').length,126);
});
test('cast search matches aliases rather than only the first display name',()=>{
  const start=source.indexOf('  function clCastText('),end=source.indexOf('  function clLoadCast(',start);
  const ctx={profileTopCharacterSearchText:scope().profileTopCharacterSearchText};
  vm.runInNewContext(source.slice(start,end),ctx);
  assert.equal(ctx.clFilterCast([{name:'Kurapika',latin:'Kurapika',aliases:['كُورابيكا']}],'كورابيكا').length,1);
  assert.equal(ctx.clFilterCast([{name:'Kurapika',latin:'Kurapika'}],'كورابيكا').length,1);
});
test('comic preference portraits never query an anime character provider',async()=>{
  const start=source.indexOf('  function cbFetchImage('),end=source.indexOf('  /* ── embedded',start);
  let requests=0;
  const ctx={global:{LorefyCharacterSystem:{loadImageOptions:async()=>['verified-comic.jpg']}},
    CB_CATALOG:{comics:[{id:'batman'}]},cbImageWork:()=>({type:'Comics',comicPublisher:'DC'}),
    withTimeout:x=>x,growthCatalogUrl:(p,url)=>url,fetch:async()=>{requests++; return {ok:true,json:async()=>({data:[{name:'Wrong anime',images:{jpg:{image_url:'wrong.jpg'}}}]})};}};
  vm.runInNewContext(source.slice(start,end),ctx);
  assert.equal(await ctx.cbFetchImage({id:'batman',name:'باتمان',latin:'Batman',work:'DC'}),'verified-comic.jpg');
  assert.equal(requests,0);
});
test('fallback portraits reject a different character returned by fuzzy search',async()=>{
  const start=source.indexOf('  function cbFetchImage('),end=source.indexOf('  /* ── embedded',start);
  let requests=0;
  const ctx={global:{},CB_CATALOG:{comics:[]},profileTopCharacterSearchText:scope().profileTopCharacterSearchText,
    withTimeout:x=>x,growthCatalogUrl:(p,url)=>url,fetch:async()=>{requests++;return requests===1?{ok:false,status:503}:{ok:true,json:async()=>({data:{Character:{name:{full:'Wrong Character'},image:{large:'wrong.jpg'}}}})};}};
  vm.runInNewContext(source.slice(start,end),ctx);
  assert.equal(await ctx.cbFetchImage({id:'kurapika',latin:'Kurapika'}),'');
});
