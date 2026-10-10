const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const libraryView = require('../modules/lorefy-library-view.js');

function fixture() {
  const classes = new Set();
  const grid = {
    classList: {
      toggle(name, active) { if (active) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); }
    }
  };
  const buttons = ['grid', 'shelf'].map((view) => ({
    dataset: { view },
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; }
  }));
  return { grid, buttons };
}

test('library view accepts covers, spines and the existing list mode', () => {
  assert.equal(libraryView.normalizeMode('spines'), 'spines');
  assert.equal(libraryView.normalizeMode('shelf'), 'shelf');
  assert.equal(libraryView.normalizeMode('grid'), 'grid');
  assert.equal(libraryView.normalizeMode('invalid'), 'grid');
});

test('library shelf mode updates the layout and both button states', () => {
  const { grid, buttons } = fixture();
  libraryView.applyMode(grid, buttons, 'shelf');
  assert.equal(grid.classList.contains('is-shelf-view'), true);
  assert.equal(buttons[0].attributes['aria-pressed'], 'false');
  assert.equal(buttons[1].attributes['aria-pressed'], 'true');

  libraryView.applyMode(grid, buttons, 'grid');
  assert.equal(grid.classList.contains('is-shelf-view'), false);
  assert.equal(buttons[0].attributes['aria-pressed'], 'true');
  assert.equal(buttons[1].attributes['aria-pressed'], 'false');
});

test('library shelf presents full-width readable rows instead of miniature covers', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles', 'lorefy-visual-polish.css'), 'utf8');
  assert.match(css, /\.lf-library-grid\.is-shelf-view\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.lf-library-grid\.is-shelf-view\s+\.lf-library-card\s*\{[^}]*grid-template-columns:\s*76px\s+minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.lf-library-grid\.is-shelf-view\s+\.lf-library-copy strong\s*\{[^}]*font-size:\s*15px/s);
  assert.match(css, /\.lf-library-grid\.is-shelf-view\s+\.lf-library-copy span\s*\{[^}]*display:\s*block/s);
});

test('completed works do not claim the reader still needs to save a stopping point', () => {
  assert.equal(libraryView.progressLabel(true, 'لم تحفظ مكان توقفك بعد'), 'مكتمل');
  assert.equal(libraryView.progressLabel(true, 'الفصل 42'), 'الفصل 42');
  assert.equal(libraryView.progressLabel(false, 'لم تحفظ مكان توقفك بعد'), 'لم تحفظ مكان توقفك بعد');
});
