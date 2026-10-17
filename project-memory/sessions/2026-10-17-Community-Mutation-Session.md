---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"d801080","verified_on":"2026-10-17","related":["[[bugs/LF-036-Community-Mutation-Session]]"]}
---
# عزل طلبات المجتمع والبلاغات

27 حالة VM على المصدر الحقيقي، auth وRPC معزولان. 25 فشلت قبل الإصلاح.
80/80 بعده في community-mutation-session وcommunity-posts وcommunity-cloud
وcommunity-live-subscription وreview-mutation-session.

تشمل النشر بمرفق قائمة بدرجة 4.25، الرد، التحرير، حذف المنشور، إزالة
التفاعل، تفويض مالك آخر، auth/RPC بعد تغير الحساب، العميل/الجيل/المالك
المحلي، نجاح البلاغ القديم، وأخطاء الخدمة. لا تغيير لقيم الدرجات/النصوص.
الدليل الأول: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/community-mutation-before.txt`.
المجموعة المرتبطة: community-mutation-focused.txt في المجلد نفسه.
التحقق الكامل **1503/1503**، صفر فشل، exit 0 (86307ms).
الدليل: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/community-mutation-full-tests.txt`.
متصفح Chrome في أصل localhost مع Backend الحقيقي وauth/RPC معزولين
رفض الطلب القديم قبل RPC (صفر إرسال)، ونجح الرد الحالي مع parent_ref الصحيح.
الدليل: community-mutation-browser.json في المجلد نفسه.

cache v486، backend/index/sw متطابقة بالنسخ الثلاث. لا بيلد أو نشر خدمة.
حماية auth/RPC هنا امتداد لعقد LF-029/LF-034، دون SDK أو schema جديدة.
وصول الموصل للمشروع سبق رفضه؛ لا اعتماد إنتاج أو RLS أو جهاز.
الطلب المرسل قد يتم في حسابه الأصلي؛ الحارس لا يلغي RPC سبق إرساله.

[[bugs/LF-036-Community-Mutation-Session]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
