---
kind: coverage-map
status: source-reviewed
date: 2026-10-15
aliases: ["كل المزايا", "التغطية", "الميزات", "feature coverage"]
---
# مصفوفة تغطية التطبيق

Logic L-005: [[sessions/2026-11-01-Logical-Diary-Units]],3172 tests/60 browser
checks cover actual sync/render and share text via a controlled native adapter.
Page/volume milestones and dedup verified, not cloud/device/OS share acceptance.

Logic L-004: [[sessions/2026-11-01-Logical-Profile-Zero-Count]],3165 tests/42
browser contract checks preserve known zero and owner-only missing fallback.
Actual service/device results remain distinct from this source/fixture evidence.

Logic L-003: [[sessions/2026-11-01-Logical-Recommendation-Roundtrip]],3163 tests/
52 actual-app review-flow checks. Three logic findings are closed in source;
unreviewed domains, production and device acceptance remain separate.

Logic L-002: [[sessions/2026-11-01-Logical-Public-Review-Projection]],3158 tests/
16 browser checks preserve review semantics and stale-reader suppression. The
card-prop adapter does not certify production reaction writes.

Logic L-001: [[sessions/2026-11-01-Logical-Friend-Ratings]],3156 tests/40 browser
checks. Deliberate zero differs from unrated; latest canonical reader/work state
wins before display/mean. Other logical audit findings retain separate status.

Identity performance: [[sessions/2026-11-01-Identity-Text-Work]].3153 tests/8
browser checks cover bounded pure memo and unchanged full identity output.
All four current performance repairs retain separate receipts and boundaries.

Diary idle work: [[sessions/2026-11-01-Diary-Idle-Work]].3149 source tests,16
browser checks preserve actual transitions and owner close while skipping idle
JSON processing.12 additional4x CPU search smoke checks pass; device stays open.

Classification: [[sessions/2026-11-01-Catalog-Classification-Work]].3145 tests,
44 actual-app browser checks, policy vector digest unchanged and half the text
normalizations on1322 real records. Device/cloud performance stays separate.

Slow media: [[sessions/2026-11-01-Slow-Media-Recovery]].3142 source tests and14
actual-app delayed-byte checks cover React covers and imperative portraits,
retry/disposal ownership and one-request recovery. Network speed is separate.

Home continuation: [[sessions/2026-11-01-Home-Reading-Hierarchy]].3137 full
tests/288 local UI checks cover stable header,0/1/4 choices, no saved edits,
ongoing checkpoint-only display and chapter/page/volume percentages. Physical
device, cloud acknowledgment and other historical percent consumers stay separate.

Home reactions: [[sessions/2026-11-01-Home-Reaction-Feedback]]. Shared action
geometry and immediate post feedback/rollback verified locally;3122 full tests,
192 browser checks. Actual service/device acceptance remains separate.

Kitsu import completeness: [[sessions/2026-10-30-Kitsu-Complete-Pagination]].
3057 source tests/192 real local-UI fixtures; all next pages fetched or an
explicit retryable failure before any preview. No live provider/service claim.

Import text: [[sessions/2026-10-30-Import-Written-Reviews]] adds explicit written
CSV review preservation with preview/opt-out, no-overwrite and idempotent local
merge.3034 full tests/168 real-UI fixtures; no server jobs, publication or live
provider-review completeness claim. Kitsu follow-up has separate evidence above;
CSV browser acceptance rerun180 with actual dark/pink theme/language assertions.

F15 queued read receipt race: [[sessions/2026-10-30-Inbox-Receipt-Scope]]. Three
new regressions for account/logout/backend transition before microtask dispatch;
74 focused notifications tests and84 real-UI fixture checks. This is distinct
from notification delivery/production RLS certification or a native release.

F15 follow-up: [[sessions/2026-10-30-Inbox-Reconnect]] verifies local reconnect,
read updates, duplicate safety, parallel refresh, online and native-resume callback
handling.3014 source tests/84 UI fixture checks; no live devices or service write.
Broader inbox pagination and real delivery are not marked complete.

Supabase Pro: [[sessions/2026-10-30-Supabase-Pro-Adoption]]. Plan, spend cap,
usage, backups and private buckets verified read-only; bounded shared signing
cache implemented locally with14 regressions. No image transformations, queue,
Cron, paid add-ons or service mutation enabled. Device/CDN acceptance remains.

F13: [[sessions/2026-10-29-Cover-Edition-Choice]]. Provider metadata retained
through cache/normalization/proxy rewriting to each choice and preview. Known
edition/volume separated from image source; unknown/conflicting data not guessed.
108 local browser checks and2973 full source tests at the GitHub checkpoint.
Exact saved image URL/work ID and reading state retained. Live providers, device
and cloud durability unverified. Resume F15 after checkpoint, not another redesign.

F12 local acceptance: [[sessions/2026-10-29-Library-Shelf-Acceptance]]. Library
counts1/2/3/4/7/8/10/14/15 and favorites1/2/3/4/7 across three layouts, AR/EN,
320/390/768. Reader caption competition and decorative spine click interception
repaired.288 geometry cases,17 native action/grid regressions;2966 source tests.
Not full Library search/filter/sort, all touch targets, visitor or device approval.
F13 edition/source choice is next; F07 remains deferred as one task.

F08 display-only search edition grouping:
[[sessions/2026-10-29-Search-Edition-Groups]]. Conservative known metadata or
explicit linkage only; picker retains all original IDs. Snapshot/focus/order,
query/filter, global/format search and grouped paging locally verified.13 new
regressions,2963 full tests,99 browser fixtures. Unknown cached metadata stays
separate. Not a provider, bibliographic or native certification. F12 is next.

Current UI execution status: [[19-UI-Execution-Control]]. Historical consumer
batches below are not independent completed features. Phases13–22 all belong to
partial F07; remaining image owners are one deferred task. F08 user-facing
edition grouping was delivered locally, distinct from catalog deduplication. No
app-wide completion percentage or fresh device/service certification is claimed.

F07 owner rated-character strip/See all consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Twenty-Two]]. Managed recovery,
independent native work opening, explicit replacement/removal cleanup and nested
dialog pause/resume. Fallback centering/gallery width repaired.10 new tests,
2950 full tests,86 fixtures and24 preserved dimensions. Not public/favorite
portraits, other picker media, live service acceptance or F08 edition grouping.

F07 modern profile-list consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Twenty-One]]. Projected list image URLs
retained in owner/visitor views. Scoped recovery/disposal, read-only envelopes,
separate native Add/Retry and rank-tool focus.8 new tests,2940 full tests,
126 browser fixtures,12 geometry configurations/42 unchanged elements. Synthetic
visitor is not live two-account validation. Other F07 owners/F08/native gates open.

F07 category preference character-board consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Twenty]]. Slot/candidate/current preview
adopted; queued-image guards, originating picker ownership, separate native
selection/Retry and share metadata retained.7 new regressions,2932 full tests,
131 controlled browser cases,6 geometry configurations. No real image saved;
profile/public/modern-list/published media, F08 and native/service gates remain.

F07 legacy character top-ten list consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Nineteen]]. Podium, cast faces and hub
previews adopted; separate native actions, external image retry and obsolete
cast-view guards.10 new tests,2925 full tests,117 browser cases;30 circle sizes
unchanged and nested buttons3 to0 per fixture. Category boards, modern/public
profile media and other image owners remain. F08/device/provider gates open.

F07 character rating-page/current-preview consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Eighteen]]. Imperative DOM lifecycle,
original-source recovery, independent44px Edit/Retry and explicit row/picker/page
cleanup.8 new tests,2915 source tests,119 browser cases,6 unchanged geometry
configurations/18 elements. Not all character/profile/published-media owners;
native/provider acceptance and F08 remain open. No saved score or image change.

F07 Work/Review Editor consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Seventeen]]. Hero and mini cover plus
draft pictures adopted; image-specific copy, stable hero/mini sizes and separate
44px Retry/Remove.7 new regressions,2907 full tests,107 browser cases,6 geometry
configurations/24 elements. Published images, profile/character media, picker
internals and physical/provider acceptance remain open. Local only, no build.

