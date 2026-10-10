# Security, Scope and Exclusions

This handoff intentionally omits session stores, `.git` metadata, `node_modules`, browser/Playwright cache, Supabase `.temp`, private environment files and private signing credential extensions. Earlier IPA artifacts are omitted from the application copy; the exact signed Build 34 IPA is included separately. `.superdesign` editor state/cache is omitted; app and branding assets are preserved.

`verification/excluded-files.json` lists actual excluded entries. Source scanning searches for private-key payload blocks, recognizable secret token formats and privileged/user-session JWTs in candidate text files. Two initial matches were ordinary catalog-title URL slugs containing `sk-`, reviewed and restored unchanged; details are in `verification/secret-scan-review.json`.

These are explicit exclusions and a pattern scan, not an absolute guarantee against every possible secret representation. Before publicly publishing the package or sharing with anyone other than the owner's new account, review it again. It contains safe-but-private operational identifiers and developer evidence/screenshots. Do not publish it as a public download by default.

The reviewed `config/lorefy-release.json` contains public URLs, a browser publishable key and nonsecret release booleans; it is retained to avoid losing current settings. It contains no Apple private key or service-role key. Existing native public config remains untouched and is independently compared with the signed IPA.

The archive includes the signed IPA as a binary artifact, not private signing keys. Embedded provisioning/certificate metadata inside an Apple-signed IPA is not a reusable signing private key. Do not extract it and pretend it supplies credentials for a new signing setup.

No live user records, Auth tables/sessions, Storage objects, server secret vault values, browser cookies, `.codex/auth.json`, account MFA codes or keychain contents were exported. The cloud snapshot is read-only function source plus migration/function inventory; reconnect the existing live project to continue operations.

The packet preserves current application source, current backend source, catalogs/runtime data, developer QA and docs, branding and the three related promotional production folders. It does not indiscriminately copy unrelated projects, old Expo/local prototypes, unrelated Downloads or every file elsewhere on the original PC. The entire prior chat history and Codex account-wide memory/subscriptions/settings are not cloned; product decisions and working context are documented explicitly instead.

Original files are not edited by the packager. Dependencies were installed only inside the copied application for verification and are excluded from the ZIP. Device credentials are not migrated with those dependencies.

On the destination, verify ZIP entry hashes using `ARCHIVE_MANIFEST.json`, retain a read-only baseline, reconnect services manually and avoid automated production mutation during initial setup.
