---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["مجتمع", "منشور", "تعليق", "جرس", "تنبيه", "community", "push", "notification"]
---
# المجتمع والتنبيهات

C-006 in [[sessions/2026-11-01-Community-Timeline]] preserves/revalidates the
loaded post window and visible-card offset.3209 tests/68 paged browser checks
(180 rows, native anchoring disabled). Targeted reaction refresh is next.

C-005 in [[sessions/2026-11-01-Community-Timeline]] filters known non-friend/own
review events after actual following IDs load.3199 tests/68 updated Rails browser
checks. Incomplete/delete payloads still refresh; source-only, not service proof.

C-004 closes the scoped reaction pass in [[sessions/2026-11-01-Community-Timeline]]:
shared review locks, conditional rollback, fresh server0/count metadata and
bounded review/post writes.3198 tests,60 controlled +32 actual demo checks;
real two-reader/network/native and two-RPC partial outcomes remain separate.

C-003 in [[sessions/2026-11-01-Community-Timeline]] repairs post event routing,
catch-up and early rendering independent of follow latency.3190 tests/20 actual
module browser fixtures; long pagination and native/network smoothness separate.

C-002 in [[sessions/2026-11-01-Community-Timeline]] shares bounded friend loads,
preserves cached same-scope rows and catches new ratings without reaction-noise
fetches.3186 tests/64 mounted React checks; no live/native certification.

[[sessions/2026-11-01-Community-Timeline]] begins a focused timeline pass:
C-001 routes/coalesces review realtime changes with one trailing catch-up,
without post-triggered review/graph reads.3180 tests/18 local browser checks.
Friend loading, post invalidations and reaction consistency are next, not closed.

[[sessions/2026-11-01-Logical-Recommendation-Roundtrip]] preserves legacy
positive/no draft intent, canonical unknown and local dislike counting.3163
tests/52 full demo review-flow checks; no service or reading-state mutation.

[[sessions/2026-11-01-Logical-Friend-Ratings]] reconciles friend shelves with
intentional zero dislikes and latest public/rated state.3156 tests/40 browser
checks; public metadata SELECT adds recommend only, no production mutation.

[[sessions/2026-11-01-Home-Reaction-Feedback]]: immediate standalone post
feedback, shared opposite-action lock, snapshot-aware rollback and stale-owner
suppression. Home actions share five44px tracks; localized/compact review counts
retain exact labels without repeated text writes.3122 full tests/192 UI checks;
no production reaction, service deployment or new native build.

[[sessions/2026-10-30-Inbox-Receipt-Scope]] guards queued read receipts before
dispatch, not only after response. Account/logout/backend changes cancel the old
microtask before it can call the next context. Original owner pending receipts
and normal retry remain; three failing regressions reproduced this race.

[[sessions/2026-10-30-Inbox-Reconnect]]: owner-filtered UPDATE events synchronize
read state without removing history or emitting toasts. Shared refresh closes
reconnect/resume/online gaps with one trailing catch-up when necessary; duplicate
inserts retain read_at.3014 source tests,84 isolated real-UI checks. No live
messages or deployment; actual two-device delivery remains separate.

[[sessions/2026-10-29-UI-Foundation-Phase-Seventeen]] adopts Review Editor mini
cover and draft attachment display only. Original removal, upload, publish,
account ownership and stale-editor guards remain; fixtures never publish.
Published review pictures/quotes remain a separate UI owner. No notification,
review or account record was sent or changed by this local verification.

[[sessions/2026-10-29-UI-Foundation-Phase-Sixteen]] adopts work covers in friend
rating rails and the shared review work attachment. Open work and Retry cannot
accidentally open the enclosing review. Author avatars/profile callbacks, scores,
reactions, privacy/safety/follow filtering and live refresh guards are unchanged.
Local fixtures only; no publishing, reaction, saved review or notification sent.

[[sessions/2026-10-29-UI-Foundation-Phase-Fifteen]] changes only Home Continue
reading media, not friend-review rails, feed covers, reactions or notifications.
Preserve separate owners when adopting further image consumers. No post, review,
reaction or notification was sent by this local media verification.

[[sessions/2026-10-28-UI-Foundation-Phase-Eleven]] refines standalone post/reply
copy and counters, not review reactions or notifications. Compact visible counts
retain exact plural-aware accessible names/tooltips; all counter update paths
share one formatter without replacing cached feed cards. Direct AR/EN thread
labels include empty/retry recovery.2845 full tests,56 isolated browser cases;
demo reactions only, no real publishing/service/notification mutation.

[[sessions/2026-10-28-UI-Foundation-Phase-Seven]] improves the review-options
reporting form, not the post-reporting feature set or notifications.21 new
source regressions,2773 full tests and20 local browser cases validate direct
labels/materials, single-flight recovery, stale UI/receipt guards and concurrent
receipt merging. No real report/mute/block or service deployment occurred.

[[sessions/2026-10-28-Local-Work-Dislike]] prepares explicit work-dislike0 and
the public visible count locally. This is not the existing review-reaction
Dislike and does not change notification delivery. No backend deployment.

[[sessions/2026-10-26-Work-Cinema]] first refines the post composer: full-width
writing, independent author row, compact glass icon tools, preserved drafts and
matching attachment pickers. Picker focus/Tab/Escape/return is checked locally.
No actual post or review was published; no backend or notification changes.

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

2026-10-27: [[sessions/2026-10-27-Durable-Inbox-Review-Credit]] supersedes any
assumption that OS push opt-in is required for the inbox. Recent60 rows/read
receipts persist per authenticated owner, offline failures have Retry, and read
history remains. Source/demo verified; actual two-account delivery still open.

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

[[sessions/2026-10-21-Sticky-Home-Filters]]: For You/Following moved into sticky Home header above Continue reading; local review only.

Unnecessary card rebuilding audit and fixes preserve unchanged editor/feed nodes; see [[sessions/2026-10-21-Stable-Rendering]].

Home review Like stability: aligned declarative/enhanced Like and Dislike controls, immediate guarded Like updates, and retained cards across equivalent realtime responses. 549 focused checks and browser node-identity evidence; [[sessions/2026-10-21-Home-Like-Stability]].

[[sessions/2026-10-26-Home-Cinema]]: Home-only dark/glass redesign preserves
account-derived continuation and the existing feed. Dislike now uses guarded
optimistic rendering with Like exclusion; Save stays independent. Local demo
interaction verified; no production or native release change.
