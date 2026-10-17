---
{"kind":"bug","id":"LF-044","status":"closed","priority":"P1","area":"import-request-session","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"e10f3d5","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Import-Request-Session]]","next_action":"Audit storage failures and CSV parsing; keep cloud/native gates separate"}
---
# LF-044: معاينة الاستيراد لا تنتقل بين الحسابات أو المحاولات

نافذة الاستيراد كانت تسمح بتأكيد بيانات بدأت بحساب سابق، ونتيجة أبطأ من
مزوّد/ملف سابق كانت تستبدل المعاينة الأحدث أو تمحوها بخطأ. الإغلاق لم يمنع
رد الملف من بناء واجهة متأخرة.

[المصدر](../../modules/lorefy-growth-features.js) يلتقط سياق النافذة: Backend
والعميل والوضع والجيل والمستخدم والمالك المحلي. لكل طلب مزوّد أو ملف أو لصق
رقم محاولة؛ النتيجة والخطأ والتأكيد والعرض الإضافي تخص النافذة المتصلة النشطة
والمحاولة الأحدث. تغير الجلسة يغلق النافذة مع شرح AR/EN، ولا يبدأ fetch جديد.
لا حفظ حتى التأكيد، ولا استبدال للحالات الموجودة أو تقريب جديد للتقييم.

20 حالة نهائية؛ أول 17 أظهرت 16 فشلاً. 77/77 مرتبطة أولياً، ثم 118/118 مع توافق الكاش والواجهة.
فشل الحفظ المحلي وإثبات cloud بعد الاستيراد ليسا ضمن هذا الإغلاق.

[[sessions/2026-10-17-Import-Request-Session]] | [[systems/Reading-Library]] | [[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
