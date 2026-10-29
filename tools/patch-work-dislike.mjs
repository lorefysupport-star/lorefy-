import {readFileSync,writeFileSync} from 'node:fs';
const file='uploads/files/lorefy-app.js';
let source=readFileSync(file,'utf8');
const changes=[
 ['||G===0)return false;', '||!(typeof G==="number"&&Number.isFinite(G)&&((G>=.25&&G<=5)||(G===0&&Fe==="no"))))return false;'],
 ['creator:m.auth,rating:_(m),ratingSource:', 'creator:m.auth,rating:_(m),reviews:M,ratingSource:'],
 ['mid:p.work_id,r:Number(p.rating)||0,rec:', 'mid:p.work_id,r:p.rating==null?null:Number(p.rating)||0,rec:'],
 ['if(average!==null)dt(average)},[ze]);', 'if(average!==null){dt(average);if(Fe==="no")ro(null)}},[ze]);']
];
for(const [before,after] of changes){
 if(source.includes(after))continue;
 if(source.split(before).length!==2)throw Error('Unexpected or ambiguous dislike hook: '+before);
 source=source.replace(before,after);
}
writeFileSync(file,source);
console.log('Patched existing review publication, detail count props and null-safe hydration.');
