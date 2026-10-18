---
kind: session
status: source-verified-device-pending
date: 2026-10-18
---
# Video recommendations: installed skills and first application

## Scope and provenance

The owner's clip recommends Apple-informed design and SwiftUI expertise,
especially immediate tap response, natural motion and interaction detail.
It was reviewed and transcribed locally; no private video/audio was uploaded.
Two reviewed, pinned skills were installed developer-locally using Codex's
installer. Exact repositories and scope are in [[playbooks/Apple-Interaction-Quality]].
The clip does not expose source URLs, so matching names are not proof of the
creator's exact repository choice. Local installed SKILL hashes match the
reviewed downloads. Skills are available for discovery on the next Codex turn.

## Applied to Lorefy

- [AGENTS](../../AGENTS.md) routes future UI work to the playbook and applicable
  skills. Obsidian links the rationale to the actual repair rather than claiming
  to execute code autonomously.
- The current native shell imports UIKit and contains no SwiftUI views. There
  was no stack migration, new UI library, dependency update or deployment change.
- [[bugs/LF-067-Press-Motion-Feedback]] fixes a reproduced static scaling cue
  that survived reduced motion, plus delayed press feedback on core controls.
- [Shared CSS](../../styles/lorefy-design-system.css) owns the bounded effect;
  [tests](../../tests/apple-press-feedback.test.js) lock the disabled exclusions,
  immediate response, reduced-motion override and entry/cache references.
- The selected art, banners, avatar, shelf and reading-data policy are unchanged.

## Verification, 18 October

- Three focused tests failed before implementation and passed after it.
- 57 focused tests passed, including frame geometry and rating-first completion.
- The first full run found one stale generated CSS copy (2109 pass, 1 fail).
  After selectively syncing CSS, index and service worker to both native web
  directories, all six SHA-256 comparisons matched and **2110/2110 passed**.
- Browser at 375x812: ordinary active state has opacity .76, scale .97 and
  transition 0s. With reduced motion, opacity remains .76 and transform is none;
  release restores opacity 1 and transform none. Checked AR/light and EN/dark.
- Settings/language and Library/Profile navigation worked using ordinary clicks.
  No horizontal document overflow at 375, 768 or 1280 CSS pixels. No browser
  error entries were recorded during this scoped run.
- Raw screenshots, ASR environment and test logs remain outside Git under the
  conversation's `artifacts/video-skills-20261018/` folder.

This is source/browser evidence, not physical-iPhone, VoiceOver, measured FPS,
all-gesture or production-service certification. No build, EAS, IPA, Apple upload,
database change, signing-key change or runtime AI component was created.

[[13-Project-Story]] | [[14-Feature-Coverage]] | [[18-Progress-Handoff]] |
[[systems/Appearance-Bundles]]
