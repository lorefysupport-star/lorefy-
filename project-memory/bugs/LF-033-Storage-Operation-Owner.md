---
{"kind":"bug","id":"LF-033","status":"closed","priority":"P0","area":"accounts-storage","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"e02ef95","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Storage-Operation-Owner]]","next_action":"Keep live Storage RLS and device permissions separate; audit remaining social mutations"}
---
# LF-033: عملية الصور لا تستمر في جلسة أخرى

حواجز حفظ الملف والمزامنة لم تكن موجودة داخل مساعدات Storage نفسها.
بعد await التفويض كان الرفع/توقيع الرابط/الحذف يواصل HTTP، وبعد استجابة
HTTP أو JSON كان يعيد نتيجة قديمة بلا فحص. مسار الرفع قد يتبع حساباً آخر.

[المصدر](../../backend/lorefy-backend.js): _uploadProfileMedia و_uploadCustomArtwork
و_storageMediaUrl و_removeReviewMedia تلتقط نطاق الحساب والعميل والجيل
والمالك المحلي، وتتحقق بعد التفويض والشبكة؛ التوقيع يتحقق أيضاً بعد JSON.
مالك مسار الرفع يمرر للتفويض. توقيع صورة قارئ آخر مسموح وفق صلاحية
الخادم؛ نطاق الحارس هو الزائر صاحب الطلب، وليس مالك الصورة.

[24 حالة](../../tests/storage-operation-owner.test.js)، 23 فاشلة قبل الإصلاح.
67/67 في المجموعة المرتبطة. ثبات سياسة upsert لصورة الملف وعدم upsert
للأغلفة، وTTL والتوقيع والحذف الطبيعي محفوظة. لا إلغاء لطلب أُرسل بالفعل
ولا إزالة آلية للملف اليتيم ولا اعتماد RLS حي.

[[sessions/2026-10-17-Storage-Operation-Owner]] | [[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
