const test=require('node:test'),assert=require('node:assert/strict'),{harness,flush}=require('./helpers/import-dialog');
async function preview(lang='en'){
 const h=harness(lang);h.works.push({id:'edition',title:'FIRST',type:'Comic'});
 h.hooks.fetch=async()=>({rows:h.works.slice(0,2).map(work=>({work,status:'done',review:'Keep this written review'})),misses:0});h.start();await flush();return h;
}
for(const lang of ['ar','en']){
 test('import match artwork follows the selected edition in '+lang,async()=>{
  const h=await preview(lang),row=h.find('lf-im-preview-row'),select=row.querySelector('select'),old=row.querySelector('img'),details=row.querySelector('details');select.focus();select.value='edition';select.handlers.change();
  assert.equal(row.querySelector('img').attrs.alt,'FIRST');assert.equal(old.parentNode,null);assert.equal(row.querySelector('select'),select);assert.equal(h.doc.activeElement,select);assert.equal(row.querySelector('details'),details);assert.equal(h.writes.length,0);
 });
 test('skipped import artwork clears and returns with the current match in '+lang,async()=>{
  const h=await preview(lang),row=h.find('lf-im-preview-row'),select=row.querySelector('select');select.value='';select.handlers.change();assert.equal(row.querySelector('img'),null);assert.ok(row.querySelector('.lf-ml-result-cover'));
  select.value='edition';select.handlers.change();assert.equal(row.querySelector('img').attrs.alt,'FIRST');select.value='first';select.handlers.change();assert.equal(row.querySelector('img').attrs.alt,'First');assert.equal(row.children.length,3);
  h.find('lf-im-confirm').click();assert.equal(h.writes[0][0].work.id,'first');assert.equal(h.writes[0][0].review,'Keep this written review');
 });
}
