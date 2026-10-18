---
{"kind":"bug","id":"LF-063","status":"closed","priority":"P1","area":"invalid-image-fallback","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"ef04d86","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Invalid-Image-Fallback]]","next_action":"Source fallback failure verified; real Photos permissions and uploads, two-account visibility and deployed-service validation remain separate"}
---
# LF-063: الصورة البديلة التالفة لها نهاية محلية واضحة

installImageResilience في index.html كان يقبل data-fallback من نوع data:image،
ثم يزيل مستمعات الفشل قبل تعيينه ويتجاهل طفرة src الخاصة به. لذلك فشل
الصورة الأصلية ثم البديل المخصص يترك صورة مكسورة بلا مهلة أو مسار نهائي.
أُثبت بعشرة اختبارات فاشلة وغطاء/avatar بعرض طبيعي صفر في Chrome.

البديل المخصص له محاولة محمية ومستمعات ومهلة 5500ms مستقلة، ثم ينتقل
إلى SVG المحلي المناسب مرة واحدة. النجاح والإزالة والاستبدال يحررون العمل،
والـcallbacks القديمة لا تستبدل مصدرًا جديدًا أو صورة مستخدم. تغير metadata
يبطل العمل السابق أيضًا. لا إعادة فحص شاملة أو قراءة layout متزامنة جديدة.

منتقي الأغلفة يظل يبلغ خطأ المصدر مرة واحدة دون تثبيت صورة مولدة قابلة
للاختيار. البديل المحلي النهائي لا يعاد تسليحه عند الخطأ؛ لا حلقة تحميل.
الأصل الافتراضي ينتظر حدث الخطأ الأصلي/المهلة كما كان، ولا تسبقه معالجة
فورية تخفي onError الخاص بالمكوّن. الاختبار يستعمل صور QA بلا بيانات شخصية.

188/188مرتبطة،2048/2048كاملة(220302.6715ms،exit0)،و5حالات Chrome.
هذه أدلة مصدر وديمو معزول،لا فحص جهاز/خدمة أو اعتماد إصدار.

[[sessions/2026-10-18-Invalid-Image-Fallback]] | [[bugs/LF-060-Image-Source-Lifecycle]] | [[systems/Language-Media]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
