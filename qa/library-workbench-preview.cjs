// A current-index preview with the existing loopback-only, namespaced tester storage.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'output/library-workbench/qa');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!index.includes('<head>')) throw Error('Missing app head');
fs.mkdirSync(out, {recursive:true});
fs.writeFileSync(path.join(out, 'tester-app.html'), index.replace('<head>', `<head>
<base href="/">
<script src="qa/tester-data.js"></script>
<script src="qa/post-workbench.js"></script>
<script src="qa/tester-boot.js"></script>`));
// Keep populated phone previews on the same isolated tester origin.
const phone = fs.readFileSync(path.join(root, 'phone-preview.html'), 'utf8');
for (const [page, route] of [['explore', 'discover'], ['home', 'home'], ['posts', 'home'], ['profile', 'profile']])
  fs.writeFileSync(path.join(out, `../${page}-phone.html`), phone
  .replace("params.set('route', 'profile')", `params.set('route', '${route}')`)
  .replace("frame.src = 'index.html?'", (page==='posts'?"params.set('postDemo','1'); ":"")+"params.set('qaTester', 'qa-tester-02'); if (!params.has('lang')) params.set('lang','ar'); frame.src = 'qa/tester-app.html?'"));
