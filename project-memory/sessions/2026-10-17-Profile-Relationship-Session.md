---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"73447e3","verified_on":"2026-10-17","related":["[[bugs/LF-035-Profile-Relationship-Session]]"]}
---
# عزل متابعة وحظر الملف

45 حالة على Backend الحقيقي في VM مع جلسة/جدول معزولين. تبديل الحساب
والعميل والجيل والمالك المحلي أثناء auth وأثناء الكتابة، لكل من follow
وunfollow وblock وunblock. تفويض مالك مختلف والنجاح الطبيعي والمرفوض
وسلوك الديمو المحلي محفوظة. 36 فشلت قبل الإصلاح؛ 84/84 مرتبطة نجحت بعده.
لا متابعة أو حظر لمستخدم حقيقي، ولا تعديل خدمة.

الدليل الأول: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/profile-relationship-before.txt`.
المجموعة المركزة: `profile-relationship-focused.txt` في المجلد نفسه.
التحقق الكامل **1476/1476**، صفر فشل، exit 0 (100174ms).
الدليل: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/profile-relationship-full-tests.txt`.
مطابقة SHA-256 لملفات backend/index/sw في المصدر والنسختين الأصلية ناجحة؛ cache v485، backend/index/sw منسوخة انتقائياً
إلى ios-web وnative public. لا بيلد جديد.

التحقق بعد الكتابة يمنع النجاح المتأخر، ولا يعكس كتابة أُرسلت بالفعل.
رؤية الحظر وصلاحيات الجدول ومعالجة واجهة الحسابين على الجهاز بوابات
منفصلة. جلسة Supabase المتاحة للموصل لا تسمح بفحص المشروع حالياً.

[[bugs/LF-035-Profile-Relationship-Session]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
