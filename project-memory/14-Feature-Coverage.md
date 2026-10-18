---
kind: coverage-map
status: source-reviewed
date: 2026-10-15
aliases: ["كل المزايا", "التغطية", "الميزات", "feature coverage"]
---
# مصفوفة تغطية التطبيق

اتساق المجتمع والبروفايل: [[sessions/2026-10-18-Social-Profile-UI]]، 14 اختبارًا
جديدًا و79 مرتبطة و2133 كاملة ناجحة. يشمل فحص المالك والزائر والقوائم والمنشورات
ومسودة النشر والردود وبدائل الحركة والشفافية؛ لا تعديل بيانات أو بيلد أو اعتماد جهاز.

تحسين الواجهة بالمهارات الجديدة: [[sessions/2026-10-18-Apple-UI-Surfaces]]،
9 اختبارات جديدة و2119 كاملة ناجحة؛ تنقل وتبويبات وبحث وترتيب وفحص
تقليل الحركة والشفافية والتباين في المتصفح. تبقى شهادة الجهاز وVoiceOver منفصلتين.

متابعة جودة التفاعل: [[bugs/LF-067-Press-Motion-Feedback]]، استجابة فورية
للأزرار الأساسية وإشارة ثابتة عند تقليل الحركة؛ 2110 اختبارات ناجحة وفحص
AR/light وEN/dark في المتصفح. [[sessions/2026-10-18-Apple-Interaction-Quality]]
يفصل النطاق عن فحص الجوال وFPS وتغطية جميع الإيماءات غير المنجزة.

كل صف نقطة دخول لنظام، لا ادعاء بأن كل زر ومسار فيه اختُبر. الروابط تؤدي
إلى العقود والمصدر والاختبارات. الاختبار الآلي وfixture المتصفح واختبار
الجهاز وحالة الخدمة الحية درجات دليل مختلفة. النتيجة الجديدة تُسجل في
[[sessions/2026-10-15-Source-Reorganization]]؛ الإيصالات الأقدم تبقى تاريخية.

