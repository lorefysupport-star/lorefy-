---
{"kind":"bug","id":"LF-029","status":"closed","priority":"P0","area":"accounts-media","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"e00599a","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Backend-Review-Owner]]","next_action":"Controlled live RLS/visitor and remaining profile/media mutation checks"}
---
# LF-029: حدود حساب طلب نشر المراجعة والوسائط

## السبب
publishReview كانت تواصل بعد getSession/رفع الصور/RPC ولو تبدل الحساب؛
_storageHeaders قد تقبل توكن حساب آخر أو تمسح جلسة جديدة بسبب فشل قديم.
حماية React في LF-025 لا تمنع backend من إرسال الخطوة التالية.

## الإصلاح
التقط الحساب والعميل وepoch والمالك المحلي عند البداية. افحصها بعد كل
انتظار وقبل الرفع والنشر والنتيجة. تحقق من مالك توكن Storage دون استعمال
user_metadata كصلاحية. لا تنظيف لوسائط قديمة تحت حساب جديد أو لصور نشر مؤكد.
طلبات أُرسلت بالفعل لا تُلغى بأثر رجعي؛ قد يبقى ملف مرفوع يتيم للمالك الأول.

14 حالة مصدر معزولة، منها 10 فاشلة في التشغيل الأول قبل الإصلاح، ونجاح
مسار HTTP الوهمي الكامل بصورته وRPC. التحقق لا يرسل طلب إنتاج ولا يثبت RLS.

[[sessions/2026-10-17-Backend-Review-Owner]] | [[systems/Accounts-Sync]] |
[[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
