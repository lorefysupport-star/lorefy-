const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const bibliography=require('../modules/lorefy-bibliographic-overrides');
const picks=[['أفراح القبة','63827462'],['ليالي ألف ليلة','30519685'],['الباقي من الزمن ساعة','37390524']];
for(const [title,publisherId] of picks)test('publisher summary fills only missing data for '+title,()=>{
 const work={id:'existing-'+publisherId,title,auth:'نجيب محفوظ',type:'رواية',synopsis:'',yr:1981,r:0,cover:'personal.jpg',prog:{ch:7},mySt:'reading'};
 const before={id:work.id,yr:work.yr,r:work.r,cover:work.cover,prog:work.prog,mySt:work.mySt};
 bibliography.apply(work);assert.ok(work.synopsis.length>30);assert.equal(work.synopsisAr,work.synopsis);assert.equal(work.synopsisAttribution,'https://www.safahat.org/books/'+publisherId+'/');
 for(const key of Object.keys(before))assert.equal(work[key],before[key],key);
});
test('publisher follow-up does not replace an existing synopsis or match another author or adaptation',()=>{
 for(const [title] of picks){
  const work={title,auth:'نجيب محفوظ',type:'رواية',synopsis:'Saved source synopsis',synopsisAttribution:'existing-source'};
  bibliography.apply(work);assert.equal(work.synopsis,'Saved source synopsis');assert.equal(work.synopsisAttribution,'existing-source');
  for(const variant of [{auth:'مؤلف آخر',type:'رواية'},{auth:'نجيب محفوظ',type:'كوميكس'}]){
   const other={title,...variant,synopsis:''};assert.equal(bibliography.apply(other),false);assert.equal(other.synopsis,'');
  }
 }
});
test('startup catalog quality pass fills all three existing Arabic records without a catalog rebuild',()=>{
 const scope={window:{LorefyMangaData:[],LorefyBibliographicOverrides:bibliography}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-arabic-library'),'utf8'),scope);
 const records=picks.map(([title])=>scope.window.LorefyMangaData.find(w=>w.title===title&&w.auth==='نجيب محفوظ'));
 assert.ok(records.every(Boolean));const ids=records.map(w=>w.id);
 vm.runInNewContext(fs.readFileSync(require.resolve('../uploads/lorefy-catalog-quality'),'utf8'),scope);
 assert.ok(records.every(w=>w.synopsis&&w.synopsisAttribution));assert.deepEqual(records.map(w=>w.id),ids);
});
