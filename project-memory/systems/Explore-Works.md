---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["استكشاف", "تفاصيل", "أعمال", "شخصيات", "مشابه", "explore", "relations", "characters"]
---
# الاستكشاف وتفاصيل الأعمال والشخصيات

أحدث عرض للعمل: [[sessions/2026-10-19-Work-Experience]]؛ هوية أوضح، تبويب
مراجعات مباشر، حالة قراءة وخيارات غلاف وشخصيات متناسقة دون مخزن بيانات جديد.
[[bugs/LF-068-Review-Rating-Restore]] يحمي الرقم اليدوي عند فتح المراجعة.

[explore studio](../../modules/lorefy-explore-studio.js) ينظم رفوف الاكتشاف
واستمرار القراءة والأنواع. يعتمد على الحالة المشتركة، تفضيلات القارئ، الهوية
وسياسات الأهلية، لا كتالوج وهمي جديد. `readingSnapshot` يختار صفحات للأعمال
النصية عند توافرها، والفصول وفق البيانات؛ نسبة unknown تبقى unknown.

## العلاقات والتفاصيل

[work relations](../../modules/lorefy-work-relations.js) يستخدم AniList/MAL IDs
الصريحة، ويحتفظ بنوع العلاقة Prequel/Sequel/Source وغيرها. عنوان مشابه أو
أرقام عشوائية لا تثبت العلاقة. الكاش وtimeouts لا يجب أن يحوّلا فشل الشبكة
إلى قائمة فارغة دائمة. المؤلف يُختار حسب دور Story/Writer المدقق.

[product core](../../modules/lorefy-product-core.js)،
[chapter metadata](../../modules/lorefy-chapter-metadata.js) والتطبيق الرئيسي
تتشارك التفاصيل والتوصيات. [[systems/Catalog-Search]] يحدد هوية العمل،
و[[systems/Reading-Library]] تقدم القارئ. العرض الكبير لا يغيّر بياناته.

## الشخصيات

[[bugs/LF-083-Character-Discovery-Retry]] evicts rejected discovery promises so
the next explicit attempt can recover; concurrent callers and successful sources
remain shared. Domain matching and live-provider approval are unchanged.

[[bugs/LF-082-Character-Provider-Body]] bounds eighteen remaining provider JSON
reads separately from header deadlines, retaining pagination, fallbacks and
partial-cast flags. It neither aborts transport nor caps total traversal time.

[[bugs/LF-081-Character-Catalog-Taxonomy]] reuses shared work-type predicates for
bundled assets in Arabic/English and skips excluded ordinary-book downloads.

[[bugs/LF-080-Character-Catalog-Loading]] bounds bundled-script loading, releases
failed attempts for retry and isolates late callbacks before provider fallback.

[[bugs/LF-079-Character-Search-Response]] rejects invalid list/record structures
before caching; same-query retry can recover, while valid empty results still
cache normally. It is not a full-provider or bibliographic data-quality approval.

[[bugs/LF-078-Character-Search-Deadline]] bounds both headers and JSON for name
search in one ten-second budget; late data cannot populate either cache. Other
provider paths and physical-device performance remain separate acceptance.

[[bugs/LF-077-Character-Editor-Extra-Work]] removes a full catalog scan for hidden
work results and the redundant queued render after Clear. This is operation-count
acceptance, not a physical-device latency certification.

[[bugs/LF-076-Character-Search-Identity]] documents reproduced name-search leakage
across ordinary books, ambiguous titles and conflicting provider identities.
[[sessions/2026-10-19-Character-Search-Identity]] separates source acceptance from
historical Discord records and future device/provider verification.

[character system](../../modules/lorefy-character-system.js) والـcatalogs المؤجلة
يخدمان اختيار الشخصيات وتقييمها وقوائمها ومشاركتها. لا تخلط بحث شخصية ببحث
عنوان عمل، ولا تخترع صورًا أو تقييمات عند غياب المصدر.

الفحص: [explore studio](../../tests/explore-studio.test.js)،
[editorial explore](../../tests/editorial-explore.test.js)،
[work relations](../../tests/work-relations.test.js)،
[character atlas](../../tests/character-atlas.test.js)،
[character search](../../tests/character-name-search.test.js)،
[work list presentation](../../tests/work-list-presentation.test.js).

[[systems/Catalog-Search]] | [[systems/Reading-Library]] |
[[systems/Language-Media]] | [[08-Feature-Router]]

- [[bugs/LF-032-Editorial-Detail-Synopsis]]: استُكملت أوصاف ثلاثة أعمال AR/EN من الناشر؛ العينة لا تغلق جودة بقية الكتالوج. [[sessions/2026-10-17-Editorial-Detail-Synopsis]]

- [[bugs/LF-047-Source-Summary-Batch]]: أوصاف AR/EN موثقة لكتاب الفيزياء الفلكية ورواية فارس بلا وجود وكوميكس Nimona؛ [[sessions/2026-10-17-Source-Summary-Batch]]. بقيّة العينة والأغلفة والطبعات والحقوق منفصلة.

- [[bugs/LF-049-Travel-Fiction-Summaries]]: ثلاثة أوصاف AR/EN أخرى للرحلات والرواية والمذكرات المصورة؛ [[sessions/2026-10-17-Travel-Fiction-Summaries]]. جزء runtime المتأثر فقط حُدث مع بقاء الهوية والعدد والحقوق كحدود منفصلة.

- [[bugs/LF-050-Book-Sample-Summaries]]: أوصاف موثقة للكتب الـ18 المتبقية؛ جميع كتب العينة الـ24 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Book-Sample-Summaries]]. أدوار المساهمين والطبعات والحقوق منفصلة.

- [[bugs/LF-051-Novel-Sample-Summaries]]: أوصاف موثقة للروايات الـ18 المتبقية؛ جميع روايات العينة الـ23 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Novel-Sample-Summaries]]. حفظ هوية العمل والطبعة والتقدم، مع بقاء الحقوق والمراجعة الببليوغرافية منفصلتين.

- [[bugs/LF-052-Comic-Sample-Summaries]]: استُكملت أوصاف الكوميكس الـ21 المتبقية؛ جميع كوميكس العينة الـ24 لها AR/EN، مع 42 صفحة/لغة وفصل وصف المجلد الثاني عن العدد الثاني؛ [[sessions/2026-10-17-Comic-Sample-Summaries]]. مصدر Peanuts فهرس Open Library، لا تحقق ناشر؛ حقوق الصور والطبعات مستقلة.

- [[bugs/LF-053-Catalog-Search-Retry]]: فشل الفهرس أو جزء نتائج لا يتحول إلى «لا توجد نتائج»؛ زر retry يعيد نفس البحث والنوع، والأجزاء الناجحة تبقى محملة؛ [[sessions/2026-10-18-Catalog-Search-Retry]]. لا تصحيح إملائي أو اختبار مزود/جهاز حي ضمن هذه الدفعة.