F07 editorial consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Sixteen]]. Explore feature/format art,
friend ratings and review work attachments adopted.7 new tests,2900 full tests,
54 controlled browser cases,12 dimension comparisons. Original artwork binding,
ranking, review callbacks and account state retained. Work hero, avatar/character
and uploaded/quote media, picker internals and native/service validation stay open.

F07 Home Continue reading consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Fifteen]]. Managed poster/backdrop and
selection thumbnails, separate named recovery and stable reading callbacks.
6 new tests,2893 full tests,40 browser cases and8 geometry comparisons. Home
review/feed covers, other hero/format art and provider/device acceptance stay open.

F07 second consumer batch:
[[sessions/2026-10-29-UI-Foundation-Phase-Fourteen]]. Library/owner/visitor work
covers and Reader current-reading rows adopted; stable outer cover anchors,
missing-book titles/ranks and independent native Open/Edit/Retry.13 new tests,
2887 full tests,53 browser cases and26 geometry comparisons. No account or
provider mutation. Home, other artwork owners and native acceptance stay open.

F07 first consumers, not all image paths:
[[sessions/2026-10-29-UI-Foundation-Phase-Thirteen]]. Managed original-source
loading/error/missing states for Explore items and Work poster,44px sibling Retry,
lazy deadline/stale callback cleanup and no generated failure replacement.
15 new tests,2874 full suite,43 controlled browser cases. Library/Profile/Home
adoption, real providers and native validation remain open.

Work/search creator portion of F06:
[[sessions/2026-10-28-UI-Foundation-Phase-Twelve]]. Long creator/secondary text
wraps inside the existing identity column;44px author action and original callback.
Search bylines expose full literal accessible metadata while keeping two lines.
14 new tests,2859 full suite,48 local browser cases including exactly2x font.
Not author-bibliography, all image states or physical-device certification.

Community post counters/copy portion:
[[sessions/2026-10-28-UI-Foundation-Phase-Eleven]]. Direct labels and exact
accessible totals for post/reply actions, compact display and Arabic plural
boundaries. Thread empty/loading/retry/input labels follow first-render language.
12 new regressions,2845 full suite,56 isolated browser cases including actual
cached-node updates. Not all review counters, copy or device/service acceptance.

Reading-title composition, F06 portion:
[[sessions/2026-10-28-UI-Foundation-Phase-Ten]]. Home/Library/three Profile layouts
and fixture visitor library preserve full mixed-language titles with automatic
direction, two-line slots and text-sized caption growth. Showcase source-title
updates are observed without caption loops.19 new tests,2833 full suite,72 local
browser cases including2x font checks. Not full app text or native Dynamic Type.

Reading-state display, F05 portion:
[[sessions/2026-10-28-UI-Foundation-Phase-Nine]]. Shared labels/empty states in
Library, three Profile layouts, Work Status, badges, Import and fixture visitor
library. Named keyboard cover actions.22 new regressions,2814 full tests,
51 browser cases; storage values and metrics unchanged. Not full app-copy,
counter-grammar, real import/two-account or device certification.

Legal/support presentation:
[[sessions/2026-10-28-UI-Foundation-Phase-Eight]],19 new regressions,2792 full
tests,65 browser cases across four documents. Saved/custom themes, glass chrome,
44px Back,16px body, keyboard links, safe preview context and no-JS/denied-storage
fallback. Original Arabic article hashes unchanged. No approved translation,
legal review, deployed public-document change, email or device certification.

Review reporting/content controls:
[[sessions/2026-10-28-UI-Foundation-Phase-Seven]]. Shared opted-in glass, direct
AR/EN labels, form semantics, one pending operation, safe inline failure and
stale-window/account guards. Device-only vs cloud receipt wording retained.
Core final owner/client/generation checks and current-list merging cover late
or concurrent receipts.2773 full tests,21 new regressions,20 browser cases with
fixture operations only. No real report/mute/block, server write or native test;
legal pages and post-reporting feature expansion are not certified.

Correction/Safety/Missing-work tools:
[[sessions/2026-10-28-UI-Foundation-Phase-Six]],22 new source regressions,
2752 full tests and56 local browser checks. Shared opted-in sheet chrome,
direct AR/EN, associated16px form fields, truthful local-queue labels, named
safety actions, pending focus and inline retry feedback. Data center rechecked
after chrome reuse. Real service delivery, valid browser draft mutations/native
export and hardware remain separate gates. Community report editor, legal
documents and the broader plan remain open.

Privacy/data UI: [[sessions/2026-10-28-UI-Foundation-Phase-Five]],
[[systems/Privacy-Data]]. Shared material at the standalone mount, direct
AR/EN,44px actions,16px native labeled selectors and actual320px stacking.
Product child isolation/replacement/removal and pending-export focus are covered
by13 added source regressions;2730 full tests and20 browser cases passed.
No visibility, unblock, real export or account action ran in browser QA. Synthetic
whole-parent teardown restores usability but retains legacy Body focus. Device,
live service, legal documents and correction/safety presentation remain separate.

Settings and customization: [[sessions/2026-10-28-UI-Foundation-Phase-Four]].
Scoped glass/materials and fields, accurate dialog label, keyboard tabs/panels,
linked inline color error, and Apply focus retention.12 new tests;2717 full,
18 Chromium cases across themes/languages/preview modes. Actual profile Save,
privacy/notification actions and native permissions were not exercised; device,
service and open-window language switching remain gates. Data/privacy was later
covered by phase five; this earlier evidence remains historical.

Import consistency: [[sessions/2026-10-28-UI-Foundation-Phase-Three]]. Scoped
material/layout, visible field labels, AR/EN chrome and legacy error translation,
pressed state, loading/review/error focus and preserved drafts.2705 source tests,
20 Chromium cases; no confirmation or real-account import in browser QA. Device,
service health, zoom/Dynamic Type and cloud persistence are separate gates.

Image-picker behavior: [[sessions/2026-10-28-UI-Foundation-Phase-Two]]. Existing
dialog keyboard/inert helper, owner/lifetime guards, single-flight saves,
provider Retry/deadline, and opt-in strict Jikan/Fandom errors.2684 full source
tests,15 browser cases and2 local provider-fixture checks; sampled saved content
unchanged. Device Photos/upload and the broader UI plan remain unverified.

UI consistency plan, first batch:
[[sessions/2026-10-28-UI-Foundation-Phase-One]]. Image-picker semantic action
pairs, glass,44px targets and direct AR/EN labels/direction; original owner
profile reading filters disappear outside Overview in all3 layouts.30 local
browser cases pass without modifying the sampled persisted content keys.
This is not completion of the entire27-unit plan or device photo/focus testing.

Selected Personal Picks: [[sessions/2026-10-28-Share-Composer]]. Top/ranking/list
first row + equal nine-tile grid, ten per page even square, versioned preference
default preserving custom colors.2657 tests,36 theme/format/language cases and
paired visual comparison pass. Other output designs remain unselected.

Nested list export repair: [[sessions/2026-10-28-Share-Composer]]. Verified real
list-button entry, foreground non-inert mounting, Close/Escape and focus return
at three widths;2654 tests pass. Replacement designs await owner selection.

Editable image export: [[sessions/2026-10-28-Share-Composer]]. Three Canvas
families across work/review/ranking/top/list entry points, semantic app/manual
colors, gradient, font, title/text/identity controls, three formats and paging.
2653 full tests,96 browser cases, exact PNG/preview byte equality for three
downloads. No native build, real external-app publication or service writes.

Local work-dislike follow-up: [[sessions/2026-10-28-Local-Work-Dislike]].
Intentional zero publishes through existing owner/work review, while unrated
zero/null cannot. Exact public HEAD-count reader with session guards/Retry;
Home/share preserve zero. Eight bilingual/theme/width browser cases and a
mounted count lifecycle fixture pass. Live RLS/count/publication remain open.

Functional priority: [[sessions/2026-10-27-Durable-Inbox-Review-Credit]].
Durable recent inbox, owner isolation, read retry and offline recovery; eight
isolated browser cases with push disabled. Review snapshots credit chapters and
estimated hours without changing reading status/checkpoints; composer reload
verified.2620 full tests pass. Live two-account delivery/public metrics parity,
written-review import, work-dislike count and remaining photo entry points open.

