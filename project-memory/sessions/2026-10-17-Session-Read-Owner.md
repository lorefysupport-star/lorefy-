---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"d803865","verified_on":"2026-10-17","related":["[[bugs/LF-031-Session-Read-Owner]]"]}
---
# عزل قراءة الجلسة ومشاركة طلباتها

[10 حالات](../../tests/session-read-owner.test.js) تشغّل Backend الحقيقي:
نجاح/فقدان getUser القديم، session فارغة متأخرة، تبديل العميل/epoch/المالك،
promise قديمة تُشارك مع حساب جديد، finally يمحو فحصاً أحدث، استعادة أولية
وملكية auth مخالفة. 9 فشلت في التشغيل الأول قبل الإصلاح.
المخزن في VM يتضمن localStorage العادي وwindow.localStorage مثل المتصفح.

getSession يشارك الفحص فقط حين يطابق النطاق الافتتاحي. _readSession
يتحقق قبل التعامل مع استجابة auth وقبل تعديل user/تنظيف جلسة/الاحتفاظ
بتفويض Apple. الاستجابة المخالفة لا تتحول إلى صلاحية باسم حساب آخر.
لا إلغاء بأثر رجعي لطلب auth أُرسل، ولا claim لاختبار جهاز أو حساب إنتاج.

62/62 في مجموعة المصدر المرتبطة؛ المجموعة الأوسع تضمنت native auth
الافتراضي دون تسجيل دخول حقيقي. المجموعة الكاملة: **1384/1384**، صفر فشل، exit 0.
الدليل المحلي: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/session-owner-full-tests.txt`.
cache v481 وأصول backend/index/sw متطابقة بالنسخ الثلاث.

[[systems/Accounts-Sync]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
