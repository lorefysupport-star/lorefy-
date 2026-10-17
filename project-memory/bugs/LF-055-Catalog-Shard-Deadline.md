---
{"kind":"bug","id":"LF-055","status":"closed","priority":"P1","area":"catalog-shard-load-deadline","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"2839708","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Catalog-Shard-Deadline]]","next_action":"Continue fixed typo/edition matrix and image/metadata quality; physical device and live service checks remain separate"}
---
# LF-055: مهلة تحميل جزء الكتالوج

script لا يرسل load/error كان يبقي promise والـloading slot وطابور
الأجزاء معلقة. لكل جزء الآن مهلة20ثانية، ونتيجةfalse عند فشله أو
انتهاء المهلة؛ ليست مهلة إجمالية لكل دفعة أو كل شاشة.

8حالات:3نجاح و5فشل قبل؛136/136 مرتبطة بعد. finish مرة واحدة يحرر
المؤقت والـslot ويلغي callbacks العنصر الفاشل؛ callback قديم محفوظ
خارج العنصر لا يمس retry الجديد. النجاح لا يعاد تحميله، والطلبات
المتزامنة للجزء نفسه تشاركpromise واحدة. طابور النوع يتابع بعد الجزء
المعلق، وsearch يتحول إلى خطأ مع retry بدل انشغال دائم.

Chrome محلي: حُجز HTTP لجزء15 أثناء Allergic؛ المهلة80ms في fixture
فقط، ثم searching=false وloading=[] وsearchError=true وhasMore=true،
وأزيل script الفاشل. بعد إزالة الحجب والضغط على Try again نجح
التحميل بالمحاولة الثانية. لا تعديل بيانات حساب أو إصدار native.

[[sessions/2026-10-18-Catalog-Shard-Deadline]] | [[systems/Catalog-Search]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
