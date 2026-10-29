const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const metrics=require('../modules/lorefy-reading-metrics');
const source=fs.readFileSync(path.join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');

function harness(options={}) {
  let library={hunter:'تم القراءة',...options.library};
  let progress={hunter:{chapter:420},...options.progress},removed={...options.removed},reviews=[];
  let finish,fail,calls=0;
  const pending=new Promise((yes,no)=>{finish=yes;fail=no;});
  const storage=new Map([['lorefy.activeUser.v1','owner'],['lorefy.session.v1','{"userId":"owner"}']]);
  const backend={mode:options.live?'live':'demo',user:{id:'owner'},_communityEpoch:0,
    publishReview:()=>{calls++;return pending;}};
  const scope={m:{id:'berserk',title:'Berserk',ch:384,vol:42,...options.work},G:4,
    J:'Reader',Y:'reader',Z:'',Fe:null,se:false,ct:{current:'My review'},pt:{current:''},ft:[],ze:{},gt:false,
    STATUS_DONE:'تم القراءة',window:{LorefyReadingMetrics:metrics,LorefyBackend:backend,
      localStorage:{getItem:key=>storage.get(key)||null},dispatchEvent(){}},CustomEvent:class {},
    workChapterCount:work=>work.ch||0,workVolumeCount:work=>work.vol||0,workPageCount:work=>work.pages||0,
    $:update=>{removed=update(removed);sync();},j:update=>{library=update(library);sync();},
    Ee:update=>{progress=update(progress);sync();},fo:update=>{reviews=update(reviews);},
    A(){},ht(){},Wo(){},bo(){},setTimeout(){},Se(){},dt(){},no(){},ro(){},io(){}};
  vm.createContext(scope);
  const guard=source.indexOf('function lorefyReviewRequestScope(');
  vm.runInContext(source.slice(guard,source.indexOf('const{useState',guard)),scope);
  function sync(){if(scope.reviewEditor)scope.reviewEditor.current.reading={library,progressById:progress,removed};}
  function open(){scope.reviewEditor={current:{owner:scope.lorefyReviewRequestScope(),workId:'berserk',id:1,closed:false}};sync();}
  open();
  const completion=source.indexOf('Zn=t=>'),publish=source.indexOf('tr=async()=>');
  vm.runInContext('const '+source.slice(completion,source.indexOf(';useEffect(',completion))+
    ';const '+source.slice(publish,source.indexOf(',qo=async',publish))+';this.publish=tr;',scope);
  return {scope,finish,fail,open,backend,publish:()=>scope.publish(),calls:()=>calls,
    state:()=>JSON.parse(JSON.stringify({library,progress,removed,reviews})),
    totals:()=>metrics.calculateReadingMetrics({library,progressById:progress,reviews}),
    change(next){if(next.library)library=next.library;if(next.progress)progress=next.progress;if(next.removed)removed=next.removed;sync();}};
}

test('publishing the first review counts Berserk once without assigning a library status',async()=>{
  const h=harness();await h.publish();
  assert.equal(h.state().library.berserk,undefined);
  assert.equal(h.state().progress.berserk,undefined);
  assert.equal(h.state().reviews[0].completionProgress.chapter,384);
  assert.equal(Object.values(h.state().library).filter(s=>s==='تم القراءة').length,1);
  assert.equal(h.totals().chapters,804);assert.equal(h.totals().hours,161);
  assert.equal(h.state().reviews[0].r,4);
});

test('republishing a rating and later metadata growth do not increase its saved completion',async()=>{
  const h=harness();await h.publish();h.scope.m.ch=500;h.open();await h.publish();
  assert.equal(h.state().library.berserk,undefined);
  assert.equal(h.state().reviews[0].completionProgress.chapter,384);assert.equal(h.totals().chapters,804);
  const initialized=metrics.initializeCompletedProgress({library:h.state().library,progressById:h.state().progress,getWork:()=>h.scope.m});
  assert.deepEqual(initialized.changedIds,[]);
});

test('a first book rating captures pages without inventing chapters or double-counting volume time',async()=>{
  const h=harness({work:{ch:0,pages:200,vol:1}});await h.publish();
  assert.equal(h.state().library.berserk,undefined);
  assert.equal(h.state().reviews[0].completionProgress.chapter,0);assert.equal(h.state().reviews[0].completionProgress.page,200);
  assert.equal(h.totals().minutes,420*12+200*1.5);
});

for(const status of ['أقرأ حالياً','قائمة الأمنيات','توقف','توقف نهائي','تم القراءة']) {
  test('a new rating preserves an existing reading choice: '+status,async()=>{
    const h=harness({library:{berserk:status},progress:{berserk:{chapter:0,page:12,note:'Keep'}}}),before=h.state();
    await h.publish();assert.deepEqual(h.state().library,before.library);assert.deepEqual(h.state().progress,before.progress);
  });
}

test('an explicit orphan zero or removal marker is not overwritten by publishing',async()=>{
  for(const options of [{progress:{berserk:{chapter:0}}},{removed:{berserk:123}}]) {
    const h=harness(options),before=h.state();await h.publish();
    assert.deepEqual(h.state().library,before.library);assert.deepEqual(h.state().progress,before.progress);
    assert.deepEqual(h.state().removed,before.removed);
  }
});

test('a failed or invalid rating never adds completion or reading metrics',async()=>{
  const h=harness({live:true}),before=h.state(),request=h.publish();h.fail(Error('Offline'));await request;
  assert.deepEqual(h.state(),before);
  const invalid=harness();invalid.scope.G=0;await invalid.publish();assert.equal(invalid.state().library.berserk,undefined);
});

test('an explicit zero dislike publishes once and does not change a saved library status',async()=>{
 const h=harness({library:{berserk:'توقف'},progress:{berserk:{chapter:12}}});h.scope.G=0;h.scope.Fe='no';await h.publish();
 assert.equal(h.state().reviews[0].r,0);assert.equal(h.state().reviews[0].recVal,'no');
 assert.equal(h.state().library.berserk,'توقف');assert.equal(h.state().progress.berserk.chapter,12);
 h.open();await h.publish();assert.equal(h.state().reviews.filter(r=>r.mid==='berserk').length,1);
});

test('zero without dislike and invalid numbers cannot reach publication',async()=>{
 for(const value of [0,null,NaN,Infinity,-1,6,'0']){
  const h=harness();h.scope.G=value;h.scope.Fe=value===0?null:'no';await h.publish();assert.equal(h.state().reviews.length,0);
 }
});

test('a reading choice or checkpoint made while publishing is pending wins over automatic completion',async()=>{
  for(const change of [{library:{hunter:'تم القراءة',berserk:'أقرأ حالياً'}},
    {progress:{hunter:{chapter:420},berserk:{chapter:0}}},{removed:{berserk:123}}]) {
    const h=harness({live:true}),request=h.publish();h.change(change);const before=h.state();
    h.finish({id:'saved'});await request;
    assert.deepEqual(h.state().library,before.library);assert.deepEqual(h.state().progress,before.progress);
    assert.deepEqual(h.state().removed,before.removed);
  }
});

test('removing a previously tracked work while a rating is pending does not re-add it',async()=>{
  const h=harness({live:true,library:{berserk:'أقرأ حالياً'}}),request=h.publish();
  h.change({library:{hunter:'تم القراءة'}});h.finish({id:'saved'});await request;
  assert.equal(h.state().library.berserk,undefined);
});

test('account changes while publishing never complete the work for the next account',async()=>{
  const h=harness({live:true}),request=h.publish();h.backend._communityEpoch++;
  h.finish({id:'saved'});await request;assert.equal(h.state().library.berserk,undefined);
});

test('hydrating an old rating alone still cannot backfill historical reading totals',()=>{
  const library={};assert.equal(metrics.seedReviewedWorks(library,['berserk'],{},'تم القراءة'),library);
  assert.deepEqual(library,{});
});

test('each app render refreshes the active editor reading snapshot',()=>{
  const needle='if(reviewEditor.current)reviewEditor.current.reading=';
  const start=source.indexOf(needle);assert.ok(start>=0,'the app must refresh the current library/progress snapshot');
  const code=source.slice(start,source.indexOf(';',start)+1);
  const scope={reviewEditor:{current:{}},b:{},le:{},Te:{}};vm.createContext(scope);vm.runInContext(code,scope);
  assert.equal(scope.reviewEditor.current.reading.library,scope.b);
  scope.b={berserk:'أقرأ حالياً'};scope.le={berserk:{chapter:12}};vm.runInContext(code,scope);
  assert.equal(scope.reviewEditor.current.reading.library,scope.b);
  assert.equal(scope.reviewEditor.current.reading.progressById,scope.le);
});
