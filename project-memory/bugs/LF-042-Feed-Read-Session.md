---
{"kind":"bug","id":"LF-042","status":"closed","priority":"P1","area":"feed-read-session","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"539b15d","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Feed-Read-Session]]","next_action":"Keep live feed visibility/device checks separate; continue search and import audit"}
---
# LF-042: قراءات المجتمع تتبع حساب الطلب

قراءات المراجعات وتقييمات الأصدقاء والمنشورات وتقييمات الفصول كانت تستكمل
استعلامات أو تعيد نتيجة بعد تغير العميل/جيل الجلسة/المالك المحلي. فحص user.id
وحده في تجميع الصفحات والأصدقاء لا يكفي. صور مرفق المنشور كانت تستطيع
استكمال items بعد انتقال الحساب أثناء صورة المرفق الأولى.

[المصدر](../../backend/lorefy-backend.js) يثبت سياق المشاهد، يتحقق بعد كل
استعلام ومجموعة توقيع، وبعد كل صفحة وقبل دفعة الأصدقاء التالية. هوية mine
من المالك الملتقط. helper المرفق يفحص قبل توقيع items وبعده، مع الحفاظ على
fallback الصور داخل نفس السياق. الطلبات المرسلة بالتوازي لا تُلغى.

50 حالة جديدة: أول 49 أظهرت 38 فشلاً قبل الإصلاح، ثم أضيفت حالة دفعة الأصدقاء.
التقييم الكسري والحرق والتعليقات والصور وpagination وهدف الحساب الآخر محفوظة.
[[sessions/2026-10-17-Feed-Read-Session]] | [[systems/Community-Notifications]] | [[systems/Accounts-Sync]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
