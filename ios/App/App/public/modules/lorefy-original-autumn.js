/* Original raster ornaments with an editable, deterministic 8-second loop. */
(() => {
  'use strict';
  const TAU=Math.PI*2,LOOP=8;
  const themes=[
    {id:'maple-scout',name:'Maple Scout',accent:'#f5ae56',second:'#d7523d',dark:'#533b34',mode:'fox'},
    {id:'twilight-den',name:'Twilight Den',accent:'#f0c779',second:'#c47988',dark:'#493847',mode:'sleep'},
    {id:'amber-drift',name:'Amber Drift',accent:'#edaa40',second:'#cb593b',dark:'#443d32',mode:'leaves'},
    {id:'woodland-lantern',name:'Woodland Lantern',accent:'#e9ba66',second:'#78977b',dark:'#303f39',mode:'lantern'}
  ];
  const art={};
  const smooth=(a,b,x)=>{const v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v)};
  const round=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r)};
  const loadImage=path=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Missing artwork: '+path));im.src=path});
  function measure(im){
    const cn=document.createElement('canvas');cn.width=im.width;cn.height=im.height;
    const g=cn.getContext('2d');g.drawImage(im,0,0);const p=g.getImageData(0,0,im.width,im.height).data;
    const alpha=(x,y)=>p[(y*im.width+x)*4+3];
    let left=im.width,right=0,top=im.height,bottom=0;
    for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(alpha(x,y)>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
    const cx=im.width*.5,cy=im.height*.52,rim=[];
    for(let i=0;i<360;i++){
      const a=i*TAU/360;
      for(let d=0;d<im.width*.48;d++){
        const x=Math.round(cx+Math.cos(a)*d),y=Math.round(cy+Math.sin(a)*d);
        if(x<0||y<0||x>=im.width||y>=im.height)break;
        if(alpha(x,y)>20){rim.push(d);break}
      }
    }
    rim.sort((a,b)=>a-b);
    return {x:.5,y:.52,r:rim.length?rim[Math.floor(rim.length*.5)]/im.width:.36,bounds:{x:left,y:top,w:right-left+1,h:bottom-top+1}};
  }
  function base(c,th,kind,t,w,h){
    const im=art[th.id][kind],p=t/LOOP*TAU;
    if(kind==='avatar'){
      const s=.86,ap=art[th.id].aperture;c.save();c.translate(w*.5,h*.54);c.rotate(Math.sin(p)*.005);
      c.drawImage(im,-w*ap.x*s,-h*ap.y*s,w*s,h*s);c.restore();
    }else{
      window.LorefyFrameMotion.paintPageArt(c,im,art[th.id].pageBounds,t,w,h,th.accent);
    }
  }
  function leaf(c,x,y,r,a,col,opacity,maple){
    c.save();c.translate(x,y);c.rotate(a);c.scale(r,r);c.globalAlpha=opacity;c.fillStyle=col;c.beginPath();
    if(maple){
      c.moveTo(0,-1);c.lineTo(.20,-.46);c.lineTo(.51,-.73);c.lineTo(.47,-.23);c.lineTo(.92,-.35);c.lineTo(.71,.02);c.lineTo(1,.21);c.lineTo(.33,.46);c.lineTo(.20,.72);c.lineTo(0,.53);c.lineTo(-.20,.72);c.lineTo(-.33,.46);c.lineTo(-1,.21);c.lineTo(-.71,.02);c.lineTo(-.92,-.35);c.lineTo(-.47,-.23);c.lineTo(-.51,-.73);c.lineTo(-.20,-.46);
    }else{
      c.moveTo(0,-1);c.bezierCurveTo(.75,-.49,.69,.25,0,.75);c.bezierCurveTo(-.69,.25,-.75,-.49,0,-1);
    }
    c.closePath();c.fill();c.strokeStyle='#694937';c.lineWidth=.08;c.beginPath();c.moveTo(0,-.62);c.lineTo(0,1.12);c.stroke();c.restore();
  }
  function falling(c,th,kind,t,w,h){
    const p=t/LOOP*TAU,n=kind==='avatar'?9:14;
    for(let i=0;i<n;i++){
      const v=(i/n+t/LOOP)%1,fade=smooth(0,.12,v)*(1-smooth(.85,1,v));
      let x,y;
      if(kind==='avatar'&&th.mode==='leaves'){
        const a=i*2.399+p,rr=w*(art[th.id].aperture.r*.86+.047);
        x=w*.5+rr*Math.cos(a);y=h*.54+rr*Math.sin(a);
      }else if(kind==='avatar'){
        x=w*(i%2?.86:.14)+Math.sin(p+i)*w*.019;y=h*(.19+v*.66);
      }else{
        x=(i%2?w-10:10)+Math.sin(p+i)*2;y=h*(.14+v*.71);
      }
      leaf(c,x,y,w*(.012+.003*(i%3)),p*2+i,i%3?th.accent:th.second,fade*.9,th.mode!=='sleep'&&i%3!==0);
    }
  }
  function fox(c,th,kind,t,w,h){
    const im=art[th.id].fox;if(!im)return;
    const b=art[th.id].foxBounds,p=t/LOOP*TAU,sleep=th.mode==='sleep';
    let width=w*(sleep?.35:.28),cx=w*(sleep?.69:.50),bottom=h*(sleep?.91:.24),maxH=h*.215;
    if(kind==='page'){
      width=sleep?w*.22:Math.min(w*.20,Math.max(28,w-264));
      cx=sleep?w*.74:w*.5;bottom=h-8;maxH=sleep?48:44;
    }
    const scale=Math.min(width/b.w,maxH/b.h),ww=b.w*scale,hh=b.h*scale;
    const breath=1+.012*Math.sin(p*2),bob=(kind==='page'&&!sleep?2:(sleep?.002:.005)*h)*Math.sin(p*2);
    const cy=kind==='page'&&!sleep?38:bottom-hh*.5;
    c.save();c.translate(cx,cy+bob);c.rotate(Math.sin(p)*(sleep?.009:.025));c.scale(1,breath);
    c.drawImage(im,b.x,b.y,b.w,b.h,-ww*.5,-hh*.5,ww,hh);c.restore();
  }
  function fireflies(c,th,kind,t,w,h){
    const p=t/LOOP*TAU;c.save();
    for(let i=0;i<7;i++){
      const v=(i/7+t/LOOP)%1;let x,y;
      if(kind==='avatar'){const a=i*2.399+p;x=w*(.5+.385*Math.cos(a));y=h*(.54+.38*Math.sin(a))}
      else{x=(i%2?w-10:10)+Math.sin(p*2+i)*2;y=h*(.84-v*.68)}
      c.globalAlpha=Math.sin(v*Math.PI)*(.35+.25*Math.sin(p*3+i));c.fillStyle=th.accent;
      c.beginPath();c.arc(x,y,w*.004,0,TAU);c.fill();
    }
    c.restore();
  }
  function lantern(c,th,kind,t,w,h){
    const p=t/LOOP*TAU,x=kind==='avatar'?w*.775:w-12,y=kind==='avatar'?h*.80:h-44,size=w*.026;
    c.save();c.translate(x,y);c.rotate(Math.sin(p)*.06);
    c.globalAlpha=.65+.20*Math.sin(p*3)+.08*Math.sin(p*5);c.fillStyle='#f7c572';
    c.beginPath();c.moveTo(-size*.18,size*.15);c.quadraticCurveTo(-size*.5,-size*.14,Math.sin(p*3)*size*.1,-size*.6);c.quadraticCurveTo(size*.3,-size*.13,size*.18,size*.15);c.closePath();c.fill();c.restore();
  }
  function overlay(c,th,kind,t,w,h){
    base(c,th,kind,t,w,h);c.save();if(kind==='page')window.LorefyFrameMotion.clipPageEffects(c,w,h);falling(c,th,kind,t,w,h);
    if(th.mode==='fox'||th.mode==='sleep')fox(c,th,kind,t,w,h);
    if(th.mode==='sleep'||th.mode==='lantern')fireflies(c,th,kind,t,w,h);
    if(th.mode==='lantern')lantern(c,th,kind,t,w,h);
    c.restore();
  }
  const pending={};
  async function load(id){
    if(pending[id])return pending[id];const th=themes.find(a=>a.id===id);if(!th)throw Error('Unknown collection');
    pending[id]=(async()=>{const prefix='launch/decorations/originals/'+id+'/';const avatar=await loadImage(prefix+'avatar.png'),page=await loadImage(prefix+'page.png');art[id]={avatar,page,pageBounds:window.LorefyFrameMotion.measurePageArt(page),aperture:measure(avatar)};
      if(th.mode==='fox'||th.mode==='sleep'){const fox=await loadImage(prefix+'fox.png');art[id].fox=fox;art[id].foxBounds=measure(fox).bounds;}return true;})();return pending[id];
  }
  window.LorefyOriginalRenderers=window.LorefyOriginalRenderers||{};
  window.LorefyOriginalRenderers["autumn"]={load,layout(id,w,h){return window.LorefyFrameMotion.pageLayout(art[id].pageBounds,w,h);},paint(c,id,kind,t,w,h){if(art[id])overlay(c,themes.find(a=>a.id===id),kind,t%LOOP,w,h);}};
})();
