---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"5e0c700","verified_on":"2026-10-17","related":["[[bugs/LF-040-Session-Teardown-Owner]]"]}
---
# حماية تنظيف الجلسة المحلي

أول تشغيل: 28 حالة، 26 فشلاً. النهائي 31 بإضافة انتظار قناة انتهاء
الجلسة، فشل النقل مع تنظيف محلي، والديمو/تهيئة unavailable.
109/109 مرتبطة في session-teardown-owner وauth-production-guard و
community-live-subscription وnotification-backend-session وaccount-deletion-session
وaccount-local-data. اختبار ترتيب إغلاق المجتمع صار يسمح بالحارس الافتتاحي
ويظل مقيداً بمقطع signOut، والتغطية الجديدة تنفذ السلوك نفسه.

VM مع المصدر الكامل ومخزن وحسابات اصطناعية؛ community/channel/SDK
والجهاز معزولة. يتأكد بقاء المكتبة وpending والهوية وقناة الحساب الجديد
وغياب monitoring/emit قديم، مع حفظ التنظيف المقصود. لا خروج مستخدم حقيقي.
الدليل الأول: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/session-teardown-before.txt`.
المجموعة المرتبطة: session-teardown-focused.txt في المجلد نفسه.
التحقق الكامل **1610/1610**، صفر فشل، exit 0 (74674ms).
الدليل: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/session-teardown-full-tests.txt`.
Chrome معزول شغّل المصدر مع localStorage الفعلي وSDK وهمي: القديم رفض
بلا SDK/emit، وبقيت بيانات qa-b؛ خروجه الحالي أزالها وأصدر حدثاً واحداً.
الدليل: session-teardown-browser.json في المجلد نفسه. cache v490؛ backend/index/sw بالنسخ الثلاث، لا build.

نداء auth.signOut المرسل لا يُلغى؛ تكامل SDK وتخزينه والجهاز يحتاج
حسابات اختبار حية منفصلة. لا تغيّر صلاحيات أو SDK أو تسجيل أجهزة في الإنتاج.
[مرجع signOut](https://supabase.com/docs/reference/javascript/auth-signout).

[[bugs/LF-040-Session-Teardown-Owner]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
