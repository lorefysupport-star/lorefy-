---
kind: session
status: in-progress
date: 2026-10-22
---
# Sequential local redesign: profile first

Owner requests an actual Apple-inspired redesign, one section at a time, with
UI/UX Pro Max. Explicitly no GitHub push. This supersedes historical automatic
push instructions for this work. No native build or service writes.

Design contract: [MASTER](../../design-system/lorefy/MASTER.md).
Local gate: [module](../../modules/lorefy-local-redesign.js).
Profile-only presentation: [stylesheet](../../styles/redesign/profile.css).

First iteration rearranges reading metrics into readable individual items,
replaces compressed favorite spines with full cover grids and visible editing,
and gives lists a single-column reading order. Existing artwork, handlers,
storage, privacy and account ownership remain in place. The baseline remains
available without redesign=profile; non-local hosts cannot activate it.

Browser evidence: Arabic 390px light/dark, 320px narrow inspected. Favorite
editor opens; lists switch and hide favorites after cascade repair. Existing
profile/list focused suite: 30 passed. This is a draft, NOT completion of the
whole profile or app. No device or production verification is claimed.

Next within profile: visitor parity, complete profile/list/character editor
redesign, EN/RTL and large-screen matrix, empty/error states and decoration
variants. Do not start library while this section is still in progress.

[[13-Project-Story]] | [[systems/Profiles-Lists]]
