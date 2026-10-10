const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const shareStudioSource = fs.readFileSync(path.join(__dirname, "..", "modules", "lorefy-share-studio.js"), "utf8");
const growthSource = fs.readFileSync(path.join(__dirname, "..", "modules", "lorefy-growth-features.js"), "utf8");
const appSource = fs.readFileSync(path.join(__dirname, "..", "uploads", "files", "lorefy-app.js"), "utf8");

function loadShareStudio() {
  const mount = {};
  const sandbox = {
    Blob,
    File: class File extends Blob {
      constructor(parts, name, options) {
        super(parts, options);
        this.name = name;
      }
    },
    MutationObserver: class MutationObserver { observe() {} },
    document: {
      body: mount,
      getElementById: () => mount,
      querySelectorAll: () => []
    },
    addEventListener() {},
    requestAnimationFrame() {},
    setTimeout,
    clearTimeout,
    navigator: {},
    location: { href: "http://127.0.0.1:8794/" }
  };
  sandbox.window = sandbox;
  require("node:vm").runInNewContext(shareStudioSource, sandbox, { filename: "lorefy-share-studio.js" });
  return sandbox.LorefyShareStudio;
}

test("remote artwork has a visible local fallback and bounded failure path", () => {
  assert.match(indexSource, /installImageResilience/);
  assert.match(indexSource, /data:image\/svg\+xml/);
  assert.match(indexSource, /backgroundImage/);
  assert.match(indexSource, /MutationObserver/);
  assert.match(indexSource, /5500/);
  assert.match(indexSource, /lorefyFallbackApplied/);
});

test("native image and sharing paths bypass the browser-only localhost media proxy", () => {
  assert.match(shareStudioSource, /isNativePlatform/);
  assert.match(growthSource, /isNativePlatform/);
  assert.match(appSource, /profileBoardCanvasCoverSources=src=>\{.{0,500}isNativePlatform/s);
});

test("top-list export keeps every character label paired with its own image", () => {
  const studio = loadShareStudio();
  const rows = [
    { label: "Bruce Wayne", src: "https://images.example/bruce.jpg" },
    { label: "Alfred Pennyworth", src: "https://images.example/alfred.jpg" },
    { label: "Dick Grayson", src: "https://images.example/dick.jpg" }
  ].map((item) => ({
    querySelector(selector) {
      if (selector === "img") return { getAttribute: () => item.src, currentSrc: item.src, src: item.src };
      if (selector === ".lf-cb-poster-name") return { textContent: item.label };
      return null;
    }
  }));
  const card = {
    querySelectorAll(selector) {
      if (selector.includes(".lf-cb-poster-tile")) return rows;
      return [];
    }
  };

  assert.deepEqual(Array.from(studio.collectShelfItems(card), (item) => ({ src: item.src, label: item.label })), [
    { src: "https://images.example/bruce.jpg", label: "Bruce Wayne" },
    { src: "https://images.example/alfred.jpg", label: "Alfred Pennyworth" },
    { src: "https://images.example/dick.jpg", label: "Dick Grayson" }
  ]);
});
