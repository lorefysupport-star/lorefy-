---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"46eaba8","verified_on":"2026-10-17","related":["[[bugs/LF-030-Profile-Mutation-Owner]]"]}
---
# عزل حفظ الملف والخصوصية وإكمال التسجيل

[17 اختباراً](../../tests/profile-mutation-owner.test.js) تشغّل Backend الحقيقي
بمخزن وauth/query/upload/RPC/sign وهمية مع انتظار يمكن التحكم به.
14 فشلت قبل الإصلاح ونجح حفظ المالك الحالي قبل وبعده. تغطي تغيير الحساب
والعميل وepoch، فشل auth وFK المتأخر، صورتي avatar/banner، توقيع الصور،
هوية الخصوصية والتفضيلات عند إكمال التسجيل. أضيف أيضاً رفض مالك auth
مختلف وطلب بلا مالك افتتاحي.

saveProfile وsetProfilePrivacy تلتقطان النطاق قبل أول انتظار، تتحققان من
auth user، ثم بعد كل انتظار؛ لا تبدأ صورة ثانية أو RPC أو توقيع تالٍ بعد
تغير المالك. إكمال التسجيل يتحقق قبل كتابة الهوية والتفضيلات وبعد push.
لا يغيّر ذلك صلاحيات الخادم أو يلغي RPC سبق إرساله.

أربعة اختبارات أسماء المستخدمين كانت تحاكي live دون تعيين user؛ أصبحت
تحدد المستخدم owner مثل واجهة التطبيق المسجل، وبقيت assertions نفسها.
المجموعات المرتبطة نجحت؛ الإيصال الكامل يضاف بعد نهاية تشغيله.

نُسخ backend/index/sw فقط، cache v480. الأدلة المحلية خارج Git في
D:/LorefyDevelopment/QA/remaining-repairs-20261017. لا حساب إنتاج،
مفاتيح، migrations، رفع صور حقيقية أو native build.

[[systems/Accounts-Sync]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

الإيصال النهائي: 1374/1374 اختباراً ناجحاً، صفر فشل، exit 0، نحو 264 ثانية. الديمو 390px فتح بلا pageerror. هذا دليل مصدر ومعاينة، لا فحص حفظ إنتاج أو جهاز.
