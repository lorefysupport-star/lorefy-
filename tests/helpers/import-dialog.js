const fs=require('node:fs'),vm=require('node:vm'),RenderNode=require('./render-dom.js');
const source=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function harness(lang='en'){
 const nodes=[],doc={documentElement:{lang}},hooks={},requests=[],writes=[],reads=[];
 class Node extends RenderNode{
  constructor(tag,attrs,kids){super(tag,attrs,kids);this.classList.add=name=>this.classList.toggle(name,true);this.classList.remove=name=>this.classList.toggle(name,false);}
  focus(){doc.activeElement=this;}
  removeAttribute(name){delete this.attrs[name];}
  scrollIntoView(){}
  click(){if(!this.disabled)return this.handlers.click?.({preventDefault(){},stopPropagation(){}});}
 }
 const el=(tag,attrs={},kids=[])=>{const node=new Node(tag,attrs,Array.isArray(kids)?kids:kids?[kids]:[]);nodes.push(node);return node;};
 const page=el('div'),body=el('div');page.appendChild(body);
 const works=[{id:'first',title:'First',type:'Novel'},{id:'second',title:'Second',type:'Manga'}];
 const scope={doc,global:{LorefyI18n:require('../../modules/lorefy-i18n'),localStorage:{getItem:()=>null}},el,uiText:(ar,en)=>lang==='en'?en:ar,toastSafe(){},
  ovOpen:(cls,title)=>{page.setAttribute('aria-label',title);return {page,body,close(){page.isConnected=false;page.inert=true;}};},
  imFetchAniList:name=>{requests.push({service:'AniList',name});return hooks.fetch?hooks.fetch(name):Promise.resolve({rows:[],misses:0});},
  imFetchKitsu:name=>{requests.push({service:'Kitsu',name});return hooks.fetch?hooks.fetch(name):Promise.resolve({rows:[],misses:0});},
  imReadFileText:(file,ok,fail)=>reads.push({ok,fail}),
  imParseMalXml:()=>({rows:[],misses:0}),imParseGoodreads:()=>({rows:[],misses:0}),imParseGenericCsv:()=>({rows:[],misses:0}),
  imFindByTitle:title=>works.find(work=>work.title===title),imNorm:title=>title.toLowerCase(),imBuildMaps:()=>({byTitle:new Map(works.map(w=>[w.title.toLowerCase(),[w]]))}),
  mlTitleOf:work=>work.title,mlResultCover:work=>el('img',{alt:work.title}),
  imApply:(rows,options)=>{writes.push(rows);if(hooks.apply)hooks.apply(rows,options);if(hooks.saveError)throw hooks.saveError;return {added:rows.length,ratings:0,reviews:0,skipped:0};},
  IM_DONE:'done',IM_READING:'reading',IM_WISH:'wish',IM_PAUSED:'paused',IM_DROPPED:'dropped'};
 const start=source.indexOf('  function openImport()');vm.runInNewContext(source.slice(start,source.indexOf('  /* \u2500\u2500 profile character taste',start)),scope);scope.openImport();
 return {page,body,doc,nodes,hooks,requests,writes,reads,works,
  find:cls=>page.querySelector('.'+cls),all:cls=>page.querySelectorAll('.'+cls),
  input:service=>nodes.find(n=>n.tag==='input'&&n.attrs['aria-label']===(lang==='en'?service+' username':'اسم المستخدم في '+service)),
  start(service='AniList',name='reader'){const input=this.input(service);input.value=name;const section=page.querySelectorAll('section').find(n=>n.querySelectorAll('input').includes(input));return section.querySelector('.lf-im-go').click();}
 };
}
module.exports={harness,flush,deferred};
