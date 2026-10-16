---
{"kind":"bug","id":"LF-014","status":"closed","priority":"P2","area":"reading","date":"2026-10-16","reviewed_on":"2026-10-16","source_commit":"6708c2a","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-16","resolution_evidence":"[[sessions/2026-10-16-Diary-Position-Defaults]]","next_action":"Validate on a future explicitly authorized native build"}
---
# LF-014: موضع مناسب للملاحظة دون تبديل اختيار القارئ

كان الكتاب الجديد يبدأ على فصل، واختيار عمل مختلف يبقي الوحدة التلقائية
القديمة؛ كما تجاهلت البداية التقدم المجلدي وحده. صار الافتراضي صفحة للكتاب
والرواية، وفصلاً للأعمال المتسلسلة. التقدم المحفوظ، موضع التعديل، المدخل
الصريح والاختيار اليدوي تتقدم على النوع. لا تحويل أو كتابة في تقدم القراءة.

[اختبار المحرر الفعلي](../../tests/reading-diary-position.test.js):
6 حالات فاشلة قبل الإصلاح، ثم 10/10 بعده، والمجموعة المرتبطة 41/41.
[المتصفح](../../qa/diary-position-browser.cjs) أثبت حفظ الصفحة 23 وإعادة
تحميل الملاحظة وكشف/إخفاء الحرق باللغتين في ديمو معزول.

[[sessions/2026-10-16-Diary-Position-Defaults]] | [[15-Work-Control]] |
[[12-Device-Repairs|دليل الجهاز التاريخي لا يثبت تثبيت هذا الإصلاح]] | [[05-Verification]]
