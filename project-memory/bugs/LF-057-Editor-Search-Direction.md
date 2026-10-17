---
{"kind":"bug","id":"LF-057","status":"closed","priority":"P2","area":"mixed-script-favorites-editor-search","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"93ef5f1","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Editor-Search-Direction]]","next_action":"Continue other search-field and fixed typo/edition checks; VoiceOver, live service and device gates remain open"}
---
# LF-057: اتجاه النص في محرري المفضلة

حقل الأعمال والشخصيات كان يرث اتجاه الواجهة. في AR ظهرBerserk RTL،
وفيENظهرالنصالعربيLTR؛ وحقل الشخصيات فرض text-align:right حتىEN.
أصبح dir=auto وtext-align:start في الحقلين، دون تعديل handlers أو
دوال الحفظ أو المسودات أو ترتيب الخانات. الخط16 القائم محفوظ.

8/8 حالات متصفح(لغةواجهة×المحرر×لغةنص)، مع110/110 اختبارات قائمة
مرتبطة. لا اختبارات مكررة للخصائص أضيفت لهذا التعديل المحدود. الفحص
الشامل الأخير1919/1919 يخصLF-056 السابق؛ فحص هذه الدفعة مركز ومتصفح.

[[sessions/2026-10-18-Editor-Search-Direction]] | [[systems/Catalog-Search]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
