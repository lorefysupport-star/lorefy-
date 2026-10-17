---
{"kind":"bug","id":"LF-037","status":"closed","priority":"P0","area":"chapter-review-requests","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"e629e43","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Chapter-Review-Session]]","next_action":"Real chapter ownership/RLS and installed-device UI remain separate"}
---
# LF-037: نشر وحذف تقييم الفصل يتبع حساب الطلب

deleteChapterReview وpublishChapterReview كانتا تنتظران auth ثم
تواصلان الكتابة وتعيدان نتيجة متأخرة بلا فحص الحساب الافتتاحي.
[المصدر](../../backend/lorefy-backend.js) يلتقط النطاق قبل auth،
يطابق مالك الجلسة ويفحصه بعد قاعدة البيانات. فلتر حذف user_id باقٍ.

[23 حالة](../../tests/chapter-review-session.test.js)، 18 فاشلة قبل
التصحيح؛ 56/56 في المجموعة المرتبطة. تبقى درجة 4.25 والصفر للتعليق
فقط وعلامة الحرق ونص القارئ والفصل كما هي. رفض الإدخال غير الصالح
والحذف الذي لم يزل صفاً باقٍ. fixtures القديمة تعرّف الآن مالك live
صريحاً مطابقاً لـgetSession بدل جلسة وهمية بلا user.

لا إلغاء لكتابة أُرسلت، ولا اعتماد خدمة أو جهاز أو RLS من هذا الاختبار.

[[sessions/2026-10-17-Chapter-Review-Session]] | [[systems/Community-Notifications]] | [[systems/Reading-Library]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
