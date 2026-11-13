const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function catalog(){
 const calls=[],store=new Map();
 const window={document:{readyState:'loading',addEventListener(){}},location:{hostname:'lorefy.app',search:''},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},setTimeout,clearTimeout,
  LOREFY_REMOTE_CATALOG:{enabled:true,providers:{anilist:false,mangaDex:false,googleBooks:false,bookBrainz:false,wikidata:false,gcd:false,openLibrary:true}},
  fetch:async url=>{const u=new URL(url);calls.push(u);return new Response(JSON.stringify({docs:u.searchParams.get('q').includes('subject:')?
   [{key:'/works/OL999W',title:'Saga',subject:['Comics and graphic novels']}]:
   [{key:'/works/OL998W',title:'Saga',subject:['Fiction'] }]}));}};
 vm.runInNewContext(fs.readFileSync('modules/lorefy-api-catalog.js','utf8'),{window,URL,URLSearchParams,AbortController});
 return {api:window.LorefyApiCatalog,calls,window};
}
test('comic searches reach a comic-specific source query, not a general novel hit',async()=>{
 const h=catalog(),r=await h.api.search('Saga','Comics');
 assert.match(h.calls[0].searchParams.get('q'),/subject:/);
 assert.match(h.calls[0].searchParams.get('q'),/Saga/);
 assert.equal(r.works.length,1);assert.equal(r.works[0].type,'كوميكس');
});
test('all-format search includes the dedicated comics pass while preserving literary matches',async()=>{
 const h=catalog(),r=await h.api.search('Saga','All');
 assert.ok(h.calls.some(u=>u.searchParams.get('q').includes('subject:')));
 assert.ok(r.works.some(w=>w.type==='كوميكس'));
 assert.ok(r.works.some(w=>w.type==='رواية'));
 assert.equal(h.calls.filter(u=>u.searchParams.get('q').includes('subject:')).length,1);
});
test('plain book search keeps its existing query and does not force a comic format',async()=>{
 const h=catalog();await h.api.search('Saga','Book');
 assert.equal(h.calls[0].searchParams.get('q'),'Saga');
});
test('comic title punctuation is literal rather than a Solr field or group',async()=>{
 const h=catalog();await h.api.search('Batman: White Knight (DC)','Comics');
 const q=h.calls[0].searchParams.get('q');
 assert.ok(q.includes('Batman\\:'));assert.ok(q.includes('\\(DC\\)'));
});
test('long comic queries retain the full title within the gateway limit',async()=>{
 const title='The illustrated adventures of a wandering reader through distant cities and forgotten lands';
 const h=catalog();await h.api.search(title,'Comics');
 const q=h.calls[0].searchParams.get('q');assert.ok(q.length<=160);assert.ok(q.includes(title));
});
test('Wikidata comic import retains verified series provenance with no invented score or art',()=>{
 const {mapBinding}=require('../tools/import-wikidata-comics.cjs');
 const w=mapBinding({item:{value:'http://www.wikidata.org/entity/Q2515'},title:{value:'Kick-Ass'},ar:{value:'كيك آس'},authors:{value:'Mark Millar'},date:{value:'2008-01-01T00:00:00Z'},kind:{value:'http://www.wikidata.org/entity/Q14406742'}});
 assert.equal(w.id,'wd-Q2515');assert.equal(w.catalogLevel,'series');assert.equal(w.type,'كوميكس');
 assert.equal(w.sourceLicense,'CC0');assert.equal(w.sourceUrl,'https://www.wikidata.org/wiki/Q2515');
 assert.equal(w.ch,0);assert.equal(w.r,0);assert.equal(w.sourceCoverUrl,'');assert.equal(w.metadataOnly,true);
 assert.equal(mapBinding({item:{value:'http://evil.invalid/Q2515'},title:{value:'Fake'}}),null);
 assert.equal(mapBinding({item:{value:'http://www.wikidata.org/entity/Q1'},title:{value:'Universe'},kind:{value:'http://www.wikidata.org/entity/Q5'}}),null);
});
test('compact runtime preserves imported series/source boundaries and missing-media policy',()=>{
 const {compactRecord,featuresRuntime}=require('../tools/build-runtime-catalog');
 const record={id:'wd-Q2515',title:'Kick-Ass',type:'Comics',wikidataId:'Q2515',catalogLevel:'series',metadataOnly:true,source:'Wikidata',sourceUrl:'https://www.wikidata.org/wiki/Q2515',sourceLicense:'CC0',genres:[],r:0};
 const c=compactRecord(record,featuresRuntime());
 for(const key of ['catalogLevel','metadataOnly','wikidataId','source','sourceUrl','sourceLicense'])assert.equal(c[key],record[key],key);
});
test('bundled comics source is indexed, bounded and never fabricates content classification or reading totals',()=>{
 const manifest=JSON.parse(fs.readFileSync('uploads/catalog-sources/wikidata-comics.json','utf8'));
 const index=JSON.parse(fs.readFileSync('uploads/catalog-search-index.json','utf8'));
 const records=manifest.parts.flatMap(part=>JSON.parse(fs.readFileSync('uploads/catalog-runtime/lorefy-data-part'+part+'.json','utf8')));
 assert.equal(records.length,2000);assert.equal(manifest.count,records.length);
 assert.equal(new Set(records.map(w=>w.id)).size,records.length);
 const indexed=new Set(index.records.map(r=>r[1]));
 for(const w of records){assert.ok(indexed.has(w.id));assert.equal(w.type,'كوميكس');assert.equal(w.catalogLevel,'series');assert.equal(w.sourceLicense,'CC0');
  assert.equal(w.metadataOnly,true);assert.equal(w.r,0);assert.equal(w.ch,0);assert.equal(w.isAdult,undefined);assert.equal(w.sourceCoverUrl,'');
  assert.ok(w.sourceUrl.endsWith(w.wikidataId));}
});
