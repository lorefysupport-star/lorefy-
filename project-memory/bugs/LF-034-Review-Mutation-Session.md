---
{"kind":"bug","id":"LF-034","status":"closed","priority":"P0","area":"review-mutations","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"20fca00","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Review-Mutation-Session]]","next_action":"Live review ownership/RLS verification and other social mutations remain separate"}
---
# LF-034: حذف المراجعة والرد والتفاعل يتبع حساب الطلب

deleteReview كانت تواصل من استعلام الصور إلى إزالتها ثم حذف السجل دون
حارس الحساب. addReviewComment وsetReviewReaction كانتا تتابعان بعد
getSession أو تعيدان نجاح RPC متأخر بعد تبديل الحساب. حماية الواجهة لا
تمنع هذه الطلبات نفسها.

[المصدر](../../backend/lorefy-backend.js) يلتقط النطاق عند البداية، يتحقق
بعد كل انتظار، ويطابق مالك session للرد والتفاعل قبل RPC. حذف المراجعة
يحتفظ بترتيب التخزين الحالي ولا يغير سياسة الصلاحيات أو نصوص القارئ.

[20 حالة](../../tests/review-mutation-session.test.js)، 18 فاشلة قبل التصحيح؛
75/75 في المجموعة المرتبطة. النجاح الحالي، حذف التفاعل، parent_ref
وفشل الشبكة محفوظة. لا إلغاء RPC أو HTTP أُرسل. حذف الملفات والسجل
ليس معاملة ذرية بهذا الإصلاح، ولا تُعتمد صلاحيات الخادم من هذه الاختبارات.

[[sessions/2026-10-17-Review-Mutation-Session]] | [[systems/Accounts-Sync]] | [[systems/Community-Notifications]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
