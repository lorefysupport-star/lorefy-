---
{"kind":"bug","id":"LF-061","status":"closed","priority":"P1","area":"review-image-read-decode-failure","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"dc269b0","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Review-Image-Failure]]","next_action":"Profile-image draft errors/ownership resolved in LF-062; invalid fallback artwork, physical Photos permission, real uploads and device certification remain separate"}
---
# LF-061: فشل إرفاق صورة المراجعة ظاهر وقابل للتعافي

Yn كان يقرأ الملف ثم يفك الصورة ويرسمcanvas دون error/abort handlers
أو معالجة استثناءات. الملف التالف يفشل بصمت؛ فشل read/constructor/
draw/encode قد يهرب دون رسالة. العرض أو الارتفاع الشديد الصغر يمكن
أن يقرب إلىcanvas صفري.

يظهر الآن خطأ AR/EN بحسب مرحلة القراءة أو الفتح أو المعالجة، مرة واحدة
لكل طلب؛ MIME غير الصوري الصريح يرفض قبل القراءة، والمجهول يبقى
للمفكك. يمسح input مبكراً لإعادة اختيار الملف نفسه. الأبعاد صالحة
ومحدودة560 كما كانت، مع حد أدنى1؛ JPEG quality.72 وحد10صور كما هما.
لا حد حجم جديد ولا تغيير اشتراك أو upload سحابي. الصور القائمة والنص
لا يمسان عند الفشل؛ callbacks المتأخرة لا تنبه أو تعدل مسودة حساب آخر
أو محرر بديل، ويتحقق updater من الملكية عند تنفيذه.

23 حالة جديدة:19فشل/4ضوابط على المرجع؛163/163 مرتبطة،2000/2000
كاملة، و5حالات متصفح مع صورة تالفة وإعادة محاولة صالحة AR/EN
وأعطال قراءة/تشفير محقونة. لا اعتماد Photos أو مزامنة/تخزين حي.

[[sessions/2026-10-18-Review-Image-Failure]] | [[bugs/LF-027-Review-Image-Owner]] | [[systems/Language-Media]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
