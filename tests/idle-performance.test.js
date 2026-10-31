const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, "modules", name), "utf8");

test("community enhancement does not loop on its own text updates", () => {
  const community = read("lorefy-community.js");
  assert.match(community, /MutationObserver\(function \(mutations\)/);
  assert.match(community, /mutations\.some\(function \(mutation\)/);
  assert.match(community, /node\.nodeType === 1/);
  assert.doesNotMatch(community, /setInterval\(function \(\) \{ enhance\(\); ensureOwnerPostMetric\(\); \}, 1200\)/);
  assert.match(community, /existingCount\.textContent !== String\(count\)/);
});

test("growth maintenance ignores text-only mutations and avoids redundant reaction writes", () => {
  const growth = read("lorefy-growth-features.js");
  assert.match(growth, /MutationObserver\(function \(mutations\)/);
  assert.match(growth, /mutations\.some\(function \(mutation\)/);
  assert.match(growth, /node\.nodeType === 1/);
  assert.match(growth, /span\.textContent !== display/);
  assert.match(growth, /card\.firstChild !== actionButtons\.delete/);
  assert.match(growth, /list\.dataset\.replyFingerprint !== fingerprint/);
  assert.match(growth, /anchor\.nextSibling !== section/);
  assert.match(growth, /rail\.dataset\.ratedCharactersSignature !== signature/);
  assert.match(growth, /recent\.nextSibling !== rated/);
  assert.match(growth, /favorites\.nextSibling !== topCharacters/);
});
