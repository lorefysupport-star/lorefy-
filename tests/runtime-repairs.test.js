const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function extract(source,begin,end,scope){const start=source.indexOf(begin),finish=source.indexOf(end,start);assert(start>=0&&finish>start);vm.runInNewContext(source.slice(start,finish),scope);}
const key='lorefy.user.library.v2',theme='lorefy.ui.theme.v1';
function syncHarness({base={[key]:'old',[theme]:'dark'},local={[key]:'new',[theme]:'dark'},remote=base,pending={[key]:'new'},serverVersion=1,onRpc,offline=false}={}){
  let owner='qa',version=serverVersion,cloud={...remote},journal={...pending},values={...local},calls=[],events=[];
  const scope={ACTIVE_USER_KEY:'owner',readLS:k=>k==='owner'?owner:values[k]??null,gather:()=>({...values}),accountStateKeys:()=>[...new Set([...Object.keys(base),...Object.keys(values),...Object.keys(cloud)])],
    localStorage:{setItem:(k,v)=>values[k]=v,removeItem:k=>delete values[k]},readPendingState:()=>({...journal}),clearPendingState:(keys,snapshot)=>keys.forEach(k=>{if(journal[k]===snapshot[k])delete journal[k]}),writeStateBase(){},console:{warn(){}},global:{CustomEvent:function(type,init){this.type=type;this.detail=init.detail;},dispatchEvent:e=>events.push(e)}};
  const source=read('backend/lorefy-backend.js');vm.runInNewContext('var B={'+source.slice(source.indexOf('    _pushState:'),source.indexOf('    saveProfile:'))+'};',scope);
  Object.assign(scope.B,{mode:'live',_pullGeneration:1,_stateVersion:1,_stateBase:{...base},getSession:async()=>({userId:'qa'}),client:{
    rpc:async(_,args)=>{calls.push({...args});if(onRpc)await onRpc({edit:(k,v)=>{values[k]=v;journal[k]=v;},switchOwner:()=>owner='other',api:scope.B});if(offline)return{error:{message:'offline'}};if(args.expected_version!==version)return{error:{message:'state_conflict'}};Object.assign(cloud,args.state_patch);args.removed_keys.forEach(k=>delete cloud[k]);return{data:[{state_data:{...cloud},state_version:++version}]};},
    from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{data:{...cloud},version}})})})})}});
  return{api:scope.B,calls,events,cloud,values,journal,edit:(k,v)=>{values[k]=v;journal[k]=v;}};
}
test('identical remote edits reconcile and clear the acknowledged journal',async()=>{const h=syncHarness({remote:{[key]:'new',[theme]:'dark'},serverVersion:2});assert.equal(await h.api._pushState(),true);assert.equal(h.calls.length,2);assert.deepEqual(h.journal,{});assert.equal(h.api._syncStatus,'synced');});
test('unrelated remote theme survives the current and a subsequent library push',async()=>{const h=syncHarness({remote:{[key]:'old',[theme]:'light'},serverVersion:2});await h.api._pushState();assert.equal(h.values[theme],'light');h.edit(key,'newer');await h.api._pushState();assert.equal(h.cloud[theme],'light');assert.equal(h.cloud[key],'newer');assert(h.events.some(e=>e.type==='lorefy:stored-state'&&e.detail.key===theme));});
test('a genuine overlap preserves both copies and exposes conflict status',async()=>{const h=syncHarness({remote:{[key]:'other-device',[theme]:'dark'},serverVersion:2});await assert.rejects(h.api._pushState(),e=>e.code==='LOREFY_STATE_CONFLICT');assert.equal(h.values[key],'new');assert.equal(h.cloud[key],'other-device');assert.equal(h.journal[key],'new');assert.equal(h.api._syncStatus,'conflict');});
test('offline changes stay pending and a successful retry clears the warning',async()=>{const h=syncHarness({offline:true});await assert.rejects(h.api._pushState());assert.equal(h.journal[key],'new');assert.equal(h.api._syncStatus,'pending');});
test('an edit during the request cannot be replaced or cleared by its acknowledgement',async()=>{const h=syncHarness({remote:{[key]:'old',[theme]:'light'},serverVersion:2,onRpc:({edit})=>edit(theme,'pink')});await h.api._pushState();assert.equal(h.values[theme],'pink');assert.equal(h.journal[theme],'pink');});
test('remote removal of an untouched key is adopted without becoming a local deletion edit',async()=>{const h=syncHarness({remote:{[key]:'old'},serverVersion:2});await h.api._pushState();assert.equal(h.values[theme],undefined);assert.equal(h.journal[theme],undefined);});
test('account switch cannot publish a warning or acknowledge the new account',async()=>{const h=syncHarness({onRpc:({switchOwner})=>switchOwner()});assert.equal(await h.api._pushState(),false);assert.equal(h.journal[key],'new');assert.equal(h.events.filter(e=>e.detail.status==='synced').length,0);});

