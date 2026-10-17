const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-growth-features.js'),'utf8');
function harness(){
  const works=[{id:'first',title:'First'},{id:'second',title:'Second'},{id:'quoted',title:'A, "Quoted" Story'},{id:'arabic',title:'حكاية عربية'},{id:'multiline',title:'A Story'}];
  const scope={uiText:(ar,en)=>en,imFindByTitle:t=>works.find(w=>w.title===String(t).replace(/\s+/g,' ').trim()),
    IM_READING:'reading',IM_DONE:'done',IM_WISH:'wish',IM_PAUSED:'paused',IM_DROPPED:'dropped'};
  const start=source.indexOf('  function imParseCsvLine('),end=source.indexOf('  /* Kitsu',start);
  vm.runInNewContext(source.slice(start,end),scope);return scope;
}
test('a Goodreads multiline review is one record and cannot become another imported work',()=>{
  const h=harness(),out=h.imParseGoodreads('Title,My Rating,Exclusive Shelf,My Review\r\nFirst,4,read,"A note\r\nSecond,1,to-read\r\nEnd"\r\n');
  assert.deepEqual(Array.from(out.rows,r=>r.work.id),['first']);assert.equal(out.misses,0);assert.equal(out.rows[0].score,4);assert.equal(out.rows[0].status,'done');
});
test('generic multiline text does not create phantom matches or unmatched rows',()=>{
  const h=harness(),out=h.imParseGenericCsv('Title,Status,Rating,Notes\nFirst,reading,4.25,"A note\nSecond,paused,1\nEnd"\n','done');
  assert.deepEqual(Array.from(out.rows,r=>r.work.id),['first']);assert.equal(out.misses,0);assert.equal(out.rows[0].score,4.25);
});
test('accepted TSV exports detect unquoted tabs and preserve status and fractional rating',()=>{
  const h=harness(),out=h.imParseGenericCsv('\uFEFFTitle\tRead Status\tStar Rating\r\nFirst\tcurrently-reading\t4.25\r\nSecond\tto-read\t3.5\r\n','done');
  assert.deepEqual(Array.from(out.rows,r=>r.work.id),['first','second']);assert.equal(out.rows[0].status,'reading');assert.equal(out.rows[1].status,'wish');assert.equal(out.rows[0].score,4.25);assert.equal(out.rows[1].score,3.5);assert.equal(out.misses,0);
});
test('quoted multiline titles are matched as a single title',()=>{
  const h=harness(),out=h.imParseGenericCsv('Title,Status,Rating\n"A\nStory",reading,4.75\n','done');
  assert.equal(out.rows.length,1);assert.equal(out.rows[0].work.id,'multiline');assert.equal(out.rows[0].score,4.75);assert.equal(out.misses,0);
});
for(const method of ['imParseGoodreads','imParseGenericCsv'])test(method+': an unfinished quoted field rejects the whole file',()=>{
  const h=harness();assert.throws(()=>h[method]('Title,My Rating,Exclusive Shelf\nFirst,4,read\n"Second,5,read'),/quote|CSV|صيغة|اقتباس/i);
});
test('commas and doubled quotes inside a title remain intact and do not affect column detection',()=>{
  const h=harness(),out=h.imParseGenericCsv('Title,Status,Rating\n"A, ""Quoted"" Story",paused,4.25\n','done');
  assert.equal(out.rows[0].work.id,'quoted');assert.equal(out.rows[0].status,'paused');assert.equal(out.rows[0].score,4.25);
});
test('BOM, CRLF, blank rows, Arabic titles and actual unmatched titles keep their counts',()=>{
  const h=harness(),out=h.imParseGoodreads('\uFEFFTitle,My Rating,Exclusive Shelf\r\n\r\nحكاية عربية,3,to-read\r\nUnknown,0,read\r\n');
  assert.equal(out.rows.length,1);assert.equal(out.rows[0].work.id,'arabic');assert.equal(out.rows[0].status,'wish');assert.equal(out.misses,1);
});
test('a tab inside a quoted CSV header does not turn comma-separated content into TSV',()=>{
  const h=harness(),out=h.imParseGenericCsv('Title,Status,Rating,"Notes\tText"\nFirst,reading,4.5,"line\tother"\n','done');
  assert.equal(out.rows[0].work.id,'first');assert.equal(out.rows[0].score,4.5);
});

test('TSV detection ignores leading blank lines, including tab-only rows',()=>{
  const h=harness(),out=h.imParseGenericCsv('\r\n\t\r\nTitle\tStatus\tRating\r\nFirst\treading\t4.25\r\n','done');
  assert.equal(out.rows.length,1);assert.equal(out.rows[0].work.id,'first');assert.equal(out.misses,0);
});
test('CR-only record separators are supported without splitting quoted content',()=>{
  const h=harness(),out=h.imParseGenericCsv('Title,Status,Rating,Notes\rFirst,reading,4.25,"a\rb"\rSecond,to-read,3.5\r','done');
  assert.deepEqual(Array.from(out.rows,r=>r.work.id),['first','second']);assert.equal(out.misses,0);
});
