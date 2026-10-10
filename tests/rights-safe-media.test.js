const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

function bootRuntime({ native, runtimePath = path.join(root, "config", "lorefy-runtime.js") }) {
  const location = {
    href: "capacitor://localhost/index.html",
    origin: "capacitor://localhost",
    protocol: "capacitor:",
    hostname: "localhost"
  };
  const window = {
    location,
    LOREFY_RELEASE: { supabase: { url: "https://qsroxmltioxqozmykens.supabase.co" } },
    Capacitor: {
      isNativePlatform: () => native,
      getPlatform: () => native ? "ios" : "web"
    }
  };
  vm.runInNewContext(fs.readFileSync(runtimePath, "utf8"), {
    window,
    URL,
    encodeURIComponent,
    document: null,
    MutationObserver: undefined
  });
  return window.LorefyRightsSafeMedia;
}

test("native beta releases retain verified HTTPS catalog artwork by default", () => {
  const media = bootRuntime({ native: true });

  assert.ok(media);
  assert.equal(media.enabled(), false);
  assert.equal(
    media.coverUrl("https://s4.anilist.co/file/anilistcdn/media/manga/30013/cover/large.jpg", "Berserk"),
    "https://s4.anilist.co/file/anilistcdn/media/manga/30013/cover/large.jpg"
  );
  assert.equal(
    media.coverUrl("https://qsroxmltioxqozmykens.supabase.co/storage/v1/object/sign/profile-media/avatar.png", "Avatar"),
    "https://qsroxmltioxqozmykens.supabase.co/storage/v1/object/sign/profile-media/avatar.png"
  );
});

test("the generated iOS runtime keeps catalog artwork enabled", () => {
  const media = bootRuntime({
    native: true,
    runtimePath: path.join(root, "ios", "App", "App", "public", "config", "lorefy-runtime.js")
  });

  assert.ok(media);
  assert.equal(media.enabled(), false);
});

test("web previews retain their remote artwork while release shares use the same safe-media gate", () => {
  const media = bootRuntime({ native: false });
  const coverApi = read("modules", "lorefy-cover-api.js");
  const shareStudio = read("modules", "lorefy-share-studio.js");

  assert.equal(media.enabled(), false);
  assert.match(coverApi, /LorefyRightsSafeMedia/);
  assert.match(shareStudio, /LorefyRightsSafeMedia/);
});