Sequential UI follow-up: [[sessions/2026-10-27-Home-Library-Profile-Refinement]].
Home feed/known checkpoint, all Library modes and original three profile layouts
refined without replacing art, saved data or approved Explore. Whole-Home and
Library refresh reuse existing handlers.2610 tests,96 browser presentation and24
moving-canvas cases. Native keyboard/accessibility/performance remain separate.

Approved reference and remaining work: [[sessions/2026-10-27-Home-Approved-Reference]].
Explore preserved; Home-only immersive/sticky/empty chrome with cleanup, compact
Continue and24 browser cases. Library/profile redesigns are explicitly pending.

Glass material/text follow-up: [[sessions/2026-10-27-Glass-Depth-Typography]].
Shared semantic material tokens, clear control glass/denser sheets, page wash,
font and caption consistency.112 browser cases after font load and25 sampled
navigation pixel/contrast cases; native performance/accessibility not certified.

Ready-made theme gap and featured title: [[sessions/2026-10-27-Ready-Themes-Hero-Bounds]].
Ready Light/Pink join custom palette coverage.36 new original-profile cases,
40 main-screen/theme cases and36 direct long-title/poster checks; local only.

All-layout/custom-color follow-up: [[sessions/2026-10-27-Profile-Custom-Glass]].
Normal/Panoramic/Reader share polish; literal custom palette aliases bypass
cinematic screen/sheet overrides without changing noncustom defaults.2587 source
tests,54 profile and16 custom-route browser cases. Device/visual acceptance open.

Original Normal Apple detail pass: [[sessions/2026-10-26-Normal-Apple-Details]].
Scoped typography, symbols, material/selection/focus states and public wooden
board bounds; no new layout or data logic. Seven regressions,2580 full tests,
12 owner +24 unchanged other-layout +6 decorated visitor cases. Actual iPhone,
avatar editing/upload and the later layout passes remain independent gates.

Structural work editors: [[sessions/2026-10-26-Work-Studio]]. Status progress/
removal, review views/quarter steppers, responsive cast gallery, cover preview/
apply/retry and bounded overflow menu retain canonical callbacks.15 regressions,
2573 full-suite passes, local AR/EN and short-viewport evidence. Actual iPhone,
account publish/upload and service availability remain separate gates.

Composer/work cinema: [[sessions/2026-10-26-Work-Cinema]]. Glass author/writing/
tool layout, preserved drafts and keyboard-ready attachment picker; coherent
work actions, tabs, review/status/cover sheets and cast page.44 AR/EN viewport
checks; nonserialized books retain controls without chapter blocks. No actual
publish/upload or native service/performance certification.

Types/Search: [[sessions/2026-10-26-Explore-Types-Search]]. Eight catalog-art tiles,
relevance ordering, format/genre/status/sort filters, bounded paging and distinct
loading/partial/error/empty states. Account-scoped recent searches are session
only; People/My lists inputs stay out of book providers. Local browser evidence
includes responsive/keyboard and injected-failure recovery, not live service QA.

Selected Explore image: [[sessions/2026-10-26-Explore-Immersive-Reference]].
Full-bleed scoped art, actual poster and existing Add workflow, three previews
without truncating full collections.2541 source tests, six bilingual viewport
combinations across Browse/Search/Types; native and service checks separate.

Explore and plain Library: [[sessions/2026-10-26-Explore-Cinema]]. Removed Library
backdrop renderer/request; matching glass Explore with preserved media/people/
list search, filters and collections.2537 source tests,54 browser layout cases;
native performance and real-account/backend availability remain unverified.

Home/Library cinematic direction: [[sessions/2026-10-26-Home-Cinema]] and
[[sessions/2026-10-26-Library-Cinema]]. Local sharp artwork, compact review/post
actions, glass composer, controlled library search and four retained modes.
2531 source tests and24 bilingual/responsive browser cases pass. Physical-device
and live catalog-service certification remain separate; no push/build.

Catalog federation: [[sessions/2026-10-26-Open-Catalog]]. Four local sources,
source/entity identity, bounded gateway, deadlines, lazy-search recovery and
account-scoped missing-work drafts. Production gateway/account activation and
authenticated cloud request review are NOT complete. See docs/OPEN_CATALOG.md.

Frame consistency: [[sessions/2026-10-25-Frame-Layout-Unity]]. Shared toolbar-safe
header, connected alpha-calibrated corners, filled material strips and responsive
portrait budgets.306 public-layout cases,87 actual owner applications and9 LTR
long-name cases. Browser motion verified; physical-device/visual approval open.

Decoration storefront: [[sessions/2026-10-25-Decoration-Store]].29 offered packs,
bilingual search, saved/owned filters, animated preview and component application.
Rig-load race/retry regressions and29 browser previews;320/440/1024px responsive
checks. Real-device performance and production transactions remain unverified.

Upper-ribbon balance: [[sessions/2026-10-25-Balanced-Frame-Ribbons]]. Opaque
texture coverage, control-safe connectors and rounded tangent-matched side
joints;234 fresh layout cases and2484 tests. Visual/device acceptance remain open.

Final restored-header follow-up: [[sessions/2026-10-25-Compact-Frame-Headers]].
Compact above-banner crests, small-phone row and visibly deforming side skins.
234 final browser cases,2479 source tests; device and aesthetic acceptance open.

Existing-frame upgrade: [[sessions/2026-10-25-All-Frame-Restoration]].39 original
catalog IDs use calibrated contours and material/character skins;306 browser
cases include both local six-pack batches.2475 tests pass. Device performance,
real-account persistence and owner aesthetic approval remain separate gates.

Elf visual repair: [[sessions/2026-10-25-Elven-Frame-Repairs]]. Moving top/sides/
footer, non-stretched crest, seamless articulated PFP and inner-rim photo mask.
36 layout cases and2468 source tests; physical-device acceptance remains open.

Elven motion: [[sessions/2026-10-25-Elven-Local-Motion]]. Six local-demo packs,
independent PFP parts and edge ornaments, shared scheduler, three-layout fixture.
36 browser cases and2466 tests pass; portrait pixels remain static. Device FPS,
real-account persistence and production enablement are not verified.

Elf concepts: [[sessions/2026-10-25-Elven-Concepts]]. Twelve preliminary choices;
only six approved. Three-ear twitch QA study verified, with stationary center and
page pixels. Forest/page animation and three-layout app acceptance remain pending;
no runtime catalog enablement or native build.

PFP actions: [[sessions/2026-10-25-PFP-Articulated-Motion]]. Independent bitmap
layers/pivots replace avatar shear; all six have distinct actions with a protected
portrait.2461 tests and36 browser geometry cases pass. Page borders are unchanged;
future character/eye/tail assets and physical-device performance are unverified.

Atelier perimeter: [[sessions/2026-10-24-Atelier-Perimeter-Waves]]. All six local
materials now animate the left/right/footer, with bounded connected geometry,
stable control rows and per-edge pixel-change evidence.2457 tests pass; device
performance and production enablement remain unverified.

Atelier header follow-up: [[sessions/2026-10-24-Atelier-Header-Waves]]. Six full
illustrated wave ribbons replace four-pixel connectors and cropped crests. Seven
Atelier regression tests and36 local browser geometry cases cover this change;
physical-device performance and production enablement remain unverified.

Banner repair follow-up: [[sessions/2026-10-24-Banner-Repairs]]. Nine owner cases,
ten decorated public-renderer cases across three families, draft/cancel and ratio
checks;2449 tests pass locally. This is not every-pack or physical-device certification.

Profile artwork extent: [[sessions/2026-10-24-Profile-Header-Extent]]. Normal,
Panoramic and Reader checked in the owner app and long-name public fixtures at
320px, including dark mode; 2443 tests pass. Local only, not a device/service claim.

Wooden shelf: [[sessions/2026-10-24-Wooden-Shelf]]. Seven saved favorite slots,
three featured works, uncapped library rows; actual-library clipping follow-up
and consistent RTL/LTR geometry verified with 2438 source tests. Original fixture
lacked production card culling/margin constraints, now included in regression QA.

