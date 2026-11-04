/* Selected original Halloween art. Shared scheduler, cached atlas and articulated parts. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root.document){root.LorefyOriginalRenderers=root.LorefyOriginalRenderers||{};root.LorefyOriginalRenderers.halloween=api;}
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const ids=Object.freeze(['ember-harvest','ghost-parade','crimson-masquerade','poison-conservatory','velvet-familiar','silk-widow']);
  const codes=['H1','H2','H3','W2','W3','G2'],entries=new Map(),pending=new Map();
  const frame=root.LorefyFrameMotion||(typeof require==='function'?require('./lorefy-frame-motion.js'):null);
  const art=root.LorefyHalloweenArt||(typeof require==='function'?require('./lorefy-halloween-art.js'):null);
  const bitmap=root.LorefyBitmapRig||(typeof require==='function'?require('./lorefy-bitmap-rig.js'):null);
  let metadata;
  function code(id){const i=ids.indexOf(id);if(i<0)throw Error('Unknown Halloween frame');return codes[i];}
  function layout(id,w,h){code(id);const cap=frame.profileHeader(w);return {line:cap.line,top:cap.line,topY:cap.line,bottom:24,controls:16,rail:18};}
  function validMeta(m){return m&&m.width===1536&&m.height===1024&&Array.isArray(m.rects)&&m.rects.length===6&&m.rects.every(r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0&&r[0]+r[2]<=m.width&&r[1]+r[3]<=m.height);}
  function canvas(w,h){const c=root.document.createElement('canvas');c.width=w;c.height=h;return c;}
  async function load(id){
    const key=code(id);if(pending.has(id))return pending.get(id);
    const job=(async()=>{
      if(!metadata)metadata=root.fetch('launch/decorations/halloween/atlas-metadata.json').then(r=>{if(!r.ok)throw Error('Missing Halloween metadata');return r.json();}).catch(e=>{metadata=null;throw e;});
      const all=await metadata,m=all[key];if(!validMeta(m))throw Error('Invalid Halloween atlas');
      const image=await new Promise((resolve,reject)=>{const im=new root.Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Missing Halloween atlas'));im.src='launch/decorations/halloween/'+key+'.png';});
      const r=m.rects[1],header=canvas(r[2],Math.ceil(r[3]*.2));header.getContext('2d').drawImage(image,r[0],r[1],r[2],r[3]*.2,0,0,header.width,header.height);
      const sh=Math.floor(r[3]*.56),sw=Math.ceil(r[2]*.18),strip=canvas(sh,sw),c=strip.getContext('2d');
      c.translate(0,sw);c.rotate(-Math.PI/2);c.drawImage(image,r[0],r[1]+r[3]*.23,sw,sh,0,0,sw,sh);
      entries.set(id,{image,rects:m.rects,header,anchors:bitmap.headerAnchors(header),texture:bitmap.ribbonTexture(strip)});return true;
    })();pending.set(id,job);job.catch(()=>pending.delete(id));return job;
  }
  function wave(key,t,u,side){const p=art.motion(key,t*30).phase;return Math.sin(p*2-u*7+side)*.7+.3*Math.sin(p*3+u*4);}
  function perimeter(key,t,w,h,line){
    const out=[],start=line+20,end=h-26;
    function rail(u,right){const d=Math.sin(Math.PI*u)*1.4*wave(key,t,u,right?1:0);return {edge:right?'right':'left',x:right?w-12-d:12+d,y:start+(end-start)*u,half:key==='W3'?8:7};}
    for(let i=0;i<=56;i++)out.push(rail(i/56,false));
    for(let i=1;i<=12;i++){const u=i/12,a=Math.PI-u*Math.PI/2;out.push({x:28+16*Math.cos(a),y:end+16*Math.sin(a),half:7-2*u});}
    for(let i=1;i<=64;i++){const u=i/64;out.push({x:28+(w-56)*u,y:h-10+Math.sin(Math.PI*u)*.7*wave(key,t,u,2),half:5});}
    for(let i=1;i<=12;i++){const u=i/12,a=Math.PI/2-u*Math.PI/2;out.push({x:w-28+16*Math.cos(a),y:end+16*Math.sin(a),half:5+2*u});}
    for(let i=1;i<=56;i++)out.push(rail(1-i/56,true));return out;
  }
  function ribbon(c,texture,points,t){
    let distance=0;const scale=texture.height/14,offset=Math.sin(t*Math.PI/4)*texture.width*.015;
    for(let i=0;i<points.length-1;i++){
      const p=points[i],q=points[i+1],length=Math.hypot(q.x-p.x,q.y-p.y),sw=(length+.8)*scale,sx=((distance*scale+offset)%texture.width+texture.width)%texture.width,first=Math.min(sw,texture.width-sx),half=(p.half+q.half)/2;
      c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(q.y-p.y,q.x-p.x));
      c.drawImage(texture,sx,0,first,texture.height,0,-half,first/scale,half*2);
      if(first<sw)c.drawImage(texture,0,0,sw-first,texture.height,first/scale,-half,(sw-first)/scale,half*2);
      c.restore();distance+=length;
    }
  }
  function crown(c,e,key,t,cap){
    const m=art.motion(key,t*30),r=e.rects,im=e.image,s=Math.min(.45,cap.width/350),x=cap.x+cap.width/2,y=cap.y+cap.height*.54;
    c.save();c.beginPath();c.rect(cap.x-3,0,cap.width+6,cap.line);c.clip();c.translate(x,y);c.scale(s,s);
    if(key==='H1')art.lantern(c,im,r[2],0,0,84,85,m.sway,m.glow);
    else if(key==='H2')art.sprite(c,im,r[2],55,Math.sin(m.phase)*6,62,68,m.sway);
    else if(key==='H3')art.sprite(c,im,r[4],0,10,18,53,m.counter,.5,0);
    else if(key==='W2'){art.sprite(c,im,r[3],38,-16,27,58,m.sway,.5,0);art.bubbles(c,38,-12,m.phase,4);}
    else if(key==='W3'){
      art.tail(c,im,r[5],48,25,55,84,m.phase);
      art.sprite(c,im,r[3],-43,-2,29,36,-.35+m.ear,.5,1);art.sprite(c,im,r[4],36,0,29,36,.35-m.ear*.7,.5,1);
      art.sprite(c,im,r[2],0,0,145,139);
    }else art.sprite(c,im,r[4],0,0,98,78,m.sway*.4);
    c.restore();
  }
  function accents(c,e,key,t,w,h,line){
    const m=art.motion(key,t*30),r=e.rects,im=e.image,y=line+35,space=Math.max(1,h-y-60);
    c.save();c.beginPath();c.rect(0,line,25,h-line);c.rect(w-25,line,25,h-line);c.rect(0,h-28,w,28);c.clip();
    if(key==='G2'){
      art.fabric(c,im,r[2],12,y+space*.14,22,Math.min(150,space*.3),m.phase,4);
      art.fabric(c,im,r[3],w-12,y+space*.55,24,Math.min(150,space*.3),m.phase+1.4,4);
      art.sprite(c,im,r[5],w*.5,h-22,10,28,m.counter,.5,0);
    }else if(key==='W2'){
      art.sprite(c,im,r[3],12,y+space*.35,20,43,m.sway,.5,0);art.bubbles(c,w-12,h-35,m.phase,4);
    }else if(key==='H1'){
      art.sprite(c,im,r[3],12,y+space*.3,24,25,m.counter,.2,.2);art.sprite(c,im,r[4],w-12,y+space*.7,24,25,m.sway,.5,.1);
    }else if(key==='H2'){
      art.sprite(c,im,r[4],w-12,y+space*.5+m.lift*.4,25,32,m.sway);art.fabric(c,im,r[5],12,y+space*.25,20,92,m.phase,4);
    }else if(key==='H3'){
      art.fabric(c,im,r[5],12,y+space*.35,22,67,m.phase,3);art.sprite(c,im,r[4],w-12,y+space*.7,10,30,m.counter,.5,0);
    }c.restore();
  }
  function paint(c,id,kind,seconds,w,h){
    const key=code(id),e=entries.get(id);if(!e||w<4||h<4)return;
    const t=((seconds%8)+8)%8;
    c.save();
    if(kind==='avatar'){
      c.scale(w/520,h/520);
      c.beginPath();c.rect(0,0,520,520);c.moveTo(260+140.4,274);c.arc(260,274,140.4,0,Math.PI*2);c.clip('evenodd');
      art.sprite(c,e.image,e.rects[0],260,274,360,360);art.details(c,e.image,e.rects,key,t*30);
    }else{
      const cap=frame.profileHeader(w,e.header.height/e.header.width),points=perimeter(key,t,w,h,cap.line);
      if(!points.length||h<cap.line+80){c.restore();return;}
      ribbon(c,e.texture,points,t);
      cap.anchors=e.anchors.map(p=>({x:cap.x+p.x*cap.width,y:cap.y+p.y*cap.height}));
      const joins=['left','right'].map(edge=>{const side=points.filter(p=>p.edge===edge);if(edge==='right')side.reverse();const [a,b]=side,d=Math.hypot(a.x-b.x,a.y-b.y);return {...a,dx:(a.x-b.x)/d,dy:(a.y-b.y)/d};});
      for(const p of frame.headerConnectors(w,cap,joins,(u,side)=>wave(key,t,u,side)))ribbon(c,e.texture,p,t);
      c.drawImage(e.header,cap.x,cap.y,cap.width,cap.height);
      crown(c,e,key,t,cap);accents(c,e,key,t,w,h,cap.line);
    }c.restore();
  }
  return Object.freeze({ids,layout,validMeta,perimeter,load,paint});
});
