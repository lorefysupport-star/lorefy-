# Lorefy App Privacy Answers

Use these answers in App Store Connect for the current beta build. Recheck them whenever an SDK or backend field changes.

## Tracking

- Data used to track users: No.
- Data linked across third-party apps or websites for advertising: No.
- Advertising SDKs: None.

## Data linked to the user

### Contact Info

- Email Address: collected by Supabase Auth for account authentication and account recovery.
- Name: optional profile name supplied by the user.
- Purpose: App Functionality.

### User Content

- Photos or Videos: profile avatar/banner and optional review images.
- Other User Content: reviews, comments, recommendations, reports, profile biography, lists, progress, and preferences.
- Purpose: App Functionality and Content Moderation.

### Identifiers

- User ID: Supabase account UUID and public username.
- Purpose: App Functionality.

### Usage Data

- Product Interaction: library state, favorites, reading progress, ratings, selected characters, and reading log are synchronized to the user's account.
- Purpose: App Functionality and Analytics shown to that user.

## Data not collected by Lorefy

- Precise or coarse location.
- Contacts, health, fitness, financial, payment, or sensitive information.
- Browsing history outside Lorefy.
- Advertising data.
- Crash or diagnostic data sent to a remote service. Diagnostics remain on-device unless the user exports them for support.

## Retention and deletion

- Account data remains until the user deletes the account or requests deletion.
- Account deletion removes Supabase Auth, profile, synchronized state, community content covered by cascades, and private media.
- For Sign in with Apple, the Apple refresh token is revoked before account deletion, then removed from encrypted Supabase Vault storage.

## Public links

- Privacy Policy: https://lorefy-help.m-a-f-sh10.chatgpt.site/privacy
- Support: https://lorefy-help.m-a-f-sh10.chatgpt.site/support

