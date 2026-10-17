---
{"kind":"bug","id":"LF-053","status":"closed","priority":"P1","area":"catalog-search-failure-retry","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"b2b8fed","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Catalog-Search-Retry]]","next_action":"Check silent worker deadlines and fixed typo/edition matrix; remote provider, device and live-service verification remain separate"}
---
# LF-053: خطأ تحميل البحث قابل لإعادة المحاولة

العيب المثبت: فشل فهرس البحث يعرض رسالة خطأ ومعها «لا توجد نتائج» بلا
زر retry. بحث استكشف المدمج لا يقرأ searchError، وفشل جزء مطابق يتقدم
بالمؤشر ويُسقط إمكانية تحميله لاحقاً.

اختبار9حالات قبل:7فشل و2نجاح؛ بعد إصلاح المصدر وإضافة سباق الجزء
القديم ومسار فشل Worker+fallback: **11/11** جديدة، و**86/86** مرتبطة.
يحفظ المؤشر بداية الدفعة عند فشلها، مع الاحتفاظ بالأجزاء الناجحة؛
retrySearch يحافظ على النص والنوع ويرفض التكرار أثناء الانشغال. طلب
قديم لا يغير خطأ أو مؤشر البحث الجديد. observer يقرأ الحالة الحالية
ليمتنع عن حلقة retry آلية بعد الفشل.

5 سيناريوهات Chrome: البحث EN/AR، استكشف المدمج، نوع الكتاب، وفشل
part15 ثم استعادته. خطأ الشبكة يخفي empty، والبحث الخالي الناجح يعرضه
بعد retry. لا تعديل نص البحث أو هوية الطبعة أو بيانات حساب. cachev503.

[[sessions/2026-10-18-Catalog-Search-Retry]] | [[systems/Catalog-Search]] | [[systems/Explore-Works]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
