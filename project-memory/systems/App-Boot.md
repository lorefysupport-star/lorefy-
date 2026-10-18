---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["تشغيل", "تحميل", "bootstrap", "cache", "NenApp"]
---
# تشغيل التطبيق

أحدث واجهة فتح: [[sessions/2026-10-18-Feather-Launch-Motion]]؛ ريشة تكتب
Lorefy بلا عبارة تحميل أو تأخير تشغيل، وبديل ثابت لتقليل الحركة. صفحة الدخول
تبقى Apple/Google فقط؛ شاشة إطلاق iOS الأصلية والنسخة المثبتة لم تتغيرا.

## المسؤولية

[index.html](../../index.html) هو نقطة الدخول. React/ReactDOM وLucide محليون
في `vendor/`. التطبيق الرئيسي الذي يعرّف `window.NenApp` هو
[uploads/files/lorefy-app.js](../../uploads/files/lorefy-app.js)، وليس
`modules/lorefy-v2.js` الذي يضيف الإحصاءات. الصفحة الهاتفية
[phone-preview.html](../../phone-preview.html) غلاف معاينة لا تطبيق iOS الأصلي.

## التدفق

1. خطة الكتالوج وخريطة الأجزاء تختاران الجزء الأول وفق نوع العمل أو الرابط المباشر.
2. الوحدات المؤجلة تجهز runtime وBackend/auth والهوية والسياسات والمكونات.
3. الكتالوجات العربية والتصنيفات وتصحيحات الهوية تسبق ملف التطبيق.
4. التطبيق الرئيسي ثم طبقات المجتمع وأقسام البروفايل وأدوات القراءة.
5. assets مؤجلة وعمال البحث يحملون ما يلزم بدل تحميل الكتالوج كاملًا.

هذا يلخّص ترتيب script tags المرصود، لا إثبات ترتيب كل مهمة async.
أسماء `Nen*` هي عقد قائم؛ لا تعِد تسميتها جماعيًا.

## حدود التغيير

- ترتيب تحميل الوحدات واختلاف DOM enhancement عن React يؤثران في ميزات متعددة.
- source asset query versions و[sw.js](../../sw.js) يحتاجان اتساقًا عند شحن تغيير runtime.
- cache localhost ومعاينة demo ليست دليلًا على تحديث المستخدم في TestFlight.
- بدء تشغيل فارغ: افحص auth/runtime/load errors قبل استبدال البنية.

الاختبارات: [bootstrap](../../tests/bootstrap-auth-safety.test.js)،
[اتساق الإصدارات](../../tests/version-consistency.test.js).

[[systems/Catalog-Search]] | [[systems/Accounts-Sync]] |
[[systems/Native-Release]] | [[08-Feature-Router]]