| النظام | مصدر الملكية والمعرفة | تحقق المصدر | ما لا يثبته |
| --- | --- | --- | --- |
| التشغيل والتخزين المؤقت | [[systems/App-Boot]]؛ [entry](../index.html) و[cache](../sw.js) | [bootstrap](../tests/bootstrap-auth-safety.test.js)، [versions](../tests/version-consistency.test.js) | سرعة تشغيل بارد أو خلو iPhone من الانهيار |
| الدخول والخروج وحذف الحساب | [[systems/Accounts-Sync]]؛ [auth](../auth/lorefy-auth.js) | [native auth](../tests/native-auth-flow.test.js)، [deletion](../tests/account-deletion-recovery.test.js) | نجاح حساب Apple/Google فعلي وأذونات الجهاز |
| المزامنة وملكية البيانات | [[09-Data-Contracts]]؛ [backend](../backend/lorefy-backend.js) | [account isolation](../tests/account-sync-isolation.test.js)، [runtime repairs](../tests/runtime-repairs.test.js) | تعارض جهازين فعليين أو جاهزية كل migrations |
| الكتالوج وهوية الأعمال | [[systems/Catalog-Search]]؛ [identity](../modules/lorefy-catalog-identity.js) | [identity](../tests/catalog-identity.test.js)، [organization](../tests/catalog-organization.test.js) | صحة كل سجل خارجي أو اكتمال حقوق المحتوى |
| البحث والتحميل عند الطلب | [[systems/Catalog-Search]]؛ [loader](../modules/lorefy-catalog-loader.js) | [demand loading](../tests/catalog-demand-loading.test.js)، [recovery](../tests/catalog-search-recovery.test.js) | توفر المزود الخارجي دائمًا |
| الاستكشاف وتفاصيل الأعمال | [[systems/Explore-Works]]؛ [studio](../modules/lorefy-explore-studio.js) | [source synopsis](../tests/catalog-source-synopsis.test.js)، [language](../tests/work-detail-language.test.js) | وجود نبذة موثوقة لكل عمل |
| المكتبة والفصول والساعات | [[systems/Reading-Library]]، [[decisions/Saved-Reading-Metrics]]، [[sessions/2026-10-16-Reading-Estimate-Labels]]، [[sessions/2026-10-16-Statistics-Activity-Dates]] | [stability](../tests/reading-metrics-stability.test.js)، [estimate labels](../tests/reading-metric-labels.test.js)، [activity dates](../tests/statistics-activity-dates.test.js)، [chapter ownership](../tests/chapter-reading-ownership.test.js) | بقاء الحفظ بعد force-quit على كل جهاز؛ مطابقة نسخة الجهاز للمصدر |
| اليوميات والاقتباسات والحرق | [[sessions/2026-10-15-Live-Reading-Spoilers]]، [[sessions/2026-10-15-Diary-Drafts]] | [draft](../tests/reading-diary-draft.test.js)، [feedback](../tests/reading-diary-feedback.test.js) | قبول مشاركة أصلية أو Clipboard من النظام الحقيقي |
| الشخصيات وتقييماتها ومفضلاتها | [[systems/Explore-Works]]؛ [growth](../modules/lorefy-growth-features.js) | [atlas](../tests/character-atlas.test.js)، [saved summary](../tests/character-rating-summary.test.js)، [hydration](../tests/character-gallery-hydration.test.js) | اكتمال كل cast أو توافر كل صورة أو تثبيت المصدر على الجهاز |
| البروفايل الشخصي والعام | [[systems/Profiles-Lists]]؛ [public profile](../modules/lorefy-public-profile.js) | [view](../tests/public-profile-view.test.js)، [loading](../tests/public-profile-loading.test.js) | تحديث النسخة المثبتة أو صحة الإسقاط المنشور الآن |
| المتابعة والوصول والصور | [[12-Device-Repairs]] LF-006/007/008 | [avatars](../tests/connection-avatar.test.js)، [keys](../tests/connection-keyboard.test.js)، [locale](../tests/followers-localization.test.js) | جلسة VoiceOver فعلية أو كل روابط الصور البعيدة |
| اللستات والخصوصية والحظر | [[systems/Profiles-Lists]]، [[sessions/2026-10-15-Privacy-Safety-Repairs]] | [sections](../tests/profile-sections.test.js)، [privacy](../tests/privacy-safety-repairs.test.js) | أن التغيير المحلي وصل إلى قاعدة الإنتاج |
| المجتمع والتفاعلات والمحفوظات | [[systems/Community-Notifications]]؛ [community](../modules/lorefy-community.js) | [runtime repairs](../tests/runtime-repairs.test.js)، [account surfaces](../tests/account-surface-isolation.test.js) | نشر تفاعل فعلي أو قبول moderation على الخادم |
| صندوق الجرس وAPNs | [[systems/Community-Notifications]]، [[sessions/2026-10-16-Authorized-Push-Check]] | [delivery runtime](../tests/notification-delivery-runtime.test.js)، [native links](../tests/native-notifications-links.test.js)، قبول واختبار فعلي واحد أكد المالك استقباله وفتحه | تعميم كل الأجهزة والأحداث والإقلاع البارد؛ إصلاح النقل لم يُنشر |
| الثيمات والرفوف والإطارات | [[systems/Appearance-Bundles]]، [[decisions/Profile-Frame-Geometry]] | [frame motion](../tests/frame-motion.test.js)، [profile decoration](../tests/profile-decoration.test.js) | أن كل حزمة اجتازت اللمس والأداء على iPhone |
| مجانية الحزم وملكية الشراء | [[decisions/Temporary-Free-Bundles]]؛ [billing](../modules/lorefy-decoration-billing.js) | [paid collections](../tests/paid-collections.test.js) | جاهزية بيع فعلي أو موافقة حقوق الأصول |
| الصور واللغة والمشاركة | [[systems/Language-Media]] | [native photo formats](../tests/native-photo-format.test.js)، [image resilience](../tests/image-resilience.test.js) | فحص الكاميرا والمعرض والرفض والاتجاه على الهاتف |
| غلاف iOS وأدوات التطوير | [[systems/Native-Release]]؛ [xtool guide](../docs/XTOOL_NATIVE_DEVELOPMENT_AR.md) | [package contract](../tests/apple-release-package.test.js)، [runtime repairs](../tests/runtime-repairs.test.js) | بناء أو توقيع أو تثبيت حزمة جديدة؛ ممنوع في النطاق الحالي |
| ذاكرة المشروع وتنظيمه | [[13-Project-Story]]، [[11-Organization-Plan]] | [memory tests](../tests/project-memory.test.js)، `memory:audit` | فهم تلقائي لكل سطر أو فحص تلقائي للخدمات الحية |

## ثغرات المعرفة التي تبقى ظاهرة

