const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('community supports standalone text, list, and top posts with replies', () => {
  const backend = read('backend', 'lorefy-backend.js');
  const moduleSource = read('modules', 'lorefy-community.js');

  assert.match(backend, /publishCommunityPost:\s*async function/);
  assert.match(backend, /listCommunityPosts:\s*async function/);
  assert.match(backend, /replyCommunityPost:\s*async function/);
  assert.match(backend, /setCommunityPostReaction:\s*async function/);
  assert.match(moduleSource, /class:\s*"lf-community-compose-fab"/);
  assert.match(moduleSource, /class:\s*"lf-community-compose-sheet(?:\s[^"]*)?"/);
  assert.match(moduleSource, /aria-label":"إنشاء منشور"/);
  assert.match(moduleSource, /lorefy\.customLists\.v1/);
  assert.match(moduleSource, /lorefy\.charTopLists\.v1/);
  assert.match(moduleSource, /kind:\s*"list"/);
  assert.match(moduleSource, /kind:\s*"top"/);
  assert.match(moduleSource, /openThread/);
  assert.match(moduleSource, /lorefy:open-reader-profile/);
  assert.equal(fs.existsSync(path.join(root, 'modules/lorefy-demo-community.js')), false);
});

test('saved non-spoiler quotes can be attached to ordinary community posts', () => {
  const community = read('modules', 'lorefy-community.js');
  const diary = read('modules', 'lorefy-reading-diary.js');
  const core = read('modules', 'lorefy-reading-diary-core.js');

  assert.match(community, /DIARY_KEY\s*=\s*"lorefy\.user\.readingDiary\.v1"/);
  assert.match(community, /renderQuotePreview/);
  assert.match(community, /attachment\.kind === "quote"/);
  assert.match(community, /kind = attachment && \(attachment\.kind === "list" \|\| attachment\.kind === "top"\) \? attachment\.kind : "text"/);
  assert.match(community, /"إرفاق اقتباس"/);
  assert.match(diary, /communityQuote\(event, workInfo\(event\.id\)\)/);
  assert.match(core, /event\.spoiler\) return null/);
});

test('community post database contract is private by default and realtime enabled', () => {
  const migration = read('supabase', 'migrations', '20260920090000_community_posts.sql');

  assert.match(migration, /create table if not exists public\.community_posts/i);
  assert.match(migration, /kind text not null check \(kind in \('text', 'list', 'top'\)\)/i);
  assert.match(migration, /parent_id uuid references public\.community_posts\(id\)/i);
  assert.match(migration, /create table if not exists public\.community_post_reactions/i);
  assert.match(migration, /kind in \('like', 'dislike'\)/i);
  assert.match(migration, /reaction_kind text default 'like'/i);
  assert.match(migration, /alter table public\.community_posts enable row level security/i);
  assert.match(migration, /revoke all on table public\.community_posts from public, anon, authenticated/i);
  assert.match(migration, /create or replace function public\.publish_community_post/i);
  assert.match(migration, /private\.lock_actor_action\('post'\)/i);
  assert.match(migration, /private\.enqueue_notification/i);
  assert.match(migration, /alter publication supabase_realtime add table public\.%I/i);
  assert.match(migration, /'community_posts', 'community_post_reactions'/i);
});

