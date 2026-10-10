import fs from 'node:fs';
const file=new URL('../uploads/files/lorefy-app.js',import.meta.url);
let source=fs.readFileSync(file,'utf8');
function patch(before,after){
  if(source.includes(after))return;
  if(!source.includes(before))throw Error('Preview reader anchor changed: '+before.slice(0,80));
  source=source.replace(before,after);
}
patch('[M,fo]=useStoredState("lorefy.user.privateReviews.v2",[])','[M,fo]=window.LorefyPreviewReaders.useReviews(React,useStoredState)');
const graph=`useEffect(()=>{if(!window.LorefyPreviewReaders.isActive())return;const backend=window.LorefyBackend;let active=true;
const load=async()=>{const session=await backend.getSession();if(!session)return;const followers=await backend.listProfileFollowers(session.userId),following=await backend.listProfileFollowing(session.userId);if(!active)return;
const map=p=>({id:p.id,name:p.name,un:p.username,av:p.avatar,bio:p.bio,is_following:p.is_following});setCloudFollowers(followers.map(map));setCloudFollowing(following.map(map));};
load();window.addEventListener("lorefy:profile-follow-changed",load);return()=>{active=false;window.removeEventListener("lorefy:profile-follow-changed",load)}},[]);`;
const anchor='useEffect(()=>{const e=window.LorefyBackend;if(!e||e.mode!=="live"||!e.listReviews)return;';
if(!source.includes(graph))patch(anchor,graph+anchor);
patch('const c=window.LorefyDemoCommunity&&window.LorefyDemoCommunity.findReader?',
  'const c=window.LorefyPreviewReaders.findReader(a.id)||(window.LorefyDemoCommunity&&window.LorefyDemoCommunity.findReader?');
patch('window.LorefyDemoCommunity.findReader(a.id,(window.LorefyMangaData||[]).map(p=>p.id)):null,p=',
  'window.LorefyDemoCommunity.findReader(a.id,(window.LorefyMangaData||[]).map(p=>p.id)):null),p=');
fs.writeFileSync(file,source);
