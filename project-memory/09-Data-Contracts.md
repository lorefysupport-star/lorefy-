---
kind: contract-map
status: source-reviewed
date: 2026-10-14
aliases: ["تدفق البيانات", "الحفظ", "storage", "ownership"]
---
# عقود البيانات

## الحفظ المحلي والمزامنة

Private media URLs: [[sessions/2026-10-30-Supabase-Pro-Adoption]]. Durable
bucket/path references remain the stored contract. Signed URLs may be reused
only in bounded memory under the same viewer/client/epoch/project, with Auth
checked for every consumer. Never persist tokens as a replacement for references;
existing signing lifetime/Storage policies and mutable upload cache-control stay.

تفاعل القارئ → حالة التطبيق ومفاتيح محلية → سجل التغييرات المعلقة →
Backend/Merge → استجابة سحابية تخص الحساب الذي طلبها → الحالة المحلية والواجهة.
هذه خريطة مفاهيمية للعقد، وليست وصفًا لكل استدعاء. المصدر والاختبارات يحكمان.

| حقيقة محفوظة | المفاتيح الموجودة في مصدر Backend | قاعدة التغيير |
| --- | --- | --- |
| مالك الحالة | `lorefy.activeUser.v1` | لا تدمج بيانات جهاز غير مملوكة في حساب جديد |
| سجل التغييرات | `lorefy.pendingState.v1`, `lorefy.stateBase.v1` | لا تمسح تغييرًا محليًا أثناء انتظار شبكة قديمة |
| المكتبة والتقدم | `lorefy.user.library.v2`, `lorefy.user.progress.v2` | حالة العمل غير التقدم؛ الإجماليات تُشتق من المحفوظ |
| المفضلة والشخصيات | `lorefy.user.favorites.v2`, `lorefy.user.profileTopCharacters.v1` | لا تتبدل عند تطبيق إطار أو زيارة قارئ |
| ترتيب البروفايل واللست | `lorefy.user.profileLayout.v1`, `lorefy.user.profileLists.v1` | عقد اللستات الجديدة غير أسماء المفاتيح القديمة المتشابهة |
| الزينة | `lorefy.user.profileDecoration.v1` | حالة الحساب لا تغير صورة المستخدم الأصلية |
| يوميات القراءة | `lorefy.user.readLog.v1`, `lorefy.user.readingDiary.v1` | لا تجمع تمثيلات الوقت/التقدم لنفس العمل مرتين |
| صور مخصصة | `lorefy.user.customCovers.v2` | الربط السحابي الدائم منفصل عن رابط عرض مؤقت |

لا تُخزّن قيم هذه المفاتيح أو بيانات المستخدم داخل الذاكرة. أسماء المفاتيح
موثقة للمطور فقط. كل عمل عابر للحسابات يرفض الاستجابة المتأخرة من الحساب السابق.

## حدود المصادر

Inbox reconnect: [[sessions/2026-10-30-Inbox-Reconnect]]. INSERT may announce;
UPDATE merges read state in place without a toast. Read_at cannot be undone by
duplicate inserts or older snapshots. Concurrent refresh consumers share one
owner/connection/backend job; reconnect may queue one non-overlapping catch-up.
Replaced clients/accounts must never apply prior snapshot or status callbacks.
[[sessions/2026-10-30-Inbox-Receipt-Scope]] also gates deferred read-receipt
invocation before dispatch; stale queued work must not begin under a new owner.

Reading-state labels: [[sessions/2026-10-28-UI-Foundation-Phase-Nine]]. Shared
display functions must not rewrite saved statuses or parse publication metadata.
Callbacks keep original choice values; label changes never imply progress,
completion or review mutations. Unknown strings pass through.

Review reports: [[sessions/2026-10-28-UI-Foundation-Phase-Seven]]. The existing
report RPC/payload is unchanged. Remote receipts must still match the opening
owner, generation, backend and client before local storage. Merge with the current
`lorefy.safety.reports.v1` array after awaiting; do not overwrite concurrent
receipts from an earlier snapshot. Closing UI does not cancel a server request;
UI lifetime and same-owner receipt persistence are separate boundaries.

Correction and missing-work UI: [[sessions/2026-10-28-UI-Foundation-Phase-Six]].
`lorefy.data.corrections.v1` is a device queue; its current submit path does not
send corrections to a server. `lorefy.catalog.requests.v1:<encoded owner>` stores
local drafts under existing reference/type validation. UI copy must not claim
cloud delivery. Safety report status is saved record state, not a live moderation
check. This UI pass changes no service/storage schema.

Work Dislike: [[sessions/2026-10-28-Local-Work-Dislike]]. A deliberate numeric0
plus negative recommendation is different from null/unrated and from a Dislike
reaction to another person's review. One review per owner/work is the source of
truth. Public visible counts use the existing table's exact count under RLS,
not loaded-feed length or a client-maintained counter. No schema was deployed.

- الكتالوج يصف العمل؛ ليس مصدرًا لتاريخ القراءة المحفوظ. راجع [[systems/Reading-Library]].
- البروفايل العام هو إسقاط للقارئ الذي تتم زيارته، وليس حالة الزائر. راجع [[systems/Profiles-Lists]].
- الخادم يقرر صلاحية الرؤية والملكية. الواجهة والمعاينة المحلية ليست تجاوزًا للعقد.
- الـJWT وبيانات المفاتيح وخيارات التوقيع لا تُنسخ هنا.
- ملفات migrations تثبت تنفيذًا محليًا، لا أنها مطبقة الآن على الخادم.

المصادر: [Backend والمفاتيح](../backend/lorefy-backend.js)،
[اختبارات حدود الحساب](../tests/account-sync-isolation.test.js)،
[استرجاع الحالة](../tests/state-recovery-runtime.test.js)،
[مقاييس القراءة](../modules/lorefy-reading-metrics.js).

[[00-Home]] | [[systems/Accounts-Sync]] | [[10-Open-Questions]]
