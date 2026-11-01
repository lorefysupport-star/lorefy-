---
kind: project-narrative
status: source-reviewed
date: 2026-10-15
aliases: ["رواية التطبيق", "قصة Lorefy", "المسار الكامل", "project story"]
---
# رواية Lorefy من البداية إلى الحالة الحالية

[[sessions/2026-11-02-Explore-Interactions]] E-002 prevents stale format pages
blocking or altering a new browse context and preserves automatic pagination.
3293 tests and192 final browser checks pass after both Explore repairs; original
design and catalog contracts remain. Live provider/native acceptance is separate.

[[sessions/2026-11-02-Explore-Interactions]] starts the requested Explore audit:
E-001 preserves the focused work while a collection loads or fails.3286 tests
and162 browser checks cover core Explore controls without changing its design.
Format pagination was subsequently repaired in E-002; native and live-provider
checks remain open.

[[sessions/2026-11-02-Profile-Interactions]] P-003 repairs the unhandled visitor
dialog boundary without redesigning the page.3283 tests and276 new browser
checks verify keyboard focus, background isolation, retry and navigation across
all3 layouts. Native/real-account and every-pack long-session gates remain open.

[[sessions/2026-11-02-Profile-Interactions]] P-002 repairs the clipped Reader
empty-favorites prompt without changing filled books or frames.3278 tests and
18 additional browser cases pass; overall profile pass154 browser cases.

[[sessions/2026-11-02-Profile-Interactions]] starts the full-profile audit with
nine reproduced follow/connections races repaired.3276 tests,16 demo interaction
and120 layout/frame checks. The empty prompt was subsequently repaired in P-002;
native QA remains open.

Chapter-request follow-up in [[sessions/2026-11-01-Image-Delivery]] removes
duplicated pending metadata requests on row expansion. Same browser gesture
4 to1 requests;3267 tests and four real-provider browser contexts verified.

[[sessions/2026-11-01-Image-Delivery]] follows real image-delivery failures:
local gateway TLS trust and the removed chapter-poster selector repaired.
Eight format samples and ten distinct real chapter images decode;3262 tests.
External latency and device coverage remain independent; no native build.

[[sessions/2026-11-01-Smooth-Runtime]] S-004 follows with shared feed layout
avoidance in empty-status/tail-only updates. Existing post/review anchors and
reaction races retained;120 actual-browser fixture checks. Not a whole-app SLA.

[[sessions/2026-11-01-Smooth-Runtime]] S-003 removes the local preview's
review/completion no-op render loop. Same4x scenario Explore calls128 to3;
fixture isolation, owner edits and3250 tests verified. Not a live-app speed claim.

[[sessions/2026-11-01-Smooth-Runtime]] starts a measured performance pass with
bounded pure cover-URL reuse, unchanged artwork/routing/rights and no extra fetch.
3240 source tests/28 local browser checks; device/network timing remains separate.
S-002 follows with batched, job-scoped instant scroll restoration and saved-target
preservation during quick navigation; existing manual scroll/motion remains.

[[sessions/2026-11-01-Profile-Material-Continuity]] fixes the owner's shelf-theme
report at its shared CSS source: transparent unframed content over the page
gradient, preserving wood/books and all3 layouts without per-color patches.

[[sessions/2026-11-01-Character-Studio]] follows the favorite-type repair with
single-field character/work discovery, next-empty ranking, consistent rated
surfaces and image editing without losing scores/slots. Owner-only local UI;
existing profile layouts, artwork storage and publication contracts retained.

[[sessions/2026-11-01-Reading-Favorite-Type]] stops unread favorite/wishlist and
score weighting from choosing the owner format. Reading evidence counts each
work once; AR/EN across all3 layouts checked locally, no new native build.

[[sessions/2026-11-01-Completed-Empty-Progress]] repairs the Shadow Slave report:
publisher baseline plus saved all-zero completion/review recovery on metadata
arrival. Positive snapshots stay frozen, counted once.3225 source tests/48
actual-app AR/EN demo checks; no device/cloud certification or native build.

Community C-006..008 continuation in [[sessions/2026-11-01-Community-Timeline]]:
loaded-window/scroll safety, small targeted refresh and old-read/local-reaction
ordering verified with3219 tests/120 final browser checks. No new native build.

Community C-007 in [[sessions/2026-11-01-Community-Timeline]] reduces known-post
reactions to targeted metadata reads with loaded-window/anchor safety.3216 tests/
100 local browser checks; no native build or production query benchmark.

Community C-006 continuation in [[sessions/2026-11-01-Community-Timeline]]:
3209 tests/68 browser checks verify retained loaded pages and scroll anchors,
with deletion/edit revalidation. Native/network performance remains separate.

Community C-005 completes this source pass with3199 tests and68 updated Rails
browser checks: irrelevant author events no longer reload friends. See
[[sessions/2026-11-01-Community-Timeline]] for all five repairs and acceptance gaps.

Community C-001..004 source/browser pass verified in
[[sessions/2026-11-01-Community-Timeline]]:3198 tests/194 local browser checks.
Realtime routing/catch-up, stable friend loading, early post rendering and review
reaction/cache consistency repaired; no new native build or production mutation.

Community C-003: post reads/rendering and relevant invalidation lifecycle repaired
in [[sessions/2026-11-01-Community-Timeline]],3190 tests/20 browser checks. No
design replacement, native build, production event or server deployment.

Community C-002: friend-rating lifecycle and direct relevant realtime refresh
are repaired in [[sessions/2026-11-01-Community-Timeline]],3186 tests/64 mounted
React checks. Existing rows stay visible on refresh/failure; ownership remains.

2026-11-01 [[sessions/2026-11-01-Community-Timeline]] starts the owner-prioritized
community pass: review realtime routing/catch-up verified with3180 tests and18
local browser checks. Friend/post/reaction follow-ups remain in this same pass.

2026-11-01 [[sessions/2026-11-01-Logical-Diary-Write-Retry]] closes L-006:
failed history writes preserve the old checkpoint for retry, including reload
recovery.3175 tests/52 browser checks; not general storage/cloud certification.

2026-11-01 [[sessions/2026-11-01-Logical-Diary-Units]] closes L-005: the diary
records pages/volumes instead of silently discarding them.3172 tests/60 browser
checks; unchanged status/metrics and no native build or production mutation.

2026-11-01 [[sessions/2026-11-01-Logical-Profile-Zero-Count]] closes L-004:
known zero remains authoritative over stale rows.3165 tests/42 browser checks
cover all layouts; no data mutation or native/service release.

2026-11-01 [[sessions/2026-11-01-Logical-Recommendation-Roundtrip]] closes third
scoped logic finding: no unintended recommendation/score change on text edit or
deselection, canonical unknown isn't a dislike.3163 tests/52 actual-app checks.

2026-11-01 [[sessions/2026-11-01-Logical-Public-Review-Projection]] fixes L-002:
visitor review mapping no longer invents zero or omits dislike state.3158 tests/
16 browser contract checks, no service write or native release.

2026-11-01 [[sessions/2026-11-01-Logical-Friend-Ratings]] installs/verifies the
requested logic-audit guidance and fixes first reproduced product contradiction:
friend zero/latest-state semantics.3156 tests/40 UI checks; remaining audit open.

2026-11-01 [[sessions/2026-11-01-Identity-Text-Work]] follows the three measured
repairs with bounded short-string reuse.3153 tests/8 browser checks, unchanged
identity output. Aggregate performance report keeps startup/device gates open.

2026-11-01 [[sessions/2026-11-01-Diary-Idle-Work]] removes unchanged library JSON
work from diary maintenance;3149 tests/16 browser checks plus12 slowed-CPU search
checks. Real transitions and owner guards remain. Startup still needs profiling.

2026-11-01 [[sessions/2026-11-01-Catalog-Classification-Work]] removes a duplicate
classification pass; real fixture results unchanged, median CPU45.56 to27.36ms.
3145 source tests/44 local browser checks; no service/native changes.

2026-11-01 [[sessions/2026-11-01-Slow-Media-Recovery]] starts measured performance
repairs: valid artwork arriving after the UI deadline is no longer permanently
hidden.3142 tests/14 browser checks; no extra downloads or native release.

