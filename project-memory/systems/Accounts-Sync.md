---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["حساب", "دخول", "مزامنة", "ضياع", "auth", "offline", "logout"]
---
# الحسابات والمزامنة

[[bugs/LF-075-Pull-Refresh-Lifecycle]] adds read-only account refresh through
the existing reconciler with strict errors and owner/client/epoch/editor guards.
Pending local edits stay pending; changed fields update the mounted UI.

## المسؤولية والمصدر

[[sessions/2026-10-18-Minimal-Entry-Launch]] replaces the illustrated welcome
with a minimal dark two-provider view and a local monogram web bootstrap.
Provider policy and auth logic are unchanged; preference/account stages retain
the selected appearance. Mock callback checks do not certify native sign-in.

[lorefy-backend.js](../../backend/lorefy-backend.js) يملك مفاتيح المزامنة وسجل
التغييرات والمالك والطلبات السحابية. [lorefy-auth.js](../../auth/lorefy-auth.js)
واجهة الدخول/onboarding. [secure-storage](../../backend/lorefy-secure-storage.js)
وغلاف [iOS OAuth](../../backend/lorefy-ios-oauth.js) يعالجان الحدود الأصلية.
لا تحفظ مفاتيح جلسة أو قيم إعدادات حسابات في هذه الملاحظة.

## العقد

- `activeUser` يحدد صاحب الحالة المحلية؛ حالة غير مملوكة لا تُتبنى عند دخول حساب جديد.
- سجل pending يلتقط التعديلات؛ لا يُمسح تعديل أحدث لمجرد انتهاء push قديم.
- pull يُنسب للحساب والجيل؛ لا يطبّق استجابة وصلت بعد تبديل حساب أو إيقاف المزامنة.
- اقرأ أحدث حالة محلية بعد انتظار الشبكة كي لا تمحو تقييمًا أو تعيد حذفًا.
- sign-out وتنظيف namespace يمنعان ظهور البيانات الخاصة للحساب التالي.
- حذف الحساب لا يُعلن نجاحه إذا رفض الخادم أو احتاج recent auth.

## الفحص

[[bugs/LF-070-Dynamic-State-Sync]] extends push diff/adoption to supported
dynamic keys from the acknowledged base/journal/response. Four new failures and
six added cases confirm removal, remote addition, retry and 20/5 batching;
76 focused tests pass. [[sessions/2026-10-19-Dynamic-State-Sync]]. No service writes.

[[bugs/LF-069-Pull-Remote-Deletions]] prevents an acknowledged remote deletion
from being re-uploaded beside an unrelated offline edit. Seven complete-Backend
VM cases and 51 related tests pass; [[sessions/2026-10-19-Pull-Remote-Deletions]]
separates the read-only deployed privacy projection check from live two-account
or matching-device verification. No build or service changes.

[[sessions/2026-10-15-Privacy-Safety-Repairs]] أضاف انتظار تأكيد إلغاء الحظر،
وعدم اعتماد رد قديم بعد تبديل المالك أو جيل المزامنة. إعدادات القوائم والحظر
المفتوحة تحت حساب قديم لا ترسل تعديلات باسم الحساب التالي. الفحص معزول وليس
اختبارًا لإلغاء حظر قارئ فعلي.

[account-sync-isolation](../../tests/account-sync-isolation.test.js)،
[account-local-data](../../tests/account-local-data.test.js)،
[state-recovery-runtime](../../tests/state-recovery-runtime.test.js)،
[account-deletion-recovery](../../tests/account-deletion-recovery.test.js)،
[native-auth-flow](../../tests/native-auth-flow.test.js).

[تقرير الاسترجاع](../../docs/STATE_RECOVERY_FIX_2026-10-03.md) يشرح أسباب مثبتة
تاريخيًا؛ لا يثبت أن كل شكوى إنتاج أُغلقت. اختبار حسابين وجهاز حقيقي مستقل.
مجلد [migrations](../../supabase/migrations/) مصدر للعقود وليس حالة نشر مباشرة.

[[09-Data-Contracts]] | [[systems/Profiles-Lists]] |
[[systems/Community-Notifications]] | [[10-Open-Questions]]

[[sessions/2026-10-17-Backend-Review-Owner]] يمنع نشر/رفع المراجعة من استكمال طلب تحت حساب جديد، ويرفض توكن Storage المخالف. لا يثبت إلغاء طلب سبق إرساله أو صلاحيات الخادم.

[[sessions/2026-10-17-Profile-Mutation-Owner]] تربط حفظ الملف والخصوصية وإكمال التسجيل بنطاق الحساب الافتتاحي؛ لا كتابة identity/preferences بعد رد حساب قديم.

[[sessions/2026-10-17-Session-Read-Owner]] تعزل قراءة auth وpromise المشتركة عن تغير الحساب؛ لا يعاد user قديم أو تمسح جلسة جديدة برد قديم.

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

- [[bugs/LF-044-Import-Request-Session]]: معاينة الاستيراد وتأكيده تخص حساب الفتح والمحاولة الأحدث؛ [[sessions/2026-10-17-Import-Request-Session]]. فشل الحفظ المحلي والخادم والجهاز مستقلون.

- [[bugs/LF-045-Import-Save-Failure]]: فشل الكتابة لا يعلن نجاح الاستيراد، مع تراجع متحقق وإعادة محاولة أو توضيح الحفظ الجزئي؛ [[sessions/2026-10-17-Import-Save-Failure]]. المزامنة والجهاز منفصلان.

[[sessions/2026-10-19-Banner-Clear]] records explicit media removal and stale-cache fixes; historical upload cause remains unproven.

Favorite slot save investigation: bounded downloaded catalog cache, quota-only safe cache reclaim, and honest failed-save feedback; 82 focused checks plus save/reopen/reload in isolated demo. Device Hub storage pressure removed without changing saved favorites. [[sessions/2026-10-21-Favorite-Save-Quota]].

2026-10-29: [[sessions/2026-10-29-Supabase-Pro-Optimization]] verifies Pro and ACTIVE_HEALTHY and records applied migration 20261029194223: five indexes and two equivalent chapter-review RLS InitPlans. No user data/grant changes. 23 isolated SQL assertions and 63 focused source checks pass; hardware sign-in, two-account service isolation and Apple configuration remain open.
