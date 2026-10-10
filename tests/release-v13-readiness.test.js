const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const plist = require("plist");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

test("all runtime AniList requests use the shared Supabase catalog proxy", () => {
  const proxy = read("modules", "lorefy-data-proxy.js");
  const catalog = read("modules", "lorefy-api-catalog.js");
  const covers = read("modules", "lorefy-cover-api.js");
  const growth = read("modules", "lorefy-growth-features.js");
  const characters = read("modules", "lorefy-character-system.js");

  assert.match(proxy, /functions\/v1\/lorefy-public/);
  assert.match(catalog, /LorefyDataProxy\.catalogUrl/);
  assert.match(covers, /LorefyDataProxy\.catalogUrl/);
  assert.match(growth, /LorefyDataProxy\.catalogUrl/);
  assert.match(characters, /LorefyDataProxy\.catalogUrl/);
  const sandbox = {
    window: {
      LOREFY_RELEASE: { catalogProxyUrl: "https://example.supabase.co/functions/v1/lorefy-public" },
      location: { href: "capacitor://localhost/", origin: "capacitor://localhost" }
    },
    URL
  };
  vm.runInNewContext(proxy, sandbox);
  assert.equal(
    sandbox.window.LorefyDataProxy.catalogUrl("anilist", "https://graphql.anilist.co"),
    "https://example.supabase.co/functions/v1/lorefy-public/catalog-anilist"
  );
  assert.equal(
    sandbox.window.LorefyDataProxy.catalogUrl("jikan", "https://api.jikan.moe/v4/manga/136/pictures"),
    "https://api.jikan.moe/v4/manga/136/pictures"
  );
  assert.equal(
    sandbox.window.LorefyDataProxy.catalogUrl("jikan", "https://api.jikan.moe/v4/manga/136/characters"),
    "https://api.jikan.moe/v4/manga/136/characters"
  );
  assert.equal(
    sandbox.window.LorefyDataProxy.catalogUrl("wikipedia", "https://en.wikipedia.org/w/api.php?action=query"),
    "https://example.supabase.co/functions/v1/lorefy-public/catalog-wikipedia?action=query"
  );
  assert.equal(
    sandbox.window.LorefyDataProxy.catalogUrl("dc-fandom", "https://dc.fandom.com/api.php?action=query&titles=Batman"),
    "https://example.supabase.co/functions/v1/lorefy-public/catalog-dc-fandom?action=query&titles=Batman"
  );
  assert.equal(
    sandbox.window.LorefyDataProxy.catalogUrl("marvel-fandom", "https://marvel.fandom.com/api.php?action=query&titles=Spider-Man"),
    "https://example.supabase.co/functions/v1/lorefy-public/catalog-marvel-fandom?action=query&titles=Spider-Man"
  );
  assert.equal(
    sandbox.window.LorefyDataProxy.mediaUrl("https://covers.openlibrary.org/b/id/42-L.jpg"),
    "https://example.supabase.co/functions/v1/lorefy-public/media?url=https%3A%2F%2Fcovers.openlibrary.org%2Fb%2Fid%2F42-L.jpg"
  );
});