2026-11-01 [[sessions/2026-11-01-Home-Reading-Hierarchy]] follows reaction
repair278260a: stable Home chrome, labeled in-flow reading choices, correct Arabic
numeric order, no ongoing false0% and real saved-unit percentages.3137 source
tests/288 browser checks; user data, artwork and native release unchanged.

2026-11-01 [[sessions/2026-11-01-Home-Reaction-Feedback]] repairs Home action
alignment and pending reaction feedback with3122 source tests/192 local browser
checks. User requested Pro Max/Apple guidance and immediate verified source pushes;
no native build or service mutation. Continue reading/header acceptance follows.

2026-10-30 [[sessions/2026-10-30-Import-Written-Reviews]] repairs discarded
Goodreads/CSV review text. Safe preview/opt-out, missing-text recovery, private
unrated records and repeat import verified;3034 source tests/168 UI fixtures.
No provider-published-review fetch, public tweet, new server job or native build.

2026-10-30 [[sessions/2026-10-30-Inbox-Receipt-Scope]] follows the pushed
reconnect repair `0df8087`: queued read acknowledgments are discarded before
dispatch when account/logout/backend changes. No production data mutation or
new native build. Remaining Pro adoption stages and device acceptance stay open.

2026-10-30 owner requests each verified source repair pushed immediately.
Private signing repair pushed `b322afd`. [[sessions/2026-10-30-Inbox-Reconnect]]
adds UPDATE/read synchronization, reconnect/native resume/online catch-up,
coalesced refresh and monotonic duplicate read state.3014 tests/84 UI fixtures;
no build or production configuration changed. Installed-device acceptance open.

2026-10-30: [[sessions/2026-10-30-Supabase-Pro-Adoption]] verifies Pro/Spend Cap,
usage and actual backups read-only. Private image signing coalesced/reused in
bounded account-scoped memory locally; no production write, GitHub or build.
The adoption report separates automatic plan benefits from pending code/service
work and paid add-ons. Prior29 October query optimization is not reapplied.

2026-10-29 source checkpoint authorized for GitHub after local-only development.
[[sessions/2026-10-29-Cover-Edition-Choice]] completes bounded F13: metadata
retained without extra provider calls; preview/save/reload/restore keep exact
work identity and reading state.108 local browser checks;2973 source tests.
`docs/SOURCE_CHECKPOINT_2026-10-29.md` describes included work and remaining
acceptance. No new native build, Apple upload or production-service write.

2026-10-29 F12 bounded Library/favorites acceptance:
[[sessions/2026-10-29-Library-Shelf-Acceptance]]. Actual count matrix preserved
wood,7/3 presentation and uncapped Library. Reader poster captions squeezed
spines/duplicated Showcase; scope fixed. Decorative spine text intercepted native
Open; pointer routing fixed.288 geometry cases,17 action cases,2966 source tests.
Saved reading/favorite strings unchanged. Next F13; iPhone remains independent.

2026-10-29 F08 bounded journey delivered:
[[sessions/2026-10-29-Search-Edition-Groups]]. Conservative search-only edition
groups and frozen chooser preserve exact IDs, query/filter/focus and late-result
order. Google response metadata retained, no extra lookup or identity merge.
2963 tests,99 controlled browser cases; real services/iPhone remain separate.
[[19-UI-Execution-Control]] now points to F12 Library acceptance, not another
image-consumer batch. F07 stays deferred as one task. Local only.

2026-10-29 execution reset after the owner's repetition concern:
[[19-UI-Execution-Control]] consolidates phases13–22 as partial F07, not ten
independent product fixes. Original98-row backlog is a pre-execution snapshot.
Current18-finding/27-section status and acceptance gaps are recorded without a
completion percentage. Next bounded UI task is F08 edition grouping, preserving
explicit IDs and stored data. No application code or release changed in this review.

2026-10-29 rated-character profile strip/gallery:
[[sessions/2026-10-29-UI-Foundation-Phase-Twenty-Two]]. Scoped managed image
recovery and independent native Open/Retry. Nested dialogs pause rather than
abandon the gallery; account mismatch still closes it. Initials/gallery-width
regressions repaired.10 new tests,2950 full tests,86 browser cases;24 unchanged
dimensions across6 configurations. Favorite/public portraits remain. Local only.

2026-10-29 modern profile Lists media:
[[sessions/2026-10-29-UI-Foundation-Phase-Twenty-One]]. Envelopes, detail, editor
and candidates adopt scoped recovery. Independent native Retry/Add, stable
draft rows and cleanup on Overview/account/page changes.8 new tests,2940 full
tests,126 fixture browser cases;42 dimensions preserved across12 configurations.
Other profile media remain. Local only; no real save, GitHub or native build.

2026-10-29 category character-board media:
[[sessions/2026-10-29-UI-Foundation-Phase-Twenty]]. Managed slot/candidate/current
preview, original share metadata, custom-image precedence and originating picker
guards. Narrow-track overlap/action crowding fixed.7 new tests,2932 full tests,
131 browser cases,6 geometry configurations. Public/profile media remain. Local
only; no real save, GitHub, service change or native build.

2026-10-29 top-ten character lists:
[[sessions/2026-10-29-UI-Foundation-Phase-Nineteen]]. Managed list faces and
separate native Remove/Edit/Retry; hub preview has no nested control. Late cast
cannot repaint a closed/replaced editor.10 new tests,2925 full tests,117 browser
cases and6 geometry configurations. Existing category boards/public profile image
owners remain. No real save, GitHub, native build or service change.

2026-10-29 character rating-page portraits:
[[sessions/2026-10-29-UI-Foundation-Phase-Eighteen]]. Separate DOM media owner
for rating-page portraits/current picker preview, with deadline, explicit Retry,
44px Edit and cleanup on search/close. No React roots inside legacy DOM.8 new
tests,2915 full tests,119 browser cases,6 geometry configurations. Other character
image owners/profile media remain. Local only; no save, GitHub, service or build.

2026-10-29 Work hero and Review Editor media:
[[sessions/2026-10-29-UI-Foundation-Phase-Seventeen]]. Managed decorative hero,
mini cover and draft pictures; separate recovery/removal controls and explicit
image copy. Original artwork/draft callbacks preserved.7 new tests,2907 full
tests,107 browser cases and6 geometry configurations. No GitHub/service/build;
profile, character and published attachments still have separate image owners.

2026-10-29 Explore art and review-cover adoption:
[[sessions/2026-10-29-UI-Foundation-Phase-Sixteen]]. Featured art/poster, format
cards, friend rating covers and shared review work attachments adopt managed
recovery. Native Open/Retry stay independent; missing media keeps identity.
7 new tests,2900 full tests,54 browser cases and12 geometry comparisons. Work
hero and other image owners remain; local only, no GitHub, service write or build.

2026-10-29 Home Continue reading media adoption:
[[sessions/2026-10-29-UI-Foundation-Phase-Fifteen]]. Poster/background explicit
recovery, selectable failed thumbnails and original source/artwork binding.
6 new tests,2893 full tests,14 Home cases plus26 Library/profile regressions;
8 unchanged geometry comparisons. Home feed covers and other large artwork
remain separate. Local only, no account save, GitHub, service write or build.

2026-10-29 Library and profile cover adoption:
[[sessions/2026-10-29-UI-Foundation-Phase-Fourteen]]. Main Library, all owner
layouts, Reader Currently reading and visitor work/library cards share managed
states. Missing covers retain their rank/title/slot; Open/Edit/Retry are separate
controls and bypass legacy favorite capture.13 new tests,2887 full tests,
53 browser cases and26 geometry comparisons. No saved-cover or service write;
Home/other media and physical verification remain open. Local only, no build.

2026-10-29 managed cover states, first F07 consumers:
[[sessions/2026-10-29-UI-Foundation-Phase-Thirteen]]. Explore item covers and
Work poster retain original sources with stable loading/ready/error/missing
surfaces and explicit single-flight Retry. No generated failure replacement.
15 new tests,2874 full suite,43 browser cases. Legacy Library/Profile/Home media
and live providers remain separate; no saved cover change, GitHub or build.

2026-10-28 work/search creator typography:
[[sessions/2026-10-28-UI-Foundation-Phase-Twelve]]. Bounded44px author action,
full secondary detail titles, automatic direction and literal-source tooltips.
Search bylines use two text-relative lines and accessible title-plus-author names.
14 new tests,2859 full suite,48 browser cases. No artwork/ranking/storage change,
GitHub or build. Cover loading/failure presentation remains next.

