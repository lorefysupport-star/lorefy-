/* Independent original cosmetics with deterministic component-level animation. */
(() => {
  'use strict';
  const TAU=Math.PI*2,LOOP=8;
  const themes=[
    {id:'night-gaze',name:'Night Gaze',accent:'#eef1f6',second:'#86939f',dark:'#292d34',mode:'eyes'},
    {id:'signal-drift',name:'Signal Drift',accent:'#54e6dc',second:'#ff7b83',dark:'#213d43',mode:'signal'},
    {id:'midnight-bloom',name:'Midnight Bloom',accent:'#df465e',second:'#a62743',dark:'#452c37',mode:'petals'},
    {id:'crimson-current',name:'Crimson Current',accent:'#ff6056',second:'#fff4dc',dark:'#493139',mode:'fire'}
  ];
  const art={};
  const smooth=(a,b,x)=>{const v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v)};
  const round=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r)};
  const loadImage=path=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Missing artwork: '+path));im.src=path});
  function aperture(im){
    const cn=document.createElement('canvas');cn.width=im.width;cn.height=im.height;
    const g=cn.getContext('2d');g.drawImage(im,0,0);const p=g.getImageData(0,0,im.width,im.height).data;
    const alpha=(x,y)=>p[(y*im.width+x)*4+3];const x=Math.floor(im.width*.5),y=Math.floor(im.height*.52);
    let l=x,r=x,top=y,b=y;
    while(l>0&&alpha(l,y)<20)l--;while(r<im.width-1&&alpha(r,y)<20)r++;
    while(top>0&&alpha(x,top)<20)top--;while(b<im.height-1&&alpha(x,b)<20)b++;
    const cx=(l+r)/2,cy=(top+b)/2;let radius=Math.min(r-l,b-top)/2;
    for(let py=0;py<im.height;py++)for(let px=0;px<im.width;px++)if(alpha(px,py)>20)radius=Math.min(radius,Math.hypot(px-cx,py-cy));
    const rim=[];
    for(let i=0;i<360;i++){
      const a=i*TAU/360;
      for(let d=0;d<im.width*.48;d++){
        const px=Math.round(cx+Math.cos(a)*d),py=Math.round(cy+Math.sin(a)*d);
        if(px<0||py<0||px>=im.width||py>=im.height)break;
        if(alpha(px,py)>20){rim.push(d);break}
      }
    }
    rim.sort((a,b)=>a-b);
    return {x:cx/im.width,y:cy/im.height,r:Math.max(0,radius-6)/im.width,portraitR:rim.length?rim[Math.floor(rim.length*.5)]/im.width:radius/im.width};
  }
  function base(c,th,kind,t,w,h){
    const im=art[th.id][kind],p=t/LOOP*TAU;
    if(kind==='avatar'){
      const ap=art[th.id].aperture,s=.86;c.save();c.translate(w*.5,h*.54);
      if(th.mode==='petals')c.rotate(Math.sin(p)*.007);
      c.drawImage(im,-w*ap.x*s,-h*ap.y*s,w*s,h*s);c.restore();
    }else{
      window.LorefyFrameMotion.paintPageArt(c,im,art[th.id].pageBounds,t,w,h,th.accent);
    }
  }
  function eye(c,x,y,w,h,angle,p,i){
    const open=.06+.94*(1-Math.pow(Math.max(0,Math.cos(p*2+i*.83)),18));
    c.save();c.translate(x,y);c.rotate(angle);const hh=h*open;
    c.fillStyle='#f1f4f5';c.strokeStyle='#090c10';c.lineWidth=w*.055;
    c.beginPath();c.moveTo(-w/2,0);c.quadraticCurveTo(0,-hh,w/2,0);c.quadraticCurveTo(0,hh,-w/2,0);c.closePath();c.fill();c.stroke();c.clip();
    const look=Math.sin(p+i*.8)*w*.12;c.fillStyle='#111820';c.beginPath();c.ellipse(look,0,w*.075,Math.max(h*.15,hh*.65),0,0,TAU);c.fill();
    c.fillStyle='#788b96';c.beginPath();c.ellipse(look-w*.018,-hh*.1,w*.016,hh*.18,0,0,TAU);c.fill();c.restore();
  }
  function gaze(c,th,kind,t,w,h){
    const p=t/LOOP*TAU;
    if(kind==='avatar'){
      const rr=w*(art[th.id].aperture.r*.86+.042);
      for(let i=0;i<5;i++){const a=-Math.PI/2+i*TAU/5;eye(c,w*.5+rr*Math.cos(a),h*.54+rr*Math.sin(a),w*(i===0?.135:.103),w*.047,a+Math.PI/2,p,i)}
    }else{
      const topY=window.LorefyFrameMotion.pageLayout(art[th.id].pageBounds,w,h).topY;
      for(let i=0;i<6;i++){const lower=i>=3,j=i%3;eye(c,w*(.26+j*.24),lower?h-34:topY+34,w*(j===1?.145:.108),w*.045,(j-1)*.11,p,i)}
    }
  }
  function signal(c,th,kind,t,w,h){
    const p=t/LOOP*TAU;c.save();c.lineCap='round';c.strokeStyle=th.accent;c.shadowColor=th.accent;c.shadowBlur=w*.014;
    if(kind==='avatar'){
      const rr=w*(art[th.id].aperture.r*.86+.037);c.lineWidth=w*.006;
      for(let i=0;i<2;i++){c.globalAlpha=.7;c.beginPath();c.arc(w*.5,h*.54,rr,p*(i?-1:1)+i*Math.PI,p*(i?-1:1)+i*Math.PI+.49);c.stroke();}
      c.shadowBlur=0;c.fillStyle=th.second;
      for(let i=0;i<2;i++)for(let j=0;j<3;j++){c.globalAlpha=.25+.75*(.5+.5*Math.sin(p*3+i+j));c.fillRect(w*(i?.86:.125),h*(.495+j*.032),w*.016,w*.009)}
    }else{
      const x=10,y=98,ww=w-20,hh=h-y-40;c.lineWidth=w*.006;
      const perimeter=2*(ww+hh)+(TAU-8)*w*.045,unit=perimeter/12;
      c.setLineDash([unit*.38,unit*.62]);c.lineDashOffset=-t/LOOP*perimeter;c.globalAlpha=.76;round(c,x,y,ww,hh,w*.045);c.stroke();
      c.setLineDash([]);c.shadowBlur=0;c.fillStyle=th.second;
      for(let i=0;i<4;i++){c.globalAlpha=.2+.7*(.5+.5*Math.sin(p*3+i));c.fillRect(i%2?w-20:8,i<2?18:h-22,w*.025,w*.006)}
    }c.restore();
  }
  function petal(c,x,y,r,a,alpha,col){
    c.save();c.translate(x,y);c.rotate(a);c.globalAlpha=alpha;c.fillStyle=col;
    c.beginPath();c.moveTo(0,-r);c.bezierCurveTo(r*.9,-r*.3,r*.7,r*.6,0,r);c.bezierCurveTo(-r*.35,r*.15,-r*.8,-r*.5,0,-r);c.fill();c.restore();
  }
  function petals(c,th,kind,t,w,h){
    const p=t/LOOP*TAU,n=kind==='avatar'?8:14;
    for(let i=0;i<n;i++){
      const progress=(i/n+t/LOOP)%1,alpha=smooth(0,.12,progress)*(1-smooth(.84,1,progress))*.85;let x,y;
      if(kind==='avatar'){x=w*(i%2?.86:.14)+Math.sin(p+i)*w*.024;y=h*(.20+progress*.67)}
      else{x=(i%2?w-10:10)+Math.sin(p+i)*2;y=h*(.18+progress*.64)}
      petal(c,x,y,w*(.008+.002*(i%3)),p*2+i,alpha,i%3?th.accent:th.second);
    }
  }
  function tongue(c,x,y,ww,hh,p,i,th,angle){
    c.save();c.translate(x,y);c.rotate(angle||0);const swing=Math.sin(p*3+i)*ww*.35,stretch=.82+.18*Math.sin(p*2+i);
    c.fillStyle=th.accent;c.beginPath();c.moveTo(-ww/2,0);c.bezierCurveTo(-ww*.6,-hh*.30,swing-ww*.28,-hh*.65,swing+ww*.13,-hh*stretch);c.bezierCurveTo(swing-ww*.08,-hh*.53,ww*.66,-hh*.36,ww/2,0);c.closePath();c.fill();
    c.fillStyle=th.second;c.beginPath();c.moveTo(-ww*.20,0);c.quadraticCurveTo(swing*.6,-hh*.39,swing,-hh*.63*stretch);c.quadraticCurveTo(ww*.10,-hh*.24,ww*.23,0);c.fill();c.restore();
  }
  function fire(c,th,kind,t,w,h){
    const p=t/LOOP*TAU;
    if(kind==='avatar'){
      const rr=w*(art[th.id].aperture.r*.86+.040);
      for(let i=0;i<5;i++){const a=-Math.PI/2+i*TAU/5;tongue(c,w*.5+rr*Math.cos(a),h*.54+rr*Math.sin(a),w*.055,w*.085,p,i,th,a+Math.PI/2)}
    }else{
      for(let i=0;i<4;i++)tongue(c,w*(.18+i*.215),h-8,w*.050,Math.min(48,h*.062),p,i,th,0);
      const topY=window.LorefyFrameMotion.pageLayout(art[th.id].pageBounds,w,h).topY;
      for(let i=0;i<2;i++)tongue(c,w*(i?.84:.16),topY+12,w*.040,Math.min(28,h*.035),p,i+4,th,Math.PI);
    }
    c.save();c.fillStyle=th.accent;
    for(let i=0;i<8;i++){
      const v=(i/8+t/LOOP)%1;let x,y;
      if(kind==='avatar'){const a=i*2.399+p;x=w*(.5+.38*Math.cos(a));y=h*(.54+.37*Math.sin(a))}
      else{x=i%2?w-10:10;y=h*(.84-v*.60)}
      c.globalAlpha=Math.sin(v*Math.PI)*.75;c.fillRect(x,y,w*.005,w*.015);
    }c.restore();
  }
  function overlay(c,th,kind,t,w,h){base(c,th,kind,t,w,h);c.save();if(kind==='page')window.LorefyFrameMotion.clipPageEffects(c,w,h);({eyes:gaze,signal,petals,fire})[th.mode](c,th,kind,t,w,h);c.restore();}
  const pending={};
  async function load(id){
    if(pending[id])return pending[id];const th=themes.find(a=>a.id===id);if(!th)throw Error('Unknown collection');
    pending[id]=(async()=>{const prefix='launch/decorations/originals/'+id+'/';const avatar=await loadImage(prefix+'avatar.png'),page=await loadImage(prefix+'page.png');art[id]={avatar,page,pageBounds:window.LorefyFrameMotion.measurePageArt(page),aperture:aperture(avatar)};
      if(th.mode==='fox'||th.mode==='sleep'){const fox=await loadImage(prefix+'fox.png');art[id].fox=fox;art[id].foxBounds=measure(fox).bounds;}return true;})();return pending[id];
  }
  window.LorefyOriginalRenderers=window.LorefyOriginalRenderers||{};
  window.LorefyOriginalRenderers["illustrated"]={load,layout(id,w,h){return window.LorefyFrameMotion.pageLayout(art[id].pageBounds,w,h);},paint(c,id,kind,t,w,h){if(art[id])overlay(c,themes.find(a=>a.id===id),kind,t%LOOP,w,h);}};
})();
