# Custom appearance and frame fit

## Changes

- Repaired the Bunny Hug source artwork: its ear tips were already truncated in the exported PNG. The old export remains unchanged as a reference.
- Added explicit aperture calibration (centre and diameter) to imported frame metadata. The corrected art is centred on the portrait, not on the full image bounding box.
- The motion canvas masks the calibrated portrait aperture so particles cannot paint over the user's picture.
- Custom appearance uses the existing device-local `lorefy.ui.theme.v1` preference. Values are `custom-light-rrggbb` or `custom-dark-rrggbb`; existing Light, Dark and Pink values retain their behavior.
- Native color input, hex input, suggested swatches and separate light/dark background controls are available under Settings > Appearance & personalization. Apply confirms the draft; invalid colors and failed storage do not change the active theme.
- The exact selected color is retained. Action and text colors can be adjusted for legibility against their backgrounds. Normal, muted and action text are tested at 4.5:1 on the shared surfaces, using the WCAG relative luminance calculation. This is not an app-wide accessibility certification.
- Quick light/dark changes retain the custom color; storage events synchronize open tabs. No account profile or reading records are modified.

## Future Frame Contract

1. Export complete artwork with transparent breathing room. CSS cannot restore pixels already cut from the source.
2. Run `powershell -File tools/check-frame-art.ps1 -Path path/to/frame.png`. Review any nontransparent boundary pixels before release.
3. Supply normalized `geometry: {cx, cy, size}` measured from the transparent portrait aperture. The validator bounds the diameter and requires a minimum 2% aperture margin inside the canvas.
4. Use the shared calibrated overlay and motion renderer, not a fixed offset relative to a presumed centred image.
5. Check rendered outer bounds and overlap at small and large mobile widths. Transparent source padding alone does not prove that an oversized frame fits the page.

## Verification

- Browser checks at 320x740, 375x812, 390x844 and 440x956: corrected ears visible, avatar decoration fully inside the viewport, no profile horizontal overflow.
- At 320px: custom color controls fit without horizontal overflow. Library and Explore use the selected theme.
- Native color-input updates, manual hex entry, draft/apply separation, invalid input rejection, light/dark variants, extreme white/black/yellow colors, quick toggle and reload persistence were exercised in the browser.
- Color tests cover 224 RGB samples on both background modes and check shared body, muted, selected and action surfaces plus pressed action contrast.
- Evidence: `qa/custom-frame-fit.json`, `qa/bunny-frame-{320,375,390,440}.png`, `qa/custom-appearance-controls.png`, `qa/custom-appearance-320.png`, `qa/custom-appearance-library.png`, `qa/custom-appearance-explore.png` and `qa/custom-appearance-test-results.txt`.
- iOS runtime assets were regenerated and copied. No physical iPhone or Safari test was performed on this Windows host.
- Full regression suite: 948 tests passed, zero failures. The corrected 1254x1254 PNG has zero nontransparent edge pixels. This host blocks standalone PowerShell scripts, so its edge scan was run as a read-only inline command without changing execution policy.

## Boundaries

PFP Vibes imports, including the repaired Bunny artwork, remain local-demo assets behind `decorationLab=1`. They are not part of the live/native release. Five other prototype exports touch their image boundaries; they must be reviewed/repaired before any future release. This turn fixes the requested Bunny export, not every externally exported image. Original Lorefy bundles remain available normally.

The app color preference is saved on the current device, not synchronized to the user's cloud account. It does not change another reader's public profile.

Contrast reference: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