- LF-003: يلزم فحص بصري وفعلي لكل إطار على نسخة جهاز مطابقة؛ البث القديم لا يكفي.
- LF-009: العدد وتحديث المعرض وإعادة المحاولة اختُبرت بالمصدر والمعاينة؛ اكتمال كل cast خارجي وتحديث النسخة المثبتة غير مثبتين. [[sessions/2026-10-15-Gallery-Hydration-Repair]].
- LF-010/LF-011: محرر المفضلة مربوط بمالكه، ويتجدد بعد تحميل الشخصيات مع Retry. [[sessions/2026-10-15-Character-Editor-Owner]] و[[sessions/2026-10-15-Character-Editor-Hydration]]؛ لا تثبيت جديد.
- LF-012: ترجمة المحرر وقص الإجراءات مثبتان بالمصدر والمتصفح. [[sessions/2026-10-16-Character-Editor-Locale]].
- APNS-001: اختبار واحد مقبول من APNs مع تأكيد المالك للاستقبال والفتح. [[sessions/2026-10-16-Authorized-Push-Check]]؛ ليس إثباتًا لكل الأجهزة أو نشرًا لإصلاح النقل.
- تسليم APNs، أذونات الصور، VoiceOver والأداء على الهاتف ليست مغلقة باختبارات Node.
- ملفات الإصلاح SQL لا تثبت نشرها؛ لا تُشغّلها لتغيير لون حالة في هذه الصفحة.
- المصدر المحلي لا يساوي IPA ولا TestFlight؛ آخر توجيه يمنع إنشاء نسخة جديدة.

## تعريف إغلاق المشكلة

سبب مثبت، اختبار يفشل قبل الإصلاح وينجح بعده، مراجعة للأثر الجانبي، مصدر
متزامن عند الحاجة، وإيصال يحدد الأمر والنسخة وحدود الدليل. إن كان الخلل
يتعلق بالجهاز أو خدمة حية، لا تُغلق تلك الطبقة بنتيجة fixture فقط.

[[00-Home]] | [[08-Feature-Router]] | [[10-Open-Questions]] | [[12-Device-Repairs]]

- LF-013: [[sessions/2026-10-16-Friend-Rating-Rows]]؛ محاذاة الاسم والدرجة في 80 حالة متصفح، دون اعتماد ذلك كفحص VoiceOver أو تثبيت جهاز.

- LF-014: [[sessions/2026-10-16-Diary-Position-Defaults]]؛ 10 regressions وملاحظة صفحة محفوظة ومعاد تحميلها مع الحرق باللغتين في متصفح معزول. لا دليل تركيب على جهاز.

- LF-021: [[sessions/2026-10-16-List-Keyboard-Focus]]؛ تركيز التحريك/الإزالة وأسماء العناصر ومسودة الحفظ مثبتة بالمصدر ومعاينة عربية، لا باختبار VoiceOver.

- LF-022: [[sessions/2026-10-16-List-Tool-Clipping]]؛ احتواء 30 زرًا في 320/440 عربي/إنجليزي دون تقليل هدف اللمس. العيب شوهد على الجوال، لكن الإصلاح لم يُركّب عليه.

- LF-023: [[sessions/2026-10-16-Home-Continuation]]؛ اختيار checkpoint بالمعرّف وربط فعلي بالرئيسية الاجتماعية، مع فتح التفاصيل بزر أصلي ودون نسبة مصطنعة. الجهاز والخدمة مستقلان.

- LF-024: [[sessions/2026-10-16-Review-Progress-Independence]]؛ نشر التقييم لا يستدعي الإكمال ولا يغيّر حالة صريحة أو تقدمًا جزئيًا/صفرًا. التهيئة القديمة والجهاز والخدمة مستقلة.

- LF-025: [[sessions/2026-10-17-Review-Response-Owner]]؛ استجابات النشر والحذف والرد والمؤقت تتبع حساب الطلب. لا اعتماد لصلاحيات الخدمة أو إلغاء الطلبات من هذا الدليل.

- LF-026: [[sessions/2026-10-17-Review-Editor-Owner]]؛ ملكية المسودة عند الفتح وفصل أجيال المحرر وحماية أحداث النص ونتائج النشر، مع حفظ التقييم والنص في معاينة محلية. لا اعتماد للخادم أو النسخة المثبتة.

