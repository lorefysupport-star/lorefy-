---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["فصول", "الفصول", "ساعات", "الساعات", "قراءة", "مكتبة", "progress", "hours"]
---
# المكتبة والتقدم ومقاييس القراءة

[[sessions/2026-11-01-Logical-Diary-Write-Retry]] repairs L-006: a failed history
write cannot advance the checkpoint or poison idle shortcuts.3175 tests/52
browser checks; later snapshot-only failures/crash atomicity remain unverified.

[[sessions/2026-11-01-Logical-Diary-Units]] repairs L-005: page/volume milestones
retain their unit on progress/start/completion; one event per update, unit-aware
dedup and unchanged legacy chapter shape.3172 tests/60 actual-app browser checks.
Cloud durability, OS sharing and device delivery remain separate gates.

[[sessions/2026-11-01-Diary-Idle-Work]] skips unchanged full-library JSON work
on DOM maintenance/safety polling, preserving real transitions, sessions and
owner checks.3149 tests/16 browser checks; not a whole-app startup speed claim.

[[sessions/2026-11-01-Home-Reading-Hierarchy]] aligns Home's displayed
percentage with the saved chapter/page/volume unit. Ongoing work shows the saved
checkpoint without a false final0% denominator. Stable header, in-flow reading
choices and explicit Library action verified:3137 full tests/288 UI checks.
Existing reading values/statuses and other Library consumers unchanged.

[[sessions/2026-10-30-Kitsu-Complete-Pagination]] removes the silent six-page
cutoff, deduplicates provider entry IDs and rejects incomplete pagination before
preview.3057 full tests/192 UI fixtures; CSV rerun180 with asserted theme/lang.
No real provider account, resumable job or public publication acceptance.

[[sessions/2026-10-30-Import-Written-Reviews]] retains explicit CSV review text,
fills missing owner text independently of existing Library membership, preserves
authored text/ratings/status/progress and deduplicates retries. Preview/opt-out,
private unrated records and rollback verified:3034 source tests/168 UI fixtures.
No public publication, live import, provider-review fetch or native delivery.

[[sessions/2026-10-29-Library-Shelf-Acceptance]] verifies Library counts through15,
seven spines per row and triplet Showcase rows without a total Library cap.
Decorative managed spine titles no longer intercept the native Open button.
Original wood/supports, progress, IDs and cover choices unchanged. F12 local
acceptance is not full filter/sort/search or physical-device certification.

[[sessions/2026-10-29-UI-Foundation-Phase-Fifteen]] adopts Home Continue reading
artwork states without changing checkpoint summaries, known-total logic or the
four-work selection limit. Failed thumbnails still select their work. Explicit
poster/background retry preserves progress and source, with no automatic loop.
Actual Home-to-work navigation verified in2 isolated browser fixtures.

[[sessions/2026-10-29-UI-Foundation-Phase-Fourteen]] adds managed cover states
to the main Library and Reader current-reading rows. Card geometry/progress,
completion badges, source strings and all Library items are retained. Native
Retry/Open are separate; missing art is not an empty library/favorite entry.
2887 full tests,53 browser cases and26 geometry comparisons; no saved-state write.

[[sessions/2026-10-28-UI-Foundation-Phase-Ten]] adds display-only title direction,
two-line slots and growing tracks/captions across Home, Library and profiles.
Progress metadata follows app language separately from source titles. Showcase
captions update on source title changes, coalesced in one animation frame.
Saved titles/checkpoints, calculations and total Library counts remain unchanged.
2833 source tests,72 local browser cases; physical text scaling remains open.

Display vocabulary is owned by `LorefyI18n.readingStatusLabel` and
`readingStatusEmpty`; see [[sessions/2026-10-28-UI-Foundation-Phase-Nine]].
Keep historical saved keys, selection/filter callbacks and completion/progress
algorithms unchanged. Publication metadata is separate.22 new tests,2814 full
suite,51 browser cases; no real import or hardware check.

[[sessions/2026-10-28-UI-Foundation-Phase-Three]] refines import presentation,
visible validation and recovery while retaining draft inputs, source matching,
stored status values, confirmation and `imApply` rollback/session guards.
2705 full tests,20 local browser cases without confirming a real import.
Live fetch/save durability and native file access remain independent gates.

[[sessions/2026-10-27-Home-Library-Profile-Refinement]] adds contextual empty-search
recovery, readable checkpoints,320px toolbar/shelf fixes and whole-Library refresh.
No decorative cover background or data migration. All four views preserved;
Home reuses saved-unit/known-total formatting without an invented denominator.

[[sessions/2026-10-24-Wooden-Shelf]] adds realistic mounted wood and seven books
per library shelf row without limiting the library's total items.

[[sessions/2026-10-24-Book-Showcase]] adds the local ranked three-book view
alongside Covers/Bookshelf/List without changing status, progress or saved work order.

