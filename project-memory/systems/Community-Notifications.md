---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["مجتمع", "منشور", "تعليق", "جرس", "تنبيه", "community", "push", "notification"]
---
# المجتمع والتنبيهات

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

[native runtime](../../backend/lorefy-native-runtime.js) يملك صندوق التنبيهات
والعداد والتحديث وتنقل payload والربط بالحساب. deduplication ورفض late
responses مهمان. تنبيه foreground محلي مختلف عن وصول APNs بالخلفية.
[تقرير 13 أكتوبر](../../docs/NOTIFICATIONS_VERIFICATION_2026-10-13.md) دليل
تاريخي على نقص إعداد خادم؛ لا تفحصه أو تغيّر سرًا تلقائيًا.

الفحص: [home-social](../../tests/home-social-discovery.test.js)،
[community-cloud](../../tests/community-cloud.test.js)،
[subscription](../../tests/community-live-subscription.test.js)،
[notifications runtime](../../tests/notification-delivery-runtime.test.js)،
[friend activity](../../tests/friend-activity.test.js).

[[systems/Accounts-Sync]] | [[systems/Native-Release]] |
[[systems/Language-Media]] | [[10-Open-Questions]]