function importScope(){const scope={IM_DONE:'done',IM_READING:'reading',IM_PAUSED:'paused',IM_DROPPED:'dropped',IM_WISH:'wish',imFindByTitle:t=>({id:'qa',title:t})};const s=read('modules/lorefy-growth-features.js');extract(s,'  function imParseCsvLine(','  function imParseGoodreads(',scope);extract(s,'  function imStatusWord(','  function imFetchKitsu(',scope);return scope;}
for(const [input,expected] of [[0,0],[1,1],[2.25,2.25],[3.5,3.5],[4.25,4.25],[4.75,4.75],[5,5],[9,4.5],[-2,0],['bad',0]])test('CSV rating keeps its scale and quarter precision: '+input,()=>assert.equal(importScope().imParseGenericCsv('Title,Status,Rating\nQA,reading,'+input,'reading').rows[0].score,expected));
test('import emits store changes immediately and leaves preexisting entries intact',()=>{const values={'lorefy.user.library.v2':{old:'paused'},'lorefy.user.progress.v2':{old:{chapter:8}},'lorefy.user.privateReviews.v2':[]},events=[];const scope={read:(k,f)=>values[k]||f,write:(k,v)=>values[k]=v,global:{CustomEvent:function(t,i){this.detail=i.detail;},dispatchEvent:e=>events.push(e.detail.key)}};extract(read('modules/lorefy-growth-features.js'),'  function imApply(','  function imStatusFromAL(',scope);scope.imApply([{work:{id:'old'},status:'done',score:5,chapters:40},{work:{id:'new'},status:'reading',score:4.75,chapters:4}]);assert.equal(values['lorefy.user.library.v2'].old,'paused');assert.equal(values['lorefy.user.progress.v2'].old.chapter,8);assert.equal(values['lorefy.user.privateReviews.v2'][0].r,4.75);assert.equal(events.length,3);});

