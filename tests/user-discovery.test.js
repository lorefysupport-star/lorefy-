const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  normalizeQuery,
  createUserDirectory
} = require("../modules/lorefy-user-discovery.js");

const testReaders = [{ id: "reader-qa", username: "qa_reader", name: "Test reader" }];

test("reader search normalizes handles and refuses one-character enumeration", async () => {
  const directory = createUserDirectory({ readers: testReaders });
  assert.equal(normalizeQuery(" @Qa_Reader "), "qa_reader");
  assert.deepEqual(await directory.search("q"), []);
  assert.equal((await directory.search("@qa_reader"))[0].username, "qa_reader");
});

test("reader search ranks exact usernames first and excludes the signed-in or blocked reader", async () => {
  const directory = createUserDirectory({
    readers: [
      { id: "exact", username: "reader", name: "A" },
      { id: "partial", username: "reader_club", name: "B" },
      { id: "blocked", username: "another_reader", name: "Reader" }
    ],
    currentUserId: "partial",
    blockedIds: ["blocked"]
  });

  assert.deepEqual((await directory.search("reader")).map((reader) => reader.id), ["exact"]);
});

test("following is persisted locally and delegates to the live account adapter when available", async () => {
  const calls = [];
  const directory = createUserDirectory({
    readers: testReaders,
    adapter: { toggleProfileFollow: async (id, following) => { calls.push([id, following]); return following; } }
  });

  assert.equal(await directory.setFollowing("reader-qa", true), true);
  assert.equal(directory.isFollowing("reader-qa"), true);
  assert.deepEqual(calls, [["reader-qa", true]]);
});

test("an explicitly empty live directory never falls back to demo readers", async () => {
  const directory = createUserDirectory({ readers: [] });
  assert.deepEqual(await directory.search("reader"), []);
});

test("a failed live follow request leaves the local follow state unchanged", async () => {
  const directory = createUserDirectory({
    readers: testReaders,
    adapter: { toggleProfileFollow: async () => { throw new Error("offline"); } }
  });

  await assert.rejects(() => directory.setFollowing("reader-qa", true), /offline/);
  assert.equal(directory.isFollowing("reader-qa"), false);
});

test("ships a public profile RPC and mounts reader results inside the existing work search", () => {
  const root = path.resolve(__dirname, "..");
  const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260813000911_public_reader_discovery.sql"), "utf8");
  const backend = fs.readFileSync(path.join(root, "backend/lorefy-backend.js"), "utf8");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const discovery = fs.readFileSync(path.join(root, "modules/lorefy-user-discovery.js"), "utf8");

  assert.match(migration, /search_public_profiles/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /profile_follows/i);
  assert.match(backend, /searchPublicProfiles/);
  assert.match(backend, /toggleProfileFollow/);
  assert.match(index, /modules\/lorefy-user-discovery\.js/);
  assert.match(discovery, /\.lf-search-box input/);
  assert.match(discovery, /data-lf-inline-reader-results/);
  assert.doesNotMatch(discovery, /lf-reader-search-launch/);
});

test("reader results open the full app profile and broadcast cloud follow changes", () => {
  const root = path.resolve(__dirname, "..");
  const discovery = fs.readFileSync(path.join(root, "modules/lorefy-user-discovery.js"), "utf8");

  assert.match(discovery, /lorefy:open-reader-profile/);
  assert.match(discovery, /lorefy:profile-follow-changed/);
  const opener = discovery.slice(discovery.indexOf("function openReaderProfile"), discovery.indexOf("function inlineReaderSection"));
  assert.doesNotMatch(opener, /createElement/);
});
test('inline reader search supplies complete Arabic and English result labels',()=>{
  const api=require('../modules/lorefy-user-discovery.js');
  assert.deepEqual(api.readerSearchLabels('en',10),{title:'Readers',searching:'Searching...',results:'10 results',open:'Open reader ',following:'Following',public:'Public account'});
  const ar=api.readerSearchLabels('ar',10);
  assert.equal(ar.title,'حسابات القراء');assert.equal(ar.results,'10 نتائج');assert.equal(ar.open,'فتح حساب ');
});
