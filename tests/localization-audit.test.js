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

test('native sign-in errors translate completely and preserve the Arabic message', () => {
  const i18n = require('../modules/lorefy-i18n.js');
  for (const message of ['تم إلغاء تسجيل الدخول بواسطة Google.', 'تم إلغاء تسجيل الدخول بواسطة Apple.', 'تعذر تسجيل الدخول بواسطة Google حالياً. تحقق من اتصالك وحاول مجدداً.', 'تعذر تسجيل الدخول بواسطة Apple حالياً. تحقق من اتصالك وحاول مجدداً.', 'تسجيل الدخول غير جاهز. أعد فتح التطبيق وحاول مجدداً.', 'انتهت مهلة تسجيل الدخول. حاول مجدداً.']) {
    assert.doesNotMatch(i18n.translate(message, 'en'), /[\u0600-\u06ff]/);
    assert.equal(i18n.translate(message, 'ar'), message);
  }
});

test('native photo selection error follows the active interface language', () => {
  const message = 'تعذر اختيار الصورة. حاول مرة أخرى من مكتبة الصور.';
  const node = { nodeValue:message, parentElement:{closest:()=>null} };
  i18n.textNode(node, 'en');
  assert.equal(node.nodeValue, 'Could not select the image. Try again from your photo library.');
  i18n.textNode(node, 'ar');
  assert.equal(node.nodeValue, message);
});


test('public profile follow actions use the selected interface language', () => {
  for (const [ar,en] of [['متابعة','Follow'],['متابَع','Following'],['إلغاء المتابعة','Unfollow']]) {
    const node = {nodeValue:ar,parentElement:{closest:()=>null}};
    i18n.textNode(node,'en');
    assert.equal(node.nodeValue,en);
    i18n.textNode(node,'ar');
    assert.equal(node.nodeValue,ar);
  }
});


test('library save toast translates the complete status phrase', () => {
  assert.equal(i18n.translate('مثال: 1150','en'),'Example: 1150');
  assert.equal(i18n.translate('إزالة من كل خانات القراءة','en'),'Remove from all reading lists');
  assert.equal(i18n.translate('ملاحظة قصيرة: نهاية الآرك الثاني...','en'),'Short note: end of the second arc...');
  for (const [ar,en] of [['أقرأ حالياً','Reading'],['تم القراءة','Completed'],['قائمة الأمنيات','Wishlist'],['توقف','Paused']]) {
    const text='أُضيف إلى"'+ar+'"';
    const node={nodeValue:text,parentElement:{closest:()=>null}};
    i18n.textNode(node,'en');
    assert.equal(node.nodeValue,'Added to '+en);
    i18n.textNode(node,'ar');
    assert.equal(node.nodeValue,text);
  }
  assert.equal(i18n.translate('أُضيف إلى"a user title"','en'),'أُضيف إلى"a user title"');
});
