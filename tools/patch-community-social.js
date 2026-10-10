const fs = require('node:fs');
const path = require('node:path');

const target = path.resolve(__dirname, '..', 'uploads', 'files', 'lorefy-app.js');
let source = fs.readFileSync(target, 'utf8');

function replaceOnce(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(label + ' insertion point was not found.');
  source = source.replace(before, after);
}

const reviewState = '[M,fo]=useStoredState("lorefy.user.privateReviews.v2",[])';
const reviewEnd = ',[bt,ho]=useStoredState("lorefy.user.socials.v2"';
const reviewStartIndex = source.indexOf(reviewState);
const reviewEndIndex = source.indexOf(reviewEnd, reviewStartIndex);
if (reviewStartIndex < 0 || reviewEndIndex < 0) throw new Error('Cloud review state block was not found.');

const liveReviewState = `[M,fo]=useStoredState("lorefy.user.privateReviews.v2",[]);useEffect(()=>{const e=window.LorefyBackend;if(!e||e.mode!=="live"||!e.listReviews)return;let i=!1,n=null;const mapReview=p=>{const f=p.profile||{},c=p.reactions||{},u=c.mine||{};return{id:p.id,userId:p.user_id===e.user?.id?"me":p.user_id,user:f.name||f.username||"Lorefy reader",un:f.username||"",av:f.avatar||"",mid:p.work_id,r:Number(p.rating)||0,rec:p.recommend===!0,recVal:p.recommend===!0?"yes":p.recommend===!1?"no":null,txt:p.body||"—",imgs:p.images||[],ts:Date.parse(p.created_at)||Date.now(),likes:Number(c.heart)||0,likeCount:Number(c.like)||0,myHeart:u.heart===!0,myLike:u.like===!0,comments:0,spoiler:p.spoiler===!0}},mergeReviews=l=>{const a={};(l||[]).forEach(p=>{a[p.id]=(p.comments||[]).map(f=>{const c=f.profile||{};return{id:f.id,user:c.name||c.username||"Lorefy reader",un:c.username||"",av:c.avatar||"",txt:f.body||"",ts:Date.parse(f.created_at)||Date.now()}})}),Io(p=>({...p,...a})),co(p=>{const f={...p};return(l||[]).forEach(c=>{c.reactions&&c.reactions.mine&&c.reactions.mine.like?f[c.id]=!0:delete f[c.id]}),f}),po(p=>{const f={...p};return(l||[]).forEach(c=>{c.reactions&&c.reactions.mine&&c.reactions.mine.heart?f[c.id]=!0:delete f[c.id]}),f}),fo(a=>{const c=(l||[]).map(mapReview),u=new Map(c.map(p=>[String(p.id),p]));(a||[]).forEach(p=>{/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(p.id))||u.set(String(p.id),p)});return[...u.values()]})},load=()=>e.listReviews({limit:100}).then(l=>{i||mergeReviews(l)}).catch(l=>console.warn("[Lorefy] community refresh:",l)),loadGraph=async()=>{if(!e.listProfileFollowers||!e.listProfileFollowing)return;const l=await e.getSession(),a=l&&l.userId;if(!a)return;try{const[p,f]=await Promise.all([e.listProfileFollowers(a,200),e.listProfileFollowing(a,200)]),c=y=>({id:y.id,name:y.name||y.username,un:y.username||"",av:y.avatar||"",bio:y.bio||"",is_following:y.is_following===!0});i||(setCloudFollowers((p||[]).map(c)),setCloudFollowing((f||[]).map(c)))}catch(p){console.warn("[Lorefy] social graph refresh:",p)}},refresh=()=>{load(),loadGraph()},open=l=>{const a=l&&l.detail;if(!a||!a.id)return;Ye({id:a.id,name:a.name||a.username,un:a.username||a.un||"",av:a.avatar||a.av||"",bio:a.bio||"",genres:a.genres||[]}),S("userprofile");e.getPublicProfile&&e.getPublicProfile(a.id).then(p=>{p&&!i&&Ye({id:p.id,name:p.name||p.username,un:p.username||"",av:p.avatar||"",banner:p.banner||"",bio:p.bio||"",genres:p.genres||[],follower_count:Number(p.follower_count)||0,following_count:Number(p.following_count)||0,is_following:p.is_following===!0})}).catch(p=>console.warn("[Lorefy] profile refresh:",p)),e.listReviews({userId:a.id,limit:100}).then(p=>{i||mergeReviews(p)}).catch(p=>console.warn("[Lorefy] profile reviews:",p))};load(),loadGraph(),window.addEventListener("lorefy:community-refresh",refresh),window.addEventListener("lorefy:profile-follow-changed",loadGraph),window.addEventListener("lorefy:open-reader-profile",open);const l=()=>{document.hidden||refresh()};document.addEventListener("visibilitychange",l);const a=setInterval(refresh,3e4);e.subscribeCommunity&&e.subscribeCommunity(refresh).then(p=>{i?p&&p():n=p}).catch(()=>{});return()=>{i=!0,n&&n(),clearInterval(a),document.removeEventListener("visibilitychange",l),window.removeEventListener("lorefy:community-refresh",refresh),window.removeEventListener("lorefy:profile-follow-changed",loadGraph),window.removeEventListener("lorefy:open-reader-profile",open)}},[])`;
const localProfileOpenEffect = `;useEffect(()=>{if(window.LorefyBackend&&window.LorefyBackend.mode==="live")return;const e=l=>{const a=l&&l.detail;if(!a||!a.id)return;Ye({id:a.id,name:a.name||a.username||"Lorefy reader",un:a.username||a.un||"",av:a.avatar||a.av||"",bio:a.bio||"",genres:a.genres||[]}),S("userprofile")};window.addEventListener("lorefy:open-reader-profile",e);return()=>window.removeEventListener("lorefy:open-reader-profile",e)},[])`;
source = source.slice(0, reviewStartIndex) + liveReviewState + localProfileOpenEffect + source.slice(reviewEndIndex);

