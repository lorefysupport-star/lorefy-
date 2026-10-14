---
kind: decision
status: accepted
date: 2026-10-13
aliases: ["إطارات", "بنرات", "بروفايل"]
---
# Shared Profile Frame Geometry

## Why

PNG transparent margins, independent insets and stretched raster bands produced
pack-dependent headers, distorted ornaments and broken footer strips. User
iterations selected connected frames, compact headers and normal navigation.

## Accepted rule

- Decorated owner and public profiles share a 66px banner-image start and 16px controls, plus the computed native inset.
- Originals use a 64px ribbon line. Preserve crest/ear proportions, bounded central space, narrow side rails and real corner artwork.
- Owner settings/theme are left; decorations/notifications are right with an 8px gap. Keep the center clear for animals.
- Source cover height is reduced with the banner offset, preserving image height.
- Keep the normal navigation position, matching bottom art and a clean home-indicator gutter. Opaque backing also applies to legacy decorations.
- Cleanup clears inline layout offsets even after an old border detaches.
- Preserve actual media, favorite books and shelf. No concept-art book replacement.
- Plain undecorated profiles keep their established presentation.

## Evidence and maintenance

Source commit: `716da60`. Historical acceptance includes all 39 supported
collections and search-to-profile navigation. Revalidate after changes.
Supersedes the detached toolbar, raised-navigation and pack-specific-header experiments.

Sources: [geometry documentation](../../docs/FRAME_GEOMETRY_20261012.md),
[frame renderer](../../modules/lorefy-frame-motion.js),
[shared CSS](../../styles/lorefy-frame-motion.css).

[[00-Home]] | [[playbooks/Profile-Frames]] | [[05-Verification]]
