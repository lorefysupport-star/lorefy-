/* Existing identities, original artwork, connected material motion; one shared clock. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.LorefyFrameRestoration=api;root.LorefyOriginalRenderers=root.LorefyOriginalRenderers||{};root.LorefyOriginalRenderers.restored=api;}
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const TAU=Math.PI*2,bitmap=root.LorefyBitmapRig||(typeof require==='function'?require('./lorefy-bitmap-rig.js'):null);
  const classic=['observatory','blossom','manuscript'];
  const beta=['maple-drift','robins-perch','mushroom-grove','grasping-hands','ghost-orbit','watching-eyes','prism-spin','ripple-pulse','neon-orbit','pearl-bubbles','scale-shimmer','coral-crown','block-party','rocket-ride','gumball-ring','goal-rush','stadium-lights','champion-laurel','peekaboo-pal','bunny-hug','kitty-crew','moth-lantern','rune-circle','thorn-rose'].map(id=>'pfpvibes-'+id);
  const originals=['night-gaze','signal-drift','midnight-bloom','crimson-current','maple-scout','twilight-den','amber-drift','woodland-lantern','moon-fox','ribbon-bunny','ember-tiger','mint-raccoon'].map(id=>'original-'+id);
  const ids=Object.freeze([...classic,...beta,...originals]),allowed=new Set(ids),entries=new Map(),pending=new Map();let catalogJob;
  const actions=new Set(['astrolabe','petals','quill','leaves','perch','grove','reach','ghosts','blink','prism','water','scanner','bubbles','scales','coral','blocks','rocket','gumballs','kick','lights','laurel','peek','bunny','cat','moth','runes','rose','fire','fox','sleep','lantern','tiger','raccoon']);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),phase=t=>(((Number.isFinite(t)?t:0)%12)+12)%12/12*TAU;
  function valid(p){
    const point=q=>Array.isArray(q)&&q.length===2&&q.every(v=>Number.isFinite(v)&&v>=0&&v<=1);
    const geo=g=>g&&['cx','cy','size'].every(k=>Number.isFinite(g[k]))&&g.size>.05&&g.size<=.85&&g.cx-g.size/2>=0&&g.cy-g.size/2>=0&&g.cx+g.size/2<=1&&g.cy+g.size/2<=1;
    const page=p&&classic.includes(p.id)?'launch/shop/lorefy-page-'+p.id+'.png':p&&originals.includes(p.id)?'launch/decorations/originals/'+p.id.slice(9)+'/page-still.png':null;
    return !!(p&&allowed.has(p.id)&&p.avatar==='launch/decorations/refined/'+p.id+'.png'&&p.page===page&&actions.has(p.action)&&
      /^#[\da-f]{6}$/i.test(p.accent)&&/^#[\da-f]{6}$/i.test(p.second)&&geo(p.geometry)&&geo(p.aperture)&&p.aperture.size<p.geometry.size&&
      Array.isArray(p.portraitClip)&&p.portraitClip.length===72&&p.portraitClip.every(point));
  }
  function pose(p,seconds){
    const t=phase(seconds),seed=ids.indexOf(p.id)*.37,a=p.action;
    let bend=.025*Math.sin(t*2+seed),lift=.007*Math.sin(t+seed),turn=0,flap=1,blink=1,pulse=1+.018*Math.sin(t*2+seed),tail=.05*Math.sin(t*2+seed);
    if(['astrolabe','runes','prism','gumballs'].includes(a))turn=t*(a==='prism'?-1:1);
    if(['bunny','cat','fox','raccoon','tiger'].includes(a)){const q=((seconds%12+12)%12-1.1)/.8;bend=q>0&&q<1?.075*Math.sin(q*TAU)*Math.sin(q*Math.PI)**2:0;tail=.075*Math.sin(t*2+seed);}
    if(a==='moth'){flap=.45+.55*(.5+.5*Math.sin(t*6));bend=.045*Math.sin(t*6);}
    if(a==='blink'||a==='raccoon'||a==='tiger'||a==='sleep')blink=1-.88*Math.max(0,Math.cos(t*2+seed))**28;
    if(a==='water'){bend=.075*Math.sin(t*3+seed);lift=.012*Math.sin(t*2);pulse=1+.025*Math.sin(t*3);}
    if(a==='reach'){bend=.10*Math.sin(t*2+seed);lift=.014*Math.sin(t*2-.4);}
    if(a==='rocket'){bend=.035*Math.sin(t*4);lift=.018*Math.sin(t*2);}
    if(a==='kick'){bend=.10*Math.sin(t*4)*Math.max(0,Math.sin(t*2));lift=.016*Math.sin(t*2);}
    if(a==='peek'||a==='ghosts'){lift=.022*Math.sin(t*2+seed);bend=.045*Math.sin(t*2-.5);}
    if(a==='sleep'){bend=.004*Math.sin(t);lift=.003*Math.sin(t*2);pulse=1+.014*Math.sin(t*2);}
    if(a==='fire')bend=.07*Math.sin(t*4+seed);
    if(a==='lantern')bend=.08*Math.sin(t+seed);
    if(a==='perch'){bend=.055*Math.sin(t*2)*Math.max(0,Math.cos(t));lift=.008*Math.sin(t*4);}
    return {bend,lift,turn:Math.sin(turn),rotation:Math.cos(turn),flap,blink,pulse,tail};
  }
  function positions(p,rig,seconds){
    const m=pose(p,seconds),g=p.aperture,t=phase(seconds),rotor=['astrolabe','runes','prism','gumballs'].includes(p.action),eyes=p.action==='blink';
    return rig.vertices.map(([x,y])=>{
      const dx=x-g.cx,dy=y-g.cy,r=Math.hypot(dx,dy),angle=Math.atan2(dy,dx),outside=clamp((r-g.size/2)/.06,0,1);
      if(rotor)return [g.cx+dx*m.rotation-dy*m.turn,g.cy+dx*m.turn+dy*m.rotation];
      let xx=x,yy=y;
      const left=Math.exp(-1*((x-.23)/.20)**2-((y-.20)/.24)**2),right=Math.exp(-1*((x-.77)/.20)**2-((y-.20)/.24)**2),lower=Math.exp(-1*((x-.5)/.42)**2-((y-.86)/.18)**2);
      if(['bunny','cat','fox','raccoon','tiger'].includes(p.action)){
        xx+=m.bend*(left-right)*(y-.35)+m.tail*lower*(y-.7);
        yy+=m.bend*(left+right)*.12+lower*m.lift;
      }else if(p.action==='moth'){
        for(const [cx,cy,axis]of [[.30,.13,0],[.91,.50,1],[.30,.87,0]]){
          const weight=Math.exp(-1*((x-cx)/.12)**2-((y-cy)/.11)**2);
          if(axis)yy+=(y-cy)*(m.flap-1)*weight;else xx+=(x-cx)*(m.flap-1)*weight;
        }
      }else if(eyes){
        for(const [i,eye]of (rig.features||[]).entries()){
          const ex=x-eye.x,ey=y-eye.y,along=ex*eye.cos+ey*eye.sin,normal=-ex*eye.sin+ey*eye.cos;
          const influence=Math.exp(-1*(along/eye.w)**2-(normal/eye.h)**2),open=1-.92*Math.max(0,Math.cos(t*2+i*.43))**24;
          xx+=normal*(1-open)*influence*eye.sin;yy-=normal*(1-open)*influence*eye.cos;
        }
      }else{
        const wave=Math.sin(t*(p.action==='fire'?4:2)-angle*3);
        xx+=outside*(Math.cos(angle)*m.bend*.12*wave+m.lift*Math.sin(angle*2));
        yy+=outside*(Math.sin(angle)*m.bend*.12*wave+m.lift*Math.cos(angle*2));
      }
      if(p.action==='quill'){const feather=Math.exp(-1*((x-.80)/.20)**2-((y-.23)/.28)**2);xx+=m.bend*feather*(.48-y);}
      if(p.action==='perch'){const bird=Math.exp(-1*((x-.76)/.14)**2-((y-.13)/.12)**2);xx+=m.bend*bird*.12;yy+=m.lift*bird;}
      return [g.cx+(xx-g.cx)*(1+(m.pulse-1)*outside),g.cy+(yy-g.cy)*(1+(m.pulse-1)*outside)];
    });
  }
  function wave(p,t,u,side=0){
    const seed=ids.indexOf(p.id)*.31,a=p.action,ph=phase(t);
    if(['scanner','blocks','lights'].includes(a))return Math.sin(ph*4-u*18+side+seed)**5;
    if(['water','bubbles','scales','coral'].includes(a))return .7*Math.sin(ph*3-u*12+side)+.3*Math.sin(ph*2+u*7+seed);
    if(['bunny','cat','fox','sleep','raccoon','tiger'].includes(a))return .7*Math.sin(ph*2-u*5+side+seed)+.3*Math.sin(ph*3+u*8);
    if(a==='fire')return .6*Math.sin(ph*4-u*14+seed)+.4*Math.sin(ph*6+u*11);
    return .7*Math.sin(ph*2-u*8+side+seed)+.3*Math.sin(ph*3+u*5);
  }
  function perimeter(p,t,w,h,line=64){
    if(w<64||h<170)return [];
    const out=[],amp=['water','fire','bunny'].includes(p.action)?4.8:4.5;
    for(let i=0;i<=64;i++){const u=i/64;out.push({edge:'top',x:12+(w-24)*u,y:line+8+Math.sin(u*Math.PI)*(4+amp*wave(p,t,u)),half:7.5});}
    function side(u,right){return {edge:right?'right':'left',x:(right?w-12:12)+Math.sin(u*Math.PI)*amp*wave(p,t,u,right?1:0),y:line+8+(h-line-34)*u,half:7};}
    for(let i=0;i<=96;i++)out.push(side(i/96,false));
    for(let i=1;i<=12;i++){const u=i/12,a=Math.PI-u*Math.PI/2;out.push({edge:'corner',x:28+16*Math.cos(a),y:h-26+16*Math.sin(a),half:7-2.5*u});}
    for(let i=1;i<=64;i++){const u=i/64;out.push({edge:'bottom',x:28+(w-56)*u,y:h-10+2.4*Math.sin(u*Math.PI)*wave(p,t,u,2),half:4.5});}
    for(let i=1;i<=12;i++){const u=i/12,a=Math.PI/2-u*Math.PI/2;out.push({edge:'corner',x:w-28+16*Math.cos(a),y:h-26+16*Math.sin(a),half:4.5+2.5*u});}
    for(let i=1;i<=96;i++)out.push(side(1-i/96,true));return out;
  }
  function canvas(w,h){const c=root.document.createElement('canvas');c.width=w;c.height=h;return c;}
  const image=src=>new Promise((resolve,reject)=>{const im=new root.Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Missing restored frame artwork'));im.src=src;});
  function unwrap(avatar,p){
    const im=canvas(512,512),c=im.getContext('2d');c.drawImage(avatar,0,0,512,512);const source=c.getImageData(0,0,512,512).data;
    const strip=canvas(1024,64),g=strip.getContext('2d'),pixels=g.createImageData(1024,64),cx=p.geometry.cx*512,cy=p.geometry.cy*512;
    for(let x=0;x<1024;x++){
      const angle=x/1024*TAU,cos=Math.cos(angle),sin=Math.sin(angle);let inner=p.aperture.size*256,outer=inner+18;
      for(let r=Math.floor(inner);r<235;r++){const xx=Math.round(cx+cos*r),yy=Math.round(cy+sin*r);if(xx<0||yy<0||xx>511||yy>511)break;if(source[(yy*512+xx)*4+3]>48){inner=r;break;}}
      for(let r=inner;r<Math.min(238,inner+64);r++){const xx=Math.round(cx+cos*r),yy=Math.round(cy+sin*r);if(xx<0||yy<0||xx>511||yy>511)break;if(source[(yy*512+xx)*4+3]>16)outer=r;}
      for(let y=0;y<64;y++){const r=inner-2+(Math.max(8,outer-inner)+4)*y/63,xx=clamp(Math.round(cx+cos*r),0,511),yy=clamp(Math.round(cy+sin*r),0,511),from=(yy*512+xx)*4,to=(y*1024+x)*4;for(let k=0;k<4;k++)pixels.data[to+k]=source[from+k];}
    }g.putImageData(pixels,0,0);return strip;
  }
  function pageArtwork(page){
    const probe=canvas(512,1024),g=probe.getContext('2d');g.drawImage(page,0,0,512,1024);
    const pixels=g.getImageData(0,0,512,1024).data;let left=512,right=0,top=1024,bottom=0;
    for(let y=0;y<1024;y++)for(let x=0;x<512;x++)if(pixels[(y*512+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const art=canvas(1024,1024),sx=Math.max(0,left-2),sy=Math.max(0,top-2),sw=Math.min(512-sx,right-left+5),sh=Math.min(1024-sy,bottom-top+5);
    art.getContext('2d').drawImage(probe,sx,sy,sw,sh,0,0,1024,1024);
    const capPixels=art.getContext('2d').getImageData(0,0,1024,256).data;let capBottom=128;
    for(let y=0;y<256;y++)for(let x=205;x<819;x++)if(capPixels[(y*1024+x)*4+3]>48)capBottom=y;
    return {art,cut:clamp((capBottom+8)/1024,.14,.24),ratio:sh/1024*page.height/(sw/512*page.width)};
  }
  function strand(source,w,y,right=false){
    const from=right?Math.floor(w*.78):0,to=right?w:Math.floor(w*.22);let start=-1,best=null;
    for(let x=from;x<=to;x++){
      const opaque=x<to&&source[(y*w+x)*4+3]>24;
      if(opaque&&start<0)start=x;
      if(!opaque&&start>=0){if(!best||x-start>best.right-best.left+1)best={left:start,right:x-1,y};start=-1;}
    }
    return best;
  }
  function materialPixels(source,w,h,right=false){
    const width=1024,height=64,data=new Uint8ClampedArray(width*height*4),rows=[];
    for(let i=0;i<512;i++){
      const y=Math.min(h-1,Math.round(h*(.25+.625*i/511)));rows.push(strand(source,w,y,right));
    }
    // Normalize the dominant ribbon strand, not floating particles or transparent margins.
    let last=rows.find(Boolean);if(!last)return {width,height,data};
    for(let x=0;x<512;x++){
      const row=rows[x]||last;last=row;const span=row.right-row.left+1;
      for(let y=0;y<height;y++){
        const sx=clamp(Math.round(row.left-span*.07+span*1.14*y/(height-1)),0,w-1),from=(row.y*w+sx)*4;
        for(const dx of [x,width-1-x])for(let k=0;k<4;k++)data[(y*width+dx)*4+k]=source[from+k];
      }
    }
    return {width,height,data};
  }
  function headerBox(w,ratio=.43){
    const motion=root.LorefyFrameMotion||(typeof require==='function'?require('./lorefy-frame-motion.js'):null);
    return motion.profileHeader(w,ratio);
  }
  function pagePositions(p,rig,t,w,h){
    const line=headerBox(w).line,foot=30;
    // The original side/footer skin stays connected; its crest has a clear toolbar slot.
    return rig.vertices.map(([x,y])=>{
      const railX=x<.22?x/.22*24:x>.78?w-24+(x-.78)/.22*24:24+(x-.22)/.56*(w-48);
      const hem=clamp((y-.88)/.12,0,1);
      let xx=railX*(1-hem)+(4+x*(w-8))*hem;
      let yy=y<.24?line+8:y>.88?h-foot+(y-.88)/.12*(foot-3):line+8+(y-.24)/.64*(h-foot-line-8);
      const edge=Math.max(0,1-Math.min(x,1-x)/.24),body=Math.sin(clamp((y-.12)/.84,0,1)*Math.PI);
      xx+=5.4*edge*body*Math.sin(Math.PI*clamp(Math.min(x,1-x)/.22,0,1))*wave(p,t,y,x>.5?1:0);
      if(y>.88)yy+=2.1*Math.sin(x*Math.PI)*Math.sin((y-.88)/.12*Math.PI)*wave(p,t,x,2);
      return [clamp(xx,0,w)/w,clamp(yy,64,h)/h];
    });
  }
  function crestPositions(p,rig,t){
    const m=pose(p,t);
    return rig.vertices.map(([x,y])=>{
      const side=Math.exp(-1*((Math.abs(x-.5)-.28)/.22)**2),tip=y*y*side;
      let xx=x+tip*m.bend*(x<.5?-1:1)*.35,yy=y+Math.sin(x*Math.PI)*wave(p,t,x)*.018*y;
      if(p.action==='blink')for(const [i,eye]of (rig.features||[]).entries()){
        const ex=x-eye.x,ey=y-eye.y,normal=-ex*eye.sin+ey*eye.cos,along=ex*eye.cos+ey*eye.sin,weight=Math.exp(-1*(along/eye.w)**2-(normal/eye.h)**2),open=1-.92*Math.max(0,Math.cos(phase(t)*2+i*.43))**24;
        xx+=normal*(1-open)*weight*eye.sin;yy-=normal*(1-open)*weight*eye.cos;
      }
      return [xx,yy];
    });
  }
  function pageJoins(p,rig,t,w,h){
    if(w<64||h<170)return [];
    if(!rig?.sideJoins){
      const all=perimeter(p,t,w,h,headerBox(w).line);
      return [all.filter(q=>q.edge==='left'),all.filter(q=>q.edge==='right').reverse()].map(side=>{
        const q=side[4],next=side[5],dx=q.x-next.x,dy=q.y-next.y,length=Math.hypot(dx,dy);return {...q,dx:dx/length,dy:dy/length};
      });
    }
    return rig.sideJoins.map(g=>{
      const [a,l,r,next]=pagePositions(p,{vertices:[[g.cx,g.y],[g.left,g.y],[g.right,g.y],[g.cx,g.y+.001]]},t,w,h);
      const dx=(a[0]-next[0])*w,dy=(a[1]-next[1])*h,length=Math.hypot(dx,dy);
      return {x:a[0]*w,y:a[1]*h,half:clamp((r[0]-l[0])*w/1.76,3,9),dx:dx/length,dy:dy/length,texture:clamp((g.y-.25)/.625*511,0,511)};
    });
  }
  function connectors(p,t,w,cap,joins=pageJoins(p,null,t,w,950)){
    const motion=root.LorefyFrameMotion||(typeof require==='function'?require('./lorefy-frame-motion.js'):null);
    return motion.headerConnectors(w,cap,joins,(u,side)=>wave(p,t,u,side));
  }
  function eyes(image){
    const probe=canvas(512,512),c=probe.getContext('2d');c.drawImage(image,0,0,512,512);const pixels=c.getImageData(0,0,512,512).data,seen=new Uint8Array(512*512),queue=new Int32Array(512*512),out=[];
    const white=k=>pixels[k*4+3]>128&&pixels[k*4]>190&&pixels[k*4+1]>190&&pixels[k*4+2]>190;
    for(let k=0;k<seen.length;k++){
      if(seen[k]||!white(k))continue;let head=0,tail=1,l=512,r=0,top=512,b=0,sumX=0,sumY=0,xx=0,yy=0,xy=0;queue[0]=k;seen[k]=1;
      while(head<tail){const q=queue[head++],x=q%512,y=Math.floor(q/512);l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);b=Math.max(b,y);sumX+=x;sumY+=y;xx+=x*x;yy+=y*y;xy+=x*y;
        for(const next of [q-1,q+1,q-512,q+512])if(next>=0&&next<seen.length&&!seen[next]&&white(next)){seen[next]=1;queue[tail++]=next;}}
      if(tail<18||r-l>95||b-top>95||r-l<5||b-top<4)continue;
      const x=sumX/tail,y=sumY/tail,angle=.5*Math.atan2(2*(xy/tail-x*y),xx/tail-x*x-(yy/tail-y*y));
      out.push({x:x/512,y:y/512,cos:Math.cos(angle),sin:Math.sin(angle),w:Math.max(r-l,b-top)/512*.7,h:Math.min(r-l,b-top)/512*.8});
    }return out.slice(0,24);
  }
  async function catalog(){
    if(!catalogJob)catalogJob=root.fetch('launch/decorations/refined/manifest.json').then(r=>{if(!r.ok)throw Error('Missing frame calibration');return r.json();}).then(rows=>{if(!Array.isArray(rows)||rows.length!==39||new Set(rows.map(p=>p.id)).size!==39||!rows.every(valid))throw Error('Invalid frame calibration');return new Map(rows.map(p=>[p.id,p]));}).catch(error=>{catalogJob=null;throw error;});
    return catalogJob;
  }
  async function load(id){
    if(!allowed.has(id))throw Error('Unknown restored frame');if(pending.has(id))return pending.get(id);
    const job=(async()=>{const rows=await catalog(),meta=rows.get(id),avatar=await image(meta.avatar),page=meta.page?await image(meta.page):null;
      const pageSource=page?pageArtwork(page):null,pageRig=page?bitmap.prepare(pageSource.art,32,1024):null,strip=page?canvas(1024,64):unwrap(avatar,meta);
      let rightStrip=strip;
      if(page){
        const rgba=pageSource.art.getContext('2d').getImageData(0,0,1024,1024).data,row=Math.round(1024*.27);rightStrip=canvas(1024,64);
        pageRig.sideJoins=[false,true].map(right=>{const s=strand(rgba,1024,row,right)||{left:right?900:80,right:right?940:120};return {cx:(s.left+s.right+1)/2048,left:s.left/1024,right:(s.right+1)/1024,y:row/1024};});
        for(const [surface,right]of [[strip,false],[rightStrip,true]]){const c=surface.getContext('2d'),pixels=materialPixels(rgba,1024,1024,right),image=c.createImageData(pixels.width,pixels.height);image.data.set(pixels.data);c.putImageData(image,0,0);}
      }
      const crest=canvas(1024,246),g=crest.getContext('2d');
      if(page)g.drawImage(pageSource.art,0,0,1024,1024*pageSource.cut,0,0,1024,246);else g.drawImage(avatar,0,0,512,210,0,0,1024,246);
      if(!page){g.globalCompositeOperation='destination-in';const fade=g.createLinearGradient(0,212,0,246);fade.addColorStop(0,'#fff');fade.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=fade;g.fillRect(0,0,1024,246);}
      const rig=bitmap.prepare(avatar,meta.action==='blink'?32:['moth','bunny','cat','fox','raccoon','tiger'].includes(meta.action)?24:16);
      if(meta.action==='blink')rig.features=eyes(avatar);
      const capRig=bitmap.prepare(crest,16);if(meta.action==='blink')capRig.features=eyes(crest);
      entries.set(id,{meta,avatar,rig,strip,rightStrip,crest,capRig,pageRig,anchors:bitmap.headerAnchors(crest),capRatio:page?pageSource.ratio*pageSource.cut:200/512});return true;
    })();pending.set(id,job);job.catch(()=>pending.delete(id));return job;
  }
  function ribbon(c,im,points,p,t){
    const scale=1,flow=Math.sin(phase(t))*im.width*.045;let distance=0;
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1];if(a.edge==='top'&&b.edge!=='top'){distance=0;continue;}
      const offset=Number.isFinite(points.texture)?points.texture+flow*clamp(distance/40,0,1)**2:flow;
      const length=Math.hypot(b.x-a.x,b.y-a.y),sx=((distance*scale+offset)%im.width+im.width)%im.width,sw=(length+.8)*scale,first=Math.min(sw,im.width-sx),half=(a.half+b.half)/2;
      c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x));c.drawImage(im,sx,0,first,im.height,0,-half,first/scale,half*2);
      if(first<sw)c.drawImage(im,0,0,sw-first,im.height,first/scale,-half,(sw-first)/scale,half*2);c.restore();distance+=length;
    }
  }
  function layout(_id,w,h){const line=headerBox(w).line;return {line,top:line,bottom:24,topY:line,controls:16,rail:16};}
  function paint(c,id,kind,t,w,h){
    const e=entries.get(id);if(!e||w<4||h<4)return;
    const p=e.meta;
    if(kind==='avatar'){
      const g=p.aperture,r=Math.min(w,h)*g.size/2;c.save();c.beginPath();c.rect(0,0,w,h);c.moveTo(w*g.cx+r,h*g.cy);c.arc(w*g.cx,h*g.cy,r,0,TAU);c.clip('evenodd');
      bitmap.paint(c,e.rig,positions(p,e.rig,t),w,h);c.restore();return;
    }
    const cap=headerBox(w,e.capRatio),joins=pageJoins(p,e.pageRig,t,w,h);
    cap.anchors=crestPositions(p,{vertices:e.anchors.map(q=>[q.x,q.y])},t).map(q=>({x:cap.x+q[0]*cap.width,y:cap.y+q[1]*cap.height}));
    if(!joins.length)return;
    c.save();c.beginPath();c.rect(0,joins[0].y-.75,24,h-joins[0].y+.75);c.rect(w-24,joins[1].y-.75,24,h-joins[1].y+.75);c.rect(0,h-34,w,34);c.clip();
    if(e.pageRig)bitmap.paint(c,e.pageRig,pagePositions(p,e.pageRig,t,w,h),w,h);
    else ribbon(c,e.strip,perimeter(p,t,w,h,cap.line).filter(q=>q.edge!=='top'),p,t);c.restore();
    // Each connector terminates at the crest; nothing is painted through its face.
    for(const [i,points]of connectors(p,t,w,cap,joins).entries())ribbon(c,i?e.rightStrip:e.strip,points,p,t);
    c.save();c.beginPath();c.rect(cap.x-3,Math.max(0,cap.y-3),cap.width+6,cap.height+6);c.clip();
    c.translate(cap.x,cap.y);bitmap.paint(c,e.capRig,crestPositions(p,e.capRig,t),cap.width,cap.height);c.restore();
  }
  return Object.freeze({ids,valid,pose,positions,perimeter,pagePositions,pageJoins,crestPositions,headerBox,materialPixels,connectors,load,layout,paint});
});