2026-10-28 community post counter/copy pass:
[[sessions/2026-10-28-UI-Foundation-Phase-Eleven]]. Direct AR/EN post/thread
labels, compact visible counts with exact accessible totals/plural forms and
isolated author/number text. Reused feed nodes and exclusive reactions preserved.
12 new tests,2845 full tests,56 local browser cases. No real account mutation,
GitHub or build; work-author and other community/review text remain separate.

2026-10-28 reading-title composition:
[[sessions/2026-10-28-UI-Foundation-Phase-Ten]]. Full literal titles with automatic
direction and stable two-line slots in Home, Library and three Profile layouts,
including fixture visitor libraries. Flexible Showcase captions follow effective
line height and update when source titles change.19 new regressions,2833 full
tests,72 browser cases. Storage/artwork/metrics unchanged; no GitHub or build.

2026-10-28 reading-state vocabulary:
[[sessions/2026-10-28-UI-Foundation-Phase-Nine]]. Shared display-only AR/EN
labels/empty messages cover Library, three Profile layouts, badges/work status,
Import chips and fixture visitor library. Stored states and chapter/hour logic
unchanged. Profile reading covers are named keyboard buttons.22 new regressions,
2814 full tests,51 browser cases. No live import/account change, GitHub or build.

2026-10-28 legal/support presentation:
[[sessions/2026-10-28-UI-Foundation-Phase-Eight]]. Privacy, Terms, Support and
Community Guidelines read app colors with glass navigation,16px body,44px Back
and accessible section links. Exact Arabic articles/dates/contact targets are
hash-locked unchanged.19 new regressions,2792 full tests,65 browser cases.
No legal translation/certification, contact, deployment, GitHub or native build.

2026-10-28 review-report workflow:
[[sessions/2026-10-28-UI-Foundation-Phase-Seven]]. Direct AR/EN glass form with
single-flight report/mute/block, retained drafts and safe inline recovery.
Device-save vs remote receipt wording is explicit. Core receipt writes reject
stale owner/client/generation and merge concurrent reports without lost records.
21 new tests,2773 full tests and20 browser checks; no actual moderation action,
server change, GitHub or native build. Live delivery/hardware remain separate.

2026-10-28 correction/safety tools:
[[sessions/2026-10-28-UI-Foundation-Phase-Six]]. Sequential correction center/
editor, Safety and Missing work drafts share opted-in Product Tools chrome and
direct AR/EN. Honest device-only correction/draft copy, inline validation and
recovery, explicit named Unblock/Unmute with safe pending focus.22 new tests,
2752 full tests and56 local browser cases, including Data regression. No real
correction/draft save, unblock, export or production action ran in browser QA;
failure paths used isolated source tests or a fixture-only rejected service.

2026-10-28 Data/privacy UI: [[sessions/2026-10-28-UI-Foundation-Phase-Five]].
Scoped shared glass, direct AR/EN, wrapping list names and visible visibility
labels; no misleading private-default promise. Product child dialogs now isolate
their Settings parent and release on replacement/removal.13 new source tests,
2730 full tests and20 local browser cases. No actual data export/privacy/account
action, GitHub, native build or service change. See [[systems/Privacy-Data]].

2026-10-28 Settings/Customize consistency:
[[sessions/2026-10-28-UI-Foundation-Phase-Four]]. Shared scoped glass and readable
controls; correct dialog naming, linked keyboard tabs, inline color validation
and focus retention when Apply becomes disabled.2717 source tests,18 local
browser cases. Existing preferences/persistence contracts retained. No real
account actions, GitHub push, native build or production changes.

2026-10-28 import UI batch: [[sessions/2026-10-28-UI-Foundation-Phase-Three]].
Existing source choices now share semantic glass/font/field/action rules,
unframed bands, visible labels and announced recovery with retained drafts.
AR/EN first render,21 new regressions,2705 full tests and20 browser cases.
Parsers, saved status values and confirmation/rollback contracts retained.
Local only; real device/live import and the remaining UI plan are still open.

2026-10-28 UI execution continues:
[[sessions/2026-10-28-UI-Foundation-Phase-Two]] verifies character image-picker
focus/inert/Escape, guarded owner/lifetime, serialized saves and provider Retry
with20-second UI deadline.2684 source tests,15 browser lifecycle cases plus2
fixture-provider checks. Device upload/account persistence and other planned
windows remain separate. Local only, no GitHub push, build or service writes.

2026-10-28 UI plan execution begins:
[[sessions/2026-10-28-UI-Foundation-Phase-One]]. The first batch repairs the
standalone character image picker's material/contrast/localization and removes
profile reading-filter leakage in all three layouts.30 local browser cases;
remaining sheets, device upload/focus and the broader redesign stay open.
Local source only, no GitHub push, build or service change.

2026-10-28 selection applied: [[sessions/2026-10-28-Share-Composer]] replaces the
top/ranking/list Spotlight podium with the approved quiet first-pick row and
nine equal tiles. App/manual colors preserved,2657 tests,36 theme/language/format
cases; paired visual QA passed. Other designs/work-review output unchanged.

2026-10-28 follow-up: [[sessions/2026-10-28-Share-Composer]] records a reproduced
nested-list export failure, repaired modal mounting and keyboard isolation.
2654 tests and six nested browser cases pass. New quieter image designs are
proposals awaiting selection; none applied. Local only, native share unverified.

2026-10-28 editable export: [[sessions/2026-10-28-Share-Composer]]. Work/review,
character rankings, top boards and lists share three selectable image designs,
app/custom colors and three formats. Large lists retain all items across pages;
preview bytes equal the saved PNG.2653 tests,96 browser cases, local only.
Actual iPhone/recipient-app sharing and content-rights gates remain separate.

2026-10-28 local-only authorization: [[sessions/2026-10-28-Local-Work-Dislike]].
Explicit work Dislike is0, separate from unrated/null and review reactions.
Detail exact-count reader and Retry, composer/restoration, Home and share-zero
handling prepared locally. No production/schema changes, build or Git push;
real authenticated visibility and publication remain separate service gates.

2026-10-27 functional priority: [[sessions/2026-10-27-Durable-Inbox-Review-Credit]].
Owner prioritizes in-app delivery, not mandatory OS permission. Owner-scoped
durable inbox/read retries and independent review-earned chapter/hour credit
are source/browser verified;2620 tests pass. No service writes/release/push.
Real two-account delivery, public credit projection and remaining import,
work-dislike and character-photo requests are explicitly open.

2026-10-27 sequential follow-up: [[sessions/2026-10-27-Home-Library-Profile-Refinement]].
Home feed/progress, plain-background Library and all three original profile
layouts received scoped refinements; whole-Home/Library pull refresh is wired.
2610 tests,96 presentation and24 frame-motion cases, plus interactions and an
11-book Library at three widths. Explore unchanged; owner/device acceptance open.

2026-10-27 approval decision: [[sessions/2026-10-27-Home-Approved-Reference]].
Owner approves Explore, rejects the other presentations. Home is revised first
in its own layer,24 browser cases; Library/profile remain pending separate work.

2026-10-27 material follow-up: [[sessions/2026-10-27-Glass-Depth-Typography]]
records the owner's flat-glass/text objection. Shared material and contrast
tokens replace90% control opacity; existing Arabic font and readable captions
are coordinated.112 fresh browser cases and25 sampled pixel/contrast cases.

2026-10-27 follow-up: [[sessions/2026-10-27-Ready-Themes-Hero-Bounds]] records
owner screenshots disproving ready-made Pink consistency. Light/Pink now join
the custom theme bridge; long Explore titles reserve the actual poster width.
112 fresh browser cases; local only, no release/backend changes.

2026-10-27: [[sessions/2026-10-27-Profile-Custom-Glass]] supersedes the Normal-only
scope below: shared original three-layout Apple details and custom glass colors
across cinematic screens/sheets.2587 tests,54 profile and16 route cases; local
only. Owner visual approval and physical-device/live-service gates remain open.

[[sessions/2026-10-26-Normal-Apple-Details]] supersedes the rejected profile
concept direction: original layouts retained, Normal typography/control details
polished first. Images, section order, frames and saved data remain.2580 source
tests pass; Panoramic/Reader styling is unchanged and queued for separate passes.
Local only, not native/device or production-service certification.

