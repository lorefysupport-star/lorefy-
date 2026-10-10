const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "uploads", "files", "lorefy-app.js");
let source = fs.readFileSync(appPath, "utf8");

function replaceOnce(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Missing ${label} anchor`);
  source = source.replace(before, after);
}

replaceOnce(
  'normalizeProgress=(e={})=>typeof e=="number"?{chapter:Math.max(0,e||0),volume:0,page:0,note:""}:{chapter:Math.max(0,Number(e.chapter??e.ch??0)||0),volume:Math.max(0,Number(e.volume??e.vol??0)||0),page:Math.max(0,Number(e.page??0)||0),note:String(e.note||"")},firstPositiveNumber=',
  'normalizeProgress=(e={})=>typeof e=="number"?{chapter:Math.max(0,e||0),volume:0,page:0,note:""}:{chapter:Math.max(0,Number(e.chapter??e.ch??0)||0),volume:Math.max(0,Number(e.volume??e.vol??0)||0),page:Math.max(0,Number(e.page??0)||0),note:String(e.note||"")},hasSavedProgress=e=>{const i=normalizeProgress(e);return i.chapter>0||i.page>0||i.volume>0},firstPositiveNumber=',
  "progress helper"
);

replaceOnce(
  'Lr=et.length>0?et[0][0]:"\\u2014",profileFavoriteType=',
  'Lr=et.length>0?et[0][0]:"\\u2014",myReviews=M.filter(r=>r.userId==="me"||r.un===Y),profileFavoriteType=',
  "current-user reviews"
);

const profileStart = source.indexOf('Lr=et.length>0?et[0][0]:"\\u2014",myReviews=');
const profileEnd = source.indexOf(",ce=Object.entries(b)", profileStart);
if (profileStart < 0 || profileEnd < 0) throw new Error("Missing owner profile summary block");
let profileBlock = source.slice(profileStart, profileEnd);
profileBlock = profileBlock
  .replace("M.forEach(o=>r(o.mid,", "myReviews.forEach(o=>r(o.mid,")
  .replace("[...M].reverse().forEach(o=>r(o.mid))", "[...myReviews].reverse().forEach(o=>r(o.mid))")
  .replace("To=M.length", "To=myReviews.length");
source = source.slice(0, profileStart) + profileBlock + source.slice(profileEnd);

replaceOnce(
  "Hn=Object.keys(b).map(t=>workById(t)).filter(Boolean).slice(0,6)",
  "Hn=Object.entries(b).filter(([t,r])=>r===STATUS_READING&&hasSavedProgress(le[t])).map(([t])=>workById(t)).filter(Boolean).slice(0,6)",
  "continue-reading filter"
);

replaceOnce(
  "pe=Object.entries(b).filter(([,k])=>k===STATUS_READING).map(([k])=>workById(k)).filter(Boolean),w=(pe.length?pe:g).slice(0,4)",
  "pe=Object.entries(b).filter(([,k])=>k===STATUS_READING&&hasSavedProgress(le[k])).map(([k])=>workById(k)).filter(Boolean),w=pe.slice(0,4)",
  "home continue-reading source"
);

replaceOnce(
  'React.createElement("section",{className:"lf-continue-section"}',
  'w.length>0&&React.createElement("section",{className:"lf-continue-section"}',
  "hide empty continue-reading section"
);

const fakeProgress = "oe=progressPercent(k,U)||Math.min(96,Math.max(18,Math.round(_(k)*10)))";
if (source.includes(fakeProgress)) {
  source = source.replace(fakeProgress, "oe=progressPercent(k,U)");
} else if (!source.includes("oe=progressPercent(k,U);return")) {
  throw new Error("Missing real continuation percentage anchor");
}

const modalStart = source.indexOf("mr=()=>");
const modalEnd = source.indexOf(",vr=()=>", modalStart);
if (modalStart < 0 || modalEnd < 0) throw new Error("Missing connections modal block");
let modalBlock = source.slice(modalStart, modalEnd);
if (!modalBlock.includes("lorefy:open-reader-profile")) {
  modalBlock = modalBlock.replace(
    'r=({u:o,btn:n,onBtn:s,active:d})=>React.createElement("div",{style:',
    'r=({u:o,btn:n,onBtn:s,active:d})=>React.createElement("div",{role:"button",tabIndex:0,onClick:()=>{Ue(null),window.dispatchEvent(new CustomEvent("lorefy:open-reader-profile",{detail:o}))},onKeyDown:e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),Ue(null),window.dispatchEvent(new CustomEvent("lorefy:open-reader-profile",{detail:o})))},style:'
  );
  modalBlock = modalBlock.replace(
    'React.createElement("button",{onClick:s,style:',
    'React.createElement("button",{onClick:e=>{e.stopPropagation(),s&&s()},style:'
  );
}
source = source.slice(0, modalStart) + modalBlock + source.slice(modalEnd);

const reviewsStart = source.indexOf("Er=()=>");
const reviewsEnd = source.indexOf(",Nr=[", reviewsStart);
if (reviewsStart < 0 || reviewsEnd < 0) throw new Error("Missing My Reviews page block");
let reviewsBlock = source.slice(reviewsStart, reviewsEnd);
reviewsBlock = reviewsBlock.replaceAll("M.length", "myReviews.length").replace("M.map(", "myReviews.map(");
source = source.slice(0, reviewsStart) + reviewsBlock + source.slice(reviewsEnd);

fs.writeFileSync(appPath, source);
console.log("Patched account-owned surfaces and profile navigation.");
