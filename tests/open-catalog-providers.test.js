const test=require('node:test'),assert=require('node:assert/strict');
const identity=require('../modules/lorefy-catalog-identity.js');
const load=()=>require('../modules/lorefy-open-catalog.js');
const bbid='10bfa711-b374-43bd-a9d0-13329ae32b3e';

test('BookBrainz imports bibliographic entities with stable scoped IDs, never authors or invented ratings',()=>{
  const api=load();
  const w=api.mapBookBrainz({bbid,entityType:'Edition',defaultAlias:{name:'Watchmen'}},{bbid,defaultAlias:{name:'Watchmen'},releaseEventDate:'+001987',authorCredits:{names:[{name:'Alan Moore'}]},editionFormat:'Paperback'},'All');
  assert.equal(w.id,'bb-edition-'+bbid);assert.equal(w.catalogLevel,'edition');
  assert.equal(w.auth,'Alan Moore');assert.equal(w.yr,1987);assert.equal(w.r,0);assert.equal(w.ch,0);
  assert.equal(w.sourceLicense,'CC0');assert.equal(w.sourceCoverUrl,'');
  assert.equal(api.mapBookBrainz({bbid,entityType:'Author',defaultAlias:{name:'A Writer'}},{},'All'),null);
  assert.equal(api.mapBookBrainz({bbid:'../bad',entityType:'Work',defaultAlias:{name:'X'}},{},'All'),null);
});

test('Wikidata distinguishes a web novel from its animated adaptation and preserves language aliases',()=>{
  const api=load(),claim=id=>({mainsnak:{datavalue:{value:{id}}}});
  const entity={id:'Q109342457',labels:{en:{value:'Lord of Mysteries'},ar:{value:'لورد الغوامض'}},descriptions:{en:{value:'2018 Chinese web novel series'}},aliases:{en:[{value:'Lord of the Mysteries'}]},claims:{P31:[claim('Q1667921')],P50:[claim('Q110107880')]}};
  const w=api.mapWikidata(entity,{'Q110107880':{labels:{en:{value:'Cuttlefish'}}}},'All');
  assert.equal(w.type,'ويب نوفل');assert.equal(w.catalogLevel,'series');assert.equal(w.title,'Lord of Mysteries');
  assert.ok(w.altTitles.includes('لورد الغوامض'));assert.ok(w.altTitles.includes('Lord of the Mysteries'));
  assert.equal(w.auth,'Cuttlefish');assert.equal(w.ch,0);assert.equal(w.r,0);
  assert.equal(api.mapWikidata({...entity,id:'Q136052240',descriptions:{en:{value:'animated television series'}},claims:{P31:[claim('Q5398426')]}},{},'All'),null);
  assert.equal(api.mapWikidata(entity,{},'كوميكس'),null);
});

test('GCD maps series and collections separately and never treats edition variants as chapters',()=>{
  const api=load(),series={api_url:'https://www.comics.org/api/series/21965/',name:'Absolute Watchmen',year_began:2005,publishing_format:'collected edition',active_issues:['https://www.comics.org/api/issue/338481/','https://www.comics.org/api/issue/2379220/'],issue_descriptors:['','[Tenth Printing]']};
  const w=api.mapGcd(series,'All');assert.equal(w.id,'gcd-series-21965');assert.equal(w.catalogLevel,'collection');
  assert.equal(w.ch,0);assert.equal(w.editionCount,2);assert.equal(w.sourceLicense,'CC-BY-SA-4.0');
  assert.equal(w.sourceUrl,'https://www.comics.org/series/21965/');
  assert.equal(api.mapGcd({...series,api_url:'https://evil.test/api/series/21965/'},'All'),null);
  assert.equal(api.mapGcd(series,'رواية'),null);
});

test('new providers use bounded entity lookups, fixed endpoints and source type filtering',async()=>{
  const api=load(),calls=[];
  const client=api.create({fetchJson:async url=>{calls.push(url);if(url.includes('/search?'))return {searchResult:[{bbid,entityType:'Edition',defaultAlias:{name:'Watchmen'}},{bbid:'fake',entityType:'Author',defaultAlias:{name:'Writer'}}]};return {bbid,defaultAlias:{name:'Watchmen'}};},urlFor:(_p,url)=>url});
  const rows=await client.bookBrainz('Watchmen','All',1,50);assert.equal(rows.length,1);assert.equal(calls.length,2);
  assert.ok(calls[0].includes('size=6'));assert.ok(calls[1].startsWith('https://api.bookbrainz.org/1/edition/'));
});

test('entity scope prevents shared-series or title/author merging across works, editions and issues',()=>{
  const base={title:'Watchmen',auth:'Alan Moore',yr:1987,type:'Comics'};
  assert.equal(identity.sameWork({...base,id:'gcd-series-1',catalogLevel:'series',gcdSeriesId:1},{...base,id:'gcd-issue-2',catalogLevel:'issue',gcdSeriesId:1,issueNumber:'1'}),false);
  assert.equal(identity.sameWork({...base,id:'x',catalogLevel:'edition',isbn13:'9780000000001'},{...base,id:'y',catalogLevel:'edition',isbn13:'9780000000002'}),false);
  assert.equal(identity.sameWork({...base,id:'x',catalogLevel:'issue',issueNumber:'1'},{...base,id:'y',catalogLevel:'issue',issueNumber:'2'}),false);
  assert.equal(identity.sameWork({...base,id:'x',catalogLevel:'series',wikidataId:'Q1'},{...base,id:'y',catalogLevel:'series',wikidataId:'Q1'}),true);
});
test('metadata merging retains every source and license attribution',()=>{
 const identity=require('../modules/lorefy-catalog-identity.js');
 const a={id:'a',source:'Wikidata',sourceUrl:'https://www.wikidata.org/wiki/Q1',sourceLicense:'CC0'};
 identity.mergeRecord(a,{id:'b',source:'Grand Comics Database',sourceUrl:'https://www.comics.org/series/1/',sourceLicense:'CC-BY-SA-4.0'});
 assert.equal(a.catalogAttributions.length,2);assert.ok(a.catalogAttributions.some(r=>r.license==='CC-BY-SA-4.0'));
});
