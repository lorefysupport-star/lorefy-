// Guarded hooks preserve the existing owner filtering, sorting and click handlers.
import {readFileSync,writeFileSync} from 'node:fs';
const file=new URL('../uploads/files/lorefy-app.js',import.meta.url);
let source=readFileSync(file,'utf8');
const oldBackdrop='window.LorefyLibraryCinema&&React.createElement(window.LorefyLibraryCinema.Backdrop,{entries:t,readingStatus:STATUS_READING,cover:I,fallback:legalCoverOf,onError:R}),';
if(source.includes(oldBackdrop)){
 if(source.split(oldBackdrop).length!==2)throw Error('Library backdrop hook is not unique');
 source=source.replace(oldBackdrop,'');
}
const heading=String.raw`React.createElement("h1",null,"\u0645\u0643\u062A\u0628\u062A\u064A")`;
const search='React.createElement("input",{type:"search",value:libraryQuery,onChange:e=>setLibraryQuery(e.target.value),placeholder:"ابحث في مكتبتك","aria-label":"البحث في المكتبة"})';
const checkpoint='React.createElement("span",null,d?`${d}% \\xB7 `:"",progressSummary(o,s))';
const hooks=[
 ['className:"lf-screen-scroll lf-library-page"','className:"lf-screen-scroll lf-library-page lf-library-cinema"'],
 [heading,'window.LorefyLibraryCinema?React.createElement(window.LorefyLibraryCinema.Heading,{language:W}):'+heading],
 ['React.createElement("div",{className:"lf-library-tabs"}',
  'window.LorefyLibraryCinema&&React.createElement(window.LorefyLibraryCinema.Search,{value:libraryQuery,onChange:setLibraryQuery,language:W}),React.createElement("div",{className:"lf-library-tabs"}'],
 [search,'!window.LorefyLibraryCinema&&'+search],
 ['React.createElement("option",{value:"progress"},"تقدم القراءة")))',
  'React.createElement("option",{value:"progress"},"تقدم القراءة")),window.LorefyLibraryCinema&&React.createElement(window.LorefyLibraryCinema.Summary,{count:libraryVisible.length,language:W}))'],
 ['className:"lf-library-card",key:o.id,',
  'className:"lf-library-card",key:o.id,"data-work-id":o.id,"data-work-title":o.title,"data-progress-known":window.LorefyLibraryCinema?window.LorefyLibraryCinema.hasTotal(o,s):true,'],
 [checkpoint,'React.createElement("span",{"data-no-translate":"1"},window.LorefyLibraryCinema?window.LorefyLibraryCinema.checkpoint(o,s,W,progressSummary(o,s)):[d?`${d}% \\xB7 `:"",progressSummary(o,s)])']
];
for(const [before,after]of hooks){if(source.includes(after))continue;if(source.split(before).length!==2)throw Error('Library hook is not unique: '+before);source=source.replace(before,after);}
if(!source.includes('window.LorefyLibraryCinema.Empty')){
 const start='libraryVisible.length===0&&React.createElement("div",{className:"lf-empty-state"}',end=',libraryVisible.map';
 const a=source.indexOf(start),b=source.indexOf(end,a);
 if(a<0||b<0||b-a>1500||source.split(start).length!==2)throw Error('Library empty hook changed');
 const legacy=source.slice(a+('libraryVisible.length===0&&').length,b);
 source=source.slice(0,a)+'libraryVisible.length===0&&(window.LorefyLibraryCinema?React.createElement(window.LorefyLibraryCinema.Empty,{language:W,query:libraryQuery,filtered:q!=="all",onClear:()=>setLibraryQuery(""),onExplore:()=>nt("discover")}):'+legacy+')'+source.slice(b);
}
writeFileSync(file,source);
console.log('Library presentation hooks applied; existing data and view modes preserved.');
