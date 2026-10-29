const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const design = require('../modules/lorefy-design-system.js');
const material = fs.readFileSync('styles/lorefy-glass-materials.css', 'utf8');
const profile = fs.readFileSync('styles/lorefy-profile-refined.css', 'utf8');

function rule(selector) {
  const start = material.indexOf('\n' + selector + ' {');
  assert.notEqual(start, -1, 'Shared material rule missing: ' + selector);
  return material.slice(start, material.indexOf('}', start));
}

test('character image actions pair semantic foregrounds with their own backgrounds', () => {
  const primary = rule('.lf-image-choice-sheet .lf-image-choice-primary');
  assert.match(primary, /background:var\(--ui-action\) !important/);
  assert.match(primary, /color:var\(--ui-on-action\) !important/);
  const secondary = rule('.lf-image-choice-sheet :is(.lf-image-choice-secondary,.lf-image-choice-external)');
  assert.match(secondary, /background:var\(--glass-reflection\),var\(--glass-fill\) !important/);
  assert.match(secondary, /color:var\(--ui-glass-ink\) !important/);
});

test('image-picker close and portrait-edit controls have full touch targets', () => {
  const targets = rule(':is(.lf-image-choice-close,.lf-character-image-edit,.lf-clx-image-edit)');
  assert.match(targets, /width:44px !important/);
  assert.match(targets, /height:44px !important/);
});

test('image picker is themed at its actual mount outside the React app', () => {
  assert.match(material,/\.lf-app,\.lf-profile-page,\.lf-character-page,\.lf-image-choice-sheet,\.lf-im-page\s*\{/);
  assert.match(material,/html\[lang='ar'\] :is\([^)]*\.lf-image-choice-sheet,\.lf-im-page\)/);
  assert.match(material,/\.lf-image-choice-card\s*\{\s*background:var\(--glass-reflection\),var\(--glass-sheet\)/);
});

test('image-picker direction follows the document and long headings wrap', () => {
  assert.match(rule('.lf-image-choice-sheet'),/direction:inherit !important/);
  const heading=rule('.lf-image-choice-head strong');
  assert.match(heading,/white-space:normal !important/);
  assert.match(heading,/overflow-wrap:anywhere/);
});

test('profile polish never overrides overview visibility with a forced status-row display', () => {
  const row = profile.match(/\.lf-app \.lf-profile-page \.lf-profile-reading-statuses\s*\{([^}]+)\}/);
  assert.ok(row);
  assert.doesNotMatch(row[1], /(?:^|;)\s*display\s*:/);
  assert.match(row[1], /overflow-x:auto/);
  const sections = fs.readFileSync('styles/lorefy-profile-sections.css', 'utf8');
  assert.match(sections, /not\(\[data-profile-section='overview'\]\) \.lf-profile-overview-content[^{}]*\{\s*display:\s*none !important/s);
});

test('image-picker action token pairs retain contrast for ready and arbitrary colors', () => {
  function luminance(hex) {
    return hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
      .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
      .reduce((sum, x, i) => sum + x * [.2126,.7152,.0722][i], 0);
  }
  for (const mode of ['dark','light','pink','custom-dark-207b69','custom-light-f080a0','custom-dark-ffffff','custom-light-000000']) {
    const tokens = design.tokens(mode), a = luminance(tokens['--ui-action']), b = luminance(tokens['--ui-on-action']);
    assert.ok((Math.max(a,b) + .05) / (Math.min(a,b) + .05) >= 4.5, mode);
  }
});
