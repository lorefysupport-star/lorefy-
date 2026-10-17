---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"e02ef95","verified_on":"2026-10-17","related":["[[bugs/LF-033-Storage-Operation-Owner]]"]}
---
# عزل عمليات Storage عند تبديل الحساب

اختبارات VM للمصدر الحقيقي، auth وHTTP معزولان دون بيانات مستخدم حقيقي.
24 حالة: الانتظار للتفويض، استجابة HTTP بعد تغير الحساب/العميل/الجيل/
المالك المحلي، تطابق مالك مسار الرفع، JSON توقيع متأخر، وسلامة النجاح
داخل الجلسة مع توقيع صورة لقارئ آخر حسب الخادم. 23 فشلت قبل التصحيح.
الدليل الأول: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/storage-owner-before.txt`.

67/67 في storage-operation-owner وcustom-artwork-persistence
وprofile-mutation-owner وreview-backend-owner. جرى تعريف fixture
الرفع القديم كجلسة live بمالك معروف بدل اختبار رفع من Backend افتراضي.
التحقق الكامل **1411/1411**، صفر فشل، exit 0 (84752ms).
الدليل: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/storage-owner-full-tests.txt`.

cache v483؛ backend/index/sw نُسخت انتقائياً إلى ios-web وnative public.
لا build أو نشر خدمة. وثائق Storage/auth/changelog قُرئت في جولة LF-029
في هذا اليوم؛ لا تغيير API أو SDK أو سياسة RLS في هذه الدفعة.
[وثائق رفع Storage](https://supabase.com/docs/reference/javascript/storage-from-upload).
موصل المشروع سبق أن رفض الوصول؛ لم يُستخدم مسار بديل لتعديل الإنتاج.

[[bugs/LF-033-Storage-Operation-Owner]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
