---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["بحث", "كتالوج", "نتائج", "catalog", "search", "worker"]
---
# الكتالوج والبحث

## التدفق

[خطة التحميل](../../modules/lorefy-catalog-plan.js) تختار أجزاء البدء من نوع
العمل/هويته؛ [loader](../../modules/lorefy-catalog-loader.js) يحمل أجزاء أخرى
عند الطلب. [عامل البحث](../../modules/lorefy-catalog-search-worker.js) يستخدم
فهرس الاكتشاف الأصغر، ثم تُحمّل أجزاء الأعمال المطابقة. العرض الإضافي لا
يعني أن كل البيانات موجودة منذ البدء. [CATALOG_LOADING](../../docs/CATALOG_LOADING.md)
شرح المصدر؛ عدد الأجزاء فيه تاريخي، لا عدد يُنسخ إلى كل تقرير جديد.

## هوية وسياسة

- [identity](../../modules/lorefy-catalog-identity.js) يميّز IDs والنسخ؛ العنوان المتشابه ليس نفس العمل.
- [policy](../../modules/lorefy-catalog-policy.js) و[taxonomy](../../modules/lorefy-comics-taxonomy.js) يحددان الأهلية والنوع.
- [bibliographic overrides](../../modules/lorefy-bibliographic-overrides.js) تعديلات مدققة، لا تخمين مؤلف أو تقييم.
- [detail cache](../../modules/lorefy-catalog-detail-cache.js) غير سجل تقدم المستخدم.
- [API catalog](../../modules/lorefy-api-catalog.js) و[data proxy](../../modules/lorefy-data-proxy.js) مسارات قائمة؛ لا تنشئ كتالوجًا موازيًا.
- غياب/فشل الفهرس يجب أن يظهر كفشل قابل للتعامل، لا صفر نتائج موثوق.

## أدوات وطرق التحقق

[build-runtime-catalog](../../tools/build-runtime-catalog.js)،
[build-search-index](../../tools/build-catalog-search-index.mjs)،
[catalog-demand-loading](../../tests/catalog-demand-loading.test.js)،
[catalog-search-recovery](../../tests/catalog-search-recovery.test.js)،
[catalog-identity](../../tests/catalog-identity.test.js)،
[catalog-content-policy](../../tests/catalog-content-policy.test.js).

الفهرس المعرفي لا ينسخ الأوصاف أو آلاف الأغلفة والبيانات؛ راجع مصدرها عند
مهمة تعديلها. تشغيل أدوات import/refresh الكبيرة ليس خطوة تنظيف عامة.

[[systems/App-Boot]] | [[systems/Explore-Works]] |
[[systems/Reading-Library]] | [[11-Organization-Plan]]

- [[bugs/LF-043-Search-Alias-Refresh]]: تحديث محتوى الأسماء البديلة في الفهرس compact مع بقاء هوية الطبعة؛ [[sessions/2026-10-17-Search-Alias-Refresh]]. تصحيح الأخطاء الإملائية وفشل المزوّد ما زالا مستقلين.

- [[bugs/LF-047-Source-Summary-Batch]]: أوصاف AR/EN موثقة لكتاب الفيزياء الفلكية ورواية فارس بلا وجود وكوميكس Nimona؛ [[sessions/2026-10-17-Source-Summary-Batch]]. بقيّة العينة والأغلفة والطبعات والحقوق منفصلة.

- [[bugs/LF-048-Test-Preparation-Isolation]]: اختبار إعدادات native ينفذ projection المحدود دون تجهيز المشروع أو توليد الكتالوج؛ [[sessions/2026-10-17-Test-Preparation-Isolation]]. فحص parity الفعلي باقٍ.

- [[bugs/LF-049-Travel-Fiction-Summaries]]: ثلاثة أوصاف AR/EN أخرى للرحلات والرواية والمذكرات المصورة؛ [[sessions/2026-10-17-Travel-Fiction-Summaries]]. جزء runtime المتأثر فقط حُدث مع بقاء الهوية والعدد والحقوق كحدود منفصلة.

- [[bugs/LF-050-Book-Sample-Summaries]]: أوصاف موثقة للكتب الـ18 المتبقية؛ جميع كتب العينة الـ24 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Book-Sample-Summaries]]. أدوار المساهمين والطبعات والحقوق منفصلة.