- LF-027: [[sessions/2026-10-17-Review-Image-Owner]]؛ منع إرفاق صورة متأخرة بحساب أو مسودة أخرى عند القراءة والفك وتنفيذ updater، مع بقاء الضغط وحد 10 صور. ليس اختبار رفع سحابي أو صلاحيات Photos.

- [[bugs/LF-028-Review-Only-Library]] يكمل استقلال التقييم عن المكتبة؛ اختبارات حذف وتهيئة المصدر لا تغلق مزامنة حسابين حقيقيين.

- [[bugs/LF-029-Backend-Review-Owner]]: 14 حالة معزولة لحدود backend وStorage؛ لا اتصال إنتاج أو RLS حي.

- [[bugs/LF-030-Profile-Mutation-Owner]]: 17 حالة لانتقال الحساب عبر حفظ الملف والخصوصية والتسجيل؛ لا اعتماد للجهاز أو RLS الحي.

- [[bugs/LF-031-Session-Read-Owner]]: 10 حالات مصدر لفصل قراءات الجلسات وfinally؛ لا اعتماد تسجيل دخول حقيقي أو جهاز.

- [[bugs/LF-032-Editorial-Detail-Synopsis]]: استُكملت أوصاف ثلاثة أعمال AR/EN من الناشر؛ العينة لا تغلق جودة بقية الكتالوج. [[sessions/2026-10-17-Editorial-Detail-Synopsis]]

- [[bugs/LF-033-Storage-Operation-Owner]]: نطاق حساب داخل عمليات رفع/توقيع/حذف Storage؛ لا اعتماد RLS أو جهاز. [[sessions/2026-10-17-Storage-Operation-Owner]]

- [[bugs/LF-034-Review-Mutation-Session]]: منع طلب حذف/رد/تفاعل مراجعة قديم من استكمال سلسلة حساب آخر أو إرجاع نجاح متأخر. [[sessions/2026-10-17-Review-Mutation-Session]]

- [[bugs/LF-035-Profile-Relationship-Session]]: عزل متابعة/إلغاء متابعة وحظر/إلغاء حظر الملف حسب حساب الطلب. [[sessions/2026-10-17-Profile-Relationship-Session]]؛ الرؤية الحية منفصلة.

- [[bugs/LF-036-Community-Mutation-Session]]: تثبيت جلسة نشر/رد/تعديل/تفاعل المجتمع ورفض نتيجة بلاغ قديمة؛ [[sessions/2026-10-17-Community-Mutation-Session]]. لا اعتماد الرؤية بالخادم.

- [[bugs/LF-037-Chapter-Review-Session]]: عزل نشر/حذف تقييم الفصل مع بقاء الدرجات والحرق وفلتر المالك؛ [[sessions/2026-10-17-Chapter-Review-Session]].

- [[bugs/LF-038-Notification-Backend-Session]]: عزل تسجيل الجهاز والصندوق والمقروء وقنوات التنبيهات حسب سياق الطلب؛ [[sessions/2026-10-17-Notification-Backend-Session]]. وصول APNs والخادم والجهاز منفصل.

- [[bugs/LF-039-Account-Deletion-Session]]: عزل تأكيد حذف الحساب والطلب المعلّق ونتيجته؛ [[sessions/2026-10-17-Account-Deletion-Session]]. teardown وSDK والخدمة منفصلة.

- [[bugs/LF-040-Session-Teardown-Owner]]: منع تنظيف مفاتيح/monitoring/emit بعمل جلسة قديمة، مع إغلاق قناة التنبيه وflag حسب السياق؛ [[sessions/2026-10-17-Session-Teardown-Owner]]. تكامل تخزين SDK منفصل.

- [[bugs/LF-041-Profile-Read-Session]]: عزل قراءة الملفات والبحث والمتابَعين حسب جلسة المشاهد مع بقاء زيارة الآخرين؛ [[sessions/2026-10-17-Profile-Read-Session]]. الرؤية الحية والجهاز منفصلان.

- [[bugs/LF-042-Feed-Read-Session]]: قراءات المراجعات والمنشورات والأصدقاء والفصول ومرفقاتها تُرفض بعد تغير السياق؛ [[sessions/2026-10-17-Feed-Read-Session]]. الرؤية الحية والجهاز منفصلان.

- [[bugs/LF-043-Search-Alias-Refresh]]: تحديث محتوى الأسماء البديلة في الفهرس compact مع بقاء هوية الطبعة؛ [[sessions/2026-10-17-Search-Alias-Refresh]]. تصحيح الأخطاء الإملائية وفشل المزوّد ما زالا مستقلين.

