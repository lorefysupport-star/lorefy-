# Quarter Ratings Verification - 2026-10-07

## Scope

Ratings remain out of 5, with 0.25 increments: 4.25, 4.50, 4.75.
The existing feather identity is retained. Native sliders provide tap, drag,
keyboard and assistive-technology control, with a two-decimal selected value.
Work reviews, optional detailed criteria, chapter reviews and character scores
use quarter increments. Zero clears an optional score; chapter comments can
still be published without a rating. Existing work ratings are not rounded
or rewritten by this migration.

## Root Cause and Database

Before the change, public.reviews.rating was numeric(2,1), and chapter scores
were smallint. A database regression test demonstrated that 4.25 became 4.3.
Changing only the interface would not have fixed persistence.

Migration 20261007152557_quarter_ratings was applied to the configured project
qsroxmltioxqozmykens. Both columns now use numeric(3,2). The chapter RPC has
one numeric-score signature, with the existing active-user check, owner-bound
upsert, per-user lock and rate limit retained. Whole-number clients remain
compatible. Anonymous execution is denied; authenticated execution is allowed.

supabase/tests/quarter_ratings.sql passed against the database after migration:
- Work insert at 4.25 and update at 4.75 retain exact values.
- Chapter insert at 4.25 and update at 4.75 retain exact values.
- A non-quarter chapter score of 4.2 is rejected.
- A comment-only chapter score of zero is accepted.
- The entire fixture runs in a transaction ending in ROLLBACK.

Security advisor category counts remained unchanged: 4 no-policy informational
findings, 1 public-extension warning, 18 authenticated security-definer warnings
and 1 leaked-password-protection warning. This is not a security clean bill.

## Browser Verification

Local demo, measured viewport 422 x 788. No physical iPhone test was performed.

- Work control changed through 4.25, 4.50 and 4.75 using arrow keys.
- Arabic and English accessible value text matched the selected fraction.
- Arabic work editor verified in Light, Dark and Pink appearances.
- Chapter 2 accepted 4.25 in local preview and displayed it in its discussion,
  not in the community feed. Reopening retained 4.25.
- Guts accepted 4.25, the Rated filter retained the character, and the personal
  average displayed 4.25. Reopening retained 4.25. Its test score was restored
  to its original unrated state afterward.
- Character portal slider initially rendered at 129px instead of its available
  232px. The shared selector was corrected to apply outside the app root;
  remeasurement confirmed slider and container both measured 232px.
- Theme and language were restored to the previous English/Pink preview state.

Screenshots are in qa/quarter-ratings-20261007/:
work-4.25-ar-pink.png, work-4.25-ar-dark.png, work-4.25-ar-light.png,
work-4.25-pink.png, character-4.25-pink.png, chapter-local-4.25.png.

## Automated and Native Asset Checks

New regression tests were observed failing before the corresponding fixes.
Existing integer/half-step interface contracts were updated to quarter sliders
while retaining the remaining behavior assertions.

Final npm test: 777 passed, 0 failed, 0 skipped, 0 cancelled; 60.601 seconds.
Evidence: qa/quarter-ratings-20261007-tests-final.log.

npm run ios:prepare and npx cap copy ios completed. SHA-256 comparisons matched
all 11 affected runtime files across source, ios-web and ios/App/App/public.
Service worker cache: lorefy-v370-quarter-ratings.

No TestFlight build was created or uploaded in this feature task. The database
supports the precision now; testers need a new native build for the new controls.
