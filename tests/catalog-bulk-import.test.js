const test = require('node:test');
const assert = require('node:assert/strict');
const bulk = require('../tools/catalog-bulk-core');
const data = require('../modules/lorefy-catalog-data');
const policy = require('../modules/lorefy-catalog-policy');

test('author search tolerates initials and punctuation without matching unrelated authors', () => {
  const work = {id:'martin', title:'Fevre Dream', auth:'George R. R. Martin'};
  assert.equal(data.matchesCatalogQuery(work,'George Martin'),true);
  assert.equal(data.matchesCatalogQuery(work,'George R R Martin'),true);
  assert.equal(data.matchesCatalogQuery(work,'جورج مارتن'),true);
  assert.equal(data.matchesCatalogQuery(work,'George Tolkien'),false);
});
test('bulk taxonomy never relabels manga or serial fiction as western comics or novels', () => {
  assert.equal(bulk.classify({subjects:['Manga','Comic books, strips, etc.']}),'Manga');
  assert.equal(bulk.classify({subjects:['Light novels']}),'Light Novel');
  assert.equal(bulk.classify({subjects:['Web novels','Fantasy fiction']}),'Web Novel');
  assert.equal(bulk.classify({subjects:['Graphic novels']}),'Comics');
  assert.equal(bulk.classify({subjects:['Comic books, strips, etc., History and criticism']}),'Book');
  assert.equal(bulk.classify({subjects:['Fantasy fiction']}),'Novel');
  assert.equal(bulk.classify({subjects:['Superheroes','Fantasy fiction']}),'Novel');
  assert.equal(bulk.classify({subjects:['Short stories']}),null);
  assert.equal(bulk.classify({subjects:['History']}),'Book');
  assert.equal(bulk.classify({subjects:[]}),null);
});
test('only work records with real author names, covers and conservative pre-AI publication evidence import', () => {
  const record={key:'/works/OL42W',title:'Example',subjects:['Fantasy fiction'],covers:[42],first_publish_date:'1995',authors:[{author:{key:'/authors/OL8A'}}]};
  const authors=new Map([['/authors/OL8A',{name:'Example Writer'}]]);
  const work=bulk.mapWork(record,authors);
  assert.equal(work.id,'ol-OL42W');
  assert.equal(work.auth,'Example Writer');
  assert.equal(work.r,0);
  assert.deepEqual(work.authorKeys,['/authors/OL8A']);
  assert.equal(bulk.mapWork({...record,key:'/books/OL42M'},authors),null);
  assert.equal(bulk.mapWork({...record,first_publish_date:'2025'},authors),null);
  assert.equal(bulk.mapWork(record,new Map()),null);
  assert.equal(bulk.mapWork({...record,covers:[]},authors),null);
});
test('AI authorship filtering does not remove books about AI', () => {
  assert.equal(policy.isAiGeneratedWork({title:'Artificial Intelligence: A Modern Approach'}),false);
  assert.equal(policy.isAiGeneratedWork({aiGenerated:true}),true);
  assert.equal(policy.isAiGeneratedWork({tags:['AI-generated']}),true);
  assert.equal(policy.filterInPlace([{id:'bad',aiGenerated:true},{id:'good',title:'Machine learning'}]).length,1);
});

test('bulk comics retain verified subtitles without duplicating an already complete title', () => {
  const record={key:'/works/OL42W',title:'Batman',subtitle:'Year One',subjects:['Graphic novels'],covers:[42],first_publish_date:'1987',authors:[{author:{key:'/authors/OL8A'}}]};
  const authors=new Map([['/authors/OL8A',{name:'Frank Miller'}]]);
  const work=bulk.mapWork(record,authors);
  assert.equal(work.title,'Batman: Year One');
  assert.ok(work.altTitles.includes('Batman'));
  assert.equal(work.id,'ol-OL42W');
  assert.equal(bulk.mapWork({...record,title:'Batman: Year One'},authors).title,'Batman: Year One');
});
test('declared AI and erotic classifications are rejected in remote catalog paths',()=>{
  const fs=require('node:fs');
  const source=fs.readFileSync(require.resolve('../modules/lorefy-api-catalog'),'utf8');
  assert.equal((source.match(/isAiGeneratedWork\(work\)/g)||[]).length,3);
  assert.equal(policy.isExplicitWork({genres:['Erotic fiction']}),true);
  assert.equal(policy.isExplicitWork({genres:['Sex education']}),false);
});
test('dump parser rejects malformed records and editions', () => {
  assert.equal(bulk.parseDumpLine('bad'),null);
  assert.equal(bulk.parseDumpLine('/type/edition\t/books/OL42M\t1\tdate\t{}'),null);
  assert.equal(bulk.parseDumpLine('/type/work\t/works/OL42W\t1\tdate\t{"title":"Example"}').title,'Example');
});
test('large browser catalogs never use an unbounded splice argument list',()=>{
  const identity=require('../modules/lorefy-catalog-identity');
  const rows=Array.from({length:3000},(_,i)=>({id:`bulk-${i}`,title:`Distinct work ${i}`,auth:`Author ${i}`,type:'Book'}));
  rows.splice=function(...args){
    if(args.length>1024) throw new RangeError('browser argument limit');
    return Array.prototype.splice.apply(this,args);
  };
  identity.organizeCatalog(rows,{aliases:{}});
  assert.equal(rows.length,3000);
});
