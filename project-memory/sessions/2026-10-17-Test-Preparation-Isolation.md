---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"65e9339","verified_on":"2026-10-17","related":["[[bugs/LF-048-Test-Preparation-Isolation]]"]}
---
# عزل فحص الإعدادات عن مولدات الكتالوج وios-web

regression قبل: 0/1؛ spy يمنع التنفيذ الحقيقي لكن يكشف نداء prepare القديم.
بعد: 15/15 في test-suite-isolation وapple-release-package، 1971ms.
الـVM ينفذ الكود الفعلي بين marker projection وكتابة الناتج؛ يفشل إذا
اختفت الحدود. template يُقرأ من مساره المحدد، والسر التجريبي لا يظهر
في الناتج. لا تغيير لتهيئة الخدمة أو القيم الخاصة للمستخدم.

الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/test-isolation-before.txt
وtest-isolation-focused.txt. **1760/1760** كاملة، صفر فشل، exit 0 (58428ms).
البصمات وmtime للتسعة ملفات المراقبة لم تتغير، بما فيها runtime/index
وios-web config/index. test-isolation-files-before/after.json؛ الكامل
في test-isolation-full-tests.txt. لا إعادة توليد أو إنشاء ios-web أثناء الفحص. لا تشغيل جديد لـprepare ولا native build في هذه الدفعة.

إيصال 1758/1759 في [[sessions/2026-10-17-Source-Summary-Batch]] يبقى تاريخياً؛
artifact اختلاف Nimona سبق تدقيقه ومزامنته. اختبار parity لم يُعطّل أو يُخفف.
مراجعة كل تجارب الجهاز والخدمة ليست مستنتجة من اختبار projection.

[[bugs/LF-048-Test-Preparation-Isolation]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