Book showcase: [[sessions/2026-10-24-Book-Showcase]]. Local favorites/library
choice and owner render contracts verified; deployed whitelist/device pending.

Reader layout: [[sessions/2026-10-23-Reader-Layout]]. Owner selection/save/cancel,
reload and original-layout switching checked locally; public renderer contract
tested. Production visitor projection and physical device remain pending.

[[sessions/2026-10-20-Publisher-Index]] يثبت اكتمال58نبذة ناشر وملء29جديدة؛
5اختبارات جديدة و2341كاملة ناجحة و8حالات Chromium. المكتبةالعربية1246سجلًا
فيها1190نبذةناقصة؛هذهليست شهادةاكتمالبيانات الكتالوج أوالجهاز.

[[sessions/2026-10-20-Carousel-Publisher]] يغلق نطاق زرإيقاف/تشغيل الغلاف
ويثري3نبذ:10اختبارات جديدة،2336كاملة ناجحة و6حالاتChromium.
بقيةنواقص الكتالوج واختبارآيفون وVoiceOver غيرمغلقة.

استعادة خطأ تبديل البحث ونصوصه: [[sessions/2026-10-20-Remaining-Skills]]؛
اختبارانregression جديدان،2326 كاملة وست حالات متصفحAR/EN ناجحة.
ملاحظة الغلاف أغلقت لاحقًا فيالجولة أعلاه؛مصادرmetadata المحجوبة باقية.

كاش الشخصيات ولوحة مفاتيح محرر المفضلة: [[sessions/2026-10-20-Skills-Application]]؛
9 حالات جديدة و2324 كاملة ناجحة، مع ست حالات متصفح عند320/390/440px.
يبقى VoiceOver والجهاز والخدمة خارج القبول الحالي؛ لا رفع للمصدر في هذه الجولة.

تكرار طلب الاسم: [[bugs/LF-084-Character-Search-Coalescing]]،7 حالات جديدة
و2315 كاملة ناجحة؛ طلب واحد للاسم الجاري مع بقاء active وهوية العمل لكل مستدعٍ.

إعادة اكتشاف المصدر: [[bugs/LF-083-Character-Discovery-Retry]]،9 حالات جديدة
و2308 كاملة ناجحة؛ فشل مؤقت لا يُحفظ طوال الجلسة، والنجاح يبقى محفوظًا.

قراءة رد الشخصيات: [[bugs/LF-082-Character-Provider-Body]]،13 حالة جديدة
و2299 كاملة ناجحة؛18 مسار JSON محدود، دون قطع القوائم أو اعتماد خدمة/جهاز.

نوع كتالوج الشخصيات: [[bugs/LF-081-Character-Catalog-Taxonomy]]،10 حالات جديدة
و2286 كاملة ناجحة؛ مصدر الاختيار نفسه للمحمّل والمزوّد، دون تغيير أسماء الأنواع المحفوظة.

تحميل ملف الشخصيات: [[bugs/LF-080-Character-Catalog-Loading]]،8 حالات جديدة
و2276 كاملة ناجحة؛ مهلة ومحاولة جديدة وعزل callbacks دون حفظ فراغ وهمي.

استعادة بحث الشخصيات: [[bugs/LF-079-Character-Search-Response]]،10 حالات جديدة
و2268 كاملة ناجحة؛ الرد غير الصالح يفشل دون كاش دائم، والرد الفارغ الصحيح محفوظ.

مهلة بحث الشخصيات: [[bugs/LF-078-Character-Search-Deadline]]،7 حالات جديدة
و2258 كاملة ناجحة، وفحص فشل/رد متأخر/إعادة المحاولة في محرر React. لا اعتماد جهاز.

قبول 19 أكتوبر: [[sessions/2026-10-19-All-Followups-Acceptance]]،2251 ناجحة؛
39 خيار زينة و468 حالة هندسة للمالك والزائر. لا شهادة جهاز أو خدمة أو كل التركيبات.

اختيار الإشعارات: [[bugs/APNS-003-Permission-Intent-Race]]؛7 حالات جديدة
لنتائج الإذن والتسجيل المتأخرة،66 مرتبطة و2251 كاملة ناجحة. اختبار جهاز/خادم منفصل.

محرر الشخصيات: [[bugs/LF-077-Character-Editor-Extra-Work]] يلغي مسح الكتالوج
في وضع الشخصيات وإعادة الرسم القديمة بعد Clear؛ تبويب الأعمال مستقل ومحفوظ.

هوية الشخصيات في البحث: [[bugs/LF-076-Character-Search-Identity]] يمنع الكتب
العادية والعناوين الملتبسة وتعارض IDs؛2241 اختبارًا ناجحًا. لا مراجعة شاملة
لكل كتالوج مزود أو ترحيل تلقائي للمفضلة القديمة.

البروفايل والمجتمع: [[bugs/LF-075-Pull-Refresh-Lifecycle]]، تحديث بالسحب
وحماية الطلب المتأخر والتعديلات المحلية، مع تقليل رندر المجتمع المتكرر.
[[sessions/2026-10-19-Pull-Refresh-Lifecycle]]؛ لا اعتماد جهاز أو خدمة إنتاج.
33 حالة جديدة و2233 كاملة ناجحة؛ عينة DOM ساكنة2ثانية بلا تبديل عناصر.

البحث: [[bugs/LF-074-Author-Query-Corrections]]؛ خمسة اختبارات جديدة و71
مرتبطة و2200 كاملة ناجحة، واقتراح Pride and Prejudice ظهر في المتصفح الفعلي.
فجوات أسماء الكتب ومطابقة النسخة المثبتة ما زالت مستقلة.

[[bugs/LF-073-Surface-Render-Recovery]]: حاجز عرض React مع إعادة محاولة يدوية
وحماية التخزين،5 حالات جديدة و2195 كاملة ناجحة. متصفح AR/EN أثبت fault/retry؛
[[sessions/2026-10-19-Surface-Render-Recovery]] يفصل هذا عن بلاغ الجوال الأسود.

حالة القراءة: [[bugs/LF-072-Reading-Intent-Label]]، عرض «أرغب بالقراءة» في
المنتقي دون تغيير القيمة المحفوظة؛7 حالات جديدة،38 مرتبطة و2190 كاملة.
[[sessions/2026-10-19-Reading-Intent-Label]] يثبت ظهور radio بالعربية دون حفظ؛
الإنجليزية اختبارات مصدر، لا اعتماد جهاز أو الخدمة.

صور Discord: [[bugs/LF-071-Artwork-Storage-Quota]]؛ 6 حالات جديدة،42 مرتبطة
و2183 كاملة ناجحة. [تصنيف البلاغات](../docs/DISCORD_FEEDBACK_REVIEW_2026-10-19.md)
يفصل الإصلاح الجديد عن الإصلاحات السابقة وحدود الشاشة السوداء والبحث والجهاز.

[[bugs/LF-070-Dynamic-State-Sync]]: ست حالات أخرى و76 مرتبطة؛ حذف المفاتيح
الديناميكية واعتماد الإضافات السحابية وretry وحد20 مفتاحًا لكل دفعة.
[[sessions/2026-10-19-Dynamic-State-Sync]] لا يعتمد تكامل SDK/الجهاز أو حسابين.

الحفظ: [[bugs/LF-069-Pull-Remote-Deletions]]؛ سبع حالات جديدة و51 مرتبطة
تمنع عودة حقل محذوف سحابيًا بجانب تعديل offline. فحص إسقاط عام على الخادم
قراءةً فقط، بلا اعتماد تجربة حسابين أو الحظر أو الجهاز؛
[[sessions/2026-10-19-Pull-Remote-Deletions]].

صفحة العمل ومساراتها: [[sessions/2026-10-19-Work-Experience]]؛ 15 اختبارًا
جديدًا، 138 مرتبطة و2164 كاملة ناجحة. مراجعات وحالة قراءة وغلاف وشخصيات
بالمتصفح، مع [[bugs/LF-068-Review-Rating-Restore]] لاستقرار التقييم اليدوي.
الحفظ التجريبي لا يثبت النشر الحي أو أذونات الصور أو VoiceOver/iPhone.

