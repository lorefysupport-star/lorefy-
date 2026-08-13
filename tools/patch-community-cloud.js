const fs = require('node:fs');
const path = require('node:path');

const target = path.resolve(__dirname, '..', 'uploads', 'files', 'lorefy-app.js');
let source = fs.readFileSync(target, 'utf8');

const publishStart = 'tr=()=>{if(!m||G===0)return;';
const publishEnd = 'chars:window.__lorefyTop4Get?window.__lorefyTop4Get(String(m.id)):null};fo(r=>[t,...r]),Zn(m)';
const cloudPublish = 'chars:window.__lorefyTop4Get?window.__lorefyTop4Get(String(m.id)):null};const r=window.LorefyBackend;if(r&&r.mode==="live"&&r.publishReview)try{const o=await r.publishReview({workId:t.mid,rating:t.r,body:t.txt,recommend:t.recVal==="yes"?!0:t.recVal==="no"?!1:null,spoiler:t.spoiler,images:t.imgs,isPublic:!0});o&&o.id&&(t.id=o.id),o&&o.images&&(t.imgs=o.images),o&&o.created_at&&(t.ts=Date.parse(o.created_at)||t.ts)}catch(o){A(o&&o.message||"Cloud review publishing failed","err");return}fo(r=>[t,...r]),Zn(m)';

if (!source.includes('tr=async()=>{if(!m||G===0)return;')) {
  if (!source.includes(publishStart)) throw new Error('Review publish handler was not found.');
  source = source.replace(publishStart, 'tr=async()=>{if(!m||G===0)return;');
}
if (!source.includes('r.publishReview({workId:t.mid')) {
  if (!source.includes(publishEnd)) throw new Error('Review publish insertion point was not found.');
  source = source.replace(publishEnd, cloudPublish);
}

const deleteStart = 'qo=t=>{fo(r=>r.filter(o=>o.id!==t))';
const cloudDelete = 'qo=async t=>{const r=window.LorefyBackend;if(r&&r.mode==="live"&&r.deleteReview)try{await r.deleteReview(t)}catch(o){A(o&&o.message||"Cloud review deletion failed","err");return}fo(r=>r.filter(o=>o.id!==t))';
if (!source.includes('qo=async t=>{const r=window.LorefyBackend')) {
  if (!source.includes(deleteStart)) throw new Error('Review delete handler was not found.');
  source = source.replace(deleteStart, cloudDelete);
}

const commentStart = 'Ko=(t,r)=>{const o=(r||"").trim();if(!o)return;const n={id:`c${Date.now()}`,user:J,un:Y,av:Z,txt:o,ts:Date.now()};Io(s=>({...s,[t]:[...s[t]||[],n]}))}';
const cloudComment = 'Ko=async(t,r)=>{const o=(r||"").trim();if(!o)return;let n={id:`c${Date.now()}`,user:J,un:Y,av:Z,txt:o,ts:Date.now()};const s=window.LorefyBackend;if(s&&s.mode==="live"&&s.addReviewComment)try{const d=await s.addReviewComment(t,o);d&&(n={id:d.id,user:J,un:Y,av:Z,txt:d.body,ts:Date.parse(d.created_at)||Date.now()})}catch(d){A(d&&d.message||"Cloud comment publishing failed","err");return}Io(s=>({...s,[t]:[...s[t]||[],n]}))}';
if (!source.includes('Ko=async(t,r)=>')) {
  if (!source.includes(commentStart)) throw new Error('Review comment handler was not found.');
  source = source.replace(commentStart, cloudComment);
}

const heartAction = 'onClick:()=>po(y=>({...y,[t.id]:!y[t.id]}))';
const cloudHeartAction = 'onClick:async()=>{const y=!De[t.id],z=window.LorefyBackend;if(z&&z.mode==="live"&&z.setReviewReaction)try{await z.setReviewReaction(t.id,"heart",y)}catch(O){A(O&&O.message||"Cloud reaction failed","err");return}po(O=>({...O,[t.id]:y}))}';
const likeAction = 'onClick:()=>co(y=>({...y,[t.id]:!y[t.id]}))';
const cloudLikeAction = 'onClick:async()=>{const y=!lo[t.id],z=window.LorefyBackend;if(z&&z.mode==="live"&&z.setReviewReaction)try{await z.setReviewReaction(t.id,"like",y)}catch(O){A(O&&O.message||"Cloud reaction failed","err");return}co(O=>({...O,[t.id]:y}))}';
source = source.split(heartAction).join(cloudHeartAction);
source = source.split(likeAction).join(cloudLikeAction);

source = source.replace('React.createElement("article",{className:"lf-review-card",onClick:()=>Vo(t)', 'React.createElement("article",{className:"lf-review-card","data-review-id":t.id,"data-user-id":t.userId,onClick:()=>Vo(t)');
source = source.replace('React.createElement("article",{className:"lf-review-card","data-review-id":t.id,onClick:()=>Vo(t)', 'React.createElement("article",{className:"lf-review-card","data-review-id":t.id,"data-user-id":t.userId,onClick:()=>Vo(t)');
source = source.replace('React.createElement("div",{className:"lf-review-detail","data-screen-label":', 'React.createElement("div",{className:"lf-review-detail","data-review-id":t.id,"data-user-id":t.userId,"data-screen-label":');
source = source.replace('React.createElement("div",{className:"lf-review-detail","data-review-id":t.id,"data-screen-label":', 'React.createElement("div",{className:"lf-review-detail","data-review-id":t.id,"data-user-id":t.userId,"data-screen-label":');