replaceOnce(
  '[He,Ye]=useState(null),[Ge,Wt]=useState(null)',
  '[He,Ye]=useState(null),[cloudFollowers,setCloudFollowers]=useState([]),[cloudFollowing,setCloudFollowing]=useState([]),[Ge,Wt]=useState(null)',
  'Social graph state'
);

replaceOnce(
  'Vt=[...FOLLOWING_DATA,...FOLLOWERS_DATA.filter(t=>Ft.includes(t.id))].filter(t=>!kn.includes(t.id)),_o=FOLLOWERS_DATA.length,Ht=Vt.length',
  'Vt=cloudFollowing,_o=cloudFollowers.length,Ht=Vt.length',
  'Profile social counts'
);

replaceOnce(
  't==="followers"&&FOLLOWERS_DATA.map(o=>{const n=Ft.includes(o.id);return React.createElement(r,{key:o.id,u:o,active:n,btn:n?"\\u0645\\u062A\\u0627\\u0628\\u064E\\u0639":"\\u0645\\u062A\\u0627\\u0628\\u0639\\u0629",onBtn:()=>xn(s=>n?s.filter(d=>d!==o.id):[...s,o.id])})})',
  't==="followers"&&cloudFollowers.map(o=>{const n=cloudFollowing.some(s=>s.id===o.id);return React.createElement(r,{key:o.id,u:o,active:n,btn:n?"\\u0645\\u062A\\u0627\\u0628\\u064E\\u0639":"\\u0645\\u062A\\u0627\\u0628\\u0639\\u0629",onBtn:async()=>{const s=window.LorefyBackend;if(!s||!s.toggleProfileFollow)return;try{await s.toggleProfileFollow(o.id,!n),window.dispatchEvent(new CustomEvent("lorefy:profile-follow-changed",{detail:{profileId:o.id,following:!n}}))}catch(d){A(d&&d.message||"Cloud follow failed","err")}}})})',
  'Follower list'
);
replaceOnce('t==="followers"&&FOLLOWERS_DATA.length===0', 't==="followers"&&cloudFollowers.length===0', 'Follower empty state');
replaceOnce('onBtn:()=>wn(n=>[...n,o.id])', 'onBtn:async()=>{const n=window.LorefyBackend;if(!n||!n.toggleProfileFollow)return;try{await n.toggleProfileFollow(o.id,!1),window.dispatchEvent(new CustomEvent("lorefy:profile-follow-changed",{detail:{profileId:o.id,following:!1}}))}catch(s){A(s&&s.message||"Cloud follow failed","err")}}', 'Following removal');