أحدث bootstrap: [[sessions/2026-10-18-Feather-Launch-Motion]]، ريشة تكتب
Lorefy دون نص تحميل أو انتظار إضافي؛ 20 اختبارًا مرتبطًا و2149 كاملة ناجحة،
وفحص 320/390/1280 وتقليل الحركة في المتصفح. لا بيلد أو اعتماد iPhone/FPS.

الدخول والفتح: [[sessions/2026-10-18-Minimal-Entry-Launch]]؛ 4 حواجز عرض/مزود
جديدة،48 مرتبطة و2145 كاملة ناجحة. AR/EN و320/390/1280 في المتصفح؛ أزرار
مزودين وهمية في QA فقط لا تثبت OAuth الحقيقي أو شاشة إطلاق الآيفون الأصلية.

القوائم والحذف: [[sessions/2026-10-18-List-Removal-Public-Projection]]؛ 7 حالات
جديدة و2140 كاملة ناجحة، وفحص حذف تجريبي بعد التحميل. فُعّلت دالة الإسقاط
العام بإذن المالك مع فحص خصوصية تجميعي؛ اختبار حسابين على الآيفون مستقل.

اتساق المجتمع والبروفايل: [[sessions/2026-10-18-Social-Profile-UI]]، 14 اختبارًا
جديدًا و79 مرتبطة و2133 كاملة ناجحة. يشمل فحص المالك والزائر والقوائم والمنشورات
ومسودة النشر والردود وبدائل الحركة والشفافية؛ لا تعديل بيانات أو بيلد أو اعتماد جهاز.

تحسين الواجهة بالمهارات الجديدة: [[sessions/2026-10-18-Apple-UI-Surfaces]]،
9 اختبارات جديدة و2119 كاملة ناجحة؛ تنقل وتبويبات وبحث وترتيب وفحص
تقليل الحركة والشفافية والتباين في المتصفح. تبقى شهادة الجهاز وVoiceOver منفصلتين.

متابعة جودة التفاعل: [[bugs/LF-067-Press-Motion-Feedback]]، استجابة فورية
للأزرار الأساسية وإشارة ثابتة عند تقليل الحركة؛ 2110 اختبارات ناجحة وفحص
AR/light وEN/dark في المتصفح. [[sessions/2026-10-18-Apple-Interaction-Quality]]
يفصل النطاق عن فحص الجوال وFPS وتغطية جميع الإيماءات غير المنجزة.

كل صف نقطة دخول لنظام، لا ادعاء بأن كل زر ومسار فيه اختُبر. الروابط تؤدي
إلى العقود والمصدر والاختبارات. الاختبار الآلي وfixture المتصفح واختبار
الجهاز وحالة الخدمة الحية درجات دليل مختلفة. النتيجة الجديدة تُسجل في
[[sessions/2026-10-15-Source-Reorganization]]؛ الإيصالات الأقدم تبقى تاريخية.

| النظام | مصدر الملكية والمعرفة | تحقق المصدر | ما لا يثبته |
| --- | --- | --- | --- |
| التشغيل والتخزين المؤقت | [[systems/App-Boot]]؛ [entry](../index.html) و[cache](../sw.js) | [bootstrap](../tests/bootstrap-auth-safety.test.js)، [versions](../tests/version-consistency.test.js) | سرعة تشغيل بارد أو خلو iPhone من الانهيار |
| الدخول والخروج وحذف الحساب | [[systems/Accounts-Sync]]؛ [auth](../auth/lorefy-auth.js) | [native auth](../tests/native-auth-flow.test.js)، [deletion](../tests/account-deletion-recovery.test.js) | نجاح حساب Apple/Google فعلي وأذونات الجهاز |
| المزامنة وملكية البيانات | [[09-Data-Contracts]]؛ [backend](../backend/lorefy-backend.js) | [account isolation](../tests/account-sync-isolation.test.js)، [runtime repairs](../tests/runtime-repairs.test.js) | تعارض جهازين فعليين أو جاهزية كل migrations |
| الكتالوج وهوية الأعمال | [[systems/Catalog-Search]]؛ [identity](../modules/lorefy-catalog-identity.js) | [identity](../tests/catalog-identity.test.js)، [organization](../tests/catalog-organization.test.js) | صحة كل سجل خارجي أو اكتمال حقوق المحتوى |
| البحث والتحميل عند الطلب | [[systems/Catalog-Search]]؛ [loader](../modules/lorefy-catalog-loader.js) | [demand loading](../tests/catalog-demand-loading.test.js)، [recovery](../tests/catalog-search-recovery.test.js) | توفر المزود الخارجي دائمًا |
| الاستكشاف وتفاصيل الأعمال | [[systems/Explore-Works]]؛ [studio](../modules/lorefy-explore-studio.js) | [source synopsis](../tests/catalog-source-synopsis.test.js)، [language](../tests/work-detail-language.test.js) | وجود نبذة موثوقة لكل عمل |
| المكتبة والفصول والساعات | [[systems/Reading-Library]]، [[decisions/Saved-Reading-Metrics]]، [[sessions/2026-10-16-Reading-Estimate-Labels]]، [[sessions/2026-10-16-Statistics-Activity-Dates]] | [stability](../tests/reading-metrics-stability.test.js)، [estimate labels](../tests/reading-metric-labels.test.js)، [activity dates](../tests/statistics-activity-dates.test.js)، [chapter ownership](../tests/chapter-reading-ownership.test.js) | بقاء الحفظ بعد force-quit على كل جهاز؛ مطابقة نسخة الجهاز للمصدر |
| اليوميات والاقتباسات والحرق | [[sessions/2026-10-15-Live-Reading-Spoilers]]، [[sessions/2026-10-15-Diary-Drafts]] | [draft](../tests/reading-diary-draft.test.js)، [feedback](../tests/reading-diary-feedback.test.js) | قبول مشاركة أصلية أو Clipboard من النظام الحقيقي |
| الشخصيات وتقييماتها ومفضلاتها | [[systems/Explore-Works]]؛ [growth](../modules/lorefy-growth-features.js) | [atlas](../tests/character-atlas.test.js)، [saved summary](../tests/character-rating-summary.test.js)، [hydration](../tests/character-gallery-hydration.test.js) | اكتمال كل cast أو توافر كل صورة أو تثبيت المصدر على الجهاز |
| البروفايل الشخصي والعام | [[systems/Profiles-Lists]]؛ [public profile](../modules/lorefy-public-profile.js) | [view](../tests/public-profile-view.test.js)، [loading](../tests/public-profile-loading.test.js) | تحديث النسخة المثبتة أو صحة الإسقاط المنشور الآن |
| المتابعة والوصول والصور | [[12-Device-Repairs]] LF-006/007/008 | [avatars](../tests/connection-avatar.test.js)، [keys](../tests/connection-keyboard.test.js)، [locale](../tests/followers-localization.test.js) | جلسة VoiceOver فعلية أو كل روابط الصور البعيدة |
| اللستات والخصوصية والحظر | [[systems/Profiles-Lists]]، [[sessions/2026-10-15-Privacy-Safety-Repairs]] | [sections](../tests/profile-sections.test.js)، [privacy](../tests/privacy-safety-repairs.test.js) | أن التغيير المحلي وصل إلى قاعدة الإنتاج |
| المجتمع والتفاعلات والمحفوظات | [[systems/Community-Notifications]]؛ [community](../modules/lorefy-community.js) | [runtime repairs](../tests/runtime-repairs.test.js)، [account surfaces](../tests/account-surface-isolation.test.js) | نشر تفاعل فعلي أو قبول moderation على الخادم |
| صندوق الجرس وAPNs | [[systems/Community-Notifications]]، [[sessions/2026-10-16-Authorized-Push-Check]] | [delivery runtime](../tests/notification-delivery-runtime.test.js)، [native links](../tests/native-notifications-links.test.js)، قبول واختبار فعلي واحد أكد المالك استقباله وفتحه | تعميم كل الأجهزة والأحداث والإقلاع البارد؛ إصلاح النقل لم يُنشر |
| الثيمات والرفوف والإطارات | [[systems/Appearance-Bundles]]، [[decisions/Profile-Frame-Geometry]] | [frame motion](../tests/frame-motion.test.js)، [profile decoration](../tests/profile-decoration.test.js) | أن كل حزمة اجتازت اللمس والأداء على iPhone |
| مجانية الحزم وملكية الشراء | [[decisions/Temporary-Free-Bundles]]؛ [billing](../modules/lorefy-decoration-billing.js) | [paid collections](../tests/paid-collections.test.js) | جاهزية بيع فعلي أو موافقة حقوق الأصول |
| الصور واللغة والمشاركة | [[systems/Language-Media]] | [native photo formats](../tests/native-photo-format.test.js)، [image resilience](../tests/image-resilience.test.js) | فحص الكاميرا والمعرض والرفض والاتجاه على الهاتف |
| غلاف iOS وأدوات التطوير | [[systems/Native-Release]]؛ [xtool guide](../docs/XTOOL_NATIVE_DEVELOPMENT_AR.md) | [package contract](../tests/apple-release-package.test.js)، [runtime repairs](../tests/runtime-repairs.test.js) | بناء أو توقيع أو تثبيت حزمة جديدة؛ ممنوع في النطاق الحالي |
| ذاكرة المشروع وتنظيمه | [[13-Project-Story]]، [[11-Organization-Plan]] | [memory tests](../tests/project-memory.test.js)، `memory:audit` | فهم تلقائي لكل سطر أو فحص تلقائي للخدمات الحية |

