---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["إطارات", "بنرات", "حزم", "مجانية", "ثيم", "زينة", "frame", "bundle", "theme"]
---
# المظهر والإطارات والحزم

[design system](../../modules/lorefy-design-system.js) والثيمات و
[interface settings](../../modules/lorefy-interface-settings.js) يحددان المظهر.
[profile shop](../../modules/lorefy-profile-shop.js) يختار مجموعة الزينة؛
[frame motion](../../modules/lorefy-frame-motion.js) يملك هندسة وحركة مشتركة.
renderers الأصلية [original](../../modules/lorefy-original-original.js)،
[autumn](../../modules/lorefy-original-autumn.js)،
[illustrated](../../modules/lorefy-original-illustrated.js) ليست قواعد قياس مستقلة.

## عقد الإطار

- تطبيق زينة لا يغير avatar/banner الأصليين.
- القاعدة المشتركة تشمل owner وpublic profile، لا تعديل حزمة واحدة لإخفاء السبب.
- زران بكل جانب ومساحة crest وسطية، وهيدر وبنر وsafe area محسوبة معًا.
- ornament السفلي لا يُركّب من شريط raster مقصوص ولا يقتحم home indicator.
- وقف الحركة في hidden/offscreen وscheduler مشترك، لا loop مستقل لكل إطار.
- CSS overlays الشفافة لا ترث background placeholders الخاصة بالصور.

[[decisions/Profile-Frame-Geometry]] و[[playbooks/Profile-Frames]] هما المرجع
لتفاصيل القرار والأدلة السابقة، مع إعادة التحقق قبل تعديل الهندسة.

## التجارة

[[decisions/Temporary-Free-Bundles]] يحفظ قرار المجانية المؤقتة. مسار
[decoration billing](../../modules/lorefy-decoration-billing.js)،
[StoreKit bridge](../../ios/App/App/LorefyPurchases.swift)،
[server policy](../../supabase/functions/decoration-purchases/policy.mjs)
موجود؛ لا تحذفه ولا تفعّل تحصيلًا بسبب تنظيف المعرفة. ملكية Production
والتحقق بالخادم مختلفان عن local premium preview أو Sandbox.

الفحص: [frame motion](../../tests/frame-motion.test.js)،
[decoration](../../tests/profile-decoration.test.js)،
[paid collections](../../tests/paid-collections.test.js)،
[public appearance](../../tests/public-appearance.test.js)،
[all-profile QA](../../qa/all-profile-banner-browser.cjs).

[[systems/Profiles-Lists]] | [[systems/Native-Release]] | [[10-Open-Questions]]
