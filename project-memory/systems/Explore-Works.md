---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["استكشاف", "تفاصيل", "أعمال", "شخصيات", "مشابه", "explore", "relations", "characters"]
---
# الاستكشاف وتفاصيل الأعمال والشخصيات

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
