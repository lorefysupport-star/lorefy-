const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../uploads/files/lorefy-app.js');
let source = fs.readFileSync(file, 'utf8');
function replace(old, next) {
  if (source.includes(next)) return;
  if (source.split(old).length !== 2) throw new Error('Profile layout anchor is not unique: ' + old.slice(0, 90));
  source = source.replace(old, next);
}
replace('[yn,Xe]=useState(!1),[profileSaving', '[yn,Xe]=useState(!1),[profileLayout,setProfileLayout]=useStoredState("lorefy.user.profileLayout.v1","normal"),[profileLayoutDraft,setProfileLayoutDraft]=useState("normal"),[profileSaving');
replace('Ho=()=>{vo(J),', 'Ho=()=>{setProfileLayoutDraft(window.LorefyProfileLayout.normalize(profileLayout)),vo(J),');
replace('savedUsername=z&&z.username||h;gn(te)', 'savedUsername=z&&z.username||h;setProfileLayout(window.LorefyProfileLayout.normalize(profileLayoutDraft));gn(te)');
replace('className:"lf-screen-scroll lf-profile-page",style:', 'className:"lf-screen-scroll lf-profile-page","data-profile-layout":window.LorefyProfileLayout.normalize(profileLayout),style:');
replace('React.createElement("div",{onClick:Ho,style:{position:"absolute",bottom:-40', 'React.createElement("button",{type:"button",className:"lf-profile-avatar","aria-label":W==="en"?"Edit profile":"\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u0644\u0641",onClick:Ho,style:{padding:0,position:"absolute",bottom:-40');
const start = source.indexOf('className:"lf-profile-identity"');
const end = source.indexOf('className:"lf-profile-favorites"', start);
if (start < 0 || end < 0) throw new Error('Profile identity range missing');
let identity = source.slice(start, end);
function local(old, next) {
  if (identity.includes(next)) return;
  if (identity.split(old).length !== 2) throw new Error('Identity anchor is not unique: '+old.slice(0, 70));
  identity = identity.replace(old, next);
}
local('React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:3}}', 'React.createElement("div",{className:"lf-profile-name",style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:3}}');
local('React.createElement("p",{style:{color:C.sub,fontSize:14,margin:"0 0 14px"}}', 'React.createElement("p",{className:"lf-profile-handle",dir:"ltr",style:{color:C.sub,fontSize:14,margin:"0 0 14px"}}');
local('React.createElement("p",{"data-no-translate":"1",style:', 'React.createElement("p",{className:"lf-profile-bio","data-no-translate":"1",dir:"auto",style:');
local('React.createElement("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}', 'React.createElement("div",{className:"lf-profile-connections",style:{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}');
local('fontWeight:800}},Ht))', 'fontWeight:800}},Ht),React.createElement("span",{className:"lf-profile-connection-label","data-no-translate":"1"},W==="en"?"Following":"\u064a\u062a\u0627\u0628\u0639"))');
local('fontWeight:800}},_o)))', 'fontWeight:800}},_o),React.createElement("span",{className:"lf-profile-connection-label","data-no-translate":"1"},W==="en"?"Followers":"\u0645\u062a\u0627\u0628\u0639")))');
local('React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(5, minmax(0,1fr))",marginBottom:22}}', 'React.createElement("div",{className:"lf-profile-metrics",style:{display:"grid",gridTemplateColumns:"repeat(5, minmax(0,1fr))",marginBottom:22}}');
source = source.slice(0, start) + identity + source.slice(end);
replace('React.createElement("div",{style:{padding:18}},React.createElement("div",{style:{position:"relative",height:130', 'React.createElement("div",{style:{padding:18}},React.createElement(window.LorefyProfileLayout.Picker,{value:profileLayoutDraft,onChange:setProfileLayoutDraft,lang:W,banner:wt,avatar:xt,disabled:profileSaving}),React.createElement("div",{style:{position:"relative",height:130');
fs.writeFileSync(file, source);
console.log('Profile layout integration patched.');
