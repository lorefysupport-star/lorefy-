const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function social() {
  const section = read('styles/lorefy-design-system.css').match(/\/\* Social and profile UI[\s\S]*?\/\* End social and profile UI \*\//);
  assert.ok(section, 'shared presentation must include owner, visitor, feed and conversations');
  return section[0];
}

test('owner and visitor profile tabs use the same three-part selected control', () => {
  const css = social();
  assert.match(css, /\.lf-profile-section-tabs\s*\{[^}]*grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.lf-profile-section-tabs > button\[aria-selected='true'\]/);
  assert.match(css, /min-height:\s*44px/);
  assert.doesNotMatch(css, /--profile-frame-|--identity-avatar-space|\.lf-profile-banner\s*\{|\.lf-reader-banner\s*\{/);
});

test('reading metrics keep saved data untouched while improving values and labels', () => {
  const css = social();
  assert.match(css, /\.lf-profile-reading-metrics :is\(strong,p:first-of-type\)[^}]*font-size:\s*18px/s);
  assert.match(css, /\.lf-profile-reading-metrics :is\(span,p:last-of-type\)[^}]*font-size:\s*11px/s);
  assert.match(css, /border-inline-start:\s*1px solid var\(--ui-line\)/);
  assert.doesNotMatch(css, /\.is-profile-social-stat\s*\{[^}]*display:\s*(?:block|flex|grid)/);
});

test('identity ink is shared by the owner name and visitor name without moving the avatar', () => {
  const css = social();
  assert.match(css, /:is\(\.lf-profile-name p,\.lf-reader-identity h1\)[^}]*color:\s*var\(--ui-ink\)/s);
  assert.doesNotMatch(css, /\.lf-reader-avatar\s*\{|\.lf-profile-avatar\s*\{/);
});

test('profile creation actions stay compact beside their section title', () => {
  const css = social();
  assert.match(css, /\.lf-profile-section-head:has\(\.is-profile-create\)[^}]*flex-direction:\s*row/s);
  assert.match(css, /\.lf-profile-section-panel \.is-profile-create[^}]*width:\s*auto\s*!important/s);
  assert.doesNotMatch(css, /\.lf-profile-folder-fan|\.lf-profile-folder-pocket\s*\{/);
});

test('feed, profile entries and conversation posts use shared typography and avatars', () => {
  const css = social();
  for (const selector of ['.lf-community-post-avatar', '.lf-profile-review-entry .lf-review-card', '.lf-community-review-copy', '.lf-community-post-body']) assert.ok(css.includes(selector));
  assert.match(css, /--social-avatar:\s*40px/);
  assert.match(css, /font-size:\s*16px\s*!important;\s*line-height:\s*1\.65/);
});

test('profile review actions adapt to owner and visitor action counts with full touch targets', () => {
  const css = social();
  assert.match(css, /grid-auto-flow:\s*column;\s*grid-auto-columns:\s*minmax\(44px,1fr\)/);
  assert.match(css, /\.lf-profile-review-entry \.lf-review-card > div > div:last-child/);
  assert.doesNotMatch(css, /\[aria-label='(?:Delete|حذف)'\][^}]*display:\s*none/);
});

test('composer uses a dimming scrim and restrained attachment tools', () => {
  const css = social();
  assert.match(css, /--ui-social-scrim:\s*rgb\(0 0 0 \/ \.42\)/);
  assert.match(css, /\.lf-community-compose-sheet\s*\{[^}]*background:\s*var\(--ui-social-scrim\)/);
  assert.match(css, /\.lf-community-compose-tools button\s*\{[^}]*border:\s*0\s*!important/);
});

test('thread header has balanced targets and its reply field avoids small native input text', () => {
  const css = social();
  assert.match(css, /\.lf-community-thread-head\s*\{[^}]*grid-template-columns:\s*44px minmax\(0,1fr\) 44px/);
  assert.match(css, /\.lf-community-thread-compose textarea\s*\{[^}]*font-size:\s*16px\s*!important/);
});

test('compact Home friend rails do not change Explore cover geometry or expanded grids', () => {
  const css = social();
  assert.match(css, /\.lf-home-screen \.lf-friend-activity \.lf-friend-rail:not\(\.is-expanded\)/);
  assert.match(css, /flex:\s*0 0 88px\s*!important/);
  assert.doesNotMatch(css, /\.lf-explore-(?:work|feature|rail)/);
});

test('social press cues and functional materials reuse the reduced-motion and transparency contracts', () => {
  const css = read('styles/lorefy-design-system.css');
  const press = css.match(/\/\* Immediate press feedback[\s\S]*?\/\* End immediate press feedback \*\//)[0];
  assert.equal((press.match(/\.lf-community-compose-tools button/g) || []).length, 2);
  const transparency = css.slice(css.indexOf('@media (prefers-reduced-transparency: reduce)'));
  assert.match(transparency, /\.lf-community-thread-head/);
  assert.match(transparency, /\.lf-community-thread-compose/);
});

test('social-profile styles are loaded through refreshed matching cache references', () => {
  const asset = 'styles/lorefy-design-system.css?v=20261018-social-profile-v1';
  assert.ok(read('index.html').includes(asset));
  assert.ok(read('sw.js').includes(asset));
});

test('lower profile sections keep a common heading hierarchy without hiding content', () => {
  const css = social();
  for (const selector of ['.lf-profile-top-characters-head > div', '.lf-profile-recent > div:first-child > span:first-child', '.lf-profile-community-head > strong', '.lf-reader-shelf-head h2']) assert.ok(css.includes(selector), selector);
  assert.doesNotMatch(css, /\.lf-profile-(?:recent|top-characters|community-summary)\s*\{[^}]*display:\s*none/);
});

test('category text is not forced to numeric display size and metric labels retain whole words', () => {
  const css=social();
  assert.match(css,/\.lf-profile-reading-metrics > :last-child :is\(strong,p:first-of-type\)[^}]*font-size:\s*14px/s);
  assert.match(css,/padding-inline:\s*1px\s*!important/);
  assert.match(css,/overflow-wrap:\s*normal\s*!important/);
});

test('narrow profile tabs stack icons above labels instead of clipping Overview', () => {
  assert.match(social(),/@media \(max-width: 360px\)[\s\S]*\.lf-profile-section-tabs > button[^}]*flex-direction:\s*column/s);
});
