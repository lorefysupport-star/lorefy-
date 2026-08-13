# Lorefy beta launch checklist

This checklist describes the remaining production work. The local preview is
not a payment integration and must not be treated as one.

## Audit snapshot: 2026-07-22

- Local server is serving the audited build on `http://127.0.0.1:8793/`.
- Automated suite: `77 passed, 0 failed`.
- Bundled catalog: `22,469` source rows; identity organization removes `1,086`
  duplicate records before the app indexes the library.
- Expanded API catalog: `500` unique works are available in each of the eight
  supported sections, with pagination verified across all five pages.
- Media identity: stable MAL and Open Library identifiers now use only their
  work-scoped cover endpoints; title-only providers are reserved for records
  without a stable identifier. Missing direct covers remain eligible for the
  existing generated/API fallback.
- First paint: the latest seeded mobile UI smoke check rendered `126` image
  nodes on home with `0` broken images in the visible viewport after the
  fallback window; the One Piece detail route rendered `6/6` without a broken
  visible image. Character and cover galleries keep pagination while bounding
  the initial render.
- Theme persistence: the direct profile theme control switches the app shell,
  persists `dark` in local storage, survives internal navigation, and survives
  a full reload on the seeded local preview.
- Share media: the local image proxy accepts the work-scoped Wikimedia and
  Fandom image hosts used by literary casts. The current environment blocks
  outbound upstream media requests, so the latest proxy probe returned
  `fetch failed`/`502`; this is an external verification gap, not a passed
  delivery check. Repeat the live Kili/Gandalf probes from an unrestricted
  network before beta. Literary cast discovery is capped at `300` rows per work
  and image hydration is limited to four concurrent requests.
- Supabase project `qsroxmltioxqozmykens` is currently `INACTIVE`; accounts,
  server entitlements, deletion, and real checkout cannot be verified until it
  is restored and configured. The account foundation migration is prepared at
  `supabase/migrations/20260722_account_foundation.sql` and is not applied.
- Premium is closed by default. `preview=premium` is a localhost-only preview;
  live mode clears the local Premium flag and opens it only after an authenticated
  server entitlement with `active`, `trialing`, or `grace` status and a valid
  expiry. Billing remains intentionally `not-configured` with checkout and
  restore disabled.
- Demo accounts are fail-closed outside localhost and require the explicit
  `preview=demo` flag; no production origin can silently create a fake account.
- Catalog identity organization now bounds same-key candidate probes and keeps
  hostile colliding-title groups from triggering quadratic main-thread work;
  the regression benchmark covers `8,000` colliding records and passes in the
  full suite.
- API and media proxy hardening now bounds request/response bytes, applies
  upstream timeouts, validates every media redirect, rejects SVG, and sends
  `nosniff`/CSP headers. Catalog delta indexing, author-key expansion, alias
  resolution, telemetry redaction, and service-worker fallback caching are
  bounded as well.
- The independent security scan is still running against an older
  pre-hardening snapshot and has no indexed findings in its scan context. Its
  on-disk artifacts contain the already-fixed catalog identity quadratic-cost
  candidate and a static-server exposure candidate; those artifacts must not
  be treated as a clean result for this tree. The current-tree review and
  regression suite cover the catalog fix. Keep the static server bound to
  `127.0.0.1` unless its exposure policy is reviewed separately, and rerun the
  official scan on this post-hardening snapshot before closing the gate.

## Accounts

- Activate the linked Supabase project and configure its publishable key through
  runtime deployment configuration, never a service-role key in the browser.
- Configure Google and Apple OAuth redirect URLs for the production origin.
- Verify the production build reports accounts as unavailable until the live
  Supabase client is initialized; never ship the local demo flag as an account
  fallback.
- Deploy and verify the account-deletion Edge Function referenced by the app.
- Apply and review `supabase/migrations/20260722_account_foundation.sql`; it
  creates owner-scoped `profiles`, `user_state`, and private `profile-media`
  storage policies with no anonymous table access.
- Add monitoring for sign-in, callback, session refresh, and deletion failures.

## Subscriptions

- The local preview is isolated behind `LorefySubscriptions`; the Premium
  preview flag is never synchronized as user state. `startCheckout` and
  `restorePurchases` delegate only to a live Backend with an explicit provider,
  checkout flag, allowlisted product, and server function.
- Create a server-authoritative entitlements table with `user_id`, provider,
  product, status, and expiration fields protected by RLS.
- Apply `supabase/migrations/20260722_entitlements.sql`; only a verified
  webhook or StoreKit server notification may write entitlement rows.
- Keep the catalog updater limits enabled: static assets reject traversal and
  update deltas are bounded before local persistence or catalog organization.
- Select one billing provider for web checkout and verify webhook signatures in
  an Edge Function before changing entitlement state.
- For iOS, configure StoreKit products and App Store server notifications, or
  use a single subscription service consistently across platforms.
- Keep checkout disabled until the provider, webhook, restore flow, and
  cancellation flow are tested against a sandbox account.
- Remove the local `preview=premium` URL from production builds.

## Catalog and media

- Replace the catalog updater placeholder secret and URL, then test a complete
  weekly run with rollback and an audit record.
- Confirm image-provider terms and cache policy for covers and character images.
- Monitor missing, unrelated, and failed images by work identity; never merge a
  title-only image result into a work with a stable external ID.
- Keep the media proxy allowlist narrow and test every newly added image host;
  reject redirects to hosts outside the allowlist.

## Release gate

- Run `node --test tests/*.test.js` and browser smoke tests on every supported
  type: Manga, Manhwa, Manhua, Comic, Novel, Light Novel, Web Novel, and Book.
- Test the app with slow network, offline reload, empty search, duplicate search
  results, large character lists, and cover picker pagination.
- Complete an independent security scan with all planned workers closed before
  calling the beta build production-ready.
