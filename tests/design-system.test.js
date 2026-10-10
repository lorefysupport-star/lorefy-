const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function contrast(a, b) {
  const luminance = hex => {
    const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255);
    const linear = rgb.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

test('shared palettes preserve the app contract and readable text in both themes', () => {
  const design = require('../modules/lorefy-design-system.js');
  for (const dark of [false, true]) {
    const p = design.palette(dark);
    for (const key of ['bg', 'card', 'card2', 'card3', 'field', 'elevated', 'sheet', 'accent', 'accentText', 'accentSoft', 'border', 'hairline', 'text', 'text2', 'sub', 'sub2', 'green', 'gold', 'red', 'blue', 'fill', 'fill2', 'scrim', 'navBg', 'barBg', 'shadow', 'trackOff', 'toggleBg', 'onAccent', 'placeholder', 'cardShadow']) {
      assert.ok(p[key], key);
    }
    for (const surface of [p.bg, p.card, p.fill]) {
      for (const ink of [p.text, p.text2, p.sub, p.placeholder]) assert.ok(contrast(ink, surface) >= 4.5, `${ink} on ${surface}`);
    }
    assert.ok(contrast(p.onAccent, p.accent) >= 4.5);
    assert.ok(contrast(p.accentText, p.bg) >= 4.5);
    p.text = 'changed';
    assert.notEqual(design.palette(dark).text, 'changed', 'each render gets a fresh palette');
  }
});

test('authoritative stylesheet and palette load after legacy styles and before rendering', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(html.indexOf('styles/lorefy-design-system.css') > html.indexOf('styles/lorefy-auth-flow.css'));
  assert.ok(html.indexOf('modules/lorefy-design-system.js') < html.indexOf('uploads/files/lorefy-app.js'));
  assert.match(sw, /styles\/lorefy-design-system\.css/);
  assert.match(sw, /modules\/lorefy-design-system\.js/);
  const app = fs.readFileSync(path.join(root, 'uploads/files/lorefy-app.js'), 'utf8');
  assert.match(app, /makeC=e=>window\.LorefyDesignSystem\.palette\(e\)/);
  assert.match(app, /className:"lf-settings-switch",role:"switch"/);
  assert.match(app, /"aria-checked":n/);
  assert.match(app, /className:"lf-sort-control"/);
  assert.match(app, /"aria-label":b\[o\.id\]\?uiText\(W,"تعديل "/);
  assert.match(app, /"Edit "\+o\.title\+" in library"/);
});

test('shared UI covers all primary surfaces, safe areas, keyboard focus and motion', () => {
  const css = fs.readFileSync(path.join(root, 'styles/lorefy-design-system.css'), 'utf8');
  for (const selector of ['lf-search-box', 'lf-library-grid', 'lf-profile-identity', 'lf-reader-full', 'lf-community-post-card', 'lf-community-compose', 'lf-community-thread', 'lf-detail-content', 'lf-discover-page', 'lf-settings-sheet', 'lf-auth', 'lf-pref-board', 'lf-wr-summary', 'lf-bottom-nav']) assert.ok(css.includes(selector), selector);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /min-width: 768px/);
  assert.match(css, /--nc-bottom/);
  assert.doesNotMatch(css, /font-size:\s*[^;]*vw|letter-spacing:\s*-/);
});

test('visible subtitles do not reintroduce Asian-script or duplicate catalog names', () => {
  const design = require('../modules/lorefy-design-system.js');
  assert.equal(design.subtitle({ title: 'Berserk', ar: 'ベルセルク' }), '');
  assert.equal(design.subtitle({ title: 'Solo Leveling', ar: '나 혼자만 레벨업' }), '');
  assert.equal(design.subtitle({ title: 'Berserk', ar: ' berserk ' }), '');
  assert.equal(design.subtitle({ title: 'Berserk', ar: 'بيرسيرك' }), 'بيرسيرك');
});

test('home reply activity never inserts above navigation chrome or into community', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-growth-features.js'), 'utf8');
  const section = source.slice(source.indexOf('function syncHomeReplyShelf()'), source.indexOf('/* ── profile launcher row'));
  assert.match(section, /var content = home\.querySelector\("\.lf-home-content"\);/);
  assert.match(section, /if \(!content\) return false/);
  assert.match(section, /shelf\.parentElement !== content/);
});

test('async replies hydrate their icons after being attached to the document', () => {
  const source = fs.readFileSync(path.join(root, 'modules/lorefy-community.js'), 'utf8');
  const section = source.slice(source.indexOf('async function paintReplies('), source.indexOf('send.addEventListener("click"'));
  assert.match(section, /repliesHost\.appendChild\(row\);[\s\S]*hydrateIcons\(repliesHost\);/);
});
