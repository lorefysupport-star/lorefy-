const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const metrics=require('../modules/lorefy-reading-metrics');
const metadata=require('../modules/lorefy-chapter-metadata');
const shadow='fwn-featured-novel-shadow-slave';

test('Shadow Slave has an exact publisher baseline despite its empty bundled catalog count',()=>{
  const work=JSON.parse(fs.readFileSync(require.resolve('../uploads/catalog-runtime/lorefy-data-part08.json'))).find(w=>w.id===shadow);
  assert.equal(work.ch,0);
  const target={LorefyMangaData:[work],LorefyChapterData:{}};
  metadata.seedCatalog(target);
  const record=target.LorefyChapterData[shadow];
  assert.equal(record?.latestChapter,3233);
  assert.equal(new URL(record.sourceUrl).hostname,'www.webnovel.com');
  assert.equal(record.updatedAt,'2026-11-01');
  assert.equal(target.LorefyChapterData['shadow-slave-impostor'],undefined);
  const completed=metrics.completionCheckpoint(work,null,{ch:record.latestChapter});
  assert.equal(completed.chapter,3233);
  assert.equal(metrics.calculateReadingMetrics({library:{[shadow]:'تم القراءة'},progressById:{[shadow]:completed}}).hours,647);
});

test('empty completed checkpoints recover known totals once, including after a catalog arrives',()=>{
  const library={a:'تم القراءة',b:'completed',reading:'أقرأ حالياً',wish:'قائمة الأمنيات'};
  const progressById={a:{chapter:0,page:0,volume:0,note:'keep'},b:{chapter:12},reading:{chapter:0},wish:{chapter:0}};
  const unknown=metrics.initializeCompletedProgress({library,progressById,getWork:()=>({ch:0})});
  assert.equal(unknown.progressById,progressById);
  assert.deepEqual(unknown.pendingIds,['a']);
  const ready=metrics.initializeCompletedProgress({library,progressById,getWork:()=>({ch:200})});
  assert.deepEqual(ready.changedIds,['a']);
  assert.equal(ready.progressById.a.chapter,200);
  assert.equal(ready.progressById.a.note,'keep');
  assert.equal(ready.progressById.b.chapter,12);
  assert.equal(ready.progressById.reading,progressById.reading);
  assert.equal(ready.progressById.wish,progressById.wish);
  const later=metrics.initializeCompletedProgress({library,progressById:ready.progressById,getWork:()=>({ch:201})});
  assert.equal(later.progressById,ready.progressById);
  assert.equal(progressById.a.chapter,0);
});

test('late totals repair only earned empty owner reviews, without changing reading status or checkpoint',()=>{
  const reviews=[
    {mid:'a',userId:'owner',completedByReview:true,completionProgress:{chapter:0}},
    {mid:'a',userId:'other',completedByReview:true,completionProgress:{chapter:0}},
    {mid:'a',userId:'owner',r:4},
    {mid:'b',userId:'me',completedByReview:true,completionProgress:{chapter:7}},
    {mid:'book',userId:'me',completedByReview:true,completionProgress:{chapter:0}}
  ];
  const options={reviews,ownerId:'owner',getWork:id=>id==='book'?{pages:200,vol:1}:{ch:100}};
  const fixed=metrics.initializeReviewCompletions(options);
  assert.equal(fixed[0].completionProgress.chapter,100);
  assert.equal(fixed[1],reviews[1]);assert.equal(fixed[2],reviews[2]);assert.equal(fixed[3],reviews[3]);
  assert.equal(fixed[4].completionProgress.page,200);
  const total=metrics.calculateReadingMetrics({library:{a:'تم القراءة'},progressById:{a:{chapter:100}},reviews:fixed,ownerId:'owner'});
  assert.equal(total.chapters,107);
  assert.equal(total.minutes,107*12+300);
  assert.equal(metrics.initializeReviewCompletions({...options,reviews:fixed,getWork:()=>({ch:999})}),fixed);
  assert.equal(reviews[0].completionProgress.chapter,0);
});

test('republishing an empty earned snapshot captures newly available totals but positive snapshots stay frozen',()=>{
  const review={completedByReview:true,completionProgress:{chapter:0}};
  const updated=metrics.withReviewCompletion(review,{ch:100});
  assert.equal(updated.completionProgress.chapter,100);
  assert.equal(metrics.withReviewCompletion(updated,{ch:200}).completionProgress.chapter,100);
});

test('actual status save records totals immediately and remains idempotent with review credit',()=>{
  const source=fs.readFileSync(require.resolve('../uploads/files/lorefy-app.js'),'utf8');
  let library={},progress={},log={};
  const scope={E:{id:shadow,ch:3233},ie:'تم القراءة',STATUS_DONE:'تم القراءة',to:{chapter:0},le:progress,
    window:{LorefyReadingMetrics:metrics},normalizeProgress:metrics.normalizeProgress,
    workChapterCount:w=>w.ch,workVolumeCount:()=>0,workPageCount:()=>0,Mo:f=>{log=f(log)},
    $:()=>{},j:f=>{library=f(library)},Ee:f=>{progress=f(progress);scope.le=progress},A(){},be(){}};
  const start=source.indexOf('qn=()=>');
  vm.runInNewContext('const '+source.slice(start,source.indexOf(',Zn=',start))+';this.save=qn',scope);
  scope.save();scope.save();
  assert.equal(library[shadow],'تم القراءة');assert.equal(progress[shadow].chapter,3233);
  assert.equal(Object.values(log).reduce((a,b)=>a+b,0),3233);
  const review=metrics.withReviewCompletion({mid:shadow,userId:'me'},scope.E);
  assert.equal(metrics.calculateReadingMetrics({library,progressById:progress,reviews:[review]}).chapters,3233);
});

test('the application reacts to late chapter metadata and removes both hydration listeners',()=>{
  const source=fs.readFileSync(require.resolve('../uploads/files/lorefy-app.js'),'utf8');
  let progress={a:{chapter:0}},reviews=[{mid:'a',userId:'owner',completedByReview:true,completionProgress:{chapter:0}}];
  let count=0,cleanup;const listeners=new Map();
  const scope={Y:'reader',b:{a:'تم القراءة'},le:progress,M:reviews,
    window:{LorefyReadingMetrics:metrics,LorefyBackend:{user:{id:'owner'}},
      addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name)}},
    workById:()=>({ch:count}),workChapterCount:w=>w.ch,workVolumeCount:()=>0,workPageCount:()=>0,
    Ee:f=>{progress=f(progress)},fo:f=>{reviews=f(reviews)},useEffect:f=>{cleanup=f()}};
  const start=source.indexOf('useEffect(()=>{const getTotals=work=>');
  assert.ok(start>=0);
  vm.runInNewContext(source.slice(start,source.indexOf('const Un=',start)),scope);
  assert.equal(progress.a.chapter,0);
  count=150;listeners.get('lorefy:chapter-metadata')();
  assert.equal(progress.a.chapter,150);assert.equal(reviews[0].completionProgress.chapter,150);
  count=151;listeners.get('lorefy:catalog-ingested')();
  assert.equal(progress.a.chapter,150);assert.equal(reviews[0].completionProgress.chapter,150);
  cleanup();assert.equal(listeners.size,0);
  assert.match(fs.readFileSync(require.resolve('../modules/lorefy-chapter-detail.js'),'utf8'),/dispatchEvent\(new CustomEvent\('lorefy:chapter-metadata'/);
});