test("character boards and review Top 4 are included in the authenticated cloud sync", () => {
  const backend = read("backend", "lorefy-backend.js");

  assert.match(backend, /"lorefy\.user\.profileTopCharacters\.v1"/);
  assert.match(backend, /"lorefy\.reviewTop4\.v1"/);
  assert.match(backend, /"lorefy\.characterBoards\.v1"/);
  assert.match(backend, /"lorefy\.charTopLists\.v1"/);
  assert.match(backend, /target\.setItem = function\(k, v\)\{[\s\S]*?this === localStorage[\s\S]*?isAccountStateKey\(k\)[\s\S]*?_schedulePush\(\)/);
  assert.match(backend, /_afterLogin: async function\(userId\)\{[\s\S]*?await this\.pull\(userId\);[\s\S]*?this\.startSync\(userId\)/);
});

test("the shipped native configuration exposes the public catalog proxy", () => {
  const build = JSON.parse(read("config", "lorefy-build-public.json"));
  const prepare = read("tools", "prepare-ios-web.mjs");

  assert.match(build.catalogProxyUrl, /^https:\/\/[^/]+\/functions\/v1\/lorefy-public$/);
  assert.match(prepare, /catalogProxyUrl/);
});

test("iPhone builds are portrait-only while keeping exported share images available in Files", () => {
  const info = plist.parse(read("ios", "App", "App", "Info.plist"));

  assert.deepEqual(info.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
  assert.equal(info.UIFileSharingEnabled, true);
  assert.equal(info.LSSupportsOpeningDocumentsInPlace, true);
});

test("share exports unwrap proxied covers and regenerate the image from its latest sources", () => {
  const share = read("modules", "lorefy-share-studio.js");

  assert.match(share, /lorefy-public\/media/);
  assert.match(share, /searchParams\.get\("url"\)/);
  assert.match(share, /await freshStoryFile\(card\)/);
  assert.doesNotMatch(share, /card\.__lfStoryFile \|\| \(card\.__lfStoryFile = previewFile\(card\)\)/);
});

test("MAL works use verified multi-source cover alternatives through the proxy", () => {
  const covers = read("modules", "lorefy-cover-api.js");

  assert.match(covers, /\[aniListCoverById, jikanPictureCovers, jikanCoverById, mangaDexCovers, googleBooksCovers\]/);
  assert.match(covers, /catalogProxyUrl\("googlebooks"/);
  assert.match(covers, /LorefyDataProxy\.mediaUrl/);
  assert.match(covers, /catalogProxyUrl\("jikan"/);
  assert.match(covers, /lorefy-public\\\/media/);
});

test("preference boards reserve the device safe area before their headers", () => {
  const css = read("styles", "lorefy-native-layout-fix.css");

  assert.match(css, /\.lf-pref-board-hub[\s\S]*?padding-top: calc\(var\(--lf-safe-top\) \+ 14px\)/);
});

test("the public gateway bounds provider paths instead of proxying arbitrary URLs", () => {
  const gateway = read("supabase", "functions", "lorefy-public", "index.ts");

  assert.match(gateway, /characters/);
  assert.match(gateway, /\^OL\\d\+W\$/);
  assert.match(gateway, /search\.delete\("path"\)/);
  assert.match(gateway, /search\.delete\("work"\)/);
  assert.match(gateway, /provider !== "catalog-openlibrary"/);
  assert.match(gateway, /ak-asset\.jarir\.com/);
  assert.match(gateway, /freewebnovel\.com/);
  assert.match(gateway, /catalog-wikipedia/);
  assert.match(gateway, /catalog-wikidata/);
  assert.match(gateway, /catalog-commons/);
  assert.match(gateway, /"catalog-dc-fandom": "https:\/\/dc\.fandom\.com\/api\.php"/);
  assert.match(gateway, /"catalog-marvel-fandom": "https:\/\/marvel\.fandom\.com\/api\.php"/);
  assert.match(gateway, /provider === "catalog-dc-fandom" \|\| provider === "catalog-marvel-fandom"/);
  assert.match(gateway, /action !== "query"/);
});

test("the native character cache trusts provider pagination instead of a row threshold", () => {
  const characters = read("modules", "lorefy-character-system.js");
  const growth = read("modules", "lorefy-growth-features.js");

  assert.match(characters, /lorefy\.characterCastCache\.v20/);
  assert.match(characters, /completionVersion: complete === true \? CACHE_COMPLETION_VERSION : 0/);
  assert.match(characters, /function jikanEndpoint\(path\)/);
  assert.match(characters, /kitsuCastForWork\(keys\)/);
  assert.doesNotMatch(characters, /complete = kitsu\.length > 25/);
  assert.match(growth, /growthCatalogUrl\("jikan", "https:\/\/api\.jikan\.moe/);
});
