---
{"kind":"bug","id":"LF-058","status":"closed","priority":"P1","area":"catalog-query-correction","date":"2026-10-18","reviewed_on":"2026-10-18","source_commit":"41510ed","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-18","resolution_evidence":"[[sessions/2026-10-18-Search-Typo-Suggestions]]","next_action":"Repair Arabic all-format selection; author typo recovery, multi-edit queries, device timing and live-service gates remain separate"}
---
# LF-058: اقتراح تصحيح العنوان بدلاً من صفر نتائج صامت

العينة الثابتة One Peice وHnuter x Hunter كانت بلا نتائج أو اقتراح.
planner ينتج matches دقيقة وsuggestions منفصلة؛ Worker وfallback يستعملان
نفس السياسة: تعديل حرف واحد، بما فيه التبديل المتجاور، في عنوان كامل أو
اسم عنوان بديل نصي؛ طول normalized من5 إلى80، وثلاثة اقتراحات كحد أقصى.
لا اقتراح عند وجود نتائج دقيقة، ولا تغيير تلقائي للاستعلام أو IDs أو دمج
طبعات. المؤلفون والتصحيح متعدد الأخطاء خارج هذه الدفعة.

الاقتراح لا يظهر أثناء الخطأ/التحميل أو مع نص/نوع قديم؛ اختيار المستخدم
يحدث الحقل والنتائج. SearchBox يميز echo المؤجل من استبدال خارجي حتى
لا يفقد النص الأحدث أو يعيد مؤقتاً قديماً.

30 اختباراً جديداً: baseline مصحح27فشل/3نجاح؛ بعد المصدر30/30.
131/131 مرتبطة،1949/1949 كاملة، و6 حالات متصفح مستقلة.
فحص جميع الأنواع كشف خللاً مستقلاً للكلمة العربية «الكل» وسيتابع منفصلاً.

[[sessions/2026-10-18-Search-Typo-Suggestions]] | [[systems/Catalog-Search]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
