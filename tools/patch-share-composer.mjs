import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
let app=readFileSync('uploads/files/lorefy-app.js','utf8');
const hooks=[
 ['onClick:()=>Kt(m),style:', 'onClick:()=>window.LorefyShareComposer?window.LorefyShareComposer.open({kind:"work",title:m.title,subtitle:[m.auth,m.yr].filter(Boolean).join(" · "),rating:M.find(r=>String(r.mid)===String(m.id)&&r.userId==="me")?.r??null,text:M.find(r=>String(r.mid)===String(m.id)&&r.userId==="me")?.txt||"",profile:{name:J,handle:Y,avatar:Z},items:[{id:m.id,name:m.title,image:I(m)}]}):Kt(m),style:'],
 ['const openShareSheet=async board=>{if(shareBusy)return;', 'const exportBoard=board=>window.LorefyShareComposer.open({kind:"top",title:board.label,profile:window.LorefyShareComposer.currentProfile(),items:slotsForBoard(board.key).map((id,index)=>{const work=workById(id);return work?{id,name:work.title,image:profileBoardCoverSrc(work,coverMap),rank:index+1}:null}).filter(Boolean)});\n  const openShareSheet=async board=>{if(shareBusy)return;if(window.LorefyShareComposer)return exportBoard(board);'],
 ['const shareBoardImage=async(board=shareSheetBoard||selected)=>{if(shareBusy)return;', 'const shareBoardImage=async(board=shareSheetBoard||selected)=>{if(shareBusy)return;if(window.LorefyShareComposer)return exportBoard(board&&board.key?board:selected);']
];
for(const [before,after] of hooks){if(app.includes(after))continue;if(app.split(before).length!==2)throw Error('Ambiguous share hook: '+before);app=app.replace(before,after);}
writeFileSync('uploads/files/lorefy-app.js',app);
const version='20261028-share-composer-v3',assets=['modules/lorefy-share-composer.js','styles/lorefy-share-composer.css','modules/lorefy-share-studio.js','modules/lorefy-growth-features.js','modules/lorefy-community.js','backend/lorefy-backend.js','uploads/files/lorefy-app.js'];
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');
 if(file==='index.html'){
  if(!source.includes('styles/lorefy-share-composer.css'))source=source.replace('<head>','<head>\n<link rel="stylesheet" href="styles/lorefy-share-composer.css?v='+version+'">');
  if(!source.includes('modules/lorefy-share-composer.js')){const marker=source.match(/<script[^>]*src="modules\/lorefy-share-studio.js[^>]*><\/script>/)?.[0];if(!marker)throw Error('Share studio entry missing');source=source.replace(marker,marker+'\n<script defer src="modules/lorefy-share-composer.js?v='+version+'"></script>');}
 }else{
  source=source.replace(/const CACHE = 'lorefy-v(?:607-work-dislike|60[89]-share-composer|610-personal-picks)';/,"const CACHE = 'lorefy-v610-personal-picks';");
  for(const asset of assets)if(!source.includes(asset))source=source.replace('const CORE = [',"const CORE = [\n './"+asset+'?v='+version+"',");
 }
 for(const asset of assets){const pattern=new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[\\w-]+','g');if(!pattern.test(source))throw Error('Missing share asset '+asset+' in '+file);source=source.replace(pattern,asset+'?v='+version);}
 writeFileSync(file,source);
}
for(const mirror of ['ios-web','ios/App/App/public'])for(const file of [...assets,'index.html','sw.js']){const target=resolve(mirror,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(file,target);}
console.log('Share composer hooks and nine web files synchronized without a native build.');
