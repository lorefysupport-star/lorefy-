---
{"kind":"bug","id":"LF-054","status":"closed","priority":"P1","area":"catalog-search-worker-deadline","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"17a43d2","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Catalog-Search-Deadline]]","next_action":"Inspect hanging raw shard load/queue and fixed typo/edition matrix; no new native build or service deployment"}
---
# LF-054: البحث المعلق يصل إلى مسار بديل أو خطأ

Worker صامت أو fetch/قراءة جسم الفهرس بلا نهاية كان يبقي searching=true.
9 حالات قبل:7فاشلة و2ناجحة. بعد الإصلاح128/128 مرتبطة و3سيناريوهات
Chrome مستقلة. لكل مرحلة مهلة20ثانية: Worker ثم fallback عند فشله؛
قد يستغرق المسار المتسلسل40ثانية قبل الخطأ، ولا تشمل المهلة تحميل
raw script shard الذي يبقى بنداً مستقلاً.

مؤقت كل طلب يُلغى عند نجاحه أو فشله. Worker المعطل يوقف نفسه ويفرغ
طلباته فقط؛ رسالته/خطؤه المتأخر لا يمس Worker أحدث. fetch مع signal
قابل للإلغاء عند توفر AbortController؛ المهلة تبقى حتى بدونه. لا نتيجة
قديمة تغير حالة البحث الحالي. تعديلات fixtures تميّز مؤقتات المهلة عن
أزمنة debounce السريعة؛ اختبارات المهلة تستخدم ساعة مضبوطة لا انتظاراً.

[[sessions/2026-10-18-Catalog-Search-Deadline]] | [[systems/Catalog-Search]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
