---
{"kind":"bug","id":"LF-065","status":"closed","priority":"P1","area":"startup-payload-retired-code","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"881d561","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Runtime-Cleanup]]","next_action":"Measure remaining startup assets and real device performance before further splitting; preserve offline catalog availability and user state"}
---
# LF-065: تنظيف مسار الدخول والكود المتقاعد

طلب المالك تنظيف الكود وترتيبه لتحسين الخفة. الجرد رصد107 ملفات دخول
مباشرة،وفهرس workParts كاملًا3,431,465 بايت قبل الواجهة. استُخرج ملخص
2,991 بايت من نفس manifest،بقيت metadata والأنواع وأحجام الأجزاء والتاريخ
كما هي. الفهرس الأصلي ذو122,705 معرّفات لم يتغير،ويُطلب مرة مشتركة
عند الحاجة،بمهلة20 ثانية وفشل قابل للمحاولة وعزل callbacks قديمة.

index يحمل الفهرس الكامل للرابط المباشر قبل اختيار الجزء؛ loader يجلبه
للعمل المفقود/الوصف المختصر عند الحاجة،ولا يجلبه للقوائم الفارغة أو القيم
الملغاة أو الأعمال المعروفة والأسماء البديلة. helper واحد لتوليد الملخص مع
مولّد الخريطة القائم،دون تشغيل مولّد بيانات شامل. كاش PWA يحتفظ بالفهرس
الكامل في التثبيت الخلفي؛ هذا تحسين مسار الصفحة وليس تصغير تثبيت أو كتالوج.

حُذف enhanceProfile غير القابل للوصول بعدreturn في اليوميات،واستدعاؤه
وتنسيقات اختصاره:3,011 بايت. المدخل الفعلي من تفاصيل العمل يعمل. تحديث
خريطة المسؤوليات وتقرير التنظيف يوضح الملفات والمولد وحدود القياس.

الرئيسية في Chrome معزول:11797094→8368402 بايت decoded resources،
وفر3428692(29.06%). لا ادعاء FPS أو بطارية أو سرعة iPhone. النصوص
لثلاث صفحات محفوظة والمظاهرAR/EN راجعت بصريًا. [[sessions/2026-10-18-Runtime-Cleanup]] يحفظ فحوص المصدر والواجهة والمحاولات.

[[systems/Catalog-Search]] | [[systems/Reading-Library]] | [[11-Organization-Plan]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

اللقطة النهائية:2091/2091 اختبارًا،صفر فشل،exit0،67440.0933ms؛180 مرتبطة.
