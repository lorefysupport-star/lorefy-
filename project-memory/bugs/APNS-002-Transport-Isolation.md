---
{
  "kind": "bug", "id": "APNS-002", "status": "closed", "priority": "P2",
  "area": "notifications", "date": "2026-10-15", "reviewed_on": "2026-10-15",
  "source_commit": "ae66e5b", "source_verified": true,
  "device_verified": false, "service_verified": false,
  "requires_device": false, "requires_service": false,
  "verified_on": "2026-10-15",
  "resolution_evidence": "[[sessions/2026-10-15-Push-Transport-Repair]]",
  "next_action": "مغلق لنطاق الكود؛ النشر واختبار التسليم منفصلان ولم ينفذا"
}
---
# APNS-002: فشل اتصال جهاز واحد لا يرفض الدفعة

المصدر ونسخة dispatcher المنشورة v4 يتركان رفض fetch يخرج من Promise.all.
إذا نجح جهاز وفشل اتصال آخر، لا يحصل webhook على عدّاد نتيجة مكتمل؛ كما
لا توجد مهلة APNs محلية. هذا خلل مصدر قابل لإعادة الإنتاج، وليس سببًا
مثبتًا لبلاغ التسليم السابق أو دليلًا على أن كل رفض في السجلات ناتج منه.

أُضيف catch لكل جهاز وAbortSignal.timeout(3500). يظل token الخاص بفشل
الشبكة مسجلًا؛ حذف token يبقى مقصورًا على أسباب APNs غير الصالحة القائمة.
لا retry تلقائي ولا تغيير في المفاتيح أو topic أو البيئة أو مصادقة webhook.

4 حالات من handler الحقيقي ببيئة وهمية ومفتاح EC مولد داخل الاختبار، منها
اثنتان فشلتا قبل الإصلاح. لا يتصل الاختبار بـApple أو قاعدة حقيقية.
الدليل والنشر غير المنفذ في [[sessions/2026-10-15-Push-Transport-Repair]].

[[12-Device-Repairs]] | [[15-Work-Control]] | [[bugs/APNS-001-Background-Delivery]]
