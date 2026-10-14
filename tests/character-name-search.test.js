const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(characterCount=1){
 const values=new Map([['lorefy.user.profileTopCharacters.v1','unchanged']]);let requests=0,writes=0;
 const work={id:'mal-manga-26-hunter-x-hunter',title:'Hunter x Hunter',type:'مانجا'};
 const window={localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>{writes++;values.set(k,v)}},LorefyDataProxy:{catalogUrl:()=> 'https://example.com/public-data'},LorefyMangaData:[work]};
 const fetch=async()=>{requests++;return {ok:true,json:async()=>({data:{Page:{characters:Array.from({length:characterCount},(_,index)=>({id:27+index,name:{full:'Killua Zoldyck',native:'キルア',alternative:['Kill']},image:{large:'https://example.com/killua.jpg'},media:{nodes:[{id:30026,idMal:26,title:{english:'Hunter x Hunter',romaji:'HUNTER×HUNTER'}}]}}))}}})}};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-character-system.js','utf8'),{window,fetch,setTimeout,clearTimeout,URL,console});
 return {api:window.LorefyCharacterSystem,work,values,requests:()=>requests,writes:()=>writes};
}
test('character-name search returns verified work-scoped characters through the shared cache without editing favorites',async()=>{
 const h=setup(),rows=await h.api.searchCharacters('Killua',[h.work]);
 assert.equal(rows.length,1);assert.equal(rows[0].workId,h.work.id);assert.equal(rows[0].cast.find(c=>c.latin==='Killua Zoldyck').image,'https://example.com/killua.jpg');
 assert.ok(h.api.cachedCharacterMatches('Killua',[h.work]).length);
 assert.equal(h.values.get('lorefy.user.profileTopCharacters.v1'),'unchanged');
 await h.api.searchCharacters('Killua',[h.work]);assert.equal(h.requests(),1);
 assert.equal(h.api.cachedCharacterMatches('Killua',[]).length,0);
});
test('empty or short queries do not make a remote request',async()=>{const h=setup();assert.equal((await h.api.searchCharacters('K',[h.work])).length,0);assert.equal(h.requests(),0);});
test('all editable inputs have a shared iOS-safe font rule without locking user zoom',()=>{
 const css=fs.readFileSync('styles/lorefy-design-system.css','utf8');assert.match(css,/html:root:root:root:root:root :is\(input[^\n]+font-size:16px!important/);
 const html=fs.readFileSync('index.html','utf8');assert.doesNotMatch(html,/user-scalable=no|maximum-scale=1(?:[",; ])/);
});

test('a broad character response batches its shared cache write instead of serializing per character',async()=>{const h=setup(50);const rows=await h.api.searchCharacters('Killua',[h.work]);assert.equal(rows.length,1);assert.equal(h.writes(),1);assert.equal(h.values.get('lorefy.user.profileTopCharacters.v1'),'unchanged');});
