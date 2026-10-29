---
kind: session
status: source-verified-owner-device-pending
date: 2026-10-26
---
# Apple Details on the Original Normal Profile

The owner rejected both generated concept sets: retain the original layouts,
apply Apple-style details, and start with Normal. No concept was implemented.
This supersedes the attempted image-based restructuring, not the existing Normal,
Panoramic/Reader choices or the measured banner/frame repairs.

## Implementation

`styles/lorefy-profile-apple.css` is scoped to exact Normal roots. It refines
system typography, icon weight, reading values, original section tabs, control
materials and interaction states. Theme variables remain owner-authoritative.
Artwork, header/portrait geometry, frames, section order, saved reading data,
favorites modes and list-envelope designs stay in their original components.
No JavaScript storage/mutation handler or native shell was edited.

The existing four-book public library preview inherited a seven-book wooden
board width. Its board now follows its own container, preserving book geometry.
Opaque/color-mix/blur fallbacks and reduced-motion-safe control feedback are
scoped locally; existing frame animations remain untouched.

## Verification

[QA](../../docs/NORMAL_PROFILE_APPLE_QA.md):2580/2580 full tests, exit0; seven
new regressions.12 owner Normal cases,24 unchanged other-layout cases and6 local
decorated visitor cases cover Arabic/English, themes and320/390/430px widths.
Media anchors/URLs remain; custom owner colors persist. Tabs/keyboard and saved
data invariance passed. The four-book board fixes the reproduced320px overflow.
Native phone-preview iframe loads the new stylesheet. Three runtime web files
match both existing mirrors (six hashes), without native prep/build.

No GitHub push, build, Apple upload, production service or account mutation.
Owner visual approval, the other two layouts' detail passes, physical-device
testing and actual artwork upload/save remain separate gates. The empty owner
demo's intercepted avatar activation is retained as an unverified input follow-up,
not declared repaired by this presentation-only change. Raw captures stay outside
the repository/vault.

Related: [[systems/Profiles-Lists]], [[playbooks/Apple-Interaction-Quality]],
[[2026-10-24-Banner-Repairs]], [[13-Project-Story]], [[14-Feature-Coverage]].
