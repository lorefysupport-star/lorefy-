# Lorefy App Review Notes

## Product

Lorefy is an Arabic-first catalog and reading tracker for manga, manhwa, manhua, comics, novels, web novels, and books. Users can search works, save a library, track progress, rate works and characters, publish reviews, react, comment, report content, and block accounts.

## Required account

An account is required because the product synchronizes a user's library, progress, ratings, reviews, profile, and moderation choices across installations.

## Sign-in

- Continue with Google.
- Continue with Apple.
- Email/password and guest sign-in are intentionally not offered in the production build.

Before submission, provide Apple with either a dedicated review account or exact access instructions for both OAuth providers. Both providers must remain available during review.

## Account deletion

Open Profile, then Settings, Privacy and Safety, Delete Account. The flow asks for explicit confirmation. It deletes private media and the Supabase account. Apple grants are revoked before deletion.

## Community safety

- Reviews, comments, profile names, and biographies pass server-side text filtering on create and update.
- Review images accept only JPEG, PNG, or WebP under storage size limits.
- Every review/profile safety menu offers report, mute, and block actions.
- Reports are stored server-side with rate limits and are reviewed by Lorefy support.
- Published support contact: lorefysupport@gmail.com.
- Community rules: https://lorefy-help.m-a-f-sh10.chatgpt.site/community-guidelines

## Premium

The current beta unlocks premium preview features for testers. No checkout or external purchase link is enabled. StoreKit products are disabled.

## Public links

- Product/support home: https://lorefy-help.m-a-f-sh10.chatgpt.site
- Privacy: https://lorefy-help.m-a-f-sh10.chatgpt.site/privacy
- Terms: https://lorefy-help.m-a-f-sh10.chatgpt.site/terms

