/* Original bitmap materials, animated by the shared decoration scheduler. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root.document){root.LorefyOriginalRenderers=root.LorefyOriginalRenderers||{};root.LorefyOriginalRenderers.atelier=api;}
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const TAU=Math.PI*2,LOOP=12;
  const frame=root.LorefyFrameMotion||(typeof require==='function'?require('./lorefy-frame-motion.js'):null);
  const themes=Object.freeze([
    {id:'inkstorm',wave:.022,drift:.020,half:6.5,amplitude:5.8,cycles:2.1,arch:6},
    {id:'star-atlas',wave:.002,drift:.012,half:5,amplitude:2,cycles:1.15,arch:8},
    {id:'sakura-wind',wave:.012,drift:.026,half:4.5,amplitude:4.3,cycles:1.6,arch:7},
    {id:'tidal-glass',wave:.026,drift:.022,half:8,amplitude:6,cycles:1.4,arch:6},
    {id:'signal-zero',wave:.004,drift:.008,half:5.5,amplitude:3,cycles:2.4,arch:8},
    {id:'paper-flight',wave:.014,drift:.020,half:6.5,amplitude:4.8,cycles:1.8,arch:7}
  ].map(Object.freeze));
  function pose(id,seconds,y,index=0){
    if(!themes.some(t=>t.id===id))throw Error('Unknown atelier material');
    const t=(Number.isFinite(seconds)?seconds:0)/LOOP*TAU,k=index*1.71;
    let wave,x,dy,angle,scaleY=1;
    switch(id){
      case 'inkstorm':wave=.7*Math.sin(t*3-y*9)+.3*Math.sin(t*5+y*13);x=Math.sin(t*2+k);dy=Math.cos(t*3+k);angle=.3*Math.sin(t*2+k);break;
      case 'star-atlas':wave=Math.sin(t+y*2);x=Math.cos(t+k);dy=Math.sin(t+k);angle=t+k;break;
      case 'sakura-wind':wave=Math.sin(t*2+y*2)*(.3+.7*y);x=Math.sin(t+k);dy=Math.sin(t*2+k);angle=.65*Math.sin(t+k);scaleY=.85+.15*Math.cos(t*2+k);break;
      case 'tidal-glass':wave=.65*Math.sin(t*3-y*12)+.35*Math.sin(t*2+y*7);x=Math.sin(t*2+k);dy=Math.cos(t*3+k);angle=.2*Math.sin(t*2+k);scaleY=.95+.1*Math.sin(t*3+k);break;
      case 'signal-zero':wave=Math.sin(t*4-y*18)**7;x=Math.sin(t*2+k);dy=Math.sin(t*4+k)*.35;angle=.08*Math.sin(t*2+k);break;
      default:wave=Math.sin(t*3-y*8)*Math.sin(y*Math.PI);x=Math.sin(t+k);dy=Math.cos(t*2+k);angle=.22*Math.sin(t*3+k);scaleY=.8+.2*Math.cos(t*6+k);
    }
    return {wave,x,y:dy,angle,scaleY};
  }
  function headerRibbon(id,seconds,width,line,height=950){
    const th=themes.find(t=>t.id===id);if(!th)throw Error('Unknown atelier material');
    const cap=frame.profileHeader(width,.26),phase=seconds/LOOP*TAU,body=borderRibbon(id,seconds,width,height,line);
    const joins=['left','right'].map(edge=>{
      const side=body.filter(p=>p.edge===edge);if(edge==='right')side.reverse();
      const [p,q]=side,dx=p.x-q.x,dy=p.y-q.y,length=Math.hypot(dx,dy);return {...p,dx:dx/length,dy:dy/length};
    });
    const [left,right]=frame.headerConnectors(width,cap,joins,(u,side)=>pose(id,seconds,u,side).wave);
    const a=left.at(-1),b=right.at(-1),middle=Array.from({length:63},(_,i)=>{
      const u=(i+1)/64,envelope=Math.sin(Math.PI*u)**2;
      return {edge:'top',x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u-envelope*(th.arch+th.amplitude*Math.sin(u*TAU*th.cycles-phase*2)),half:Math.min(11.5,6.5+envelope*(th.half-2+.4*Math.sin(u*TAU*2-phase*3)))};
    });
    return [...left,...middle,...right.reverse()];
  }
  function paintHeader(c,entry,theme,t,w,line,h){
    const points=headerRibbon(theme.id,t,w,line,h),im=entry.header;
    const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);let distance=0;
    // Deform the complete illustrated ribbon; never repeat a tiny flat material swatch.
    for(let i=0;i<points.length-1;i++){
      const p=points[i],q=points[i+1],length=lengths[i],sx=distance/total*im.width,sw=Math.min((length+.6)/total*im.width,im.width-sx),half=(p.half+q.half)/2;
      c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(q.y-p.y,q.x-p.x));
      c.drawImage(im,sx,0,sw,im.height,0,-half,length+.6,half*2);c.restore();distance+=length;
    }
  }
  function borderRibbon(id,seconds,width,height,line){
    const th=themes.find(t=>t.id===id);if(!th)throw Error('Unknown atelier material');
    if(height<=line+44||width<64)return [];
    const points=[],start=line+18,end=height-22,side=Math.min(9.6,th.half+2.2),bottom=Math.min(5.3,th.half);
    function rail(u,right){
      const envelope=Math.sin(u*Math.PI),p=pose(id,seconds,u,right?1:0);
      const x=12+2*envelope*p.wave;
      return {x:right?width-x:x,y:start+(end-start)*u,half:side+.35*envelope*p.x,edge:right?'right':'left'};
    }
    for(let i=0;i<=112;i++)points.push(rail(i/112,false));
    for(let i=1;i<=12;i++){
      const u=i/12,a=Math.PI-u*Math.PI/2;
      points.push({x:28+16*Math.cos(a),y:end+16*Math.sin(a),half:side+(bottom-side)*u,edge:'corner-left'});
    }
    for(let i=1;i<=80;i++){
      const u=i/80,envelope=Math.sin(Math.PI*u),p=pose(id,seconds,u,2);
      points.push({x:28+(width-56)*u,y:height-6+.6*envelope*p.wave,half:bottom,edge:'bottom'});
    }
    for(let i=1;i<=12;i++){
      const u=i/12,a=Math.PI/2-u*Math.PI/2;
      points.push({x:width-28+16*Math.cos(a),y:end+16*Math.sin(a),half:bottom+(side-bottom)*u,edge:'corner-right'});
    }
    for(let i=1;i<=112;i++)points.push(rail(1-i/112,true));
    return points;
  }
  function mirrorRibbon(im){
    const tile=root.document.createElement('canvas');tile.width=im.width*2;tile.height=im.height;
    const c=tile.getContext('2d');c.drawImage(im,0,0);c.translate(tile.width,0);c.scale(-1,1);c.drawImage(im,0,0);
    return tile;
  }
  function paintPerimeter(c,entry,theme,t,w,h,line){
    const points=borderRibbon(theme.id,t,w,h,line),im=entry.border;
    const scale=im.width/(2*Math.max(150,Math.min(220,w*.5)));
    const flow=theme.id==='tidal-glass'||theme.id==='inkstorm';
    const offset=flow?t/LOOP*im.width:Math.sin(t/LOOP*TAU)*im.width*.025;
    let distance=0;
    c.save();c.beginPath();c.rect(0,line+1,24,h-line-1);c.rect(w-24,line+1,24,h-line-1);
    c.rect(0,h-32,36,32);c.rect(w-36,h-32,36,32);c.rect(0,h-12,w,12);c.clip();
    for(let i=0;i<points.length-1;i++){
      const p=points[i],q=points[i+1],length=Math.hypot(q.x-p.x,q.y-p.y),half=(p.half+q.half)/2;
      const sx=((distance*scale+offset)%im.width+im.width)%im.width,sw=(length+.8)*scale;
      const first=Math.min(sw,im.width-sx);
      c.save();c.translate((p.x+q.x)/2,(p.y+q.y)/2);c.rotate(Math.atan2(q.y-p.y,q.x-p.x));
      c.drawImage(im,sx,0,first,im.height,-length/2,-half,first/scale,half*2);
      if(first<sw)c.drawImage(im,0,0,sw-first,im.height,-length/2+first/scale,-half,(sw-first)/scale,half*2);
      c.restore();distance+=length;
    }
    c.restore();
  }
  const art=new Map(),pending=new Map();
  function image(path){return new Promise((resolve,reject)=>{const im=new root.Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Missing atelier artwork'));im.src=path;});}
  async function load(id){
    if(!themes.some(t=>t.id===id))throw Error('Unknown atelier material');
    if(pending.has(id))return pending.get(id);
    const task=(async()=>{
      const prefix='qa/motion-atelier/'+id+'/',response=await root.fetch(prefix+'parts.json');
      if(!response.ok)throw Error('Missing atelier layers');
      const meta=await response.json(),entry={meta};
      for(const kind of ['avatar','page']){
        const m=meta[kind];
        if(!m||!Array.isArray(m.parts)||m.parts.length>9)throw Error('Invalid atelier layers');
        entry[kind]=await image(prefix+kind+'-base.png');
        entry[kind+'Parts']=await Promise.all(m.parts.map(async p=>{
          if(!/^(avatar|page)-part-\d\.png$/.test(p.file)||!['x','y','w','h'].every(k=>Number.isFinite(p[k])&&p[k]>=0))throw Error('Invalid atelier layer');
          return {...p,image:await image(prefix+p.file)};
        }));
      }
      entry.bounds=root.LorefyFrameMotion.measurePageArt(entry.page);
      entry.bounds.materialConnectors=true;
      entry.header=await image(prefix+'header.png');
      entry.border=mirrorRibbon(root.LorefyBitmapRig.ribbonTexture(entry.header));
      entry.rig=root.LorefyAvatarRig.prepare(entry,id);
      art.set(id,entry);return true;
    })();
    pending.set(id,task);task.catch(()=>pending.delete(id));return task;
  }
  function layout(id,w,h){const cap=frame.profileHeader(w);return {line:cap.line,top:cap.line,topY:cap.line,bottom:24,controls:16,rail:16};}
  function portraitClip(c,w,h,g){
    const r=Math.min(w,h)*g.size/2;
    c.beginPath();c.rect(0,0,w,h);c.moveTo(w*g.cx+r,h*g.cy);
    c.arc(w*g.cx,h*g.cy,r,0,TAU);c.clip('evenodd');
  }
  function drawPart(c,p,x,y,w,h,pose){
    c.save();c.translate(x,y);c.rotate(pose.angle);c.scale(1,pose.scaleY);
    c.drawImage(p.image,-w/2,-h/2,w,h);c.restore();
  }
  function paint(c,id,kind,seconds,w,h){
    const entry=art.get(id),theme=themes.find(t=>t.id===id);
    if(!entry||!theme||w<4||h<4)return;
    const t=((seconds%LOOP)+LOOP)%LOOP;
    c.save();
    if(kind==='avatar'){
      const m=entry.meta.avatar;
      portraitClip(c,w,h,m);
      root.LorefyAvatarRig.paint(c,entry,id,t,w,h);
    }else{
      const g=layout(id,w,h);
      paintHeader(c,entry,theme,t,w,g.line,h);
      paintPerimeter(c,entry,theme,t,w,h,g.line);
      entry.pageParts.forEach((p,i)=>{
        const f=pose(id,t,i/6,i),size=Math.min(14,w*.035),ph=size*p.h/p.w;
        const x=(i%2?w-10:10)+f.x*2,y=g.topY+g.top+26+(h-g.topY-g.top-90)*(i+.5)/entry.pageParts.length+f.y*5;
        c.save();c.beginPath();c.rect(0,g.topY+g.top,24,Math.max(0,h-g.topY-g.top-28));c.rect(w-24,g.topY+g.top,24,Math.max(0,h-g.topY-g.top-28));c.clip();
        drawPart(c,p,x,y,size,Math.min(24,ph),f);c.restore();
      });
    }
    c.restore();
  }
  return Object.freeze({themes,pose,headerRibbon,borderRibbon,load,layout,paint});
});
