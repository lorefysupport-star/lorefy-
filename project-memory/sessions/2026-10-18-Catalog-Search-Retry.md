---
{"kind":"session","status":"verified-source","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"b2b8fed","verified_on":"2026-10-18","related":["[[bugs/LF-053-Catalog-Search-Retry]]"]}
---
# استعادة البحث بعد خطأ الفهرس أو النتائج

المصدر: modules/lorefy-catalog-loader.js، modules/lorefy-explore-studio.js،
styles/lorefy-explore-studio.css وuploads/files/lorefy-app.js.

سجل قبل: 7/9 فاشلة، 2 ناجحة. بعد:11/11 جديدة و86/86 مرتبطة. يشمل
فشل الفهرس وإعادة نفس النص، فشل جزء/دفعة جزئية مع عدم إعادة الأجزاء
الناجحة، حفظ النوع، لا بحث فارغ ولا تكرار أثناء pending، رد فهرس قديم
وفشل جزء قديم بعد بحث أحدث، وتمييز empty الناجح، وفشل Worker ثم fallback.

المتصفح المعزول:5 مسارات. Search باللغتين يخفي No results وقت الخطأ
ويعيد الطلب بالنص نفسه بزر مسمى. استكشف المدمج ونوع Book يعرضان الخطأ
والـretry الصحيحين. حُجب raw part15 أثناء البحث Allergic: searchError
true وhasMore true، وبعد استعادته حُمّل الجزء وزال الخطأ (محاولتان).
لا استنتاج سلامة provider بعيد أو تشغيل Push أو مزامنة حية من هذه الأدلة.

تجربة المتصفح الأولى بعد تعديل المصدر حملت loader قديم queryv502 بينما
واجهة الزر جديدة؛ حُدّثت روابط الأصول إلىv503 واستُخدم سياق جديد، ثم
نجحت الحالات. ليست هذه النتيجة فشلاً متبقياً في retrySearch الجديد.
6 أصول فقط متطابقة SHA-256 في الأشجار الثلاث، دون بناء أو مولد كتالوج.

الدليل خارج Git: D:/LorefyDevelopment/QA/remaining-repairs-20261017/
search-retry-before-tests.txt، search-retry-after-tests.txt،
search-retry-focused-tests.txt، search-retry-browser-before.json،
search-retry-browser.json وsearch-retry-parity.json. المجلد بدأ في17أكتوبر؛
هذه الجولة ونتائجها في18أكتوبر بتوقيت الرياض.

[[bugs/LF-053-Catalog-Search-Retry]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

الفحص الكامل الأول:1892/1894، فشلان في توقعات مفاتيح الكاش القديمة
(ui-unity وcomics-progress). صُحح توقع main إلى مفتاح الإصلاح الحالي،
وصار اختبار Worker يقارن مفتاحيه الفعليين في SW مع workerVersion،
ولا يربطهما قسراً بمفتاح ملف loader المستقل. 24/24 بعد التصحيح؛ يعاد
الكامل في search-retry-full-tests-final.txt. هذا ليس إسقاطاً لفحص الهوية.

- LF-053: **1894/1894** كاملة نهائية، صفر فشل، exit 0؛ search-retry-full-tests-final.txt. الملفات الـ9 المراقبة بقيت SHA-256 وmtime كما كانت. [[sessions/2026-10-18-Catalog-Search-Retry]]
