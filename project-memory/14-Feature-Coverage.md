---
kind: coverage-map
status: source-reviewed
date: 2026-10-15
aliases: ["كل المزايا", "التغطية", "الميزات", "feature coverage"]
---
# مصفوفة تغطية التطبيق

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
| المكتبة والفصول والساعات | [[systems/Reading-Library]]، [[decisions/Saved-Reading-Metrics]] | [stability](../tests/reading-metrics-stability.test.js)، [chapter ownership](../tests/chapter-reading-ownership.test.js) | بقاء الحفظ بعد force-quit على كل جهاز |
| اليوميات والاقتباسات والحرق | [[sessions/2026-10-15-Live-Reading-Spoilers]]، [[sessions/2026-10-15-Diary-Drafts]] | [draft](../tests/reading-diary-draft.test.js)، [feedback](../tests/reading-diary-feedback.test.js) | قبول مشاركة أصلية أو Clipboard من النظام الحقيقي |
| الشخصيات وتقييماتها ومفضلاتها | [[systems/Explore-Works]]؛ [growth](../modules/lorefy-growth-features.js) | [atlas](../tests/character-atlas.test.js)، [saved summary](../tests/character-rating-summary.test.js) | اكتمال كل cast أو توافر كل صورة؛ تحديث المعرض المفتوح متبقٍ |
| البروفايل الشخصي والعام | [[systems/Profiles-Lists]]؛ [public profile](../modules/lorefy-public-profile.js) | [view](../tests/public-profile-view.test.js)، [loading](../tests/public-profile-loading.test.js) | تحديث النسخة المثبتة أو صحة الإسقاط المنشور الآن |
| المتابعة والوصول والصور | [[12-Device-Repairs]] LF-006/007/008 | [avatars](../tests/connection-avatar.test.js)، [keys](../tests/connection-keyboard.test.js)، [locale](../tests/followers-localization.test.js) | جلسة VoiceOver فعلية أو كل روابط الصور البعيدة |
| اللستات والخصوصية والحظر | [[systems/Profiles-Lists]]، [[sessions/2026-10-15-Privacy-Safety-Repairs]] | [sections](../tests/profile-sections.test.js)، [privacy](../tests/privacy-safety-repairs.test.js) | أن التغيير المحلي وصل إلى قاعدة الإنتاج |
| المجتمع والتفاعلات والمحفوظات | [[systems/Community-Notifications]]؛ [community](../modules/lorefy-community.js) | [runtime repairs](../tests/runtime-repairs.test.js)، [account surfaces](../tests/account-surface-isolation.test.js) | نشر تفاعل فعلي أو قبول moderation على الخادم |
| صندوق الجرس وAPNs | [[systems/Community-Notifications]]، [[sessions/2026-10-14-APNs-Server-Setup]] | [delivery runtime](../tests/notification-delivery-runtime.test.js)، [native links](../tests/native-notifications-links.test.js) | قبول Apple وتسليم إشعار في الخلفية |
| الثيمات والرفوف والإطارات | [[systems/Appearance-Bundles]]، [[decisions/Profile-Frame-Geometry]] | [frame motion](../tests/frame-motion.test.js)، [profile decoration](../tests/profile-decoration.test.js) | أن كل حزمة اجتازت اللمس والأداء على iPhone |
| مجانية الحزم وملكية الشراء | [[decisions/Temporary-Free-Bundles]]؛ [billing](../modules/lorefy-decoration-billing.js) | [paid collections](../tests/paid-collections.test.js) | جاهزية بيع فعلي أو موافقة حقوق الأصول |
| الصور واللغة والمشاركة | [[systems/Language-Media]] | [native photo formats](../tests/native-photo-format.test.js)، [image resilience](../tests/image-resilience.test.js) | فحص الكاميرا والمعرض والرفض والاتجاه على الهاتف |
| غلاف iOS وأدوات التطوير | [[systems/Native-Release]]؛ [xtool guide](../docs/XTOOL_NATIVE_DEVELOPMENT_AR.md) | [package contract](../tests/apple-release-package.test.js)، [runtime repairs](../tests/runtime-repairs.test.js) | بناء أو توقيع أو تثبيت حزمة جديدة؛ ممنوع في النطاق الحالي |
| ذاكرة المشروع وتنظيمه | [[13-Project-Story]]، [[11-Organization-Plan]] | [memory tests](../tests/project-memory.test.js)، `memory:audit` | فهم تلقائي لكل سطر أو فحص تلقائي للخدمات الحية |

## ثغرات المعرفة التي تبقى ظاهرة

- LF-003: يلزم فحص بصري وفعلي لكل إطار على نسخة جهاز مطابقة؛ البث القديم لا يكفي.
- LF-009: العدد محفوظ ومستقر بالمصدر؛ اكتمال cast وتحديث معرض مفتوح حالة مستقلة.
- تسليم APNs، أذونات الصور، VoiceOver والأداء على الهاتف ليست مغلقة باختبارات Node.
- ملفات الإصلاح SQL لا تثبت نشرها؛ لا تُشغّلها لتغيير لون حالة في هذه الصفحة.
- المصدر المحلي لا يساوي IPA ولا TestFlight؛ آخر توجيه يمنع إنشاء نسخة جديدة.

## تعريف إغلاق المشكلة

سبب مثبت، اختبار يفشل قبل الإصلاح وينجح بعده، مراجعة للأثر الجانبي، مصدر
متزامن عند الحاجة، وإيصال يحدد الأمر والنسخة وحدود الدليل. إن كان الخلل
يتعلق بالجهاز أو خدمة حية، لا تُغلق تلك الطبقة بنتيجة fixture فقط.

[[00-Home]] | [[08-Feature-Router]] | [[10-Open-Questions]] | [[12-Device-Repairs]]