## ثغرات المعرفة التي تبقى ظاهرة

- LF-003: يلزم فحص بصري وفعلي لكل إطار على نسخة جهاز مطابقة؛ البث القديم لا يكفي.
- LF-009: العدد وتحديث المعرض وإعادة المحاولة اختُبرت بالمصدر والمعاينة؛ اكتمال كل cast خارجي وتحديث النسخة المثبتة غير مثبتين. [[sessions/2026-10-15-Gallery-Hydration-Repair]].
- LF-010/LF-011: محرر المفضلة مربوط بمالكه، ويتجدد بعد تحميل الشخصيات مع Retry. [[sessions/2026-10-15-Character-Editor-Owner]] و[[sessions/2026-10-15-Character-Editor-Hydration]]؛ لا تثبيت جديد.
- LF-012: ترجمة المحرر وقص الإجراءات مثبتان بالمصدر والمتصفح. [[sessions/2026-10-16-Character-Editor-Locale]].
- APNS-001: اختبار واحد مقبول من APNs مع تأكيد المالك للاستقبال والفتح. [[sessions/2026-10-16-Authorized-Push-Check]]؛ ليس إثباتًا لكل الأجهزة أو نشرًا لإصلاح النقل.
- تسليم APNs، أذونات الصور، VoiceOver والأداء على الهاتف ليست مغلقة باختبارات Node.
- ملفات الإصلاح SQL لا تثبت نشرها؛ لا تُشغّلها لتغيير لون حالة في هذه الصفحة.
- المصدر المحلي لا يساوي IPA ولا TestFlight؛ آخر توجيه يمنع إنشاء نسخة جديدة.

## تعريف إغلاق المشكلة

سبب مثبت، اختبار يفشل قبل الإصلاح وينجح بعده، مراجعة للأثر الجانبي، مصدر
متزامن عند الحاجة، وإيصال يحدد الأمر والنسخة وحدود الدليل. إن كان الخلل
يتعلق بالجهاز أو خدمة حية، لا تُغلق تلك الطبقة بنتيجة fixture فقط.

[[00-Home]] | [[08-Feature-Router]] | [[10-Open-Questions]] | [[12-Device-Repairs]]

- LF-013: [[sessions/2026-10-16-Friend-Rating-Rows]]؛ محاذاة الاسم والدرجة في 80 حالة متصفح، دون اعتماد ذلك كفحص VoiceOver أو تثبيت جهاز.

- LF-014: [[sessions/2026-10-16-Diary-Position-Defaults]]؛ 10 regressions وملاحظة صفحة محفوظة ومعاد تحميلها مع الحرق باللغتين في متصفح معزول. لا دليل تركيب على جهاز.

- LF-021: [[sessions/2026-10-16-List-Keyboard-Focus]]؛ تركيز التحريك/الإزالة وأسماء العناصر ومسودة الحفظ مثبتة بالمصدر ومعاينة عربية، لا باختبار VoiceOver.

- LF-022: [[sessions/2026-10-16-List-Tool-Clipping]]؛ احتواء 30 زرًا في 320/440 عربي/إنجليزي دون تقليل هدف اللمس. العيب شوهد على الجوال، لكن الإصلاح لم يُركّب عليه.

- LF-023: [[sessions/2026-10-16-Home-Continuation]]؛ اختيار checkpoint بالمعرّف وربط فعلي بالرئيسية الاجتماعية، مع فتح التفاصيل بزر أصلي ودون نسبة مصطنعة. الجهاز والخدمة مستقلان.

- LF-024: [[sessions/2026-10-16-Review-Progress-Independence]]؛ نشر التقييم لا يستدعي الإكمال ولا يغيّر حالة صريحة أو تقدمًا جزئيًا/صفرًا. التهيئة القديمة والجهاز والخدمة مستقلة.

- LF-025: [[sessions/2026-10-17-Review-Response-Owner]]؛ استجابات النشر والحذف والرد والمؤقت تتبع حساب الطلب. لا اعتماد لصلاحيات الخدمة أو إلغاء الطلبات من هذا الدليل.

- LF-026: [[sessions/2026-10-17-Review-Editor-Owner]]؛ ملكية المسودة عند الفتح وفصل أجيال المحرر وحماية أحداث النص ونتائج النشر، مع حفظ التقييم والنص في معاينة محلية. لا اعتماد للخادم أو النسخة المثبتة.

- LF-027: [[sessions/2026-10-17-Review-Image-Owner]]؛ منع إرفاق صورة متأخرة بحساب أو مسودة أخرى عند القراءة والفك وتنفيذ updater، مع بقاء الضغط وحد 10 صور. ليس اختبار رفع سحابي أو صلاحيات Photos.

- [[bugs/LF-028-Review-Only-Library]] يكمل استقلال التقييم عن المكتبة؛ اختبارات حذف وتهيئة المصدر لا تغلق مزامنة حسابين حقيقيين.

- [[bugs/LF-029-Backend-Review-Owner]]: 14 حالة معزولة لحدود backend وStorage؛ لا اتصال إنتاج أو RLS حي.

- [[bugs/LF-030-Profile-Mutation-Owner]]: 17 حالة لانتقال الحساب عبر حفظ الملف والخصوصية والتسجيل؛ لا اعتماد للجهاز أو RLS الحي.

- [[bugs/LF-031-Session-Read-Owner]]: 10 حالات مصدر لفصل قراءات الجلسات وfinally؛ لا اعتماد تسجيل دخول حقيقي أو جهاز.

- [[bugs/LF-032-Editorial-Detail-Synopsis]]: استُكملت أوصاف ثلاثة أعمال AR/EN من الناشر؛ العينة لا تغلق جودة بقية الكتالوج. [[sessions/2026-10-17-Editorial-Detail-Synopsis]]

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

- [[bugs/LF-043-Search-Alias-Refresh]]: تحديث محتوى الأسماء البديلة في الفهرس compact مع بقاء هوية الطبعة؛ [[sessions/2026-10-17-Search-Alias-Refresh]]. تصحيح الأخطاء الإملائية وفشل المزوّد ما زالا مستقلين.

- [[bugs/LF-044-Import-Request-Session]]: معاينة الاستيراد وتأكيده تخص حساب الفتح والمحاولة الأحدث؛ [[sessions/2026-10-17-Import-Request-Session]]. فشل الحفظ المحلي والخادم والجهاز مستقلون.

