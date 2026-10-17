---
{"kind":"bug","id":"LF-048","status":"closed","priority":"P1","area":"test-runtime-preparation","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"65e9339","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Test-Preparation-Isolation]]","next_action":"Keep catalog generation explicit; continue remaining source metadata and query quality gates"}
---
# LF-048: فحص الإعدادات لا يعيد تجهيز المشروع

اختبار prepares a native runtime config في apple-release-package كان يشغّل
prepare-ios-web على root الفعلي؛ هذا يحذف ويعيد إنشاء ios-web ويولد runtime
catalog/index أثناء full. ظهر الاختلاف في نسخة Xcode عند تكرار الفحص بعد
أوصاف جديدة، رغم أن صاحب المهمة طلب تعديلات المصدر دون بناء native.

[الاختبار](../../tests/apple-release-package.test.js) ينفذ الآن قسم projection
الفعلي المحدود من prepare في VM، مع config عام من المصدر وقيمة سر تجريبية،
وقراءة template محددة فقط. لا تنفيذ مولدات أو كتابة مخرجات. كل تأكيدات URL
وpublishable والبيتا وApple/build بقيت، وأضيف منع تسريب السر التجريبي.
اختبار parity المستقل ما زال يقارن كل الأصول الحقيقية بالنسختين.

[regression](../../tests/test-suite-isolation.test.js) يشغّل callback الفعلي
مع spy بدلاً من child_process؛ فشل قبل لأن prepare استُدعي ونجح بعد مع صفر
أوامر. 15/15 مرتبطة ناجحة. production prepare/build behavior لم يتغير.

[[sessions/2026-10-17-Test-Preparation-Isolation]] | [[systems/Native-Release]] | [[systems/Catalog-Search]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
