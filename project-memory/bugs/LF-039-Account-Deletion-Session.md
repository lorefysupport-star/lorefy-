---
{"kind":"bug","id":"LF-039","status":"closed","priority":"P0","area":"account-deletion","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"c4b07e7","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Account-Deletion-Session]]","next_action":"Audit signOut/invalid-session teardown separately; no live deletion authorization"}
---
# LF-039: تأكيد حذف الحساب لا ينتقل إلى حساب آخر

_deleteAccount كانت تكمل بعد auth وتستعمل العميل الحالي، ثم تستدعي
signOut بعد نتيجة قديمة. deleteAccount تشارك promise واحداً بين الحسابات
وfinally القديمة تمحو خانة طلب أحدث.

[المصدر](../../backend/lorefy-backend.js) يثبت نطاق الحساب/العميل/الجيل/
المالك المحلي قبل auth، يطابق مالك الجلسة ويفحص بعد invoke وJSON الخطأ
وقبل الخروج. مشاركة الحذف فقط في سياق الافتتاح نفسه، وfinally تحرر
طلبها فقط. الديمو يبقى محلياً ولا يصبح حذفاً حياً بعد تبدل mode.

[13 حالة](../../tests/account-deletion-session.test.js): أول 12 أظهرت
11 فشلاً؛ أضيفت حالة نجاح/تبدل الديمو. 22/22 مرتبطة ناجحة. أخطاء
recent_authentication_required وفشل تنظيف الخدمة ما زالت فشلاً بلا خروج.
اختبار الاسترجاع القديم يشغّل Backend كاملاً بدل قص دالة منه.
لا حذف حقيقي؛ لا إلغاء invoke أُرسل؛ حدود signOut/SDK نفسها متابعة منفصلة.

[[sessions/2026-10-17-Account-Deletion-Session]] | [[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
