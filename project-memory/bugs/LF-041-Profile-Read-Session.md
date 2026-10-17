---
{"kind":"bug","id":"LF-041","status":"closed","priority":"P1","area":"profile-read-session","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"05cfd24","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Profile-Read-Session]]","next_action":"Verify live visibility and installed-device behavior separately"}
---
# LF-041: ردود الملفات حسب جلسة المشاهد

البحث عن القراء وgetPublicProfile والمتابَعون وقوائم الاتصالات كانت تعيد
نتيجة بدأت للمشاهد السابق أو تستكمل RPC/توقيع صور أثناء جلسة لاحقة.
[المصدر](../../backend/lorefy-backend.js) يثبت حساب المشاهد والعميل والجيل
والمالك المحلي قبل الطلب، ويتحقق بعد auth وكل انتظار. المسارات ذات auth
تتحقق من تطابق هوية SDK، وتوقيع الصور يُنتظر قبل فحص النتيجة النهائي.

الهدف يبقى profileId الآخر؛ لا قيد جديد يحصر الزيارة في الملف الشخصي.
فشل القوائم/العدد/الصور الاختياري يبقى fallback للحساب الحالي، ولا يبتلع
تغير سياق الطلب. 35 حالة جديدة، منها 32 فشلت قبل الإصلاح؛ 77/77 مرتبطة.
الاختبارات تعزل RPC وStorage؛ لا اعتماد حي لسياسات الرؤية.

[[sessions/2026-10-17-Profile-Read-Session]] | [[systems/Profiles-Lists]] | [[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
