import assert from "node:assert/strict";
import test from "node:test";

import {
  findReaders,
  searchWorks,
  type Reader,
  type Work
} from "../src/catalog";

const works: Work[] = [
  { id: "one-piece", title: "One Piece", author: "Eiichiro Oda", type: "Manga", score: 4.7, cover: "", progress: 1185, total: 1185 },
  { id: "berserk", title: "Berserk", author: "Kentaro Miura", type: "Manga", score: 4.8, cover: "", progress: 0, total: 384 }
];

const readers: Reader[] = [
  { id: "qa", username: "qa_reader", name: "قارئ Lorefy", bio: "قارئ مانجا", genres: ["مانجا"], following: true },
  { id: "noura", username: "noura_pages", name: "نورة", bio: "روايات", genres: ["رواية"], following: false }
];

test("searchWorks matches title and author without returning duplicate work ids", () => {
  assert.deepEqual(searchWorks(works, "oda").map((work) => work.id), ["one-piece"]);
  assert.deepEqual(searchWorks([...works, works[0]], "one").map((work) => work.id), ["one-piece"]);
});

test("findReaders treats @username and display name as the same unified search input", () => {
  assert.deepEqual(findReaders(readers, "@qa_reader").map((reader) => reader.id), ["qa"]);
  assert.deepEqual(findReaders(readers, "نورة").map((reader) => reader.id), ["noura"]);
  assert.deepEqual(findReaders(readers, "q"), []);
});
