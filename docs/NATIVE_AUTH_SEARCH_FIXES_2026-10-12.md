# Native authentication, search and UI fixes

## Fixed

- Google native OAuth listener setup handles both direct and Promise-based listener removal handles, avoiding an exception before the callback is registered.
- Capacitor core/CLI/iOS and Android resolution updated to8.4.3, with patched XML and brace-expansion transitive dependencies. Native Swift package resolution synchronized.
- Apple sign-in plugin receives a repeatable guarded Capacitor8 compatibility patch during native preparation.
- English authentication, photo-denial, follow, library status and progress messages corrected.
- Empty library results occupy available width; chapter/volume fields fit their grid without clipping.
- Search input restored from14px to16px to avoid iOS focus zoom. Search gets a bilingual Back button; navigation dismisses focused inputs. Explore search deliberately opens the dedicated catalog results/filter page inside Lorefy.
- Canonical source and generated iOS web/native assets synchronized.

## Validation

- Full regression suite rerun before push:1,057passed,0failed,0skipped.
- Native Release simulator builds succeeded, including the search fix. Hardware Release compilation succeeded before the last search-only web changes.
- Authorized Google sign-in succeeded in the locally signed simulator after correcting the simulator Keychain entitlement harness; the harness is not included as a production signing identity.
- Signed-in simulator cold restart/background smoke checks preserved the session and tested library progress. Search focus retained normal size and Back returned to Explore in the latest simulator. Full software-keyboard hardware validation is pending.
- Existing Build34 exercised on one physical iPhone for a15-minute recording without an observed crash/sign-out. Native App footprint stayed approximately19–21MiB; separate WebContent memory was not reliably attributed.

## Still pending

The reported widespread production crashes are not resolved by this smoke test. Updated candidate hardware installation needs valid Apple signing. Fresh hardware Google/Apple login, real photo upload, push delivery, WebContent memory attribution and full decoration acceptance remain pending. No production backend configuration, release upload, credentials, signing keys, device-wide traces or account data are included. Frozen Build34 artifacts are unchanged.
