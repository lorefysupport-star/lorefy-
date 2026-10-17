---
{"kind":"bug","id":"LF-056","status":"closed","priority":"P1","area":"controlled-search-field-lifecycle","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"d3dafa7","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Search-Field-Lifecycle]]","next_action":"Current favorites editor has an independent RTL input; fix its mixed-script direction separately. Typo/edition matrix and VoiceOver remain separate"}
---
# LF-056: البحث يحفظ الكتابة والتركيز أثناء التحديث

SearchBox يُعرَّف داخل App وكان يُركب من جديد عند تحديث الأب؛ يلغي
ذلك debounce ويعيد initial القديم. كذلك capture listener في loader
كان يحدّث React قبل استهلاك onChange للقيمة، فيعيد القيمة القديمة.
الاختبار الفعلي فقد Berserk حتى دون تغيير لغة الواجهة.

الاستخدامان القديمان (البحث ومحرر المفضلة fallback) يستخدمان الآن
LorefyStableInline القائم. تأجيل جدولة البحث إلى ما بعد حدث الكتابة
يسمح للحقل بتثبيت القيمة أولاً، مع تجاهل الحقل المفصول عن DOM.
الاتجاه dir=auto وtextAlign=start، ومسح البحث له اسم AR/EN وtype=button
ويعيد التركيز. حجم الخط16 والهدف44px محفوظان كما أثبتهما المتصفح.

قبل6اختبارات الحقل:5فشل و1نجاح؛ اختبارا ترتيب الحدث والانفصال فشلا
قبل إصلاح loader. بعد144/144 مرتبطة. متصفح:4تركيبات لغةواجهة/لغةنص
مع refresh صريح ثم التزامURL بالنص الصحيح، ومسح مع تركيز في اللغتين.
المفضلة الحالية محرر DOM مستقل عن SearchBox؛ حفظها للكتابة ثبت لكن
اتجاهها RTL للنص اللاتيني بقي للمتابعة، لا ادعاء إصلاحه بهذه الدفعة.

[[sessions/2026-10-18-Search-Field-Lifecycle]] | [[systems/Catalog-Search]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