- [[bugs/LF-051-Novel-Sample-Summaries]]: أوصاف موثقة للروايات الـ18 المتبقية؛ جميع روايات العينة الـ23 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Novel-Sample-Summaries]]. حفظ هوية العمل والطبعة والتقدم، مع بقاء الحقوق والمراجعة الببليوغرافية منفصلتين.

- [[bugs/LF-052-Comic-Sample-Summaries]]: استُكملت أوصاف الكوميكس الـ21 المتبقية؛ جميع كوميكس العينة الـ24 لها AR/EN، مع 42 صفحة/لغة وفصل وصف المجلد الثاني عن العدد الثاني؛ [[sessions/2026-10-17-Comic-Sample-Summaries]]. مصدر Peanuts فهرس Open Library، لا تحقق ناشر؛ حقوق الصور والطبعات مستقلة.

- [[bugs/LF-053-Catalog-Search-Retry]]: فشل الفهرس أو جزء نتائج لا يتحول إلى «لا توجد نتائج»؛ زر retry يعيد نفس البحث والنوع، والأجزاء الناجحة تبقى محملة؛ [[sessions/2026-10-18-Catalog-Search-Retry]]. لا تصحيح إملائي أو اختبار مزود/جهاز حي ضمن هذه الدفعة.

- [[bugs/LF-054-Catalog-Search-Deadline]]: مهلة محدودة لـWorker وفهرس البحث البديل، مع إلغاء الطلب وإهمال رسائل Worker القديم؛ [[sessions/2026-10-18-Catalog-Search-Deadline]]. تعليق raw shard وتصحيح الإملاء والمزوّد والجهاز بوابات مستقلة.

- [[bugs/LF-055-Catalog-Shard-Deadline]]: جزء كتالوج صامت يحرر طابور التحميل بعد مهلة؛ retries معزولة عن callbacks القديمة، مع إبقاء تحميل الأجزاء الناجحة؛ [[sessions/2026-10-18-Catalog-Shard-Deadline]]. ليست مهلة إجمالية لكل الكتالوج أو اعتماد أداء الجهاز.

- [[bugs/LF-056-Search-Field-Lifecycle]]: كتابة البحث لا تُفقد عند تحديث النتائج، مع اتجاه النص التلقائي وزر مسح مسمّى يعيد التركيز؛ [[sessions/2026-10-18-Search-Field-Lifecycle]]. محرر المفضلة الحالي حقل مستقل؛ استكمل [[bugs/LF-057-Editor-Search-Direction]] اتجاهه.

- [[bugs/LF-057-Editor-Search-Direction]]: اتجاه بحث مفضلة الأعمال والشخصيات يتبع النص في الواجهتين؛ 8 حالات متصفح و110 اختبارات مرتبطة؛ [[sessions/2026-10-18-Editor-Search-Direction]]. لا تغيير للترتيب أو الحفظ.

- [[bugs/LF-058-Search-Typo-Suggestions]]: اقتراحات عناوين AR/EN لتعديل حرف واحد، يختارها القارئ دون دمج الطبعات؛30حالة جديدة و131مرتبطة و1949كاملة و6حالات Chrome؛ [[sessions/2026-10-18-Search-Typo-Suggestions]]. «الكل» العربي يحتاج إصلاحاً منفصلاً؛ لا اعتماد جهاز أو مزود حي.

- [[bugs/LF-059-All-Format-Search]]: فلتر All/الكل يبحث في الأنواع الثمانية بدلاً من سقوط العربية إلى Manga؛11حالة جديدة،179مرتبطة،1960كاملة و4حالات Chrome؛ [[sessions/2026-10-18-All-Format-Search]]. بداية التصفح وقيود النوع المحدد محفوظة.

- [[bugs/LF-065-Runtime-Cleanup]]: ملخص كتالوج2,991 بايت وتحميل فهرس المعرّفات عند الحاجة،مع إزالة كود اختصار متقاعد وتنسيقاته وتوثيق المسؤوليات؛موارد بداية الرئيسية أقل29.06% في Chrome المعزول؛15 اختبارًا جديدًا،180مرتبطة و2091كاملة؛ [[sessions/2026-10-18-Runtime-Cleanup]]. حجم التثبيت وFPS والجهاز والخدمة مستقلان.
