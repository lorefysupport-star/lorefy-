const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('modules/lorefy-character-system.js','utf8');
function run(provider,mal=17,fandom=null){
 const scope={dedupeUrls:urls=>[...new Set(urls.filter(Boolean))],fandomImageSource:()=>fandom,characterMalId:()=>mal,jikanCharacterPictures:provider,fandomCharacterPictures:provider,IMAGE_OPTIONS_LIMIT:20};
 const begin=src.indexOf('  function loadImageOptions(');vm.runInNewContext(src.slice(begin,src.indexOf('  var bundledCharacterCatalogPromises',begin)),scope);return scope.loadImageOptions;
}
test('explicit provider errors propagate to the interactive picker without breaking seed fallback callers',async()=>{
 const load=run(()=>Promise.reject(Error('offline'))),character={image:'https://source/verified.jpg'};
 await assert.rejects(load(character,{}, {reportErrors:true}),/offline/);
 assert.deepEqual(Array.from(await load(character,{})),[character.image]);
});
test('strict empty result remains empty rather than a network failure',async()=>{
 const load=run(()=>Promise.resolve([]));assert.deepEqual(Array.from(await load({}, {},{reportErrors:true})),[]);
});
test('Fandom errors also reach the interactive picker without changing legacy fallback',async()=>{
 const load=run(()=>Promise.reject(Error('fandom offline')),0,{api:'https://fixture.fandom.com/api.php'});
 await assert.rejects(load({}, {},{reportErrors:true}),/fandom offline/);assert.deepEqual(Array.from(await load({},{})),[]);
});

function fandomRun(fail){
 const scope={URLSearchParams,asArray:value=>Array.isArray(value)?value:[],dedupeUrls:urls=>[...new Set(urls)],safeFandomImageTitle:()=>true,
  fandomDirectPage:async()=>({pageid:7,title:'Fixture Hero',thumbnail:{source:'https://source/seed.jpg'}}),fandomSearchPage:async()=>null,
  fandomFetchJson:async(api,params)=>{if(params.get('prop')===fail)throw Error('gallery offline');return {query:{pages:{7:{images:[{title:'File:Fixture Hero.jpg'}]}}}};}};
 const begin=src.indexOf('  function fandomCharacterPictures(');vm.runInNewContext(src.slice(begin,src.indexOf('  function mapWithConcurrency(',begin)),scope);return scope.fandomCharacterPictures;
}
for(const stage of ['images','imageinfo'])test(`Fandom ${stage} failure is recoverable in strict mode, while automatic hydration retains its seed`,async()=>{
 const load=fandomRun(stage),character={name:'Fixture Hero'};
 await assert.rejects(load('https://fixture.fandom.com/api.php',character,{reportErrors:true}),/gallery offline/);
 assert.deepEqual(Array.from(await load('https://fixture.fandom.com/api.php',character)),['https://source/seed.jpg']);
});

test('interactive image options forward strict error reporting into Fandom gallery requests',async()=>{
 let received;const load=run((api,c,options)=>{received=options;return Promise.resolve([]);},0,{api:'https://fixture.fandom.com/api.php'});
 await load({}, {},{reportErrors:true});assert.equal(received?.reportErrors,true);
});
