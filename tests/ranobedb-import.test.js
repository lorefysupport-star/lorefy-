const test = require('node:test');
const assert = require('node:assert/strict');
const {decode,mapSeries} = require('../tools/import-ranobedb-dump');
const {selectNewWorks} = require('../tools/catalog-expansion-core');
const series={id:'42',start_date:'20200101',publication_status:'completed',description:'A story.',web_novel:'https://example.com/original'};
const metadata={titles:[{lang:'en',title:'A Story'}],tags:['Fantasy'],books:[{}],authors:['Writer'],images:[{nsfw:'f',spoiler:'f',filename:'cover.jpg'}]};

test('verified web originals stay distinct from print light novels without duplicating either format',()=>{
  const rows=mapSeries(series,metadata);
  assert.equal(rows.length,2);
  assert.equal(selectNewWorks([],rows,null,100).length,2);
  assert.equal(selectNewWorks(rows,rows,null,100).length,0);
  assert.equal(rows[1].provenance.webNovelUrl,series.web_novel);
});
test('RanobeDB rejects adult tags, post-2021 publications, unsafe covers and missing authors',()=>{
  assert.equal(mapSeries({...series,start_date:'20260101'},metadata).length,0);
  assert.equal(mapSeries(series,{...metadata,tags:['Erotic']}).length,0);
  assert.equal(mapSeries(series,{...metadata,images:[{nsfw:'t',spoiler:'f'}]}).length,0);
  assert.equal(mapSeries(series,{...metadata,authors:[]}).length,0);
  assert.equal(mapSeries(series,metadata)[0].contentRating,undefined);
});
test('COPY escape decoding preserves literal backslashes, tabs, nulls and line breaks',()=>{
  assert.equal(decode('\\N'),null);
  assert.equal(decode('a\\tb\\nc\\\\d'),'a\tb\nc\\d');
});

test('unknown publication dates cannot silently pass the pre-AI cutoff',()=>{
  for(const start_date of [undefined,'not-a-date','0','99999999']) {
    assert.equal(mapSeries({...series,start_date},metadata).length,0);
  }
});

test('a verified original-language title does not need an invented English translation',()=>{
  const rows=mapSeries({...series,olang:'ja'},{...metadata,titles:[{lang:'ja',title:'物語'}]});
  assert.equal(rows.length,2);assert.equal(rows[0].title,'物語');assert.equal(rows[0].language,'ja');
});
