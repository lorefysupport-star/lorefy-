# Lorefy: local redesign

## Current execution: 2026-10-29

Twenty-second batch: owner rated-character cards preserve existing typography,
art sizes and scores. Native Open overlays the card; centered44px glass image
Retry is its sibling, with focus restored to Open. Absolute managed images must
not add an implicit grid row below initials. Gallery body reserves100% border-box
width so art intrinsic sizing cannot shrink the collection. Pause nested inert
gallery state without losing search; account changes still close it.
Evidence: `project-memory/sessions/2026-10-29-UI-Foundation-Phase-Twenty-Two.md`.

Twenty-first batch: keep the envelope and list artwork dimensions. Decorative
Open-folder artwork has no nested action. Detail/candidate image Retry is44px;
36x48 editor artwork uses an external44px action at logical start24px, leaving
native rank tools independent. Add is a separate native selector, with outer
focus indication. A selected candidate still permits image recovery. Preserve
projected item sources and theme tokens; dispose only list-owned media.
Evidence: `project-memory/sessions/2026-10-29-UI-Foundation-Phase-Twenty-One.md`.

Twentieth batch: category-board Retry must not select a character/open a picker.
Preserve custom art and share metadata. Reserve108px slot height on small phones,
but constrain width100%/min-width0 so aspect ratio cannot overflow grid tracks.
Current-photo row is two rows: portrait/title/reset above, two equal44px-high
image actions below. Keep native outer focus indicators and explicit cleanup.
Evidence: `project-memory/sessions/2026-10-29-UI-Foundation-Phase-Twenty.md`.

Nineteenth batch: legacy top-ten character faces retain circle sizes and original
artwork. Never place Edit or Retry inside Remove/Add. Use separate native named
actions and an outer focus indicator.44px Edit gets a52px reserved strip below
filled-slot names; image recovery sits outside clipped circle art. Tiny previews
inside Open list have no extra control; recovery is available in the editor.
Evidence: `project-memory/sessions/2026-10-29-UI-Foundation-Phase-Nineteen.md`.

Eighteenth batch: imperative character portraits keep original source/crop and
160px card geometry. Initials stay visible until decode; failed/missing media
never hides character identity or Edit. Retry and Edit are independent44px glass
controls, top/bottom, with named AR/EN recovery and polite status. Dispose old
media on filtering/page/picker close; do not add React roots to legacy DOM.
Evidence: `project-memory/sessions/2026-10-29-UI-Foundation-Phase-Eighteen.md`.

Seventeenth batch: Work hero and Review Editor media retain original artwork,
hero/mini geometry and draft data. Decorative art recovery remains separately
named; picture copy must not say cover. Draft image tiles reserve96x124 with
96x72 art and two independent44px action slots8px apart. Explicit scoped sizing
must win old unlayered rules so attach actions cannot overlap. No new palette,
font, motion or imagery. Evidence:
`project-memory/sessions/2026-10-29-UI-Foundation-Phase-Seventeen.md`.

Sixteenth batch: managed work covers in friend rails and compact review
attachments, plus Explore feature/poster/format art. Preserve dimensions/crops,
literal titles and all navigation callbacks. Independent44px Retry belongs over
compact art, not in the text column; format title clicks must reach Open. Keep
decorative artwork hidden from assistive technology while naming its recovery
action. Draw keyboard focus on the outer card to avoid clipped inner outlines.
Evidence: `project-memory/sessions/2026-10-29-UI-Foundation-Phase-Sixteen.md`.

Fifteenth batch: Home Continue reading keeps the original sharp full-bleed art,
2:3 poster and compact native work selector through loading/error/missing states.
Poster and background recovery are separate named actions; decorative status
does not become screen-reader noise. Thumbnails stay selectable on failure,
without nested retry or a new automatic request loop. Keep known-total progress,
exact-work art binding, rights-safe suppression and existing crop geometry.
Evidence: `project-memory/sessions/2026-10-29-UI-Foundation-Phase-Fifteen.md`.

Fourteenth batch: managed Library/profile cards use explicit outer book anchors,
not the managed image's parent, for shelf/Showcase presentation. Missing covers
retain literal titles, ranks and space. Use independent native Open/Edit/Retry;
exempt these from legacy favorite capture, hide no open action, and reserve44px
Edit/Retry without overlap. Preserve React child identity with Children.forEach
and avoid the legacy fixed-width lf-cover-card class. Keep failed image opacity
protected from older important rules. Owner/visitor current layouts preserved;
Home and non-work media remain separate. Evidence:
`project-memory/sessions/2026-10-29-UI-Foundation-Phase-Fourteen.md`.

