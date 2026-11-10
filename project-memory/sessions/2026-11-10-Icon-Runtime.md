---
kind: repair-session
status: source-browser-verified-device-pending
date: 2026-11-10
---
# Complete icon API with a smaller startup runtime

[Receipt](../../docs/ICON_RUNTIME_PERFORMANCE_2026-11-10.md) continues the
owner-approved startup plan after [[sessions/2026-11-10-Chapter-Runtime]].
Pinned dev-only Terser generates the full icon API from the preserved patched
canonical source. No new browser dependency, icon subset or hydration rewrite.

Asset625,632 ->358,402 bytes; first15s Home JS6,446,671 ->6,179,441 bytes.
Six RED-to-GREEN cases compare all1,743 glyph/alias keys, exports, references,
DOM creation, scoped hydration, deterministic generation, budget and packaging.
Full3458 and focused21 pass. Actual browser composer/Profile/Settings navigation
retained SVGs with zero pending placeholders and no sampled console errors.

Cachev704 and both native asset copies use the generated runtime. No native build,
device update or live-service mutation. Payload reduction is not a latency claim.
An existing Profile overview wrapper has duplicate navigation naming/nested
interactive semantics; record it for the later UI pass rather than hiding it.

[[systems/App-Boot]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
