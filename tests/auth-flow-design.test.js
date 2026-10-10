const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("the auth journey loads its own brand layer after the general app styles", () => {
  const html = read("index.html");
  const gate = read("auth/lorefy-auth.js");
  const cinema = html.indexOf("styles/lorefy-cinema-ui.css");
  const auth = html.indexOf("styles/lorefy-auth-flow.css");

  assert.ok(cinema >= 0 && auth > cinema);
  assert.match(gate, /"data-lf-auth-stage":t/);
  assert.ok(fs.existsSync(path.join(root, "launch", "brand", "lorefy-reading-scene.jpg")));
});

test("onboarding choices use readable rows and touch-sized controls", () => {
  const css = read("styles/lorefy-auth-flow.css");

  assert.match(css, /\.lf-auth \.lf-work-grid\s*\{[^}]*display:\s*flex/i);
  assert.match(css, /\.lf-auth \.lf-work-title\s*\{[^}]*background:\s*none/i);
  assert.match(css, /\.lf-auth \.lf-chip\s*\{[^}]*min-height:\s*5[2-9]px/i);
  assert.match(css, /\.lf-auth \.lf-primary\s*\{[^}]*background:\s*var\(--auth-action\)/i);
  assert.match(css, /prefers-reduced-motion/);
});
