---
{"kind":"session","status":"verified-source","date":"2026-10-17","source_commit":"e00599a","reviewed_on":"2026-10-17","verified_on":"2026-10-17","related":["[[bugs/LF-029-Backend-Review-Owner]]"]}
---
# منع استكمال نشر قديم تحت حساب جديد

[Backend](../../backend/lorefy-backend.js) يلتقط نطاق الطلب قبل انتظار
getSession، ثم يتحقق من الحساب والعميل والـepoch والمالك المحلي بعد كل
صورة وRPC وhydrate. مُحضّر التوكن يرفض تغيير الحساب أثناء انتظاره، ولا
يمسح جلسة الحساب الجديد عند وصول فشل طلب قديم. لا تغيير في واجهة SDK أو
مفاتيح التخزين أو RLS أو schema.

[14 حالة فعلية](../../tests/review-backend-owner.test.js): 10 فشلت في أول
تشغيل قبل الإصلاح؛ أضيف فحص التوكن الافتراضي ومسار الرفع الحقيقي بfetch
وRPC وهميين. كلها ناجحة بعد الإصلاح، مع مجموعات ملكية React والجلسات
والمجتمع والصور. لا صور أو credentials حقيقية.

رُوجع [سجل Supabase](https://supabase.com/changelog.md)، وإعلان TLS القديم
[تفصيله](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) لا يغير
واجهة الرفع هنا. رُوجع [Storage upload](https://supabase.com/docs/reference/javascript/storage-from-upload)
و[getSession](https://supabase.com/docs/reference/javascript/auth-getsession).
هذه حماية سياق عميل، والخادم يقرر الصلاحيات. لا user_metadata في قرار الحماية.

نُسخ backend/index/sw فقط لحزمتَي الويب؛ cache v479. لا نشر خدمة أو
migrations أو تغيير جلسة/توكن حقيقي أو إصدار native. طلب سبق إرساله
قد يتم بالخادم؛ لا حذف تعويضي تحت حساب جديد. الملف اليتيم المحتمل لا
يُحذف تلقائياً بهذه الجولة. حفظ البروفايل وعمليات backend الأخرى لها
بوابات مراجعة منفصلة.

نتيجة المجموعة الكاملة تضاف بعد اكتمالها.
[[systems/Accounts-Sync]] | [[17-Extended-Review-Plan]] | [[05-Verification]] | [[15-Work-Control]]

المجموعة الكاملة النهائية: 1357/1357 ناجحة، صفر فشل، exit 0، نحو 95 ثانية. ملف التسجيل المحلي review-backend-full-tests.txt خارج Git.
