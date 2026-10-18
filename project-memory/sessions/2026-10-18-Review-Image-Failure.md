---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"dc269b0","verified_on":"2026-10-18","related":["[[bugs/LF-061-Review-Image-Failure]]"]}
---
# إخفاقات تجهيز الصور في مسودة المراجعة

المرجعdc269b0 في Chrome: ملفPNG ببيانات غير صورية لم يرفق ولم يظهر
أي خطأ؛ input فارغ والمسودة باقية.23حالة نهائية أعيدت على المرجع
المحفوظ خارجGit:19فشل/4ضوابط. بعد المصدر163/163 مركزة،2000/2000
كاملة (123621ms،exit0). حالات المفتاح: read/error/abort/constructor،
decode،canvas null/draw/encode،أبعاد صفرية/غير محدودة وصورة رفيعة،
نوع غير صوري/نوع مجهول،فشل ثمcallback نجاح متأخر،وإعادة تحقق مالك.

5حالات واجهة390×844: PNG تالف EN ثم إعادة اختيارPNG صالح؛ ملف
نصي يرفض مع بقاء الصورة السابقة؛ PNG تالف AR؛ FileReader error
محقون AR؛ encode exception محقون EN. نص المسودة بقي،والصورة السابقة
بقيت في حالات الفشل التي سبقتها صورة،ولا pageerror في حالتي العطل
المحقونتين. أعيدت APIs الأصلية بعد كل fault. لم تضغط أزرار نشر.

جلسات demo مع منع الخدمات الخارجية. أهلية الإرفاق فُعلت كfixture
داخل جلسة ديمو محلية فقط؛ لا شراء أو entitlement من الخادم أو تغيير
لإعدادات المنتج. زر التقييم المرئي lf-chapter-quick-review فتح المحرر؛
الزر القديم المخفي لم يستعمل. لم تدخل بيانات حساب مستخدم في الدليل.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/
review-image-failure-final-before-tests.txt،review-image-failure-focused-tests.txt،
review-image-failure-full-tests.txt،review-image-failure-browser-{before,
after}.json،review-image-failure-en.png وreview-image-failure-parity.json.
review-image-failure-scope.json يثبت أنprefix/suffix التطبيق حولYn
مطابقان للمرجع.3أصول متطابقةSHA-256 في3أشجار،cachev511.
لا تغيير كتالوج أو خدمة أو build؛ تدقيق قارئ صور البروفايل وفشل
الصورة البديلة نفسها وأذونات الجهاز والرفع الحقيقي ما زال مستقلاً.

[[bugs/LF-061-Review-Image-Failure]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
