import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{extractCatalogRecords}=require('../modules/lorefy-catalog-data.js');
const base=new URL('../',import.meta.url),read=file=>fs.readFileSync(new URL(file,base),'utf8');
const records=new Map();
for(const file of fs.readdirSync(new URL('uploads/',base)).filter(f=>/^lorefy-data-part\d+\.js$/.test(f)).sort()) {
  for(const work of extractCatalogRecords(read('uploads/'+file)))if(work.id&&!records.has(work.id))records.set(work.id,work);
}
const all=Array.from(records.values()).filter(w=>w.sourceCoverUrl||w.coverImage||w.cover),used=new Set();
const specs=[['نورة','Noura','رواية','Romance'],['فهد','Fahad','مانجا','Action'],['ريم','Reem','مانهوا','Fantasy'],['عمر','Omar','مانهوا صيني','Adventure'],['سارة','Sara','كوميكس','Superhero'],['خالد','Khalid','كتاب','History'],['ليان','Layan','لايت نوفل','Drama'],['يوسف','Yousef','ويب نوفل','Mystery'],['مها','Maha','رواية','Classic'],['زياد','Ziyad','مانجا','Sports']];
const profiles=specs.map(([name,latin,type,genre],index)=>{
  let pool=all.filter(w=>w.type===type&&!used.has(w.id));
  if(pool.length<10)pool=all.filter(w=>!used.has(w.id));
  const chosen=pool.slice(index===8?20:0,(index===8?20:0)+10);
  if(chosen.length!==10)throw Error('Insufficient fixture works for '+name);
  chosen.forEach(w=>used.add(w.id));
  const ids=chosen.map(w=>w.id),library={},ratings={},progress={};
  ids.forEach((id,i)=>{library[id]=['تم القراءة','أقرأ حالياً','قائمة الأمنيات','توقف','توقف نهائي'][i%5];ratings[id]=Math.min(5,2.25+((index+i)%11)*.25);progress[id]={ch:i%5===0?Math.max(1,Number(chosen[i].ch)||10):i%5===1?index+i+1:0,pages:0,explicit:true};});
  const cover=w=>w.sourceCoverUrl||w.coverImage||w.cover;
  return {id:'qa-tester-'+String(index+1).padStart(2,'0'),fixture:true,name,latin,username:'test_'+latin.toLowerCase(),
    bio:index%2?'A fictional reader for local testing.':'شخصية وهمية للاختبار المحلي فقط.',
    avatar:cover(chosen[1]),banner:cover(chosen[0]),profile_layout:index%2?'immersive':'normal',
    ...(index===0?{profile_decoration:{frame:'pfpvibes-bunny-hug',page:'pfpvibes-bunny-hug',effect:'pfpvibes-bunny-hug'}}:{}),
    lang:index%2?'en':'ar',theme:index%3===0?'custom-dark-207b69':index%3===1?'custom-light-367faa':'pink',
    library_view:index%3===0?'spines':index%3===1?'grid':'shelf',banner_position:50,
    favorite_type:({'رواية':'Novel','مانجا':'Manga','مانهوا':'Manhwa','مانهوا صيني':'Manhua','كوميكس':'Comics','كتاب':'Book','لايت نوفل':'Light Novel','ويب نوفل':'Web Novel'})[type],
    genres:[genre],formats:[type],favorite_work_ids:ids.slice(0,4),top_work_ids:ids,library_entries:library,ratings,progress,
    follower_count:3,following_count:3,completed_count:2,review_count:1,total_chapters:20+index*13,read_hours:3+index*5,
    social_links:{instagram:'test_'+latin.toLowerCase(),twitter:'test_'+latin.toLowerCase()},following_ids:[],
    works:chosen.map(w=>({id:w.id,title:w.title,ar:w.ar,type:w.type,auth:w.auth,sourceCoverUrl:cover(w),genres:w.genres||[],ch:w.ch,vol:w.vol,r:w.r}))};
});
profiles.forEach((p,i)=>p.following_ids=[1,2,3].map(n=>profiles[(i+n)%10].id));
const opinions=['بناء الشخصيات أقوى من إيقاع البداية.','العالم متماسك لكن بعض التفاصيل تحتاج توضيحًا.','أعجبني تطور العلاقات والأسلوب السردي.','نهاية مؤثرة وبداية تحتاج صبرًا.','الرسم واضح والحوار مباشر.','معلومات مفيدة وتنظيم جيد للفصول.','الإيقاع سريع والشخصيات ممتعة.','الغموض جيد مع بعض التكرار.','لغة جميلة وتفاصيل إنسانية دقيقة.','تجربة مختلفة تستحق النقاش.'];
const reviews=profiles.map((p,i)=>({id:'qa-review-'+(i+1),fixture:true,userId:p.id,user:p.name,un:p.username,av:p.avatar,
  mid:p.favorite_work_ids[0],r:2.5+i*.25,rec:i%3!==0,recVal:i%3===0?'no':'yes',txt:opinions[i],
  sc:{story:3+i%3*.5,art:3.25+i%2*.75,chars:3.5+i%3*.25,world:3+i%4*.25},ts:1791536400000-i*3600000,likes:i,comments:0,imgs:[],spoiler:false}));
const data={version:1,profiles,reviews};
fs.writeFileSync(new URL('qa/tester-data.json',base),JSON.stringify(data));
fs.writeFileSync(new URL('qa/tester-data.js',base),'(function(root){const data='+JSON.stringify(data)+';if(typeof module==="object"&&module.exports)module.exports=data;else root.LorefyTesterData=data;})(typeof window!=="undefined"?window:this);\n');
let index=read('index.html');
index=index.replace('<head>','<head>\n<base href="/">\n<script src="qa/tester-data.js"></script>\n<script src="qa/tester-boot.js"></script>');
index=index.replace(/<script defer src="uploads\/files\/lorefy-app\.js[^\"]*"><\/script>/,'<script defer src="qa/tester-adapter.js"></script>\n<script defer src="qa/tester-runtime.js"></script>');
index=index.replace(/src="modules\/lorefy-public-profile\.js[^\"]*"/,'src="qa/tester-public-profile.js"');
fs.writeFileSync(new URL('qa/tester-app.html',base),index);
const app=read('uploads/files/lorefy-app.js'),guard='if(!e||e.mode!=="live"||!e.listReviews)return;';
if(!app.includes(guard))throw Error('Review adapter guard changed');
fs.writeFileSync(new URL('qa/tester-runtime.js',base),app.replace(guard,'if(!e||e.mode!=="live"&&!window.LorefyTesterLab||!e.listReviews)return;'));
const publicView=read('modules/lorefy-public-profile.js'),publicGuard="if (!backend || backend.mode !== 'live' && !preview) return;";
if(!publicView.includes(publicGuard))throw Error('Public profile fixture guard changed');
fs.writeFileSync(new URL('qa/tester-public-profile.js',base),publicView.replace(publicGuard,"if (!backend || backend.mode !== 'live' && !preview && !root.LorefyTesterLab) return;"));
console.log('Prepared 10 isolated tester profiles, 100 distinct works, and 10 reviews. No production entry points changed.');
