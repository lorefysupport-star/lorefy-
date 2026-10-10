const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");
const cinemaPath = path.join(root, "styles", "lorefy-cinema-ui.css");

test("cinematic library UI is registered after the Apple UI layer", () => {
  const index = fs.readFileSync(indexPath, "utf8");

  assert.equal(fs.existsSync(cinemaPath), true, "cinematic UI stylesheet must exist");
  assert.ok(
    index.indexOf("styles/lorefy-cinema-ui.css") > index.indexOf("styles/lorefy-apple-ui.css"),
    "cinematic UI must load after the existing Apple UI layer"
  );
});

test("cinematic UI defines the dark shelves, circular icons, and floating dock", () => {
  const css = fs.readFileSync(cinemaPath, "utf8");

  assert.match(css, /--cinema-bg:\s*#0d0d0f/i);
  assert.match(css, /\.lf-cover-frame[\s\S]*aspect-ratio:\s*2\s*\/\s*3/i);
  assert.match(css, /\.lf-icon-button[\s\S]*border-radius:\s*50%/i);
  assert.match(css, /\.lf-bottom-nav[\s\S]*backdrop-filter/i);
  assert.match(css, /\.lf-nav-item\.is-active[\s\S]*--cinema-active/i);
});
