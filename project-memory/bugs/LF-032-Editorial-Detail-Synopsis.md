---
{"kind":"bug","id":"LF-032","status":"closed","priority":"P0","area":"catalog-quality","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"8d75726","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Editorial-Detail-Synopsis]]","next_action":"Continue source-backed review of remaining selected catalog records; this closes only three descriptions"}
---
# LF-032: أوصاف ثلاثة أعمال مختارة كانت فارغة

العينة الثابتة للقوائم بيّنت نقص وصف السفر بين الكواكب والحرير والثورة المغدورة.
تأكد الغياب بعد hydrate في المتصفح للأولين؛ والثالث افتقد الوصف في بطاقة
التهيئة واختبار المصدر. لم نفترض أن غياب حقل في بطاقة يعني غيابه من كل سجل.
أُضيف وصف AR/EN قصير بصياغة تحريرية من صفحة الناشر لكل عمل، مع رابط وتاريخ
مراجعة مستقل. لا نص كتاب مستورد، ولا تقييمات أو تقدم أو سنة طبعة مخمّنة.

[المصدر](../../uploads/lorefy-editorial-picks.js) | [الاختبارات](../../tests/editorial-detail-synopsis.test.js)

[[sessions/2026-10-17-Editorial-Detail-Synopsis]] | [[systems/Explore-Works]] | [[18-Progress-Handoff]]

[[12-Device-Repairs]] | [[15-Work-Control]]
