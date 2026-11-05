# Crafted Collections Artwork

Eight original bitmap collections selected by the owner on 2026-11-04:
Midnight Milliner, Lunar Gate, Living Manuscript, Velvet Proscenium,
Dawn Wayfarer, Aurora Sentinel, Stitch Garden and Thread Tales.

The approved transparent 1024x1536 PNG atlases were converted to WebP at
quality 92, alpha quality 100, without resizing. Six 512px source cells contain
the portrait surround, page material and independently articulated ornaments.
Do not replace these with third-party characters or flatten the moving parts.

The four `lorefy-crafted-*` modules own cropping, articulation, atlas loading
and shared profile geometry. `lorefy-frame-motion.js` alone schedules motion;
store thumbnails paint once, while offscreen and hidden profiles pause.

Atlases load on demand, not in the service-worker core preload. No additional
runtime package, remote artwork service, or credential is required.
