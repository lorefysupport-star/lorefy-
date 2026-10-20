const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../modules/lorefy-chapter-detail-core.js');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-chapter-detail.js'),'utf8');
test('chapter total reads work metadata rather than the readers changing progress text',()=>{
 for(const metadataText of ['384 فصل','384 chapters']){
  const content={children:[{textContent:'6 فصل مقروء'}],querySelector:selector=>selector==='h1'?{textContent:'Berserk'}:selector==='.lf-work-facts'?{textContent:metadataText}:null,
   closest:()=>({querySelector:()=>null})};
  const scope={core,metadata:{sourceFor:()=>null,catalogFor:()=>null},doc:{querySelector:()=>content},
   global:{location:{search:'?novel=work'}},URLSearchParams,catalogWork:()=>({id:'work',title:'Berserk',ch:384}),readingOwner:()=> 'owner'};
  vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('  function context()'),source.indexOf('  function reviewFor(')),scope);
  assert.equal(scope.context().total,384,metadataText);
 }
});
for(const language of ['ar','en'])test('chapter title presentation preserves real titles and distinguishes missing from loading in '+language,()=>{
 const start=source.indexOf('  function updateChapterTitle('),end=source.indexOf('  function enrichRows(',start);
 assert.ok(start>=0&&end>start,'shared chapter title presentation helper');
 const scope={text:(ar,en)=>language==='en'?en:ar};vm.createContext(scope);vm.runInContext(source.slice(start,end),scope);
 const headline={textContent:'',hidden:false},row={dataset:{},querySelector:()=>headline};
 scope.updateChapterTitle(row,undefined,false);assert.equal(row.dataset.titleState,'missing');assert.equal(headline.hidden,true);assert.equal(headline.textContent,'');
 scope.updateChapterTitle(row,'',true);assert.equal(row.dataset.titleState,'loading');assert.equal(headline.hidden,false);assert.equal(headline.textContent,language==='ar'?'جارٍ تحميل عنوان الفصل…':'Loading chapter title…');
 scope.updateChapterTitle(row,'Romance Dawn',false);assert.equal(row.dataset.titleState,'ready');assert.equal(headline.hidden,false);assert.equal(headline.textContent,'Romance Dawn');
 scope.updateChapterTitle(row,null,false);assert.equal(headline.hidden,true);assert.equal(headline.textContent,'');
});
test('a failed chapter title request retains known titles and leaves unknown rows uncluttered',async()=>{
 const start=source.indexOf('  function updateChapterTitle('),end=source.indexOf('  function enhanceActions(',start);
 const headlines=[{textContent:'Known title',hidden:false},{textContent:'',hidden:false}];
 const rows=headlines.map((headline,i)=>({dataset:{chapter:String(i+1)},querySelector:()=>headline}));
 const section={isConnected:true,dataset:{},querySelectorAll:()=>rows};
 const scope={text:(ar,en)=>en,metadata:{sourceFor:()=>({}),load:()=>Promise.reject(new Error('fixture unavailable'))},global:{fetch:()=>{}},activeWork:'work'};
 vm.createContext(scope);vm.runInContext(source.slice(start,end),scope);
 scope.enrichRows(section,{id:'work',chapterDetails:{1:{title:'Known title'}}},[1,2]);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(headlines[0].textContent,'Known title');assert.equal(headlines[0].hidden,false);
 assert.equal(headlines[1].textContent,'');assert.equal(headlines[1].hidden,true);
});
