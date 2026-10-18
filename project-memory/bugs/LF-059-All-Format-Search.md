---
{"kind":"bug","id":"LF-059","status":"closed","priority":"P1","area":"all-format-catalog-search","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"e350551","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-All-Format-Search]]","next_action":"Continue cover/failure QA and explicit edition metadata review; device and live-service gates remain separate"}
---
# LF-059: بحث «الكل» لا يتحول إلى المانجا

searchIndexParts كان يعتبر كل قيمة عدا All نوعاً محدداً؛ «الكل» العربية
تسقط إلى Manga عبر normalizeRouteType، وهو default صحيح لبداية التصفح
لكنه خاطئ لبحث الأنواع كلها. شمل ذلك اكتشاف أجزاء روايات/كتب/كوميكس
غير محملة واقتراحات تصحيح أسمائها، حتى في الواجهة الإنجليزية التي تمرر
القيمة الداخلية العربية نفسها.

normalizeSearchType يميز All/الكل/case/مسافات/قيمة فارغة ويطبق
القيود فقط عند اختيار نوع محدد. تخطيط التصفح الأولي لم يتغير.
لا دمج عناوين أو تعديل IDs أو تحميل الكتالوج كله تلقائياً.

11 حالة جديدة:7فشل و4ضوابط قبل،11/11 بعد؛179/179 مرتبطة،
1960/1960 كاملة. متصفح:0قبل ثم2نتيجة لـThe Lord of the Rings
في AR/EN، وتصحيح Rigns إلى Rings في الواجهتين. ليست شهادة طبعات
أو حقوق أو جهاز؛ تستعمل الواجهة سياسة الهوية القائمة.

[[sessions/2026-10-18-All-Format-Search]] | [[systems/Catalog-Search]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
