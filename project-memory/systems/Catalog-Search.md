---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["بحث", "كتالوج", "نتائج", "catalog", "search", "worker"]
---

[[sessions/2026-11-01-Catalog-Classification-Work]] removes duplicate content
classification per uncached record without changing policy.1322 real records:
45.56 to27.36ms median, half the normalizations, identical results;3145 tests,
44 actual-app browser checks. This is not a full-app latency claim.

[[sessions/2026-10-30-Search-Audit]] removes repeated fallback downloads,
queued obsolete scans, hidden rankings and fullcache reads; aliases, source types,
Unicode/page-size keys and partial failures are repaired. Actual browser found
and verified All/الكل event canonicalization.3111 full tests/8format browser;
11valid public API probes, Googlequota unresolved. Cold675.32→303.80ms and
broadranking386.78→54.42ms are localCPU evidence; native delivery, stalledshard,
optionalproduction sources and peak-load/dataquality gates remain separate.
# الكتالوج والبحث

[[sessions/2026-10-29-Search-Performance]] removes the delayed search-helper
chain and slowest-provider publication barrier, aborts obsolete input requests,
prioritizes early book coverage and reuses multilingual normalized fields.
2990 tests and local AR/EN browser checks pass.121920-record cold search
1696.33→789.07ms; controlled first-result1416→85ms. Worker/cache/native-web
asset versions are synchronized; installed native delivery and device timing
remain separate. This supersedes the prior unmeasured search-performance status.

[[sessions/2026-10-29-Search-Edition-Groups]] adds search-only display groups,
not identity merges. Retain Google subtitle/publisher/language/publicationDate;
old records without known subtitle stay separate. Exact literary type/title/
author/subtitle or explicit Open Library work linkage only, excluding ambiguous
volumes/issues/adaptations. Frozen chooser retains original record IDs. Query/
owner/filter context bounds stable group order and representative.2963 tests,
99 local fixtures; live provider/native acceptance and F07 remain separate.

[[sessions/2026-10-29-UI-Foundation-Phase-Seventeen]] adopts the Work hero image
without changing source choice, gradient, crop or navigation. A missing image
does not disable Work identity or review entry. No provider/catalog mutation;
edition grouping and real-service acceptance stay open.6 unchanged geometry
configurations,107 controlled browser cases across new and regression paths.

[[sessions/2026-10-29-UI-Foundation-Phase-Sixteen]] adopts Explore featured
artwork/poster and format art without changing source choice, ranking, filters
or library edits. Missing art retains navigation; title clicks still choose
formats. Late/cancelled artwork from an old pick cannot fail the next pick.
2900 full tests,54 browser cases; no provider or edition-grouping acceptance.

[[sessions/2026-10-29-UI-Foundation-Phase-Thirteen]] opts Explore result/rail/
collection item covers into managed loading/error/missing display. Retry is a
sibling of Open work and cannot accidentally navigate. Original IDs/queries/
ranking/provider behavior remain unchanged.2874 full tests/43 browser cases;
actual provider availability and edition grouping are not certified.

[[sessions/2026-10-28-UI-Foundation-Phase-Twelve]] refines search/collection
byline display only:12px/two relative lines, full tooltip and accessible
title-plus-author/source label. Metadata-only attribution remains its catalog
source, not an invented author. Ranking, query lifecycle, IDs, callbacks and
provider logic unchanged.48 browser cases/2859 full tests; edition grouping and
shared cover failure/retry remain separate.

[[sessions/2026-10-26-Explore-Types-Search]] redesigns the eight format tiles and
search in the selected glass identity. Exact/alias relevance, combined filters,
36-result paging, explicit error states and private owner-scoped session history
extend existing search; My lists remains owner-only. Local browser checks pass;
production availability/quota and native performance remain separate gates.

[[sessions/2026-10-26-Explore-Immersive-Reference]] follows the owner's selected
image: backdrop behind Explore controls, real featured poster/Add and three
recommendation previews, with full collections preserved.2541 source tests pass;
AR/EN320/390/768 browser checks completed locally. No service or billing change.

[[sessions/2026-10-26-Explore-Cinema]] applies the approved glass/cinematic design
locally to Explore, preserving catalog/search contracts. It separates global and
format input identity and fixes sheet/nav layering.30 responsive browser cases;
full2537 source tests pass. Real backend search remains a separate service check.

[[sessions/2026-10-26-Open-Catalog]] adds bounded BookBrainz/Wikidata/GCD to
Open Library in existing search. Identity scopes and source/license attribution
are retained; missing works use explicitly local drafts. Production gateway,
accounts and authenticated submission remain gates. Local server:8796.

[[sessions/2026-10-20-Publisher-Index]] يكمل58نبذة فيفهرس الناشر:
29جديدة،منها27فيالمكتبةالعربية،فانخفض نقصنبذها1217إلى1190؛واثنتان
فيشارد160المؤجل. لا تغييرIDs أوكتالوجخام أوبياناتالقارئ.1206سجلات
ذاتنواقص فيقائمةخارجية تفرق المصدرغيرالمفحوص عنالمفقود والمحجوبالمرصود.

[[sessions/2026-10-20-Carousel-Publisher]] يملأ3نبذ فارغة عبرالتصحيحات
الموجودة معروابط الناشرومطابقة العنوان/المؤلف/النوع.1220ناقصة أصبحت1217
فيعينة1246سجلًا عربيًا بعدالتصحيح؛لا تغييرللشاردات أوIDs أوالسنوات أوالتقييمات.

[[sessions/2026-10-20-Remaining-Skills]] يدقق1246سجلًا عربيًا محليًا:
1220بلا نبذة و1167بلا مرجعغلاف. محاولاتOpenLibrary محجوبة/مهلة؛
لم تستورد بيانات ولم تثبت غيابها لدىالمصدر؛ لا دمج بالعنوان أوتقييمات مخترعة.

## التدفق

[[bugs/LF-074-Author-Query-Corrections]] adds sourced author aliases and bounded
two-word typo suggestions for longer queries; exact matching and edition identity
remain authoritative. [[sessions/2026-10-19-Author-Query-Corrections]].

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

Type-page search now connects its selected format to the existing debounced online lookup and tracks pending/error states. Golden Son by Pierce Brown verified through Novel search and work detail; 53 focused checks. [[sessions/2026-10-21-Format-Search-Online]].


2026-10-21: [[sessions/2026-10-21-Search-Audit]] repairs main All-format online lookup and isolates People/Lists from catalog listeners; 234 focused checks, browser result evidence, and five matching installed simulator assets. Live directory/provider coverage remains separate. No commit or push.

[[sessions/2026-10-29-Jikan-Retirement]]: the maintainer confirms public Jikan shutdown on October 1. Tenrai-compatible source routing and legacy gateway v14 replace dead lookups while preserving MAL IDs; 365 focused checks and real browser cast retrieval pass. This enriches characters/covers/chapters; main search aggregation remains separate.
