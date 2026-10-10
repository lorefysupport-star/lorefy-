const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const sizeOfPng = (relativePath) => {
  const bytes = fs.readFileSync(path.join(root, relativePath));
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

test("uses the feather logo for every shipped application icon", () => {
  [
    ["launch/brand/lorefy-feather.png", 1280],
    ["launch/icons/favicon-32.png", 32],
    ["launch/icons/icon-512.png", 512],
    ["launch/icons/icon-192.png", 192],
    ["launch/icons/icon-180.png", 180],
    ["launch/icons/maskable-512.png", 512],
    ["ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", 1024],
    ["ios/App/App/public/launch/brand/lorefy-feather.png", 1280],
    ["ios/App/App/public/launch/icons/icon-180.png", 180]
  ].forEach(([relativePath, dimension]) => {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, relativePath);
    assert.deepEqual(sizeOfPng(relativePath), [dimension, dimension], relativePath);
  });
});

test("renders the new feather mark in the central Lorefy brand components", () => {
  const index = read("index.html");
  assert.match(index, /function lorefyMark/);
  assert.match(index, /launch\/brand\/lorefy-feather\.png/);
  assert.doesNotMatch(index, /function spark\(/);
  assert.match(index, /lf-bootstrap-logo/);
});
