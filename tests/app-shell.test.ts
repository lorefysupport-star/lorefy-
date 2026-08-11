import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("native shell includes the Lorefy tabs and unified reader search", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "App.tsx"), "utf8");

  assert.match(source, /حسابات القراء/);
  assert.match(source, /library/);
  assert.match(source, /Ionicons/);
  assert.doesNotMatch(source, /Open up App\.tsx/);
});
