---
{
  "kind": "bug", "id": "LF-046", "status": "needs-device", "priority": "P1",
  "area": "auth-session", "date": "2026-11-06", "reviewed_on": "2026-11-06",
  "source_commit": "", "source_verified": true,
  "device_verified": false, "service_verified": false,
  "requires_device": true, "requires_service": true,
  "verified_on": null, "resolution_evidence": "[[sessions/2026-11-06-Session-Verification-Retry]]",
  "next_action": "اختبار تسجيل Google وفتح التطبيق مجدداً على Build محدث؛ مراجعة سجلات Auth الخاصة بوقت البلاغ إن بقي الخطأ"
}
---
# LF-046: تعذر استعادة التطبيق بعد فشل التحقق من الجلسة

## Symptom and Reproduction

لقطات المستخدم في 2026-11-06 تعرض شاشة بيضاء ونصاً يفيد بتعذر الاتصال للتحقق
من الجلسة مع بقاء البيانات محفوظة. المستخدم أفاد أن الخطأ بقي بعد الدخول بحساب
Google وإعادة المحاولة.

## Confirmed Cause Versus Hypotheses

المصدر ينتظر `getSession()` قبل تركيب التطبيق. التنفيذ الحالي يستدعي
`auth.getUser()` بعد قراءة الجلسة؛ هذه العملية تتصل بخادم Supabase للتحقق من
هوية المستخدم. لذلك قد يمنع انقطاع الشبكة أو فشل Auth/Keychain إقلاع التطبيق.
سبب بلاغ الجهاز المحدد غير معروف. فحص صحة Auth العام الحالي نجح وأظهر Google
مفعلاً، لكنه لا يثبت حالة الجلسة أو سبب الخطأ للحساب المتأثر.

## Fix and Regression Test

تغير [index.html](../../index.html) ليعرض إعادة محاولة داخل الشاشة نفسها؛ يعيد
فحص الجلسة ثم يكمل الإقلاع بعد نجاح التحقق، ويحافظ على الفشل الآمن عند استمرار
الخطأ. لا يستخدم جلسة غير متحققة ولا يمسح البيانات المحفوظة. تغيّر إصدار cache
إلى `lorefy-v516-session-verification-retry`.

## Commands, Results and Evidence

- `node --test tests/bootstrap-auth-safety.test.js tests/version-consistency.test.js`: 14/14 نجحت.
- فحص Auth `/auth/v1/health` باستخدام المفتاح العام: HTTP 200؛ `/auth/v1/settings`: HTTP 200 وGoogle مفعّل.
- تعذر استرجاع سجلات المشروع من موصل Supabase بسبب رفض الصلاحية. لا اعتماد على سجلات المستخدمين أو تعديل للمشروع/قاعدة البيانات.
- تحقق المصدر لا يثبت سلوك TestFlight؛ راجع [[sessions/2026-11-06-Session-Verification-Retry]].

## Remaining Risk

يبقى احتمال انتهاء/تلف refresh token أو تعطل Keychain أو اختلاف إعداد البناء أو مشكلة اتصال محلية. يلزم اختبار دخول واستعادة حقيقي على جهاز بعد وصول مصدر الإصلاح إلى نسخة محدثة. لا تغيير قاعدة بيانات أو إعدادات OAuth في هذه الدفعة.

[[systems/Accounts-Sync]] | [[systems/App-Boot]] | [[15-Work-Control]] | [[05-Verification]]
