const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

test("catalog and saved character selections expose Arabic or Latin titles only", () => {
  const catalog = read("modules", "lorefy-api-catalog.js");
  const growth = read("modules", "lorefy-growth-features.js");

  assert.match(catalog, /function isSupportedDisplayTitle\(/);
  assert.match(catalog, /function firstSupportedTitle\(/);
  assert.match(catalog, /function normalizeCachedWork\(/);
  assert.match(catalog, /cached\.works = \(Array\.isArray\(cached\.works\) \? cached\.works : \[\]\)\.map\(normalizeCachedWork\)\.filter\(function \(work\)/);
  assert.match(catalog, /return work && !\(global\.LorefyCatalogPolicy && \(global\.LorefyCatalogPolicy\.isExcludedWork\(work\) \|\| global\.LorefyCatalogPolicy\.isExplicitWork\(work\) \|\| global\.LorefyCatalogPolicy\.isAiGeneratedWork\(work\)\)\)/);
  assert.doesNotMatch(catalog, /ar:\s*firstTitle\(\{\s*english:\s*media\.title\s*&&\s*media\.title\.native\s*}\)/);
  assert.match(growth, /function mlTitleOf\(w\)\s*\{[\s\S]*?isSupportedDisplayTitle/);
  assert.match(growth, /workTitle:\s*profileWorkTitle\(workId\)/);
  assert.match(growth, /function profileWorkTitle\(workId\)\s*\{[\s\S]*?return mlTitleOf\(work\) \|\| "عمل في مكتبتك"/);
});

test("shelf shares render only selected items while work reviews remain a single card", () => {
  const share = read("modules", "lorefy-share-studio.js");
  const growth = read("modules", "lorefy-growth-features.js");

  assert.match(growth, /data-lf-share-layout/);
  assert.match(share, /isShelfShare/);
  assert.match(share, /function collectShelfItems\(card\)/);
  assert.doesNotMatch(share, /length: 10 - shelfItems\.length/);
  assert.match(share, /for \(var i = 0; i < images\.length; i\+\+\)/);
  assert.match(share, /shelfItems\.map\(function \(item\) \{ return item\.label; \}\)/);
  assert.match(share, /var useSingle = images\.length === 1/);
  assert.match(share, /Promise\.all\(\[Promise\.all\(sources\.map\(loadImage\)\), loadImage/);
});

test("adaptive layouts retain their intended scale without disabling browser zoom", () => {
  const html = read("index.html");

  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1[,\"]/);
  assert.match(html, /var adaptive = nativeApp/);
  assert.match(html, /data-lorefy-adaptive-shell/);
  assert.match(html, /dev\.style\.transform = 'none'/);
});

test("unsynced account edits are journaled before a later cloud pull can replace local storage", () => {
  const backend = read("backend", "lorefy-backend.js");

  assert.match(backend, /PENDING_STATE_KEY/);
  assert.match(backend, /function readPendingState\(/);
  assert.match(backend, /function stagePendingState\(/);
  assert.match(backend, /stagePendingState\(k, v\)/);
  assert.match(backend, /Object\.keys\(pending\)\.forEach/);
  assert.match(backend, /clearPendingState\(/);
});

test("the service worker updates the audited share and persistence modules", () => {
  const worker = read("sw.js");

  const shareStyle = read("index.html").match(/styles\/lorefy-share-studio\.css\?v=[^"']+/);
  assert.ok(shareStyle, "the page must version the share studio styles");
  assert.ok(worker.includes(shareStyle[0]), "the offline cache must use the page's share studio style version");
  const shareAsset = read("index.html").match(/modules\/lorefy-share-studio\.js\?v=[^"']+/);
  assert.ok(shareAsset, "the page must version the share studio");
  assert.ok(worker.includes(shareAsset[0]), "the offline cache must use the page's share studio version");
  const backendAsset = read("index.html").match(/backend\/lorefy-backend\.js\?v=[^"']+/);
  assert.ok(backendAsset, "the page must version the backend");
  assert.ok(worker.includes(backendAsset[0]), "the offline cache must use the page's backend version");
});
