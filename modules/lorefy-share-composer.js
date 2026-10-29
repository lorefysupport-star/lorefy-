(function(root,factory){var api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LorefyShareComposer=api;})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 var templates=[{id:'spotlight',ar:'اختياراتي',en:'Personal picks'},{id:'gallery',ar:'معرض',en:'Gallery'},{id:'journal',ar:'سجل',en:'Journal'}];
 var sizes={story:[1080,1920],portrait:[1080,1350],square:[1080,1080]},active=null;
 function clean(value,max){return String(value==null?'':value).trim().slice(0,max||500);}
 function media(value){value=String(value||'').trim();return /^data:image\//i.test(value)?value.length<=16*1024*1024?value:'':clean(value,5000);}
 function color(value,fallback){return /^#[0-9a-f]{6}$/i.test(value||'')?value.toLowerCase():fallback;}
 function normalize(input){
  input=input||{};var profile=input.profile||{};
  return {kind:['work','review','ranking','top','list'].includes(input.kind)?input.kind:'list',title:clean(input.title,300),subtitle:clean(input.subtitle,500),text:clean(input.text,4000).replace(/^—$/,''),
   rating:typeof input.rating==='number'&&Number.isFinite(input.rating)&&input.rating>=0&&input.rating<=5?input.rating:null,
   profile:{name:clean(profile.name,120),handle:clean(profile.handle||profile.username,80).replace(/^@/,''),avatar:media(profile.avatar)},
   items:(Array.isArray(input.items)?input.items:[]).filter(Boolean).map(function(item,index){return {id:clean(item.id||index),name:clean(item.name||item.title,300),image:media(item.image||item.img||item.src),rank:Number.isSafeInteger(item.rank)&&item.rank>0?item.rank:index+1};})};
 }
 function settings(value){value=value||{};return {template:templates.some(function(t){return t.id===value.template;})?value.template:'spotlight',format:Object.prototype.hasOwnProperty.call(sizes,value.format)?value.format:'portrait',followTheme:value.followTheme!==false,gradient:value.gradient!==false,
  background:color(value.background,'#f9f5f7'),bottom:color(value.bottom,'#eee0e8'),accent:color(value.accent,'#a42e61'),ink:color(value.ink,'#261d25'),showProfile:value.showProfile!==false,showRating:value.showRating!==false,showText:value.showText!==false,font:value.font==='serif'?'serif':'app',designVersion:'personal-picks-v1'};}
 function preferences(value){var s=settings(value);if(!value||value.designVersion!=='personal-picks-v1')s.template='spotlight';return s;}
 function contrast(hex){var c=[1,3,5].map(function(i){var n=parseInt(hex.slice(i,i+2),16)/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);});return c[0]*.2126+c[1]*.7152+c[2]*.0722>.35?'#17202a':'#ffffff';}
 function palette(s,theme){theme=theme||{};return {background:s.followTheme?color(theme.background,'#f9f5f7'):s.background,bottom:s.followTheme?color(theme.bottom,theme.background||'#eee0e8'):s.bottom,accent:s.followTheme?color(theme.accent,'#a42e61'):s.accent,ink:s.followTheme?color(theme.ink,'#261d25'):s.ink};}
 function capacity(model,s){if(model.kind==='work'||model.kind==='review')return 1;return s.template==='journal'?(s.format==='square'?4:6):s.template==='gallery'?(s.format==='square'?6:10):10;}
 function pageCount(model,s){return Math.max(1,Math.ceil(model.items.length/capacity(model,s)));}
 function picksPlan(model,s,page,items,count){
  var W=sizes[s.format][0],H=sizes[s.format][1],compact=s.format==='square',heroH=compact?230:s.format==='story'?400:310;
  var hero={x:70,y:model.subtitle?166:130,w:940,h:heroH},rows=[],footerY=H-100;
  if(items[0]){
   var imageH=Math.min(320,heroH-28),imageW=Math.min(240,imageH*(model.kind==='list'?.67:.8));
   rows.push({item:items[0],role:'hero',image:{x:180,y:hero.y+(heroH-imageH)/2,w:imageW,h:imageH},caption:{x:470,y:hero.y+heroH*.42,w:490,h:heroH*.32}});
  }
  var rest=items.slice(1),columns=Math.min(3,Math.max(1,rest.length)),nrows=Math.max(1,Math.ceil(rest.length/columns)),gap=compact?18:26,top=hero.y+hero.h+(compact?28:32),cw=(940-(columns-1)*32)/columns,ch=(footerY-28-top-(nrows-1)*gap)/nrows;
  rest.forEach(function(item,i){
   var ratio=model.kind==='list'?1.42:1,h=Math.min(260,cw-40,ch-24),w=h/ratio,x=70+(i%columns)*(cw+32)+(cw-w)/2,y=top+Math.floor(i/columns)*(ch+gap);
   rows.push({item:item,role:'pick',image:{x:x,y:y,w:w,h:h},caption:{x:70+(i%columns)*(cw+32),y:y+h+8,w:cw,h:36}});
  });
  return {style:'personal-picks',width:W,height:H,items:rows,hero:hero,footerY:footerY,page:page,pages:count,single:false};
 }
 function plan(model,s,page){
  var size=sizes[s.format],W=size[0],H=size[1],count=pageCount(model,s);page=Math.max(0,Math.min(count-1,Number(page)||0));
  var take=capacity(model,s),items=model.items.slice(page*take,(page+1)*take),top=330,bottom=H-190,space=bottom-top,rows=[];
  var single=model.kind==='work'||model.kind==='review';
  function add(item,image,caption){rows.push({item:item,image:image,caption:caption});}
  if(single&&items[0]){
   if(s.template==='spotlight'){
    var h=Math.min(1100,space*(s.showText&&model.text.length ? .7 : .88)),w=Math.min(760,h*.67);
    add(items[0],{x:(W-w)/2,y:top,w:w,h:h},{x:90,y:top+h+28,w:900,h:Math.max(48,space-h-28)});
   }else if(s.template==='gallery'){
    var h=Math.min(space,570),w=Math.min(350,h*.67);
    add(items[0],{x:72,y:top,w:w,h:h},{x:460,y:top,w:548,h:space});
   }else add(items[0],{x:824,y:top,w:184,h:Math.min(276,space*.55)},{x:72,y:top+Math.min(330,space*.6),w:936,h:Math.max(80,space-Math.min(330,space*.6))});
  }else if(s.template==='journal'){
   var rowH=space/Math.max(items.length,1);
   items.forEach(function(item,i){var h=Math.min(156,rowH-24),w=h*.72;add(item,{x:142,y:top+i*rowH,w:w,h:h},{x:142+w+30,y:top+i*rowH+12,w:W-214-w-30,h:h-12});});
  }else if(s.template==='gallery'){
   var cols=items.length>6?5:Math.min(3,Math.max(1,items.length)),nrows=Math.ceil(items.length/cols),cw=(936-(cols-1)*26)/cols,ch=(space-(nrows-1)*28)/Math.max(nrows,1);
   items.forEach(function(item,i){var h=Math.min(ch-68,cw*(model.kind==='ranking'||model.kind==='top'?1.05:1.4)),w=Math.min(cw,h/(model.kind==='ranking'||model.kind==='top'?1.05:1.4)),x=72+i%cols*(cw+26)+(cw-w)/2,y=top+Math.floor(i/cols)*(ch+28);add(item,{x:x,y:y,w:w,h:h},{x:72+i%cols*(cw+26),y:y+h+14,w:cw,h:52});});
  }else return picksPlan(model,s,page,items,count);
  return {width:W,height:H,items:rows,footerY:H-150,page:page,pages:count,single:single};
 }
 async function loadPage(model,s,page,loader){
  var layout=plan(model,s,page),images=await Promise.all(layout.items.map(function(row){return loader(row.item.image,row.item);}));
  if(images.some(function(image){return !image;})){var error=new Error('Some selected images could not be loaded.');error.code='LOREFY_SHARE_MEDIA_UNAVAILABLE';throw error;}
  return {plan:layout,images:images};
 }
 function rect(ctx,r,radius){ctx.beginPath();ctx.roundRect(r.x,r.y,r.w,r.h,radius||0);}
 function alpha(hex,n){return hex+Math.round(n*255).toString(16).padStart(2,'0');}
 function text(ctx,value,r,size,ink,align,font,weight){
  var raw=clean(value,4000);if(!raw||r.h<=0||r.w<=0)return;
  ctx.fillStyle=ink;ctx.font=(weight||500)+' '+size+'px '+font;ctx.direction=/[\u0600-\u06ff]/.test(raw)?'rtl':'ltr';ctx.textAlign=align||'left';ctx.textBaseline='top';
  var lh=size*1.45,max=Math.max(1,Math.floor(r.h/lh)),lines=[],line='';
  for(const word of raw.split(/\s+/)){
   if(ctx.measureText(line+(line?' ':'')+word).width<=r.w){line+=(line?' ':'')+word;continue;}
   if(line){lines.push(line);line='';}
   for(const ch of Array.from(word)){if(ctx.measureText(line+ch).width>r.w){lines.push(line);line=ch;}else line+=ch;}
  }
  if(line)lines.push(line);
  if(lines.length>max){lines=lines.slice(0,max);var last=lines[max-1];while(last&&ctx.measureText(last+'…').width>r.w)last=last.slice(0,-1);lines[max-1]=last+'…';}
  lines.forEach(function(line,i){ctx.fillText(line,align==='center'?r.x+r.w/2:align==='right'?r.x+r.w:r.x,r.y+i*lh);});
 }
 function paintImage(ctx,image,r){ctx.save();rect(ctx,r,12);ctx.clip();var scale=Math.max(r.w/image.naturalWidth,r.h/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,r.x+(r.w-w)/2,r.y+(r.h-h)/2,w,h);ctx.restore();}
 function drawPicks(ctx,model,s,loaded,colors,en,font){
  var p=loaded.plan,ink=colors.ink,a=colors.accent,b=colors.background;
  text(ctx,'Lorefy',{x:70,y:52,w:170,h:52},34,ink,'left','Arial',700);
  text(ctx,model.title||(en?'My picks':'اختياراتي'),{x:280,y:50,w:730,h:60},38,ink,'right',font,700);
  if(model.subtitle)text(ctx,model.subtitle,{x:280,y:110,w:730,h:38},22,alpha(ink,.7),'right',font);
  if(p.items.length){ctx.fillStyle=alpha(a,.045);rect(ctx,p.hero,14);ctx.fill();}
  p.items.forEach(function(row,i){
   paintImage(ctx,loaded.images[i],row.image);
   var number=String(row.item.rank).padStart(2,'0');
   if(row.role==='hero'){
    text(ctx,number,{x:470,y:p.hero.y+p.hero.h*.23,w:490,h:65},p.hero.h<250?38:52,a,'left','Arial',700);
    text(ctx,row.item.name,row.caption,row.item.name.length>28?30:p.hero.h<250?34:44,ink,'left',font,700);
    text(ctx,row.item.rank===1?(en?'My first pick':'اختياري الأول'):(en?'Selected pick':'من اختياراتي'),{x:470,y:p.hero.y+p.hero.h*.76,w:490,h:48},p.hero.h<250?24:30,alpha(ink,.68),'left',font);
   }else{
    var label={x:row.image.x-14,y:row.image.y-2,w:60,h:40};ctx.fillStyle=b;rect(ctx,label,8);ctx.fill();
    text(ctx,number,{x:label.x,y:label.y+3,w:label.w,h:36},26,a,'center','Arial',700);
    text(ctx,row.item.name,row.caption,24,ink,'center',font,600);
   }
  });
  if(!p.items.length)text(ctx,en?'No selections yet':'لا توجد اختيارات بعد',{x:70,y:230,w:940,h:70},32,alpha(ink,.7),'center',font);
  ctx.fillStyle=alpha(ink,.14);ctx.fillRect(70,p.footerY,940,1);
  if(s.showProfile){
   text(ctx,model.profile.name||'Lorefy',{x:70,y:p.footerY+12,w:620,h:40},26,ink,'left',font,600);
   text(ctx,model.profile.handle?'@'+model.profile.handle:'',{x:70,y:p.footerY+50,w:620,h:35},21,alpha(ink,.68),'left','Arial');
  }
  var count=model.items.length+' '+(en?(model.kind==='list'?'works':'characters'):(model.kind==='list'?'أعمال':'شخصيات'));
  text(ctx,p.pages>1?(p.page+1)+' / '+p.pages+' · '+count:count,{x:700,y:p.footerY+29,w:310,h:44},21,alpha(ink,.7),'right',font);
 }
 function draw(ctx,model,s,loaded,colors,language){
  var p=loaded.plan,W=p.width,H=p.height,en=language==='en',font=s.font==='serif'?'Georgia, "Times New Roman", serif':'Cairo, Arial, sans-serif',a=colors.accent,b=colors.background,ink=colors.ink;
  ctx.letterSpacing='0px';ctx.fillStyle=b;if(s.gradient){var wash=ctx.createLinearGradient(0,0,W,H);wash.addColorStop(0,b);wash.addColorStop(1,colors.bottom);ctx.fillStyle=wash;}ctx.fillRect(0,0,W,H);
  if(p.style==='personal-picks')return drawPicks(ctx,model,s,loaded,colors,en,font);
  if(s.template==='spotlight'){ctx.fillStyle=alpha(a,.1);ctx.fillRect(0,0,W,8);}
  if(s.template==='gallery'){ctx.strokeStyle=alpha(ink,.18);ctx.lineWidth=2;ctx.strokeRect(40,40,W-80,H-80);}
  if(s.template==='journal'){ctx.fillStyle=a;ctx.fillRect(72,64,8,72);}
  text(ctx,'Lorefy',{x:s.template==='journal'?102:72,y:68,w:380,h:58},34,ink,'left','Arial',700);
  text(ctx,model.title||({work:en?'My reading':'قراءتي',review:en?'My review':'مراجعتي',ranking:en?'Character ranking':'ترتيب الشخصيات',top:en?'My top picks':'اختياراتي',list:en?'My list':'قائمتي'})[model.kind],{x:72,y:148,w:936,h:130},s.template==='journal'?50:54,ink,en?'left':'right',font,700);
  text(ctx,model.subtitle,{x:72,y:278,w:936,h:42},24,alpha(ink,.72),en?'left':'right',font);
  p.items.forEach(function(row,i){
   var r=row.image;ctx.save();ctx.shadowColor=alpha(ink,.18);ctx.shadowBlur=25;ctx.shadowOffsetY=12;ctx.fillStyle=alpha(ink,.06);rect(ctx,r,12);ctx.fill();ctx.restore();paintImage(ctx,loaded.images[i],r);
   if(!p.single){
    var rank=s.template==='journal'?{x:72,y:r.y+12,w:56,h:54}:{x:r.x+10,y:r.y+10,w:48,h:48};
    ctx.fillStyle=a;rect(ctx,rank,24);ctx.fill();text(ctx,String(row.item.rank),{x:rank.x,y:rank.y+5,w:rank.w,h:40},25,contrast(a),'center','Arial',700);
    text(ctx,row.item.name,row.caption,s.template==='journal'?34:24,ink,s.template==='journal'?'left':'center',font,600);
    if(s.template==='journal'){ctx.fillStyle=alpha(ink,.13);ctx.fillRect(72,row.caption.y+row.caption.h+4,936,1);}
   }else{
    var caption=row.caption,score=s.showRating&&model.rating!==null?(String(model.rating)+' / 5'):'';
    if(s.template==='journal'){
     text(ctx,score,{x:72,y:335,w:700,h:150},100,a,'left','Arial',600);
     text(ctx,s.showText?(model.text||model.title):model.title,caption,model.text?36:54,ink,en?'left':'right',font);
    }else{
     text(ctx,score,{x:caption.x,y:caption.y,w:caption.w,h:76},52,a,s.template==='spotlight'?'center':en?'left':'right','Arial',600);
     text(ctx,s.showText?model.text|| (s.template==='gallery'?model.title:''):'',{x:caption.x,y:caption.y+(score?84:8),w:caption.w,h:Math.max(0,caption.h-(score?84:8))},s.template==='spotlight'?30:model.text?34:56,ink,s.template==='spotlight'?'center':en?'left':'right',font);
    }
   }
  });
  ctx.fillStyle=alpha(ink,.15);ctx.fillRect(72,p.footerY,936,2);
  if(s.showProfile){if(loaded.avatar){ctx.save();ctx.beginPath();ctx.arc(113,p.footerY+64,40,0,Math.PI*2);ctx.clip();paintImage(ctx,loaded.avatar,{x:73,y:p.footerY+24,w:80,h:80});ctx.restore();}var start=loaded.avatar?180:72;text(ctx,model.profile.name,{x:start,y:p.footerY+22,w:660,h:48},28,ink,'left',font,600);text(ctx,model.profile.handle?'@'+model.profile.handle:'',{x:start,y:p.footerY+68,w:660,h:38},22,alpha(ink,.7),'left','Arial');}
  text(ctx,p.pages>1?(p.page+1)+' / '+p.pages:'LOREFY',{x:792,y:p.footerY+30,w:216,h:52},26,a,'right','Arial',700);
 }
 function node(tag,attrs,children){var e=root.document.createElement(tag);Object.keys(attrs||{}).forEach(function(key){if(key==='text')e.textContent=attrs[key];else if(key==='class')e.className=attrs[key];else e.setAttribute(key,attrs[key]);});(children||[]).forEach(function(c){e.appendChild(c);});return e;}
 function icon(name){var nodes=root.lucide&&root.lucide.icons[name]&&root.lucide.icons[name][2],svg=root.document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('aria-hidden','true');(nodes||[]).forEach(function(part){var child=root.document.createElementNS('http://www.w3.org/2000/svg',part[0]);Object.keys(part[1]).forEach(function(k){child.setAttribute(k,part[1][k]);});svg.appendChild(child);});return svg;}
 function theme(){
  var app=root.document.querySelector('.lf-app')||root.document.documentElement,style=root.getComputedStyle(app),c=root.document.createElement('canvas');c.width=c.height=1;var ctx=c.getContext('2d',{willReadFrequently:true});
  function read(name,fallback){ctx.clearRect(0,0,1,1);ctx.fillStyle=fallback;ctx.fillStyle=style.getPropertyValue(name).trim()||fallback;ctx.fillRect(0,0,1,1);var p=ctx.getImageData(0,0,1,1).data;return '#'+[p[0],p[1],p[2]].map(function(n){return n.toString(16).padStart(2,'0');}).join('');}
  return {background:read('--ui-bg','#fff7fa'),bottom:read('--ui-fill-soft','#f4dfe8'),accent:read('--ui-action','#a42e61'),ink:read('--ui-ink','#261d25')};
 }
 function scope(){var b=root.LorefyBackend,ls=root.localStorage;return JSON.stringify([ls.getItem('lorefy.activeUser.v1'),b&&b.user&&b.user.id,b&&b.mode,b&&b._communityEpoch]);}
 function currentProfile(){try{var p=JSON.parse(root.localStorage.getItem('lorefy.identity.v1')||'{}');return {name:p.name,handle:p.un,avatar:p.avatar};}catch(_){return {};}}
 function exportMount(doc,opener){
  // Keep a nested export in the active modal, not its inert background sibling.
  var dialog=opener&&opener.closest&&opener.closest('[role="dialog"]');
  return dialog&&dialog.isConnected&&!dialog.closest('[inert]')?dialog:doc.querySelector('.lf-app')||doc.getElementById('screen')||doc.body;
 }
 function open(input){
  if(!root.document)return;
  if(active)active.close();
  var model=normalize(input),en=root.document.documentElement.lang==='en',owner=scope(),backend=root.LorefyBackend,client=backend&&backend.client,prefKey='lorefy.share.preferences.v1:'+encodeURIComponent(root.localStorage.getItem('lorefy.activeUser.v1')||backend&&backend.user&&backend.user.id||'device'),s;
  try{s=preferences(JSON.parse(root.localStorage.getItem(prefKey)||'null'));}catch(_){s=settings();}
  var page=0,job=0,file=null,url='',timer=null,busy=false,closed=false,stopAuth=null,cache=new Map(),previous=root.document.activeElement;
  var host=exportMount(root.document,previous),overlay=node('div',{class:'lf-export-overlay'}),dialog=node('section',{class:'lf-export-sheet',role:'dialog','aria-modal':'true','aria-label':en?'Share image':'مشاركة كصورة',dir:en?'ltr':'rtl'});
  var close=node('button',{type:'button','aria-label':en?'Close':'إغلاق',title:en?'Close':'إغلاق'},[icon('X')]);
  var header=node('header',{class:'lf-export-header'},[node('h2',{text:en?'Share image':'مشاركة كصورة'}),close]);
  var body=node('div',{class:'lf-export-body'}),preview=node('img',{class:'lf-export-preview',alt:en?'Export preview':'معاينة الصورة الناتجة'}),status=node('p',{class:'lf-export-status',role:'status'}),choices=node('div',{class:'lf-export-templates',role:'group','aria-label':en?'Design':'التصميم'});
  var thumbs=[];templates.forEach(function(t){var image=node('img',{alt:''}),button=node('button',{type:'button','data-export-template':t.id,'aria-pressed':String(s.template===t.id)},[image,node('span',{text:en?t.en:t.ar})]);button.addEventListener('click',function(){s.template=t.id;page=0;changed();});thumbs.push({id:t.id,image:image,button:button});choices.appendChild(button);});
  var select=node('select',{'aria-label':en?'Image size':'مقاس الصورة'});[['story',en?'Story · 9:16':'ستوري · 9:16'],['portrait',en?'Post · 4:5':'منشور · 4:5'],['square',en?'Square · 1:1':'مربع · 1:1']].forEach(function(v){select.appendChild(node('option',{value:v[0],text:v[1]}));});select.value=s.format;select.addEventListener('change',function(){s.format=select.value;page=0;changed();});
  var pageLabel=node('span',{}),prev=node('button',{type:'button','aria-label':en?'Previous page':'الصفحة السابقة'},[icon(en?'ChevronLeft':'ChevronRight')]),next=node('button',{type:'button','aria-label':en?'Next page':'الصفحة التالية'},[icon(en?'ChevronRight':'ChevronLeft')]),pages=node('div',{class:'lf-export-pages'},[prev,pageLabel,next]);prev.addEventListener('click',function(){page--;changed();});next.addEventListener('click',function(){page++;changed();});
  var controls=node('div',{class:'lf-export-controls'}),title=node('input',{type:'text',maxlength:'300','aria-label':en?'Image title':'عنوان الصورة'});title.value=model.title;title.addEventListener('input',function(){model.title=title.value;changed();});
  function toggle(label,value,update){var box=node('input',{type:'checkbox'});box.checked=value;box.addEventListener('change',function(){update(box.checked);changed();});return node('label',{class:'lf-export-toggle'},[node('span',{text:label}),box]);}
  var follow=toggle(en?'Use app colors':'ألوان التطبيق',s.followTheme,function(v){s.followTheme=v;});
  var swatches=node('div',{class:'lf-export-colors'}),colors=theme(),colorFields=[];
  [['background',en?'Background':'الخلفية'],['bottom',en?'Gradient':'التدرج'],['accent',en?'Accent':'اللون البارز'],['ink',en?'Text':'النص']].forEach(function(pair){var colorInput=node('input',{type:'color','aria-label':pair[1]});colorInput.value=s.followTheme?colors[pair[0]]:s[pair[0]];colorFields.push({key:pair[0],input:colorInput});colorInput.addEventListener('input',function(){if(s.followTheme){s.background=colors.background;s.bottom=colors.bottom;s.accent=colors.accent;s.ink=colors.ink;}s.followTheme=false;s[pair[0]]=colorInput.value;follow.querySelector('input').checked=false;changed();});swatches.appendChild(node('label',{},[node('span',{text:pair[1]}),colorInput]));});
  var font=node('select',{'aria-label':en?'Font':'الخط'});[['app',en?'App font':'خط التطبيق'],['serif',en?'Editorial':'تحريري']].forEach(function(p){font.appendChild(node('option',{value:p[0],text:p[1]}));});font.value=s.font;font.addEventListener('change',function(){s.font=font.value;changed();});
  controls.appendChild(node('div',{class:'lf-export-row'},[select,font]));controls.appendChild(title);controls.appendChild(follow);controls.appendChild(swatches);
  controls.appendChild(toggle(en?'Gradient background':'خلفية متدرجة',s.gradient,function(v){s.gradient=v;}));
  controls.appendChild(toggle(en?'Reader identity':'هوية القارئ',s.showProfile,function(v){s.showProfile=v;}));
  if(model.kind==='review'||model.kind==='work'){controls.appendChild(toggle(en?'Rating':'التقييم',s.showRating,function(v){s.showRating=v;}));controls.appendChild(toggle(en?'Review text':'نص المراجعة',s.showText,function(v){s.showText=v;}));var caption=node('textarea',{rows:'3',maxlength:'4000','aria-label':en?'Image text':'نص الصورة'});caption.value=model.text;caption.addEventListener('input',function(){model.text=caption.value;changed();});controls.appendChild(caption);}
  var retry=node('button',{type:'button',class:'lf-export-retry',text:en?'Retry':'إعادة المحاولة'});retry.hidden=true;retry.addEventListener('click',function(){cache.clear();changed();});
  body.appendChild(choices);body.appendChild(preview);body.appendChild(pages);body.appendChild(status);body.appendChild(retry);body.appendChild(controls);
  var save=node('button',{type:'button',class:'lf-export-save'},[icon('Download'),node('span',{text:en?'Save image':'حفظ الصورة'})]),share=node('button',{type:'button',class:'lf-export-share'},[icon('Share2'),node('span',{text:en?'Share':'مشاركة'})]),footer=node('footer',{class:'lf-export-footer'},[save,share]);
  dialog.appendChild(header);dialog.appendChild(body);dialog.appendChild(footer);overlay.appendChild(dialog);
  var inert=Array.from(host.children).map(function(n){var value=n.inert;n.inert=true;return {node:n,value:value};});host.appendChild(overlay);
  function current(){try{return !closed&&overlay.isConnected&&scope()===owner&&root.LorefyBackend===backend&&(!backend||backend.client===client);}catch(_){return false;}}
  function closeEditor(){if(closed)return;closed=true;job++;clearTimeout(timer);if(stopAuth)stopAuth();if(url)root.URL.revokeObjectURL(url);overlay.remove();inert.forEach(function(v){v.node.inert=v.value;});dialog.removeEventListener('keydown',keyboard);cache.clear();if(previous&&previous.isConnected)previous.focus();if(active&&active.close===closeEditor)active=null;}
  function keyboard(e){if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!busy)closeEditor();}if(e.key==='Tab'){e.stopPropagation();var list=Array.from(dialog.querySelectorAll('button,input,textarea,select')).filter(function(n){return !n.disabled&&!n.hidden&&n.getClientRects().length;});var first=list[0],last=list[list.length-1];if(e.shiftKey&&root.document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&root.document.activeElement===last){e.preventDefault();first.focus();}}}
  close.addEventListener('click',function(){if(!busy)closeEditor();});overlay.addEventListener('click',function(e){if(e.target===overlay&&!busy)closeEditor();});dialog.addEventListener('keydown',keyboard);active={close:closeEditor};close.focus();
  if(backend&&backend.onAuth)stopAuth=backend.onAuth(function(){if(!current())closeEditor();});
  function lock(){save.disabled=share.disabled=busy||!file;close.disabled=busy;prev.disabled=busy||page===0;next.disabled=busy||page>=pageCount(model,s)-1;Array.from(controls.querySelectorAll('input,textarea,select')).concat(thumbs.map(function(t){return t.button;})).forEach(function(n){n.disabled=busy;});}
  async function image(src,item){if(!current())return null;if(!src&&input.resolveImage)src=await input.resolveImage(item);if(!current()||!src)return null;if(!cache.has(src))cache.set(src,root.LorefyShareStudio.loadImage(src).then(function(value){if(!value)cache.delete(src);return value;}));return cache.get(src);}
  async function render(request){
   if(!current()){closeEditor();return;}
   try{
    await root.document.fonts.ready;
    var loaded=await loadPage(model,s,page,image),canvas=root.document.createElement('canvas'),p=loaded.plan,c=palette(s,theme());if(s.showProfile&&model.profile.avatar)loaded.avatar=await image(model.profile.avatar);canvas.width=p.width;canvas.height=p.height;
    draw(canvas.getContext('2d'),model,s,loaded,c,en?'en':'ar');
    var blob=await new Promise(function(resolve,reject){canvas.toBlob(function(b){if(b)resolve(b);else reject(Error('Empty image'));},'image/png');});
    if(!current()||request!==job)return;
    file=new root.File([blob],'lorefy-'+model.kind+'-'+s.template+'-'+(page+1)+'.png',{type:'image/png'});if(url)root.URL.revokeObjectURL(url);url=root.URL.createObjectURL(blob);preview.src=url;preview.style.aspectRatio=p.width+'/'+p.height;
    status.textContent=p.width+' × '+p.height+' · PNG';retry.hidden=true;
    for(const t of thumbs){var ts=settings(Object.assign({},s,{template:t.id})),small=await loadPage(model,ts,Math.min(page,pageCount(model,ts)-1),image);if(!current()||request!==job)return;small.avatar=loaded.avatar;var cv=root.document.createElement('canvas');cv.width=162;cv.height=Math.round(small.plan.height*.15);var context=cv.getContext('2d');context.scale(.15,.15);draw(context,model,ts,small,c,en?'en':'ar');t.image.src=cv.toDataURL('image/png');}
   }catch(error){if(current()&&request===job){file=null;status.textContent=en?'Some images could not be prepared. Retry.':'تعذر تجهيز بعض الصور. أعد المحاولة.';retry.hidden=false;}}
   finally{if(current()&&request===job)lock();}
  }
  function changed(){
   if(busy)return;if(!current()){closeEditor();return;}s=settings(s);file=null;job++;clearTimeout(timer);lock();status.textContent=en?'Preparing image…':'جارٍ تجهيز الصورة…';retry.hidden=true;
   thumbs.forEach(function(t){t.button.setAttribute('aria-pressed',String(t.id===s.template));});var count=pageCount(model,s);page=Math.max(0,Math.min(page,count-1));pages.hidden=count<=1;pageLabel.textContent=(page+1)+' / '+count;prev.disabled=page===0;next.disabled=page===count-1;
   colors=theme();var paletteNow=palette(s,colors);colorFields.forEach(function(f){f.input.value=paletteNow[f.key];});try{root.localStorage.setItem(prefKey,JSON.stringify(s));}catch(_){}
   var request=job;timer=setTimeout(function(){render(request);},100);
  }
  async function deliver(mode){if(!current()){closeEditor();return;}if(!file||busy)return;var exported=file;busy=true;lock();try{if(mode==='save')await root.LorefyShareStudio.saveFile(exported);else await root.LorefyShareStudio.nativeFileShare(exported,model.title,'#Lorefy');if(current())status.textContent=en?'Image ready.':'الصورة جاهزة.';}catch(e){if(current())status.textContent=e&&e.name==='AbortError'?(en?'Sharing cancelled.':'أُلغيت المشاركة.'):(en?'Could not share. Retry.':'تعذرت المشاركة. أعد المحاولة.');}finally{busy=false;if(current())lock();else closeEditor();}}
  save.addEventListener('click',function(){deliver('save');});share.addEventListener('click',function(){deliver('share');});changed();return active;
 }
 return {templates:templates,normalize:normalize,settings:settings,palette:palette,plan:plan,pageCount:pageCount,loadPage:loadPage,draw:draw,open:open,currentProfile:currentProfile};
});
