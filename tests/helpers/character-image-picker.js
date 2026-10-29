const fs=require('node:fs');
const vm=require('node:vm');
const RenderNode=require('./render-dom.js');
const source=fs.readFileSync('modules/lorefy-growth-features.js','utf8');
const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

function harness({lang='en',loader=async()=>[],save=async()=>{}}={}){
  const doc={},listeners=new Map(),timers=new Map(),auth=new Set(),writes=[],changes=[],toasts=[],reads=[];
  let owner='first',serial=0;
  class Node extends RenderNode{
    constructor(tag,attrs,kids){super(tag,attrs,kids);this.inert=false;this.classList.add=name=>this.classList.toggle(name,true);
      let disabled=false;Object.defineProperty(this,'disabled',{get:()=>disabled,set:value=>{disabled=value;if(value&&doc.activeElement===this)doc.activeElement=doc.body;}});
      Object.defineProperty(this,'isConnected',{get:()=>this===doc.body||!!this.parentNode?.isConnected});
    }
    get parentElement(){return this.parentNode;}
    get tabIndex(){return this.attrs.tabindex!==undefined?Number(this.attrs.tabindex):['button','input','textarea','select','a'].includes(this.tag)?0:-1;}
    getClientRects(){return this.isConnected&&!this.hidden&&this.attrs.style!=='display:none'?[{}]:[];}
    removeEventListener(type,fn){if(this.handlers[type]===fn)delete this.handlers[type];}
    removeChild(node){node.remove();}
    focus(){if(this.isConnected)doc.activeElement=this;}
    click(){if(!this.disabled)return this.handlers.click?.({stopPropagation(){},preventDefault(){}});}
    querySelectorAll(selector){return super.querySelectorAll('*').filter(node=>selector.split(',').some(s=>s===node.tag||s==='*'||s==='a[href]'&&node.tag==='a'&&node.attrs.href||s==="[tabindex='0']"&&node.attrs.tabindex==='0'||s.startsWith('.')&&(node.attrs.class||'').split(' ').includes(s.slice(1))));}
  }
  const el=(tag,attrs={},kids=[])=>new Node(tag,attrs,Array.isArray(kids)?kids:kids?[kids]:[]);
  doc.body=el('body');const host=el('div'),background=el('main'),opener=el('button'),alreadyInert=el('aside');alreadyInert.inert=true;
  doc.body.append(host);host.append(background,alreadyInert);background.append(opener);doc.getElementById=()=>host;opener.focus();
  const global={
    LorefyCharacterSystem:loader?{loadImageOptions:loader}:null,
    LorefyBackend:{onAuth(fn){auth.add(fn);return()=>auth.delete(fn);}},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);}
  };
  const scope={doc,global,el,uiText:(ar,en)=>lang==='en'?en:ar,
    characterImageUrl:()=> 'https://example.com/current.jpg',renderCharacterPortraitImage(){},
    toastSafe:message=>toasts.push(message),profileRatedCharacterOwner:()=>owner,
    setCharacterImage:async(c,url)=>{writes.push({owner,url});return save(c,url);},
    cbReadImageFile:(file,cb)=>reads.push(cb),
    setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)
  };
  const start=source.indexOf('  var activePage = null;');
  const keys=source.indexOf('  function bindDialogKeys(');
  const closePage=source.indexOf('  function closePage()');
  const portraits=source.indexOf('  function releaseCharacterPortraits(');
  vm.runInNewContext(source.slice(portraits,source.indexOf('  function characterPortrait(',portraits))+source.slice(keys,source.indexOf('  function ovOpen(',keys))+source.slice(start,source.indexOf('  function scoreControl(',start))+source.slice(closePage,source.indexOf('  function characterLoadStatus(',closePage)),scope);
  return {doc,host,background,alreadyInert,opener,global,writes,changes,toasts,reads,timers,auth,listeners,
    open(){scope.openCharacterImagePicker({name:'Hero',latin:'Hero'},url=>changes.push(url),{});return host.querySelector('.lf-image-choice-sheet');},
    close(){scope.closeCharacterImagePicker();},
    closeParent(){scope.activePage=background;scope.closePage();},
    key(picker,key,shiftKey=false){let prevented=false;picker.handlers.keydown?.({key,shiftKey,preventDefault(){prevented=true;},stopPropagation(){}});return prevented;},
    switchOwner(next,event='lorefy:stored-state'){owner=next;for(const fn of listeners.get(event)||[])fn({detail:{key:'lorefy.activeUser.v1'},key:'lorefy.activeUser.v1'});},
    expire(){for(const [id,timer] of [...timers]){timers.delete(id);timer.fn();}}
  };
}
module.exports={harness,flush,deferred};
