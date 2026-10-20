---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["بروفايل", "شخص", "لست", "قوائم", "مفضلة", "profile", "lists", "favorites"]
---
# البروفايلات والمفضلة واللستات

[[sessions/2026-10-20-Remaining-Skills]] يصفر خطأ الشخصيات عند تبديل النمط،
ويطابق نصوصAR/EN للنمط الحالي؛ اختباران جديدان وست حالات متصفح ناجحة.

[[sessions/2026-10-20-Skills-Application]] يضيف تنقل الأسهم وHome/End
ومحطة Tab واحدة إلى طريقة بحث محرر الشخصيات؛ ست حالات متصفح AR/EN
تتحقق من المسح وEscape ورجوع التركيز دون كتابة المفضلة.

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

[[sessions/2026-10-18-List-Removal-Public-Projection]] confirmed the missing live
public-list RPC and activated only that reviewed projection with owner approval.
Visibility choices remain unchanged. Owner cards/detail toolbar now expose
confirmed removal, including legacy folders, with account checks and pending
cloud-sync reporting; public fetch failures have retry.

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

[[sessions/2026-10-18-Social-Profile-UI]] applies the shared segmented tabs,
metric hierarchy, compact Lists/Posts actions, readable ranked rows and social
post styling to owner and visitor. It preserves saved values and frame/banner
geometry. Count-only accessible names in legacy review actions remain separate.

[[systems/Appearance-Bundles]] | [[08-Feature-Router]] | [[10-Open-Questions]]

- [[bugs/LF-035-Profile-Relationship-Session]]: عزل متابعة/إلغاء متابعة وحظر/إلغاء حظر الملف حسب حساب الطلب. [[sessions/2026-10-17-Profile-Relationship-Session]]؛ الرؤية الحية منفصلة.

- [[bugs/LF-041-Profile-Read-Session]]: عزل قراءة الملفات والبحث والمتابَعين حسب جلسة المشاهد مع بقاء زيارة الآخرين؛ [[sessions/2026-10-17-Profile-Read-Session]]. الرؤية الحية والجهاز منفصلان.

- [[bugs/LF-062-Profile-Image-Editor]]: صور البروفايل والحفظ مرتبطان بمالك ونسخة المحرر وأحدث اختيار؛ فشل التجهيز ظاهر ولا تسقط النتائج القديمة على مسودة/حساب جديد؛37حالة جديدة،304مرتبطة،2037كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Profile-Image-Editor]]. لا إلغاء أو اعتماد لكتابة خدمة حية.

- [[bugs/LF-064-Image-Preparation-Deadline]]: مهلة إجمالية 30 ثانية لتجهيز صور البروفايل ومرفقات المراجعة،مع رسالة AR/EN وحماية الصورة والنص السابقين ومنع النتائج المتأخرة؛ 28 حالة جديدة،343 مرتبطة،2076 كاملة و7 حالات Chrome منها مؤقت حقيقي؛ [[sessions/2026-10-18-Image-Preparation-Deadline]]. Photos والرفع والجهاز والخدمة مستقلة.
