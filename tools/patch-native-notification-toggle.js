const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "uploads", "files", "lorefy-app.js");
let source = fs.readFileSync(appPath, "utf8");

const patches = [
  {
    before: "[Bn,Wn]=useState(!0)",
    after: "[Bn,Wn]=useState(()=>{try{return localStorage.getItem(\"lorefy.native.push.enabled.v1\")===\"true\"}catch{return!1}})"
  },
  {
    before: "right:React.createElement(t,{on:Bn,onClick:()=>Wn(n=>!n)})",
    after: "right:React.createElement(t,{on:Bn,onClick:()=>Wn(n=>{const e=!n;window.LorefyNativeRuntime&&window.LorefyNativeRuntime.setPushEnabled(e);return e})})"
  }
];

patches.forEach(({ before, after }) => {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Native notification patch target is missing: ${before}`);
  source = source.replace(before, after);
});

fs.writeFileSync(appPath, source);
