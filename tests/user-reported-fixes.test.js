const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const metrics=require('../modules/lorefy-reading-metrics.js'),experience=require('../modules/lorefy-user-experience.js'),identity=require('../modules/lorefy-catalog-identity.js'),product=require('../modules/lorefy-product-core.js');
test('review reconciliation preserves paused to reading, dropped, wishlist and explicit completion choices',()=>{
  for(const status of ['توقف','أقرأ حالياً','توقف نهائي','قائمة الأمنيات','تم القراءة']){
    const saved={work:status};assert.equal(metrics.seedReviewedWorks(saved,['work'],{},'تم القراءة'),saved);assert.equal(saved.work,status);
  }
});
test('removal and readdition do not revive a removed work or overwrite a newly chosen state',()=>{
  const removed={work:123};assert.deepEqual(metrics.seedReviewedWorks({},['work'],removed,'تم القراءة'),{});
  assert.deepEqual(metrics.seedReviewedWorks({work:'أقرأ حالياً'},['work'],{},'تم القراءة'),{work:'أقرأ حالياً'});
  assert.deepEqual(metrics.seedReviewedWorks({},['legacy'],{},'تم القراءة'),{});
});
function reactHarness(){
  let revealed=false;
  global.React={Fragment:'fragment',createElement:(tag,props,...children)=>({tag,props:props||{},children}),useState:()=>[revealed,value=>{revealed=value;}]};
  return ()=>experience.SpoilerGate({spoiler:true,language:'ar',children:{secret:'text, pictures and characters'}});
}
function flatten(tree){if(!tree||typeof tree!=='object')return [];return [tree,...(tree.children||[]).flatMap(flatten)];}
test('spoilers are absent from the rendered tree until explicit reveal, and can be hidden again',()=>{
  const render=reactHarness();let tree=render();assert(!JSON.stringify(tree).includes('text, pictures'));let button=flatten(tree).find(n=>n.tag==='button');assert.equal(button.props['aria-expanded'],false);let stopped=false;
  button.props.onClick({stopPropagation(){stopped=true;}});tree=render();assert(stopped);assert(JSON.stringify(tree).includes('text, pictures'));button=flatten(tree).find(n=>n.tag==='button');button.props.onClick({stopPropagation(){}});assert(!JSON.stringify(render()).includes('text, pictures'));
});
test('controlled spoiler reveal survives parent card remounts, while keys isolate account, surface and changed prose',()=>{
  const render=reactHarness();render();
  const props={spoiler:true,language:'en',revealed:true,children:{secret:'kept after refresh'},onToggle(){}};
  assert(JSON.stringify(experience.SpoilerGate(props)).includes('kept after refresh'));
  global.LorefyBackend={user:{id:'first'}};const review={id:'review',txt:'original',spoiler:true};const key=experience.reviewKey(review,'card');
  assert.notEqual(key,experience.reviewKey(review,'detail'));assert.notEqual(key,experience.reviewKey({...review,txt:'edited'},'card'));
  global.LorefyBackend.user.id='second';assert.notEqual(key,experience.reviewKey(review,'card'));delete global.LorefyBackend;
});
test('both review cards and details use the spoiler gate and completion counters follow explicit library state',()=>{
  const s=fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');assert.equal(s.split('React.createElement(window.LorefyUserExperience.SpoilerGate').length-1,2);assert(s.includes('de=(t,r)=>r===STATUS_DONE,'));assert(s.includes('LorefyReadingMetrics.seedReviewedWorks(r,t,Te,STATUS_DONE)'));
});
test('author bibliography merges equivalent records but retains distinct volumes and adaptations',()=>{
  const work={id:'a',title:'A Story',type:'مانجا',auth:'Writer',malId:100};
  const rows=[work,{...work,id:'duplicate',anilistId:200},{...work,id:'volume',title:'A Story Vol. 2',malId:101},{...work,id:'adaptation',type:'رواية',malId:102}];
  const value=product.authorWorks(rows,'Writer',identity,{});assert.equal(value.length,3);assert(rows[0]===work);assert.equal(work._catalogMergedIds,undefined);
});
test('similar works stay in the format, match genres, and exclude aliases and duplicate copies',()=>{
  const current={id:'one',title:'One',type:'مانجا',auth:'Writer',genres:['Fantasy'],malId:1};
  const related={id:'other',title:'Other',type:'مانجا',auth:'Other writer',genres:['Fantasy'],malId:2};
  const items=experience.suggestions(current,[current,{...current,id:'alias'},related,{...related,id:'copy'},{id:'unrelated',title:'Unrelated',type:'مانجا',genres:['Romance']},{id:'wrong-format',title:'A novel',type:'رواية',genres:['Fantasy']}],{identity,aliases:{alias:'one'},eligible:()=>true});
  assert.deepEqual(items.map(x=>x.title),['Other']);
});
