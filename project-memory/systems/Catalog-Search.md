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