- [[bugs/LF-044-Import-Request-Session]]: معاينة الاستيراد وتأكيده تخص حساب الفتح والمحاولة الأحدث؛ [[sessions/2026-10-17-Import-Request-Session]]. فشل الحفظ المحلي والخادم والجهاز مستقلون.

- [[bugs/LF-045-Import-Save-Failure]]: فشل الكتابة لا يعلن نجاح الاستيراد، مع تراجع متحقق وإعادة محاولة أو توضيح الحفظ الجزئي؛ [[sessions/2026-10-17-Import-Save-Failure]]. المزامنة والجهاز منفصلان.

- [[bugs/LF-046-Import-CSV-Records]]: قراءة CSV/TSV كسجلات كاملة، دون تحويل أسطر المراجعة لأعمال، ورفض الاقتباس الناقص؛ [[sessions/2026-10-17-Import-CSV-Records]]. فحص Cloud/الجهاز مستقل.

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

- [[bugs/LF-060-Image-Source-Lifecycle]]: حماية الصور تتجدد مع الرابط وإعادة المحاولة، وتلغي callbacks القديمة والمؤقت عند نجاح/إزالة الصورة؛17حالة جديدة،117مرتبطة،1977كاملة و4حالات Chrome؛ [[sessions/2026-10-18-Image-Source-Lifecycle]]. رفع الصور والأذونات الحية مستقلان.

- [[bugs/LF-061-Review-Image-Failure]]: فشل قراءة/فتح/تجهيز صورة المراجعة يظهر AR/EN دون فقد المسودة أو الصور السابقة، مع منع callbacks المتأخرة؛23حالة جديدة،163مرتبطة،2000كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Review-Image-Failure]]. صور البروفايل والأذونات والرفع الحي مستقلة.

- [[bugs/LF-062-Profile-Image-Editor]]: صور البروفايل والحفظ مرتبطان بمالك ونسخة المحرر وأحدث اختيار؛ فشل التجهيز ظاهر ولا تسقط النتائج القديمة على مسودة/حساب جديد؛37حالة جديدة،304مرتبطة،2037كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Profile-Image-Editor]]. لا إلغاء أو اعتماد لكتابة خدمة حية.

- [[bugs/LF-063-Invalid-Image-Fallback]]: البديل المخصص التالف ينتقل مرة إلى SVG محلي مناسب للغلاف أو الصورة الشخصية؛ مهلة مستقلة وعزل callbacks وإلغاء عند الاستبدال/الإزالة، مع بقاء منتقي الأغلفة خطأً دون صورة مولّدة؛11حالة جديدة،188مرتبطة،2048كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Invalid-Image-Fallback]]. الرفع وأذونات الجهاز والخدمة مستقلان.

- [[bugs/LF-064-Image-Preparation-Deadline]]: مهلة إجمالية 30 ثانية لتجهيز صور البروفايل ومرفقات المراجعة،مع رسالة AR/EN وحماية الصورة والنص السابقين ومنع النتائج المتأخرة؛ 28 حالة جديدة،343 مرتبطة،2076 كاملة و7 حالات Chrome منها مؤقت حقيقي؛ [[sessions/2026-10-18-Image-Preparation-Deadline]]. Photos والرفع والجهاز والخدمة مستقلة.

- [[bugs/LF-065-Runtime-Cleanup]]: ملخص كتالوج2,991 بايت وتحميل فهرس المعرّفات عند الحاجة،مع إزالة كود اختصار متقاعد وتنسيقاته وتوثيق المسؤوليات؛موارد بداية الرئيسية أقل29.06% في Chrome المعزول؛15 اختبارًا جديدًا،180مرتبطة و2091كاملة؛ [[sessions/2026-10-18-Runtime-Cleanup]]. حجم التثبيت وFPS والجهاز والخدمة مستقلان.

- [[bugs/LF-066-Rating-First-Completion]]: نجاح نشر تقييم عمل غير مسجل يضيفه للمكتملة ويلتقط تقدمه مرة واحدة، مع حماية الحالة/الصفر/الإزالة السابقة. 16 حالة جديدة و2107 اختبارات كاملة ناجحة؛ الديمو ثابت على 2 مكتملة و804 فصول و161 ساعة بعد إعادة النشر والتحميل؛ [[sessions/2026-10-18-Rating-First-Completion]]. لا بناء أو اعتماد حفظ حي.