[[sessions/2026-10-26-Work-Studio]] responds to the owner's follow-up screenshots
with actual composition/workflow changes, not another color pass: status cards,
three review views, portrait gallery, cover preview/apply and glass tool palette.
2573 source tests pass. Existing storage/account callbacks remain authoritative;
local AR/EN checks are not installed-device or production-service certification.

[[sessions/2026-10-26-Work-Cinema]] handles the post composer first, then the work
and connected editors in the selected glass identity.44 local bilingual viewport
checks passed; genuine callbacks and original artwork remain. Escape and the
book/chapter eligibility boundary were repaired. No push/build/service change.

[[sessions/2026-10-26-Explore-Types-Search]] brings Types and Search into the
approved identity and improves relevance, filters, paging and failure recovery.
Search opens with real suggestions; explicit history is private session-only.
No public-list search or production-service recovery is claimed. Local only.

[[sessions/2026-10-26-Explore-Immersive-Reference]] replaces the separated hero
with the owner's exact selected composition: top-to-bottom artwork, glass
controls, a separate cover and Add, and three recommended previews.2541 source
tests pass. Real catalog media, recommendation ownership and safe areas remain;
no push, build or production changes.

[[sessions/2026-10-26-Explore-Cinema]] removes the rejected automatic Library
background and applies the approved dark/glass identity to Explore. Search and
sheet layering fixes are included.2537 source tests,30 Explore and24 Library
browser cases pass locally. No push/build or production service change.

[[sessions/2026-10-26-Library-Cinema]] adds the next approved dark/glass section
after Home. Owner-approved alternative Playwright completed24 Library cases and
the pending Home/composer visual pass. Final2531 source tests pass. No push/build.

[[sessions/2026-10-26-Open-Catalog]] expands local unified catalog search with
four bibliographic sources, scoped identity/attribution and honest missing-work
drafts. No push, native build or production deployment. Preview server: 8796.

[[sessions/2026-10-25-Frame-Layout-Unity]] responds to rejected actual-profile
screenshots after the store redesign. Shared header/side geometry, real artwork
anchors, consistent portrait sizing and readable gutters cover51 old/new frames.
306 public and87 actual-demo checks, plus9 long-name cases; no push or build.

[[sessions/2026-10-25-Decoration-Store]] replaces the mixed shop with a searchable
catalog, saved/owned views and live component previews.29 local offers cover both
new six-pack batches and updated classics. Demo application preserved original
profile media and was restored. No push/build or production enablement.

[[sessions/2026-10-25-Balanced-Frame-Ribbons]] addresses the rejected thin upper
line. The source texture now fills its ribbon band, with a modestly larger
ornament and clear controls. A subsequent corner repair matches the animated
side endpoints, tangents and separate textures.234 cases and2484 tests; no push/build.

[[sessions/2026-10-25-Compact-Frame-Headers]] records the owner's correction:
smaller crests above the banner, no crossing rail, and visible side deformation.
234 final layout cases and2479 tests pass locally; no push or native build.

[[sessions/2026-10-25-All-Frame-Restoration]] extends the repaired motion approach
to the existing39-frame catalog. Preserved IDs and source art, connected skins,
directional text clearance and lazy rigs;306 layout cases and2475 source tests.
The source remains local; no build, push or live-service change.

[[sessions/2026-10-25-Elven-Frame-Repairs]] addresses the owner's rejected elf
page/PFP visuals: continuous material borders, connected PFP skin and accurate
portrait silhouette.36 local layout cases pass; no push or binary build.

[[sessions/2026-10-25-Elven-Local-Motion]] completes the selected six local elf
renderers without a paid video service. Articulated parts, three-layout gallery,
36-case matrix and2466 passing tests; no push, native build or production rollout.

[[sessions/2026-10-25-Elven-Concepts]] adds twelve initial elf concepts and records
the owner's six selected ear/woodland designs. Local three-ear twitch study and
motion references verified; forest/page animation and app adoption still pending.
New motion skills installed; nothing pushed or built.

[[sessions/2026-10-25-PFP-Articulated-Motion]] adds independent PFP action layers
instead of whole-image wobble while retaining approved page borders. Water/spray,
gears, petals, panels and wing articulation verified locally;2461 tests pass.

[[sessions/2026-10-24-Atelier-Perimeter-Waves]] replaces stretched Atelier side
rails/footer with connected illustrated animated material, including rounded
corners. Six-pack raster-motion proof and36 geometry cases;2457 source tests pass.

[[sessions/2026-10-24-Atelier-Header-Waves]] replaces Atelier's thin upper line
with six material-specific complete animated ribbons and removes the cropped top.
Local36-case geometry checks pass; no GitHub push, native build or service change.

[[sessions/2026-10-24-Banner-Repairs]] fixes decoration clipping, conflicting
focal position, editor/output crop mismatch and tiny small-phone crests. Local
owner/public browser matrices and2449 tests pass; device/service remain separate.

[[sessions/2026-10-24-Profile-Header-Extent]] extends the original banner through
the identity in all three layouts. Owner/public-renderer local QA and 2443 tests
pass; physical-device and deployed-service verification remain separate.

[[sessions/2026-10-24-Wooden-Shelf]] updates favorites to Showcase 3 / Bookshelf 7,
with realistic wooden ends/supports, no lost saved choices and local-only verification.

[[sessions/2026-10-24-Book-Showcase]] adds the ranked book view to favorites
and library while preserving old choices. Local verification and live service QA are separate.

[[sessions/2026-10-23-Reader-Layout]] adds the selected Profile design as a
third saved layout (Reader), alongside Normal and Panoramic. Local only;
the public artwork whitelist migration is prepared but not deployed.

[[sessions/2026-10-21-Private-TestFlight-Candidate]] يوثق طلب بيلد خاص جديد
من 3894356، و2411 اختبارًا قبل التحضير وبعده. وصل بناء36 إلى Apple وأكمل المعالجة
بحالة Missing Compliance، مع0 مجموعات و0 مختبرين. بقي إقرار التشفير معلّقًا؛
لا تغيير لأعضاء المجموعات أو إقرار الحقوق والخصوصية ولا تفعيل للاختبار.

[[sessions/2026-10-21-Chat-Latest-Preview]] يوثق جلب 3894356 في نسخة هذه
المحادثة، وحفظ الفهارس المولدة القديمة للاسترجاع وتشغيل المعاينة دون بيلد.

[[sessions/2026-10-20-Publisher-Index]] يضيف29نبذة منصفحات الناشر ويكمل
58خانة فيفهرسه،دون تغييرالمحفوظ؛2341اختبارًا و8حالات متصفح ناجحة.
نقص النبذ العربية1190باقٍ،مع قائمة1206سجلات لنواقصحقول متداخلة؛كلالعملمحلي.

[[sessions/2026-10-20-Carousel-Publisher]] يضيف إيقاف/تشغيل الغلاف المميز
وثلاث نبذ موثقة منالناشر دونتغييرIDs أوتقدم القارئ؛2336اختبارًا وست حالات
متصفح ناجحة. بقيةبيانات المكتبة والجهاز والخدمة نطاقمستقل؛كل التغييرمحلي.

[[sessions/2026-10-20-Remaining-Skills]] يكمل محليًا: تصفير خطأ بحث الشخصيات
عند تبديل الوضع وإرشاداتAR/EN مناسبة؛2326 اختبارًا وست حالات متصفح ناجحة.
دراسة التصميم والبيانات وIPA خارج التطبيق،ولاpush أو بناء جديد.

[[sessions/2026-10-20-Skills-Application]] يضيف استعادة الكاش المعطوب وتنقل
لوحة المفاتيح بمحرر الشخصيات في نسخة محلية معزولة؛9 حالات جديدة،2324 ناجحة
وست حالات متصفح AR/EN. الإصلاحات محلية، وفحص الجهاز والخدمة مستقل.

[[bugs/LF-084-Character-Search-Coalescing]] يشارك طلب بحث الاسم الجاري فقط،
ويُبقي مطابقة الكتالوج وحالة كل محرر مستقلة؛2315 اختبارًا ناجحًا.
[[sessions/2026-10-19-Character-Search-Coalescing]] يختم خمسة إصلاحات مصدر و47 حالة جديدة في جلسة الاستكمال.

