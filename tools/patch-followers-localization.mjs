import fs from 'node:fs';
const file=new URL('../uploads/files/lorefy-app.js',import.meta.url);
let source=fs.readFileSync(file,'utf8');
if(!source.includes('LorefyI18n.connections(W,_o,Ht)')) {
  const start=source.indexOf('mr=()=>{if(!Fo)return null;'),end=source.indexOf(',vr=()=>',start);
  if(start<0||end<0)throw Error('Follower dialog boundaries changed');
  let section=source.slice(start,end);
  const literal=value=>JSON.stringify(value).replace(/[^\x00-\x7f]/g,c=>'\\u'+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0'));
  const replace=(before,after)=>{
    if(!section.includes(before))throw Error('Missing follower localization anchor: '+before);
    section=section.replaceAll(before,after);
  };
  replace('const t=Fo,r=', 'const t=Fo,labels=window.LorefyI18n.connections(W,_o,Ht),r=');
  replace('"aria-modal":true,"aria-label":"المتابعون والمتابعة"','"aria-modal":true,"data-no-translate":true,"aria-label":labels.title');
  replace('"aria-label":"إغلاق"','"aria-label":labels.close');
  const tabStart=section.indexOf('[["followers",`'),tabEnd=section.indexOf('.map(([o,n])',tabStart);
  if(tabStart<0||tabEnd<0)throw Error('Follower tab boundaries changed');
  section=section.slice(0,tabStart)+'[["followers",labels.followers],["following",labels.following]]'+section.slice(tabEnd);
  replace('btn:n?'+literal('متابَع')+':'+literal('متابعة'),'btn:n?labels.followed:labels.follow');
  replace('btn:'+literal('إلغاء المتابعة'),'btn:labels.unfollow');
  replace(literal('لا يوجد متابعون بعد'),'labels.emptyFollowers');
  replace(literal('لا أحد بعد '),'labels.emptyFollowing');
  replace('"Cloud follow failed"','labels.error');
  source=source.slice(0,start)+section+source.slice(end);
  fs.writeFileSync(file,source);
}
const start=source.indexOf('mr=()=>{if(!Fo)return null;'),end=source.indexOf(',vr=()=>',start);
if(start<0||end<0)throw Error('Follower contrast boundaries changed');
const before=source.slice(start,end),after=before.replace('color:d?C.sub:"#fff"','color:d?C.sub:C.onAccent').replace('color:t===o?"#fff":C.sub','color:t===o?C.onAccent:C.sub');
if(before!==after)fs.writeFileSync(file,source.slice(0,start)+after+source.slice(end));
