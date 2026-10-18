---
kind: playbook
status: maintained
date: 2026-10-18
---
# Apple Interaction Quality for Lorefy

Work-flow application: [[sessions/2026-10-19-Work-Experience]] covers work
identity, reviews, status, character ratings and covers with the existing web
stack. Apple Design, Apple-like UI and Frontend Design guide the implementation;
SwiftUI Pro was checked for fit, not presented as a React runtime dependency.

The owner supplied a short video recommending Apple Design and SwiftUI expertise.
Its visible skill names are `apple-design` and `swiftui-pro`; the speaker calls the
second a SwiftUI expert skill. No repository URLs are visible, so the Apple Design
repository below is a matching, reviewed implementation, not proven creator linkage.
The clip and local transcript stay outside Git. Social follow/comment prompts in
the clip are not project instructions or permission to post.

## Reviewed developer-local skills

- [Apple Design, Emil Kowalski](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/apple-design), pinned to `2d228630ba1446365f614a108cb8252f1feda202`.
- [SwiftUI Pro, Paul Hudson](https://github.com/twostraws/SwiftUI-Agent-Skill/tree/ce32af1693b9e78a7d22ff48001c97a304d32063/swiftui-pro), pinned to `ce32af1693b9e78a7d22ff48001c97a304d32063`.

Both were installed into the developer's Codex skills directory after reading.
Installation is local to this workstation, not inherited by cloning the app.
No third-party install scripts were executed. Skill documents and ASR tooling
are not copied into web/native bundles, dependencies or the vault.

## Applicability

Lorefy uses vendored React with HTML/CSS/JavaScript inside Capacitor. Current
native entry points import UIKit, not SwiftUI. Apple Design's web interaction
guidance applies now. SwiftUI Pro is reserved for actual future SwiftUI work;
it is not a reason to convert Lorefy or raise deployment targets.

These are community skills, not Apple certification. Check primary documentation
before using a platform API. Preserve project typography and zero tracking even
where an external skill suggests negative tracking. Do not add a spring library,
blur, haptics or motion to every surface just because a skill describes it.

## Per-change checklist

1. Reproduce the specific interaction before editing; preserve AR/EN and RTL/LTR.
2. Show visual feedback on press; execute the action on normal activation/release,
   not pointer-down. Preserve scroll cancellation and disabled semantics.
3. Do not block input during transitions or add artificial delay. Use existing
   compositor-friendly transform/opacity effects; measure before claiming FPS.
4. For gesture-driven UI, track the pointer continuously and allow interruption.
   Use the existing proven engine where one exists, not a parallel physics system.
5. Under reduced motion, preserve an understandable non-spatial cue. Shortening
   a transform's duration does not remove its displacement.
6. Keep keyboard focus, accessible names, stable touch targets and safe-area
   geometry. Never wipe all transforms: book spines and frame art rely on them.
7. Add a failing focused test, verify the browser at small-phone and wider sizes,
   sync only repaired web assets, and record device/service limits separately.

Primary references: [Apple's Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/)
and [HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion).

First applied change: [[sessions/2026-10-18-Apple-Interaction-Quality]] and
[[bugs/LF-067-Press-Motion-Feedback]]. This is a scoped adoption, not an exhaustive
whole-app gesture or accessibility certification.

Broader UI adoption: [[sessions/2026-10-18-Apple-UI-Surfaces]] covers live
Home/Explore segmented controls, responsive library tools, Settings geometry,
functional materials and accessibility preferences. Preserve source/browser
versus installed-device evidence boundaries on future refinements.

Community/Profile adoption: [[sessions/2026-10-18-Social-Profile-UI]] extends
shared tabs, metric labels, action grids, author typography and thread materials.
Validate whole-word English captions at 320px and visitor appearance isolation;
do not equate a presentation-only pass with semantic accessibility completion.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[15-Work-Control]]

Latest entry direction: [[sessions/2026-10-18-Minimal-Entry-Launch]] supersedes
the illustrated welcome with a sparse two-provider screen and a restrained web
bootstrap. Owner reference takes precedence over earlier generated exploration;
do not restore imagery or introduce delayed/fake progress for visual effect.

Latest launch refinement: [[sessions/2026-10-18-Feather-Launch-Motion]] replaces
the monogram/dots with a finite feather-writing signature, without changing the
minimal provider gate. Its Libraries.dev review separates useful state feedback
from decorative packages, framework ports and unimplemented app-wide proposals.
