const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(){
 const source=fs.readFileSync('modules/lorefy-api-catalog.js','utf8'),start=source.indexOf('  function search(query, type, options)'),end=source.indexOf('  function fetchExpandedPage',start),calls=[];
 let active=0,max=0,current=true;
 const scope={Promise,Object,String,normalizeSpaces:s=>s.trim(),TYPES:{manga:'Manga',manhwa:'Manhwa',manhua:'Manhua',novel:'Novel',book:'Book',lightNovel:'Light Novel',webNovel:'Web Novel',comics:'Comics'},uniqueWorks:rows=>rows,
 runProviders:async(kind,q,type)=>{calls.push(type);active++;max=Math.max(max,active);await Promise.resolve();active--;return {works:[{id:type,type}],providers:['test'],providerErrors:[]};}};
 vm.runInNewContext(source.slice(start,end)+'\nthis.search=search;',scope);
 return {search:scope.search,calls,max:()=>max,current:()=>current,cancel:()=>current=false};
}
test('main online search reaches all format families with at most two active jobs',async()=>{
 const h=harness(),result=await h.search('Golden son','All');assert.equal(new Set(h.calls).size,6);assert.equal(result.works.length,6);assert.equal(h.max(),2);
});
test('changing query cancels format jobs that have not started',async()=>{
 const h=harness(),pending=h.search('Golden son','All',{isCurrent:h.current});h.cancel();await pending;assert.equal(h.calls.length,2);
});
test('a selected format stays scoped and short queries never call providers',async()=>{
 const h=harness();await h.search('G','All');assert.equal(h.calls.length,0);await h.search('Golden son','Novel');assert.deepEqual(h.calls,['Novel']);
});

test('general book results use source categories instead of the requested tab',()=>{
 const source=fs.readFileSync('modules/lorefy-api-catalog.js','utf8'),start=source.indexOf('  function generalBookType'),end=source.indexOf('  function mapOpenLibrary',start);
 const scope={TYPES:{novel:'Novel',book:'Book',comics:'Comics',lightNovel:'Light Novel',webNovel:'Web Novel'}};vm.runInNewContext(source.slice(start,end),scope);
 for(const [subjects,type]of [[['Science fiction'],'Novel'],[['Nonfiction'],'Book'],[['Comics'],'Comics'],[['Light novels'],'Light Novel'],[['Web fiction'],'Web Novel']])assert.equal(scope.generalBookType(subjects),type);
});
