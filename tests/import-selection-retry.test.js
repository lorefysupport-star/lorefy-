const test=require('node:test'),assert=require('node:assert/strict'),{harness,flush}=require('./helpers/import-dialog');
async function preview(lang='en'){
 const h=harness(lang);h.hooks.fetch=async()=>({rows:h.works.map(work=>({work,status:'done'})),misses:0});h.start();await flush();return h;
}
for(const lang of ['ar','en'])test('failed import can include a previously skipped match on retry in '+lang,async()=>{
 const h=await preview(lang),select=h.find('lf-im-preview').querySelectorAll('select')[0];select.value='';select.handlers.change();h.hooks.saveError=Error('quota');h.find('lf-im-confirm').click();assert.equal(h.find('lf-im-confirm').disabled,false);assert.equal(h.writes[0].length,1);
 select.value='first';select.handlers.change();h.hooks.saveError=null;h.find('lf-im-confirm').click();assert.deepEqual(Array.from(h.writes.at(-1),row=>row.work.id),['first','second']);
});
test('all skipped matches remain editable after a recoverable save error',async()=>{
 const h=await preview(),selects=h.find('lf-im-preview').querySelectorAll('select');for(const select of selects){select.value='';select.handlers.change();}h.hooks.saveError=Error('quota');h.find('lf-im-confirm').click();
 selects[1].value='second';selects[1].handlers.change();h.hooks.saveError=null;h.find('lf-im-confirm').click();assert.deepEqual(Array.from(h.writes.at(-1),row=>row.work.id),['second']);
});
test('each retry uses current choices, not a prior filtered snapshot',async()=>{
 const h=await preview(),selects=h.find('lf-im-preview').querySelectorAll('select');h.hooks.saveError=Error('quota');
 selects[0].value='';selects[0].handlers.change();h.find('lf-im-confirm').click();selects[0].value='first';selects[0].handlers.change();selects[1].value='';selects[1].handlers.change();h.find('lf-im-confirm').click();assert.deepEqual(Array.from(h.writes.at(-1),row=>row.work.id),['first']);
});
