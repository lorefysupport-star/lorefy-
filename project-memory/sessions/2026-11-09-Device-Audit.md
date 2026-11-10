---
kind: session
status: source-browser-verified-device-delivery-pending
date: 2026-11-09
---
# Physical-device audit and scoped repairs

The owner requested visible, comprehensive testing of the installed beta.
Bundle-specific InstallationProxy inspection identified version 1.0 build 37.
USB display streaming and CoreDevice input worked; no app was installed or
replaced. This does not establish which Git commit produced the installed app.
Raw account screenshots and the loopback-only mirror remain outside Git/vault.
No posts, reactions, follows, ratings, reading states or lists were changed.

## D-001: list detail toolbar intersects native status area

On the physical phone, opening a saved list scrolled its toolbar under native
status chrome. The back command did not respond at its displayed location;
bottom Home navigation still worked. This is not evidence that all navigation
or the app process froze.

`modules/lorefy-profile-sections.js` calls `scrollIntoView({block:'start'})`
on the shared panel for both list open and back. The panel had no scroll margin.
`styles/lorefy-profile-sections.css` now reserves the greater of native
`--nc-top` and browser safe-area inset, plus 8px. It does not add blank padding
to every profile or change saved layouts, decorations, themes or list contents.

Actual local-browser regression reproduced top positions around 28px even with
62px native inset before the repair. After repair, all 12 owner cases (AR/EN,
Normal/Panoramic/Reader, 0/62px inset) put the button below the inset and return
to the list grid. These are simulated native insets, not installation on phone.
The canonical CSS, asset URL and service worker are mirrored selectively into
the two existing iOS web trees. No native build, Apple upload or database write.

See [[systems/Profiles-Lists]], [[13-Project-Story]], and
[[14-Feature-Coverage]].

## D-002: inconsistent post action placement

Physical feed and conversation views placed the same actions differently.
The Home-only stylesheet forces LTR and orders Like, Reply, Dislike, Save,
Share; the shared stylesheet instead inherited RTL and used a wrapping flex
row. Moving between contexts therefore moved the same command under the finger.

The shared `.lf-community-post-actions` rule now uses the same five tracks,
direction and order as Home. Existing buttons, receipts, counts, busy states,
colors, labels and click handlers are unchanged. Controlled browser CSS/DOM
checks failed before and passed after the repair in both text directions.
`qa/device-ui-regressions.cjs` additionally exercises actual list open/back.
No real reactions or notifications were sent during this audit.

## Device coverage and open evidence

Main Home/For You/Following, a conversation and keyboard recovery, Explore
browse/types/search, work detail/review/status/characters/covers, Library grid,
owner profile/followers/visitor profile, lists and notification inbox were
opened read-only. Existing content/media loaded in these sampled paths;
back navigation from a conversation preserved the timeline position.

Search returned an exact requested work but displayed partial-provider failure.
Inbox was empty; that alone proves neither deletion nor delivery failure.
Reader favorite captions appeared clipped and need an isolated populated
reproduction. An incoming phone call stopped further touches; no call was
accepted or declined. Streaming stalls were not classified as app freezes.

Release Web Inspector exposed no Lorefy targets. No live JavaScript/network
trace or native frame-time/CPU measurement was obtained. Current source and
installed build provenance differ; browser fixes do not update that binary.
Live cross-account notifications/reactions, all library modes/frame selections,
authentication, import/export, offline/resume and write persistence remain open.
No changes to Apple settings, production data, permissions or signing.

## Verification On 10 November

Final `npm test`: 3431 passed, zero failures. The initial in-progress run found
the not-yet-copied community CSS; subsequent packaging checks pass after selective
sync. Version-pinned cache assertions now name the actual cache/asset revisions,
without removing the entry/offline consistency assertions.

The final browser fixture reloads the saved layout (not just a DOM attribute):
12 owner open/back cases plus 2 CSS/DOM direction parity cases pass. No output
from these disposable demo fixtures is evidence of a real-account write.
See [the section-by-section audit](../../docs/DEVICE_AUDIT_2026-11-10.md).
