---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"20fca00","verified_on":"2026-10-17","related":["[[bugs/LF-034-Review-Mutation-Session]]"]}
---
# عزل عمليات المراجعات في Backend

20 حالة تشغل المصدر الحقيقي مع auth/query/RPC/Storage معزولة.
18 فشلت قبل الإصلاح؛ 75/75 في المجموعة المرتبطة بعده.
التغطية: auth وRPC للرد والتفاعل، تغير الحساب/العميل/الجيل/المالك المحلي
أثناء قراءة الصور وإزالتها وحذف السجل، تفويض حساب مختلف، النجاح الطبيعي
وأخطاء الشبكة. fixtures اصطناعية، لا حذف أو رد أو تفاعل في الإنتاج.

الدليل الأول: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/review-mutation-before.txt`.
المجموعة المرتبطة: `review-mutation-focused.txt` في مجلد الدليل نفسه.
التحقق الكامل **1431/1431**، صفر فشل، exit 0 (119492ms).
الدليل: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/review-mutation-full-tests.txt`.
معاينة home معزولة 390px بلا pageerror؛ الصورة home-review-mutations-v484.png
في مجلد الدليل. هذا فحص فتح الديمو وليس تنفيذ عمليات مستخدم في الإنتاج. cache v484؛ backend/index/sw نُسخت انتقائياً
إلى ios-web وnative public. لا build أو نشر خدمة.

LF-025 يحمي واجهة نتائج المراجعات؛ هذا الإصلاح يحمي ما بعد await داخل
Backend. لا يغلق CommunityPost/ChapterReview/Block/Follow تلقائياً.
الطلب الذي أُرسل لا يُلغى، وحذف ملفات وسجل ليس عملية ذرية؛ يلزم فصل
مراجعة الاسترداد وصلاحيات الخادم.

[[bugs/LF-034-Review-Mutation-Session]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
