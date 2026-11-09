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

See [[../systems/Profiles-Lists]], [[../13-Project-Story]], and
[[../14-Feature-Coverage]].
