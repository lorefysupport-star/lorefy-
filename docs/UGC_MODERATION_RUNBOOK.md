# Lorefy Community Moderation Runbook

## Preventive controls

- OAuth account required for posting.
- Server-side validation and rate limits for reviews, comments, reactions, and reports.
- Database triggers filter prohibited text on insert and update.
- Review media is restricted to JPEG, PNG, or WebP, ten images per review, owner-scoped UUID paths, and storage size limits.
- Account-level blocks are stored in Supabase and local mute choices synchronize with the user's private state.

## Report handling

1. Check the Supabase `reports` table at least daily during beta.
2. Prioritize threats, child-safety, targeted harassment, impersonation, and copyright notices.
3. Inspect the referenced review, comment, profile, or work.
4. Hide or delete violating content and remove its private storage objects.
5. Contact the reporter only when more evidence is needed.
6. Suspend repeat offenders through Supabase Auth and record the action outside user-visible content.

Target response times:

- Immediate danger or child-safety: as soon as discovered.
- Harassment, hate, explicit material, or doxxing: within 24 hours.
- Spam, spoilers, misinformation, or copyright: within 72 hours.

## User controls

- Report: sends a server-side report with a bounded reason and note.
- Block: hides the account and synchronizes the relationship to Supabase.
- Mute: hides the account for the user and synchronizes in private user state.
- Delete own content: available from the review detail controls.
- Delete account: available in Privacy and Safety settings.

Support contact: lorefysupport@gmail.com

