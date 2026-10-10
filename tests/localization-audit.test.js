const test=require('node:test');
const assert=require('node:assert/strict');
const i18n=require('../modules/lorefy-i18n.js');
test('chapter editor and favorite messages translate as complete phrases',()=>{
  for(const [ar,en] of [['تقييمك وتعليقك','Your rating and comment'],['اختر تقييمك','Choose your rating'],['أفضل الشخصيات','Favorite characters'],['فتح اللوحة','Open dashboard'],['ابحث عن شخصية…','Search characters...']]) {
    assert.equal(i18n.translate(ar,'en'),en);
  }
});
test('legacy dictionary cannot turn unknown phrases into hybrid system copy',()=>{
  const node={nodeValue:'تقييمك ونص غير معروف',parentElement:{closest:()=>null}};
  i18n.textNode(node,'en',n=>{n.nodeValue=n.nodeValue.replace('تقييمك','Your rating');});
  assert.equal(node.nodeValue,'تقييمك ونص غير معروف');
});
