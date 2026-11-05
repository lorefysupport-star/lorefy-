/* Approved object, expressive-elf and crochet artwork; the shared clock owns visibility. */
(function(root,factory){
  const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;
  if(root.document){root.LorefyOriginalRenderers=root.LorefyOriginalRenderers||{};root.LorefyOriginalRenderers.crafted=api;}
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const ids=Object.freeze(['witch','moon','ink','theatre','dawn','dusk','garden','patchwork']);
  const entries=new Map(),pending=new Map();
  const frame=root.LorefyFrameMotion||(typeof require==='function'?require('./lorefy-frame-motion.js'):null);
  const objects=root.LorefyCraftObjects||(typeof require==='function'?require('./lorefy-crafted-objects.js'):null);
  const elves=root.LorefyCraftElves||(typeof require==='function'?require('./lorefy-crafted-elves.js'):null);
  const crochet=root.LorefyCraftCrochet||(typeof require==='function'?require('./lorefy-crafted-crochet.js'):null);
  const bitmap=root.LorefyBitmapRig||(typeof require==='function'?require('./lorefy-bitmap-rig.js'):null);
  function valid(id){if(!ids.includes(id))throw Error('Unknown crafted frame');return id;}
  const family=id=>ids.indexOf(valid(id))<4?'objects':ids.indexOf(id)<6?'elves':'crochet';
  const painter=id=>({objects,elves,crochet})[family(id)];
  function protectedPortrait(id){const f=family(id);return f==='objects'?{cx:.5,cy:300/520,size:266/520}:{cx:.5,cy:330/620,size:(f==='elves'?290:276)/620};}
  function portrait(id){
    const g=protectedPortrait(id),radii={witch:159,moon:133,ink:152,theatre:147,dawn:179,dusk:162,garden:143,patchwork:138};
    // The photo bleeds beneath the artwork; its protected face area stays unchanged.
    return {...g,size:radii[id]*2/(family(id)==='objects'?520:620)};
  }
  function layout(id,w,h){valid(id);const cap=frame.profileHeader(w);return {line:cap.line,top:cap.line,topY:cap.line,bottom:24,controls:16,rail:18};}
  async function load(id){
    valid(id);if(pending.has(id))return pending.get(id);
    const job=(async()=>{
      const image=await new Promise((resolve,reject)=>{
        const im=new root.Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Crafted artwork unavailable'));
        im.src='launch/decorations/crafted/'+id+'.webp';
      });
      if(image.width!==1024||image.height!==1536)throw Error('Invalid crafted atlas');
      entries.set(id,painter(id).prepare(image,root.document));return true;
    })();pending.set(id,job);job.catch(()=>pending.delete(id));return job;
  }
  function pageResources(e){
    if(e.texture)return;
    const source=e.cells[1],sw=Math.ceil(source.width*.15),sh=Math.floor(source.height*.5);
    const strip=root.document.createElement('canvas');strip.width=sh;strip.height=sw;
    const c=strip.getContext('2d');c.translate(0,sw);c.rotate(-Math.PI/2);
    c.drawImage(source,0,source.height*.25,sw,sh,0,0,sw,sh);
    e.texture=bitmap.ribbonTexture(strip);
    e.header=root.document.createElement('canvas');e.header.width=source.width;e.header.height=Math.ceil(source.height*.19);
    e.header.getContext('2d').drawImage(source,0,0,source.width,e.header.height,0,0,source.width,e.header.height);
    e.anchors=bitmap.headerAnchors(e.header);
  }
  function wave(id,t,u,side){const speed=family(id)==='crochet'?.65:1;return Math.sin(t*speed-u*6+side)*.65+Math.sin(t*speed*1.7+u*4)*.25;}
  function perimeter(id,t,w,h,line){
    valid(id);const out=[],start=line+20,end=h-26;
    const rail=(u,right)=>({edge:right?'right':'left',x:(right?w-12:12)+(right?-1:1)*Math.sin(Math.PI*u)*wave(id,t,u,right?1:0)*1.2,y:start+(end-start)*u,half:7});
    for(let i=0;i<=48;i++)out.push(rail(i/48,false));
    for(let i=1;i<=12;i++){const u=i/12,a=Math.PI-u*Math.PI/2;out.push({x:28+16*Math.cos(a),y:end+16*Math.sin(a),half:7-2*u});}
    for(let i=1;i<=48;i++){const u=i/48;out.push({x:28+(w-56)*u,y:h-10+Math.sin(Math.PI*u)*wave(id,t,u,2)*.65,half:5});}
    for(let i=1;i<=12;i++){const u=i/12,a=Math.PI/2-u*Math.PI/2;out.push({x:w-28+16*Math.cos(a),y:end+16*Math.sin(a),half:5+2*u});}
    for(let i=1;i<=48;i++)out.push(rail(1-i/48,true));return out;
  }
  function ribbon(c,texture,points){
    let distance=0;const scale=texture.height/14;
    for(let i=0;i<points.length-1;i++){
      const p=points[i],q=points[i+1],length=Math.hypot(q.x-p.x,q.y-p.y),sw=(length+.7)*scale,sx=distance*scale%texture.width,first=Math.min(sw,texture.width-sx),half=(p.half+q.half)/2;
      c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(q.y-p.y,q.x-p.x));
      c.drawImage(texture,sx,0,first,texture.height,0,-half,first/scale,half*2);
      if(first<sw)c.drawImage(texture,0,0,sw-first,texture.height,first/scale,-half,(sw-first)/scale,half*2);
      c.restore();distance+=length;
    }
  }
  function sprite(c,im,x,y,w,h,angle=0,px=.5,py=.5){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(im,-w*px,-h*py,w,h);c.restore();}
  function cloth(c,im,x,y,w,h,t,angle=0){
    c.save();c.translate(x,y);c.rotate(angle);
    for(let i=0;i<24;i++){const u=i/24; c.drawImage(im,0,im.height*u,im.width,im.height/24,-w/2+Math.sin(t*2-u*5)*u*u*3,u*h,w,h/24+.6);}
    c.restore();
  }
  function ornaments(c,e,id,t,w,h,cap){
    const p=painter(id).pose(id,t),s=e.cells,f=family(id),x=cap.x+cap.width/2,y=cap.y+cap.height/2;
    // Everything above the banner stays inside the same toolbar-safe central slot.
    c.save();c.beginPath();c.rect(cap.x-2,0,cap.width+4,cap.line);c.clip();
    if(id==='witch'){
      const scale=Math.min(cap.width/300,cap.height/210);c.save();c.translate(x,y+105*scale);c.scale(scale,scale);
      for(let i=0;i<32;i++){const u=i/32;c.drawImage(s[2],0,s[2].height*u,s[2].width,s[2].height/32,-150+objects.flex(id,t,1-u),-210+210*u,300,210/32+.7);}c.restore();
    }else if(f==='elves'){
      const dusk=id==='dusk',k=Math.min(cap.width/170,cap.height/95);c.save();c.translate(x,y);c.scale(k,k);
      elves.ear(c,e,id,t,'left',-20,22,dusk?62:65,dusk?70:32);
      elves.ear(c,e,id,t,'right',20,22,dusk?62:65,dusk?70:32);
      sprite(c,s[5],0,8,dusk?46:70,dusk?44:26);c.restore();
    }else if(f==='crochet')crochet.bloom(c,e.topper,x,y,Math.min(cap.width,cap.height)*.9,Math.min(cap.width,cap.height)*.9,id==='garden'?p.petal:p.square);
    else sprite(c,s[2],x,y,id==='theatre'?Math.min(cap.width,160):Math.min(cap.width,55),cap.height*.85,id==='moon'?p.crescent:id==='ink'?p.nib:0);
    c.restore();
    c.save();c.beginPath();c.rect(0,cap.line,25,h-cap.line);c.rect(w-25,cap.line,25,h-cap.line);c.rect(0,h-30,w,30);c.clip();
    const y1=cap.line+70,y2=Math.max(y1,h-200);
    if(id==='witch'){cloth(c,s[4],13,y1,23,100,t);sprite(c,s[3],w-13,y2,19,90,p.pendant,.5,0);}
    else if(id==='theatre'){cloth(c,s[3],12,y1,26,150,t,p.tassel);cloth(c,s[3],w-12,y2,26,150,t+.7,-p.tassel);}
    else if(f==='elves'){sprite(c,s[4],13,y1,12,65,p.pendant,.5,0);sprite(c,s[4],w-13,y2,12,65,-p.pendant,.5,0);}
    else if(id==='garden'){cloth(c,s[3],13,y1,22,108,t,p.tassel);crochet.bloom(c,e.flower,w-13,y2,29,29,p.petal);}
    else if(id==='patchwork'){sprite(c,s[5],13,y1,20,48,p.heart,.5,0);sprite(c,s[3],w-13,y2,16,85,p.hook,.5,.9);}
    else {sprite(c,s[3],13,y1,20,80,p.pendant||p.seal,.5,0);sprite(c,s[4],w-13,y2,28,40,p.crescent||p.nib);}
    sprite(c,s[id==='patchwork'?4:5],w/2,h-19,26,26,Math.sin(t)*.06);c.restore();
  }
  function paint(c,id,kind,t,w,h){
    valid(id);const e=entries.get(id);if(!e||w<4||h<4)return;
    c.save();
    if(kind==='avatar'){const size=family(id)==='objects'?520:620;c.scale(w/size,h/size);painter(id).avatar(c,e,id,t);}
    else{
      pageResources(e);const cap=frame.profileHeader(w),points=perimeter(id,t,w,h,cap.line);
      if(h<cap.line+80){c.restore();return;}
      ribbon(c,e.texture,points);
      cap.anchors=e.anchors.map(p=>({x:cap.x+p.x*cap.width,y:cap.y+p.y*cap.height}));
      const joins=['left','right'].map(edge=>{const side=points.filter(p=>p.edge===edge);if(edge==='right')side.reverse();const [a,b]=side,d=Math.hypot(a.x-b.x,a.y-b.y);return {...a,dx:(a.x-b.x)/d,dy:(a.y-b.y)/d};});
      for(const line of frame.headerConnectors(w,cap,joins,(u,side)=>wave(id,t,u,side)))ribbon(c,e.texture,line);
      c.drawImage(e.header,cap.x,cap.y,cap.width,cap.height);ornaments(c,e,id,t,w,h,cap);
    }c.restore();
  }
  return Object.freeze({ids,portrait,protectedPortrait,layout,perimeter,load,paint});
});
