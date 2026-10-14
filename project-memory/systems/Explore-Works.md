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
