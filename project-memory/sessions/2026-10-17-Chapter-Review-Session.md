---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"e629e43","verified_on":"2026-10-17","related":["[[bugs/LF-037-Chapter-Review-Session]]"]}
---
# عزل طلبات تقييم الفصل

23 حالة VM مع المصدر الحقيقي وauth/RPC/query معزولة؛ 18 فشلت قبل
التصحيح. 56/56 في المجموعة المرتبطة بعده: chapter-review-session،
social-artwork-chapters، quarter-ratings، chapter-publishing-flow وchapter-detail.
تشمل تغير الحساب/العميل/الجيل/المالك المحلي أثناء auth والكتابة، تفويض
مالك مخالف، النجاح الحالي ورفض الخدمة، exact quarter وcomment-only
والحرق، فلتر مالك الحذف ورفض حذف لم يطابق صفاً. لا عمليات إنتاج.

الدليل الأول: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/chapter-session-before.txt`.
المجموعة المرتبطة: chapter-session-focused.txt في مجلد الدليل نفسه.
التحقق الكامل **1526/1526**، صفر فشل، exit 0 (87485ms).
الدليل: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/chapter-session-full-tests.txt`. cache v487؛ backend/index/sw بالنسخ الثلاث، لا build.

لا تغيّر صلاحيات الخادم أو بياناته؛ الطلب المرسل لا يُلغى. تبقى فحوص
الرؤية بحسابين والواجهة المثبتة منفصلة، ومراجعة الإشعارات هي التالية.

[[bugs/LF-037-Chapter-Review-Session]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
