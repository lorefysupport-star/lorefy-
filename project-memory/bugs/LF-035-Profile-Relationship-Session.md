---
{"kind":"bug","id":"LF-035","status":"closed","priority":"P0","area":"profile-relationships","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"73447e3","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Profile-Relationship-Session]]","next_action":"Real two-account follow/block visibility and RLS remain unverified"}
---
# LF-035: المتابعة والحظر لا ينتقلان إلى الحساب التالي

بعد getSession كان toggleProfileFollow وsetProfileBlock يبدآن كتابة
بلا حارس افتتاحي؛ الحظر يقرأ this.user.id الجديد. بعد نتيجة قاعدة البيانات
كانا يؤكدان نجاحاً متأخراً لحساب آخر. يشمل ذلك إلغاء المتابعة وإلغاء الحظر.

[المصدر](../../backend/lorefy-backend.js) يربط الحساب والعميل والجيل
والمالك المحلي عند البداية، يطابق مالك auth، ويتحقق قبل الكتابة وبعدها.
الحظر يستخدم المالك الافتتاحي في فلاتر/صف الكتابة. الفرع المحلي للديمو
وتفعيل/إلغاء العلاقة وسياسة self-target باقية.

[45 حالة](../../tests/profile-relationship-session.test.js)، 36 فاشلة
قبل التصحيح؛ 84/84 في المجموعة المرتبطة. الخطأ في الخدمة يبقى خطأ.
لا إلغاء لكتابة أُرسلت، ولا اعتماد RLS أو رؤية الحظر لحسابين حقيقيين.

[[sessions/2026-10-17-Profile-Relationship-Session]] | [[systems/Accounts-Sync]] | [[systems/Profiles-Lists]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
