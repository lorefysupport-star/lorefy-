(function(root,factory){
  const api=factory(root);
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.LorefyFrameMotion=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const motifs=new Set(['spark','leaf','heart','ghost','flower','bubble','rune']);
  const clamp=(value,low,high,fallback)=>Number.isFinite(Number(value))?Math.max(low,Math.min(high,Number(value))):fallback;
  function profileHeader(width,ratio=.43) {
    ratio=clamp(ratio,.08,1,.43);
    const stacked=width<380,line=stacked?116:64,maxHeight=stacked?52:64;
    const w=Math.min(184,stacked?width-48:Math.max(36,width-248),maxHeight/ratio),h=w*ratio;
    return {x:(width-w)/2,y:stacked?64+(52-h)/2:(64-h)/2,width:w,height:h,line};
  }
  function headerConnectors(width,cap,joins,waveAt=()=>0) {
    return [false,true].map((right,index)=>{
      const j=joins[index],sign=right?-1:1,radius=16,base=cap.line+8;
      const anchor=cap.anchors?.[index],end=anchor?anchor.x:right?cap.x+cap.width*.94:cap.x+cap.width*.06,endY=anchor?anchor.y:cap.y+cap.height*.88,start=j.x+sign*radius,points=[];
      const reach=Math.max(10,(j.y-base)*.7),c1={x:j.x+j.dx*reach,y:j.y+j.dy*reach},c2={x:start-sign*radius*.5523,y:base};
      for(let i=0;i<=32;i++){
        const u=i/32,v=1-u,s=u*u*(3-2*u);
        points.push({edge:'top',x:v*v*v*j.x+3*v*v*u*c1.x+3*v*u*u*c2.x+u*u*u*start,y:v*v*v*j.y+3*v*v*u*c1.y+3*v*u*u*c2.y+u*u*u*base,half:j.half+(6.5-j.half)*s});
      }
      for(let i=1;i<=48;i++){
        const u=i/48,x=start+(end-start)*u;
        const lift=width<380?u:clamp((right?width-124-x:x-124)/Math.max(1,right?width-124-end:end-124),0,1,0),s=lift*lift*(3-2*lift);
        points.push({edge:'top',x,y:base+(endY-base)*s+1.8*Math.sin(u*Math.PI)**2*waveAt(u,index),half:6.5});
      }
      points.texture=j.texture;return points;
    });
  }
  function measurePageArt(image,wideCrest=false) {
    const canvas=root.document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,image.width,image.height).data;
    let left=image.width,top=image.height,right=-1,bottom=-1;
    for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)if(pixels[(y*image.width+x)*4+3]>8){
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<left)return {x:0,y:0,w:image.width,h:image.height};
    // Retain a small source-space margin for the ornament's animated sway.
    left=Math.max(0,left-12);top=Math.max(0,top-12);
    right=Math.min(image.width-1,right+12);bottom=Math.min(image.height-1,bottom+12);
    const w=right-left+1,h=bottom-top+1,centre=(left+right)/2;
    let leftEnd=left,rightStart=right;
    for(let y=Math.round(top+h*.30);y<top+h*.72;y++)for(let x=left;x<=right;x++)if(pixels[(y*image.width+x)*4+3]>24){
      if(x<centre)leftEnd=Math.max(leftEnd,x);else rightStart=Math.min(rightStart,x);
    }
    let ropeY=Math.round(top+h*.17),best=0;
    for(let y=Math.round(top+h*.10);y<top+h*.23;y++){
      let score=0;
      for(let x=Math.round(left+w*.19);x<left+w*.24;x++)score+=pixels[(y*image.width+x)*4+3];
      for(let x=Math.round(left+w*.76);x<left+w*.81;x++)score+=pixels[(y*image.width+x)*4+3];
      if(score>best){best=score;ropeY=y;}
    }
    return {x:left,y:top,w,h,crest:wideCrest?.90:.52,join:(ropeY-top)/(h*.24),
      left:Math.min(w*.28,Math.max(1,leftEnd-left+5)),right:Math.min(w*.28,Math.max(1,right-rightStart+5))};
  }
  function pageLayout(bounds,width,height) {
    const sourceTop=bounds.h*.24,sourceBottom=bounds.h*.18;
    const crest=clamp(bounds.crest,.52,.9,.52),stacked=width>=280&&width<380;
    const centreRoom=stacked?Math.min(144,width-48):Math.max(36,width-252);
    const topScale=Math.min((width-4)/bounds.w,(stacked?72:64)/sourceTop,height*.22/sourceTop,centreRoom/(bounds.w*crest));
    const bottomScale=Math.min((width-4)/bounds.w,24/sourceBottom,height*.10/sourceBottom);
    // Small phones give the crest its own row below the fixed-size controls.
    const top=sourceTop*topScale,join=clamp(bounds.join,.35,.92,.72);
    const topY=stacked?64:64-top*join,line=topY+top*join;
    return {top:sourceTop*topScale,bottom:sourceBottom*bottomScale,
      topWidth:width-4,bottomWidth:width-4,
      rail:Math.min(18,Math.max(8,width*.035)),sourceTop,sourceBottom,
      line,controls:16,topY};
  }
  function paintPageArt(ctx,image,bounds,seconds,width,height,color='#8b9999') {
    if(width<=4||height<=4)return;
    const {x,y,w,h}=bounds,sourceLeft=bounds.left||w*.24,sourceRight=bounds.right||w*.24;
    const {top,bottom,rail,sourceTop,sourceBottom,topY}=pageLayout(bounds,width,height);
    const middle=height-4-topY-top-bottom;
    // Preserve the crest and corners; stretch only their ribbon connectors.
    function band(sourceY,sourceHeight,destY,destHeight){
      const scale=destHeight/sourceHeight;
      const crest=clamp(bounds.crest,.52,.9,.52),centreLeft=w*(1-crest)/2,centreWidth=w*crest;
      const edgeLimit=centreLeft*.8;
      const edgeLeft=Math.min(edgeLimit,Math.min(w*.16,Math.max(w*.08,sourceLeft))),edgeRight=Math.min(edgeLimit,Math.min(w*.16,Math.max(w*.08,sourceRight)));
      const destLeft=edgeLeft*scale,destRight=edgeRight*scale,destCentre=centreWidth*scale;
      const centreX=(width-destCentre)/2;
      const sources=[0,edgeLeft,centreLeft,centreLeft+centreWidth,w-edgeRight,w];
      const targets=[2,2+destLeft,centreX,centreX+destCentre,width-2-destRight,width-2];
      for(let i=0;i<5;i++){
        if(crest>.8&&(i===1||i===3)){
          const ropeHeight=h*.012,ropeY=y+sourceTop*clamp(bounds.join,.35,.92,.72)-ropeHeight/2;
          ctx.drawImage(image,x+w*.19,ropeY,w*.05,ropeHeight,targets[i],destY+destHeight*clamp(bounds.join,.35,.92,.72)-2,targets[i+1]-targets[i],4);
        }else ctx.drawImage(image,x+sources[i],sourceY,sources[i+1]-sources[i],sourceHeight,targets[i],destY,targets[i+1]-targets[i],destHeight);
      }
    }
    // Material renderers replace the entire cropped top with their animated illustrated ribbon.
    if(!bounds.materialConnectors)band(y,sourceTop,2+topY,top);
    // Stretch only the side ornaments vertically, never the transparent centre.
    ctx.drawImage(image,x,y+sourceTop,sourceLeft,h-sourceTop-sourceBottom,2,2+topY+top,rail,middle);
    ctx.drawImage(image,x+w-sourceRight,y+sourceTop,sourceRight,h-sourceTop-sourceBottom,width-2-rail,2+topY+top,rail,middle);
    // Keep real corner artwork; no stretched raster crosses the home indicator.
    const edge=Math.min(w*.16,sourceBottom*rail/bottom),scale=bottom/sourceBottom,cornerWidth=edge*scale;
    ctx.drawImage(image,x,y+h-sourceBottom,edge,sourceBottom,2,height-2-bottom,cornerWidth,bottom);
    ctx.drawImage(image,x+w-edge,y+h-sourceBottom,edge,sourceBottom,width-2-cornerWidth,height-2-bottom,cornerWidth,bottom);
    // Rotate intact rail artwork into the bottom edge, preserving its proportions.
    const thickness=Math.min(10,rail),sourceHeight=h-sourceTop-sourceBottom;
    const tileWidth=sourceHeight*thickness/sourceLeft,start=2+cornerWidth,end=width-2-cornerWidth;
    ctx.save();ctx.beginPath();ctx.rect(start,height-2-thickness,end-start,thickness);ctx.clip();
    for(let dx=start;dx<end;dx+=Math.max(1,tileWidth-1)){
      ctx.save();ctx.translate(dx,height-2);ctx.rotate(-Math.PI/2);
      ctx.drawImage(image,x,y+sourceTop,sourceLeft,sourceHeight,0,0,thickness,tileWidth);ctx.restore();
    }
    ctx.restore();
  }
  function clipPageEffects(ctx,width,height){
    ctx.beginPath();ctx.rect(0,64,width,Math.max(0,height-104));
    ctx.rect(124,0,Math.max(0,width-248),64);
    ctx.rect(0,0,20,height);ctx.rect(width-20,0,20,height);ctx.clip();
  }
  function normalize(value={}) {
    const g=value.portrait;
    const portrait=g && ['cx','cy','size'].every(k=>Number.isFinite(g[k])) && g.size>=.5 && g.size<=.85
      && g.cx-g.size/2>=.02 && g.cx+g.size/2<=.98 && g.cy-g.size/2>=.02 && g.cy+g.size/2<=.98
      ? Object.freeze({cx:g.cx,cy:g.cy,size:g.size}):undefined;
    return Object.freeze({motif:motifs.has(value.motif)?value.motif:'spark',
      color:/^#[\da-f]{6}$/i.test(value.color)?value.color:'#9fe4ed',
      second:/^#[\da-f]{6}$/i.test(value.second)?value.second:'#e5c889',
      count:Math.round(clamp(value.count,4,12,8)),speed:clamp(value.speed,.2,2,.6),portrait});
  }
  function sample(value,kind,width,height,seconds) {
    const d=normalize(value),time=Number.isFinite(seconds)?seconds:0;
    const size=kind==='avatar'?Math.min(width,height)*.034:Math.min(8,Math.min(width,height)*.03);
    return Array.from({length:d.count},(_,i)=>{
      const phase=((i/d.count + time*d.speed*.035)%1+1)%1;
      let x,y,angle;
      if(kind==='avatar') {
        angle=phase*Math.PI*2;const radius=Math.min(width,height)*.44;
        x=width/2+Math.cos(angle)*radius;y=height/2+Math.sin(angle)*radius;
      } else {
        const inset=Math.max(size+2,8),w=Math.max(0,width-2*inset),h=Math.max(0,height-2*inset),length=2*(w+h);
        const p=phase*length;
        if(p<w){x=inset+p;y=inset;angle=0;}
        else if(p<w+h){x=width-inset;y=inset+p-w;angle=Math.PI/2;}
        else if(p<2*w+h){x=width-inset-(p-w-h);y=height-inset;angle=Math.PI;}
        else{x=inset;y=height-inset-(p-2*w-h);angle=-Math.PI/2;}
      }
      return {x,y,size,angle,alpha:.6+.35*Math.sin(time*1.5+i)**2,color:i%2?d.second:d.color};
    });
  }
  function shape(ctx,motif) {
    ctx.beginPath();
    if(motif==='heart') {
      ctx.moveTo(0,1);ctx.bezierCurveTo(-2,-.3,-1,-1.7,0,-.5);ctx.bezierCurveTo(1,-1.7,2,-.3,0,1);
    } else if(motif==='leaf') {
      ctx.moveTo(-1,0);ctx.quadraticCurveTo(0,-1.8,1,0);ctx.quadraticCurveTo(0,1.3,-1,0);
    } else if(motif==='ghost') {
      ctx.moveTo(-.8,1);ctx.lineTo(-.8,0);ctx.arc(0,0,.8,Math.PI,0);ctx.lineTo(.8,1);
      ctx.lineTo(.4,.65);ctx.lineTo(0,1);ctx.lineTo(-.4,.65);ctx.closePath();
    } else if(motif==='bubble') {ctx.arc(0,0,.85,0,Math.PI*2);}
    else if(motif==='flower') {
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.moveTo(0,0);ctx.arc(Math.cos(a)*.55,Math.sin(a)*.55,.45,0,Math.PI*2);}
    } else if(motif==='rune') {ctx.moveTo(0,-1);ctx.lineTo(.8,0);ctx.lineTo(0,1);ctx.lineTo(-.8,0);ctx.closePath();}
    else {ctx.moveTo(0,-1);ctx.lineTo(.22,-.22);ctx.lineTo(1,0);ctx.lineTo(.22,.22);ctx.lineTo(0,1);ctx.lineTo(-.22,.22);ctx.lineTo(-1,0);ctx.lineTo(-.22,-.22);ctx.closePath();}
    ctx.fill();
    if(motif==='ghost'){ctx.fillStyle='#25282c';ctx.beginPath();ctx.arc(-.25,-.05,.11,0,Math.PI*2);ctx.arc(.25,-.05,.11,0,Math.PI*2);ctx.fill();}
  }
  function paint(ctx,width,height,seconds,value,kind) {
    const d=normalize(value);ctx.clearRect(0,0,width,height);
    // Imported art may have an off-centre aperture; never paint over its portrait.
    const clipped=kind==='avatar' && d.portrait;
    if(clipped){ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);
      ctx.moveTo(width*d.portrait.cx+Math.min(width,height)*d.portrait.size/2,height*d.portrait.cy);
      ctx.arc(width*d.portrait.cx,height*d.portrait.cy,Math.min(width,height)*d.portrait.size/2,0,Math.PI*2);
      ctx.clip('evenodd');}
    if(kind==='page') {
      ctx.save();ctx.strokeStyle=d.color;ctx.lineWidth=1.8;ctx.globalAlpha=.55+.15*Math.sin(seconds*1.8);
      ctx.shadowColor=d.color;ctx.shadowBlur=8;ctx.beginPath();ctx.roundRect(3,3,width-6,height-6,18);ctx.stroke();ctx.restore();
    }
    for(const p of sample(d,kind,width,height,seconds)) {
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+seconds*.3);ctx.scale(p.size,p.size);
      ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=kind==='page'?0:2;
      shape(ctx,d.motif);ctx.restore();
    }
    if(clipped)ctx.restore();
  }
  function createScheduler(env) {
    const entries=new Set();let frame=null,last=-Infinity;
    const active=()=>!env.document.hidden && [...entries].some(e=>e.visible);
    function refresh(){if(active()){if(frame===null)frame=env.requestAnimationFrame(tick);}else if(frame!==null){env.cancelAnimationFrame(frame);frame=null;}}
    function tick(time){frame=null;if(!active())return;if(time-last>=1000/30){last=time;for(const entry of entries)if(entry.visible)entry.draw(time/1000);}refresh();}
    return {get size(){return entries.size;},refresh,register(draw){const entry={draw,visible:false};entries.add(entry);
      return {setVisible(value){entry.visible=!!value;refresh();},dispose(){entries.delete(entry);refresh();}};}};
  }
  let scheduler;const mounted=new Map();
  function mount(element,value,kind='avatar') {
    if(!element || !root.document)return ()=>{};
    const descriptor=normalize(value),original=value.original && /^[a-z-]+$/.test(value.original.id) && ['illustrated','autumn','original','atelier'].concat('elven','restored').includes(value.original.renderer)?value.original:null;
    const signature=JSON.stringify([descriptor,kind,original]);
    const old=mounted.get(element);if(old && old.signature===signature)return old.dispose;
    if(old)old.dispose();
    if(!scheduler){scheduler=createScheduler(root);root.document.addEventListener('visibilitychange',scheduler.refresh);}
    const canvas=root.document.createElement('canvas');canvas.className='lf-frame-motion';canvas.setAttribute('aria-hidden','true');
    const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
    const layoutPage=kind==='page'&&element.closest('.lf-profile-page');
    element.appendChild(canvas);let width=0,height=0,frames=0,paddingTop=0,paddingBottom=0;
    const ratio=Math.min(2,root.devicePixelRatio||1);
    function resize(){width=element.offsetWidth;height=element.offsetHeight;if(!width||!height)return;
      const style=root.getComputedStyle(element);
      paddingTop=kind==='page'?parseFloat(style.paddingTop)||0:0;
      paddingBottom=kind==='page'?parseFloat(style.paddingBottom)||0:0;
      canvas.style.left=-parseFloat(style.borderLeftWidth||0)+'px';canvas.style.top=-parseFloat(style.borderTopWidth||0)+'px';
      canvas.style.width=width+'px';canvas.style.height=height+'px';
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
      const page=kind==='page'&&original&&element.closest('.lf-profile-page');
      if(page&&renderer&&ready&&renderer.layout){
        const layout=renderer.layout(original.id,width,height-paddingTop-paddingBottom),rect=page.getBoundingClientRect();
        page.style.setProperty('--profile-frame-top',layout.top+'px');
        page.style.setProperty('--profile-frame-bottom',layout.bottom+'px');
        page.style.setProperty('--profile-frame-banner-top',(paddingTop+layout.line+2)+'px');
        page.style.setProperty('--profile-frame-controls-top',(paddingTop+layout.controls)+'px');
        page.style.setProperty('--profile-controls-left',Math.round(rect.left+26)+'px');
        page.style.setProperty('--profile-controls-right',Math.round(root.innerWidth-rect.right+26)+'px');
      }
    }
    let io,ro,disposed=false;
    const renderer=original && root.LorefyOriginalRenderers && root.LorefyOriginalRenderers[original.renderer];
    let ready=false,loading=false;
    const lazy=!!(original&&original.renderer==='restored'&&root.IntersectionObserver);
    function loadRenderer(){
      if(!renderer||ready||loading||disposed)return;loading=true;
      renderer.load(original.id).then(()=>{if(!disposed){ready=true;element.classList.add('has-original-motion');resize();draw(0);}}).catch(()=>{}).finally(()=>{loading=false;});
    }
    function draw(time){if(!width||!height)return;if(renderer){if(!ready)return;ctx.clearRect(0,0,width,height);ctx.save();ctx.translate(0,paddingTop);renderer.paint(ctx,original.id,kind,time,width,height-paddingTop-paddingBottom);ctx.restore();}else paint(ctx,width,height,time,descriptor,kind);canvas.dataset.motionFrame=String(++frames);}
    const reduced=()=>root.document.documentElement.getAttribute('data-lorefy-motion')==='reduced'||root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const handle=scheduler.register(time=>{if(!element.isConnected){dispose();return;}draw(original&&(original.renderer==='atelier'||original.renderer==='elven'||original.renderer==='restored')?time:reduced()?0:time);});
    function dispose(){
      if(disposed)return;disposed=true;handle.dispose();if(io)io.disconnect();if(ro)ro.disconnect();
      const page=layoutPage;
      if(page)['--profile-frame-top','--profile-frame-bottom','--profile-frame-banner-top','--profile-frame-controls-top','--profile-controls-left','--profile-controls-right'].forEach(key=>page.style.removeProperty(key));
      canvas.remove();element.classList.remove('has-original-motion');mounted.delete(element);
    }
    resize();if(renderer){if(!lazy)loadRenderer();}else draw(0);
    if(root.IntersectionObserver){io=new root.IntersectionObserver(entries=>{const visible=entries.some(e=>e.isIntersecting);if(visible&&lazy)loadRenderer();handle.setVisible(visible);},{threshold:0});io.observe(element);}else handle.setVisible(true);
    if(root.ResizeObserver){ro=new root.ResizeObserver(resize);ro.observe(element);}
    mounted.set(element,{signature,dispose});return dispose;
  }
  function sweep(){for(const [element,item]of mounted)if(!element.isConnected)item.dispose();}
  return Object.freeze({normalize,sample,paint,profileHeader,headerConnectors,measurePageArt,pageLayout,paintPageArt,clipPageEffects,createScheduler,mount,sweep});
});
