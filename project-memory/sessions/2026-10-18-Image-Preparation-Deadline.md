---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"78e1b61","verified_on":"2026-10-18","related":["[[bugs/LF-064-Image-Preparation-Deadline]]"]}
---
# تحديد مدة قراءة وفك صورة المستخدم

28 حالة جديدة قبل الإصلاح على 78e1b61:20 فشل و8 ضوابط،مع60 اختبارًا
سابقًا(88 إجمالًا). بعده103/103 مع15 لاختبار ملكية المراجعة؛343/343
مرتبطة و2076/2076 كاملة في64252.1473ms،exit0. تشمل read/decode
وavatar/banner واللغتين،المدة الإجمالية،نجاح/فشل وتنظيف المؤقت،النتيجة
المتأخرة،تبديل الحساب والمحرر،الطلب الأحدث واستقلال الحقول،وتحرير Save.
أضيفت ساعة وهمية للـfixtures القديمة؛ اختبارات الملكية بقيت كما هي.

Chrome390×844 بديمو معزول وخوادم خارجية محظورة،وملف SVG مصطنع12×8.
ست حالات تستدعي callback المهلة المسجل(30000ms) دون انتظار فعلي:
أربع حالات بروفايل AR/EN × read/decode تحفظ الصورة السابقة ثم ترسل
saveProfile وهميًا مرة وتغلق المحرر؛ حالتا مراجعة AR/read وEN/decode
تمنعان المرفق المتأخر ثم تعيدان اختيار الملف وتُرفقانه مع بقاء النص،بلا نشر.
اختبار سابع يترك ساعة Chrome فعلية: callback بعد30001.5ms ثم Save
يعمل مرة والمحرر يغلق. حُظرت الخدمة الحية ولم تُغيَّر عضوية مستخدم حقيقي.

تعثر fixture المراجعة أولًا لأن تهيئة الديمو المتأخرة أعادت premium إلى
false؛ صُحح بانتظار networkidle قبل إعداد علم QA المؤقت وأعيدت الحالتان.
فحص المؤقت الحقيقي حصل بعد اختفاء toast،لذلك استُبدل شرط رؤية الرسالة
المتأخر بقياس وقت callback واستعادة Save؛ الرسالة مرئية في الحالات الست
وصور البروفايل. هذا تصحيح فحص،ولا تغيير مصدر إضافي بعد المجموعة الكاملة.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/:
image-preparation-{before-tests,first-tests,focused-tests,full-tests}.txt،
image-preparation-browser-{before,after}.json وimage-preparation-real-clock.json،
image-preparation-profile-{ar,en}-{read,decode}.png،image-preparation-scope.json
وimage-preparation-parity.json. baseline خارجي مستقل؛ scope يثبت بقاء
كل التطبيق خارج Yn/Uo مطابقًا للمرجع؛9 ملفاتSHA-256 متطابقة(3 أصول
في3 أشجار)،cachev514. لا بناء أو نشر أو تغيير كتالوج/خدمة؛ لا إثبات
لأذونات Photos أو أداء canvas أو الرفع والمزامنة الفعليين.

[[bugs/LF-064-Image-Preparation-Deadline]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
