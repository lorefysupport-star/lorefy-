const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const bibliography=require('../modules/lorefy-bibliographic-overrides');
const other=[['أديب','طه حسين'],['دعاء الكروان','طه حسين'],['الحب الضائع','طه حسين']];
function reviewed(){return bibliography.entries.concat(other.map(([title,auth])=>bibliography.find({title,auth,type:'كتاب'})));}
test('all 58 previously identified publisher entries have source-attributed summaries',()=>{
 const entries=reviewed();assert.equal(entries.length,58);assert.equal(new Set(entries.map(e=>e.publisherUrl)).size,58);
 for(const entry of entries){assert.ok(entry.synopsis&&entry.synopsis.length>30,entry.title);assert.match(entry.publisherUrl,/^https:\/\/www\.safahat\.org\/books\/\d+\/$/);}
});
test('startup enrichment fills the 56 available reviewed anchors without adding or retiring catalog IDs',()=>{
 const scope={window:{LorefyMangaData:[],LorefyBibliographicOverrides:bibliography}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-arabic-library'),'utf8'),scope);
 const works=scope.window.LorefyMangaData,ids=works.map(w=>w.id),existing=new Map(works.map(w=>[w.id,{synopsis:w.synopsis,attribution:w.synopsisAttribution}]));
 vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-catalog-quality'),'utf8'),scope);
 const absent=[];
 for(const entry of reviewed()){
  const work=works.find(w=>bibliography.find(w)?.publisherUrl===entry.publisherUrl);
  if(!work){absent.push(entry.title);continue;}
  assert.ok(work.synopsis,entry.title);
  if(existing.get(work.id).synopsis){assert.equal(work.synopsis,existing.get(work.id).synopsis);assert.equal(work.synopsisAttribution,existing.get(work.id).attribution);}
  else assert.equal(work.synopsisAttribution,entry.publisherUrl);
 }
 assert.deepEqual(absent,['أديب','الحب الضائع']);assert.deepEqual(works.map(w=>w.id),ids);
});
test('publisher-wide enrichment preserves existing text and personal reading fields',()=>{
 for(const entry of reviewed()){
  const personal={id:'saved',yr:2001,r:4.5,cover:'personal-cover.jpg',sourceCoverUrl:'existing-source.jpg',prog:{ch:9},mySt:'reading',synopsis:'Existing source summary',synopsisAr:'نبذة محفوظة',synopsisAttribution:'existing-source'};
  const work={title:entry.title,auth:entry.auth,type:entry.type||'رواية',...personal};bibliography.apply(work);
  for(const key of Object.keys(personal))assert.equal(work[key],personal[key],entry.title+':'+key);
 }
});
test('publisher-wide summaries never match another author or a comic adaptation',()=>{
 for(const entry of reviewed())for(const variant of [{auth:'مؤلف آخر',type:'رواية'},{auth:entry.auth,type:'كوميكس'}]){
  const work={title:entry.title,...variant,synopsis:''};assert.equal(bibliography.apply(work),false);assert.equal(work.synopsis,'');
 }
});
test('deferred OpenITI Taha Hussein records receive summaries through the normal quality pass',()=>{
 const data=require('../modules/lorefy-catalog-data');
 const source=fs.readFileSync(require.resolve('../uploads/lorefy-data-part160.js'),'utf8');
 const works=data.extractCatalogRecords(source).filter(w=>['أديب','الحب الضائع'].includes(w.title)&&w.auth==='طه حسين');
 assert.equal(works.length,2);const ids=works.map(w=>w.id);assert.ok(works.every(w=>!w.synopsis));
 const scope={window:{LorefyMangaData:works,LorefyBibliographicOverrides:bibliography}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-catalog-quality'),'utf8'),scope);
 assert.ok(works.every(w=>w.synopsis&&w.synopsisAttribution));assert.deepEqual(works.map(w=>w.id),ids);
});
