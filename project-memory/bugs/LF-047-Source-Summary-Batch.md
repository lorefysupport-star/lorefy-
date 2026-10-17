---
{"kind":"bug","id":"LF-047","status":"closed","priority":"P1","area":"editorial-detail-summaries","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"ace871c","source_verified":true,"device_verified":false,"service_verified":false,"requires_device":false,"requires_service":false,"verified_on":"2026-10-17","resolution_evidence":"[[sessions/2026-10-17-Source-Summary-Batch]]","next_action":"Continue remaining shelf metadata sample; cover/edition/rights/device gates stay separate"}
---
# LF-047: وصف فعلي لكتاب ورواية وكوميكس من عينة القوائم

الفيزياء الفلكية: مقدمة قصيرة جداً، فارس بلا وجود، وNimona لم تعرض وصفاً
بالعربية أو الإنجليزية، حتى بعد hydrate في التطبيق المحلي. حالة الغياب
مثبتة في editorial-next-hydrated-before.json خارج Git.

[المصدر](../../uploads/lorefy-editorial-picks.js) يضيف ثلاثة ملخصات أصلية
قصيرة وإسناداً وتاريخ مراجعة، مع مطابقة id/title/auth القائمة. لا تنزيل
للكتاب أو استبدال غلاف أو حالة قراءة أو تقييم أو طبعة. sourceSynopsis
يرى الوصف الجديد في اللغتين؛ enrichment يبقى في المصدر وworker/bootstrap.

6 حالات: 3 وصف فشلت قبل الإصلاح و3 حفاظ على القيم نجحت. 61/61 مرتبطة أولياً.
المصادر المقروءة: [هنداوي/الفيزياء الفلكية](https://www.safahat.org/books/58169180/)،
[هنداوي/فارس بلا وجود](https://www.safahat.org/books/70959593/)،
[National Book Foundation/Nimona](https://www.nationalbook.org/books/nimona/).
الأخيرة جهة الجائزة ووصفها/تعليل اللجنة؛ ليست دعوى قراءة وصف صفحة HarperCollins
التي لم تعرض النص عبر القارئ. لا نسخ من نص الكتاب أو ادعاء اعتماد حقوق الغلاف.

[[sessions/2026-10-17-Source-Summary-Batch]] | [[systems/Catalog-Search]] | [[systems/Explore-Works]] | [[12-Device-Repairs]] | [[15-Work-Control]] | [[18-Progress-Handoff]]

النهاية: 8 حالات جديدة بما فيها تسمية الإسناد؛ 111/111 مرتبطة. كامل
1758/1759 كشف artifact parity فقط، وصُحح بعد تدقيق diff لعمل Nimona واحد؛
parity 1/1 و30/30 عقود لاحقة ناجحة. عزل اختبار تجهيز الويب يبقى متابعة
مستقلة؛ لا إعادة تسمية إيصال الكامل ولا ادعاء نسخة جهاز.
