import assert from "node:assert/strict";
import test from "node:test";

import { toggleLibraryEntry } from "../src/library";

test("toggleLibraryEntry adds a work once and removes it on the next action", () => {
  const first = toggleLibraryEntry([], "one-piece");
  assert.deepEqual(first, ["one-piece"]);
  assert.deepEqual(toggleLibraryEntry(first, "one-piece"), []);
});

test("toggleLibraryEntry preserves unrelated works", () => {
  assert.deepEqual(toggleLibraryEntry(["berserk"], "one-piece"), ["berserk", "one-piece"]);
});
