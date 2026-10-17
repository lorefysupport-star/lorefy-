const test=require('node:test'),assert=require('node:assert/strict');
const data=require('../modules/lorefy-catalog-data');
for(const warm of ['prepareCatalogRecords','prepareSearchIndexes'])for(const field of ['altTitles','aliases','authorAliases'])for(const edit of ['replace-array','in-place'])test(warm+': '+field+' '+edit+' with the same count replaces search terms',()=>{
  const work={id:'compact',title:'Original Story',auth:'Original Writer',_catalogCompact:true,[field]:['Old search term']};
  data[warm]([work]);assert.equal(data.matchesCatalogQuery(work,'Old search term'),true);
  if(edit==='replace-array')work[field]=['New search term'];else work[field][0]='New search term';
  assert.equal(data.matchesCatalogQuery(work,'Old search term'),false);
  assert.equal(data.matchesCatalogQuery(work,'New search term'),true);
  assert.equal(work.id,'compact');assert.equal(work.title,'Original Story');
});
test('Arabic alias content updates are noticed without changing the work or edition identity',()=>{
  const work={id:'edition-42',title:'Original',aliases:['حكاية قديمة'],_catalogCompact:true};
  data.prepareSearchIndexes([work]);assert.equal(data.matchesCatalogQuery(work,'حكاية قديمة'),true);
  work.aliases[0]='حكاية مُحَدَّثة';assert.equal(data.matchesCatalogQuery(work,'حكاية محدثة'),true);
  assert.equal(data.matchesCatalogQuery(work,'حكاية قديمة'),false);assert.equal(work.id,'edition-42');
});
test('same-count object alias content edits invalidate a warmed index',()=>{
  const work={id:'object-alias',title:'Core story',altTitles:[{en:'Hidden original'}],_catalogCompact:true};
  data.prepareSearchIndexes([work]);assert.equal(data.matchesCatalogQuery(work,'Hidden original'),true);
  work.altTitles[0].en='Hidden revised';assert.equal(data.matchesCatalogQuery(work,'Hidden revised'),true);
  assert.equal(data.matchesCatalogQuery(work,'Hidden original'),false);
});
test('unchanged compact metadata reuses the prepared index',()=>{
  const work={id:'stable',title:'Original',aliases:['Find me'],_catalogCompact:true};
  data.prepareSearchIndexes([work]);const index=work._queryIndex;
  for(let i=0;i<4;i++)assert.equal(data.matchesCatalogQuery(work,'Find me'),true);
  assert.equal(work._queryIndex,index);
});

test('worker cache versions change independently while unchanged bootstrap catalog shards keep their data version',()=>{
  const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..');
  const loader=fs.readFileSync(path.join(root,'modules/lorefy-catalog-loader.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const dataVersion=/var version = "([^"]+)"/.exec(loader)[1],workerVersion=/var workerVersion = "([^"]+)"/.exec(loader)[1];
  assert.ok(html.includes("'.js?v="+dataVersion+"\"><\\/script>"));
  for(const worker of ['lorefy-catalog-worker.js','lorefy-catalog-search-worker.js']){
    assert.ok(loader.includes('"modules/'+worker+'?v=" + workerVersion'));
    assert.ok(sw.includes('modules/'+worker+'?v='+workerVersion));
  }
});
