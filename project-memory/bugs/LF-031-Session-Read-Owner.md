---
{"kind":"bug","id":"LF-031","status":"closed","priority":"P0","area":"auth-session","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"d803865","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Session-Read-Owner]]","next_action":"Keep live sign-in/resume and controlled multi-account device verification separate"}
---
# LF-031: استجابة جلسة قديمة لا تعيد هوية الحساب السابق

_readSession كانت تكتب user أو تمسحه أو تنظف الجلسة بعد انتظار بلا حارس،
وgetSession تشارك promise واحداً حتى بين سياقَي حسابين. finally القديم
يمسح خانة فحص أحدث. هذا يسبق حواجز النشر والحفظ ولا يغطيه فحص المزامنة وحده.

النطاق يشمل mode/العميل/epoch/user/المالك المحلي. مشاركة الفحص داخل
السياق نفسه فقط؛ كل مرحلة قديمة ترفض قبل تغيير الهوية أو تنظيف الجلسة
أو إرسال احتفاظ Apple. finally يحرر خانته فقط.

10 حالات، 9 فاشلة قبل الإصلاح؛ استعادة user غير محمل وقراءات متزامنة
داخل الجلسة تبقى ناجحة. لا إبطال جلسات خادم أو استبدال SDK أو تغيير أسرار.

[[sessions/2026-10-17-Session-Read-Owner]] | [[systems/Accounts-Sync]] |
[[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
