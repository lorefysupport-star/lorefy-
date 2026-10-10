const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("local tool caches are excluded from Git and cloud build uploads", () => {
  for (const name of [".gitignore", ".easignore"]) {
    const lines = fs.readFileSync(path.join(root, name), "utf8").split(/\r?\n/);
    assert.ok(lines.includes("tools/.cache/"), `${name} must ignore local tool caches`);
  }
});

test("cloud archives include the catalog inputs required by native preparation without reports or caches", () => {
  const lines = fs.readFileSync(path.join(root, ".easignore"), "utf8").split(/\r?\n/);
  assert.equal(lines.includes("output/"), false, "excluding the parent directory prevents required catalog files from reaching EAS");
  assert.ok(lines.includes("output/*"));
  assert.ok(lines.includes("!output/api-catalog"), "Windows EAS checks directory paths without a trailing slash");
  assert.ok(lines.includes("output/api-catalog/*"));
  for (const file of ["manifest", "manga", "manhwa", "manhua", "comics", "novel", "book", "light-novel", "web-novel"]) {
    assert.ok(lines.includes(`!output/api-catalog/${file}.json`), `cloud archive must retain ${file}.json`);
  }
});
