// Mechanical hooks in the shipped React source; feature code stays in its module.
import {readFileSync,writeFileSync} from 'node:fs';
const file=new URL('../uploads/files/lorefy-app.js',import.meta.url);
let source=readFileSync(file,'utf8');
const hooks=[
 ['continueReadingSection=()=>{const w=Hn.slice(0,4);return',
  'continueReadingSection=()=>{const w=Hn.slice(0,4);if(window.LorefyHomeCinema)return React.createElement(window.LorefyHomeCinema.Resume,{works:w,language:W,cover:I,fallback:legalCoverOf,onError:R,progressFor:je,summary:progressSummary,percent:progressPercent,onOpen:T,onLibrary:()=>nt("library"),onExplore:()=>nt("discover")});return'],
 ['className:"lf-screen-scroll lf-home-screen"','className:"lf-screen-scroll lf-home-screen lf-home-cinema"'],
 ['React.createElement("strong",{className:"lf-social-brand","data-no-translate":"1"},"Lorefy")',
  'window.LorefyHomeCinema?React.createElement(window.LorefyHomeCinema.Heading,{language:W}):React.createElement("strong",{className:"lf-social-brand","data-no-translate":"1"},"Lorefy")'],
 ['"data-review-id":t.id,"data-user-id":t.userId,onClick:()=>Vo(t)',
  '"data-review-id":t.id,"data-review-rating":t.r,"data-user-id":t.userId,onClick:()=>Vo(t)'],
 ['React.createElement("div",{style:{display:"flex",alignItems:"center",gap:7,marginBottom:5}},React.createElement(Stars,{n:t.r,size:11})',
  'React.createElement("div",{className:"lf-cinema-review-score",style:{display:"flex",alignItems:"center",gap:7,marginBottom:5}},x==="main"&&window.LorefyHomeCinema?React.createElement(window.LorefyHomeCinema.ReviewRating,{value:t.r,language:W,recommendation:t.recVal}):React.createElement(Stars,{n:t.r,size:11})']
];
for(const [before,after]of hooks){if(source.includes(after))continue;if(source.split(before).length!==2)throw Error('Home hook is not unique: '+before);source=source.replace(before,after);}
writeFileSync(file,source);
console.log('Home hooks applied; existing React state and routes preserved.');
