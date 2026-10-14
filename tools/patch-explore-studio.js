// Targeted anchors preserve the surrounding generated application bundle.
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../uploads/files/lorefy-app.js');
let source = fs.readFileSync(file, 'utf8');
function replace(from, to) {
  if (source.includes(to)) return;
  if (source.split(from).length !== 2) throw new Error('Explore patch anchor is ambiguous: ' + from.slice(0, 100));
  source = source.replace(from, to);
}
replace('p(u,F)}),c},diversifyRankedWorks=',
  'p(u,F)}),Object.entries(l.feedback||{}).forEach(([id,item])=>p(workById(id),item.value==="more_like_this"?100:item.value==="not_interested"?-60:0)),c},diversifyRankedWorks=');
replace('a.userKey||"",language]);if(PERSONALIZED_CACHE',
  'a.userKey||"",language,Object.entries(a.feedback||{}).map(([id,item])=>[id,item.value]).sort()]);if(PERSONALIZED_CACHE');
replace('&&!F.has(String(b.id))).map(b=>',
  '&&!F.has(String(b.id))&&!a.feedback?.[b.id]).map(b=>');
const anchor = 'const P=DISCOVER_CACHE.statics.typeReps;return React.createElement';
const integration = `const P=DISCOVER_CACHE.statics.typeReps;
if(window.LorefyExploreStudio)return React.createElement(window.LorefyExploreStudio.Explore,{
  key:window.LorefyBackend?.user?.id||Y||J,language:W,preferences:Be,library:b,progress:le,favorites:Ie,activeType:ye,allType:TYPES[0],types:TYPES,
  genres:Object.keys(GENRE_TERMS),categories:P,getWork:workById,cover:I,fallback:legalCoverOf,onCoverError:R,
  typeLabel:type=>window.LorefyReviewEditor?.formatLabel?.(type,W)||window.LorefyI18n?.translate(type,W)||type,
  genreLabel:genre=>window.LorefyI18n?.translate(genre,W)||genre,
  getTotals:work=>({chapter:workChapterCount(work),page:workPageCount(work),ongoing:isOngoingWork(work)}),
  getRanked:(type=ye)=>personalizedWorks(type,Be,b,{language:W,favorites:Ie,reviews:M.filter(review=>review.userId==="me"||!!window.LorefyBackend?.user?.id&&review.userId===window.LorefyBackend.user.id),myProgress:le,chapterFollowing:Ke,userKey:window.LorefyBackend?.user?.id||Y||J,feedback:window.LorefyProductTools?.core.recommendations.getFeedback()||{}}),
  getCatalog:()=>MANGA,ratingScore:ratingConfidenceScore,userKey:window.LorefyBackend?.user?.id||Y||J,
  friendProps:{language:W,reviews:tt,following:[...new Set(cloudFollowing.map(p=>p.id).concat(Ae))],getWork:workById,onWork:T,onReader:Me,cover:I,fallback:legalCoverOf,onCoverError:R,Stars:Stars},
  onWork:T,onSearch:()=>nt("search"),onLibrary:()=>nt("library"),onType:Qt,onPreferences:cn,
  onBrowse:type=>{en(type),Qo(""),Pe(60),S("search"),v("search")},
  onEditProgress:work=>{be(work),eo(b[work.id]||STATUS_READING),oo(normalizeProgress(le[work.id]))},
  onFeedback:(id,value)=>window.LorefyProductTools.core.recommendations.setFeedback(id,value)
});return React.createElement`;
replace(anchor, integration);
new (require('node:vm').Script)(source);
fs.writeFileSync(file, source);
