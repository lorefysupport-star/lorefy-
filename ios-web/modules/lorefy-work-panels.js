(function(root,factory){var api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.LorefyWorkPanels=api;})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 function icon(name,size){var c=root.NenIcons&&(root.NenIcons[name]||root.NenIcons.BookOpen);return c?root.React.createElement(c,{size:size||20,'aria-hidden':true}):null;}
 function Panel(p){
  var R=root.React,h=R.createElement,host=R.useRef(null),alive=R.useRef(true),close=R.useRef(null),en=p.language==='en',current=function(){return alive.current&&(!p.isCurrent||p.isCurrent());};
  R.useEffect(function(){
   alive.current=true;var previous=root.document.activeElement,changes=[],overlay=host.current&&host.current.parentElement,node=overlay;
   while(node&&node.parentElement&&node!==root.document.body){Array.from(node.parentElement.children).forEach(function(sibling){if(sibling===node||/SCRIPT|STYLE/.test(sibling.tagName))return;changes.push([sibling,sibling.inert]);sibling.inert=true;});node=node.parentElement;}
   if(close.current)close.current.focus({preventScroll:true});
   return function(){alive.current=false;changes.forEach(function(v){v[0].inert=v[1];});if(previous&&previous.isConnected)previous.focus({preventScroll:true});};
  },[]);
  function keyboard(e){
   if(e.key==='Escape'&&current()){e.preventDefault();e.stopPropagation();p.onClose();}
   if(e.key!=='Tab'||!host.current)return;
   var controls=Array.from(host.current.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea,select,[tabindex="0"]')).filter(function(n){return n.getClientRects().length;});
   var first=controls[0],last=controls[controls.length-1];if(!first)return;
   if(e.shiftKey&&root.document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&root.document.activeElement===last){e.preventDefault();first.focus();}
  }
  return h('div',{className:'lf-studio-overlay',dir:en?'ltr':'rtl',onKeyDown:keyboard,onClick:function(e){if(e.target===e.currentTarget&&current())p.onClose();}},
   h('section',{className:'nc-sheet lf-work-panel '+p.className,ref:host,role:'dialog','aria-modal':true,'aria-label':p.title,'data-no-translate':'1'},
    h('header',{className:'lf-studio-header'},h('div',null,h('small',null,en?'LOREFY':'لورفاي'),h('h2',null,p.title)),h('button',{className:'lf-studio-close',ref:close,type:'button',disabled:!!p.busy,'aria-label':en?'Close':'إغلاق',title:en?'Close':'إغلاق',onClick:function(){if(current())p.onClose();}},icon('X'))),
    h('div',{className:'lf-studio-body'},p.body),h('footer',{className:'lf-studio-footer'},p.footer)));
 }
 function Status(p){
  var alive=root.React.useRef(true);root.React.useEffect(function(){return function(){alive.current=false;};},[]);
  var h=root.React.createElement,en=p.language==='en',labels=(p.choices||[]).map(function(value){return root.LorefyI18n.readingStatusLabel(value,p.language);});
  var icons=['BookOpen','Check','Bookmark','Pause','Archive'],current=function(){return alive.current&&(!p.isCurrent||p.isCurrent());};
  var options=p.choices||[],index=options.indexOf(p.status),progress=p.progress||{};
  function field(key,label){return h('label',{className:'lf-studio-field',key:key},h('span',null,label),h('input',{type:'number',min:0,step:1,inputMode:'numeric','data-progress-field':key,value:progress[key]||'',onChange:function(e){if(current())p.onProgress(key,e.target.value);}}));}
  return Panel({language:p.language,isCurrent:p.isCurrent,onClose:p.onClose,title:en?'Reading status':'حالة القراءة',className:'lf-work-status-sheet lf-status-studio',
   body:h(root.React.Fragment,null,
    h('div',{className:'lf-studio-work'},h('img',{src:p.cover,alt:'',decoding:'async'}),h('div',null,h('small',null,p.typeLabel||p.work.type),h('h3',{dir:'auto'},p.work.title),h('span',{className:'lf-studio-current'},icon(icons[index]||'BookOpen',14),labels[index]||''))),
    h('div',{className:'lf-status-choices',role:'radiogroup','aria-label':en?'Reading status':'حالة القراءة',onKeyDown:function(e){var list=Array.from(e.currentTarget.querySelectorAll('[role=radio]')),at=list.indexOf(root.document.activeElement);if(at<0||!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();var next=e.key==='Home'?0:e.key==='End'?list.length-1:(at+(['ArrowDown',en?'ArrowRight':'ArrowLeft'].includes(e.key)?1:-1)+list.length)%list.length;list[next].click();list[next].focus();}},options.map(function(value,i){return h('button',{key:value,type:'button',role:'radio','aria-checked':p.status===value,tabIndex:p.status===value?0:-1,'data-status-index':i,onClick:function(){if(current())p.onSelect(value);}},h('span',{className:'lf-status-symbol'},icon(icons[i],22)),h('span',null,labels[i]),p.status===value&&icon('Check',16));})),
    p.trackProgress&&h('section',{className:'lf-status-checkpoint'},h('h3',null,en?'Your place':'مكانك في العمل'),h('div',{className:'lf-status-fields'},!p.isText&&field('chapter',en?'Chapter':'الفصل'),field('volume',en?'Volume':'المجلد'),field('page',en?'Page':'الصفحة')),h('label',{className:'lf-studio-field'},h('span',null,en?'Note':'ملاحظة'),h('input',{value:progress.note||'',dir:'auto','data-progress-field':'note',onChange:function(e){if(current())p.onProgress('note',e.target.value);}})))),
   footer:h(root.React.Fragment,null,h('button',{className:'lf-studio-primary',type:'button',onClick:function(){if(current())p.onSave();}},icon('Check',18),en?'Save status':'حفظ الحالة'),p.inLibrary&&h('button',{className:'lf-studio-destructive',type:'button',onClick:function(){if(current())p.onRemove();}},icon('Trash2',17),en?'Remove from library':'إزالة من المكتبة'))});
 }
 function coverChoices(rows,current,label){
  var seen=new Set(),items=[];
  (rows||[]).forEach(function(row){if(!row||typeof row.img!=='string'||!row.img||seen.has(row.img))return;seen.add(row.img);items.push({img:row.img,label:String(row.label||''),details:Object.assign({},row.details||{})});});
  if(current&&!seen.has(current))items.unshift({img:current,label:label,details:root.LorefyCoverAPI&&root.LorefyCoverAPI.describe?root.LorefyCoverAPI.describe(current):{}});return items;
 }
 function coverDescription(row,language){
  var d=row&&row.details||{},en=language==='en',source=d.source==='local'?(en?'From photos':'من صوري'):d.source||(en?'Source not provided':'المصدر غير متوفر');
  var identity=d.volume?(en?'Volume ':'المجلد ')+d.volume:d.edition?(en?'Edition ':'الطبعة ')+d.edition:(en?'Edition not provided':'بيانات الطبعة غير متوفرة');
  return [source,identity,d.publisher,d.published,d.language,d.isbn&&'ISBN '+d.isbn].filter(Boolean).join(' · ');
 }
 function CoverTile(p){
  var R=root.React,h=R.createElement,s=R.useState('loading'),state=s[0],setState=s[1],ready=R.useRef(false);
  return h('button',{type:'button',className:'lf-cover-studio-choice','aria-label':p.label+' · '+p.description,'aria-pressed':p.selected,'data-cover-state':state,disabled:state==='error'||p.busy,onClick:function(){if(ready.current&&!p.busy)p.onSelect(p.src);}},
   h('span',{className:'lf-cover-studio-image'},h('img',{src:p.src,alt:'','data-cover-picker-image':'1',loading:'lazy',decoding:'async',referrerPolicy:'no-referrer',onLoad:function(){ready.current=true;setState('ready');p.onReady(p.src);},onError:function(){ready.current=false;setState('error');p.onFailed(p.src);}}),state==='error'&&h('span',{className:'lf-cover-studio-unavailable'},icon('ImageOff',22),p.en?'Unavailable':'غير متاح'),p.selected&&state!=='error'&&h('span',{className:'lf-cover-studio-mark'},icon('Check',14))),h('span',{className:'lf-cover-studio-label'},p.label),h('span',{className:'lf-cover-studio-meta',dir:'auto',title:p.description},p.description));
 }
 function Cover(p){
  var R=root.React,h=R.createElement,en=p.language==='en',selectedState=R.useState(p.cover),selected=selectedState[0],setSelected=selectedState[1],busyState=R.useState(false),busy=busyState[0],setBusy=busyState[1],errorState=R.useState(''),error=errorState[0],setError=errorState[1],revision=R.useState(0),refresh=revision[1],ready=R.useRef(new Set()),failed=R.useRef(new Set()),alive=R.useRef(true),pending=R.useRef(false),file=R.useRef(null);
  R.useEffect(function(){return function(){alive.current=false;};},[]);
  R.useEffect(function(){setSelected(p.cover);},[p.cover,p.work.id]);
  function current(){return alive.current&&(!p.isCurrent||p.isCurrent());}
  var items=coverChoices(p.options,p.cover,en?'Current cover':'غلافك الحالي');
  var selectedChoice=items.find(function(item){return item.img===selected;})||{img:selected};
  function label(text){return root.LorefyI18n?root.LorefyI18n.translate(text,p.language):text;}
  async function apply(value){
   if(!current()||pending.current)return;pending.current=true;setBusy(true);setError('');
   try{var saved=await p.onApply(value);if(current()){if(saved===false)setError(en?'Could not save. Your selection is still here.':'تعذر الحفظ. اختيارك ما زال هنا.');else p.onClose();}}
   catch(_){if(current())setError(en?'Could not save. Try again.':'تعذر الحفظ. حاول مجددًا.');}
   finally{pending.current=false;if(current())setBusy(false);}
  }
  return Panel({language:p.language,busy:busy,isCurrent:function(){return current()&&!pending.current;},onClose:p.onClose,title:en?'Cover studio':'غلاف العمل',className:'lf-work-cover-sheet lf-cover-studio',
   body:h(R.Fragment,null,h('div',{className:'lf-cover-studio-preview'},h('div',{className:'lf-cover-studio-large'},h('img',{src:selected,alt:'','data-cover-picker-image':'1',onLoad:function(){if(!current())return;failed.current.delete(selected);ready.current.add(selected);refresh(function(n){return n+1;});},onError:function(){if(!current())return;failed.current.add(selected);refresh(function(n){return n+1;});}}),failed.current.has(selected)&&h('span',{className:'lf-cover-studio-unavailable'},icon('ImageOff',24),en?'Unavailable':'غير متاح')),h('div',null,h('small',null,selected===p.cover?(en?'Current cover':'الغلاف الحالي'):(en?'Preview':'معاينة')),h('h3',{dir:'auto'},p.work.title),h('p',null,p.typeLabel||p.work.type),h('input',{type:'file',ref:file,accept:'image/*',hidden:true,onChange:function(event){if(current()&&!busy)p.onUpload(event);}}),h('button',{className:'lf-cover-studio-upload',type:'button',disabled:busy||p.uploading,onClick:function(){if(current()&&file.current)file.current.click();}},icon('Upload',18),p.uploading?(en?'Preparing…':'جارٍ التجهيز…'):(en?'From photos':'من صوري')))),
    h('p',{className:'lf-cover-studio-details',dir:'auto','aria-live':'polite'},coverDescription(selectedChoice,p.language)),
    h('h3',{className:'lf-cover-studio-heading'},en?'Available covers':'الأغلفة المتاحة'),p.loading&&h('p',{className:'lf-studio-status',role:'status'},en?'Finding covers…':'جارٍ البحث عن الأغلفة…'),h('div',{className:'lf-cover-studio-grid'},items.map(function(item){return h(CoverTile,{key:item.img,src:item.img,label:label(item.label),description:coverDescription(item,p.language),en:en,selected:selected===item.img,busy:busy,onSelect:function(src){if(current()){setSelected(src);setError('');}},onReady:function(src){if(!current())return;failed.current.delete(src);ready.current.add(src);refresh(function(n){return n+1;});},onFailed:function(src){if(!current())return;failed.current.add(src);refresh(function(n){return n+1;});}});})),p.hasMore&&h('button',{className:'lf-cover-studio-more',type:'button',disabled:busy,onClick:p.onMore},en?'More covers':'المزيد من الأغلفة')),
   footer:h(R.Fragment,null,error&&h('p',{className:'lf-studio-error',role:'alert'},error),h('button',{className:'lf-studio-primary',type:'button',disabled:busy||p.uploading||selected===p.cover||!ready.current.has(selected)||failed.current.has(selected),onClick:function(){apply(selected);}},icon('Check',18),busy?(en?'Saving…':'جارٍ الحفظ…'):(en?'Save cover':'حفظ الغلاف')),p.hasCustom&&h('button',{className:'lf-cover-studio-reset',type:'button',disabled:busy,onClick:function(){apply('');}},icon('RotateCcw',16),en?'Restore original':'استعادة الغلاف الأصلي'))});
 }
 return{Status:Status,Cover:Cover,coverChoices:coverChoices,coverDescription:coverDescription};
});
