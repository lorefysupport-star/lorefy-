const fs = require('node:fs');
const path = require('node:path');

const target = path.resolve(__dirname, '..', 'uploads', 'files', 'lorefy-app.js');
let source = fs.readFileSync(target, 'utf8');

function replaceOnce(from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  source = source.replace(from, to);
}

replaceOnce('PROFILE_FAVORITES_PICKER_BATCH=48', 'PROFILE_FAVORITES_PICKER_BATCH=12', 'Favorite picker batch');
replaceOnce(
  'av:c.avatar||"",txt:f.body||"",ts:Date.parse(f.created_at)||Date.now()}})',
  'av:c.avatar||"",parentId:f.parent_id||"",txt:f.body||"",ts:Date.parse(f.created_at)||Date.now()}})',
  'Cloud comment parent mapping'
);

const commentStart = source.indexOf('Ko=async');
const commentEnd = source.indexOf(',Jo=', commentStart);
if (commentStart < 0 || commentEnd < 0) throw new Error('Comment publisher bounds were not found');
source = source.slice(0, commentStart) +
  'Ko=async(t,r,o)=>{const n=(r||"").trim();if(!n)return;let s={id:`c${Date.now()}`,user:J,un:Y,av:Z,parentId:o||"",txt:n,ts:Date.now()};const d=window.LorefyBackend;if(d&&d.mode==="live"&&d.addReviewComment)try{const h=await d.addReviewComment(t,n,o);h&&(s={id:h.id,user:J,un:Y,av:Z,parentId:h.parent_id||"",txt:h.body,ts:Date.parse(h.created_at)||Date.now()})}catch(h){A(h&&h.message||"Cloud comment publishing failed","err");return}const g=document.querySelector(".lf-review-comments-sheet");if(g){delete g.dataset.replyParent;const h=g.querySelector("input");h&&(h.placeholder="\\u0623\\u0636\\u0641 \\u062A\\u0639\\u0644\\u064A\\u0642\\u0627\\u064B...")}Io(h=>({...h,[t]:[...h[t]||[],s]}))}' +
  source.slice(commentEnd);

const profileHead = 'vr=()=>{const t=He,r=M.filter(y=>y.userId===t.id||y.un===t.un),o=cloudFollowing.some(y=>y.id===t.id),s=0,d=r.length,h=Number(t.follower_count)||0,g=[];';
const richProfileHead = 'vr=()=>{const t=He,r=M.filter(y=>y.userId===t.id||y.un===t.un),o=cloudFollowing.some(y=>y.id===t.id),s=Number(t.completed_count)||0,d=r.length,h=Number(t.follower_count)||0,g=(Array.isArray(t.favorite_work_ids)?t.favorite_work_ids:[]).map(y=>workById(y)).filter(Boolean).slice(0,4);';
replaceOnce(profileHead, richProfileHead, 'Public profile cloud summary');

const profileStart = source.indexOf('vr=()=>');
const profileEnd = source.indexOf(',xr=()=>', profileStart);
if (profileStart < 0 || profileEnd < 0) throw new Error('Public profile bounds were not found');
let profile = source.slice(profileStart, profileEnd);