[[bugs/LF-083-Character-Discovery-Retry]] يحرر فشل اكتشاف مصدر الشخصيات من
الكاش، ويعيد المحاولة بعد عودة الاتصال؛2308 اختبارًا ناجحًا دون تغيير مطابقة المصدر.
[[sessions/2026-10-19-Character-Discovery-Retry]] يحفظ نجاح الاكتشاف وتشارك الطلب.

[[bugs/LF-082-Character-Provider-Body]] يمنع قراءة رد مزوّد الشخصيات بلا نهاية
مع الحفاظ على الشخصيات المتاحة وعلامة الاكتمال؛2299 اختبارًا ناجحًا.
[[sessions/2026-10-19-Character-Provider-Body]] يفصل مهلة كل مرحلة عن إلغاء الشبكة.

[[bugs/LF-081-Character-Catalog-Taxonomy]] يطابق ملف الشخصيات مع التصنيف
المشترك بالعربية والإنجليزية ويتجاوز الكتب المستثناة؛2286 اختبارًا ناجحًا.
[[sessions/2026-10-19-Character-Catalog-Taxonomy]] دون ترحيل بيانات الأعمال.

[[bugs/LF-080-Character-Catalog-Loading]] يضبط انتظار ملف الشخصيات قبل جلب
المزوّدين ويحمي إعادة المحاولة من callbacks قديمة؛2276 اختبارًا ناجحًا.
[[sessions/2026-10-19-Character-Catalog-Loading]] يحدد حدود التحقق بالمصدر.

[[bugs/LF-079-Character-Search-Response]] يتبع إصلاح المهلة بمنع كاش الردود
المعطوبة والفراغ الوهمي الدائم.2268 اختبارًا ناجحًا واسترداد في React الفعلي؛
[[sessions/2026-10-19-Character-Search-Response]] يوضح حدود الفحص.

[[bugs/LF-078-Character-Search-Deadline]] يزيل انتظار محتوى بحث الشخصيات
بلا نهاية؛2258 اختبارًا ناجحًا ومحاكاة timeout/late/retry في React الفعلي.
[[sessions/2026-10-19-Character-Search-Deadline]] يبقي تشخيص الجوال منفصلاً.

[[sessions/2026-10-19-All-Followups-Acceptance]] يجمع ثلاثة إصلاحات مستقلة
وفحص الإطارات الحالي، ويترك اختبارات الجهاز والخدمة والحسابين واضحة دون ادعاء
اكتمالها. [تقرير مستقل](../docs/FOLLOWUP_STATUS_2026-10-19.md) يلخص الباقي.

[[bugs/APNS-003-Permission-Intent-Race]] يحافظ على أحدث اختيار للإشعارات
عند تداخل الإذن والتسجيل والإيقاف.2251 اختبارًا ناجحًا بالمصدر؛
[[sessions/2026-10-19-Push-Permission-Intent]] لا يدعي نشرًا أو اختبار تسليم جديدًا.

متابعة الثقل [[bugs/LF-077-Character-Editor-Extra-Work]] أزالت بحث الأعمال
المخفي وإعادة الرسم المؤجلة بعد مسح الاسم، مع بقاء تبويب بحث الأعمال.
[[sessions/2026-10-19-Character-Editor-Extra-Work]] يميّز عدد العمليات عن FPS الجهاز.

[[bugs/LF-076-Character-Search-Identity]] يعالج مسارًا مثبتًا لخلط الشخصيات
بين الأعمال في البحث بالاسم، دون حذف اختيارات المستخدم. ثماني حالات جديدة
و2241 كاملة ناجحة؛ [[sessions/2026-10-19-Character-Search-Identity]].

طلب التحديث بالسحب في [[bugs/LF-075-Pull-Refresh-Lifecycle]] كشف تكرار طلبات
ورندر المجتمع، فربطنا إيماءة من بداية الصفحة بدورة تحميل محدودة مع حماية
المحررات والحساب. [[sessions/2026-10-19-Pull-Refresh-Lifecycle]] يفصل قبول
المتصفح الاصطناعي عن اختبار اللمس والخدمة الحقيقيين.

[[bugs/LF-074-Author-Query-Corrections]] وسّع اقتراحات البحث لأسماء المؤلفين
والخطأين المنفصلين في العبارات الطويلة، دون تغيير الاستعلام تلقائيًا أو هوية
الطبعات.71 اختبارًا مرتبطًا و2200 كاملة ناجحة. رجع اتصال الجوال واللمس؛ فحص
التنقل لا يعني تثبيت الإصلاحات. [[sessions/2026-10-19-Author-Query-Corrections]].

متابعة «كل المتبقي»: [[sessions/2026-10-19-Surface-Render-Recovery]] أضافت
استرداد أخطاء عرض React بعد إثبات غياب الحاجز، لا إعادة تحميل عشوائية.
[[bugs/LF-073-Surface-Render-Recovery]]:2195 اختبارًا وفحص AR/EN؛ سبب الشاشة
السوداء الأصلية يبقى غير مثبت، ولا بيلد أو جهاز متصل وقت الفحص.

وطُبّق اقتراح تسمية حالة القراءة في [[sessions/2026-10-19-Reading-Intent-Label]]:
«أرغب بالقراءة» وWant to read في المنتقي فقط، مع فصل العرض عن مفتاح المكتبة
القديم وحفظ دعم لوحة المفاتيح. [[bugs/LF-072-Reading-Intent-Label]] لا يرحّل
بيانات أو يغيّر تقدم القارئ.2190 اختبارًا ناجحًا، لا بيلد جديد.

مراجعة Discord في [[sessions/2026-10-19-Discord-Artwork-Quota]] قارنت خمسة
بلاغات والاقتراحات بالمصدر، وأصلحت خطأ امتلاء تخزين منتقي الصور
[[bugs/LF-071-Artwork-Storage-Quota]] دون حذف بيانات القارئ. بقيت الشاشة
السوداء وعبارات البحث غير المحددة بحاجة لدليل، لا إغلاق تخميني أو بيلد جديد.

ثم [[sessions/2026-10-19-Dynamic-State-Sync]] أصلحت نجاح المزامنة الوهمي بعد
حذف مفتاح ديناميكي، واعتماد مفاتيح جديدة من الجهاز الآخر. إصلاح مستقل
[[bugs/LF-070-Dynamic-State-Sync]]؛ لا تغيير سياسة الخصوصية أو الخدمة أو بيلد.

متابعة الحفظ [[sessions/2026-10-19-Pull-Remote-Deletions]] أصلحت عودة الحذف
السحابي عند وجود تعديل محلي آخر: [[bugs/LF-069-Pull-Remote-Deletions]].
فحص الخدمة قراءةً أكد وجود إسقاط القوائم العامة وإخفاء الخاصة في العينة؛
ليس اختبار دخول بحسابين أو اعتماد الحظر والجهاز. لا بيلد أو تغيير خدمة.

تطوير صفحة العمل في [[sessions/2026-10-19-Work-Experience]] وحّد هوية العمل
وأزرار الحالة والمراجعة والشخصيات والغلاف، وأضاف وصولًا مباشرًا للمراجعات
ومنتقي غلاف متكيفًا. كشف الفحص [[bugs/LF-068-Review-Rating-Restore]] وأصلح
استبدال التقييم اليدوي عند فتح المحرر. 15 حالة جديدة، 138 مرتبطة و2164 كاملة؛
فحص متصفح AR/EN و320/390/1280، لا اعتماد جهاز أو خدمة أو بيلد جديد.

أحدث اتجاه للبداية: ريشة تظهر وتكتب Lorefy ثم تستقر فوق الاسم بلا عبارة
تحميل أو مربع، مع بديل ثابت لتقليل الحركة ودون تأخير فتح التطبيق. هذا يلغي
علامة L والنقاط أدناه فقط؛ الدخول يظل Apple/Google بلا صور.
[[sessions/2026-10-18-Feather-Launch-Motion]] يوثق 2149 اختبارًا ناجحًا،
ويدوّن بحث Libraries.dev وأفكار التطبيق العامة دون الادعاء بتطبيقها كلها.

اختار المالك لاحقًا اتجاهًا مختلفًا للدخول: شاشة داكنة بسيطة بلا صور ولا
نصوص ترويجية، مع Google وApple فقط، وتحميل بعلامة L محلية. هذا يلغي الاتجاه
التصويري السابق لشاشة الترحيب فقط، ولا يبدّل ثيم البروفايل أو بياناته.
[[sessions/2026-10-18-Minimal-Entry-Launch]] يوثق 2145 اختبارًا ناجحًا وحدود المعاينة.

