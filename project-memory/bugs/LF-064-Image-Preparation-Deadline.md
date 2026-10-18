---
{"kind":"bug","id":"LF-064","status":"closed","priority":"P1","area":"image-preparation-deadline","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"78e1b61","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Image-Preparation-Deadline]]","next_action":"Real Photos permissions, uploads and two-account visibility remain separate; this deadline bounds asynchronous preparation, not synchronous canvas execution or server requests"}
---
# LF-064: مهلة تجهيز الصور تعيد إتاحة الحفظ

في uploads/files/lorefy-app.js كان Uo يترك editor.pending للصورة أو البنر
حتى load/error/abort فقط. قراءة أو decoder لا يرجع حدثًا يمنع Save بلا
نهاية. Yn لمرفقات المراجعة كان يصمت عند التعليق نفسه. مرجع 78e1b61:
20 حالة تفشل من 28 جديدة؛ 8 ضوابط جديدة و60 قديمة تمر. Chrome أثبت
قراءة معلقة: لا مؤقت، لا حفظ، والمحرر مفتوح.

المساران يضعان مهلة إجمالية 30000ms بعد التحقق من الملف؛ لا تتجدد عند
الانتقال من القراءة إلى فك الصورة. finish يحرر المؤقت عند النجاح أو الخطأ
أو ملاحظة زوال الملكية. انتهاء المهلة ينهي الطلب ويعرض AR/EN للحساب
والمحرر الحاليين فقط؛ Uo يحرر pending الخاص باختياره الحالي دون مسح
طلب صورة أخرى أو اختيار أحدث. callbacks المتأخرة لا تجهز أو تطبق صورة.

تبقى الصورة والمرفقات والنص السابق، ويمكن الحفظ أو إعادة اختيار الملف.
لم تتغير قيود MIME والحجم، JPEG والحجم الهندسي أو حد المرفقات. المهلة
لا تلغي عمل القارئ/decoder الأساسي ولا تقطع canvas المتزامن أو طلب خدمة.

343/343 اختبارات مرتبطة،2076/2076 كاملة،صفر فشل،exit0؛ ست حالات
Chrome بمهلة مستدعاة يدويًا وحالة بساعة حقيقية (30001.5ms). هذا دليل
مصدر وديمو معزول؛ لا اعتماد لرفع أو Photos أو خدمة أو جهاز فعلي.

[[sessions/2026-10-18-Image-Preparation-Deadline]] | [[bugs/LF-061-Review-Image-Failure]] | [[bugs/LF-062-Profile-Image-Editor]] | [[systems/Profiles-Lists]] | [[systems/Language-Media]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
