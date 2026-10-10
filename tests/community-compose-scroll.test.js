const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

test("the attachment picker sits above the post composer", () => {
  const css = read("styles", "lorefy-community.css");
  assert.match(css, /\.lf-community-picker\s*\{[^}]*z-index:\s*1400/s);
  assert.match(css, /\.lf-community-compose-sheet\s*\{[^}]*z-index:\s*1300/s);
});

test("community publishing uses plain, accurate Arabic labels", () => {
  const community = read("modules", "lorefy-community.js");
  assert.doesNotMatch(community, /نبض القراء|توبات|مساحتك بين القرّاء|تعذر نشر التغريدة/);
  assert.match(community, /ترتيب الشخصيات/);
  assert.match(community, /منشوراتي/);
});

test("community selects its filter row instead of the home reply shelf", () => {
  const community = read("modules", "lorefy-community.js");
  assert.doesNotMatch(community, /page\.firstElementChild/);
  assert.match(community, /function communityFilterTabs\(page\)/);
  assert.match(community, /if \(!page\) \{[\s\S]*?querySelectorAll\("\.lf-community-post-feed"\)/);
});

test("scroll memory keeps separate positions for tabs and works", () => {
  const modulePath = path.join(root, "modules", "lorefy-scroll-memory.js");
  assert.ok(fs.existsSync(modulePath), "scroll memory module is required");
  const { createScrollMemory, viewKey } = require(modulePath);
  const memory = createScrollMemory();
  const home = { scrollTop:0 };
  memory.enter("main:home", home);
  home.scrollTop = 640;
  memory.remember();
  memory.enter("detail:work-1", { scrollTop:0 });
  memory.enter("main:home", { scrollTop:0 });
  assert.equal(memory.position("main:home"), 640);
  assert.equal(memory.position("detail:work-1"), 0);
  assert.equal(viewKey("main", { homeTab:"community" }), "main:community");
  assert.equal(viewKey("detail", { workId:"work-2" }), "detail:work-2");
});

test("a removed screen cannot overwrite its saved scroll position", () => {
  const { createScrollMemory } = require(path.join(root, "modules", "lorefy-scroll-memory.js"));
  const memory = createScrollMemory();
  const home = { scrollTop:0, isConnected:true };
  memory.enter("main:home", home);
  home.scrollTop = 640;
  memory.remember();
  home.isConnected = false;
  home.scrollTop = 0;
  memory.enter("detail:work-1", { scrollTop:0, isConnected:true });
  assert.equal(memory.position("main:home"), 640);
});
