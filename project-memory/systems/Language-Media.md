---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["عربي", "إنجليزي", "ترجمة", "صور", "مشاركة", "RTL", "LTR", "media", "share"]
---
# اللغة والصور والمشاركة

[i18n](../../modules/lorefy-i18n.js)، [UI runtime](../../modules/lorefy-ui-runtime.js)
ومكونات React/DOM enhancement تتشارك اللغة. بعض labels تأتي من المصدر
المرسوم نفسه؛ لا تعتمد على ترجمة DOM لاحقة لمعالجة كل زر أو حالة.

## العقود

- Arabic RTL وEnglish LTR يشملان dialogs، حالات loading/errors، accessibility labels والتواريخ.
- العنوان والنص الذي كتبه المستخدم ليسا نص واجهة لترجمته تلقائيًا.
- لا تخزن تغيير اللغة كحالة تقدم قراءة، ولا تفقده بعد إعادة العرض.
- Lucide hydration مقيد بنطاقه ولا يستبدل SVG موجودًا باستمرار.
- [cover API](../../modules/lorefy-cover-api.js) و[custom artwork](../../backend/lorefy-custom-artwork.js) يميزان الأصل والمصدر المخصص والfallback.
- [native photos](../../backend/lorefy-native-photos.js) تنسيق/اتجاه صور أصلية، لا مجرد CSS crop.
- [share studio](../../modules/lorefy-share-studio.js) يحافظ على حقوق الرؤية ووسائط المشاركة؛ غياب الصورة ليس سبب اختراع مصدر.

## الفحص

[[sessions/2026-10-16-Statistics-Locale]] يثبت ترجمة الإحصاءات في أول render
مع اتجاه وأرقام اللغة الحالية، دون تمرير النصوص المخصصة إلى ترجمة DOM.

[followers localization](../../tests/followers-localization.test.js)،
[work detail language](../../tests/work-detail-language.test.js)،
[reading diary language](../../tests/reading-diary-language.test.js)،
[icon hydration](../../tests/icon-hydration-stability.test.js)،
[image resilience](../../tests/image-resilience.test.js)،
[custom artwork persistence](../../tests/custom-artwork-persistence.test.js)،
[native photo format](../../tests/native-photo-format.test.js)،
[character share media](../../tests/character-share-media.test.js).

اختبارات الملفات/fixtures لا تغلق فحوص الصور والأذونات على iPhone. راجع
[[systems/Native-Release]]، ولا تنسخ صور المستخدمين إلى خزنة المعرفة.

[[systems/Profiles-Lists]] | [[systems/Explore-Works]] |
[[systems/Community-Notifications]] | [[systems/Appearance-Bundles]]

- [[bugs/LF-060-Image-Source-Lifecycle]]: حماية الصور تتجدد مع الرابط وإعادة المحاولة، وتلغي callbacks القديمة والمؤقت عند نجاح/إزالة الصورة؛17حالة جديدة،117مرتبطة،1977كاملة و4حالات Chrome؛ [[sessions/2026-10-18-Image-Source-Lifecycle]]. رفع الصور والأذونات الحية مستقلان.
