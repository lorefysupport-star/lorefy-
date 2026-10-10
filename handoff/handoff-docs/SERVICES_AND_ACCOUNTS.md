# Services and Accounts

Private handoff reference, captured 2026-10-10. Identifiers below are not passwords. A configured account email is not proof that a browser is currently logged into that account. New device sessions and connector authorizations need manual reconnection.

## Existing Owned Services

| Service | Existing identity/project | Purpose and reconnection |
| --- | --- | --- |
| App Store Connect | App ID `6799704077`, bundle `com.lorefy.app`, Apple team `U4C4W59HMG` | [Lorefy TestFlight](https://appstoreconnect.apple.com/apps/6799704077/testflight/ios). Sign in manually with a member of this team; retain the same app. |
| Apple Developer | Team `U4C4W59HMG`; `eas.json` configured Apple ID `alanaziibasel@gmail.com` | [Developer account](https://developer.apple.com/account/). Signing, capabilities, Sign in with Apple, APNs. Email is a local configuration record, not a fresh ownership audit. |
| Expo/EAS | Owner `lorefy`, slug `lorefy`, project ID `8438f5d2-3734-4ef7-8925-c8ffeb5a0cd5` | [Project](https://expo.dev/accounts/lorefy/projects/lorefy). Cloud iOS builds and submissions. Log in to an authorized existing owner/team account; do not initialize a new EAS project. |
| Supabase | Ref `qsroxmltioxqozmykens`, organization `tzkqptyscqmolpkldrev`, name `fahadaturki1-sudo's Project` | [Dashboard](https://supabase.com/dashboard/project/qsroxmltioxqozmykens). Existing Auth/Postgres/Storage/Edge Functions. Read-only lookup returned ACTIVE_HEALTHY, region `ap-southeast-1`, Postgres 17. Connect the new Codex Supabase plugin to this project. |
| GitHub | `lorefysupport-star/lorefy-` | [Repository](https://github.com/lorefysupport-star/lorefy-). Remote preserved in source metadata. Latest local HEAD is still the older build6-era commit; current filesystem snapshot, not a remote clone, contains latest developments. Remote branch parity was not established here. |
| ChatGPT Sites | `lorefy-help.m-a-f-sh10.chatgpt.site` | [Support site](https://lorefy-help.m-a-f-sh10.chatgpt.site), [privacy](https://lorefy-help.m-a-f-sh10.chatgpt.site/privacy), [support](https://lorefy-help.m-a-f-sh10.chatgpt.site/support). Public URLs are configured in the app. Site editing account access is not copied; confirm the publishing account with the owner before republishing/changing URLs. |
| Google Cloud OAuth | Existing provider enabled in release settings; Google Cloud project identity not verified | [Cloud console](https://console.cloud.google.com/). Owner must identify the existing OAuth project/client. Do not create a new one or invent the account from an ambient browser tab. |
| Discord | Feedback and design references, not an app backend | Existing Lorefy conversations/server were used for product references. No Discord password, bot token or authenticated session is included. |

## Build 34 Receipt

- [EAS build](https://expo.dev/accounts/lorefy/projects/lorefy/builds/29797ce0-a6f0-488b-afb8-7cb66c5b1f6d): `29797ce0-a6f0-488b-afb8-7cb66c5b1f6d`.
- [EAS submission](https://expo.dev/accounts/lorefy/projects/lorefy/submissions/51b3647f-1e11-46af-96bd-23b363af9121): `51b3647f-1e11-46af-96bd-23b363af9121`.
- Prior recorded statuses FINISHED at 2026-10-09T17:05:28Z and 17:05:44Z respectively. Local signed IPA is verified again in this handoff. Apple processing/current TestFlight availability were not refreshed on an authenticated Apple session during packaging.

## Supabase Live Inventory

Read-only inventory contains 42 applied migration records, latest `20261009165852 beta_profile_decorations`. See `cloud-snapshot/live-inventory-and-functions.json` for exact IDs and versions.

| Deployed function | Version | JWT setting | Notes |
| --- | --- | --- | --- |
| `delete-account` | 11 | true | Account deletion workflow |
| `lorefy-public` | 11 | false | Public catalog/media proxy; inspect its own validation/rate controls |
| `lorefy-html-test` | 3 | true | Current deployed source returns 404; not a production HTML rendering feature |
| `apple-authorization` | 5 | true | Apple authorization/revocation |
| `dispatch-notifications` | 2 | false | Uses its own webhook-secret guard; do not equate JWT=false with unrestricted operation |

The function source snapshot is separate from local development source. Do not deploy it automatically, and do not assume a filename in the repository exactly equals deployed code without comparison.

Public app config points to `https://qsroxmltioxqozmykens.supabase.co` and `/functions/v1/lorefy-public`. The `sb_publishable_...` client key is intentionally browser-public and is retained. Security depends on RLS/function checks; never substitute a service-role key into this client config.

## Secrets to Reconnect, Not Put in Chat

- Expo CLI/Apple login sessions: sign in manually on the new device.
- Apple signing/APNs `.p8` private keys and certificates: use secure existing credential management; not in this archive.
- Server environment names: `APPLE_CLIENT_ID`, `APPLE_KEY_ID`, `APPLE_TEAM_ID`, `APPLE_PRIVATE_KEY`, `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY`, `APNS_BUNDLE_ID`, `APNS_ENVIRONMENT`, `PUSH_WEBHOOK_SECRET`.
- Supabase supplies `SUPABASE_URL` and server-side `SUPABASE_SERVICE_ROLE_KEY` to functions. Do not export the service-role value to the project or conversation.
- Google/Apple OAuth secrets and provider configuration live in the existing services. Verify their configuration without exposing values.
- GitHub/plugin authorizations: authorize the new account/device separately. Do not transfer `.codex/auth.json`, browser cookies, keychains or old plugin token stores.

No real user database records, auth sessions, storage objects or secret vaults were exported. This is a development handoff, not a disaster-recovery database backup.

## External Content/Design Sources

| Source | Use / constraint |
| --- | --- |
| [PFP Vibes](https://www.pfpvibes.com/avatar-decorations) | 24 imported frame overlays/reference art plus local animation system. Metadata `releaseAllowed=false`; beta inclusion by explicit user request does not establish distribution/commercial rights. |
| [AniList](https://anilist.co), [Jikan](https://jikan.moe), [MangaDex](https://mangadex.org) | Manga/manhwa/manhua metadata and artwork references through current adapters; public API access is not an unrestricted media license. |
| [Open Library](https://openlibrary.org), [Google Books](https://books.google.com), [RanobeDB](https://ranobedb.org) | Books/novels metadata. Preserve source provenance/license notes; RanobeDB dataset notes include ODbL. |
| [OpenITI](https://openiti.org), [Wikidata](https://www.wikidata.org), [Wikipedia](https://www.wikipedia.org), [Wikimedia](https://commons.wikimedia.org) | Arabic metadata/catalog expansion. OpenITI/KITAB provenance notes include CC-BY-NC-SA 4.0; metadata import is not authorization to redistribute all full texts. |
| [Hindawi](https://www.hindawi.org), [Jarir](https://www.jarir.com), [FreeWebNovel](https://freewebnovel.com), [Fandom](https://www.fandom.com) | Selected metadata/artwork/character references; inspect source code and individual rights before wider distribution. No paid source account credentials inventoried. |

Links in this table identify sources found in code/docs, not a fresh legal review of their current terms. The project does not imply permission to redistribute reading content from every source.

Monitoring source includes a Sentry-named wrapper, but a live configured Sentry organization/project or collecting endpoint was not verified. Do not claim active crash telemetry from the wrapper filename alone.