[[bugs/LF-072-Reading-Intent-Label]] changes only the picker display to
`أرغب بالقراءة` / `Want to read`. The persisted wish key and click/save identity
are untouched; no migration, automatic save or metric change.
[[sessions/2026-10-19-Reading-Intent-Label]]:7 added,38 focused,2190 full passing;
Arabic demo opened with the previous Completed choice unchanged.

[[bugs/LF-068-Review-Rating-Restore]] يمنع متوسط التفاصيل من استبدال التقييم
اليدوي عند فتح محرر المراجعة؛ لا يغير حالة القراءة أو checkpoint. عرض الحالات
المسمّى والاختيار بلوحة المفاتيح موثقان في [[sessions/2026-10-19-Work-Experience]].

القاعدة المحدّثة بطلب المالك في 18 أكتوبر: [[sessions/2026-10-18-Rating-First-Completion]]
يجعل نشر تقييم عمل غير مسجل إضافةً للمكتملة مع التقاط إجمالياته مرة واحدة.
أي إدخال مكتبة أو checkpoint صريح (حتى الصفر) أو علامة إزالة يمنع الاستبدال؛
فشل الطلب أو تغير الحساب/الحالة يمنعه أيضًا. تحميل مراجعات قديمة لا يملأ
العدادات تلقائيًا، وحذف التقييم يبقي المكتبة والتقدم.

[[sessions/2026-10-16-Review-Progress-Independence]] أزال استدعاء الإكمال من
نشر المراجعة، حتى لا تتغير الحالة الصريحة أو checkpoint إلى إجمالي الكتالوج.
سياسة تهيئة المدخل القديم المفقود بقيت مستقلة ولم تُلغَ بهذا الإصلاح.

[[sessions/2026-10-16-Home-Continuation]] يعيد ربط المتابعة بالرئيسية الاجتماعية
الحالية، من checkpoint فعلي ومعرّف العمل لا نص حالته. يعرض موضع التوقف دون
نسبة مختلقة، ولا يعيد كتالوج الرئيسية القديم أو يغيّر أي تقدم تلقائيًا.

## الحقائق التي لا تختلط

حالة العمل في المكتبة، checkpoint الفصول/الصفحات/المجلدات، إجمالي العمل في
الكتالوج، وجلسة القراءة: مفاهيم مختلفة. [reading-metrics](../../modules/lorefy-reading-metrics.js)
يحسب الإجماليات من التقدم المحفوظ للأعمال الموجودة بالمكتبة.

الوقت المعروض **تقدير**: الفصل × 12 دقيقة، أو الصفحة × 1.5 عند غياب الفصول،
أو المجلد × 90 عند غياب الاثنين. هذه تمثيلات بديلة لنفس العمل وليست أوقاتًا
إضافية تُجمع معًا. الساعات تُقرّب من الدقائق. لا تسمّه وقت قراءة مقاسًا فعليًا.

[[sessions/2026-10-16-Reading-Estimate-Labels]] يربط هذا العقد بالتسميات الظاهرة
وشرح الحساب في الإحصاءات. لا يغيّر checkpoints أو يجعل الإصلاح مثبتًا على الجوال.

[[sessions/2026-10-16-Statistics-Activity-Dates]] يطابق أعمدة النشاط مع مفاتيح
الأيام المحلية التي يرسلها التطبيق. لا تُفسّر هذه المفاتيح كتوقيت UTC للقارئ،
ولا تكتب عملية عرض الرسم تاريخًا أو تقدمًا جديدًا.

## العقد

2026-10-27 superseding publication policy:
[[sessions/2026-10-27-Durable-Inbox-Review-Credit]]. Successful publication earns
a saved review completion snapshot without changing any library status or manual
checkpoint. Totals take a per-unit maximum, never double-count. The18 October
automatic Completed-status policy below is historical; public SQL parity open.

- عند إكمال عمل، يلتقط `completionCheckpoint` إجماليًا متاحًا في تلك اللحظة.
- rendering لا يرفع تقدم القارئ كلما تغيّر إجمالي provider.
- تهيئة عمل مكتمل قديم تتم فقط عند غياب checkpoint، وبشكل محفوظ لا متكرر على كل render.
- تحميل المراجعات القديمة لا يهيئ حالة مكتبة أو اكتمالًا؛ النشر الحالي لعمل غير مسجل يتبع LF-066 مع حفظ كل حالة أو تقدم سابق.
- نسبة مجهولة ليست نسبة مختلقة، والصفحات غير الفصول.

## حدود المصدر

[[sessions/2026-10-15-Diary-Feedback]] أصلح حجب دالة النصوص بمتغير `text` محلي:
نجاح حفظ الملاحظة/الاقتباس ونجاح النسخ يعلنان النتيجة دون خطأ JavaScript، ورفض
Clipboard يعلن فشلًا. بقاء النص محفوظًا سابقًا لا يثبت أن واجهة التأكيد كانت صحيحة.

