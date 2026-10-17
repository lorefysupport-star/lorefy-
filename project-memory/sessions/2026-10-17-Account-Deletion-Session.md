---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"c4b07e7","verified_on":"2026-10-17","related":["[[bugs/LF-039-Account-Deletion-Session]]"]}
---
# عزل طلب حذف الحساب

أول تشغيل: 12 حالة، 11 فشلاً. النهائي 13 مع حالة الديمو. 22/22 مرتبطة
في account-deletion-session وaccount-deletion-recovery وaccount-sync-isolation.
auth/invoke/signOut معزولة في VM، المصدر الحقيقي ومخزن اصطناعي.
لا حذف أو خروج أو اتصال بمستخدم إنتاج.

تغير الحساب/العميل/الجيل/المالك المحلي أثناء auth وinvoke، وJSON خطأ
متأخر، وتفويض مالك مخالف، وقناة promise جديدة لا يمحوها finally قديم.
الطلبان للحساب نفسه يرسلان invoke واحداً. فشل الخدمة لا يعلن نجاحاً.
الدليل الأول: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/account-deletion-session-before.txt`.
المجموعة المرتبطة: account-deletion-session-focused.txt في المجلد نفسه.
التحقق الكامل **1579/1579**، صفر فشل، exit 0 (237185ms).
الدليل: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/account-deletion-session-full-tests.txt`. cache v489؛ backend/index/sw بالنسخ الثلاث.

الحارس يمنع استمرار الطلب بعد تغير السياق، ولا يلغي حذفاً سبق إرساله.
المعرفة عن signOut لا تعني حماية مكوناته الداخلية/تخزين SDK أو اختبار
جهاز؛ مراجعة teardown هي التالية. لا بيلد أو نشر أو تغيير خادم.

[[bugs/LF-039-Account-Deletion-Session]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
