---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["تشغيل", "تحميل", "bootstrap", "cache", "NenApp"]
---
# تشغيل التطبيق

[[sessions/2026-11-01-Smooth-Runtime]] S-003 stops a demo review/completion
identity-update loop. Stable view/partitions preserve real edits and fixture
isolation; Explore startup ranking calls128 to3 in the same4x local scenario.
3250 source tests/16 browser checks; do not project these gains onto production.

[[sessions/2026-11-01-Smooth-Runtime]] S-002 batches late-content restoration
into one frame, cancels stale jobs and restores instantly despite smooth CSS.
Quick navigation cannot save a clamped0 over the pending target. User gesture
and ordinary scroll preferences remain unchanged; native acceptance separate.

[[bugs/LF-073-Surface-Render-Recovery]] adds an AppShell React render boundary
with manual AR/EN recovery and no storage clearing or automatic retry loop.
[[sessions/2026-10-19-Surface-Render-Recovery]]:5 added,15 focused,2195 full passing;
actual React browser injection/recovery, not an installed-device crash diagnosis.

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
