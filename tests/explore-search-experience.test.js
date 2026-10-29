const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const core=require('../modules/lorefy-explore-studio.js');
const memory=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),keys:()=>[...m.keys()]};};
test('search relevance prefers exact title, aliases and title prefixes over popularity and authors',()=>{
 const rows=[{id:'author',title:'Other',auth:'Berserk',pop:9999},{id:'prefix',title:'Berserk Guide',pop:200},{id:'exact',title:'Berserk',pop:1},{id:'alias',title:'Other edition',altTitles:['Berserk'],pop:100}];
 const before=JSON.stringify(rows);assert.deepEqual(core.rankSearchResults(rows,'Berserk').map(w=>w.id),['exact','alias','prefix','author']);assert.equal(JSON.stringify(rows),before);
});
test('search relevance normalizes Arabic diacritics, matching keeps distinct source IDs',()=>{
 const rows=[{id:'a',title:'أَحْلَام',pop:1},{id:'b',title:'احلام',pop:2},{id:'c',title:'احلام أخرى',pop:10}];
 assert.deepEqual(core.rankSearchResults(rows,'أحلام').map(w=>w.id),['b','a','c']);
});
test('search distinguishes idle, short, loading, partial failure and true empty states',()=>{
 const phase=core.searchPhase;
 assert.equal(phase('',0,false,false),'idle');assert.equal(phase('@f',0,false,false),'short');
 assert.equal(phase('Dune',0,true,false),'loading');assert.equal(phase('Dune',3,true,false),'updating');
 assert.equal(phase('Dune',0,false,true),'error');assert.equal(phase('Dune',3,false,true),'partial');
 assert.equal(phase('Dune',0,false,false),'empty');assert.equal(phase('Dune',3,false,false),'ready');
});
test('recent search is account-scoped, bounded and deduplicated by query, mode and format',()=>{
 const s=memory();for(let i=0;i<12;i++)core.saveSearchHistory(s,'alice',{q:'Work '+i,mode:'media',format:'Manga'},1000+i);
 assert.equal(core.readSearchHistory(s,'alice',1020).length,8);assert.equal(core.readSearchHistory(s,'bob',1020).length,0);
 core.saveSearchHistory(s,'alice',{q:'work 11',mode:'media',format:'Manga'},1021);
 assert.equal(core.readSearchHistory(s,'alice',1022).filter(x=>x.q.toLowerCase()==='work 11').length,1);
 core.saveSearchHistory(s,'alice',{q:'work 11',mode:'people'},1023);assert.equal(core.readSearchHistory(s,'alice',1024).filter(x=>x.q.toLowerCase()==='work 11').length,2);
 core.clearSearchHistory(s,'alice');assert.deepEqual(core.readSearchHistory(s,'alice',1025),[]);
});
test('recent search ignores invalid, expired and storage-failure entries',()=>{
 const s=memory();core.saveSearchHistory(s,'a',{q:'x',mode:'media'},1000);assert.deepEqual(core.readSearchHistory(s,'a',1001),[]);
 core.saveSearchHistory(s,'a',{q:'Dune',mode:'media'},1000);assert.deepEqual(core.readSearchHistory(s,'a',1000+31*86400000),[]);
 const broken={getItem(){throw Error('disabled')},setItem(){throw Error('full')},removeItem(){throw Error('disabled')}};
 assert.deepEqual(core.readSearchHistory(broken,'a'),[]);assert.doesNotThrow(()=>core.saveSearchHistory(broken,'a',{q:'Dune',mode:'media'}));assert.doesNotThrow(()=>core.clearSearchHistory(broken,'a'));
});
test('type and search redesign keep local history private and render nonblank idle states',()=>{
 const src=fs.readFileSync('modules/lorefy-explore-studio.js','utf8');
 assert.match(src,/root\.sessionStorage/);assert.match(src,/lf-explore-search-idle/);assert.match(src,/lf-explore-recent/);
 assert.match(src,/lf-explore-category-art/);assert.match(src,/lf-explore-search-filter/);assert.match(src,/lf-explore-search-clear/);
 assert.match(src,/searchMode!=='media'/);assert.match(src,/rankSearchResults\(/);
});
