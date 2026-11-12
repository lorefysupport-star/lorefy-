# Theme contrast and material continuity

## Scope

Source-only v711 repair for light, dark, pink and custom palettes. No artwork,
reading state, review data, frame geometry or layout composition was changed.
No native build, Apple configuration or production database mutation.

## Causes and repairs

1. Semantic warning/success/rating colors inherited the base palette even when
   custom surfaces changed. The shared palette now adjusts foreground luminance
   against bg/card/field/fill2/accentSoft, preserving colors already readable and
   selecting a matching black/white action label.
2. Standard dark was excluded from the custom material bridge. Returning from a
   custom theme could retain old literal aliases while cinematic pages selected
   their own fixed colors. All themes now export and consume the same aliases.
3. Backdrop-safe glass ink existed but chrome used opaque-page ink instead.
   Navigation, segmented controls, search fields and work-editor controls now
   consume glass-specific primary/secondary/muted/action tokens. Destructive
   selections and primary buttons retain explicit foreground/background pairs.

## Verification

- Full `npm test`: 3516 passed, zero failures, on 2026-11-12.
  Repeated after session resume on 2026-11-13: 3516 passed, zero failures.
- Four new regressions in `tests/theme-contrast-unity.test.js` cover 135 theme
  modes: the three presets, a 64-color RGB grid in both bases, plus two additional
  non-grid colors in both bases.
- Tested semantic foregrounds meet 4.5:1 against the five owned solid surfaces;
  sampled glass foregrounds meet 4.5:1 against four modeled backdrop/glare cases.
  This is numerical token coverage, not a claim about every composited pixel.
- Browser checks: light Profile/Reader, Home, Library and Explore; pink
  Profile/Reader, Library and Explore; custom light black Profile/Reader and Home;
  custom dark white Profile/Reader and Work; standard dark Profile/Normal, Home,
  Library and Explore. Then dark Panoramic, dark Reader and custom light peach
  Reader were inspected. Total: 18 route/theme/layout observations.
- Composer text/placeholder and review zero-dislike/primary-button states were
  checked without publishing a post or review. No reading records were altered.
- Root/app action aliases agreed in inspected pages. Mobile checks at CSS390
  showed no horizontal document overflow. Screenshots are local artifacts outside
  Git under `artifacts/theme-contrast-20261111` in the parent workspace.
- Original Arabic / Reader / Showcase / custom light peach preferences restored.

## Limits

The DOM text scan skips gradient ancestors and is not comprehensive contrast
evidence. Numerical surface sampling and visual browser checks are the evidence
above. Physical iPhone, VoiceOver, full accessibility conformance, all arbitrary
artwork backgrounds and production service delivery remain separate acceptance
work. Source mirrors do not mean this change is installed in TestFlight.