[[sessions/2026-10-15-Diary-Drafts]] يمنع المزامنة من استبدال محرر ملاحظة أو
اقتباس مفتوح لنفس الحساب، مع تسجيل التقدم في الخلفية. السجل والمسودة يتبعان
الحساب الذي فتحهما؛ التبديل يغلق الواجهة القديمة ويمنع حفظها باسم الحساب التالي.

[[sessions/2026-10-15-Live-Reading-Spoilers]] ربط حماية الحرق ومحرر الملاحظة
بالموضع الحالي نفسه، دون استعادة legacy بدل الصفر. قسم الفصول يحدث العداد
والعلامات دون استبدال مسودة التعليق. إجمالي العمل يأتي من facts والمصادر،
ولا يُقرأ من نص تقدم المستخدم مثل «6 فصل مقروء».

[[sessions/2026-10-15-Reading-Ownership]] أصلح أولوية `chapter` على `ch` عند
وجود صفر صريح. زر متابعة الفصول لا يستعيد رقم legacy بدل الصفر الحالي.
إجراء القراءة والتراجع يتبعان مالك القسم الذي فتحه، ويرفضان إجراء حساب سابق؛
التراجع لا يستبدل تعديلًا أحدث لنفس العمل ولا يعيد باقي المكتبة إلى نسخة قديمة.

[التطبيق الرئيسي](../../uploads/files/lorefy-app.js)،
[library view](../../modules/lorefy-library-view.js)،
[diary core](../../modules/lorefy-reading-diary-core.js)،
[diary UI](../../modules/lorefy-reading-diary.js)،
[chapter detail core](../../modules/lorefy-chapter-detail-core.js).

الفحص: [metrics stability](../../tests/reading-metrics-stability.test.js)،
[status policy](../../tests/reading-status-policy.test.js)،
[checkpoint history](../../tests/reading-checkpoint-history.test.js)،
[library](../../tests/library-view.test.js)، [diary](../../tests/reading-diary.test.js).

[[decisions/Saved-Reading-Metrics]] | [[playbooks/Reading-Metrics]] |
[[09-Data-Contracts]] | [[systems/Profiles-Lists]]

## الافتراضي لا يحوّل التقدم
[[sessions/2026-10-16-Diary-Position-Defaults]] تربط اختيار موضع الملاحظة بالتقدم الموجود ثم نوع العمل. الكتاب/الرواية يبدأ بصفحة عند غياب checkpoint؛ التعديل والمدخل الصريح والاختيار اليدوي محفوظة. لا أثر على تقدم القراءة أو قيم اليوميات القديمة.

[[sessions/2026-10-17-Review-Library-Lifecycle]] يحل محل تهيئة المكتبة المفقودة من تقييم قديم. الحالات والتقدم الموجودان لا يُحذفان عند مسح المراجعة، ولا تُنظف سجلات قديمة تلقائياً.

- [[bugs/LF-037-Chapter-Review-Session]]: عزل نشر/حذف تقييم الفصل مع بقاء الدرجات والحرق وفلتر المالك؛ [[sessions/2026-10-17-Chapter-Review-Session]].

- [[bugs/LF-044-Import-Request-Session]]: معاينة الاستيراد وتأكيده تخص حساب الفتح والمحاولة الأحدث؛ [[sessions/2026-10-17-Import-Request-Session]]. فشل الحفظ المحلي والخادم والجهاز مستقلون.

- [[bugs/LF-045-Import-Save-Failure]]: فشل الكتابة لا يعلن نجاح الاستيراد، مع تراجع متحقق وإعادة محاولة أو توضيح الحفظ الجزئي؛ [[sessions/2026-10-17-Import-Save-Failure]]. المزامنة والجهاز منفصلان.

- [[bugs/LF-046-Import-CSV-Records]]: قراءة CSV/TSV كسجلات كاملة، دون تحويل أسطر المراجعة لأعمال، ورفض الاقتباس الناقص؛ [[sessions/2026-10-17-Import-CSV-Records]]. فحص Cloud/الجهاز مستقل.

- [[bugs/LF-065-Runtime-Cleanup]]: ملخص كتالوج2,991 بايت وتحميل فهرس المعرّفات عند الحاجة،مع إزالة كود اختصار متقاعد وتنسيقاته وتوثيق المسؤوليات؛موارد بداية الرئيسية أقل29.06% في Chrome المعزول؛15 اختبارًا جديدًا،180مرتبطة و2091كاملة؛ [[sessions/2026-10-18-Runtime-Cleanup]]. حجم التثبيت وFPS والجهاز والخدمة مستقلان.
