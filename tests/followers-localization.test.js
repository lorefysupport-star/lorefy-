const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const i18n=require('../modules/lorefy-i18n.js');
test('connection dialog supplies complete Arabic and English copy including counters and empty states',()=>{
  const ar=i18n.connections('ar',12,7),en=i18n.connections('en',12,7);
  assert.equal(en.followers,'Followers (12)'); assert.equal(en.following,'Following (7)');
  for(const value of Object.values(en)) assert.doesNotMatch(value,/[\u0600-\u06ff]/);
  for(const value of Object.values(ar)) assert.doesNotMatch(value,/[a-z]/i);
  assert.match(ar.followers,/12/); assert.match(ar.following,/7/);
  assert.notEqual(en.emptyFollowers,en.emptyFollowing);
});
test('followers render translated source strings without a post-render translation race',()=>{
  const source=fs.readFileSync(require('node:path').join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
  assert.match(source,/LorefyI18n\.connections\(W,_o,Ht\)/);
  assert.match(source,/className:"nc-sheet lf-followers-dialog",[^}]*"data-no-translate":true/);
});
test('connection dialog action text contrasts with the selected theme',()=>{
  const source=fs.readFileSync(require('node:path').join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
  const section=source.slice(source.indexOf('mr=()=>{if(!Fo)'),source.indexOf(',vr=()=>'));
  assert.match(section,/color:d\?C.sub:C.onAccent/);
  assert.match(section,/color:t===o\?C.onAccent:C.sub/);
});
test('community tabs do not use English labels in the Arabic branch',()=>{
  const source=fs.readFileSync(require('node:path').join(__dirname,'../modules/lorefy-community.js'),'utf8');
  assert.match(source,/: \{ all:"لك", friends:"أتابعهم", mine:"منشوراتي"/);
});
test('late accessible labels and negative recommendation badges are fully localized',()=>{
  const source=fs.readFileSync(require('node:path').join(__dirname,'../uploads/files/lorefy-app.js'),'utf8');
  assert.match(source,/attributeFilter:\["placeholder","aria-label","title"\]/);
  assert.equal(i18n.translate('لا يوصي بها','en'),'Not recommended');
  assert.equal(i18n.translate('إزالة من هذه الخانة','en'),'Remove from slot');
  assert.equal(i18n.translate('لا توجد حسابات بعد','en'),'No accounts yet');
});
test('unchanged translations do not cause mutation loops and Arabic is restored on language change',()=>{
  let text='تعليق',writes=0;const node={parentElement:{closest:()=>null,textContent:'تعليق'},get nodeValue(){return text;},set nodeValue(value){writes++;text=value;}};
  i18n.textNode(node,'en');assert.equal(text,'Comment');assert.equal(writes,1);
  i18n.textNode(node,'en');assert.equal(writes,1);
  i18n.textNode(node,'ar');assert.equal(text,'تعليق');assert.equal(writes,2);
  i18n.textNode(node,'ar');assert.equal(writes,2);
});
