---
{"kind":"bug","id":"LF-030","status":"closed","priority":"P0","area":"accounts-profile","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"46eaba8","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Profile-Mutation-Owner]]","next_action":"Controlled live visitor/privacy and installed-device checks remain"}
---
# LF-030: حفظ الملف والخصوصية تحت الحساب الذي بدأ الطلب

saveProfile وsetProfilePrivacy كانتا تواصلان بعد auth/قراءة الملف/رفع
الصورة وRPC دون التحقق من أن الحساب لم يتغير. نتيجة خصوصية قديمة كانت
تكتب identity الخاص بالحساب التالي. completeOnboarding كانت تكتب الملف
والتفضيلات بعد اكتمال حفظ متأخر.

استُعمل نطاق LF-029 عند البدء وبعد كل انتظار. الحساب والعميل وepoch والمالك
المحلي ثابتة، وgetUser يجب أن يطابقها. يفشل طلب بلا مالك قبل الاتصال.
لا حذف لصور أو تعديل لبيانات تاريخية أو سر أو قاعدة بيانات.

17 حالة جديدة، 14 فاشلة قبل الإصلاح؛ مسار المالك الحالي يحفظ كما كان.
السياق القديم لأربعة اختبارات username أصبح يحدد مستخدماً مسجلاً بالفعل،
مع بقاء فحص RPC وcooldown وtaken والاسم غير الصالح دون تخفيف.

[[sessions/2026-10-17-Profile-Mutation-Owner]] | [[systems/Accounts-Sync]] |
[[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
