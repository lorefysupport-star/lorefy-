const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const views = require('../modules/lorefy-library-view.js');

function element() {
  const classes = new Set();
  return { children: [], attributes: {}, textContent: '', title: '',
    classList: { toggle(name, on) { on ? classes.add(name) : classes.delete(name); }, contains(name) { return classes.has(name); } },
    style: { setProperty(name, value) { this[name] = value; } },
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name] || null; },
    appendChild(node) { this.children.push(node); },
    querySelector(selector) { return selector === '.lf-profile-spine-title' ? this.children.find(n => n.className === 'lf-profile-spine-title') || null : null; }
  };
}
function fixture(titles) {
  const favorites = element();
  favorites.children = titles.map(title => {
    const slot = element(), cover = element(), image = title ? { parentElement: cover } : null;
    slot.setAttribute('data-work-title', title || '');
    slot.querySelector = selector => selector === 'img' ? image : null;
    slot.cover = cover;
    return slot;
  });
  favorites.querySelector = selector => selector === 'img' && titles.some(Boolean) ? {} : null;
  const doc = { querySelectorAll(selector) { assert.ok(selector.includes(':not(.lf-profile-top-characters-grid)')); return [favorites]; }, createElement: element };
  return { doc, favorites };
}

test('presentation limits retain all seven React cards when switching favorites views', () => {
  assert.equal(views.favoriteLimit('showcase'),3);
  assert.equal(views.favoriteLimit('spines'),7);
  assert.equal(views.favoriteLimit('grid'),4);
  const {doc,favorites}=fixture(['a','b','c','d','e','f','g']);
  const cards=favorites.children.slice();
  views.syncProfileFavorites(doc,'grid');
  assert.equal(cards.filter(c=>!c.classList.contains('lf-favorite-overflow')).length,4);
  views.syncProfileFavorites(doc,'spines');
  assert.equal(cards.filter(c=>!c.classList.contains('lf-favorite-overflow')).length,7);
  assert.deepEqual(favorites.children,cards);
});

test('legacy React favorites picker cannot truncate the seven saved choices', () => {
  const source=fs.readFileSync(path.join(__dirname,'..','uploads/files/lorefy-app.js'),'utf8');
  assert.ok(source.includes('return n?d:[o.id,...d].slice(0,7)'));
  assert.ok(source.includes('r=Ie.map(n=>workById(n)).filter(Boolean).slice(0,7)'));
});

test('favorite works adopt the saved spine view without changing slots or images', () => {
  const { doc, favorites } = fixture(['Pride and Prejudice', 'كتاب عربي', '', '']);
  const slots = favorites.children.slice();
  views.syncProfileFavorites(doc, 'spines');
  assert.equal(favorites.classList.contains('is-spine-view'), true);
  assert.deepEqual(favorites.children, slots);
  assert.equal(slots[0].cover.children[0].textContent, 'Pride and Prejudice');
  assert.equal(slots[1].cover.children[0].textContent, 'كتاب عربي');
  assert.equal(slots[2].classList.contains('is-empty-spine'), true);
  assert.equal(slots[0].cover.children[0].attributes['aria-hidden'], 'true');
});

test('repainting is idempotent, updates work titles and switching back restores covers', () => {
  const { doc, favorites } = fixture(['Berserk', '', '', '']);
  views.syncProfileFavorites(doc, 'spines');
  views.syncProfileFavorites(doc, 'spines');
  assert.equal(favorites.children[0].cover.children.length, 1);
  favorites.children[0].setAttribute('data-work-title', 'One Piece');
  views.syncProfileFavorites(doc, 'spines');
  assert.equal(favorites.children[0].cover.children[0].textContent, 'One Piece');
  views.syncProfileFavorites(doc, 'grid');
  assert.equal(favorites.classList.contains('is-spine-view'), false);
  views.syncProfileFavorites(doc, 'shelf');
  assert.equal(favorites.classList.contains('is-spine-view'), false);
});

test('an empty favorites section retains its existing single add action', () => {
  const { doc, favorites } = fixture(['', '', '', '']);
  views.syncProfileFavorites(doc, 'spines');
  assert.equal(favorites.classList.contains('is-spine-view'), false);
  assert.equal(favorites.children[0].cover.children.length, 0);
});

test('a managed missing cover is not treated as an empty favorite slot on the shelf',()=>{
 const {doc,favorites}=fixture(['','','','']),slot=favorites.children[0],cover=slot.cover;
 slot.setAttribute('data-work-title','Missing cover');slot.querySelector=s=>s==='[data-lorefy-book-cover]'?cover:null;
 favorites.querySelector=s=>s==='[data-lorefy-book-cover]'?cover:null;
 views.syncProfileFavorites(doc,'spines');
 assert.equal(favorites.classList.contains('is-spine-view'),true);assert.equal(slot.classList.contains('is-empty-spine'),false);
 assert.equal(cover.children[0].textContent,'Missing cover');assert.equal(favorites.children[1].classList.contains('is-empty-spine'),true);
});

