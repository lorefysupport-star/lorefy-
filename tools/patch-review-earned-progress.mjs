import {readFileSync,writeFileSync} from 'node:fs';
const file='uploads/files/lorefy-app.js';let source=readFileSync(file,'utf8');
const old='if(completeOnPublish&&lorefyReviewCompletionAllowed(editor,m))Zn(m);fo(r=>[t,...r.filter(o=>String(o.mid)!==String(t.mid)||!(o.userId==="me"||o.userId===window.LorefyBackend?.user?.id))]);';
const next='fo(rows=>{if(!lorefyReviewEditorCurrent(editor,reviewEditor,m))return rows;const own=o=>String(o.mid)===String(t.mid)&&(o.userId==="me"||o.userId===window.LorefyBackend?.user?.id),previous=rows.find(own),review=window.LorefyReadingMetrics?window.LorefyReadingMetrics.withReviewCompletion({...t,completionProgress:previous?.completionProgress},m,{ch:workChapterCount(m),vol:workVolumeCount(m),pages:workPageCount(m)}):t;return [review,...rows.filter(o=>!own(o))]});';
const hooks=[[old,next],
 ['calculateReadingMetrics({library:b,progressById:le,getWork:workById,','calculateReadingMetrics({library:b,progressById:le,reviews:M,ownerId:window.LorefyBackend?.user?.id,getWork:workById,'],
 ['completeOnPublish:lorefyReviewCompletionAllowed(editor,m)','completeOnPublish:false']];
for(const [before,after]of hooks){if(source.includes(after))continue;if(source.split(before).length!==2)throw Error('Review earned-progress hook changed: '+before);source=source.replace(before,after);}
writeFileSync(file,source);console.log('Review statistics separated from library status; owner guards preserved.');
