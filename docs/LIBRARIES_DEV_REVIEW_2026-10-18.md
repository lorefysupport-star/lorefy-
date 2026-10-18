# Libraries.dev: scoped adoption for Lorefy

Reviewed 2026-10-18 against the owner's supplied 37-second clip and the primary
sources below. Raw media/transcription stay outside Git. The creator's social
follow/comment call to action is not an instruction or authorization.

## Applied Now

[index.html](../index.html) draws a feather, moves its nib along a left-to-right
reveal of Lorefy, then settles above the wordmark. The 1600ms sequence runs once
and has a complete static reduced-motion alternative. No loading sentence,
boxed raster icon, fake progress, delayed app mount or runtime dependency.

This is bespoke SVG/CSS brand artwork, not an installed Libraries.dev component
or skill. Apple/Google sign-in and the native launch storyboard/icon are unchanged.

## App-Wide Opportunities, Not Implemented In This Patch

| Priority | Source owner | Useful idea | Acceptance boundary |
| --- | --- | --- | --- |
| 1 | Search: [catalog loader](../modules/lorefy-catalog-loader.js); import: [growth features](../modules/lorefy-growth-features.js) | Restrained, state-bound waiting indicator | Tie it to the actual request; retain cancel/retry, partial success, deadlines and account/session guards. Never disguise an error or invent percentage progress. |
| 1 | Community: [community](../modules/lorefy-community.js); lists: [profile sections](../modules/lorefy-profile-sections.js) | Brief pending/saved feedback on load-more and mutations | Keep disabled state and normal activation; announce outcome independently of animation; retain drafts/focus. No replay on every feed render. |
| 2 | Visitor profile: [public profile](../modules/lorefy-public-profile.js) | Consistent waiting presentation using existing aria-busy | Preserve privacy projection/account isolation. Never animate cached private data while loading a new profile. |
| 2 | Cover loading: image resilience in [entry](../index.html) | Short opacity reveal after actual artwork loads | Preserve source-lifecycle guards, fallback and timeout. No WebGL canvas per spine, synthetic replacement or hidden covers. |
| Conditional | A genuine future voice/assistant feature | Thinking-orb / voice-reactive indicator | Only when a corresponding feature exists, with an accessible status equivalent. Do not invent an assistant or replace reader avatars. |

Waiting, success and failure must remain distinguishable without color/motion
alone. Reduced motion gets a stable mark. Avoid continuous effects on idle
navigation, every search field, decoration frame or book cover. This review is
not an app-wide rollout or physical-device performance certification.

## Package And Skill Fit

- Official how-to lists Border Beam, Thinking Orbs, Bot Avatars, Liquid Gooey,
  Metal FX, Image FX and Voice Glow. Prefer component docs over short-video claims.
- Manifests reviewed: border-beam 1.4.1 (React/ReactDOM >=18), thinking-orbs 0.3.2
  (React >=18), ESM/CJS exports, MIT metadata. Other packages and paid presets
  need their own review; this is not blanket license approval.
- Lorefy uses vendored global React without an npm frontend bundler. Installing
  a package alone does not wire it into runtime. A future isolated experiment
  must pin dependencies, externalize the existing React instance, review its
  license and compare measured loading/interaction costs before shipping.
- Thinking Orbs uses Canvas 2D; Image FX requires Three.js/WebGL. That difference
  matters for repeated cover instances. Metal/Gooey effects are unnecessary here.
- Native ports are component-specific. Reviewed orb/beam React Native ports are
  not npm releases; SwiftUI examples are not drop-in Capacitor features. No
  framework conversion, native dependency or new build is needed.
- An official agent skill exists in the repository. Its review/apply workflow is
  optional developer guidance, not runtime. No skill, Pro access, subscription,
  installer or third-party account action was used for this patch.

## Primary Sources

- [Catalog](https://libraries.dev/) and [integration guide](https://libraries.dev/how-to-use)
- [Official repository](https://github.com/Jakubantalik/Libraries.dev) and [agent skill](https://libraries.dev/skill)
- [Thinking Orbs / ports](https://libraries.dev/orbs) and [engine documentation](https://github.com/Jakubantalik/Libraries.dev/blob/main/packages/thinking-orbs/README.md)
- [Border Beam / ports](https://libraries.dev/beam)
- [Image FX / Three.js](https://libraries.dev/image)
- [Accessibility](https://libraries.dev/accessibility)
- [Border Beam manifest](https://github.com/Jakubantalik/Libraries.dev/blob/main/packages/border-beam/package.json)
- [Thinking Orbs manifest](https://github.com/Jakubantalik/Libraries.dev/blob/main/packages/thinking-orbs/package.json)