function profileReplace(from, to, label) {
  const count = profile.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one profile match, found ${count}`);
  profile = profile.replace(from, to);
}

profileReplace(
  'React.createElement("div",{style:{height:"100%",overflowY:"auto",paddingBottom:"calc(var(--nc-bottom) + 76px)"}}',
  'React.createElement("div",{className:"lf-public-profile-page lf-profile-page",style:{height:"100%",overflowY:"auto",paddingBottom:"calc(var(--nc-bottom) + 76px)"}}',
  'Public profile page class'
);
profileReplace(
  'React.createElement("div",{style:{position:"relative",height:160}}',
  'React.createElement("div",{className:"lf-profile-banner",style:{position:"relative",height:270}}',
  'Public profile banner class'
);
profileReplace(
  'React.createElement("div",{style:{padding:"52px 20px 0",textAlign:"center"}}',
  'React.createElement("div",{className:"lf-public-profile-identity",style:{padding:"52px 20px 0",textAlign:"center"}}',
  'Public profile identity class'
);
profileReplace(
  'React.createElement("p",{style:{color:C.sub,fontSize:14,margin:"0 0 16px"}},"@",t.un),React.createElement("div",{style:{display:"flex",gap:10,justifyContent:"center",marginBottom:20}}',
  'React.createElement("p",{style:{color:C.sub,fontSize:14,margin:"0 0 10px"}},"@",t.un),t.bio&&React.createElement("p",{className:"lf-public-profile-bio"},t.bio),React.createElement("div",{style:{display:"flex",gap:10,justifyContent:"center",marginBottom:20}}',
  'Public profile bio'
);
profileReplace(
  'React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",marginBottom:24}},[[s,"\\u0645\\u0643\\u062A\\u0645\\u0644\\u0629"],[d,"\\u0645\\u0631\\u0627\\u062C\\u0639\\u0629"],[h,"\\u0645\\u062A\\u0627\\u0628\\u0650\\u0639"]]',
  'React.createElement("div",{className:"lf-public-profile-stats",style:{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",marginBottom:24}},[[s,"\\u0645\\u0643\\u062A\\u0645\\u0644\\u0629"],[d,"\\u0645\\u0631\\u0627\\u062C\\u0639\\u0629"],[h,"\\u0645\\u062A\\u0627\\u0628\\u0650\\u0639"],[Number(t.following_count)||0,"\\u064A\\u062A\\u0627\\u0628\\u0639"]]',
  'Public profile stats'
);
profileReplace(
  'React.createElement("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:22}},g.map',
  'React.createElement("div",{className:"lf-public-profile-favorites",style:{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:22}},g.map',
  'Public profile favorites'
);
profileReplace(
  'React.createElement("div",{style:{padding:"0 16px"}},React.createElement("p",{style:{color:C.text,fontSize:16,fontWeight:800,marginBottom:6}}',
  'React.createElement("div",{className:"lf-public-profile-reviews",style:{padding:"0 16px"}},React.createElement("p",{style:{color:C.text,fontSize:16,fontWeight:800,marginBottom:6}}',
  'Public profile reviews'
);
source = source.slice(0, profileStart) + profile + source.slice(profileEnd);

const repliesStart = source.indexOf('kr=()=>');
const repliesEnd = source.indexOf(',wr=[', repliesStart);
if (repliesStart < 0 || repliesEnd < 0) throw new Error('Comment sheet bounds were not found');
let replies = source.slice(repliesStart, repliesEnd);

function replyReplace(from, to, label) {
  const count = replies.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one comment-sheet match, found ${count}`);
  replies = replies.replace(from, to);
}

replyReplace('className:"nc-sheet"', 'className:"nc-sheet lf-review-comments-sheet"', 'Comment sheet class');
replyReplace(
  'React.createElement("div",{key:o.id,style:{display:"flex",gap:10,marginBottom:14}}',
  'React.createElement("div",{key:o.id,className:"lf-review-comment-row","data-comment-id":o.id,"data-parent-id":o.parentId||"",style:{display:"flex",gap:10,marginBottom:14}}',
  'Comment row identity'
);
replyReplace(
  '},o.txt))))),React.createElement("div",{style:{padding:"10px 16px 30px"',
  '},o.txt),React.createElement("button",{type:"button",className:"lf-review-comment-reply",onClick:y=>{y.stopPropagation();const z=y.currentTarget.closest(".lf-review-comments-sheet"),O=z&&z.querySelector("input");z&&(z.dataset.replyParent=o.id),O&&(O.placeholder=`\\u0631\\u062F \\u0639\\u0644\\u0649 ${o.user}...`,O.focus())}},"\\u0631\\u062F"))))),React.createElement("div",{style:{padding:"10px 16px 30px"',
  'Comment reply action'
);
replyReplace(
  'onSubmit:o=>Ko(Ve,o)',
  'onSubmit:o=>{const n=document.querySelector(".lf-review-comments-sheet"),s=n&&n.dataset.replyParent||"";Ko(Ve,o,s)}',
  'Reply parent submission'
);
source = source.slice(0, repliesStart) + replies + source.slice(repliesEnd);

fs.writeFileSync(target, source);
console.log('Community follow-up fixes patched.');
