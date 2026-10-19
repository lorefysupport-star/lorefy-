---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["مجتمع", "منشور", "تعليق", "جرس", "تنبيه", "community", "push", "notification"]
---
# المجتمع والتنبيهات

[[bugs/APNS-003-Permission-Intent-Race]] guards the current push preference across
permission and registration awaits. Seven new cases and2251 full-suite tests
pass; [[sessions/2026-10-19-Push-Permission-Intent]]. No live send/deploy/build.

[[bugs/LF-075-Pull-Refresh-Lifecycle]] adds coalesced pull refresh and bounded
community loading, removes unconditional30s polling and avoids rebuilding an
identical post feed. [[sessions/2026-10-19-Pull-Refresh-Lifecycle]] tracks acceptance.

[[sessions/2026-10-17-Review-Response-Owner]] يربط نتائج نشر/حذف المراجعة والرد
بالحساب والجلسة اللذين أرسلا الطلب، قبل تعديل الواجهة أو عرض خطأ قديم.
هذا لا يلغي طلبًا وصل للخادم ولا يغني عن صلاحياته أو ملكية المحرر عند فتحه.

[[sessions/2026-10-17-Review-Editor-Owner]] يكمّل ملكية المحرر منذ الفتح وفصل
جلساته، ويمنع نشر مسودة الحساب السابق أو محو مسودة أحدث بنتيجة متأخرة.
إكمال فك الصور محليًا وملكية طلب الرفع على الخادم ليسا مثبتين بهذا الإصلاح.

[[sessions/2026-10-17-Review-Image-Owner]] يثبت لاحقًا عزل إكمال الصور محليًا
عن الحساب أو المحرر البديل، مع بقاء فحص الرفع السحابي والصلاحيات مستقلاً.

[community](../../modules/lorefy-community.js) و[growth features](../../modules/lorefy-growth-features.js)
يضيفان الـfeed والتفاعلات. [friend activity](../../modules/lorefy-friend-activity.js)
منطق أصدقاء القارئ. الصفحة الرئيسية للمجتمع، والاكتشاف في Explore؛ لا تعِد
خلط المسارين بسبب أسماء تاريخية. [profile sections](../../modules/lorefy-profile-sections.js)
يعرض منشورات ومراجعات صاحب البروفايل.

## العقود

- Following غير For You؛ لكل audience حالة وذاكرة scroll مستقلة.
- أحداث وتفاعلات القارئ تخضع لملكية الحساب والرؤية/الحظر بالخادم.
- لا تستنتج تفضيلات الأصدقاء من مراجعات الغرباء أو من تقييم المالك نفسه.
- لا تنقل عناصر React خارجه لترتيب feed؛ راجع عقد التركيب القائم.
- لا تضف subscriptions متكررة لمجرد إعادة عرض القسم.

## الجرس مقابل Push

[[sessions/2026-10-16-Authorized-Push-Check]]: اختبار واحد مصرح به قبله APNs،
وأكد المالك ظهوره خارج التطبيق والفتح إلى صندوق الإشعارات. هذا يثبت مسار
الاختبار فقط؛ سبب بلاغ الفشل القديم واكتمال كل الحالات غير مثبتين.

[native runtime](../../backend/lorefy-native-runtime.js) يملك صندوق التنبيهات
والعداد والتحديث وتنقل payload والربط بالحساب. deduplication ورفض late
responses مهمان. تنبيه foreground محلي مختلف عن وصول APNs بالخلفية.
[تقرير 13 أكتوبر](../../docs/NOTIFICATIONS_VERIFICATION_2026-10-13.md) دليل
تاريخي على نقص إعداد خادم؛ لا تفحصه أو تغيّر سرًا تلقائيًا.

[[sessions/2026-10-14-APNs-Server-Setup]] يوثّق حفظ إعدادات APNs بتفويض المستخدم
في 14 أكتوبر وفحصًا محميًا تجاوز نقص الإعدادات دون إرسال. تلك الجولة وحدها
لم تثبت التسليم؛ دليل الاختبار الواحد الجديد موثق أعلاه بتاريخ 16 أكتوبر.

[[sessions/2026-10-15-Push-Transport-Repair]] يحدّث المعرفة: قراءة حية للـhook
والتسجيل وسجلات قبول محدودة، وإصلاح مصدر مثبت لعزل فشل جهاز وتحديد مهلة
APNs I/O. الإصلاح لم يُنشر، وتلك الجولة لم تثبت عرض إشعار أو سبب بلاغ الحساب.
قبول Apple وظهور التنبيه مرحلتان مستقلتان؛ [[bugs/APNS-001-Background-Delivery]]
أُغلق لاحقًا لنطاق اختبار 16 أكتوبر المصرح به فقط.

الفحص: [home-social](../../tests/home-social-discovery.test.js)،
[community-cloud](../../tests/community-cloud.test.js)،
[subscription](../../tests/community-live-subscription.test.js)،
[notifications runtime](../../tests/notification-delivery-runtime.test.js)،
[friend activity](../../tests/friend-activity.test.js).

[[systems/Accounts-Sync]] | [[systems/Native-Release]] |
[[systems/Language-Media]] | [[10-Open-Questions]]

## صفوف تقييم الأصدقاء
[[sessions/2026-10-18-Social-Profile-UI]] aligns social/Profile author hierarchy,
40px avatars and adaptive 44px action grids. Composer tools, scrim and reply
bars share the UI tokens and reduced-preference fallbacks. Compact 88px friend
items apply only to unexpanded Home rails; Explore retains its existing width.
No notification, publication, relationship or stored-rating behavior changed.

[[sessions/2026-10-16-Friend-Rating-Rows]] وحدت هندسة الاسم والتقييم في [CSS](../../styles/lorefy-explore-studio.css). لا تغيير لمنطق المتابعة أو القيم الكسرية أو الحسابات.

- [[bugs/LF-034-Review-Mutation-Session]]: منع طلب حذف/رد/تفاعل مراجعة قديم من استكمال سلسلة حساب آخر أو إرجاع نجاح متأخر. [[sessions/2026-10-17-Review-Mutation-Session]]

- [[bugs/LF-036-Community-Mutation-Session]]: تثبيت جلسة نشر/رد/تعديل/تفاعل المجتمع ورفض نتيجة بلاغ قديمة؛ [[sessions/2026-10-17-Community-Mutation-Session]]. لا اعتماد الرؤية بالخادم.

- [[bugs/LF-037-Chapter-Review-Session]]: عزل نشر/حذف تقييم الفصل مع بقاء الدرجات والحرق وفلتر المالك؛ [[sessions/2026-10-17-Chapter-Review-Session]].

- [[bugs/LF-038-Notification-Backend-Session]]: عزل تسجيل الجهاز والصندوق والمقروء وقنوات التنبيهات حسب سياق الطلب؛ [[sessions/2026-10-17-Notification-Backend-Session]]. وصول APNs والخادم والجهاز منفصل.

- [[bugs/LF-040-Session-Teardown-Owner]]: منع تنظيف مفاتيح/monitoring/emit بعمل جلسة قديمة، مع إغلاق قناة التنبيه وflag حسب السياق؛ [[sessions/2026-10-17-Session-Teardown-Owner]]. تكامل تخزين SDK منفصل.

- [[bugs/LF-042-Feed-Read-Session]]: قراءات المراجعات والمنشورات والأصدقاء والفصول ومرفقاتها تُرفض بعد تغير السياق؛ [[sessions/2026-10-17-Feed-Read-Session]]. الرؤية الحية والجهاز منفصلان.
