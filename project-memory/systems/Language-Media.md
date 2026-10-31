---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["عربي", "إنجليزي", "ترجمة", "صور", "مشاركة", "RTL", "LTR", "media", "share"]
---
# اللغة والصور والمشاركة

[[sessions/2026-11-01-Slow-Media-Recovery]] fixes managed cover/portrait late
success after the 5.5s UI deadline. Same request recovers, stale retries cannot
paint current state.3142 tests/14 delayed-byte browser checks; provider transfer
speed and native delivery remain unverified, not implied by this repair.

[[sessions/2026-10-29-UI-Foundation-Phase-Twenty-Two]] adds opt-in managed portrait
recovery to owner rated strip/gallery. Read-only favorite-editor consumers are
unchanged. Native Retry/Open stay separate. Position native images absolutely
inside reserved art so initials remain centered; reserve gallery body width
independently of image intrinsic size.2950 tests,86 fixtures; other owners and
export media remain separate. No remote or native acceptance implied.

[[sessions/2026-10-29-UI-Foundation-Phase-Twenty-One]] adopts modern profile-list
images without consulting viewer artwork. Keep envelope previews noninteractive;
detail/candidate recovery gets44px inside the art,36px editor art gets external
Retry. Rank keyboard focus targets only its tool group. Explicit map callbacks
avoid accidental retryHost indexes. Scoped lifecycle protects detached views and
account changes.2940 tests,126 fixtures; other profile/export media remain.

[[sessions/2026-10-29-UI-Foundation-Phase-Twenty]] adopts category-board slot,
candidate and current-preview images. Custom sources win queued provider results;
data-share-src survives each managed request/retry. Do not append raw images into
old nodes. Selection and Retry are separate native actions; current owner/picker
must still match before file/save callbacks repaint.2932 tests,131 browser cases;
legacy share export and other image owners remain separate.

[[sessions/2026-10-29-UI-Foundation-Phase-Nineteen]] adds external DOM portrait
Retry and noninteractive tiny-preview mode. Legacy top-ten faces adopt it;
native Remove/Edit/Retry are siblings. Capture keyboard focus before hiding a
successful Retry, then restore to its action. Dispose only owned nodes on list
view replacement/close.2925 tests,117 browser cases; other media owners remain.

[[sessions/2026-10-29-UI-Foundation-Phase-Eighteen]] adds a DOM portrait owner
separate from React covers. Rating-page and current picker images keep original
URLs and initials until decoded, with polite AR/EN status and character-named
Retry.44px Edit and Retry remain separate. Explicit dispose releases listeners,
observer and deadline on search/replacement/close, not native image transport.
2915 tests,119 local browser cases; other character/profile/upload owners remain.

[[sessions/2026-10-29-UI-Foundation-Phase-Seventeen]] adds managed Work hero,
Review Editor mini cover and draft pictures. kind=image selects AR/EN picture
copy; default cover consumers unchanged. Hero recovery is outside decorative
aria-hidden content. Attachment44px Retry/Remove slots do not overlap the attach
action; draft order/custom sources retained.2907 tests,107 browser cases; native
image fetch coalescing/cancellation is distinct from a bounded visible deadline.

[[sessions/2026-10-29-UI-Foundation-Phase-Sixteen]] adopts Explore art/poster/
format covers and friend/review work covers, without adopting avatars or user
uploads. Separate native actions preserve source/routing; compact Retry does not
reserve title space. Outer keyboard focus is visible despite cover clipping.
Successful image cache reuse may avoid another HTTP request.2900 full tests,
54 browser cases; physical/provider acceptance and other image owners stay open.

[[sessions/2026-10-29-UI-Foundation-Phase-Fifteen]] adopts Home Continue reading
media. Decorative backdrop status is hidden with its art, but Retry background
is a separately named native control. Compact thumbnails keep work selection;
poster Open/Retry are siblings. Original art, rights-safe suppression and crops
remain.2893 full tests,40 browser cases; other large media/provider QA still open.

[[sessions/2026-10-29-UI-Foundation-Phase-Fourteen]] expands managed covers to
Library and owner/visitor work cards, not other image owners. Retry and open/edit
controls have direct labels, literal work titles and explicit book anchors.
Failed images stay hidden despite old important opacity rules; do not reuse
the legacy fixed-width lf-cover-card class in the adapter.13 new regressions,
2887 full tests and53 browser cases; production-provider availability unverified.

