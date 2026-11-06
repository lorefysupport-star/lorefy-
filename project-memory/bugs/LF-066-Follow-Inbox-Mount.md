---
{"kind":"bug","id":"LF-066","status":"source-verified","priority":"P1","area":"notifications-inbox","date":"2026-11-06","reviewed_on":"2026-11-06","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":true,"requires_service":true,"verified_on":"2026-11-06","resolution_evidence":"[[sessions/2026-11-06-Follow-Notification-Inbox]]","next_action":"Verify the real notification row and updated app on the user's device; do not modify production data without authorization"}
---
# LF-066: جلب إشعار المتابعة عند فتح صندوق الإشعارات

كان `backend/lorefy-native-runtime.js` يحدّث الصندوق عند ضغط زر الجرس، وعند
بعض أحداث التطبيق، لكنه لا يطلب البيانات لمجرد تركيب صفحة الإشعارات. إذا
فات حدث Realtime أثناء اتصال غير مستقر وفتحت الصفحة من مسار آخر، تظهر حالة
«لا إشعارات بعد» رغم وجود تنبيه محفوظ.

أصبح كل mount جديد لـ`.lf-notifications-page` يستدعي جلب القائمة من backend،
مع الاستمرار في عزل النتائج حسب الحساب والمحاولة. حدّثنا cache version في
`index.html` و`sw.js` ومزامنة runtime وملفي الدخول في نسختي iOS المولدة.
اختبار الحالة فشل قبل التغيير ونجح بعده.

`node --test tests/notification-delivery-runtime.test.js tests/notification-backend-session.test.js tests/notification-navigation.test.js tests/native-notifications-links.test.js` نجح 58/58.
مزامنة ملفات المصدر ونسختي iOS تحققت بمطابقة SHA-256. لم نقرأ جدول إنتاج
Supabase، ولم نغيّر بيانات أو migration أو secret، ولم ننشئ build أو نثبّت
تحديثًا على جهاز المستخدم. لذلك لا يمكن تأكيد أن سجل المتابعة نفسه موجود في
الصندوق الحي حتى يُفحص بعد نشر النسخة الجديدة.

[[sessions/2026-11-06-Follow-Notification-Inbox]] | [[systems/Community-Notifications]] | [[12-Device-Repairs]] | [[10-Open-Questions]]
