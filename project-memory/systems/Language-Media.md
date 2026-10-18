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

[[bugs/LF-071-Artwork-Storage-Quota]] addresses the Discord cover-picker quota
toast: reclaim only regenerable downloaded cast caches, retry, or reject with
AR/EN text preserving prior artwork/account state. Six new cases,42 focused,
2183 full passing; [[sessions/2026-10-19-Discord-Artwork-Quota]]. Actual device
storage composition and native permission/upload evidence remain separate.

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

- [[bugs/LF-061-Review-Image-Failure]]: فشل قراءة/فتح/تجهيز صورة المراجعة يظهر AR/EN دون فقد المسودة أو الصور السابقة، مع منع callbacks المتأخرة؛23حالة جديدة،163مرتبطة،2000كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Review-Image-Failure]]. صور البروفايل والأذونات والرفع الحي مستقلة.

- [[bugs/LF-062-Profile-Image-Editor]]: صور البروفايل والحفظ مرتبطان بمالك ونسخة المحرر وأحدث اختيار؛ فشل التجهيز ظاهر ولا تسقط النتائج القديمة على مسودة/حساب جديد؛37حالة جديدة،304مرتبطة،2037كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Profile-Image-Editor]]. لا إلغاء أو اعتماد لكتابة خدمة حية.

- [[bugs/LF-063-Invalid-Image-Fallback]]: البديل المخصص التالف ينتقل مرة إلى SVG محلي مناسب للغلاف أو الصورة الشخصية؛ مهلة مستقلة وعزل callbacks وإلغاء عند الاستبدال/الإزالة، مع بقاء منتقي الأغلفة خطأً دون صورة مولّدة؛11حالة جديدة،188مرتبطة،2048كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Invalid-Image-Fallback]]. الرفع وأذونات الجهاز والخدمة مستقلان.

- [[bugs/LF-064-Image-Preparation-Deadline]]: مهلة إجمالية 30 ثانية لتجهيز صور البروفايل ومرفقات المراجعة،مع رسالة AR/EN وحماية الصورة والنص السابقين ومنع النتائج المتأخرة؛ 28 حالة جديدة،343 مرتبطة،2076 كاملة و7 حالات Chrome منها مؤقت حقيقي؛ [[sessions/2026-10-18-Image-Preparation-Deadline]]. Photos والرفع والجهاز والخدمة مستقلة.
