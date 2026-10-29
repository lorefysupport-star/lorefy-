const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function apiFor(response){
 const requests=[],scope={URL,URLSearchParams,Map,Set,Promise,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{requests.push(String(url));return{ok:true,json:async()=>response(String(url),options)||{}};}};scope.window=scope;
 vm.runInNewContext(fs.readFileSync('modules/lorefy-cover-api.js','utf8'),scope);
 return {api:scope.LorefyCoverAPI,requests};
}
const plain=v=>JSON.parse(JSON.stringify(v));
test('edition choices reuse the exact alternate lookup and preserve original image URLs',async()=>{
 const {api,requests}=apiFor(url=>url.includes('editions.json')?{entries:[{key:'/books/OL123M',publishers:['Example Press'],publish_date:'1998',languages:[{key:'/languages/eng'}],isbn_13:['9780000000001'],covers:[123]}]}:{});
 const work={id:'ol-works-OL123W',openLibraryId:'OL123W',title:'Actual title',type:'Novel',sourceCoverUrl:'https://covers.openlibrary.org/b/id/123-L.jpg'};
 const [rows,urls]=await Promise.all([api.choices(work),api.alternates(work)]);
 assert.deepEqual(plain(rows.map(r=>r.img)),plain(urls));assert.equal(requests.length,1);
 const row=rows.find(r=>r.img===work.sourceCoverUrl);
 assert.deepEqual(plain(row.details),{source:'Open Library',edition:'OL123M',publisher:'Example Press',published:'1998',language:'eng',isbn:'9780000000001'});
 row.details.publisher='mutated';assert.equal((await api.choices(work))[0].details.publisher,'Example Press');
});
test('MangaDex volume and language belong to each image, not to the whole work',async()=>{
 const {api}=apiFor(url=>url.includes('/manga?')?{data:[{id:'series',attributes:{title:{en:'Actual title'}},relationships:[]}]}:url.includes('/cover?')?{data:[{attributes:{fileName:'one.jpg',volume:'1',locale:'ja'}},{attributes:{fileName:'two.jpg',volume:'2',locale:'en'}}]}:{});
 const rows=await api.choices({id:'manga',title:'Actual title',type:'Manga'});
 const volumes=rows.filter(r=>r.details.source==='MangaDex');assert.equal(volumes.length,2);
 assert.equal(volumes[0].details.volume,'1');assert.equal(volumes[1].details.volume,'2');assert.equal(volumes[1].details.language,'en');
});
test('Google edition metadata is retained without new lookups or title policy changes',async()=>{
 const {api,requests}=apiFor(url=>url.includes('googleapis.com')?{totalItems:1,items:[{id:'GB1',volumeInfo:{title:'Actual title',publisher:'Another Press',publishedDate:'2020-03',language:'fr',industryIdentifiers:[{type:'ISBN_13',identifier:'9780000000002'}],imageLinks:{thumbnail:'https://books.google.com/books/content?id=GB1&zoom=1'}}}]}:{});
 const rows=await api.choices({id:'book',title:'Actual title',auth:'Writer',type:'Novel'}),row=rows.find(r=>r.details.source==='Google Books');
 assert.equal(row.details.edition,'GB1');assert.equal(row.details.publisher,'Another Press');assert.equal(row.details.language,'fr');assert.equal(row.details.isbn,'9780000000002');
 assert.equal(requests.filter(u=>u.includes('googleapis.com')).length,1);
});
test('unprovided edition metadata remains unknown and source URLs are not reinterpreted as an edition',async()=>{
 const {api}=apiFor(()=>({}));const rows=await api.choices({id:'book',title:'Actual',type:'Novel',sourceCoverUrl:'https://cdn.myanimelist.net/images/manga/1/123.jpg'});
 assert.equal(rows[0].details.source,'MyAnimeList');assert.equal(rows[0].details.edition,undefined);assert.equal(rows[0].details.volume,undefined);
 assert.deepEqual(plain(api.describe('data:image/png;base64,AAAA')),{source:'local'});
 assert.deepEqual(plain(api.describe('javascript:alert(1)')),{});
});
test('a shared image is not mislabeled as one of several conflicting editions',async()=>{
 const {api}=apiFor(url=>url.includes('editions.json')?{entries:[{key:'/books/OL1M',publishers:['First'],covers:[123]},{key:'/books/OL2M',publishers:['Second'],covers:[123]}]}:{});
 const rows=await api.choices({id:'OL123W',title:'Actual',type:'Novel'});
 assert.equal(rows.length,1);assert.equal(rows[0].details.source,'Open Library');assert.equal(rows[0].details.edition,undefined);assert.equal(rows[0].details.publisher,undefined);
});
test('compiled picker normalization preserves choice details through proxy rewriting',()=>{
 const source=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
 const start=source.indexOf('normalizeCoverChoices=e=>'),end=source.indexOf(',_esc=',start),scope={window:{LorefyCoverAPI:{uniqueChoices:rows=>rows.map(r=>r.img),displayUrl:url=>'/api/media?url='+encodeURIComponent(url),dedupeKey:url=>url}}};
 vm.runInNewContext('var normalize='+source.slice(start+'normalizeCoverChoices='.length,end),scope);
 const details={source:'Open Library',edition:'OL1M',publisher:'Press'},rows=scope.normalize([{img:'https://covers.openlibrary.org/b/id/1-L.jpg',details}]);
 assert.deepEqual(plain(rows[0].details),details);assert.match(rows[0].img,/^\/api\/media/);
 assert.match(source,/t\.choices\?t\.choices\(r\):t\.alternates\(r\)/);
});
test('cover studio preserves metadata, labels missing editions honestly, and does not change work identity',()=>{
 const studio=require('../modules/lorefy-work-panels.js'),rows=studio.coverChoices([{img:'a.jpg',label:'A',details:{source:'Open Library',edition:'OL1M'}}],'a.jpg','Current');
 assert.equal(rows[0].details.edition,'OL1M');
 assert.match(studio.coverDescription(rows[0],'en'),/Open Library/);assert.match(studio.coverDescription({img:'x'},'en'),/Edition not provided/);
 assert.match(studio.coverDescription({details:{source:'MangaDex',volume:'2'}},'en'),/Volume 2/);
 assert.match(studio.coverDescription({details:{source:'local'}},'ar'),/صوري/);
 const source=fs.readFileSync('modules/lorefy-work-panels.js','utf8');assert.match(source,/lf-cover-studio-details/);assert.match(source,/p\.onApply\(value\)/);assert.doesNotMatch(source,/setItem|work\.id\s*=/);
});
