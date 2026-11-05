# Approved Frame Integration

## Scope and Source

The approved four object frames, two expressive elf frames and two crochet
frames now belong to the actual shop. Existing collections, billing gates,
avatars, banners and saved layouts remain intact.

| Collection | IDs (prefixed with `crafted-`) |
| --- | --- |
| Objects in Motion | witch, moon, ink, theatre |
| Expressive Elves | dawn, dusk |
| Crochet Stories | garden, patchwork |

The strict catalog is `launch/decorations/crafted/collections.json`. Four
`modules/lorefy-crafted-*` files handle atlas cropping, articulation, loading and
geometry. The existing shop and scheduler handle component selection, scoped
save/remove, visibility and motion. Static cards paint once; no private loop or
new runtime dependency. Avatar and page components can be mixed independently.

The transparent 1024x1536 WebP atlases total 2,320,268 bytes, down from 15,647,229
PNG bytes without resizing. They load on demand, not in the service-worker core
preload. Header joins use shared endpoints and the existing toolbar-safe slot.
Portrait placement follows each approved aperture, not a generic circle size.
See [art provenance](CRAFTED_FRAMES_ARTWORK.md).

## Verification

- Full source suite: 3416 passed, zero failed.
- Eight new runtime tests and twelve isolated PostgreSQL projection tests.
- Profile matrix: 720 checks; 96 owner cases and 24 public fixtures; all three
  layouts, 320/440px, dark/pink, Arabic/English; no JS or asset errors.
- Moving/nonblank canvas pixels, media preservation, name clearance, follow-button
  hit testing, pointer-free overlays, reload persistence and removal checked.
- Actual store: 31 checks passed, including all eight preview/apply commands,
  family filters, separate components and removal. Each frame passed a 32-pose
  protected-portrait and unclipped-edge pixel check.
- Runtime resources selectively mirrored to both existing iOS web trees.

Raw evidence remains outside the repository in the parent workspace's
`output/playwright/crafted-integrated-20261104/`: `results.json`,
`store-results.json` and screenshots. The full test log is alongside that folder.

## Authorized Server Update and Limits

After explicit approval and the isolated SQL tests, the guarded SQL from
`supabase/migrations/20261104184233_crafted_profile_artwork.sql` was executed in
the existing Lorefy project's SQL Editor. The current function was inspected
beforehand. Read-only verification then showed all eight IDs enabled with auth,
owner, private-account and both block guards retained. Execute grants stayed
postgres/authenticated/service_role; no anonymous access was added. Earlier free
packs and purchase checks remain. No user rows, migration-history records,
billing settings or secrets changed. The patch is idempotent and fails closed
against an unfamiliar function definition.

Source/browser/server-definition verification is not physical-device or live
two-account UI acceptance. Older installed clients still need a separately
authorized release. No native build, Apple upload or GitHub push was performed.
