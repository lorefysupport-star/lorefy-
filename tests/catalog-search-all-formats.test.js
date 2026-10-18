const test=require('node:test'),assert=require('node:assert/strict');
const plan=require('../modules/lorefy-catalog-plan'),data=require('../modules/lorefy-catalog-data');
const types=['Manga','Manhwa','Manhua','Comics','Novel','Book','Light Novel','Web Novel'];
const entries=types.map((type,i)=>({part:i+1,work:{id:'edition-'+i,title:'Shared reading title',type}}));
for(const type of ['All','الكل','all','ALL',' All ',' الكل ',''])test('all-format search includes all eight formats: '+JSON.stringify(type),()=>{
  assert.deepEqual(plan.searchIndexParts(entries,'Shared reading title',type,data).map(x=>x.part),[1,2,3,4,5,6,7,8]);
});
test('specific Arabic and English formats continue to constrain exact search',()=>{
  for(const [i,type]of types.entries())assert.deepEqual(plan.searchIndexParts(entries,'Shared reading title',type,data).map(x=>x.part),[i+1]);
  for(const [type,part]of [['رواية',5],['كتاب',6],['كوميكس',4],['مانجا',1]])assert.deepEqual(plan.searchIndexParts(entries,'Shared reading title',type,data).map(x=>x.part),[part]);
});
test('all-format correction can discover a non-manga title without changing its type',()=>{
  const records=[{part:7,work:{id:'novel',title:'The Amber Archive',type:'Novel'}}];
  for(const type of ['الكل','All',' all '])assert.deepEqual(plan.searchIndexResult(records,'The Amber Archvie',type,data).suggestions,['The Amber Archive']);
  assert.deepEqual(plan.searchIndexResult(records,'The Amber Archvie','Manga',data).suggestions,[]);
  assert.equal(records[0].work.type,'Novel');
});
test('a non-manga exact match suppresses corrections from other formats',()=>{
  const records=[{part:1,work:{id:'exact',title:'Amber Archive',type:'Book'}},{part:2,work:{id:'near',title:'Amber Archvie',type:'Manga'}}];
  const result=plan.searchIndexResult(records,'Amber Archive','الكل',data);
  assert.deepEqual(result.matches.map(x=>x.part),[1]);assert.deepEqual(result.suggestions,[]);
});
test('all-format spellings retain the established lightweight browse bootstrap',()=>{
  const manifest={types:{Manga:[1,2],Novel:[3,4]},featuredParts:[1]};
  for(const type of ['الكل','All'])assert.deepEqual(plan.initialCatalogPlan(manifest,{type}),[1]);
});