- [[bugs/LF-045-Import-Save-Failure]]: فشل الكتابة لا يعلن نجاح الاستيراد، مع تراجع متحقق وإعادة محاولة أو توضيح الحفظ الجزئي؛ [[sessions/2026-10-17-Import-Save-Failure]]. المزامنة والجهاز منفصلان.

- [[bugs/LF-046-Import-CSV-Records]]: قراءة CSV/TSV كسجلات كاملة، دون تحويل أسطر المراجعة لأعمال، ورفض الاقتباس الناقص؛ [[sessions/2026-10-17-Import-CSV-Records]]. فحص Cloud/الجهاز مستقل.

- [[bugs/LF-047-Source-Summary-Batch]]: أوصاف AR/EN موثقة لكتاب الفيزياء الفلكية ورواية فارس بلا وجود وكوميكس Nimona؛ [[sessions/2026-10-17-Source-Summary-Batch]]. بقيّة العينة والأغلفة والطبعات والحقوق منفصلة.

- [[bugs/LF-048-Test-Preparation-Isolation]]: اختبار إعدادات native ينفذ projection المحدود دون تجهيز المشروع أو توليد الكتالوج؛ [[sessions/2026-10-17-Test-Preparation-Isolation]]. فحص parity الفعلي باقٍ.

- [[bugs/LF-049-Travel-Fiction-Summaries]]: ثلاثة أوصاف AR/EN أخرى للرحلات والرواية والمذكرات المصورة؛ [[sessions/2026-10-17-Travel-Fiction-Summaries]]. جزء runtime المتأثر فقط حُدث مع بقاء الهوية والعدد والحقوق كحدود منفصلة.

- [[bugs/LF-050-Book-Sample-Summaries]]: أوصاف موثقة للكتب الـ18 المتبقية؛ جميع كتب العينة الـ24 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Book-Sample-Summaries]]. أدوار المساهمين والطبعات والحقوق منفصلة.

- [[bugs/LF-051-Novel-Sample-Summaries]]: أوصاف موثقة للروايات الـ18 المتبقية؛ جميع روايات العينة الـ23 لها AR/EN، و36 صفحة/لغة مفحوصة؛ [[sessions/2026-10-17-Novel-Sample-Summaries]]. حفظ هوية العمل والطبعة والتقدم، مع بقاء الحقوق والمراجعة الببليوغرافية منفصلتين.

- [[bugs/LF-052-Comic-Sample-Summaries]]: استُكملت أوصاف الكوميكس الـ21 المتبقية؛ جميع كوميكس العينة الـ24 لها AR/EN، مع 42 صفحة/لغة وفصل وصف المجلد الثاني عن العدد الثاني؛ [[sessions/2026-10-17-Comic-Sample-Summaries]]. مصدر Peanuts فهرس Open Library، لا تحقق ناشر؛ حقوق الصور والطبعات مستقلة.

- [[bugs/LF-053-Catalog-Search-Retry]]: فشل الفهرس أو جزء نتائج لا يتحول إلى «لا توجد نتائج»؛ زر retry يعيد نفس البحث والنوع، والأجزاء الناجحة تبقى محملة؛ [[sessions/2026-10-18-Catalog-Search-Retry]]. لا تصحيح إملائي أو اختبار مزود/جهاز حي ضمن هذه الدفعة.

- [[bugs/LF-054-Catalog-Search-Deadline]]: مهلة محدودة لـWorker وفهرس البحث البديل، مع إلغاء الطلب وإهمال رسائل Worker القديم؛ [[sessions/2026-10-18-Catalog-Search-Deadline]]. تعليق raw shard وتصحيح الإملاء والمزوّد والجهاز بوابات مستقلة.

- [[bugs/LF-055-Catalog-Shard-Deadline]]: جزء كتالوج صامت يحرر طابور التحميل بعد مهلة؛ retries معزولة عن callbacks القديمة، مع إبقاء تحميل الأجزاء الناجحة؛ [[sessions/2026-10-18-Catalog-Shard-Deadline]]. ليست مهلة إجمالية لكل الكتالوج أو اعتماد أداء الجهاز.

- [[bugs/LF-056-Search-Field-Lifecycle]]: كتابة البحث لا تُفقد عند تحديث النتائج، مع اتجاه النص التلقائي وزر مسح مسمّى يعيد التركيز؛ [[sessions/2026-10-18-Search-Field-Lifecycle]]. محرر المفضلة الحالي حقل مستقل؛ استكمل [[bugs/LF-057-Editor-Search-Direction]] اتجاهه.

- [[bugs/LF-057-Editor-Search-Direction]]: اتجاه بحث مفضلة الأعمال والشخصيات يتبع النص في الواجهتين؛ 8 حالات متصفح و110 اختبارات مرتبطة؛ [[sessions/2026-10-18-Editor-Search-Direction]]. لا تغيير للترتيب أو الحفظ.

- [[bugs/LF-058-Search-Typo-Suggestions]]: اقتراحات عناوين AR/EN لتعديل حرف واحد، يختارها القارئ دون دمج الطبعات؛30حالة جديدة و131مرتبطة و1949كاملة و6حالات Chrome؛ [[sessions/2026-10-18-Search-Typo-Suggestions]]. «الكل» العربي يحتاج إصلاحاً منفصلاً؛ لا اعتماد جهاز أو مزود حي.

- [[bugs/LF-059-All-Format-Search]]: فلتر All/الكل يبحث في الأنواع الثمانية بدلاً من سقوط العربية إلى Manga؛11حالة جديدة،179مرتبطة،1960كاملة و4حالات Chrome؛ [[sessions/2026-10-18-All-Format-Search]]. بداية التصفح وقيود النوع المحدد محفوظة.

- [[bugs/LF-060-Image-Source-Lifecycle]]: حماية الصور تتجدد مع الرابط وإعادة المحاولة، وتلغي callbacks القديمة والمؤقت عند نجاح/إزالة الصورة؛17حالة جديدة،117مرتبطة،1977كاملة و4حالات Chrome؛ [[sessions/2026-10-18-Image-Source-Lifecycle]]. رفع الصور والأذونات الحية مستقلان.

- [[bugs/LF-061-Review-Image-Failure]]: فشل قراءة/فتح/تجهيز صورة المراجعة يظهر AR/EN دون فقد المسودة أو الصور السابقة، مع منع callbacks المتأخرة؛23حالة جديدة،163مرتبطة،2000كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Review-Image-Failure]]. صور البروفايل والأذونات والرفع الحي مستقلة.

- [[bugs/LF-062-Profile-Image-Editor]]: صور البروفايل والحفظ مرتبطان بمالك ونسخة المحرر وأحدث اختيار؛ فشل التجهيز ظاهر ولا تسقط النتائج القديمة على مسودة/حساب جديد؛37حالة جديدة،304مرتبطة،2037كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Profile-Image-Editor]]. لا إلغاء أو اعتماد لكتابة خدمة حية.

- [[bugs/LF-063-Invalid-Image-Fallback]]: البديل المخصص التالف ينتقل مرة إلى SVG محلي مناسب للغلاف أو الصورة الشخصية؛ مهلة مستقلة وعزل callbacks وإلغاء عند الاستبدال/الإزالة، مع بقاء منتقي الأغلفة خطأً دون صورة مولّدة؛11حالة جديدة،188مرتبطة،2048كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Invalid-Image-Fallback]]. الرفع وأذونات الجهاز والخدمة مستقلان.

- [[bugs/LF-064-Image-Preparation-Deadline]]: مهلة إجمالية 30 ثانية لتجهيز صور البروفايل ومرفقات المراجعة،مع رسالة AR/EN وحماية الصورة والنص السابقين ومنع النتائج المتأخرة؛ 28 حالة جديدة،343 مرتبطة،2076 كاملة و7 حالات Chrome منها مؤقت حقيقي؛ [[sessions/2026-10-18-Image-Preparation-Deadline]]. Photos والرفع والجهاز والخدمة مستقلة.

- [[bugs/LF-065-Runtime-Cleanup]]: ملخص كتالوج2,991 بايت وتحميل فهرس المعرّفات عند الحاجة،مع إزالة كود اختصار متقاعد وتنسيقاته وتوثيق المسؤوليات؛موارد بداية الرئيسية أقل29.06% في Chrome المعزول؛15 اختبارًا جديدًا،180مرتبطة و2091كاملة؛ [[sessions/2026-10-18-Runtime-Cleanup]]. حجم التثبيت وFPS والجهاز والخدمة مستقلان.

