---
kind: repair-session
status: source-browser-and-projection-verified-device-pending
date: 2026-11-15
---
# Public Favorites Presentation

Follow-up: the owner requested every display mode. The browser matrix now
includes the pre-existing List (`shelf`) mode as well:600/600 cases pass,
576 visitor and24 owner cases. No additional application code was changed.
The new startup video is a separate render-boundary investigation; it is not
resolved or certified by profile layout checks.

The owner's Showcase choice was stored correctly, but the deployed
`get_public_profile_appearance(uuid)` recognized only `spines` and `shelf`,
turning `showcase` into `grid`. The additive migration
`20261114221907_public_profile_showcase.sql` patches that allowlist only,
refuses unfamiliar bodies and preserves auth, private-profile, both blocking
directions, function security and execute grants. Seven PGlite runtime tests
cover all four modes, raw/JSON-encoded storage, invalid values and access guards.

After explicit approval and local tests, the exact guarded patch was applied
in the production SQL editor. Read-only verification under a distinct viewer
claim returned `showcase` for both saved and projected mode. Anonymous execute
remains false, authenticated execute true. No user rows, RLS, credentials,
function grants or migration-history rows were changed. The local migration is
idempotent for a later managed deployment. The failed connector handshake was
not evidence of an unavailable database; the existing authenticated UI worked.

The visitor shelf separately reserved seven columns even for fewer real works,
lost width to a second gutter, inherited the library cover's7px bottom margin,
and the Reader layout overrode bottom alignment. The public renderer supplies
the resolved real count, capped at7. Public shelf geometry uses available width,
centers bounded spines and removes the cover margin. Shared owner seven-slot
geometry, cover/Showcase modes, actual images and all open actions remain.

Before repair,12 of36 browser cases failed. After repair,450 cases passed:
432 visitor cases across3 layouts,3 views,1/3/4/7 favorites,320/440px,AR/EN and
dark/light/custom-light themes;18 owner layout/view/width cases retain all7
saved favorites. Full source suite3618/3618 passed,0 failures,107.108s.
Source syntax and12 SHA256 comparisons confirm the six repaired assets match
both existing native web mirrors. Cachev721 invalidates repaired presentation.

Browser scripts and anonymous fixture results are local QA, not a physical
iPhone performance or native-release certification. The production projection
fix is live; CSS/renderer fixes require the updated web source or a future
native binary. No native build, upload or distribution was requested/performed.
Raw screenshots and account-specific SQL receipts remain outside Git.

Sources: [public renderer](../../modules/lorefy-public-profile.js),
[visitor styles](../../styles/lorefy-public-profile.css),
[shared shelf](../../styles/lorefy-book-showcase.css),
[Reader mode](../../styles/lorefy-reader-layout.css),
[SQL regressions](../../tests/profile-appearance-sql-runtime.test.js),
[browser matrix](../../qa/profile-display-browser.cjs).

[[systems/Profiles-Lists]] | [[09-Data-Contracts]] | [[13-Project-Story]] | [[14-Feature-Coverage]]
