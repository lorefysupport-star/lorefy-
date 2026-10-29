/* Original elf artwork with cached, independently pivoted parts. Shared scheduler only. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root.document){root.LorefyOriginalRenderers=root.LorefyOriginalRenderers||{};root.LorefyOriginalRenderers.elven=api;}
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const ids=Object.freeze(['emerald-whisper','duskborn','opal-silk','living-grove','elven-ranger','autumn-court']);
  const kinds=new Set(['ear','jewel','silk','leaf','arrow','feather','wing']);
  const TAU=Math.PI*2,entries=new Map(),pending=new Map();
  const bitmap=root.LorefyBitmapRig||(typeof require==='function'?require('./lorefy-bitmap-rig.js'):null);
  const frame=root.LorefyFrameMotion||(typeof require==='function'?require('./lorefy-frame-motion.js'):null);
  function index(id){const i=ids.indexOf(id);if(i<0)throw Error('Unknown elven material');return i;}
  function time(seconds){return (((Number.isFinite(seconds)?seconds:0)%12)+12)%12;}
  function pulse(t,start,duration){const q=(t-start)/duration;return q>0&&q<1?Math.sin(Math.PI*q)**2*Math.sin(TAU*q):0;}
  function sample(id,seconds,layers){
    const n=index(id),t=time(seconds),phase=t/12*TAU;
    return layers.map((layer,i)=>{
      let rotation=0,dx=0,dy=0,scaleX=1,scaleY=1;
      const p=phase*2+i*.83+n*.31;
      if(layer.kind==='ear'){
        const side=layers.slice(0,i).filter(l=>l.kind==='ear').length;
        const delay=n*.13+side*.11,strength=(side?-.062:.069)*(1-n*.045);
        rotation=strength*(pulse(t,.8+delay,.72)+.7*pulse(t,4.7+delay,.58)+.6*pulse(t,9+delay,.78));
      }else if(layer.kind==='jewel')rotation=.055*Math.sin(p-.25);
      else if(layer.kind==='silk'){rotation=.045*Math.sin(p);scaleX=1+.025*Math.sin(p-.4);scaleY=.98+.02*Math.cos(p);}
      else if(layer.kind==='leaf')rotation=.055*Math.sin(p)+.012*Math.sin(phase*5+i);
      else if(layer.kind==='arrow')rotation=.028*(pulse(t,1.2+(i%2)*.09,1.1)+.7*pulse(t,6.4+(i%2)*.09,1.1))*(i%2?1:-1);
      else if(layer.kind==='feather'){rotation=.06*Math.sin(p);scaleX=.96+.04*Math.cos(phase*4+i);}
      else if(layer.kind==='wing'){scaleX=.35+.65*(.5+.5*Math.sin(phase*6));rotation=(layer.side||1)*.09*Math.sin(phase*6-.2);}
      return {rotation:rotation||0,dx,dy,scaleX,scaleY};
    });
  }
  function pagePose(id,seconds,w,h,line){
    const n=index(id),p=time(seconds)/12*TAU,available=Math.max(0,h-line-112),out=[];
    for(let side=0;side<2;side++)for(let i=0;i<2;i++){
      const a=p*(n===4?3:2)+i*1.7+side+n*.3;
      out.push({edge:side?'right':'left',x:(side?w-10:10)+Math.sin(a)*1.1,y:line+70+available*(.22+i*.46)+2*Math.sin(a-.3),size:12,rotation:.12*Math.sin(a),scaleX:n===5?.55+.45*(.5+.5*Math.sin(p*6)):1});
    }
    for(let i=0;i<2;i++){
      out.push({edge:'top',x:w*(.4+i*.2)+Math.sin(p+n+i)*1.5,y:line+22+Math.sin(p*2+i+n),size:14,rotation:.12*Math.sin(p*2+i+n),scaleX:1});
      out.push({edge:'bottom',x:w*(.17+i*.66)+Math.sin(p*2+n+i),y:h-6,size:8,rotation:.1*Math.sin(p*2+i),scaleX:1});
    }
    return out;
  }
  function canvas(w,h){const node=root.document.createElement('canvas');node.width=w;node.height=h;return node;}
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function weight(point,layer){
    const [x,y]=point,polygon=layer.polygon;let inside=false,distance=1;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const [ax,ay]=polygon[i],[bx,by]=polygon[j],dx=bx-ax,dy=by-ay;
      if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
      const q=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);
      distance=Math.min(distance,Math.hypot(x-ax-q*dx,y-ay-q*dy));
    }
    if(!inside)return 0;
    let a=clamp(distance/.045,0,1);a=a*a*(3-2*a);
    const root=layer.fade?clamp((layer.fade[1]-y)/(layer.fade[1]-layer.fade[0]),0,1):clamp(Math.hypot(x-layer.pivot[0],y-layer.pivot[1])/layer.rootRadius,0,1);
    return a*root;
  }
  function deform(point,weights,layers,poses){
    let x=point[0],y=point[1],sum=weights.reduce((a,b)=>a+b,0),denom=Math.max(1,sum);
    layers.forEach((l,i)=>{
      const a=weights[i]/denom;if(!a)return;
      const p=poses[i],dx=(point[0]-l.pivot[0])*p.scaleX,dy=(point[1]-l.pivot[1])*p.scaleY,cos=Math.cos(p.rotation),sin=Math.sin(p.rotation);
      x+=a*(l.pivot[0]+dx*cos-dy*sin+p.dx-point[0]);y+=a*(l.pivot[1]+dx*sin+dy*cos+p.dy-point[1]);
    });return [x,y];
  }
  function skin(id,t,layers,points){const poses=sample(id,t,layers);return points.map(p=>deform(p,layers.map(l=>weight(p,l)),layers,poses));}
  function prepare(image,layers){
    const rig=bitmap.prepare(image);
    rig.weights=rig.vertices.map(p=>layers.map(l=>weight(p,l)));return rig;
  }
  function materialWave(n,phase,u,side=0){
    if(n===0)return Math.sin(phase*2-u*3+side)*.7+.3*Math.sin(phase*3+u*5);
    if(n===1)return Math.sin(phase+u*4+side)*.6+.4*Math.sin(phase*2-u*7);
    if(n===2)return .7*Math.sin(u*TAU*2-phase*2+side)+.3*Math.sin(u*TAU*3-phase*3);
    if(n===3)return Math.sin(phase*2-u*8+side)*(.7+.3*Math.sin(phase+u*3));
    if(n===4)return .65*Math.sin(phase*3-u*12+side)+.35*Math.sin(phase*5+u*4);
    return .6*Math.sin(phase*2-u*6+side)+.4*Math.sin(phase*4+u*11);
  }
  function perimeter(id,seconds,w,h,line){
    const n=index(id),phase=time(seconds)/12*TAU,amplitude=[1.1,.8,3.4,1.9,1.4,2.2][n],out=[];
    if(w<64||h<line+80)return out;
    for(let i=0;i<=64;i++){
      const u=i/64,s=Math.sin(u*Math.PI);
      out.push({edge:'top',x:12+(w-24)*u,y:line+23+s*(5+amplitude*materialWave(n,phase,u)),half:9});
    }
    function rail(u,right){const envelope=Math.sin(Math.PI*u),wave=materialWave(n,phase,u,right?1:0);
      return {edge:right?'right':'left',x:(right?w-12:12)+(right?-1:1)*envelope*amplitude*.5*wave,y:line+23+(h-line-49)*u,half:7.5+.3*envelope*wave};}
    for(let i=0;i<=100;i++)out.push(rail(i/100,false));
    for(let i=1;i<=12;i++){const u=i/12,a=Math.PI-u*Math.PI/2;out.push({edge:'corner',x:28+16*Math.cos(a),y:h-26+16*Math.sin(a),half:7.5-3*u});}
    for(let i=1;i<=64;i++){const u=i/64;out.push({edge:'bottom',x:28+(w-56)*u,y:h-10+.6*Math.sin(Math.PI*u)*materialWave(n,phase,u,2),half:4.5});}
    for(let i=1;i<=12;i++){const u=i/12,a=Math.PI/2-u*Math.PI/2;out.push({edge:'corner',x:w-28+16*Math.cos(a),y:h-26+16*Math.sin(a),half:4.5+3*u});}
    for(let i=1;i<=100;i++)out.push(rail(1-i/100,true));
    return out;
  }
  function material(page,bounds){
    const x=bounds.x,y=bounds.y,w=bounds.w,h=bounds.h;
    const sw=Math.ceil(bounds.left||w*.22),sh=Math.floor(h*.48),sourceY=Math.floor(y+h*.27);
    const strip=canvas(sh*2,sw),c=strip.getContext('2d');
    c.save();c.translate(0,sw);c.rotate(-Math.PI/2);c.drawImage(page,x,sourceY,sw,sh,0,0,sw,sh);c.restore();
    c.save();c.translate(sh*2,0);c.scale(-1,1);c.drawImage(strip,0,0,sh,sw,0,0,sh,sw);c.restore();
    return bitmap.ribbonTexture(strip);
  }
  function paintRibbon(c,im,points,t){
    let distance=0;const scale=im.height/15,offset=Math.sin(t/12*TAU)*im.width*.015;
    for(let i=0;i<points.length-1;i++){
      const p=points[i],q=points[i+1];if(p.edge==='top'&&q.edge!=='top'){distance=0;continue;}
      const length=Math.hypot(q.x-p.x,q.y-p.y),sw=(length+.8)*scale,sx=((distance*scale+offset)%im.width+im.width)%im.width,first=Math.min(sw,im.width-sx),half=(p.half+q.half)/2;
      c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(q.y-p.y,q.x-p.x));
      c.drawImage(im,sx,0,first,im.height,0,-half,first/scale,half*2);
      if(first<sw)c.drawImage(im,0,0,sw-first,im.height,first/scale,-half,(sw-first)/scale,half*2);
      c.restore();distance+=length;
    }
  }
  function image(file){return new Promise((resolve,reject)=>{const im=new root.Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Missing elven artwork'));im.src=file;});}
  function validMeta(meta){
    const point=p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1);
    return !!(meta&&meta.version===1&&meta.geometry&&['cx','cy','size'].every(k=>Number.isFinite(meta.geometry[k]))&&
      meta.geometry.size>=.35&&meta.geometry.size<=.85&&meta.aperture&&Number.isFinite(meta.aperture.size)&&meta.aperture.size>=.35&&
      Array.isArray(meta.portraitClip)&&meta.portraitClip.length===72&&meta.portraitClip.every(point)&&Array.isArray(meta.layers)&&meta.layers.length>=3&&meta.layers.length<=8&&
      meta.layers.every(l=>kinds.has(l.kind)&&point(l.pivot)&&Array.isArray(l.polygon)&&l.polygon.length>=3&&l.polygon.length<=12&&l.polygon.every(point)&&
        Number.isFinite(l.rootRadius)&&l.rootRadius>0&&l.rootRadius<=.1&&(!l.fade||point(l.fade)&&l.fade[0]<l.fade[1])));
  }
  async function load(id){
    index(id);if(pending.has(id))return pending.get(id);
    const job=(async()=>{
      const prefix='qa/elf-motion/'+id+'/',response=await root.fetch(prefix+'rig.json');
      if(!response.ok)throw Error('Missing elven rig');const meta=await response.json();
      if(!validMeta(meta))throw Error('Invalid elven rig');
      const [avatar,page]=await Promise.all([image(prefix+'avatar.png'),image(prefix+'page.png')]);
      const rig=prepare(avatar,meta.layers),bounds=root.LorefyFrameMotion.measurePageArt(page);
      const crest=canvas(1024,256);crest.getContext('2d').drawImage(page,bounds.x,bounds.y,bounds.w,bounds.h*.25,0,0,1024,256);
      entries.set(id,{meta,avatar,page,rig,bounds,anchors:bitmap.headerAnchors(crest),material:material(page,bounds)});return true;
    })();pending.set(id,job);job.catch(()=>pending.delete(id));return job;
  }
  function layout(id,w,h){const cap=frame.profileHeader(w);return {line:cap.line,top:cap.line,topY:cap.line,bottom:24,controls:16,rail:16};}
  function paintAvatar(c,entry,id,t,w,h){
    const g=entry.meta.aperture,r=Math.min(w,h)*g.size/2;
    c.save();c.beginPath();c.rect(0,0,w,h);c.moveTo(w*g.cx+r,h*g.cy);c.arc(w*g.cx,h*g.cy,r,0,TAU);c.clip('evenodd');
    const poses=sample(id,t,entry.meta.layers);
    const vertices=entry.rig.vertices.map((p,i)=>deform(p,entry.rig.weights[i],entry.meta.layers,poses));
    bitmap.paint(c,entry.rig,vertices,w,h);c.restore();
  }
  function paint(c,id,kind,seconds,w,h){
    const entry=entries.get(id);if(!entry||w<4||h<4)return;
    const t=time(seconds);
    if(kind==='avatar'){paintAvatar(c,entry,id,t,w,h);return;}
    const g=layout(id,w,h),points=perimeter(id,t,w,h,g.line),b=entry.bounds;
    c.save();c.beginPath();c.rect(0,g.line,w,66);c.rect(0,g.line,24,h-g.line);c.rect(w-24,g.line,24,h-g.line);c.rect(0,h-34,w,34);c.clip();
    paintRibbon(c,entry.material,points.filter(p=>p.edge!=='top'),t);c.restore();
    // The original top silhouette stays proportional; its two halves breathe like their material.
    const sourceH=b.h*.25,cap=frame.profileHeader(w,sourceH/b.w),crestW=cap.width,crestH=cap.height,n=index(id);
    cap.anchors=entry.anchors.map(p=>({x:cap.x+p.x*cap.width,y:cap.y+p.y*cap.height+Math.sin(Math.PI*p.x)*(n===2?3.8:n===3?2.2:1.3)*materialWave(n,t/12*TAU,p.x)}));
    const joins=['left','right'].map(edge=>{
      const side=points.filter(p=>p.edge===edge);if(edge==='right')side.reverse();
      const [a,next]=side,dx=a.x-next.x,dy=a.y-next.y,length=Math.hypot(dx,dy);
      return {...a,dx:dx/length,dy:dy/length};
    });
    for(const path of frame.headerConnectors(w,cap,joins,(u,side)=>materialWave(n,t/12*TAU,u,side)))paintRibbon(c,entry.material,path,t);
    c.save();c.beginPath();c.rect(cap.x-3,Math.max(0,cap.y-3),cap.width+6,cap.height+6);c.clip();
    for(let i=0;i<64;i++){
      const u=i/64,dx=(w-crestW)/2+u*crestW,amplitude=n===2?3.8:n===3?2.2:1.3;
      const dy=Math.sin(Math.PI*u)*amplitude*materialWave(n,t/12*TAU,u);
      c.drawImage(entry.page,b.x+u*b.w,b.y,b.w/64+1,sourceH,dx,cap.y+dy,crestW/64+.5,crestH);
    }c.restore();
  }
  return Object.freeze({ids,sample,pagePose,perimeter,skin,validMeta,load,layout,paint});
});