const reviewState = '[M,fo]=useStoredState("lorefy.user.privateReviews.v2",[])';
const previousCloudLoad = '[M,fo]=useStoredState("lorefy.user.privateReviews.v2",[]);useEffect(()=>{const e=window.LorefyBackend;if(!e||e.mode!=="live"||!e.listReviews)return;let i=!1;e.listReviews({limit:100}).then(l=>{if(i)return;fo(a=>{const c=(l||[]).map(p=>{const f=p.profile||{};return{id:p.id,userId:p.user_id===e.user?.id?"me":p.user_id,user:f.name||f.username||"Lorefy reader",un:f.username||"",av:f.avatar||"",mid:p.work_id,r:Number(p.rating)||0,rec:p.recommend===!0,recVal:p.recommend===!0?"yes":p.recommend===!1?"no":null,txt:p.body||"—",imgs:p.images||[],ts:Date.parse(p.created_at)||Date.now(),likes:p.reactions?.heart||0,comments:(p.comments||[]).length,spoiler:p.spoiler===!0}}),u=new Map(c.map(p=>[String(p.id),p]));(a||[]).forEach(p=>{u.has(String(p.id))||u.set(String(p.id),p)});return[...u.values()]})}).catch(()=>{}) ;return()=>{i=!0}},[])';
const cloudLoad = '[M,fo]=useStoredState("lorefy.user.privateReviews.v2",[]);useEffect(()=>{const e=window.LorefyBackend;if(!e||e.mode!=="live"||!e.listReviews)return;let i=!1;e.listReviews({limit:100}).then(l=>{if(i)return;const a={};(l||[]).forEach(p=>{a[p.id]=(p.comments||[]).map(f=>{const c=f.profile||{};return{id:f.id,user:c.name||c.username||"Lorefy reader",un:c.username||"",av:c.avatar||"",txt:f.body||"",ts:Date.parse(f.created_at)||Date.now()}})}),Io(p=>({...p,...a})),co(p=>{const f={...p};return(l||[]).forEach(c=>{c.reactions&&c.reactions.mine&&c.reactions.mine.like&&(f[c.id]=!0)}),f}),po(p=>{const f={...p};return(l||[]).forEach(c=>{c.reactions&&c.reactions.mine&&c.reactions.mine.heart&&(f[c.id]=!0)}),f}),fo(a=>{const c=(l||[]).map(p=>{const f=p.profile||{};return{id:p.id,userId:p.user_id===e.user?.id?"me":p.user_id,user:f.name||f.username||"Lorefy reader",un:f.username||"",av:f.avatar||"",mid:p.work_id,r:Number(p.rating)||0,rec:p.recommend===!0,recVal:p.recommend===!0?"yes":p.recommend===!1?"no":null,txt:p.body||"—",imgs:p.images||[],ts:Date.parse(p.created_at)||Date.now(),likes:p.reactions?.heart||0,comments:(p.comments||[]).length,spoiler:p.spoiler===!0}}),u=new Map(c.map(p=>[String(p.id),p]));(a||[]).forEach(p=>{u.has(String(p.id))||u.set(String(p.id),p)});return[...u.values()]})}).catch(()=>{});return()=>{i=!0}},[])';
if (source.includes(previousCloudLoad)) {
  source = source.replace(previousCloudLoad, cloudLoad);
} else if (!source.includes('e.listReviews({limit:100})')) {
  if (!source.includes(reviewState)) throw new Error('Review state insertion point was not found.');
  source = source.replace(reviewState, cloudLoad);
}

const privateState = '[$n,En]=useState(!1)';
const persistedPrivateState = '[$n,En]=useState(()=>{try{return JSON.parse(localStorage.getItem("lorefy.identity.v1")||"{}").isPrivate===!0}catch{return!1}})';
if (!source.includes(persistedPrivateState)) {
  if (!source.includes(privateState)) throw new Error('Private profile state was not found.');
  source = source.replace(privateState, persistedPrivateState);
}

const privateToggle = 'on:$n,onClick:()=>En(n=>!n)';
const cloudPrivateToggle = 'on:$n,onClick:async()=>{const n=!$n,e=window.LorefyBackend;if(e&&e.mode==="live"&&e.setProfilePrivacy)try{await e.setProfilePrivacy(n)}catch(i){A(i&&i.message||"Privacy update failed","err");return}En(n)}';
if (!source.includes(cloudPrivateToggle)) {
  if (!source.includes(privateToggle)) throw new Error('Private profile toggle was not found.');
  source = source.replace(privateToggle, cloudPrivateToggle);
}

fs.writeFileSync(target, source);
console.log('Community cloud handlers patched.');
