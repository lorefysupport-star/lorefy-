---
{"kind":"bug","id":"LF-062","status":"closed","priority":"P0","area":"profile-draft-image-save-ownership","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"93f43e2","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Profile-Image-Editor]]","next_action":"Invalid fallback artwork resolved in LF-063; real Photos permissions, two-account storage visibility and deployed-service validation remain separate"}
---
# LF-062: صور البروفايل والحفظ يتبعان مسودة المالك

Uo كان يقرأ ويفك الصور دون ربط بالحساب أو نسخة المحرر أو أحدث اختيار.
الملف المتأخر يستبدل preset أو مسودة معاد فتحها، وأخطاء read/decode/
canvas صامتة. حفظ br بعدawait يطبق النتيجة ويغلق الواجهة دون تحقق
من بقاء المحرر أو الحساب؛finally قد يحرر قفل حفظ أحدث.

Ho ينشئ نسخة محرر بمالك طلب صريح؛ الإغلاق والاستبدال يبطلان السابقة.
عداد مستقل للصورة والبنر يمنع نتيجة اختيار قديم، واختيارpreset يبطل
الملف المنتظر. setters المؤجلة تتحقق عند التنفيذ؛ الصور القائمة والقص
والحد8MB و1400px وJPEG.82 محفوظة. فشل القراءة/الفتح/المعالجة ظاهر
AR/EN،input يعاد ضبطه،والحفظ ينتظر اكتمال تجهيز الصور.

الحفظ مرتبط بالمحرر عند البدء وبعد الرد،والكتابات المؤجلة بالمالك.
نفس الحساب يبقي طلبات الحفظ متسلسلة،بينما قفل حساب سابق لا يعطل
حساباً جديداً أو يحرر قفله. المسودة الجديدة تستطيع تجهيز الصور أثناء
اكتمال حفظ قديم؛ المحرر الجاري حفظه فقط يمنع تغيير صوره. الحماية
لا تلغي طلب خادم أُرسل ولا تتراجع عن كتابة خدمة سابقة.

37حالة جديدة:30فشل/7ضوابط على المرجع؛304/304 مرتبطة،2037/2037
كاملة،و5حالات Chrome مع مرجعين للفشل. هذه أدلة مصدر وديمو معزول،
وليست اختبار حسابين حقيقيين أو upload/Photos أو اعتماد إصدار.

[[sessions/2026-10-18-Profile-Image-Editor]] | [[bugs/LF-030-Profile-Mutation-Owner]] | [[systems/Profiles-Lists]] | [[systems/Language-Media]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