[[sessions/2026-10-29-UI-Foundation-Phase-Thirteen]] introduces opt-in
`LorefyCoverMedia` for Explore items and Work poster. It retains the source URL,
reserves geometry, reports missing/error honestly and retries only explicitly.
Managed images skip the legacy global guard; picker/other image owners remain.
Direct AR/EN labels and existing theme tokens;2874 source tests/43 browser cases.
Other consumers and provider/native evidence remain separate.

[[sessions/2026-10-28-UI-Foundation-Phase-Twelve]] covers long Work creators and
secondary titles plus Explore search/collection bylines. Source strings and
tooltips stay literal, even when equal to UI dictionary words. Shrinking author
text has independent direction from the language-specific arrow; detail text
stays complete, search metadata uses two text-relative lines.2859 full tests,
48 browser cases; not all secondary text, cover lifecycle or native text scaling.

[[sessions/2026-10-28-UI-Foundation-Phase-Eleven]] gives community post counters
Arabic plural forms and English singular/plural while preserving Latin visible
digits. Compact labels never replace the exact accessible total. Direct post/
thread first-render copy and isolated author metadata do not translate user prose.
Work author names and remaining review/community text are not covered by this pass.

[[sessions/2026-10-28-UI-Foundation-Phase-Ten]] keeps reading titles literal and
complete in DOM/tooltip, with automatic direction and isolated start alignment.
Two-line slots use relative text sizing; Showcase uses effective `2lh` with an
em fallback rather than fighting layered line-height rules. No artwork changes.
2833 full tests,72 browser cases cover mixed scripts/long words and2x font size,
not every text surface, browser zoom, provider availability or native Dynamic Type.

[[sessions/2026-10-28-UI-Foundation-Phase-Nine]] centralizes display-only reading
labels and empty-state meanings. Do not implement broad text replacement:
publication metadata, user prose and saved keys stay unchanged.22 new regressions,
2814 full tests and51 browser cases. Other copy/grammar and device gates remain.

[[sessions/2026-10-28-UI-Foundation-Phase-Four]] names the customization dialog
for its actual purpose rather than its preview heading; visible AR/EN Color/Hex
labels and direction-aware keyboard tabs now share the current typography.
Profile media/framing unchanged; native Photos and live-language changes inside
all already-open legacy dialogs remain separate evidence.

[[sessions/2026-10-28-UI-Foundation-Phase-Three]] localizes import chrome on first
render and maps known legacy import errors at the UI boundary. User/source
titles and unknown messages remain literal. The standalone import root now
shares glass/font tokens, not its former purple cards. Native/service import
and system text-size testing are not established by the browser fixtures.

[[sessions/2026-10-28-UI-Foundation-Phase-Two]] adds picker focus/inert,
Escape/Tab/return, owner/lifetime guards, serialized saves and provider Retry.
Strict interactive errors include Fandom gallery/info; automatic hydration
keeps verified seed fallback. Native Photos/upload, real account persistence
and VoiceOver stay open. The preview's AniList gateway CORS failure is separate.

[[sessions/2026-10-28-UI-Foundation-Phase-One]] repairs the standalone character
image picker outside `.lf-app`: semantic action ink, shared material,44px tools,
direct AR/EN labels and direction, and wrapping headings. It preserves character
names and saved images. Its presentation checks did not establish provider
retry or focus isolation; the second batch adds browser evidence for those,
not actual phone upload validation.

Selected quiet first-pick + grid output now implemented for top/ranking/list:
[[sessions/2026-10-28-Share-Composer]]. All color controls retained; no generated
character artwork shipped. Other designs and single-work/review output unchanged.

Nested list share is repaired in [[sessions/2026-10-28-Share-Composer]]: mount
inside active dialog, not inert app background; keyboard/focus restore checked.
Visual replacement remains pending selection, not shipped by the bug repair.

[[sessions/2026-10-28-Share-Composer]] replaces fixed-color image export at work,
review, ranking, top and list entry points with three editable design families.
Palette/font/text/identity controls and selected-page PNG preview/save are shared.
Source/browser verified, but native recipient-app behavior remains a separate gate.

[i18n](../../modules/lorefy-i18n.js)، [UI runtime](../../modules/lorefy-ui-runtime.js)
ومكونات React/DOM enhancement تتشارك اللغة. بعض labels تأتي من المصدر
المرسوم نفسه؛ لا تعتمد على ترجمة DOM لاحقة لمعالجة كل زر أو حالة.

## العقود

