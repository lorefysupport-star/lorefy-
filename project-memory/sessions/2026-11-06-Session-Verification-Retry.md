---
kind: session
status: source-verified-device-unconfirmed
date: 2026-11-06
related: ["[[bugs/LF-046-Session-Verification-Retry]]"]
---
# استعادة الإقلاع بعد تعذر التحقق من الجلسة

## الطلب والدليل

أرسل المستخدم صورتين توضحان رسالة «تعذر الاتصال للتحقق من جلستك. بياناتك
محفوظة؛ حاول مجدداً» بعد تسجيل دخول Google. تعذر إثبات السبب المحدد من الصورة.

## فحص Supabase

- إعداد المصدر الحالي يقرأ عنوان المشروع ومفتاحاً عاماً من إعدادات الإصدار؛ لم
  يُعرض المفتاح أو يُسجل في الذاكرة.
- فحص `/auth/v1/health` بالمفتاح العام رجع HTTP 200؛ إعدادات Auth رجعت HTTP 200
  وGoogle مفعّل. هذا فحص وصول وإعداد عام لحظي فقط.
- أدوات قراءة سجلات المشروع رُفضت بسبب صلاحية الموصل الحالية. لم تُقرأ بيانات
  مستخدمين ولم يتغير إعداد أو مخطط أو وظيفة في المشروع.
- توثيق Supabase يذكر أن `getUser()` يتصل بخادم Auth للتحقق من المستخدم؛ راجع
  https://supabase.com/docs/reference/javascript/auth-getuser .

## تغيير المصدر والتحقق

يوقف bootstrap الأصلي عند خطأ `getSession()` ويعرض زر reload يعيد تهيئة التطبيق
كاملًا. [index.html](../../index.html) الآن يعرض retry داخل الشاشة ويعيد
التحقق بنفس client؛ عند نجاحه يكمل التهيئة المعتادة، وعند فشله يعرض رسالة
وإمكانية retry أخرى. لا يتجاوز التحقق الأمني ولا يعامل بيانات الجلسة المحلية
على أنها موثقة. رُفع إصدار service-worker cache من v515 إلى v516.

الاختبار:

```text
node --test tests/bootstrap-auth-safety.test.js tests/version-consistency.test.js
14 passed, 0 failed
```

هذه نتيجة مصدر محلي؛ لا تثبت أن التغيير وصل إلى TestFlight ولا تشخيص سبب
الجهاز الأصلي. لا migration ولا تغيير Supabase عن بعد ولا build أو upload.

[[bugs/LF-046-Session-Verification-Retry]] | [[systems/Accounts-Sync]] | [[systems/App-Boot]]
