---
{"kind":"bug","id":"LF-040","status":"closed","priority":"P0","area":"local-session-teardown","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"5e0c700","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Session-Teardown-Owner]]","next_action":"Live SDK/auth storage concurrency remains a separate gate; audit delayed account reads"}
---
# LF-040: تنظيف محلي قديم لا يمحو بيانات حساب جديد

signOut و_clearInvalidSession تنتظران إغلاق القنوات/إلغاء الجهاز/auth ثم
تزيلان مفاتيح الحساب الحالي وترسلان signed-out بلا حارس. علم sessionCleared
غير المنسوب لسياق كان يمنع تنظيف حساب لاحق. انتهاء الجلسة لم يغلق قناة
التنبيهات القديمة.

[المصدر](../../backend/lorefy-backend.js) يلتقط السياق قبل stopSync ويتحقق
بعده، ثم يُحدّث جيل الطلب للزيادة المقصودة. بعد كل انتظار يتحقق من نفس
mode/العميل/الجيل/user/المالك المحلي قبل المرحلة التالية والتنظيف المحلي
وmonitoring وemit. auth يستعمل العميل الملتقط، وقناة التنبيه تُحرر قبل
انتظار إغلاقها بالعميل المنشئ. sessionCleared مربوط بنطاقه ويظل idempotent.

[31 حالة](../../tests/session-teardown-owner.test.js): أول 28 أظهرت 26
فشلاً. 109/109 مرتبطة ناجحة بعد الإصلاح. الحفظ المقصود للخروج الحالي
والديمو وتهيئة unavailable وخصوصية التنظيف عند فشل النقل محفوظة.
لا إلغاء لنداء SDK أُرسل، ولا إثبات أن تخزين SDK يصمد أمام دخول مباشر
متزامن خارج Backend؛ هذا gate حي مستقل عن حفظ مفاتيح التطبيق محلياً.

[[sessions/2026-10-17-Session-Teardown-Owner]] | [[systems/Accounts-Sync]] | [[systems/Community-Notifications]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
