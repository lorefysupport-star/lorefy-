---
{"kind":"bug","id":"LF-013","status":"closed","priority":"P1","area":"community","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"590bf33","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-16","resolution_evidence":"[[sessions/2026-10-16-Friend-Rating-Rows]]","next_action":"Verify the new source on a future authorized device build"}
---
# LF-013: ثبات صف تقييم الأصدقاء

الاسم الطويل ينقل الرقم إلى سطر، والقصير يبقيه ملاصقاً للاسم.
تعارض قواعد inline/block/grid في [CSS](../../styles/lorefy-explore-studio.css)
مثبت في المتصفح. أصبحت البطاقة ثلاثة صفوف دون تغيير القيم أو بيانات الحساب.
[QA](../../qa/friend-activity-layout-browser.cjs) فشل قبل الإصلاح واجتاز
80 حالة بعده. هذا إغلاق لنطاق المصدر والمتصفح؛ لا يثبت تحديث تطبيق الهاتف.

[[sessions/2026-10-16-Friend-Rating-Rows]] | [[15-Work-Control]] | [[05-Verification]]

[[12-Device-Repairs|سجل الجهاز التاريخي؛ ليس تثبيتاً لهذا الإصلاح]]
