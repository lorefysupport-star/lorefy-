const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../modules/lorefy-explore-studio');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('reading snapshots prefer pages for books and chapters for sequential works', () => {
  assert.deepEqual(core.readingSnapshot({type:'Book',pages:400,ch:20}, {page:212,chapter:1}),
    {unit:'page',current:212,total:400,percent:53,ongoing:false});
  assert.equal(core.readingSnapshot({type:'Manga',ch:100}, {ch:28}).percent,28);
  assert.equal(core.readingSnapshot({type:'Light Novel',ch:100}, {chapter:25}).unit,'chapter');
});
test('unknown totals never imply a fabricated percentage; available chapters are not completion', () => {
  assert.equal(core.readingSnapshot({type:'Novel'}, {page:34}).percent,null);
  assert.equal(core.readingSnapshot({type:'Manga',ch:20,st:'مستمرة'}, {chapter:20}).ongoing,true);
  assert.equal(core.readingSnapshot({type:'Book',pages:0},{page:0}).percent,null);
  assert.equal(core.readingSnapshot({type:'Book',pages:100},{page:120}).percent,100);
  assert.equal(core.readingSnapshot({type:'Manga',ch:0},{chapter:Infinity}).current,0);
});
test('chapter publisher totals override stale work totals and status',()=>{
  const result=core.readingSnapshot({type:'Manga',ch:100,st:'مكتملة'}, {chapter:25}, {chapter:50,ongoing:true});
  assert.deepEqual(result,{unit:'chapter',current:25,total:50,percent:50,ongoing:true});
});
test('shelves adapt to ranked account taste, keep bounded cards, and do not duplicate works', () => {
  const fantasy=Array.from({length:20},(_,i)=>({id:'f'+i,title:'Fantasy '+i,type:'Novel',genres:['Fantasy'],auth:'Writer '+i}));
  const romance=Array.from({length:20},(_,i)=>({id:'r'+i,title:'Romance '+i,type:'Novel',genres:['Romance'],auth:'Author '+i}));
  const a=core.buildShelves(fantasy.concat(romance),{genres:['Fantasy']},{},[],'ar');
  const b=core.buildShelves(romance.concat(fantasy),{genres:['Romance']},{},[],'en');
  assert.notEqual(a[0].items[0].id,b[0].items[0].id);
  assert.ok(a.some(s=>s.title.includes('Fantasy')));
  assert.ok(b.some(s=>s.title.includes('Romance')));
  for(const shelves of [a,b]) {
    const ids=shelves.flatMap(s=>s.items.map(w=>w.id));
    assert.equal(ids.length,new Set(ids).size);
    assert.ok(shelves.every(s=>s.items.length<=12 && s.items.length>0));
  }
});
test('empty catalog and absent preferences are valid; fake lists and unsafe works are never invented',()=>{
  assert.deepEqual(core.buildShelves([],{}, {},[],'ar'),[]);
  const works=[{id:'bad',_discoveryEligible:false,genres:['Fantasy']},{id:'ok',title:'OK',genres:['Fantasy']}];
  const sections=core.buildShelves(works,{}, {},[],'en');
  assert.equal(sections.flatMap(s=>s.items).length,1);
  assert.equal(sections[0].items[0].id,'ok');
});
test('discovery-approved unrated works remain available after the full compact catalog loads',()=>{
  const sections=core.buildShelves([{id:'safe-unrated',_discoveryEligible:true,_recommendationEligible:false}],{},{},[],'ar');
  assert.equal(sections[0].items[0].id,'safe-unrated');
});
test('general shelves limit repeated authors and separate genuine genre exploration',()=>{
  const works=Array.from({length:25},(_,i)=>({id:'same'+i,auth:'Same writer',genres:['Fantasy']}))
    .concat(Array.from({length:25},(_,i)=>({id:'other'+i,auth:'Other '+i,genres:['Romance']})));
  const shelves=core.buildShelves(works,{genres:['Fantasy']},{},[],'en');
  for(const shelf of shelves.filter(s=>!s.key.startsWith('author-'))) {
    assert.ok(shelf.items.filter(w=>w.auth==='Same writer').length<=2);
  }
  assert.ok(shelves.find(s=>s.key==='beyond').items.every(w=>!w.genres.includes('Fantasy')));
});
test('active reading excludes finished and paused works but includes zero checkpoints',()=>{
  const works=[{id:'one',type:'Book',pages:100},{id:'two'},{id:'three'}];
  const rows=core.readingItems({one:'أقرأ حالياً',two:'تم القراءة',three:'توقف'},{},id=>works.find(w=>w.id===id));
  assert.equal(rows.length,1);
  assert.equal(rows[0].snapshot.current,0);
});
test('explore uses the shared React state, durable preference setter and progress editor',()=>{
  const app=read('uploads/files/lorefy-app.js');
  assert.match(app,/React\.createElement\(window\.LorefyExploreStudio\.Explore/);
  assert.match(app,/onPreferences:cn/);
  assert.match(app,/onEditProgress:work=>\{be\(work\)/);
  assert.match(read('index.html'),/modules\/lorefy-explore-studio\.js\?v=/);
  assert.match(read('sw.js'),/modules\/lorefy-explore-studio\.js\?v=/);
});
test('new surfaces use theme tokens, stable covers and logical mobile dimensions',()=>{
  const css=read('styles/lorefy-explore-studio.css');
  assert.match(css,/var\(--ui-action\)/);
  assert.match(css,/aspect-ratio:\s*2\s*\/\s*3/);
  assert.match(css,/minmax\(0,\s*1fr\)/);
  // Progress stays in the library/detail flows; Explore is only discovery.
  assert.doesNotMatch(read('modules/lorefy-explore-studio.js'),/role: 'progressbar'/);
});
test('Explore genre labels localize both stored Arabic tastes and imported English metadata', () => {
  const studio = require('../modules/lorefy-explore-studio');
  assert.equal(studio.genreLabel('أكشن','en'),'Action');
  assert.equal(studio.genreLabel('Fantasy','ar'),'خيال');
  assert.equal(studio.genreLabel('غير خيالي','en'),'Nonfiction');
  assert.equal(studio.genreLabel('Unmapped genre','en'),'Unmapped genre');
});
test('Arabic genre preferences match English provider genres in personalized shelves', () => {
  const studio = require('../modules/lorefy-explore-studio');
  const works = Array.from({length:10}, (_,i)=>({id:String(i),title:'Story '+i,type:'Novel',genres:['Fantasy']}));
  const shelves = studio.buildShelves(works,{genres:['خيال']},{},[],'ar');
  assert.equal(shelves.find(s=>s.key==='genre-0').items.length,4);
  assert.equal(shelves.some(s=>s.key==='beyond'),false);
});
