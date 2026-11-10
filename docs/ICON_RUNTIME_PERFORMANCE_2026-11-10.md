# Icon runtime loading receipt

## Change

The startup entry previously downloaded the 625,632-byte readable Lucide library.
`tools/build-lucide-runtime.js` now deterministically produces a 358,402-byte
runtime with pinned, development-only Terser 5.49.2. All 1,743 icon/alias keys,
glyph descriptors, export order, alias references and frozen icon map are retained.
There is no icon subset, property mangling, upstream library replacement or new
browser dependency. The ISC license and Lorefy's scoped hydration patch remain.
Generated runtime line endings stay LF in every copy, including Windows checkouts;
generation is identical from CRLF and LF canonical input.

`vendor/lucide.js` remains the canonical build input. Both native asset copies
ship only `vendor/lucide.runtime.min.js`; preparation regenerates it before copying.
The entry stays synchronous before the React adapter. Offline core and cache v704
point at the versioned runtime. No native binary was built or distributed.

## Verification

- Six regression cases failed before implementation; all six now pass.
- Full source suite: 3,458 passed, zero failed/cancelled/skipped, 73.06 seconds.
- Focused runtime, hydration and package suite: 21 passed.
- Exact parity checks cover every icon/alias descriptor and all 1,746 export keys.
- Browser Home before/after: 117 SVG elements, zero unhydrated placeholders in both.
- Actual browser clicks opened the composer, Profile and Settings and returned Home.
  The composer had five SVGs, Settings 75, and neither had pending placeholders.
  Sampled console contained no errors. No post, rating or account setting was saved.

## Measurements And Limits

Same local server/demo, HTTP cache disabled, first 15 seconds, no CPU/network
throttling. Decoded icon asset: 625,632 -> 358,402 bytes, down 42.7%.
Decoded JavaScript loaded by Home: 6,446,671 -> 6,179,441 bytes, down 267,230 bytes.
These are payload measurements, not a claim of equivalent latency improvement.
Native-device launch, field INP/CLS, real account/network performance and the wider
startup/community plan remain unverified or unfinished.

Evidence outside the repository:
`artifacts/chapter-runtime-20261110/icons-before.json`, `icons-after.json`,
`icons-focused.txt`, `icons-full-tests.txt`, `icons-composer-after.png`,
`icons-settings-after.png` and `icons-home-after.png` in the parent workspace.

An existing Profile overview wrapper also resolves to the accessible name
"الرئيسية", alongside the navigation button. The navigation-scoped selector is
unambiguous; correcting the nested interactive semantics is a separate UI task,
not part of this representation-only change.
