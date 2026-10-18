---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"93f43e2","verified_on":"2026-10-18","related":["[[bugs/LF-062-Profile-Image-Editor]]"]}
---
# صور الحساب وإكمال الطلبات في محرر التخصيص

37حالة نهائية على مرجع93f43e2 خارجي:30فشل/7ضوابط. بعد المصدر
304/304 مرتبطة و2037/2037 كاملة (222826ms،exit0). يغطي العزل عند
read/decode/updater،حساب/إغلاق/استبدال،اختيارين لنفس الحقل وحقلين
مستقلين،preset،أخطاء القراءة والمعالجة والأبعاد،حدالحجم،waiting للصورة
قبلSave،حفظاً متأخراً،تسلسل الحساب نفسه،وقفل الحساب الجديد. ضوابط
التخطيط والقص والحدود الأصلية والحفظ الناجح والكتابات المؤجلة باقية.
اختبارprofile-layout القديم افترض قفلاًboolean؛ عُدل ليتحقق من commit
التخطيط بعدawait،وأضافت الاختبارات السلوكية إثباتاً فعلياً للملكيات.

Chrome390×844 وديمو محلي بخوادم خارجية محظورة. baseline: Image
مصطنعة مؤجلة تكمل بعدCancel/reopen/preset فاستبدلت الاختيار؛ بعد
الإصلاح بقيpreset. baseline ثانٍ:saveProfile محقون يؤجل الرد،ثمCancel
وreopen؛ إكمال الرد أغلق المسودة الجديدة. بعد الإصلاح بقيت وصارSave
جاهزاً بعد تحرير قفل الطلب القديم. لا ادعاء إلغاء كتابة خادم.

5حالات نهائية: صورة قديمة بعد إعادة الفتح؛ نتيجة حفظ بعد إعادة الفتح؛
Save ينتظر الصورة(0طلبات مبكرة)ثم يرسل/يحفظ الصورة المجهزة مرة واحدة
في backend وهمي؛ PNG تالف AR يبقي الصورة المختارة؛ FileReader error
محقون EN يبقي الصورة. أُعيدFileReader الأصلي؛ لم تستعمل حسابات حية
أو بيانات جهاز. تعثر locator مرة لأن fixture أغلقdetails المفتوح،
وصحح بفحصboolean.open ثم أعيدت الحالة؛ ليس عيب منتج.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/
profile-image-editor-final-before-tests.txt،profile-image-editor-focused-tests.txt،
profile-image-editor-full-tests.txt،profile-image-editor-browser-{before,
after,save-lifecycle}.json وprofile-image-editor-draft-ar.png (المسودة
بعد انقضاءtoast). profile-image-editor-scope.json يعيد مناطق التعديل
الخمس إلى المرجع ويثبت تطابق كل ما عداها؛profile-image-editor-parity.json
يثبت3أصول SHA-256 في3أشجار،cachev512. لا بناء أو خدمة أو migration
أو تغيير محتوى الكتالوج؛ أذوناتPhotos ورفع فعلي/RLS بحسابين مستقلان.

[[bugs/LF-062-Profile-Image-Editor]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
