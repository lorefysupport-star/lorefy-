---
{"kind":"bug","id":"LF-046","status":"closed","priority":"P1","area":"import-csv-tsv","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"ca18a18","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Import-CSV-Records]]","next_action":"Verify production sync and provider file variations separately"}
---
# LF-046: سجلات CSV لا تُقطع عند أسطر الملاحظات

Goodreads والقارئ العام كانا يقسمان الملف إلى أسطر قبل فك الاقتباسات.
سطر داخل مراجعة قد يطابق عملاً آخر ويصبح إدخال مكتبة وهمياً، مع زيادة misses.
واجهة الملف تقبل TSV لكن المحلل يفصل بالفواصل فقط. الملف باقتباس غير مغلق
كان يعيد بيانات جزئية بدل رفضه.

[المصدر](../../modules/lorefy-growth-features.js) يقرأ سجلات كاملة مع حالة
الاقتباس ويدعم الفواصل المقتبسة وdouble quotes والأسطر داخل الحقل وCR/LF/CRLF.
القارئ العام يحدد comma/tab من رأس السجل خارج الاقتباس وبعد الأسطر الفارغة.
BOM والصفوف الفارغة لا يغيران المطابقة. اقتباس غير مغلق يرفض الملف قبل المعاينة.
قواعد الحالة/الدرجة واختيار الطبعة بقيت كما كانت.

11 حالة نهائية؛ أول 9 أظهرت 6 فشلاً. اختبار الأسطر الفارغة الأول فشل ثم أصلح.
97/97 مرتبطة قبل cache. لا ادعاء دعم كل تنسيقات جميع المزوّدين.
[[sessions/2026-10-17-Import-CSV-Records]] | [[systems/Reading-Library]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