2026-10-29, thirteenth batch: opted-in cover surfaces keep their source and2:3
geometry through loading/error/missing states, with no generated failure cover.
Explicit44px Retry is separate from Open work; no automatic retry loop. Managed
ownership bypasses the legacy global guard. Explore items and Work poster only;
preserve other media/layouts until their own migration checks. Evidence:
`project-memory/sessions/2026-10-29-UI-Foundation-Phase-Thirteen.md`.

Twelfth batch: bound Work creator actions to their text column, with44px minimum
height, shrinking source-name span and fixed directional arrow. Full detail
subtitle/creator text wraps naturally. Search bylines use12px/two text-relative
lines, full tooltips and complete accessible attribution; compact rails unchanged.
Protect literal source text/attributes from general UI translation. Evidence:
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Twelve.md`.

Eleventh batch: post/reply counters share compact visible Latin digits and exact
accessible totals with AR plural/EN singular forms. Refresh the same counter
nodes on all existing update paths. Direct first-render post/thread copy follows
app language, while author/user prose stays literal and direction-isolated.
Retain glass,44px controls and existing reaction/persistence contracts. Evidence:
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Eleven.md`.

Tenth batch: source reading titles remain complete/literal with `dir=auto`,
isolation and start alignment. Stable two-line slots must grow with font size;
Showcase captions use effective line-height units and growing wrappers. Narrow
resume components rearrange via container queries, not viewport-scaled fonts.
Observe source title changes without observing generated caption text. Preserve
existing artwork, three-work Showcase and seven-work shelf geometry. Evidence:
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Ten.md`.

Ninth batch: use `LorefyI18n.readingStatusLabel/readingStatusEmpty` at reading
display sites; saved values and publication metadata stay separate. All five
states remain distinct. Labels derive from values, not positions. Profile covers
are named native buttons with unchanged open-work callbacks. Evidence:
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Nine.md`.

Eighth batch: legal/support documents read design tokens before paint, with
shared glass toolbar, unframed sections,16px body,44px controls, safe-area spacing,
native details/anchor focus and no-JS fallback. Keep legal wording/dates/contact
targets unchanged. Arabic content remains explicit even with English chrome.
No account/backend bundle is needed. Evidence:
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Eight.md`.

Seventh batch: Review options opts into existing Product Tools glass with a real
report form, direct AR/EN labels and safe inline progress/recovery. One operation
locks report/mute/block together while Close stays enabled. Keep original targets
and reason values; distinguish device-save from a service receipt. Do not style
failure as success or close/hide content from a stale request. Details:
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Seven.md`.

Sixth batch: correction center/editor, Safety and Missing work drafts opt into
`.lf-product-studio` chrome sequentially. Existing data-studio CSS owns shared
sheet/header/section/action rules; trust-studio CSS owns their content. Preserve
Data-only visibility rows and recheck them after reuse.16px regular fields,
visible labels, linked inline errors,44px named controls and enabled Close during
pending actions. Display actual saved statuses and local-only queue boundaries;
never imply a service was reached just because a local record exists. See
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Six.md`.

Fifth batch: Data/privacy uses `styles/lorefy-data-studio.css`, mounted material
variables, direct AR/EN and visible native selector labels. Preserve current
profile/legacy visibility values and options; do not promise one private default.
Layered layout must override unlayered legacy declarations where required;
assert computed narrow stacking and centered desktop placement. Product child
dialogs restore only their own inert changes and retain enabled close access
during export preparation. No real privacy/export/account actions in browser QA.
Evidence/limits: `project-memory/sessions/2026-10-28-UI-Foundation-Phase-Five.md`.

Fourth batch: scoped Settings/Customize chrome in
`styles/lorefy-settings-studio.css`. Preserve destructive colors, switch tracks,
profile media and persistence. Tab stop/panel naming is shared behavior, while
React owns selected/hidden state. Keep focus inside when Apply becomes disabled;
validation belongs beside its field. Evidence:
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Four.md`.

Third batch: import is a standalone overlay with its own scoped layout in
`styles/lorefy-import-studio.css`, shared material tokens and unframed source
sections. Visible field labels, inline validation and focusable announced
loading/review/error states preserve the draft and confirmation boundary.
Do not apply these scoped rules to Settings/other legacy overlays by guessing.
Evidence/remaining gates: `project-memory/sessions/2026-10-28-UI-Foundation-Phase-Three.md`.

