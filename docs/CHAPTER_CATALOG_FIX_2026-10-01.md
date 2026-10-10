# Missing chapter catalogs

Verified: 2026-10-01, Asia/Riyadh.

## Cause

- Ongoing works including Hunter x Hunter, Kingdom, Dandadan, Sakamoto Days and One-Punch Man had zero catalog chapter totals. The chapter UI only generated its list from that total; it never requested a chapter index.
- The chapter metadata registry only covered four works. Hunterpedia was not registered.
- Wiki field names, indented infoboxes, historical image namespaces and the online/print numbering of One-Punch Man require source-specific handling.

## Changes

- Hunter x Hunter has an official 420-chapter offline baseline, shared with the progress metadata, and its incorrect completed status is corrected at initial catalog preparation.
- Exact MAL/AniList identities map to verified wiki sources. No title-only matching or guessed spin-off mapping is used.
- Chapter indexes follow all MediaWiki continuation pages, reject malformed/incomplete responses and unrelated editions, and cache requests for the current app session. Only the current chapter range requests titles and covers.
- Missing MAL-based totals can query the exact Jikan manga identity. Null or mismatched totals never become invented chapter counts.
- Errors show a retry action. Unknown data is distinguished from loading failure, and existing saved chapter reviews are preserved.
- Hunterpedia title, page-length, volume-number and first-publication-date fields are supported. Kingdom's verified historical image namespace is supported. One-Punch Man includes online manga numbers without mixing in the separate webcomic.
- Updated offline cache versions and prepared/copied the native iOS assets for build 31. No build/upload was attempted during this fix.

## Verification

- Full Node suite: 483 passed, 0 failed. Native prepare/copy and `git diff --check` passed.
- Live Hunterpedia index: 420 distinct chapters; publisher list also ends at 420. Source: https://www.viz.com/shonenjump/chapters/hunter-x-hunter?locale=en
- Browser: Hunter x Hunter shows the first and last ranges. The first ten chapter images loaded with nonzero natural dimensions; chapter rating selection opened and worked, then was canceled without saving test content.
- Browser: Kingdom shows 889 chapters and its first chapter title/date/pages, with navigation to 881-889. Dandadan shows 247 chapters and its first title/date/pages. Sakamoto Days shows 276 chapters and its first title/date/pages.
- Live API/parser check: One-Punch Man exposes 240 manga numbers including its online edition, excluding webcomic pages. Kingdom's first chapter artwork resolves through the verified kingdom-anime image namespace.
- Hunter's status is now ongoing and its shared progress count appears in the detail header after reload.

## Limits

- These are source snapshots, not a guarantee that every title in the entire library has a complete public chapter database.
- Jikan returned HTTP 504 for the live Naruto/Bleach checks. This is treated as a retryable source failure, not a successful zero-chapter result.
- No fabricated titles, covers or community ratings were added. Missing wiki artwork keeps the existing work-cover fallback.
- Native assets are synchronized, but signed-device network behavior has not been tested on a physical iPhone in this environment.
