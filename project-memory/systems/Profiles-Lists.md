---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["بروفايل", "شخص", "لست", "قوائم", "مفضلة", "profile", "lists", "favorites"]
---
# البروفايلات والمفضلة واللستات

[[sessions/2026-10-16-List-Keyboard-Focus]] يحافظ على تركيز أدوات الترتيب
والإزالة ويعلن الموضع الجديد، دون حفظ تلقائي أو فقد مسودة الاسم. دليل المصدر
والمتصفح منفصل عن VoiceOver والجهاز. [[sessions/2026-10-16-List-Tool-Clipping]]
أصلح بعدها عرض الأدوات الثلاث بأهداف لمس كاملة؛ لا يعني ذلك تركيب الإصلاح على الجوال.

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

تقييمات الشخصيات: LF-009 في [[12-Device-Repairs]] يجعل العدد وعدد الأعمال
والمتوسط من التقييمات المحفوظة، لا من cast المحمل. تأخر تفاصيل البطاقة لا
يعني حذف التقييم، ولا نخلط إصلاح العدد بإصلاح تحديث معرض مفتوح أثناء التحميل.

[[sessions/2026-10-15-Gallery-Hydration-Repair]] أكمل المسار الثاني: بيانات
المعرض تتجدد مع بقاء البحث والتجميع، وRetry لا يحوّل فشل الشبكة إلى كاش فارغ.
النافذة مرتبطة بمالكها وتغلق عند تغيّره؛ لا تحديث DOM بعد الإغلاق.

[[bugs/LF-010-Character-Editor-Owner]] يحمي محرر الخانات الأربع أيضًا، وليس
المعرض فقط: مسودة الحساب القديم لا تحفظ في الحساب التالي، والبحث المتأخر
لا يعيد تنشيط نافذة مغلقة. [[sessions/2026-10-15-Character-Editor-Owner]].

[[bugs/LF-011-Character-Editor-Hydration]] يحدّث قائمة المحرر عند اكتمال cast،
ويفصل فشل الشبكة مع Retry عن cast فارغ حقيقي. البحث والخانة لا يضيعان.
[[sessions/2026-10-15-Character-Editor-Hydration]] يوثق المصدر والمعاينة فقط.

[[bugs/LF-012-Character-Editor-Locale]] يعالج نصوص محرر المفضلة الإنجليزية
وقص إجراء التبديل، مع بقاء الأسماء والعربية والمفاتيح المحفوظة دون ترجمة.

بعد [[sessions/2026-10-15-Privacy-Safety-Repairs]] يقرأ مركز البيانات القوائم
الجديدة أيضًا. تعديل الرؤية يمر عبر `setFolderVisibility` مع فحص المالك ووجود
القائمة الأحدث؛ لا يستخدم خريطة رؤية القوائم القديمة للقوائم الجديدة. المزامنة
المعلقة ليست تأكيدًا لتغير الرؤية في الخادم.

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
