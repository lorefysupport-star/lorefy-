---
kind: repair-session
status: verified-source-and-local-browser
date: 2026-11-01
---
# Cover and chapter image delivery

## Causes and Repair

Actual Explore scroll produced25 MangaDex502s, not absent artwork. Local Node
failed TLS with UNABLE_TO_VERIFY_LEAF_SIGNATURE. The same URL fetched200,
image/jpeg,177180bytes using system trust. Loopback-only server startup now
appends OS roots to default/extra roots, with API feature detection. Certificate
and hostname checks stay enabled. No unsafe TLS override. Official reference:
https://nodejs.org/api/tls.html#tlssetdefaultcacertificatescerts

The local allowlist omitted the existing exact Kitsu/RanobeDB cover providers;
added those two hosts, not lookalikes. HTTPS, bounded response/redirect/origin
checks and raster-only media remain. No Edge Function deployment.

Chapter context queried `.lf-detail-hero > img`, but Work Studio moved the
displayed cover into `.lf-work-poster img`. Ten Berserk chapter rows had empty
src. Prefer the actual displayed poster (including owner artwork), retain legacy
compatibility, never use the decorative backdrop. Successful images restore
visibility; failed chapter-specific art returns once to the labeled work cover
without retaining its chapter marker. Trusted images also work without a proxy.

Configured HTTP(S) loopback media consumers prefer the actual local gateway;
hosted/native retain the public gateway. capacitor://localhost is excluded.
Already-mediated links stay unchanged. React covers omit referrers like DOM
portraits. No generated replacements, new service, persisted URLs or retry loop.

## Verification

Seven new regressions: five observed failing before repair, two recovery checks.
Full suite3262/3262, exit0,70140ms; cachev673 and ten matching web mirrors.
Real external requests enabled, unlike earlier CPU-only fixtures:
- All five exact screenshot MangaDex originals decoded512px,128-521ms in one
  run. Not a cold-cache/global latency guarantee.
- Fresh320px context decoded a representative from all eight formats. Timings
  varied370ms-10.27s; one Open Library novel was slow. Another earlier transient
  Open Library image recovered through real direct/proxy probes.
- Hunter x Hunter chapters1-10 displayed ten distinct trusted Fandom images
  (177-187px) and sourced title. Berserk rows displayed the actual work fallback,
  not invented chapter artwork. Both screens visually inspected.
- Existing public cloud endpoint decoded one MangaDex original512x732 in a
  read-only probe; not all-provider/native certification.

Receipts outside Git: `artifacts/image-delivery-20261101-full.log`,
`output/playwright/image-delivery-acceptance.txt`,
`output/playwright/image-formats-chapters-results.txt` and corresponding PNGs.

## Remaining

External providers can time out/remove images; missing chapter metadata is not
fabricated. Large catalog/cold-cache/live-device acceptance remains open. Local
trust repair fixes local gateway transport, not native networking. No new build,
schema/account changes, production mutation or native preparation.

[[systems/Catalog-Search]] | [[systems/Reading-Library]]
[[13-Project-Story]] | [[14-Feature-Coverage]] | [[15-Work-Control]]