test('community UI is loaded and constrained across narrow mobile widths', () => {
  const index = read('index.html');
  const styles = read('styles', 'lorefy-community.css');
  const moduleSource = read('modules', 'lorefy-community.js');

  assert.match(index, /styles\/lorefy-community\.css/);
  assert.match(index, /modules\/lorefy-community\.js/);
  assert.match(styles, /\.lf-community-compose-fab\s*\{/);
  assert.match(styles, /\.lf-community-compose-sheet(?:\s*,|\s*\{)/);
  assert.match(styles, /\.lf-community-post-card\s*\{/);
  assert.match(styles, /@media \(max-width: 360px\)/);
  assert.match(styles, /max-width:\s*100%/);
  assert.match(styles, /overflow-wrap:\s*anywhere/);
  assert.match(moduleSource, /markLegacyCommunitySections/);
  assert.match(moduleSource, /MutationObserver/);
  assert.match(moduleSource, /lf-review-card/);
  assert.match(moduleSource, /state\.posts\.length\s*===\s*0[\s\S]*lf-review-card/);
  assert.match(moduleSource, /!isDemo\(\)[\s\S]*backend\.mode\s*===\s*"live"/);
  assert.match(styles, /\.lf-home-screen:has\(\.lf-community-page\)\s*>\s*\.lf-home-reply-shelf/);
});

test('community floating controls stay inside the app shell and composer stays focused on writing', () => {
  const styles = read('styles', 'lorefy-community.css');
  const moduleSource = read('modules', 'lorefy-community.js');

  assert.match(moduleSource, /function communityOverlayHost\(\)/);
  assert.match(moduleSource, /communityOverlayHost\(\)\.appendChild\(composer\)/);
  assert.match(moduleSource, /communityOverlayHost\(\)\.appendChild\(button\)/);
  assert.doesNotMatch(moduleSource, /lf-community-compose-brand/);
  assert.match(moduleSource, /placeholder:"اكتب منشورك"/);
  assert.match(moduleSource, /lf-community-compose-modes/);
  assert.match(styles, /\.lf-community-compose-fab\s*\{[^}]*position:\s*absolute/s);
  assert.match(styles, /\.lf-community-compose-sheet(?:\s*,|\s*\{)[\s\S]*position:\s*absolute/);
  assert.doesNotMatch(styles, /\.lf-community-compose-fab\s*\{[^}]*position:\s*fixed/s);
});

test('shared lists and tops use the existing image share studio', () => {
  const moduleSource = read('modules', 'lorefy-community.js');
  const shareStudio = read('modules', 'lorefy-share-studio.js');

  assert.match(moduleSource, /buildCommunityPostFile\(post\)/);
  assert.match(moduleSource, /studio\.nativeFileShare/);
  assert.match(shareStudio, /function buildCommunityPostFile\(post\)/);
  assert.match(shareStudio, /buildCommunityPostFile:\s*buildCommunityPostFile/);
});

test('community feed distinguishes text, list, and top posts without generic nested cards', () => {
  const styles = read('styles', 'lorefy-community.css');
  const moduleSource = read('modules', 'lorefy-community.js');

  assert.match(moduleSource, /data-community-post-kind/);
  assert.match(styles, /\.lf-community-post-kind\.is-list/);
  assert.match(styles, /\.lf-community-post-kind\.is-top/);
  assert.match(styles, /\.lf-community-post-card \.lf-community-attachment/);
  assert.match(styles, /--attachment-accent/);
  assert.doesNotMatch(styles, /\.lf-community-post-card\[data-community-post-kind="(?:list|top)"\]::before/);
});

test('community posts and replies expose exclusive like and dislike actions', () => {
  const backend = read('backend', 'lorefy-backend.js');
  const moduleSource = read('modules', 'lorefy-community.js');

  assert.match(backend, /setCommunityPostReaction:\s*async function\(postId, kind, active\)/);
  assert.match(moduleSource, /setPostReaction\(post, "like"/);
  assert.match(moduleSource, /setPostReaction\(post, "dislike"/);
  assert.match(moduleSource, /uiText\('عدم إعجاب', 'Dislike'\)/);
  assert.match(moduleSource, /uiText\('الرد على الرد', 'Reply'\)/);
  assert.match(moduleSource, /lf-community-thread-rail/);
});

test('demo reactions survive periodic feed refreshes for seeded posts', () => {
  const moduleSource = read('modules', 'lorefy-community.js');

  assert.match(moduleSource, /lorefy\.user\.communityReactions\.v1/);
  assert.match(moduleSource, /function applyLocalReaction/);
  assert.match(moduleSource, /write\(LOCAL_REACTIONS_KEY/);
});

test('profile integration exposes the reader posts entry between reviews and completed', () => {
  const moduleSource = read('modules', 'lorefy-community.js');
  const publicProfile = read('modules', 'lorefy-public-profile.js');

  assert.match(moduleSource, /ensureOwnerPostMetric/);
  assert.match(moduleSource, /var node = leaf && leaf\.parentElement/);
  assert.match(moduleSource, /state\.posts\.length \? state\.posts : \(isDemo\(\) \? demoPosts\(\) : state\.posts\)/);
  assert.match(moduleSource, /loadPosts\(false\)\.then\(ensureOwnerPostMetric\)/);
  assert.match(moduleSource, /lorefy:open-reader-posts/);
  assert.match(publicProfile, /\['MessageCircle',[\s\S]*'مراجعة'\],[\s\S]*\['MessagesSquare',[\s\S]*'منشور'\],[\s\S]*\['BookMarked',[\s\S]*'مكتملة'\]/);
});

test('community realtime subscription includes standalone posts and reactions', () => {
  const backend = read('backend', 'lorefy-backend.js');
  const block = backend.slice(backend.indexOf('subscribeCommunity:'), backend.indexOf('deleteReview:'));

  assert.match(block, /table:"community_posts"/);
  assert.match(block, /table:"community_post_reactions"/);
});

test('community social feed follows the selected accessible tab', () => {
  const backend = read('backend', 'lorefy-backend.js');
  const moduleSource = read('modules', 'lorefy-community.js');

  assert.match(backend, /getFollowedProfileIds:\s*async function/);
  assert.match(moduleSource, /function syncCommunityTabSemantics/);
  assert.match(moduleSource, /aria-selected/);
  assert.match(moduleSource, /function visibleCommunityPosts/);
  assert.match(moduleSource, /post\.parent_id/);
  assert.match(moduleSource, /state\.filter\s*===\s*"friends"/);
  assert.match(moduleSource, /state\.filter\s*===\s*"mine"/);
  assert.match(moduleSource, /state\.filter\s*===\s*"popular"/);
  assert.match(moduleSource, /getFollowedProfileIds/);
});

test('community interactive controls meet the 44px mobile touch target', () => {
  const styles = read('styles', 'lorefy-community.css');

  assert.match(styles, /\.lf-community-v2\s*>\s*\.lf-community-tabs button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.lf-community-picker\s*>\s*section\s*>\s*header\s*>\s*button,[\s\S]*?\.lf-community-thread-close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/s);
  assert.match(styles, /\.lf-community-compose-submit\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.lf-community-reply-again\s*\{[^}]*min-height:\s*44px/s);
  assert.match(styles, /\.lf-community-profile-posts\s*>\s*section\s*>\s*header\s*>\s*button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px/s);
  assert.match(styles, /\.lf-community-page\s+\.lf-community-card\s+\.lf-community-action-row\s*>\s*\.lf-community-card-action\s*\{[^}]*min-height:\s*44px\s*!important/s);
});

test('community thread fills its app host instead of the outer preview viewport', () => {
  const styles = read('styles', 'lorefy-community.css');
  const fullScreenThread = styles.match(/\.lf-community-thread\s*>\s*section\s*\{([^}]*)\}/g) || [];

  assert.ok(fullScreenThread.some((rule) => /height:\s*100%\s*;/.test(rule)));
  assert.ok(fullScreenThread.every((rule) => !/height:\s*100dvh\s*;/.test(rule)));
});
