const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const growth = fs.readFileSync(path.join(root, "modules", "lorefy-growth-features.js"), "utf8");
const app = fs.readFileSync(path.join(root, "uploads", "files", "lorefy-app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");

function functionSource(source, name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf(`function ${nextName}(`, start + 1);
  return source.slice(start, end);
}

test("top-list image actions await the native iOS share sheet", () => {
  const workPoster = functionSource(growth, "mlPoster", "mlCoverStrip");
  const characterPoster = functionSource(growth, "clPoster", "drawFallbackFace");

  for (const poster of [workPoster, characterPoster]) {
    assert.match(poster, /return global\.LorefyShareStudio\.nativeFileShare\(/);
    assert.match(poster, /\.catch\(function \(error\)/);
    assert.doesNotMatch(poster, /LorefyShareStudio\.saveFile\(file\)/);
  }
});

test("profile favorites keeps a bounded picker and at most seven persisted ids", () => {
  assert.match(app, /PROFILE_FAVORITES_PICKER_BATCH=12/);
  assert.match(app, /\.slice\(0,PROFILE_FAVORITES_PICKER_BATCH\)/);
  assert.match(app, /return n\?d:\[o\.id,\.\.\.d\]\.slice\(0,7\)/);
});

test("profile favorite search limits remote covers and exposes incremental results", () => {
  const editor = functionSource(growth, "openProfileFavouriteWorksEditor", "syncProfileFavouriteWorksControls");

  assert.match(editor, /var visibleLimit = 12/);
  assert.match(editor, /matches\.slice\(0, visibleLimit\)/);
  assert.match(editor, /lf-top-works-editor-more/);
  assert.match(editor, /visibleLimit \+= 12/);
  assert.doesNotMatch(editor, /slice\(0, query \? 48 : 12\)/);
});

test("profile top-four works stop the legacy handler before opening the native editor", () => {
  const sync = functionSource(growth, "syncProfileFavouriteWorksControls", "syncProfileTopCharacters");

  assert.match(sync, /slot\.setAttribute\("aria-label"/);
  assert.match(sync, /slot\.addEventListener\("click", openSlot, true\)/);
  assert.match(sync, /event\.stopPropagation\(\)/);
  assert.match(sync, /event\.stopImmediatePropagation\(\)/);
});

test("profile fixes use fresh browser and offline-cache asset versions", () => {
  for (const asset of ["uploads/files/lorefy-app.js", "modules/lorefy-growth-features.js"]) {
    const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const versioned = index.match(new RegExp(`${escaped}\\?v=[^"']+`));
    assert.ok(versioned, `${asset} must have a browser cache version`);
    assert.ok(serviceWorker.includes(versioned[0]), `${asset} must have the same offline-cache version`);
  }
  assert.match(serviceWorker, /const CACHE = 'lorefy-v[^']+'/);
});
