const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "auth/lorefy-auth.js"), "utf8");
const titleFunction = source.match(/function se\(e,n\)\{.*?\}(?=function F\()/s);

test("onboarding shows Arabic or English names, never Japanese catalog metadata", () => {
  assert.ok(titleFunction, "onboarding title selector exists");
  const displayTitle = vm.runInNewContext(`(${titleFunction[0]})`);
  const berserk = { title: "Berserk", ar: "\u30d9\u30eb\u30bb\u30eb\u30af" };
  const chainsaw = { title: "Chainsaw Man", ar: "\u30c1\u30a7\u30f3\u30bd\u30fc\u30de\u30f3" };
  const arabic = { title: "The Three-Body Problem", ar: "\u0645\u0634\u0643\u0644\u0629 \u0627\u0644\u0623\u062c\u0633\u0627\u0645 \u0627\u0644\u062b\u0644\u0627\u062b\u0629" };
  const untranslated = { title: "\u4e09\u4f53", ar: "\u4e09\u4f53" };

  assert.equal(displayTitle(berserk, "ar"), "Berserk");
  assert.equal(displayTitle(chainsaw, "ar"), "Chainsaw Man");
  assert.equal(displayTitle(arabic, "ar"), arabic.ar);
  assert.equal(displayTitle(untranslated, "ar"), "");
  assert.equal(displayTitle(berserk, "en"), "Berserk");
});

test("onboarding omits untranslated works but retains native names as search terms", () => {
  assert.match(source, /!se\(u,t\)/);
  assert.match(source, /\[u\.title,u\.ar,u\.auth\]/);
});

test("real AniList records have readable onboarding titles", () => {
  const displayTitle = vm.runInNewContext(`(${titleFunction[0]})`);
  const catalog = { window: { LorefyMangaData: [] } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "uploads/lorefy-data-part15.js"), "utf8"), catalog);
  const byId = (id) => catalog.window.LorefyMangaData.find((work) => work.id === id);

  assert.equal(displayTitle(byId("anilist-30002"), "ar"), "Berserk");
  assert.equal(displayTitle(byId("anilist-105778"), "ar"), "Chainsaw Man");
});
