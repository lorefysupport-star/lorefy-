# Full custom app themes

## Change

Custom appearance now builds a complete chromatic palette rather than a near-neutral surface with an accent color. Page backgrounds, cards, fields, navigation, sheets and headers carry visible shades of the selected color. Dark variants retain the hue while bounding surface luminance; light variants use distinct tinted surfaces. Readable text and action colors are recalculated against all shared surfaces.

The dark orange example changes its page background from `#16110e` to `#63371e`, its card/navigation surface to `#7a4325`, and its fields to `#914f2c`. The exact selected color `#df7134` remains in the saved theme value.

Legacy dark fields and headers had fixed neutral paint. Custom-only CSS rules now map those surfaces to the same shared tokens. Existing Light, Dark and Pink presets are unchanged. Cover artwork, avatar frames and independent semantic error/success colors are not recolored.

## Verification

- Failed regression test first demonstrated the original nearly neutral orange page background.
- Palette regression covers visible hue across page, card, field, soft fill, selected, navigation and bar surfaces, plus surface separation for white, black and yellow.
- Existing contrast tests exercise 224 color samples in both light and dark variants.
- Browser navigation checked Home, Library, Explore and Profile: all used the orange page background, the tinted navigation surface and no horizontal overflow.
- Verified the native picker, an orange light variant, a blue dark variant, the previously black hex field, the Library header, and persistence after reload. Preview remains iPhone 16 Pro Max.
- Browser evidence is in `qa/full-color-*.png` and `qa/full-color-pages.json`; full test output is in `qa/full-color-theme-test-results.txt`.
- Regenerated and copied the iOS web bundle. No physical iOS device test or production deployment was performed.
- Final full regression suite: 950 tests passed, zero failures.

The preference continues using device-local `lorefy.ui.theme.v1`; its storage format and profile/account records are unchanged.
