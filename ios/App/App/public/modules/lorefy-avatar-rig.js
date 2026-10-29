/* PFP-only articulated bitmap layers. Time comes from the shared frame scheduler. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LorefyAvatarRig=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const TAU=Math.PI*2,LOOP=12;
  const styles={inkstorm:'ink-cast','star-atlas':'astrolabe','sakura-wind':'falling-petals',
    'tidal-glass':'breaking-surf','signal-zero':'panel-sequence','paper-flight':'wing-flight'};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const unit=x=>((x%1)+1)%1;
  function sample(id,seconds,m){
    const action=Object.hasOwn(styles,id)?styles[id]:null;if(!action)throw Error('Unknown avatar rig');
    const t=unit((Number.isFinite(seconds)?seconds:0)/LOOP)*LOOP,phase=t/LOOP*TAU;
    const cx=m.cx,cy=m.cy,r=Math.max(.34,Math.min(.38,m.size/2+.10));
    const body=[],parts=[];
    const count=id==='signal-zero'?8:id==='star-atlas'?2:id==='paper-flight'?1:3;
    for(let i=0;i<count;i++){
      const angle=i/count*TAU,p=phase*3+angle;
      let rotation=0,scale=1,dx=0,dy=0;
      if(id==='tidal-glass'){
        rotation=.16*Math.sin(p)+.045*Math.sin(p*2);scale=.95+.065*Math.sin(p+1.3);
        dx=.009*Math.cos(angle)*Math.sin(p);dy=-.012*Math.sin(p+angle);
      }else if(id==='inkstorm'){
        rotation=.12*Math.sin(p);scale=.98+.035*Math.cos(p*2);dx=.007*Math.cos(p);dy=.007*Math.sin(p);
      }else if(id==='sakura-wind'){
        rotation=.045*Math.sin(phase*2+angle);dx=.004*Math.sin(phase*2+angle);
      }else if(id==='star-atlas'&&i===1)rotation=-phase;
      else if(id==='signal-zero'){
        const open=(.5+.5*Math.cos(phase*2-angle))**10;
        rotation=.16*open*(i%2?1:-1);dx=Math.cos(angle)*.025*open;dy=Math.sin(angle)*.025*open;
      }
      body.push({rotation,scale,dx,dy});
    }
    const n=id==='tidal-glass'?18:id==='inkstorm'?12:id==='sakura-wind'?12:Math.max(2,m.parts.length);
    for(let i=0;i<n;i++){
      let x,y,size,rotation=0,opacity=1,wing=0;
      const a=i*2.399963;
      if(id==='tidal-glass'||id==='inkstorm'){
        const q=unit(t/(id==='tidal-glass'?2:3)+i/n),radius=r+.075*q;
        x=cx+Math.cos(a)*radius+Math.sin(a)*.04*q;
        y=cy+Math.sin(a)*radius-.085*4*q*(1-q)+.065*q*q;
        size=(id==='tidal-glass'?.034:.025)+.006*(i%3);
        rotation=a+q*1.7;opacity=Math.sin(q*Math.PI)**1.4;
      }else if(id==='sakura-wind'){
        const q=unit(t/4+i/n);
        x=cx+.27*Math.sin(a)+.065*Math.sin(q*TAU+a);y=cy-r+q*.78;
        size=.035+.007*(i%3);rotation=q*TAU*2+a;opacity=Math.sin(q*Math.PI);
      }else if(id==='star-atlas'){
        const orbit=-2.7+i/n*TAU+phase*(i%2?-1:1);
        x=cx+Math.cos(orbit)*r;y=cy+Math.sin(orbit)*r;
        size=.10;rotation=orbit+phase;opacity=.9+.1*Math.sin(phase*2+i);
      }else if(id==='signal-zero'){
        const angle=-2.4+i/n*TAU,open=(.5+.5*Math.sin(phase*2+i))**4;
        x=cx+Math.cos(angle)*(r+.025*open);y=cy+Math.sin(angle)*(r+.025*open);
        size=.105;rotation=.35*Math.sin(phase*2+i);
      }else{
        const orbit=-2.6+i/n*TAU+phase*(i%2?-1:1);
        x=cx+Math.cos(orbit)*r;y=cy+Math.sin(orbit)*r;
        size=.17;rotation=orbit+Math.PI/2;wing=.65*Math.sin(phase*12+i*2);
      }
      const margin=size*.76+.01;
      parts.push({index:i%m.parts.length,x:clamp(x,margin,1-margin),y:clamp(y,margin,1-margin),size,rotation,opacity:clamp(opacity,0,1),wing});
    }
    return {action,body,parts,flow:id==='tidal-glass'?phase*2:id==='inkstorm'?-phase:0};
  }
  function layer(im,clip){
    const c=root.document.createElement('canvas');c.width=im.width;c.height=im.height;
    const g=c.getContext('2d');g.save();clip(g);g.drawImage(im,0,0);g.restore();return c;
  }
  function wings(im){
    const {width:w,height:h}=im;
    return [-1,0,1].map(side=>layer(im,c=>{
      c.beginPath();
      if(side===0)c.rect(w*.4,0,w*.2,h);
      else c.rect(side<0?0:w*.5,0,w*.5,h);
      c.clip();
    }));
  }
  function crestLayer(im,pivot,index,count){
    const canvas=root.document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;
    const mask=root.document.createElement('canvas');mask.width=Math.min(128,im.width);mask.height=Math.round(im.height*mask.width/im.width);
    const c=canvas.getContext('2d'),g=mask.getContext('2d'),pixels=g.createImageData(mask.width,mask.height);
    const middle=(index+.5)/count*TAU-Math.PI/2,half=Math.PI/count,feather=.35;
    for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){
      const angle=Math.atan2((y+.5)*im.height/mask.height-pivot.y,(x+.5)*im.width/mask.width-pivot.x)-middle,distance=Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)));
      const a=clamp((distance-half+feather)/(feather*2),0,1),opacity=1-a*a*(3-2*a);
      pixels.data[(y*mask.width+x)*4+3]=Math.round(opacity*255);
    }
    g.putImageData(pixels,0,0);c.drawImage(im,0,0);c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0,im.width,im.height);
    return canvas;
  }
  function prepare(entry,id){
    const m=entry.meta.avatar,im=entry.avatar;
    const pivot={x:(m.cx-.05)/.9*im.width,y:(m.cy-.05)/.9*im.height};
    const count=id==='signal-zero'?8:id==='star-atlas'?2:id==='paper-flight'?1:3;
    const layers=Array.from({length:count},(_,i)=>{
      if(count===1)return im;
      if(count===3)return crestLayer(im,pivot,i,count);
      return layer(im,c=>{
        c.beginPath();
        if(id==='star-atlas'){
          if(i===0)c.rect(0,0,im.width,im.height);
          c.moveTo(pivot.x+im.width*.35,pivot.y);c.arc(pivot.x,pivot.y,im.width*.35,0,TAU);
          c.clip(i===0?'evenodd':'nonzero');
        }else{
          const a=i/count*TAU-Math.PI/2,overlap=.07;
          c.moveTo(pivot.x,pivot.y);c.arc(pivot.x,pivot.y,im.width*1.5,a-overlap,a+TAU/count+overlap);c.closePath();c.clip();
        }
      });
    });
    return {pivot,layers,wings:id==='paper-flight'?entry.avatarParts.map(p=>wings(p.image)):null};
  }
  function fluid(c,entry,m,phase,w,h){
    const im=entry.border,n=112,cx=m.cx*w,cy=m.cy*h,d=Math.min(w,h),base=m.size/2+.075;
    for(let i=0;i<n;i++){
      const a=i/n*TAU,b=(i+1)/n*TAU;
      const radius=base+.012*Math.sin(a*3-phase*3),next=base+.012*Math.sin(b*3-phase*3);
      const x=cx+Math.cos(a)*radius*d,y=cy+Math.sin(a)*radius*d;
      const xx=cx+Math.cos(b)*next*d,yy=cy+Math.sin(b)*next*d;
      const length=Math.hypot(xx-x,yy-y)+.7,half=d*(.045+.012*Math.sin(a*3-phase*4));
      const sx=unit(i/n+phase/TAU)*im.width,sw=im.width/n+1,first=Math.min(sw,im.width-sx);
      c.save();c.translate(x,y);c.rotate(Math.atan2(yy-y,xx-x));
      c.drawImage(im,sx,0,first,im.height,0,-half,length*first/sw,half*2);
      if(first<sw)c.drawImage(im,0,0,sw-first,im.height,length*first/sw,-half,length*(sw-first)/sw,half*2);
      c.restore();
    }
  }
  function paint(c,entry,id,seconds,w,h){
    const m=entry.meta.avatar,rig=entry.rig,frame=sample(id,seconds,m),d=Math.min(w,h);
    const base=id==='tidal-glass'?.84:id==='inkstorm'?.86:id==='sakura-wind'?.88:id==='signal-zero'?.86:.9;
    const sx=w/entry.avatar.width*base,sy=h/entry.avatar.height*base;
    if(frame.body.length===3){
      c.save();c.globalAlpha=.55;c.drawImage(entry.avatar,m.cx*w-rig.pivot.x*sx,m.cy*h-rig.pivot.y*sy,w*base,h*base);c.restore();
    }
    frame.body.forEach((p,i)=>{
      c.save();c.translate(m.cx*w+p.dx*w,m.cy*h+p.dy*h);c.rotate(p.rotation);c.scale(p.scale,p.scale);
      c.drawImage(rig.layers[i],-rig.pivot.x*sx,-rig.pivot.y*sy,w*base,h*base);c.restore();
    });
    if(id==='tidal-glass'||id==='inkstorm'){
      c.save();c.globalAlpha=id==='tidal-glass'?.85:.65;fluid(c,entry,m,frame.flow,w,h);c.restore();
    }
    for(const p of frame.parts){
      const part=entry.avatarParts[p.index],im=part.image,max=Math.max(im.width,im.height);
      const pw=p.size*d*im.width/max,ph=p.size*d*im.height/max;
      c.save();c.translate(p.x*w,p.y*h);c.rotate(p.rotation);c.globalAlpha=p.opacity;
      if(rig.wings){
        const pieces=rig.wings[p.index];
        for(const [i,angle]of [[0,-p.wing],[2,p.wing],[1,0]]){
          c.save();c.translate(0,ph*.05);c.rotate(angle);c.drawImage(pieces[i],-pw/2,-ph*.55,pw,ph);c.restore();
        }
      }else c.drawImage(im,-pw/2,-ph/2,pw,ph);
      c.restore();
    }
  }
  return Object.freeze({sample,prepare,paint});
});
