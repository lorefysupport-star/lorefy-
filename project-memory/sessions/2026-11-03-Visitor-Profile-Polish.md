---
kind: session
status: source-reviewed
date: 2026-11-03
---
# Visitor profile polish and frame activation

The shared visitor renderer used by people search no longer renders or resolves
the legacy Top 10 works block. The saved ranking contract, owner controls,
favorite works and characters, public lists, posts and library remain intact.
Real favorites replace padded slots; empty shelves have localized messages
only after loading. Grid titles use a stable two-line area. Reader's visitor
toolbar says Profile, and its text and the glass dock resolve the visited
profile palette rather than inherited viewer material.

After explicit authorization, the guarded Halloween allowlist and Reader
layout patches were executed in the Lorefy Supabase SQL editor. Read-only
verification showed six enabled IDs, Reader recognition, unchanged execute
grants, preserved auth/owner/private/block checks and a null unauthenticated
lookup. No user rows, migration-history entries, billing or RLS were changed.

Runtime assets and precache keys are synchronized in source and both existing
iOS web trees. See `docs/HALLOWEEN_INTEGRATION_2026-11-02.md` for activation
evidence. No GitHub push, native build or TestFlight upload. A physical-device
check between real accounts is still separate.

Verification: 3373 source tests and 381 local browser checks passed. The
18 visitor cases cover all three layouts, grid/spines/showcase, 320/440px,
Arabic/English, dark/custom light, and all six frames. Real demo search
opened the correct reader and returned to results. Browser fixtures verified
public/private list separation, follow, connections, library, and palette
matching without real-account changes. Logs and screenshots are in workspace
`output/playwright/visitor-profile-v691/`.

[[systems/Profiles-Lists]] | [[systems/Appearance-Bundles]] | [[09-Data-Contracts]]
