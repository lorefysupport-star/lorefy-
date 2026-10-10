# Media and Branding Handoff

Extract `Lorefy-media-and-brand-sources.zip` into the same handoff root as the project ZIP. It contains the full existing production folders, including capture inputs, compositions, titles, music, output videos and historical evidence. Do not move only `render_smooth.py`: it imports sibling-folder sources.

## Outputs and Roles

| Folder | Purpose |
| --- | --- |
| `media/lorefy-profile-promo` | First profile-customization ad; original compositor `render_promo.py`, subtitles `titles.ass`, music, captures and exported videos |
| `media/lorefy-app-promo` | First whole-app browsing edit, criticized by the user for lag; preserved as prior work and because later edit reuses its music |
| `media/lorefy-app-promo-smooth-fhd` | Latest whole-app edit; `lorefy-smooth-fahad.mp4`, preview and silent versions, raw browsing captures/timestamps, normalized clips, `render_smooth.py`, motion QA and proofs |
| `media/lorefy-brand-kit` | Existing logo/branding deliverables and supporting assets |

The latest exported whole-app video is 1080x1920, 30 seconds, 60fps; the preview is 720x1280. These values are established in the existing media verification and can be checked with ffprobe. The accepted account clarification for that capture was fahad / `@lorefy_demo`; `fhd` afterward remains ambiguous.

## Re-editing

Install Python 3, Pillow, NumPy and FFmpeg/ffprobe with libx264 and libass/font-shaping support. Preserve relative sibling folder structure. The smooth script supports stages:

```sh
python render_smooth.py prepare
python render_smooth.py motion-qa
python render_smooth.py render
python render_smooth.py export
python render_smooth.py verify
```

Run from `media/lorefy-app-promo-smooth-fhd`. Existing captures and normalized inputs are included, so there is no need to recreate screenshots to examine/edit this production. `prepare` recreates normalized footage from captured timing data; stages overwrite generated outputs in that media copy.

These scripts were authored on Windows and retain `C:/Windows/Fonts/segoeuib.ttf` / `segoeui.ttf` references for some drawing/proof tasks. On macOS/Linux, choose an available appropriately licensed font in a working copy and adjust the relevant font paths. Windows font binaries are not redistributed here. ASS subtitles also need a font with correct Arabic shaping; verify visual output rather than just successful encoding.

This handoff preserves production sources without changing their code or rerendering the videos. Existing source footage/proofs are recordings of the demo app at the time, not guaranteed identical to a future live account. `verification` beside each media output is historical media evidence, distinct from fresh project handoff tests.
