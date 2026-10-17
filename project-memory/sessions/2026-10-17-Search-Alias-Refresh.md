---
{"kind":"session","status":"verified-source","date":"2026-10-17","reviewed_on":"2026-10-17","source_commit":"38bc374","verified_on":"2026-10-17","related":["[[bugs/LF-043-Search-Alias-Refresh]]"]}
---
# تحديث محتوى الأسماء البديلة

15 حالة و74/74 مرتبطة: catalog-search-alias-refresh وcatalog-search-recovery
وexplore-performance-regressions وcatalog-ranking-performance وarabic-library-repair
وcatalog-demand-loading وcatalog-identity. baseline 14 فشلاً من 15.
الدليل D:/LorefyDevelopment/QA/remaining-repairs-20261017/search-alias-before.txt
وsearch-alias-focused.txt وsearch-alias-browser.json.

نسخ data/loader/worker/search-worker/index/sw الستة طابقت SHA-256
بالشجرة الأصلية والنسختين. cache v493 وعناوين العامل وتبعياته محدثة.
لا توليد كتالوج أو تغيير بياناته أو بناء native.
آخر فحص كامل للأساس السابق 1695/1695؛ هذه الدفعة ثبتت بالمجموعة المرتبطة
والمتصفح. لا يُنسب الفحص الكامل السابق إلى هذه الدفعة.

عينة مستقلة من الفهرس المحلي: 14 استعلاماً، في search-fixed-query-baseline.json
خارج Git. الأسماء العربية والإنجليزية والبدائل أعادت نتائج؛ One Peice
وHnuter x Hunter بلا نتيجة. تصحيح الأخطاء الإملائية لا يُعد منجزاً بهذه الدفعة.
تكرار قصر الشوق أو 1984 في الفهرس ليس دليلاً وحده على ازدواجية الطبعة؛ يلزم
فحص الهوية والمصدر. تعطل المزوّد واختيار الطبعة والجهاز gates مستقلة.

[[bugs/LF-043-Search-Alias-Refresh]] | [[05-Verification]] | [[15-Work-Control]] | [[18-Progress-Handoff]]