[[sessions/2026-10-18-List-Removal-Public-Projection]] فصل بين مشكلة الواجهة
ومشكلة الخدمة: أضيف حذف واضح للقوائم، وثُبت غياب دالة الإسقاط العام ثم فُعّلت
بإذن المالك دون تحويل أي قائمة خاصة إلى عامة. 2140 اختبارًا ناجحًا، لا بيلد.

متابعة المجتمع والبروفايل في [[sessions/2026-10-18-Social-Profile-UI]]:
اتساق التبويبات والإحصاءات والقوائم والمنشورات والنشر والردود للمالك والزائر،
مع حفظ الثيم والزينة والبيانات. 2133 اختبارًا ناجحًا وفحص متصفح صغير وواسع؛
لا بيلد جديد، وأسماء وصول بعض أزرار المراجعات القديمة ما زالت متابعة مستقلة.

توسعة تطبيق المهارات على الواجهة في [[sessions/2026-10-18-Apple-UI-Surfaces]]:
تبويبات مشتركة للرئيسية والاستكشاف، أدوات مكتبة متكيفة، هيدر إعدادات أوضح
وشفافية وظيفية لها بدائل وصول. الإطارات والصور والبيانات محفوظة؛ التحقق
2119 اختبار مصدر وفحص متصفح، وليس بيلدًا أو تركيبًا جديدًا على الجوال.

متابعة 18 أكتوبر: استُخدمت توصية الفيديو لربط المهارتين المحليتين
`apple-design` و`swiftui-pro` بنطاقهما الصحيح. [[playbooks/Apple-Interaction-Quality]]
يثبت المصدر والقواعد؛ [[bugs/LF-067-Press-Motion-Feedback]] أول تطبيق على
أزرار الويب، لا تحويل للتطبيق إلى SwiftUI أو تغيير للإطارات.

هذه القراءة التسلسلية للمشروع، لا مجرد قائمة ملفات. تربط غرض كل نظام
بمصدر الحقيقة الذي يعتمد عليه، وتشرح لماذا وُضعت الحواجز وكيف تغيرت القرارات.
خريطة التغطية في [[14-Feature-Coverage]]، والحالة المؤرخة في
[[sessions/2026-10-15-Source-Reorganization]]. لا تعني الرواية أن كل سطر
رُوجع أو أن جميع مسارات الجهاز والخادم اختُبرت.

## ما الذي نبنيه؟

Lorefy مساحة قراءة عربية وإنجليزية: اكتشاف مانجا ومانهوا وروايات وكتب،
تنظيم مكتبة، حفظ تقدم وتقييمات، مفضلة وشخصيات وقوائم، بروفايلات ومجتمع.
صور القارئ وألوانه وترتيبه وبياناته جزء من المنتج، وليست بيانات اختبار
يجوز استبدالها أثناء تحسين الواجهة. [[01-Project]] يثبت الحدود.

## كيف يبدأ التطبيق؟

المنتج الحالي ويب HTML/CSS/JavaScript بمكونات React محلية داخل غلاف
Capacitor/Swift. النموذج القديم ليس أساس التطوير الجاري. يبدأ
[index.html](../index.html) بتهيئة العرض والمصادقة والتحميل، ويعرّف
[التطبيق الرئيسي](../uploads/files/lorefy-app.js) `NenApp`.
الاسم `lorefy-v2.js` لا يجعله التطبيق الرئيسي؛ هو مساعد إحصاءات.

بعد التهيئة تأتي مكونات React وإضافات DOM المتخصصة. لذلك تعديل ترتيب
script أو نقل عنصر يملكه React قد يكسر حالة أو حدثًا، حتى لو بقي الشكل
صحيحًا. راجع [[systems/App-Boot]] قبل معالجة شاشة فارغة أو تكرار تركيب.

## هناك حقيقتان مختلفتان: العمل والقارئ

الكتالوج يصف العمل: هويته ونوعه ومؤلفه وأغلفته ومصادره وفصوله المتاحة.
بيانات القارئ تصف ما اختاره وقرأه وقيّمه بالفعل. ازدياد بيانات الكتالوج
لا يزيد تاريخ القراءة، وتغير صورة المصدر لا يلغي صورة مخصصة.

البحث يحمل فهرسًا وأجزاء مطلوبة بدل كل البيانات عند البداية؛ قد تتأخر
تفاصيل عمل أو شخصية دون أن تصبح بيانات المستخدم مفقودة. العنوان المتشابه
ليس هوية واحدة، والطبعة أو الاقتباس ليسا دائمًا العمل نفسه. هذه مسؤولية
[[systems/Catalog-Search]] و[[systems/Explore-Works]]. لا نخترع تقييمًا
أو نبذة أو فصلًا لملء فراغ في المصدر.

## من يملك الحفظ؟

التفاعل يبدأ بحالة محلية تخص الحساب، ثم سجل تغييرات معلقة ثم مزامنة.
الخادم ليس إذنًا لاستبدال تعديل محلي أحدث، والجهاز ليس إذنًا لنسخ بيانات
حساب سابق إلى حساب جديد. الاستجابة المتأخرة تُراجع أمام المالك وجيل الطلب.
الفشل يترك إمكانية إعادة المحاولة ولا يُعلن نجاحًا غير مؤكد.

[[09-Data-Contracts]] يسرد مفاتيح العقود دون قيمها.
[[systems/Accounts-Sync]] يشرح الدمج والملكية. لا تُنسخ جلسات أو مفاتيح
أو بيانات حساب حقيقي إلى هذه الرواية. الاختبارات تستعمل fixtures معزولة.

## ماذا يعني مكتمل؟

حالة العمل اختيار تنظيمي؛ checkpoint حقيقة محفوظة. اختيار الإكمال في
الإجراء المخصص قد يلتقط التقدم مرة، لكن العرض لا يعيد احتسابه من الكتالوج.
عند وجود `chapter:0` لا نعود إلى `ch` قديم غير صفري. حذف عمل من المكتبة
لا يبرر إعادة كتابة التاريخ. لا تُجمع تمثيلات الفصل والصفحة والمجلد كأنها
ثلاث قراءات مستقلة. المرجع [[decisions/Saved-Reading-Metrics]].

قسم الفصول واليوميات يقرآن نفس الحقيقة. التراجع مملوك للحساب، وأحداث تقدم
جديدة لا تمسح نصًا مفتوحًا أو اختيار الحرق. حماية الحرق تستخدم الموضع الحالي
لا قيمة legacy أقدم. راجع [[sessions/2026-10-15-Reading-Ownership]] و
[[sessions/2026-10-15-Live-Reading-Spoilers]].

أحدث إصلاحات اليوميات حمت المسودة من إعادة الرسم ومن تبديل الحساب، وعالجت
متغيرًا حجب دالة رسالة النجاح. نجاح الكتابة ونجاح النسخ وإلغاء المشاركة
حالات منفصلة. تفاصيلها في [[sessions/2026-10-15-Diary-Drafts]] و
[[sessions/2026-10-15-Diary-Feedback]].

## لماذا كانت بعض الأرقام تتغير؟

ليست كل قفزة رقمية فقدًا للحفظ. البروفايل البعيد كان يعرض أصفارًا وحالة
متابعة افتراضية قبل اكتمال الطلب؛ LF-004 يفصل الانتظار والفشل عن البيانات
المؤكدة. كذلك عدّاد الشخصيات كان يعد التفاصيل المحملة بدل التقييمات
المحفوظة؛ LF-009 فصل عدد التقييمات ومتوسطها وعدد أعمالها عن اكتمال cast.
هذا سبب مثبت لعداد الشخصيات، وليس تفسيرًا تلقائيًا لكل بلاغ فصول أو ساعات.
الأدلة والتفاصيل في [[12-Device-Repairs]].

## من يرى البروفايل والقوائم؟

البروفايل الشخصي يملك مكتبة صاحبه ومظهره. البروفايل العام يستعمل إسقاط القارئ
المطلوب، لا مكتبة الزائر ولا ألوانه. انتهاء طلب قارئ قديم لا يعيد عرضه
بعد الانتقال لقارئ جديد. إعدادات الخصوصية ليست مجرد إخفاء محلي؛ الخادم
يملك صلاحية الرؤية والحظر.

