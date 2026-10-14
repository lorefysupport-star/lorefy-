---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["بروفايل", "شخص", "لست", "قوائم", "مفضلة", "profile", "lists", "favorites"]
---
# البروفايلات والمفضلة واللستات

## المالك والزائر

[public profile](../../modules/lorefy-public-profile.js) يعرض إسقاط الحساب
المطلوب. [user discovery](../../modules/lorefy-user-discovery.js) يفتح بروفايل
القارئ من البحث. [public appearance](../../modules/lorefy-public-appearance.js)
يطبّق مظهر ذلك القارئ؛ إعدادات الزائر ليست بديلًا عنه.

[[09-Data-Contracts]] و[[systems/Accounts-Sync]] يحميان حدود البيانات.
لا تختبر قارئًا حقيقيًا بتغيير بياناته؛ استخدم fixtures معزولة.

## القوائم والأقسام

[profile-sections](../../modules/lorefy-profile-sections.js) يملك Overview /
Lists / Posts والقوائم المرتبة. المفتاح `lorefy.user.profileLists.v1`؛ حد
التطبيع المحلي 40 قائمة و50 عنصرًا لكل قائمة، ومنع IDs المكررة. النوع works
أو characters. المالك يرى بياناته؛ الزائر يرى العامة فقط. تحفظ التغييرات
بعد التأكد من مالك الحساب، وتُرفض جلسة edit قديمة بعد تبديله.

ملفات [styles](../../styles/lorefy-profile-sections.css) تتضمن Folder preview
والجيب الأمامي والصور المروحية؛ لا تستبدلها بصورة مفهوم بدل صور الأعمال.
قائمة منشورات البروفايل تجمع المنشورات والمراجعات الخاصة بذلك القارئ.

## الهندسة والفحص

[profile-layout](../../modules/lorefy-profile-layout.js) وترتيب العناصر،
[public profile CSS](../../styles/lorefy-public-profile.css) والمفضلة والرفوف
تتداخل مع [[systems/Appearance-Bundles]]. احفظ الأربعة عناصر وbaseline واضحًا
ودون اصطدام بالتنقل، في owner/visitor وRTL/LTR والمقاسات الصغيرة.

الفحص: [public-profile-view](../../tests/public-profile-view.test.js)،
[profile-sections](../../tests/profile-sections.test.js)،
[profile-lists-unified](../../tests/profile-lists-unified.test.js)،
[favorites spines](../../tests/profile-favorites-spines.test.js)،
[QA public layout](../../qa/public-profile-layout-browser.cjs).

[[systems/Appearance-Bundles]] | [[08-Feature-Router]] | [[10-Open-Questions]]
