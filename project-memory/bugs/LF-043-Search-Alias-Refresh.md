---
{"kind":"bug","id":"LF-043","status":"closed","priority":"P1","area":"catalog-search-cache","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"38bc374","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Search-Alias-Refresh]]","next_action":"Typo recovery, provider outage and installed-device timing remain independent gates"}
---
# LF-043: الأسماء البديلة المعدلة لا تبقى عالقة في فهرس البحث

فهرس السجلات compact كان يقارن عدد الأسماء البديلة فقط. تعديل محتواها
مع العدد نفسه يبقي التطابق القديم ويتجاهل الجديد، حتى عند تعديل كائن alias.
[المصدر](../../modules/lorefy-catalog-data.js) يقارن المحتوى الخام أيضاً؛
عند تغيره يبني الفهرس ويستبدل prepared، ويعيد استعماله حين يستقر المحتوى.
لا تغيير لمعرّف العمل أو دمج للطبعات أو تطابق الكلمات عبر العنوان والمؤلف.

15 حالة جديدة (14 فشلت قبل الإصلاح)، 74/74 مرتبطة ناجحة.
fixture الكائن المعدل يستخدم عنواناً مستقلاً حتى لا يعتبر تطابق عنوان
ومؤلف صحيح عبر الكلمات خطأ cache. Chrome المعزول أكد الاسم العربي
الجديد وغياب القديم واستقرار المعرّف وإعادة استعمال الفهرس.

[[sessions/2026-10-17-Search-Alias-Refresh]] | [[systems/Catalog-Search]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
