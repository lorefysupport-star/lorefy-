const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../modules/lorefy-product-core.js');
test('author identity recognizes surname-first without merging similar names',()=>{
  const works=[{id:'a',au:'Togashi, Yoshihiro',yr:1998},{id:'b',author:'Yoshihiro Togashi',yr:1990},{id:'c',au:'Yoshihiro Other Togashi'}];
  assert.deepEqual(core.authorWorks(works,'Togashi, Yoshihiro').map(x=>x.id),['b','a']);
});
test('bibliography includes attributed coauthors and deduplicates work identity',()=>{
  const works=[{id:'a',authors:['George R. R. Martin','Other Writer']},{id:'a',au:'George R. R. Martin'},{id:'b',au:'George Martin'}];
  assert.deepEqual(core.authorWorks(works,'George R. R. Martin').map(x=>x.id),['a']);
});
test('generic missing-author metadata cannot become a fictional author page',()=>{
  for(const author of ['',null,'Unknown','ويب نوفل صيني','رواية إنجليزية']) assert.deepEqual(core.authorWorks([{id:'a',au:author}],author),[]);
});
test('bibliography uses the actual runtime auth field',()=>{
  assert.equal(core.authorWorks([{id:'hunter',auth:'Togashi, Yoshihiro'}],'Togashi, Yoshihiro').length,1);
});

test('Arabic author pages ignore Arabic commas, diacritics, tatweel and alef variants',()=>{
  const works=[{id:'a',auth:'محفوظ، نجيب،'},{id:'b',auth:'نَـجيب محفوظ'},{id:'other',auth:'نجيب كاتب آخر'}];
  assert.deepEqual(core.authorWorks(works,'نجيب محفوظ').map(w=>w.id),['a','b']);
  assert.equal(core.authorWorks([{id:'c',auth:'أحمد خالد توفيق'}],'احمد خالد توفيق').length,1);
});
test('author action can arrive after the detail toolbar has mounted',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-product-tools.js'),'utf8');
  const toolbar={},content={querySelector:()=>toolbar},detail={querySelector:()=>content};
  let enhanced=0;
  const scope={doc:{querySelector:()=>detail},currentWork:()=>({id:'work',auth:'Writer'}),enhanceAuthor:()=>{enhanced++;}};
  const start=source.indexOf('  function enhanceDetail(');
  vm.runInNewContext(source.slice(start,source.indexOf('  function openAuthor(',start)),scope);
  scope.enhanceDetail(); assert.equal(enhanced,1);
});