- [[bugs/LF-066-Rating-First-Completion]]: نجاح نشر تقييم عمل غير مسجل يضيفه للمكتملة ويلتقط تقدمه مرة واحدة، مع حماية الحالة/الصفر/الإزالة السابقة. 16 حالة جديدة و2107 اختبارات كاملة ناجحة؛ الديمو ثابت على 2 مكتملة و804 فصول و161 ساعة بعد إعادة النشر والتحميل؛ [[sessions/2026-10-18-Rating-First-Completion]]. لا بناء أو اعتماد حفظ حي.


- [[sessions/2026-10-21-UIUX-Story]]: تطبيق UI/UX Pro Max على نبذة العمل: نص16px، مصدر نصي/كائن، توسعة عند تجاوز3أسطر مع ARIA و44px. نجحت2345اختبارات كاملة و12حالة متصفح AR/EN وdark/light وتكبير200%؛ بيانات المستخدم مطابقة. الجهاز وVoiceOver مستقلان.


- [[sessions/2026-10-21-Story-Source-Hidden-Humanizer]]: قرار المالك الحالي يحذف عرض مصدر النبذة من كل الأعمال، مع إبقاء النص والبيانات الفنية والتوسعة. Humanizer على رسالة المراجعات الفارغة فقط. يلغي عرض الرابط المضاف في جلسة UIUX-Story.


- [[sessions/2026-10-21-Impeccable-Reader-Filters]]: Impeccable polish لمجموعة القراء/المراجعات: اسم AR/EN وaria-pressed وخيار نشط واضح مع focus. 2345اختبارًا و32حالة تفاعل على8صفحات؛ النبذات والبيانات المحفوظة مطابقة، والمصدر غير ظاهر. لا اعتماد للجهاز.


- [[sessions/2026-10-21-Ponytail-Empty-Facts]]: تطبيق Ponytail بقاعدة CSS واحدة لإخفاء شريط بيانات العمل الفارغ وإظهاره تلقائيًا عند وصول metadata؛33اختبارًا مرتبطًا و8حالات متصفح. النبذات والبيانات الشخصية وقراءة metadata محفوظة.


- [[sessions/2026-10-21-Hallmark-Chapter-Hierarchy]]: Hallmark لتسلسل عنوان الفصل: رقم أوضح عند غياب الاسم، تحميل هادئ، والعنوان الحقيقي محفوظ، مع الاحتفاظ بالمخزن المعروف عند فشل الطلب.2348اختبارًا و16حالة متصفح وحالتاQA معزولتان؛ لا تغيير للنبذات أو المصدر أو الحفظ.


- [[sessions/2026-10-21-GitHub-Skills-Handoff]]: طلب المالك رفع مجموعة تحسينات السكيلز إلى origin/main بتاريخ21أكتوبر. فحص قبل الرفع2348اختبارًا دون إخفاق؛ المجموعة تشمل المصدر واختباراته وتوثيقه والأصول المتتبعة. لا بناء أو رفعApple. إثبات الشبكة منفصل بتطابق SHA.

[[sessions/2026-10-19-Banner-Clear]] records explicit media removal and stale-cache fixes; historical upload cause remains unproven.

[[sessions/2026-10-21-DeviceHub-Sync]]: latest main 79928a7 synchronized to the existing simulator with local banner fixes retained.

[[sessions/2026-10-21-Local-UI-Review]]: six local UI changes for owner testing; direct drag/pinch photo framing supersedes sliders. Explicitly uncommitted.

[[sessions/2026-10-21-Explore-Refinement]] supersedes the initial local review section paging/filter layout: centered type labels, on-demand independent section pages and compact filters. Uncommitted.

[[sessions/2026-10-21-Sticky-Home-Filters]]: For You/Following moved into sticky Home header above Continue reading; local review only.

[[sessions/2026-10-21-Trim-Explore]]: owner-selected smaller Explore row set; short reads retained, overlapping themed rows removed. Local review.

[[sessions/2026-10-21-Favorite-Slot-Checkmark]]: owner-selected outline/check selection replaces the large slot instruction box. Local review.

[[sessions/2026-10-21-Clean-Favorite-Controls]]: × removal on filled cards, no intro or shifting action row; search precedes mode tabs. Local review.

Favorite editor refinement: selected red ×, stable portrait nodes on slot changes, and uniform search background; see [[sessions/2026-10-21-Clean-Favorite-Controls]].

Favorite removal badge refined to a small dark corner badge with centered muted-red strokes; [[sessions/2026-10-21-Clean-Favorite-Controls]].

Unnecessary card rebuilding audit and fixes: favorite pickers, ranking/review picks, custom-list editing and community updates preserve unchanged nodes; see [[sessions/2026-10-21-Stable-Rendering]].

Favorite slot save investigation: bounded downloaded catalog cache, quota-only safe cache reclaim, and honest failed-save feedback; 82 focused checks plus save/reopen/reload in isolated demo. Device Hub storage pressure removed without changing saved favorites. [[sessions/2026-10-21-Favorite-Save-Quota]].

Home review Like stability: aligned declarative/enhanced Like and Dislike controls, immediate guarded Like updates, and retained cards across equivalent realtime responses. 549 focused checks and browser node-identity evidence; [[sessions/2026-10-21-Home-Like-Stability]].

Type-page search now connects its selected format to the existing debounced online lookup and tracks pending/error states. Golden Son by Pierce Brown verified through Novel search and work detail; 53 focused checks. [[sessions/2026-10-21-Format-Search-Online]].


2026-10-21: [[sessions/2026-10-21-Search-Audit]] repairs main All-format online lookup and isolates People/Lists from catalog listeners; 234 focused checks, browser result evidence, and five matching installed simulator assets. Live directory/provider coverage remains separate. No commit or push.

2026-10-21: Owner authorized committing/pushing accumulated local repairs; [[sessions/2026-10-21-GitHub-Sync]] records 2370 passing full-suite checks and six missing-dependency failures, plus 234/234 focused search checks. No release upload.

2026-10-24: [[sessions/2026-10-24-Motion-Atelier]] maps six local animated frame
packs to renderer/catalog/gate tests and36 public-profile geometry cases. Actual
demo apply/restore preserved media. Physical-device FPS, native release and live
cross-account visibility remain separate unverified gates.


2026-10-29 provider repair: [[sessions/2026-10-29-Jikan-Retirement]] verifies six MAL-compatible routes, stable character/work IDs, public gateway responses and seven mirrored assets. 365 focused checks pass; no native build or complete search/device certification.

2026-10-29 search performance: [[sessions/2026-10-29-Search-Performance]] covers startup, progressive provider ingestion, first-pair book search, all-adapter abortion, same-query epochs, cache no-op and multilingual normalization. Source/full2990 and local browser verified; no physical-device or peak-load certification.

2026-10-29 server evidence: [[sessions/2026-10-29-Supabase-Pro-Optimization]]; Pro/healthy project, five valid indexes, two cached chapter-review identity lookups, same ordered feed results; 23 isolated SQL assertions and 63 focused source checks passed. Billing-denied catalog requests recovered; Jikan and Apple configuration errors remain separate. No device or two-account Auth certification.

Same-day integration: the server optimization's initial Jikan failure/inference
is superseded by [[sessions/2026-10-29-Jikan-Retirement]], and its separate search
latency follow-up has source/browser evidence in [[sessions/2026-10-29-Search-Performance]].
Apple server configuration, physical-device acceptance and installed-client
release delivery remain open. Applied SQL history is preserved, not replayed.

2026-10-30 search coverage: [[sessions/2026-10-30-Search-Audit]] maps worker/fallback/index, API/cache/type/alias integrity, global/format/People render lifecycle and character picker to54new regressions and3111full checks. Real-catalog hashes retained; local browser covers8formats and AR/EN partial/retry. Googlequota, optional-provider production gates, device and broader data-quality acceptance remain open.
