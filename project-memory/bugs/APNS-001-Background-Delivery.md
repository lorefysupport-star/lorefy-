---
{
  "kind": "bug", "id": "APNS-001", "status": "needs-service", "priority": "P1",
  "area": "notifications", "date": "2026-10-15", "reviewed_on": "2026-10-15",
  "source_commit": "ae66e5b", "source_verified": false,
  "device_verified": false, "service_verified": false,
  "requires_device": true, "requires_service": true,
  "verified_on": null,
  "next_action": "اختبار تسليم مصرح به مع قبول APNs ووصول إلى جهاز في الخلفية"
}
---
# APNS-001: إثبات تسليم الإشعارات في الخلفية

## الحقيقة والحد

[[sessions/2026-10-14-APNs-Server-Setup]] يحفظ فحص إعداد الخادم القديم.
لم يتصل probe بـApple؛ إعداد المفتاح ليس إثبات توقيع JWT وقبول APNs.
[[12-Device-Repairs#LF-001: إعادة تحميل صندوق الإشعارات]] يخص صندوق الجرس
داخل التطبيق، ولا يغلق مشكلة push. حقول التحقق هنا خاصة بالتسليم الشامل.
لم يُفحص الخادم مجددًا في جولة تنظيم الذاكرة.

تحديث 2026-10-15: [[sessions/2026-10-15-Push-Transport-Repair]] يتضمن قراءة
حديثة للجهاز المسجل وtrigger ونسخة dispatcher وسجلات قبول محدودة. لا يثبت
العرض على iPhone، ولا يجعل فشل النقل المثبت بالمحاكاة سببًا لبلاغ الحساب.
إصلاح [[bugs/APNS-002-Transport-Isolation]] في الكود فقط، ولم يُنشر إلى الخادم.

## شرط الإغلاق

بإذن مناسب وحساب اختبار: token مسجّل للبيئة الصحيحة، إشعار موجه لهذا الحساب،
رد dispatcher وAPNs موثقان دون الأسرار أو token، ثم وصول فعلي في الخلفية
وفتح الوجهة الصحيحة. لا إرسال جماعي ولا تغيير أسرار أو migrations كاختبار.

## المصادر

[[systems/Community-Notifications]]،
[dispatcher](../../supabase/functions/dispatch-notifications/index.ts)،
[اختبار runtime، لا تسليم Apple](../../tests/notification-delivery-runtime.test.js).

[[15-Work-Control]] | [[10-Open-Questions]]
