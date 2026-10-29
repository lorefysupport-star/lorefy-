const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('community publishing is server-owned and bounded', () => {
  const backend = read('backend', 'lorefy-backend.js');
  const migration = read('supabase', 'migrations', '20260813001712_community_release_hardening.sql');
  const storageMigration = read('supabase', 'migrations', '20260813004416_storage_release_hardening.sql');
  const regexMigration = read('supabase', 'migrations', '20260813004542_storage_regex_fix.sql');
  const moderationMigration = read('supabase', 'migrations', '20260813113811_community_moderation.sql');
  const policyHelpers = read('supabase', 'migrations', '20260813120306_internal_policy_helpers.sql');
  const remediation = read('supabase', 'migrations', '20260813125105_release_security_remediation.sql');
  const mediaIntegrity = read('supabase', 'migrations', '20260813214432_review_media_integrity.sql');
  const reactionRateLimit = read('supabase', 'migrations', '20260813221522_reaction_rate_limit.sql');
  const productTools = read('modules', 'lorefy-product-tools.js');
  const productCore = read('modules', 'lorefy-product-core.js');
  const app = read('uploads', 'files', 'lorefy-app.js');

  assert.match(backend, /publishReview:\s*async/);
  assert.match(backend, /LOREFY_REVIEW_ALREADY_EXISTS/);
  assert.match(backend, /reviews_user_work_unique_idx/);
  assert.match(backend, /_uploadReviewMedia:\s*async/);
  assert.match(backend, /listReviews:\s*async/);
  assert.match(backend, /addReviewComment:\s*async/);
  assert.match(backend, /setReviewReaction:\s*async/);
  assert.match(backend, /Review image deletion failed/);
  assert.match(backend, /submitReport:\s*async/);
  assert.match(backend, /publish_review_comment/);
  assert.match(backend, /set_review_reaction/);
  assert.match(migration, /create or replace function public\.publish_review/i);
  assert.match(migration, /review_rate_limit/i);
  assert.match(migration, /revoke insert on public\.reviews from authenticated/i);
  assert.match(migration, /create or replace function public\.submit_report/i);
  assert.match(storageMigration, /review_media_not_found/);
  assert.match(storageMigration, /public\.is_active_auth_user\(\)/);
  assert.match(storageMigration, /drop policy if exists "reviews insert own"/i);
  assert.match(regexMigration, /\[\.\]\(jpg\|png\|webp\)/);
  assert.match(moderationMigration, /moderate_community_text/);
  assert.match(moderationMigration, /before insert or update/);
  assert.match(moderationMigration, /profile_blocks/);
  assert.match(backend, /setProfileBlock:\s*async/);
  assert.match(moderationMigration, /author_has_blocked_viewer/);
  assert.match(moderationMigration, /reader_has_blocked_author/);
  assert.match(moderationMigration, /drop policy if exists "reviews read public or own"/i);
  assert.match(moderationMigration, /drop policy if exists "review comments read"/i);
  assert.match(moderationMigration, /drop policy if exists "profiles read"/i);
  assert.match(moderationMigration, /create or replace function public\.search_public_profiles/i);
  assert.match(policyHelpers, /create or replace function private\.is_active_auth_user/i);
  assert.match(policyHelpers, /private\.author_has_blocked_viewer/i);
  assert.match(policyHelpers, /drop function if exists public\.is_active_auth_user/i);
  assert.match(remediation, /private\.can_interact_with_review/i);
  assert.match(remediation, /Community comments inherit review access/i);
  assert.match(remediation, /Review reactions inherit review access/i);
  assert.match(remediation, /drop policy if exists "Profile media can be uploaded by its owner"/i);
  assert.match(remediation, /store_apple_authorization\(\s*target_user_id uuid/i);
  assert.match(remediation, /private\.lock_actor_action\('review'\)/i);
  assert.match(remediation, /private\.lock_actor_action\('report'\)/i);
  assert.match(remediation, /private\.lock_actor_action\('comment'\)/i);
  assert.match(reactionRateLimit, /private\.lock_actor_action\('reaction'\)/i);
  assert.match(reactionRateLimit, /reaction_rate_limit/i);
  assert.match(mediaIntegrity, /cardinality\(safe_paths\) > 10/i);
  assert.match(mediaIntegrity, /count\(distinct p\)/i);
  assert.match(mediaIntegrity, /bucket_id = 'review-media'/i);
  assert.match(mediaIntegrity, /review_media_not_found/i);
  assert.match(remediation, /private\.account_deletions/i);
  assert.match(remediation, /begin_account_deletion/i);
  assert.match(backend, /setProfilePrivacy:\s*async/);
  assert.match(backend, /profile_is_private:row\.is_private/);
  assert.match(backend, /rpc\("save_my_profile"/);
  assert.match(productTools, /card\.dataset\.reviewId/);
  assert.match(productTools, /card\.dataset\.userId/);
  assert.match(productCore, /return backend\.setProfileBlock\(id, true\)\.then/);
  assert.match(app, /tr=async\(\)=>/);
  assert.match(app, /r\.publishReview\(\{workId:t\.mid/);
  assert.match(app, /qo=async t=>/);
  assert.match(app, /r\.deleteReview\(t\)/);
  assert.match(app, /e\.listReviews\(\{limit:100\}\)/);
  assert.match(app, /"data-review-id":t\.id/);
  assert.match(app, /"data-user-id":t\.userId/);
  assert.match(read('modules', 'lorefy-growth-features.js'), /persistReviewReaction\(card, "dislike", nowMine\)/);
});

test('native Google OAuth uses PKCE code exchange without fragment token installation', () => {
  const backend = read('backend', 'lorefy-backend.js');
  const oauth = read('backend', 'lorefy-ios-oauth.js');
  assert.match(backend, /flowType:\s*"pkce"/);
  assert.match(oauth, /exchangeCodeForSession\(code\)/);
  assert.doesNotMatch(oauth, /setSession\s*\(/);
  assert.doesNotMatch(oauth, /access_token/);
  assert.doesNotMatch(oauth, /refresh_token/);
  assert.match(oauth, /lorefy\.oauth\.google\.pending\.v1/);
  assert.match(oauth, /App\.getLaunchUrl/);
});

test('account deletion handles CORS and recursively empties every private media bucket', () => {
  const fn = read('supabase', 'functions', 'delete-account', 'index.ts');
  assert.match(fn, /request\.method === "OPTIONS"/);
  assert.match(fn, /Access-Control-Allow-Origin/);
  assert.match(fn, /listAllFiles/);
  assert.match(fn, /\["profile-media", "review-media", "custom-covers"\]/);
  assert.match(fn, /storage_cleanup_incomplete/);
  assert.match(fn, /rpc\("begin_account_deletion"/);
  assert.match(fn, /MAX_AUTH_AGE_SECONDS/);
  assert.match(fn, /recent_authentication_required/);
  assert.match(fn, /MAX_STORAGE_FILES/);
  assert.match(fn, /MAX_STORAGE_DEPTH/);
  assert.match(fn, /AbortSignal\.timeout\(UPSTREAM_TIMEOUT_MS\)/);
});

test('community actions have stable identities and share one interaction model', () => {
  const growth = read('modules', 'lorefy-growth-features.js');
  const shareStudio = read('modules', 'lorefy-share-studio.js');
  const styles = read('styles', 'lorefy-review-social.css');

  assert.match(growth, /function communityActionSvgType\(/);
  assert.match(growth, /M7\\\.9 20A9 9/);
  assert.match(growth, /circle cx=/);
  assert.doesNotMatch(growth, /return \["share", "bookmark", "dislike", "like", "comment"\]\[index\]/);
  assert.match(growth, /function ensureCommunityBookmarkAction\(/);
  assert.match(growth, /function wireCommunityShare\(/);
  assert.match(growth, /function openCommunityReviewShareSheet\(/);
  assert.match(growth, /class: "lf-review-share-sheet-card"/);
  assert.match(growth, /openCommunityReviewShareSheet\(card\)/);
  assert.match(shareStudio, /function enhanceReviewShare\(/);
  assert.match(shareStudio, /\.lf-review-share-sheet-card/);
  assert.match(shareStudio, /addPlatformRail\(card/);
  assert.match(growth, /function wireCommunityCardNavigation\(/);
  assert.match(growth, /data-review-id/);
  assert.match(growth, /"review:" \+ String\(reviewId\)/);
  assert.match(growth, /persistReviewReaction\(card, "like", adding\)/);
  assert.match(growth, /function syncCommunityReactionViews\(/);
  assert.match(styles, /\.lf-community-card \.lf-community-action-row,[^{]*\{[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/s);
  assert.match(styles, /\.lf-review-detail-header\s*\{[^}]*env\(safe-area-inset-top/s);
  assert.match(styles, /\.lf-review-share-sheet-card/);
});

test('community review share reads the rendered review rating including partial stars', () => {
  const growth = read('modules', 'lorefy-growth-features.js');

  assert.match(growth, /function communityRenderedStarRating\(/);
  assert.match(growth, /data-review-rating/);
  assert.match(growth, /function reviewDetailRating\(/);
  assert.match(growth, /rating: reviewDetailRating\(root, authorLeaves\)/);
  assert.match(growth, /item\.rating \|\| "—"/);
});

test('community review share resolves and preserves the real profile avatar', () => {
  const growth = read('modules', 'lorefy-growth-features.js');

  assert.match(growth, /function reviewAvatarSource\(/);
  assert.match(growth, /avatar: reviewAvatarSource\(root, author, handle\)/);
  assert.match(growth, /data-share-src/);
  assert.match(growth, /lf-work-share-avatar-fallback/);
});

test('community profiles and feeds are driven by shared cloud state', () => {
  const backend = read('backend', 'lorefy-backend.js');
  const app = read('uploads', 'files', 'lorefy-app.js');
  const profileView = read('modules', 'lorefy-public-profile.js');
  const socialMigration = read('supabase', 'migrations', '20260912000000_community_social_graph.sql');

  assert.match(backend, /getPublicProfile:\s*async function/);
  assert.match(backend, /listProfileFollowers:\s*async function/);
  assert.match(backend, /listProfileFollowing:\s*async function/);
  assert.match(backend, /subscribeCommunity:\s*async function/);
  assert.match(socialMigration, /get_public_profile_social/);
  assert.match(socialMigration, /list_profile_connections/);
  assert.match(socialMigration, /alter publication supabase_realtime add table public\.%I/i);
  assert.match(socialMigration, /'reviews', 'review_comments', 'review_reactions', 'profile_follows'/i);
  assert.match(app, /lorefy:open-reader-profile/);
  assert.match(app, /lorefy:profile-follow-changed/);
  assert.match(app, /listProfileFollowers/);
  assert.match(app, /listProfileFollowing/);
  assert.match(app, /subscribeCommunity/);
  assert.match(app, /own=o=>String\(o\.mid\)===String\(t\.mid\)&&\(o\.userId==="me"\|\|o\.userId===window\.LorefyBackend\?\.user\?\.id\)/);
  assert.match(app, /rows\.filter\(o=>!own\(o\)\)/);
  assert.match(app, /reviews:M\.filter\(r=>r\.userId===He\.id\)/);
  assert.doesNotMatch(app, /userId===t\.id\|\|y\.un===t\.un/);
  assert.doesNotMatch(app, /r=\[\.\.\.SEED_FEED\]\.filter\(y=>y\.un===t\.un\)/);
  assert.doesNotMatch(app, /s=18\+n%40,d=r\.length\|\|3\+n%12,h=40\+n%900/);
  assert.match(profileView, /lf-public-profile-page/);
  assert.match(profileView, /favorite_work_ids/);
  assert.match(profileView, /completed_count/);
  assert.match(socialMigration, /favorite_work_ids jsonb/i);
  assert.match(socialMigration, /completed_count bigint/i);
});

test('public reader profiles expose the same social and favorite details as the full profile', () => {
  const app = read('uploads', 'files', 'lorefy-app.js');
  const profileView = read('modules', 'lorefy-public-profile.js');
  const growth = read('modules', 'lorefy-growth-features.js');
  const snapshotMigration = read('supabase', 'migrations', '20260913060949_public_profile_full_parity.sql');

  assert.match(snapshotMigration, /social_links jsonb/i);
  assert.match(snapshotMigration, /p\.social_links/i);
  assert.match(snapshotMigration, /favorite_character_ids jsonb/i);
  assert.match(growth, /function installPublicProfileParity\(/);
  assert.match(growth, /favorite_character_ids/);
  assert.match(growth, /social_links/);
  assert.match(growth, /listProfileFollowers\(profile\.id/);
  assert.match(growth, /listProfileFollowing\(profile\.id/);
  assert.match(growth, /lf-public-profile-top-characters/);
  assert.match(growth, /lf-public-profile-connections/);
  assert.match(app, /window\.LorefyPublicProfile/);
  assert.match(profileView, /backend\.getPublicProfile\(initial\.id\)/);
  assert.match(profileView, /backend\.listReviewCollection\(\{ userId:initial\.id/);
  assert.match(profileView, /reviews\.filter\(review => review\.userId === profile\.id\)/);
  assert.match(profileView, /favorite_work_ids/);
  assert.match(profileView, /favorite_character_ids/);
  assert.match(profileView, /social_links/);
  assert.match(profileView, /listProfileFollowers/);
  assert.match(profileView, /listProfileFollowing/);
});

test('review comments support replies to comments and replies', () => {
  const backend = read('backend', 'lorefy-backend.js');
  const app = read('uploads', 'files', 'lorefy-app.js');
  const migration = read('supabase', 'migrations', '20260913000000_review_comment_threads.sql');

  assert.match(migration, /add column if not exists parent_id uuid/i);
  assert.match(migration, /references public\.review_comments\(id\)/i);
  assert.match(migration, /parent_ref uuid default null/i);
  assert.match(migration, /parent_comment\.review_id <> review_ref/i);
  assert.match(backend, /select\("id,review_id,user_id,parent_id,body,created_at"\)/);
  assert.match(backend, /addReviewComment:\s*async function\(reviewId, body, parentId\)/);
  assert.match(backend, /parent_ref:parentId/);
  assert.match(app, /parentId:f\.parent_id\|\|""/);
  assert.match(app, /lf-review-comment-reply/);
  assert.match(app, /data-comment-id/);
});

test('community and public profile pages are constrained to the iOS viewport', () => {
  const styles = read('styles', 'lorefy-apple-ui.css');

  assert.match(styles, /\.lf-community-page\.lf-community-enhanced\s*\{[^}]*overflow-x:\s*hidden/s);
  assert.match(styles, /\.lf-community-page \.lf-community-card\s*\{[^}]*width:\s*calc\(100% - \(var\(--apple-inline\) \* 2\)\)/s);
  assert.match(styles, /\.lf-public-profile-page\s*\{/);
});

test('review author navigation keeps the canonical profile UUID', () => {
  const app = read('uploads', 'files', 'lorefy-app.js');

  assert.match(app, /d\|\|Me\(\{id:t\.userId,name:t\.user,un:t\.un,av:t\.av\}\)/);
  assert.doesNotMatch(app, /Me\(\{id:t\.un,name:t\.user,un:t\.un,av:t\.av\}\)/);
});

test('identity and review uniqueness are enforced by the database', () => {
  const migration = read('supabase', 'migrations', '20260912010000_identity_review_uniqueness.sql');
  const reviewMigration = read('supabase', 'migrations', '20260825000000_release_v11_review_upsert.sql');
  const app = read('uploads', 'files', 'lorefy-app.js');
  assert.match(migration, /create unique index if not exists profiles_username_lower_idx/i);
  assert.match(migration, /on public\.profiles \(lower\(username\)\)/i);
  assert.match(migration, /create unique index if not exists reviews_user_work_unique_idx/i);
  assert.match(migration, /on public\.reviews \(user_id, work_id\)/i);
  assert.match(reviewMigration, /on conflict \(user_id, work_id\) do update/i);
});