test('native text export writes UTF-8 in cache and shares the exact saved file',async()=>{const calls=[];const scope={doc:{documentElement:{lang:'ar'}},global:{Capacitor:{isNativePlatform:()=>true,Plugins:{Filesystem:{writeFile:async options=>{calls.push(options);return{uri:'file://cache/export.json'}}},Share:{share:async options=>calls.push(options)}}}}};extract(read('modules/lorefy-product-tools.js'),'  async function downloadFile(','  async function runExport(',scope);await scope.downloadFile('lorefy-data.json','{"title":"كتاب"}','application/json');assert.equal(calls[0].encoding,'utf8');assert.equal(calls[0].directory,'CACHE');assert.equal(calls[0].data,'{"title":"كتاب"}');assert.equal(calls[1].files[0],'file://cache/export.json');});
test('native write failures never open the share sheet',async()=>{let shares=0;const scope={global:{Capacitor:{isNativePlatform:()=>true,Plugins:{Filesystem:{writeFile:async()=>{throw Error('disk full')}},Share:{share:async()=>shares++}}}}};extract(read('modules/lorefy-product-tools.js'),'  async function downloadFile(','  async function runExport(',scope);await assert.rejects(scope.downloadFile('x','data'),/disk full/);assert.equal(shares,0);});
test('failed export restores its button and does not announce success',async()=>{const notices=[],control={disabled:false,setAttribute(){},removeAttribute(){}};const scope={doc:{documentElement:{lang:'en'}},toast:v=>notices.push(v)};extract(read('modules/lorefy-product-tools.js'),'  async function runExport(','  function csvCell(',scope);await scope.runExport({currentTarget:control},async()=>{throw Error('broken')},'success');assert.equal(control.disabled,false);assert.deepEqual(notices,['Unable to export. Please try again.']);});
test('saved checkpoints stay authoritative after the newer LF-002 reading contract',()=>{const core=require('../modules/lorefy-chapter-detail-core.js');const progress={chapter:0,note:'keep'};assert.equal(core.nextUnread(progress,384,true),1);assert.deepEqual(progress,{chapter:0,note:'keep'});assert.equal(core.nextUnread(progress,384,false),1);});
test('all installed and locked platform dependencies use the patched exact native version',()=>{const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));assert.equal(pkg.dependencies['@capacitor/core'],'8.4.3');for(const[k,v]of Object.entries(lock.packages))if(/@capacitor\/(core|ios|android|cli)$/.test(k))assert.equal(v.version,'8.4.3',k);assert.match(read('ios/App/CapApp-SPM/Package.swift'),/exact: "8\.4\.3"/);});
test('selected synopsis enrichment requires exact work identity and preserves progress and ratings',()=>{
  const editorial=require('../uploads/lorefy-editorial-picks.js');
  const work={id:'n-1984',title:'Nineteen Eighty-Four',auth:'George Orwell',ch:0,r:0},other={id:'n-1984',title:'Unrelated title',auth:'Another writer',r:4};
  editorial.apply([work,other]);assert(work.synopsisEn&&work.synopsisAr);assert.match(work.synopsisAttribution.url,/penguinrandomhouse/);assert.equal(other.synopsisEn,undefined);assert.equal(work.ch,0);assert.equal(work.r,0);
});
test('editorial summaries survive compact native catalog generation with attribution',()=>{
  const {compactRecord}=require('../tools/build-runtime-catalog.js'),editorial=require('../uploads/lorefy-editorial-picks.js');const work=editorial.picks.find(w=>w.id==='n-pride-and-prejudice');const compact=compactRecord(work,{workGenreKeys:()=>[],normTasteKey:x=>x});assert.equal(compact.synopsisAr,work.synopsisAr);assert.equal(compact.synopsisAttribution.method,'editorial-paraphrase');
});
test('MAL XML score 9 converts to 4.5 without rounding to five stars',()=>{
  const fields={manga_mangadb_id:'2',manga_title:'QA',my_status:'Completed',my_read_chapters:'38',my_score:'9'};
  const item={querySelector:k=>fields[k]===undefined?null:{textContent:fields[k]}};
  const scope={IM_READING:'reading',IM_DONE:'done',IM_WISH:'wish',IM_DROPPED:'dropped',IM_PAUSED:'paused',imBuildMaps:()=>({byMal:new Map([['2',{id:'qa'}]])}),DOMParser:function(){this.parseFromString=()=>({querySelectorAll:()=>[item]});}};
  extract(read('modules/lorefy-growth-features.js'),'  function imParseMalXml(','  function imParseCsvLine(',scope);
  const row=scope.imParseMalXml('<fixture/>').rows[0];assert.equal(row.score,4.5);assert.equal(row.chapters,38);
});
test('AniList ten-point fractional score retains quarter stars',async()=>{
 const scope={imBuildMaps:()=>({byMal:new Map([['2',{id:'qa'}]])}),imStatusFromAL:()=> 'done',growthCatalogUrl:()=> 'https://qa.invalid',withTimeout:p=>p,fetch:async()=>({json:async()=>({data:{MediaListCollection:{lists:[{entries:[{status:'COMPLETED',score:9.5,progress:38,media:{idMal:2}}]}]}}})})};
 extract(read('modules/lorefy-growth-features.js'),'  function imFetchAniList(','  function imParseMalXml(',scope);assert.equal((await scope.imFetchAniList('qa')).rows[0].score,4.75);
});
test('Kitsu twenty-point score retains quarter stars',async()=>{
 let calls=0;const scope={IM_READING:'reading',IM_DONE:'done',IM_WISH:'wish',IM_DROPPED:'dropped',IM_PAUSED:'paused',imFindByTitle:()=>({id:'qa'}),withTimeout:p=>p,fetch:async()=>({ok:true,json:async()=>++calls===1?{data:[{id:'qa'}]}:{data:[{attributes:{status:'completed',ratingTwenty:17,progress:38},relationships:{manga:{data:{type:'manga',id:'2'}}}}],included:[{type:'manga',id:'2',attributes:{canonicalTitle:'QA'}}]}})};
 extract(read('modules/lorefy-growth-features.js'),'  function imFetchKitsu(','  function imReadFileText(',scope);assert.equal((await scope.imFetchKitsu('qa')).rows[0].score,4.25);
});
test('library CSV exports current and legacy progress fields including pages and escaped notes',()=>{
  const lib={one:'تم القراءة',two:'أقرأ حالياً'},prog={one:{chapter:384,volume:42,page:15,note:'=SUM(1,2)'},two:{ch:4,vol:2}},scope={safeRead:(k)=>k==='lorefy.user.library.v2'?lib:prog,global:{LorefyMangaData:[{id:'one',title:'Berserk',type:'Manga'},{id:'two',title:'QA',type:'Book'}]},downloadFile:(_name,csv)=>csv};
  extract(read('modules/lorefy-product-tools.js'),'  function csvCell(','  function allLists(',scope);
  const csv=scope.exportLibraryCsv();assert(csv.includes('"384","42","15"'));assert(csv.includes('"4","2","0"'));assert(csv.includes('"\'=SUM(1,2)"'));
});
test('new reading-only profile metrics hide singular and plural review shortcuts',()=>{
  for(const label of ['مراجعة','Review','Reviews']){
    let hidden=false;const row={getAttribute:()=>null,querySelectorAll:()=>[{textContent:label}],classList:{toggle:(_name,value)=>hidden=value}},metrics={children:[row],classList:{add(){}},style:{getPropertyValue:()=>'',setProperty(){}}},scope={};
    extract(read('modules/lorefy-profile-sections.js'),'  function compactMetrics(','  function sync()',scope);scope.compactMetrics({querySelectorAll:()=>[metrics]});assert.equal(hidden,true,label);
  }
});
