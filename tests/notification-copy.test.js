const test=require('node:test'),assert=require('node:assert/strict'),i18n=require('../modules/lorefy-i18n.js');
for(const lang of ['ar','en'])test('notification empty state and mark-read action match '+lang,()=>{
 for(const [ar,en] of [['قراءة الكل','Mark all as read'],['لا إشعارات بعد','No notifications yet']]){
  assert.equal(i18n.translate(ar,lang),lang==='en'?en:ar);
  assert.equal(i18n.translate(ar+' ',lang).trim(),lang==='en'?en:ar);
 }
});
