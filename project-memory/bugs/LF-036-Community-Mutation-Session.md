---
{"kind":"bug","id":"LF-036","status":"closed","priority":"P0","area":"community-requests","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"d801080","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Community-Mutation-Session]]","next_action":"Live community ownership/visibility and chapter/notification requests remain separate"}
---
# LF-036: منشورات المجتمع ونتائج البلاغات تتبع جلسة الطلب

publishCommunityPost (ويشمله replyCommunityPost)، mutateCommunityPost
وsetCommunityPostReaction كانت تنتظر auth بلا نطاق افتتاحي وتعيد RPC قديم
بلا حارس. submitReport كان يعيد تأكيد بلاغ قديم بعد تبديل الحساب.

[Backend](../../backend/lorefy-backend.js) يثبت الحساب/العميل/الجيل/المالك
المحلي قبل الانتظار، يطابق auth للنشر والتعديل والتفاعل، ويتحقق بعد RPC.
النص والقائمة والمرفق وparent_ref والتحرير والحذف وإزالة التفاعل محفوظة.
البلاغ ينفذ تحت auth الخادم الحالي، ونتيجته لا تعود لحساب آخر.

[27 حالة](../../tests/community-mutation-session.test.js)، 25 فاشلة قبل
الإصلاح؛ 80/80 في المجموعة المرتبطة. لا RPC إنتاج أو محاكاة مستخدم حقيقي.
الطلب المرسل لا يُلغى أو يُعكس. هذه حماية عميل وليست اعتماد RLS أو رؤية حية.

[[sessions/2026-10-17-Community-Mutation-Session]] | [[systems/Community-Notifications]] | [[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
