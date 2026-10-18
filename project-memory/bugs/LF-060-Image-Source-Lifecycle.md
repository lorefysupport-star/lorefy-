---
{"kind":"bug","id":"LF-060","status":"closed","priority":"P1","area":"image-source-fallback-lifecycle","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"1b56a19","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Image-Source-Lifecycle]]","next_action":"Inspect local upload read/decode failures; physical permissions, real storage uploads and source-cover rights remain separate"}
---
# LF-060: حماية الصورة تتبع رابطها الحالي

حارس الصور العام في index.html كان يكتفي بعلامة واحدة على العنصر.
تغيير src/srcset لا يجدد الحماية؛ مؤقت المصدر القديم يمكنه استبدال
الصورة الجديدة، وبعد فشل أول يبقى fallbackApplied فيمنع معالجة التالي.
صور picker قد ترسل خطأ native ثم خطأ ثانياً من المؤقت.

أصبح لكل طلب على عنصر IMG حالة في WeakMap، ومؤقت5500ms وlisteners
تخص ذلك المصدر. تغيير الرابط أو srcset أو إعادة تعيين الرابط نفسه
يلغي القديم؛ success/removal يلغي المؤقت والمراقبة. callbacks القديمة
لا تمس الحالة الجديدة. المصدر المحلي البديل لا يستبدله مؤقت remote
قديم؛ lazy يعاد ربطه بالرؤية لكل مصدر، بلا rescan أو layout متزامن.
لا يعرض picker غلافاً مولداً قابلًا للاختيار، ولا يعاد إشعار خطأ native
مكتمل قبل المراقبة. مهلة الصور العادية تحفظ فرصة معالجة الخطأ الأصلية.

17حالة جديدة:14فشل/3ضوابط على المرجع؛117/117 مرتبطة،1977/1977
كاملة، مع4حالات Chrome نهائية وbaseline للمؤقت/retry/picker.
لا تغيير بيانات صور مالك أو حساب أو تخزين أو خدمة.

[[sessions/2026-10-18-Image-Source-Lifecycle]] | [[systems/Language-Media]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