القوائم الجديدة تستخدم عقدًا مختلفًا عن القوائم القديمة. إصلاحات الخصوصية
تتعامل مع العقد الصحيح وتحافظ على الاسم والعناصر، ولا تعيد إنشاء قائمة
حُذفت أثناء بقاء الإعدادات مفتوحة. إلغاء الحظر ينتظر رد الخادم ولا يعلن
نجاحًا كاذبًا. [[systems/Profiles-Lists]] و
[[sessions/2026-10-15-Privacy-Safety-Repairs]] هما المرجع.

## المظهر ليس صورة واحدة

ثيم التطبيق، شكل المكتبة، البنر، إطار الصورة، إطار الصفحة والحركة طبقات
مختلفة. الزينة لا تستبدل الصورة أو البنر الأصليين. هندسة الإطار مشتركة
لصاحب الحساب والزائر، مع مساحة للأزرار والوسط والذيل وsafe area.
المكونات غير المرئية لا تحتاج حلقات رسم مستقلة بلا توقف.

[[decisions/Profile-Frame-Geometry]] يحفظ القرار، و
[[systems/Appearance-Bundles]] يحدد مصادره. بعض صور التقرير تخص renderers
أقدم على الجوال؛ تعديل CSS مؤقت لا يثبت تثبيت JS أحدث. لا تُغلق مشكلة
الإطار على كل حزمة بسبب نجاح صورة واحدة أو اختبار هندسة فقط.

المجانية المؤقتة للحزم الحالية موثقة في [[decisions/Temporary-Free-Bundles]].
هذا لا يعني حذف مسار الملكية والفواتير أو تشغيل الشراء. حقوق الأصول
وموافقة النشر موضوع آخر، ولا تُقلب أعلامه تلقائيًا.

## الجرس ليس APNs

تنبيه داخل التطبيق، صندوق الجرس، عداده، تسجيل جهاز، قبول Apple وإظهار إشعار
في الخلفية حلقات مستقلة. وجود 40 تنبيهًا في الخادم لا يثبت وصول push،
وإذن النظام لا يثبت أن صندوق الجرس يرسم البيانات.

[[sessions/2026-10-14-APNs-Server-Setup]] يحفظ فحص إعداد الخادم وحدوده دون
المفتاح. التقرير الفعلي في [[inbox/2026-10-15-Device-Audit]] وجد صندوقًا
فارغًا في runtime أقدم. LF-001 يميز الإصلاح الموجود بالمصدر عن النسخة
المثبتة. [[systems/Community-Notifications]] يربط الأحداث والحساب والوجهات.
أضيف الدليل الخاص في [[sessions/2026-10-16-Authorized-Push-Check]]: اختبار
واحد مصرح به، رد APNs مرتبط بالطلب، وتأكيد المالك للاستقبال خارج التطبيق
والضغط إلى صندوق الإشعارات. ليس إثباتًا لكل الأحداث والأجهزة، ولا تفسيرًا
مؤكدًا لسبب البلاغ القديم. لا أسرار أو بيانات حساب الاختبار في الذاكرة.

تتابع إصلاح الشخصيات بعد العدد إلى المعرض ثم محرر المفضلة: ملكية الحساب،
تجدد cast والمحاولة، ثم اللغة وقص الإجراءات. تسلسل الأدلة في
[[sessions/2026-10-15-Character-Editor-Owner]]،
[[sessions/2026-10-15-Character-Editor-Hydration]] و
[[sessions/2026-10-16-Character-Editor-Locale]]. لا بناء جديد لهذه الإصلاحات.

## خط زمني قائم على الأدلة

| المحطة | ما تغيّر أو ثبت | المرجع |
| --- | --- | --- |
| Build 34 المحفوظ | غلاف Capacitor وحزم البيتا؛ الأرشيف دليل مجمد لا مصدر تغيير يومي | [الجاهزية التاريخية](../docs/BUILD34_READINESS.md)، [حدودها](../docs/BUILD34_KNOWN_GAPS.md) |
| قواعد البروفايل | هندسة مشتركة وحفظ البنر والصورة وفحص owner/visitor | [[decisions/Profile-Frame-Geometry]] |
| 13 و14 أكتوبر | خزنة محلية وربط الأنظمة والقرارات وبصمة المصدر | [[sessions/2026-10-13-Obsidian-Setup]]، [[sessions/2026-10-14-Project-Brain]] |
| 14 أكتوبر | إعداد APNs وفحص جاهزية لا يرسل إشعارًا فعليًا | [[sessions/2026-10-14-APNs-Server-Setup]] |
| 15 أكتوبر: الجهاز | تقرير ست مشكلات، مع حفظ صور الحساب خارج Git | [[inbox/2026-10-15-Device-Audit]] |
| إصلاحات هذه المحادثة | تحميل البروفايل، تقدم محفوظ، اتجاه المعرفات، بدائل الصور وفصل أحداث الزر | [[12-Device-Repairs]] |
| `279a9dc` | مزامنة إصلاحات التشغيل والقراءة والخصوصية والأصول | [[sessions/2026-10-15-GitHub-Sync]]، [[sessions/2026-10-15-Live-Reading-Spoilers]] |
| `c727644` | حفظ مسودة اليوميات وملكيتها أثناء المزامنة | [[sessions/2026-10-15-Diary-Drafts]] |
| `64e4e63` | رسائل نجاح الحفظ والنسخ ومعالجة فشل Clipboard | [[sessions/2026-10-15-Diary-Feedback]] |
| الجولة الحالية | جلب التحديثات الثلاثة وحفظ المحلي، ثم إصلاح عداد الشخصيات وتنظيم الرواية | [[sessions/2026-10-15-Source-Reorganization]] |

الأعداد التاريخية للاختبارات ليست نتيجة الجولة الحالية. الإيصال الأحدث
والقيود يُقرآن من [[05-Verification]] و[[10-Open-Questions]].

## كيف نكمل دون فقد السياق؟

[[15-Work-Control]] تحول الفجوات إلى خطوات عمل مرتبطة بالأدلة، و
[[16-Obsidian-Workflow]] يشرح الخصائص والقوالب والمراجعة المحلية المبنية على
التوثيق الرسمي. هذه طبقة تشغيل للمعرفة، وليست نموذجًا يتعلم داخل الخزنة.

ابدأ بـ[[08-Feature-Router]] ثم ملاحظة النظام والعقد، واقرأ المصدر الفعلي.
أثبت المشكلة باختبار، أصلح نطاقها، افحص الأصول المتأثرة، وسجّل الدليل والحدود.
لا تُحوّل عدم الاختبار إلى نجاح، ولا تعيد استيراد الكتالوج أو تشغيل migrations
للتنظيف. [[11-Organization-Plan]] يشرح فصل المصدر والأصول والمخرجات والمعرفة.

التوجيه الحالي: تطوير ملف التطبيق فقط. لا build ولا Apple ولا TestFlight
ولا تغيير أسرار أو قاعدة بيانات بسبب هذه الرواية. Obsidian يحفظ المعرفة؛
الأوامر والاختبارات تنفذ العمل. [[14-Feature-Coverage]] تمنع نسيان نظام
وتوضح ما نعرفه وما لا نعرفه.

[[00-Home]] | [[02-Architecture]] | [[09-Data-Contracts]] | [[12-Device-Repairs]]

## إصلاحات المقارنة — 16 أكتوبر
بدأت معالجة ملاحظات الدراسة بـ[[sessions/2026-10-16-Friend-Rating-Rows]] بعد جلب تحديثات GitHub حتى 590bf33. فُصل الاسم عن الرقم دون تغيير التقييمات أو هوية التطبيق.

تلاها [[sessions/2026-10-16-Diary-Position-Defaults]]: جعل بداية ملاحظة الكتاب صفحة مع احترام الوحدات والمواضع الحالية؛ لا تغيير لتاريخ القراءة.

بعد جلب `80ba6b5` أُعيد ربط التقرير الموسع بخطة [[17-Extended-Review-Plan]]،
بدل إعادة بناء ميزات موجودة. [[sessions/2026-10-16-Import-UI]] يعالج خلل تباين
مؤكد في نافذة الاستيراد وأسماء حقولها، مع إبقاء بيانات الحساب وصور الجهاز خارج الذاكرة.

