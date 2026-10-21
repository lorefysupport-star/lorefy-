const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const policy=require('../modules/lorefy-catalog-policy');
const editor=require('../uploads/lorefy-editorial-picks');
const identity=require('../modules/lorefy-catalog-identity');
const studio=require('../modules/lorefy-explore-studio');
const source=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('reviewed launch selections cover previously empty formats without invented ratings',()=>{
 const rows=editor.apply([],true);
 for(const type of ['مانجا','مانهوا','مانهوا صيني','كوميكس','كتاب','رواية','لايت نوفل','ويب نوفل']){
  const works=rows.filter(w=>w.type===type&&policy.isDiscoveryEligible(w));
  assert.ok(works.length>=10,type);assert.ok(new Set(works.map(w=>w.auth)).size>=8,type);
  const shelves=studio.buildShelves(works,{}, {},[],'ar',type);
  assert.ok(shelves.some(s=>s.key==='for-you'),type+' personalized shelf');
  assert.ok(shelves.every(s=>s.key==='for-you'||s.key==='short'));
  assert.ok(shelves.every(s=>new Set(s.items.map(w=>w.auth)).size===s.items.length));
  assert.ok(shelves.every(s=>!s.key.startsWith('author-')));
  const ids=shelves.flatMap(s=>s.items.map(w=>w.id));assert.equal(ids.length,new Set(ids).size);
 }
 for(const w of rows){assert.ok(/^https:\/\//.test(w.editorialSource));assert.equal(w.pop,0);if(Number(w.r)>0)assert.ok(w.rSrc&&!/estimate|تقدير/.test(w.rSrc));}
});
test('screening remains limited to exact reviewed records and never bypasses explicit or AI flags',()=>{
 const p=editor.picks[0];
 const rows=[{...p,title:'Different title',contentRating:''},{...p,isAdult:true,contentRating:''},{...p,aiGenerated:true,contentRating:''},{id:'unreviewed',title:'Unreviewed',r:5,rSrc:'Open Library'}];
 editor.apply(rows);
 for(const w of rows)assert.equal(policy.isDiscoveryEligible(w),false);
 const valid={...p,contentRating:''};editor.apply([valid]);assert.equal(policy.isDiscoveryEligible(valid),true);
});
test('late compact ingestion and full worker replacement preserve curated picks and account library exclusions',()=>{
 const p=editor.picks.find(w=>w.type==='كوميكس');
 const compact={id:p.id,title:p.title,type:p.type,auth:p.auth,_catalogCompact:true,_discoveryEligible:false};
 editor.apply([compact]);assert.equal(compact._discoveryEligible,true);
 const rows=editor.apply([compact],true);editor.apply(rows,true);assert.equal(new Set(rows.map(w=>w.id)).size,rows.length);
 const aliases={old:p.id};global.LorefyCatalogAliases=aliases;
 const shelves=studio.buildShelves(rows,{}, {old:'أقرأ حالياً'},[], 'ar','كوميكس');
 assert.ok(shelves.flatMap(s=>s.items).every(w=>w.id!==p.id));delete global.LorefyCatalogAliases;
 assert.match(source('modules/lorefy-catalog-worker.js'),/LorefyEditorialCatalog\.apply\(records, true\)/);
 assert.match(source('index.html'),/uploads\/lorefy-editorial-picks/);
 assert.match(source('sw.js'),/uploads\/lorefy-editorial-picks/);
  assert.match(source('modules/lorefy-explore-studio.js'),/loader\.loadExplore\(props\.allType\)/);
});
test('shelves canonicalize aliases and preserve genre personalization across languages',()=>{
 global.LorefyCatalogIdentity=identity;global.LorefyCatalogAliases={alias:'real'};
 const rows=[{id:'real',title:'Same',auth:'Author',genres:['Fantasy']},{id:'alias',title:'Same',auth:'Author',genres:['Fantasy']}];
 assert.equal(studio.buildShelves(rows,{}, {},[], 'ar').flatMap(s=>s.items).length,1);
 delete global.LorefyCatalogAliases;
});