- Arabic RTL وEnglish LTR يشملان dialogs، حالات loading/errors، accessibility labels والتواريخ.
- العنوان والنص الذي كتبه المستخدم ليسا نص واجهة لترجمته تلقائيًا.
- لا تخزن تغيير اللغة كحالة تقدم قراءة، ولا تفقده بعد إعادة العرض.
- Lucide hydration مقيد بنطاقه ولا يستبدل SVG موجودًا باستمرار.
- [cover API](../../modules/lorefy-cover-api.js) و[custom artwork](../../backend/lorefy-custom-artwork.js) يميزان الأصل والمصدر المخصص والfallback.
- [native photos](../../backend/lorefy-native-photos.js) تنسيق/اتجاه صور أصلية، لا مجرد CSS crop.
- [share studio](../../modules/lorefy-share-studio.js) يحافظ على حقوق الرؤية ووسائط المشاركة؛ غياب الصورة ليس سبب اختراع مصدر.

## الفحص

[[bugs/LF-071-Artwork-Storage-Quota]] addresses the Discord cover-picker quota
toast: reclaim only regenerable downloaded cast caches, retry, or reject with
AR/EN text preserving prior artwork/account state. Six new cases,42 focused,
2183 full passing; [[sessions/2026-10-19-Discord-Artwork-Quota]]. Actual device
storage composition and native permission/upload evidence remain separate.

[[sessions/2026-10-16-Statistics-Locale]] يثبت ترجمة الإحصاءات في أول render
مع اتجاه وأرقام اللغة الحالية، دون تمرير النصوص المخصصة إلى ترجمة DOM.

[followers localization](../../tests/followers-localization.test.js)،
[work detail language](../../tests/work-detail-language.test.js)،
[reading diary language](../../tests/reading-diary-language.test.js)،
[icon hydration](../../tests/icon-hydration-stability.test.js)،
[image resilience](../../tests/image-resilience.test.js)،
[custom artwork persistence](../../tests/custom-artwork-persistence.test.js)،
[native photo format](../../tests/native-photo-format.test.js)،
[character share media](../../tests/character-share-media.test.js).

اختبارات الملفات/fixtures لا تغلق فحوص الصور والأذونات على iPhone. راجع
[[systems/Native-Release]]، ولا تنسخ صور المستخدمين إلى خزنة المعرفة.

[[systems/Profiles-Lists]] | [[systems/Explore-Works]] |
[[systems/Community-Notifications]] | [[systems/Appearance-Bundles]]

- [[bugs/LF-060-Image-Source-Lifecycle]]: حماية الصور تتجدد مع الرابط وإعادة المحاولة، وتلغي callbacks القديمة والمؤقت عند نجاح/إزالة الصورة؛17حالة جديدة،117مرتبطة،1977كاملة و4حالات Chrome؛ [[sessions/2026-10-18-Image-Source-Lifecycle]]. رفع الصور والأذونات الحية مستقلان.

- [[bugs/LF-061-Review-Image-Failure]]: فشل قراءة/فتح/تجهيز صورة المراجعة يظهر AR/EN دون فقد المسودة أو الصور السابقة، مع منع callbacks المتأخرة؛23حالة جديدة،163مرتبطة،2000كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Review-Image-Failure]]. صور البروفايل والأذونات والرفع الحي مستقلة.

- [[bugs/LF-062-Profile-Image-Editor]]: صور البروفايل والحفظ مرتبطان بمالك ونسخة المحرر وأحدث اختيار؛ فشل التجهيز ظاهر ولا تسقط النتائج القديمة على مسودة/حساب جديد؛37حالة جديدة،304مرتبطة،2037كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Profile-Image-Editor]]. لا إلغاء أو اعتماد لكتابة خدمة حية.

- [[bugs/LF-063-Invalid-Image-Fallback]]: البديل المخصص التالف ينتقل مرة إلى SVG محلي مناسب للغلاف أو الصورة الشخصية؛ مهلة مستقلة وعزل callbacks وإلغاء عند الاستبدال/الإزالة، مع بقاء منتقي الأغلفة خطأً دون صورة مولّدة؛11حالة جديدة،188مرتبطة،2048كاملة و5حالات Chrome؛ [[sessions/2026-10-18-Invalid-Image-Fallback]]. الرفع وأذونات الجهاز والخدمة مستقلان.

- [[bugs/LF-064-Image-Preparation-Deadline]]: مهلة إجمالية 30 ثانية لتجهيز صور البروفايل ومرفقات المراجعة،مع رسالة AR/EN وحماية الصورة والنص السابقين ومنع النتائج المتأخرة؛ 28 حالة جديدة،343 مرتبطة،2076 كاملة و7 حالات Chrome منها مؤقت حقيقي؛ [[sessions/2026-10-18-Image-Preparation-Deadline]]. Photos والرفع والجهاز والخدمة مستقلة.
