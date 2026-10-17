---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"271f6ad","verified_on":"2026-10-17","related":["[[bugs/LF-038-Notification-Backend-Session]]"]}
---
# عزل Backend التنبيهات والاشتراك

أول تشغيل: 37 حالة، 34 فشلاً. النهائي 40 حالة مع 3 حالات إضافية لتداخل
إزالة قناة/محاولة أحدث، رفض auth وasync cleanup، وعميل إزالة القناة عند
الخروج. source حقيقي في VM، RPC/query/channel معزولة وtokens اصطناعية.
64/64 مرتبطة: notification-backend-session، notification-delivery-runtime،
native-notifications-links، beta-final-recovery وaccount-sync-isolation.
اختبار فلتر الأحداث الذاتية صار يشغل Backend كاملاً بدل قص دالة من مصدره.

الدليل الأول: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/notification-backend-before.txt`.
المجموعة المرتبطة: notification-backend-focused.txt في المجلد نفسه.
التحقق الكامل **1566/1566**، صفر فشل، exit 0 (237355ms).
الدليل: `D:/LorefyDevelopment/QA/remaining-repairs-20261017/notification-backend-full-tests.txt`.
معاينة home معزولة 390px بالعربية والإنجليزية بلا pageerror، mode demo.
notification-home-browser.json وhome-notification-session-ar.png في مجلد الدليل.
مطابقة SHA-256 لملفات backend/index/sw في النسخ الثلاث ناجحة؛ notification-asset-hashes.json. cache v488؛ backend/index/sw منسوخة انتقائياً
إلى ios-web وnative public. لا native build أو نشر أو APNs إرسال.

حقول التسجيل وحد قائمة الصندوق واختيار معرفات المقروء محفوظة. المحاولة
الأقدم لا تستبدل الأحدث؛ إغلاق قناة قديمة لا يستعمل عميل الحساب الجديد
أو يمحو اشتراكه؛ callback قديم أو بعد الإغلاق لا يصل إلى المستمع.
وثائق الواجهة التي قُرئت لهذه الدفعة:
[subscribe](https://supabase.com/docs/reference/javascript/subscribe) و[removeChannel](https://supabase.com/docs/reference/javascript/removechannel).
لا تغيير في SDK أو API الخادم؛ الإصلاح نطاق طلب واستعمال العميل المنشئ.
هذا لا يلغي RPC سبق إرساله، ولا يثبت ملكية الجهاز/الرؤية في الإنتاج،
ولا يغلق حدود signOut/deleteAccount العامة أو APNs-002 غير المنشور.

[[bugs/LF-038-Notification-Backend-Session]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
