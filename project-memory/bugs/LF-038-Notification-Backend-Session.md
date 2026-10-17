---
{"kind":"bug","id":"LF-038","status":"closed","priority":"P0","area":"notification-backend","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"271f6ad","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Notification-Backend-Session]]","next_action":"Keep actual APNs delivery, live RLS and general session teardown separate"}
---
# LF-038: طلبات واشتراك التنبيهات تتبع جلسة القارئ

registerPushDevice/listNotifications كانتا تواصلان بعد auth، وجميع
نتائج register/unregister/list/markRead كانت تعود بلا حارس سياق.
subscribeNotifications تنشئ قناة بعد انتظار جلسة أو إزالة قديمة وتسمح
بـcallbacks قديمة؛ cleanup يستخدم this.client المتغير.

[المصدر](../../backend/lorefy-backend.js) يثبت الحساب/العميل/الجيل/المالك
المحلي، يطابق auth حين يُقرأ، ويفحص بعد RPC/query. الاشتراك يفحص قبل
إنشاء القناة وبعد إغلاق السابقة، والمحاولة الأحدث تمنع إكمال محاولة
أقدم. callbacks تعمل للقناة الحالية وسياقها فقط؛ cleanup يستخدم العميل
الذي أنشأ القناة، ولا يمحو قناة أحدث، ويحتوي رفض الإغلاق غير المتزامن.
خروج الحساب يزيل القناة بالعميل المسجل ويحرر مرجعها قبل انتظار الإزالة؛
هذا لا يدعي عزل جميع خطوات signOut أو deleteAccount.

[40 حالة](../../tests/notification-backend-session.test.js): أول 37 أظهرت
34 فشلاً؛ أضيفت 3 حالات تداخل/cleanup/خروج بعد الإصلاح. 64/64 مرتبطة
نجحت. بيانات الجهاز وفلتر user_id والأحداث الذاتية/النظامية والمقروء
وعدم إجراء شبكة في الديمو محفوظة. لا APNs إرسال أو تعديل خدمة أو أسرار.

[[sessions/2026-10-17-Notification-Backend-Session]] | [[systems/Community-Notifications]] | [[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
