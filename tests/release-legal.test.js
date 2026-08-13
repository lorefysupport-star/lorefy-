const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('release legal pages describe the live account and moderation flows', () => {
  const privacy = read('privacy-policy.html');
  const support = read('support.html');
  const terms = read('terms.html');
  const community = read('community-guidelines.html');

  assert.match(privacy, /Google/);
  assert.match(privacy, /Apple/);
  assert.match(privacy, /حذف الحساب/);
  assert.match(privacy, /lorefysupport@gmail\.com/);
  assert.doesNotMatch(privacy, /الحسابات والمزامنة وPremium ليس ضمن هذه المرحلة/);
  assert.match(support, /lorefysupport@gmail\.com/);
  assert.match(terms, /إرشادات المجتمع/);
  assert.match(community, /الإبلاغ/);
  assert.match(community, /الحظر/);
});

test('the iOS bundle and public Edge Function include every release page', () => {
  const prepare = read('tools', 'prepare-ios-web.mjs');
  const publicFunction = read('supabase', 'functions', 'lorefy-public', 'index.ts');

  assert.match(prepare, /community-guidelines\.html/);
  assert.match(publicFunction, /privacy/);
  assert.match(publicFunction, /support/);
  assert.match(publicFunction, /terms/);
  assert.match(publicFunction, /community-guidelines/);
  assert.match(publicFunction, /lorefysupport@gmail\.com/);
});

test('App Store review documentation covers privacy, moderation, and source rights', () => {
  const privacyAnswers = read('docs', 'APP_PRIVACY_ANSWERS.md');
  const reviewNotes = read('docs', 'APP_REVIEW_NOTES.md');
  const moderation = read('docs', 'UGC_MODERATION_RUNBOOK.md');
  const rights = read('docs', 'CONTENT_RIGHTS_AUDIT.md');

  assert.match(privacyAnswers, /Data used to track users: No/);
  assert.match(privacyAnswers, /Email Address/);
  assert.match(reviewNotes, /Continue with Apple/);
  assert.match(reviewNotes, /Delete Account/);
  assert.match(moderation, /Target response times/);
  assert.match(rights, /not yet approved for App Store submission/);
  assert.match(rights, /AniList/);
  assert.match(rights, /MangaDex/);
});
