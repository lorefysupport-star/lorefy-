---
kind: session
status: source-browser-verified-device-pending
date: 2026-10-25
---
# Compact Frame Headers and Visible Side Motion

Follow-up to [[2026-10-25-All-Frame-Restoration]]. The owner rejected the tiny
repeated rail texture, a strip crossing the crest, and almost-static side motion.
A first full-width crest revision was also rejected: the bunny covered the banner.
The final requested direction is a smaller intact ornament in the free space above
the banner, with clear buttons and a moving, connected perimeter.

## Final Local Behavior

- The 15 existing packs with real page art retain their source side/footer art in
  a connected bitmap skin, instead of repeating a small rail texture many times.
- The complete top ornament is cropped separately using the source alpha extent.
  It keeps its natural aspect ratio and fits a centered toolbar slot, at most
  166px wide and 56px high. Two material connectors stop at its ends; no strip
  crosses the face. The old large full-width crest is superseded.
- Below 380px, the ornament has a separate compact row under the buttons and
  above the banner. Cover height includes this extra row, preserving image room.
- Side deformation has meaningful travel, not only subpixel displacement. All
  39 catalog IDs pass a minimum 4px side-travel regression over their loop.
- Eye blinks remain local to the compact crest; PFP articulation and portrait
  masks are retained. Tall page textures can use a 1024px cached skin, while
  existing avatar/elf bitmap defaults stay at 512px.
- IDs, prices, offered/hidden membership, source images, saved decoration parts
  and remote services are unchanged. No extra plugin or package was needed.

## Verification

- Latest full source suite: **2479 passed, zero failed**. Focused frame/header/
  elf/atelier tests: 61 passed. Regressions were observed failing before fixes.
- Final browser matrix: 39 restored frames x 3 layouts x widths 320/440 =
  **234 cases**, no name/bio overlap, horizontal overflow, missing motion canvas,
  or out-of-viewport PFP frame. Small cases are Arabic/light, large English/dark.
- Actual demo-owner profile was switched through normal, panoramic and reader
  using its customization UI at widths 440 and 320. Paired large screenshots
  show changed pixels on all four page edges in each layout, not only an
  advancing animation counter. Small-owner screenshots were also reviewed. The
  previous reader selection and Ribbon Bunny frame/page were restored/retained.
  Only local demo settings were changed during this test; no real account write.
- Raw screenshots, matrix results and source-suite log are outside the repository
  in this chat's artifacts directory (`connected-*`, `frame-connected-tests.txt`).
- Five changed runtime files are byte-mirrored into both native web source trees.
  Service-worker cache: `lorefy-v584-compact-frame-crest`.

The earlier 306-case run is historical and does not validate this final geometry.
Device FPS, memory/thermal behavior, real-account behavior and visual acceptance
remain separate checks. No GitHub push, native build or distribution was performed.

[[systems/Appearance-Bundles]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
