---
{
  "kind": "session", "status": "source-verified-not-deployed", "date": "2026-10-15",
  "source_commit": "ae66e5b", "verified_on": "2026-10-15",
  "related": ["[[bugs/APNS-002-Transport-Isolation]]", "[[bugs/APNS-001-Background-Delivery]]"]
}
---
# عزل فشل نقل APNs والتحقق بالقراءة فقط

## النطاق

بعد رفع إصلاح LF-009 في ae66e5b، راجعت حلقة الإشعارات الحالية. لا بيلد،
لا نشر Edge Function ولا migration ولا تغيير سر أو إرسال إشعار في هذه الجولة.
طلب إرسال اختبار واحد للحساب الذي حدده المالك منفصل وينتظر إجابته؛ لا نحفظ
اسم الحساب أو token أو مفتاحه في الخزنة أو Git.

## الدليل الحي، لا قبول شاشة الجوال

- مشروع Supabase المحدد من إعداد المشروع ACTIVE_HEALTHY؛ dispatcher v4 ACTIVE.
- قراءة الحساب المحدد أكدت وجود جهاز iOS Production مسجل، وtrigger
  dispatch_notification_push مفعّل. لم تُقرأ قيم token أو أسرار الخادم.
- تجميع آخر 24 ساعة لوظيفة dispatcher: استجابات 202 و503 و404. حالة HTTP
  وحدها لا تثبت عدد التسليم، و503 لا يحدد السبب دون response body.
- ردود pg_net المحتفظ بها والمطابقة لشكل dispatcher شملت delivered:1
  وunavailable:0، وأخرى delivered:0/unavailable:0. القبول لا يثبت العرض
  في الخلفية، ولا نربط هذا الرد بالحساب المحدد دون correlation موثقة.
- لم نُدرج سجلات خاصة أو payload/headers أو قيم مفاتيح في الملاحظات.

## السبب المثبت بالكود والإصلاح

رفض fetch من جهاز واحد يرفض Promise.all كاملة. أربع حالات شغّلت handler
الحقيقي بعد إزالة أنواع TypeScript داخل Node، باستخدام createClient وfetch
وenv وهمية. المفتاح مولد محليًا داخل الاختبار، وليس APNs الخاص بالمشروع.
حالتا فشل الشبكة وغياب المهلة فشلتا قبل التعديل، ثم نجحتا.

أصبح لكل طلب APNs signal بمهلة 3500ms وcatch يعزل فشل الجهاز ويزيد unavailable
دون حذف token. أسباب token غير الصالح ما زالت تحكم الحذف. بقي JWT وtopic
ومصادقة webhook وعقود RLS دون تعديل. المهلة تخص APNs I/O، وليست ضمانًا
أن كامل الوظيفة ينتهي خلال خمس ثوان عند بطء lookup أو cold start.

نجح 19 اختبارًا موجهًا في transport/runtime/native links. النشر غير منفذ؛
النسخة الحية v4 لا تتغير بcommit المصدر، ولا توجد إعادة إرسال تلقائية.

## إيصال التحقق النهائي

على ae66e5b مع تعديل dispatcher واختباره وهذه الملاحظات، مع حفظ إعدادات
البناء السابقة: `npm test` خرج 0، 1217 اختبارًا ناجحًا، بلا فشل أو تجاوز أو
إلغاء. السجل خارج Git: `artifacts/lorefy-push-transport-repair-tests.log`
في مجلد المحادثة. اختبار Node يتضمن تحذير stripTypeScriptTypes تجريبيًا؛
التحذير ليس فشلًا، ولا يدّعي هذا الاختبار تشغيل Supabase/Deno الحي.

فحص الإطارات والتخطيط والحزم المركّز: 56 نجاحًا، دون اختراع إصلاح إضافي
للمصدر لمجرد بقاء تحقق الجهاز مفتوحًا. الذاكرة: 68 ملاحظة و501 ملف مصدر،
بصمة حديثة دون روابط معطوبة أو ملاحظات يتيمة أو تكرار مطابق.

## مراجع التنفيذ

[dispatcher](../../supabase/functions/dispatch-notifications/index.ts)،
[الاختبار](../../tests/push-dispatch-transport.test.js)،
[مهلة webhook القائمة](../../supabase/migrations/20260830083000_push_dispatch_webhook.sql)،
[Deno AbortSignal](https://docs.deno.com/api/web/platform/)،
[حدود Supabase](https://supabase.com/docs/guides/functions/limits).

[[00-Home]] | [[15-Work-Control]] | [[05-Verification]] | [[systems/Community-Notifications]]