The owner authorized the consistency plan after the local UI audit. Its27
units are implemented one at a time; do not treat the older experiment queue
below as current completion status. Keep all three original profile layouts,
all four library modes, artwork, account data and custom color choices.

First verified batch: character image-picker semantic action pairs and shared
material at its standalone mount; direct AR/EN labels/direction and44px tools;
and correction of the profile overview visibility cascade. Details and remaining
gates: `project-memory/sessions/2026-10-28-UI-Foundation-Phase-One.md`.

Second batch adds image-picker keyboard/inert/return behavior, scoped async
lifetime and explicit provider recovery. Reuse existing modal behavior; keep a
visible enabled close action while saving, and move focus before disabling the
initiator. Failed providers are not verified-empty states. Details:
`project-memory/sessions/2026-10-28-UI-Foundation-Phase-Two.md`.

No broad palette/type reset is approved by this batch. Shared rules should own
colors and states once; layout files own placement. A named important layer
can override an unlayered important rule regardless of repeated root selectors.
Prefer removing an unnecessary display override to adding stronger selectors.

No GitHub push, native build or service write. Subsequent sections need their
own behavior and visual checks; this batch does not complete the entire plan.

## Historical directions

Selected direction (2026-10-23): Reader Identity / white Profile image supplied
by the owner. Implemented as the third saved layout `reader`, not a global
restyle. See modules/lorefy-reader-layout.js and styles/lorefy-reader-layout.css.
The two experiments below are superseded as the preferred direction.

Date: 2026-10-22. Owner direction: actual redesign, one section at a time,
consistent Apple-inspired identity, local only. No GitHub push or native build.

## Design decisions

- Content is the identity: real covers, reader artwork, typography and collections.
- Keep existing semantic palette, custom colors, Arabic and English fonts.
- Use the existing icon family, 44px minimum controls, logical spacing and zero tracking.
- Use 4/8/16/24/32 spacing. Page bands are unframed; individual items may have 8px corners.
- Translucent materials belong to navigation and tools, not every content surface.
- Immediate press feedback; short opacity/transform transitions; respect reduced motion.
- Preserve current handlers, account ownership, privacy, cloud persistence and decoration assets.
- New sections own separate files. Never ship global experimental selectors.

## Research

Read local UI/UX Pro Max and apple-design skills. Two design-system searches
returned marketing/AI patterns unsuitable for a reading application. Those
palettes and layouts were rejected, not persisted as recommendations. Use the
skills' touch, accessibility, responsive and motion rules with Lorefy's tokens.

Primary reference: https://developer.apple.com/design/human-interface-guidelines/
Apple separates content from controls and emphasizes platform consistency.
This is a web implementation inside Capacitor, not native Liquid Glass.

## Sequential delivery

1. Profile: active. Identity, reading metrics, favorites, lists, posts, editing and visitor states.
2. Library: queued. Reading states, filters, progress and collection editing.
3. For You: queued. Discovery hierarchy, recommendations and continuation.
4. Community: queued. Feed, composer, replies and recovery states.
5. Work detail: queued. Reading state, reviews, characters and covers.
6. Search, notifications, settings, authentication: queued individually.

Only profile is enabled in the first local experiment. Complete and review a
section before modifying the next. Shared tokens are a contract, not a global reskin.

## Verification gate

Check real existing interactions, AR/EN, light/dark, narrow/large screens,
long names, empty/loading/error states, decoration clearance and scroll reachability.
Do not equate screenshots with device validation or an unfinished section with completion.

Preview: phone-preview.html?preview=demo&demo=ready&route=profile&redesign=profile
Remove redesign=profile to compare the unchanged baseline.

## Revised direction: 2026-10-23

Owner rejected the first visual draft. PromptSite was requested as a reference.
https://promptsite.tiiny.site/ is a designs/prompts library, not a verified
installable Codex skill. Plugin directory lookup returned no PromptSite plugin.
The free "Travel app homescreen" reference was read directly in its detail UI.
Adapted principles: restrained hierarchy, media-led content and even spacing.
Do not copy its travel content, fonts, negative tracking or device mockup chrome.

New independent sheet: styles/redesign/profile-promptsite.css.
Local query: redesign=profile-promptsite. This direction centers identity and
returns metrics to a compact row, with full cover artwork below. The rejected
first direction remains available for comparison; neither is production-enabled.