ثم [[sessions/2026-10-16-Review-Reply-Direction]] أصلح اتجاه حقل الرد بالإنجليزية،
مع الحفاظ على العربية والنصوص الأصلية؛ التاريخ ولوحة مفاتيح الجهاز لهما تحقق مستقل.

[[sessions/2026-10-16-Review-Timestamp]] أكمل مسار التاريخ: يعرض التاريخ والوقت
بلغة الواجهة من القيمة الأصلية، دون ترجمة رأي القارئ أو تغيير وقت المراجعة المحفوظ.

[[sessions/2026-10-16-Native-Touch-Audit]] أعاد الضغط والسحب الحقيقيين في البث
المحلي للجوال دون بناء جديد. ثم [[sessions/2026-10-16-Reading-Estimate-Labels]]
صحح وصف الساعات كتقدير من التقدم المحفوظ، مع توضيح الحساب دون تغيير الأرقام.
بقية ترجمة الإحصاءات محفوظة كمتابعة مستقلة، لا نجاح ضمني لجميع شاشات التطبيق.

أكملتها [[sessions/2026-10-16-Statistics-Locale]] في المصدر: ترجمة مباشرة من
حالة React، وأرقام واتجاه وأسماء وصول متسقة. مطابقة أيام الرسم لتواريخها
متابعة مستقلة في [[bugs/LF-020-Statistics-Activity-Dates]]؛ لا تعديل لسجل القارئ.

[[sessions/2026-10-16-Statistics-Activity-Dates]] أكملت ربط أعمدة النشاط بالتقويم
المحفوظ، واختبرت الصفر وحدود الشهر والسنة والمناطق الزمنية. السجل نفسه لم
يتغير، وغياب البيانات لم يعد يتحول إلى أسبوع افتراضي في الرسم.

[[sessions/2026-10-16-List-Keyboard-Focus]] عالج فقد التركيز بعد ترتيب أو إزالة
عنصر من القائمة، مع أسماء وصول تحدد العنصر وإعلان موضعه. فُحصت المسودة والإلغاء
وفشل الحفظ دون تعديل القوائم الحقيقية؛ قص الأدوات على العرض الضيق إصلاح مستقل.

[[sessions/2026-10-16-List-Tool-Clipping]] أصلح القص بقياسات 320 و440 وبالاتجاهين،
بعد ملاحظته في محرر الجوال أيضًا. أُلغي الفحص على الحساب الحقيقي دون حفظ؛
بقيت النسخة المثبتة منفصلة عن المصدر المصحح.

[[sessions/2026-10-16-Home-Continuation]] فصل بين فلتر المتابعة القديم المعيب
وغياب ربطه بالرئيسية الاجتماعية الحالية. أُعيد ربط قسم خفيف بالتقدم المحفوظ،
مع بقاء المجتمع والاستكشاف وعدم تغيير الساعات أو حالة المكتبة تلقائيًا.

[[sessions/2026-10-16-Review-Progress-Independence]] وجد أن النشر نفسه ما زال
يستدعي الإكمال رغم حماية المصالحة القديمة للحالات الصريحة. فُصل الاستدعاء
واختُبرت الحالات الخمس والصفر والنشر وإعادة التحميل في بيانات محلية معزولة.

[[sessions/2026-10-17-Review-Response-Owner]] أكمل طبقة الاستجابات المتأخرة:
تبديل الحساب أو الجلسة يمنع تعديل واجهة الحساب التالي وإظهار أخطاء الطلب القديم.
يبقى إلغاء الطلب نفسه وفحص الخادم وملكية المحرر قبل الإرسال مسارات مستقلة.

[[sessions/2026-10-17-Review-Editor-Owner]] ربط المسودة بالحساب والعمل منذ فتحها،
وفصل جلسات التحرير حتى للعمل نفسه. نتيجة نشر قديمة أو أحداث محرر قديم لا تمسح
مسودة أحدث. إكمال فك الصور محليًا وملكية الرفع على الخادم ما زالا مسارين مستقلين.

[[sessions/2026-10-17-Review-Image-Owner]] أكمل حماية الصور محليًا: القراءة وفك
الصورة وتحديث المرفقات تتحقق من جلسة المحرر الأصلية. لم يتغير ضغط الصور أو حد
المرفقات؛ فحص الرفع للخادم وصلاحيات الصور على الجهاز ما زال منفصلًا.

## متابعة 17 أكتوبر
[[sessions/2026-10-17-Review-Library-Lifecycle]] توقف استنتاج اكتمال العمل من مراجعة فقط، دون حذف إدخالات مكتبة أو تقدم محفوظ تاريخياً.

[[sessions/2026-10-17-Backend-Review-Owner]] توسع الحماية من واجهة المحرر إلى مراحل backend نفسها؛ حساب الطلب لا يتبدل بعد await.

[[sessions/2026-10-17-Profile-Mutation-Owner]] تمنع رد حفظ/خصوصية قديم من تغيير الهوية أو التفضيلات بعد تبديل الحساب، مع بقاء الحفظ الطبيعي.

[[sessions/2026-10-17-Session-Read-Owner]] تغلق استجابة قراءة auth القديمة ومشاركة promise عبر الحسابات قبل طبقات حفظ المراجعة والملف.

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

- [[bugs/LF-066-Rating-First-Completion]]: بلاغ المالك أن تقييم Berserk لا يزيد المكتملة والفصول والساعات حدّث سياسة النشر للعمل غير المسجل. نجاح النشر يلتقط إكمالًا مرة واحدة دون استبدال حالة/تقدم سابق أو backfill للمراجعات القديمة؛ [[sessions/2026-10-18-Rating-First-Completion]]. الديمو ثبت على 2 مكتملة و804 فصول و161 ساعة بعد إعادة النشر والتحميل؛ 2107 اختبارات مصدر، لا بيلد جديد.


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

2026-10-24: [[sessions/2026-10-24-Motion-Atelier]] implements six locally gated
original animated materials, shared scheduling and measured thick-frame clearance.
All36 public-fixture layout/size cases passed geometry checks; demo apply/restore
preserved avatar/banner. No GitHub push, native build or live service changes.

2026-10-26: [[sessions/2026-10-26-Home-Cinema]] implements the approved cinematic
Apple/Glassy direction on Home only. Actual reading data and existing feed are
retained; Dislike gets immediate guarded updates. Library/Explore/Profile remain
separate future phases. Full suite: 2523 passed. Local only, no build or push.


2026-10-29: [[sessions/2026-10-29-Jikan-Retirement]] replaces the discontinued public Jikan endpoint with verified Tenrai-compatible MAL lookups. Three failing regressions become green; 365 focused checks and browser retrieval pass. Public compatibility function v14 is live. Installed native clients still require a separately authorized release; general search latency remains open.

2026-10-29: [[sessions/2026-10-29-Search-Performance]] follows latest GitHub checkpoint74fbee4 and owner authorization for direct push. Removes11.1s fallback search-start timers, publishes providers progressively, aborts obsolete requests and halves cold query CPU time.2990 source tests and local AR/EN browser evidence pass; native delivery and physical-device latency remain separate.

2026-10-29: [[sessions/2026-10-29-Supabase-Pro-Optimization]] confirms Pro and ACTIVE_HEALTHY, then applies five indexes and two equivalent chapter-review identity InitPlans. One live feed query improves from 80.915 ms to 23.905 ms; 23 isolated SQL checks and 63 focused source checks pass. Jikan, Apple server configuration and broader device/service evidence remain open. No Edge deployment or native build.

Same-day integration: the server optimization's initial Jikan failure/inference
is superseded by [[sessions/2026-10-29-Jikan-Retirement]], and its separate search
latency follow-up has source/browser evidence in [[sessions/2026-10-29-Search-Performance]].
Apple server configuration, physical-device acceptance and installed-client
release delivery remain open. Applied SQL history is preserved, not replayed.

2026-10-30: [[sessions/2026-10-30-Search-Audit]] records the owner-requested three-agent search audit on latestmain6781dcf. Removes repeated index/cache/render work, repairs aliases/types/partial failures and the All/الكل integration mismatch.3111 source tests and local8-format/AR/EN browser checks pass;11/12publicprobesvalid, Googlequota remains. Source push is authorized; native/service deployment remains separate.