const fakeProfileHead = 'vr=()=>{const t=He,r=[...SEED_FEED].filter(y=>y.un===t.un),o=Ae.includes(t.id)||Ft.includes(t.id),n=(t.un||"").split("").reduce((y,z)=>y+z.charCodeAt(0),0),s=18+n%40,d=r.length||3+n%12,h=40+n%900,g=[n%12+1,n*3%12+1,n*7%12+1,n*5%12+1].filter((y,z,O)=>O.indexOf(y)===z).map(y=>workById(y)).filter(Boolean).slice(0,4);';
const liveProfileHead = 'vr=()=>{const t=He,r=M.filter(y=>y.userId===t.id||y.un===t.un),o=cloudFollowing.some(y=>y.id===t.id),s=0,d=r.length,h=Number(t.follower_count)||0,g=[];';
replaceOnce(fakeProfileHead, liveProfileHead, 'Public reader profile');
replaceOnce('src:svgBanner(t.un)', 'src:t.banner||svgBanner(t.un)', 'Public profile banner');

const localProfileFollow = 'onClick:()=>{go(y=>y.includes(t.id)?y.filter(z=>z!==t.id):[...y,t.id]),A(o?"\\u0623\\u0644\\u063A\\u064A\\u062A \\u0627\\u0644\\u0645\\u062A\\u0627\\u0628\\u0639\\u0629":"\\u062A\\u062A\\u0627\\u0628\\u0639\\u0647 \\u0627\\u0644\\u0622\\u0646")}'
const cloudProfileFollow = 'onClick:async()=>{const y=window.LorefyBackend,z=!o;if(!y||!y.toggleProfileFollow)return;try{await y.toggleProfileFollow(t.id,z),Ye(O=>({...O,is_following:z,follower_count:Math.max(0,(Number(O.follower_count)||0)+(z?1:-1))})),window.dispatchEvent(new CustomEvent("lorefy:profile-follow-changed",{detail:{profileId:t.id,following:z}})),A(z?"\\u062A\\u062A\\u0627\\u0628\\u0639\\u0647 \\u0627\\u0644\\u0622\\u0646":"\\u0623\\u0644\\u063A\\u064A\\u062A \\u0627\\u0644\\u0645\\u062A\\u0627\\u0628\\u0639\\u0629")}catch(O){A(O&&O.message||"Cloud follow failed","err")}}';
replaceOnce(localProfileFollow, cloudProfileFollow, 'Public profile follow action');

replaceOnce('Me=t=>{t&&(Ye(t),S("userprofile"))}', 'Me=t=>{t&&window.dispatchEvent(new CustomEvent("lorefy:open-reader-profile",{detail:t}))}', 'Review author profile action');
replaceOnce(
  'd||Me({id:t.un,name:t.user,un:t.un,av:t.av})',
  'd||Me({id:t.userId,name:t.user,un:t.un,av:t.av})',
  'Review author canonical profile id'
);

replaceOnce(
  'let t=H==="mine"?M:H==="popular"?[...tt].sort((r,o)=>o.likes+(De[o.id]?1:0)-(r.likes+(De[r.id]?1:0))):[...tt].sort((r,o)=>(o.premium?1:0)-(r.premium?1:0));',
  'let t=H==="mine"?M.filter(r=>r.userId==="me"||r.un===Y):H==="friends"?tt.filter(r=>cloudFollowing.some(o=>o.id===r.userId)):H==="popular"?[...tt].sort((r,o)=>o.likes+(De[o.id]?1:0)-(r.likes+(De[r.id]?1:0))):[...tt].sort((r,o)=>(o.premium?1:0)-(r.premium?1:0));',
  'Community feed filters'
);

source = source.split('n:t.likes+(s?1:0)').join('n:Math.max(0,(t.likes||0)+(s&&!t.myHeart?1:0)-(!s&&t.myHeart?1:0))');
source = source.split('n:n?1:0,active:n,clr:C.green').join('n:Math.max(0,(t.likeCount||0)+(n&&!t.myLike?1:0)-(!n&&t.myLike?1:0)),active:n,clr:C.green');
source = source.split('h=t.likes+(n?1:0)').join('h=Math.max(0,(t.likes||0)+(n&&!t.myHeart?1:0)-(!n&&t.myHeart?1:0))');

replaceOnce('fo(r=>[t,...r])', 'fo(r=>[t,...r.filter(o=>String(o.mid)!==String(t.mid))])', 'One review per work in the local feed');

fs.writeFileSync(target, source);
console.log('Community social graph patched.');
