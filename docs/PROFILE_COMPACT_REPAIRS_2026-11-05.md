# Profile Frame and Favorites Repairs

## Changes

- `lorefy-profile-shop.js` reserves follower-row clearance from the measured
  avatar frame, including asymmetric artwork. `lorefy-profile-header.js` keeps
  this current after responsive layout changes; there is no per-animation
  layout measurement or scroll handler.
- Crafted photos now bleed beneath their artwork's measured inner edge. This
  corrects the empty annulus in the new elf and object frames. The protected
  face aperture used by animated foreground parts is unchanged. Original
  avatars, banners, frame art and account preferences are not replaced.
- Compact metrics use 14px icons and 17px values. Labels remain available to
  assistive technology and as row titles but are not visibly repeated. Reader
  metrics precede favorites rather than sitting below them.
- Favorite layout dimensions respect the available space above the dock.
  Showcase keeps its three works, the wooden shelf keeps seven slots, and the
  normal cover grid retains its existing behavior. Empty shelf slots share the
  same height constraint. Long biographies, enlarged text and smaller screens
  still scroll; content is not clipped to force a screenshot.
- The favorite-cover edit target stays 44px while its visible circle is 26px
  and pencil is 14px. Keyboard focus and the existing picker remain functional.
- The banner uses an alpha mask into the actual themed page wash, not an
  opaque flat-color endpoint. The same rule applies in all three layouts.

## v696 Verification Checkpoint

Source suite: **3424 passed, zero failed**. New regression coverage is in
`tests/profile-fade-cover-polish.test.js`. Historical height/version assertions
were updated to the deliberately compact geometry and current asset keys.

Browser checks, all passing:

| Scope | Checks |
| --- | ---: |
| All 43 offered frames, three layouts, 320/440px: name/count clearance and bounds | 258 |
| Eight crafted frames, 390x844 and 440x956: compact metrics and complete favorite presentations | 96 |
| Three layouts, six themes, 320/440px: alpha endpoint, page material, cover button/picker | 324 |
| Crafted owner motion/persistence plus public projection fixtures | 720 |
| Actual store, independent components and 32-pose protected-aperture/edge pixels | 31 |
| Public profiles with long names, all eight crafted frames, three layouts, 320/440px | 48 |

Total: **1477 browser assertions**, no JavaScript errors in these checks.
The 72-case alpha test waits for fonts/responsive geometry before sampling the
endpoint, avoiding stale coordinates after a viewport resize.

## v697 Populated-Profile Follow-up

A live profile exposed gaps in the preceding acceptance matrix: Reader's old
CSS hid its metric icons, and the character enhancer still inserted its section
after statistics, now ahead of favorite works. The prior icon check accepted
zero-sized SVGs, and its top-character selection was empty. The earlier counts
must not be treated as evidence that this populated ordering was correct.

Reader now composes its actual legacy favorite heading after statistics and
directly before works. The heading receives its stable class before mounting;
the enhancer previously added that class too late for React composition. Its
editor wiring supports the new sibling location. Characters always follow the
works grid, never its statistics or the nested character grid.

Compact icons and their wrappers explicitly remain visible. The standalone
heading uses auto width within the shared gutter so margins cannot create
horizontal scrolling. Showcase side covers scale by 120 percent of their own
track, not an added fixed 20px that could make them larger than the center book
in a small available space. Side-card padding no longer reverses that hierarchy.

Fresh full suite: **3428 passed**. The revised populated-profile browser matrix
passes **156 checks** across three layouts and both phone sizes. It requires
four visible 14px icons, four populated character slots after favorite works,
complete favorites above the dock, heading/page bounds, center-book prominence
and editor round-trip position. The actual open local profile was also inspected
and its favorite editor opened/closed without saving user choices.

Follow-up evidence: parent workspace `output/playwright/profile-compact-v697/`
and `profile-compact-v697-full-suite.log`. Asset keys and the offline cache now
use the v697/order revision. No user preferences were reset.

Raw results and screenshots remain outside the app/repository under the parent
workspace's `output/playwright/profile-compact-v696/`, `profile-fade-v696/` and
`crafted-integrated-20261104/`. Geometry fixtures intentionally block external
services, so unavailable external covers in those fixtures are not evidence of
an image-delivery regression or a live network test.

## v698 Reader Header and Metrics Parity

The remaining difference was structural, not a stale preview: the owner Reader
composition replaced the original header controls with a separate toolbar and
detached metrics from identity. It also retained extra frame padding and a
different banner-height formula. The previous ordering repair did not unify
these choices.

Owner Reader now retains the original banner and all four original action
callbacks. Metrics stay in identity, before tabs, with four equal columns even
at 320px. All layouts share 14px icons, centered 17px/600 values and compact tab
padding. Labels remain accessible. Header geometry lives in the header/frame
styles, not the content-refinement stylesheet. The additional Reader frame
padding remains visitor-only; the public Reader toolbar is not replaced by
owner controls. Existing Reader content below favorites is retained.

Fresh source suite: **3429 passed, zero failed**. Header parity: **108 passed**
across three layouts, 320/390/440px and dark/custom-light themes. The populated
favorites matrix again passes **156 checks**. The open user preview was visually
inspected with its saved Reader layout, peach theme, garden frame and populated
shelf; these choices were not reset. An initial fixture attempted to equip the
frame before its catalog finished loading after reload; it now waits for that
specific offered ID. This was a test-setup failure, not a successful app check.

Evidence: parent workspace `output/playwright/profile-unity-v698/`,
`profile-compact-v698/` and `profile-unity-v698-full-suite-final.log`.
The offline cache is `lorefy-v698-profile-unity`. No build, server mutation,
commit or GitHub push was performed for this local follow-up.

## Limits

Repaired web resources are mirrored to both existing iOS web trees. This is a
local source/browser checkpoint, not a physical-iPhone test, a new native build,
an Apple upload or a production database change. Installed clients require a
separately authorized release to receive the changed runtime.
