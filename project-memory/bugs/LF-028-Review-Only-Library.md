---
{"kind":"bug","id":"LF-028","status":"closed","priority":"P0","area":"reading","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"683afdc","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Review-Library-Lifecycle]]","next_action":"Keep controlled cloud and installed-device durability checks separate"}
---
# LF-028: التقييم وحده لا ينشئ اكتمال قراءة

## السبب والإصلاح
دالة seedReviewedWorks كانت تضيف المراجعة ذات المكتبة المفقودة إلى مكتمل،
ثم تهيئة التقدم تملأ الإجماليات من الكتالوج. توقف الاستنتاج؛ أبقي توقيع
الدالة للتوافق مع المستدعين القدامى. كل إدخال مكتبة محفوظ، checkpoint
وتاريخ سابق بقي دون تعديل أو تنظيف تلقائي.

يحل هذا القرار محل سماح التهيئة من تقييم قديم عند غياب إدخال المكتبة؛
لا يعيد كتابة ما حُفظ تاريخياً ولا يمنع فعل الإكمال الصريح.

## التحقق
حالتان فاشلتان قبل الإصلاح ثم نجاح 8 حالات lifecycle والمجموعة 30/30.
حذف المراجعة وحده ناجح بالفعل في المصدر؛ يغطي الاختبار الجديد الحالات
الخمس والصفر وفشل الشبكة دون اختراع إصلاح في مسار حذف كان يعمل.
متصفح معزول: مراجعة محفوظة لعمل 384 فصلاً، مكتبة وتقدم فارغان قبل وبعد
reload، والمراجعة باقية، بلا pageerror. لا حساب إنتاج.

[[sessions/2026-10-17-Review-Library-Lifecycle]] | [[systems/Reading-Library]] |
[[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