test('cover mode fits four dimensional books without inheriting spine geometry', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles/lorefy-interface-settings.css'), 'utf8');
  const selector = '\\.lf-profile-favorites:not\\(\\.is-spine-view\\):not\\(\\.is-empty\\):not\\(\\.lf-profile-top-characters-grid\\)';
  assert.match(css, new RegExp(selector + '\\s*\\{[^}]*grid-template-columns:repeat\\(4,minmax\\(0,1fr\\)\\)\\s*!important[^}]*grid-auto-flow:row[^}]*gap:10px[^}]*margin-top:0', 's'));
  assert.match(css, new RegExp(selector + ' > div\\s*\\{[^}]*min-height:0\\s*!important[^}]*aspect-ratio:2/3\\s*!important', 's'));
  assert.match(css, new RegExp(selector + ' > div > div:first-child\\s*\\{[^}]*height:100%\\s*!important[^}]*aspect-ratio:2/3\\s*!important', 's'));
  assert.match(css, /\.lf-profile-top-works-head\s*\{[^}]*text-align:right[^}]*margin:0 0 8px/s);
  assert.match(css, new RegExp(selector + ' > div > div:first-child::after\\s*\\{[^}]*box-shadow:inset', 's'));
});

test('profile spines have real work titles, theme tokens and accessible stable geometry', () => {
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.ok(read('uploads/files/lorefy-app.js').includes('"data-work-title":n.title'));
  const css = read('styles/lorefy-interface-settings.css');
  assert.match(css, /\.lf-profile-favorites\.is-spine-view[^}]*grid-template-columns:\s*repeat\(4,minmax\(44px,74px\)\)/s);
  assert.match(css, /\.lf-profile-spine-title/);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view > div\s*\{[^}]*width:100%\s*!important[^}]*max-width:74px\s*!important[^}]*aspect-ratio:auto\s*!important/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view[^}]*var\(--ui-line\)/s);
  const source = read('modules/lorefy-library-view.js');
  assert.ok(source.indexOf('syncProfileFavorites(doc,') < source.indexOf("var page = doc.querySelector('.lf-library-page')"));
});

test('favorite books are taller, responsive and grounded on a dimensional shelf', () => {
  const { doc, favorites } = fixture(['Pride and Prejudice', 'Nineteen Eighty-Four', '', '']);
  views.syncProfileFavorites(doc, 'spines');
  for (const slot of favorites.children.slice(0, 2)) {
    const height = Number.parseInt(slot.style['--spine-height']);
    assert.ok(height >= 176 && height <= 220);
  }
  const heights = favorites.children.slice(0, 2).map(slot => Number.parseInt(slot.style['--spine-height']));
  assert.ok(Math.abs(heights[0] - heights[1]) >= 24, 'book heights should have visible variation');
  views.syncProfileFavorites(doc, 'spines');
  assert.deepEqual(favorites.children.slice(0, 2).map(slot => Number.parseInt(slot.style['--spine-height'])), heights);
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles/lorefy-interface-settings.css'), 'utf8');
  assert.match(css, /\.lf-profile-page > \.lf-profile-favorites\.is-spine-view\s*\{[^}]*grid-auto-rows:auto[^}]*justify-content:center\s*!important/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view::after\s*\{[^}]*margin-inline:auto/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view > \.is-empty-spine\s*\{[^}]*height:180px\s*!important/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view > \.is-empty-spine:nth-child\(even\)\s*\{[^}]*height:196px/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view \.lf-profile-spine-title\s*\{[^}]*max-width:calc\(100% - 14px\)[^}]*white-space:nowrap/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view::after\s*\{[^}]*height:8px/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view \.lf-profile-spine-cover::before\s*\{[^}]*box-shadow:inset/s);
  assert.doesNotMatch(css, /\.lf-profile-favorites\.is-spine-view > \.is-empty-spine\s*\{[^}]*dashed/s);
  assert.match(css, /\.lf-profile-page > \.lf-profile-favorites\.is-spine-view\s*\{[^}]*gap:8px\s*!important[^}]*width:calc\(100% - 40px\)\s*!important/s);
  assert.match(css, /\.lf-profile-page > \.lf-profile-favorites\.is-spine-view\s*\{[^}]*max-width:336px\s*!important/s);
  assert.match(css, /\.lf-profile-favorites\.is-spine-view::after\s*\{[^}]*width:100%/s);
});
