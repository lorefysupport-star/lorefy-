---
kind: router
status: source-reviewed
date: 2026-10-14
aliases: ["خريطة الميزات", "أين الكود", "feature map"]
---
# أين أبدأ؟

هذه خريطة بداية العمل، لا شهادة أن كل ميزة تعمل على جهاز حقيقي. اقرأ الملاحظة
والمصدر أولًا، ثم شغّل الاختبار المناسب. أوامر الاختبار محلية ولا تنشر شيئًا.

| المهمة أو الكلمات | معرفة النظام | اختبار بداية |
| --- | --- | --- |
| تشغيل، تحميل، blank screen، cache | [[systems/App-Boot]] | `node --test tests/bootstrap-auth-safety.test.js tests/version-consistency.test.js` |
| حساب، دخول، مزامنة، ضياع تقييم، logout | [[systems/Accounts-Sync]] | `node --test tests/account-sync-isolation.test.js tests/state-recovery-runtime.test.js tests/native-auth-flow.test.js` |
| بحث، كتالوج، نوع عمل، search، catalog | [[systems/Catalog-Search]] | `node --test tests/catalog-demand-loading.test.js tests/catalog-search-recovery.test.js tests/catalog-identity.test.js` |
| فصول، ساعات، صفحات، progress، reading | [[systems/Reading-Library]] | `node --test tests/reading-metrics-stability.test.js tests/reading-status-policy.test.js tests/library-view.test.js` |
| بروفايل، لست، مفضلة، profile، lists | [[systems/Profiles-Lists]] | `node --test tests/public-profile-view.test.js tests/profile-sections.test.js tests/profile-lists-unified.test.js` |
| مجتمع، منشور، تعليق، جرس، notification | [[systems/Community-Notifications]] | `node --test tests/community-cloud.test.js tests/notification-delivery-runtime.test.js tests/home-social-discovery.test.js` |
| استكشاف، تفاصيل، مشابه، شخصية | [[systems/Explore-Works]] | `node --test tests/explore-studio.test.js tests/work-relations.test.js tests/character-atlas.test.js` |
| إطار، بنر، ثيم، حزمة، زينة، frame | [[systems/Appearance-Bundles]] | `node --test tests/frame-motion.test.js tests/profile-decoration.test.js tests/paid-collections.test.js` |
| آيفون، build، TestFlight، safe area | [[systems/Native-Release]] | `node --test tests/apple-release-package.test.js tests/build-hygiene.test.js tests/version-consistency.test.js` |
| عربي، إنجليزي، RTL، صورة، مشاركة | [[systems/Language-Media]] | `node --test tests/followers-localization.test.js tests/work-detail-language.test.js tests/image-resilience.test.js` |

تُراجع أسماء الملفات بواسطة [[07-Source-Atlas]]. تغيير عقود مشتركة يحتاج
اختبارات إضافية، وليس اختبار البداية وحده. [[09-Data-Contracts]] يربط طبقات
الحفظ؛ [[10-Open-Questions]] يمنع إغلاق الأمور غير المثبتة.

المصدر: [الاختبارات](../tests/)، [ترتيب التحميل](../index.html)،
[أوامر المشروع](../package.json).

[[00-Home]] | [[05-Verification]]
