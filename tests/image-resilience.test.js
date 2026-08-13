const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("remote artwork has a visible local fallback and bounded failure path", () => {
  assert.match(indexSource, /installImageResilience/);
  assert.match(indexSource, /data:image\/svg\+xml/);
  assert.match(indexSource, /backgroundImage/);
  assert.match(indexSource, /MutationObserver/);
  assert.match(indexSource, /5500/);
  assert.match(indexSource, /lorefyFallbackApplied/);
});
