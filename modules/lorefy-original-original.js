/* Original illustrated overlay animation, independent of the Lorefy application. */
(() => {
  'use strict';
  const TAU = Math.PI * 2, LOOP = 8;
  const themes = [
    {id:'moon-fox',name:'Moon Fox',accent:'#91e5f5',second:'#ead08b',dark:'#15292f',type:'star'},
    {id:'ribbon-bunny',name:'Ribbon Bunny',accent:'#ed91b5',second:'#f5d5cb',dark:'#30202a',type:'heart'},
    {id:'ember-tiger',name:'Ember Tiger',accent:'#edaa51',second:'#f17342',dark:'#30241e',type:'ember'},
    {id:'mint-raccoon',name:'Mint Raccoon',accent:'#9cd7bf',second:'#d6e4df',dark:'#20312c',type:'leaf'}
  ];
  const art = {}, fields = {};
  function imageAt(path) {
    return new Promise((resolve,reject) => {
      const im = new Image(); im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Missing artwork: '+path)); im.src = path;
    });
  }
  function aperture(im) {
    const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
    const g=c.getContext('2d');g.drawImage(im,0,0);
    const p=g.getImageData(0,0,im.width,im.height).data;
    const alpha=(x,y)=>p[(y*im.width+x)*4+3];
    const x=Math.floor(im.width*.5),y=Math.floor(im.height*.52);
    let l=x,r=x,top=y,b=y;
    while(l>0&&alpha(l,y)<20)l--;while(r<im.width-1&&alpha(r,y)<20)r++;
    while(top>0&&alpha(x,top)<20)top--;while(b<im.height-1&&alpha(x,b)<20)b++;
    return {x:(l+r)/2/im.width,y:(top+b)/2/im.height,r:Math.min(r-l,b-top)/2/im.width};
  }
  function smooth(a,b,x) { const k = Math.max(0,Math.min(1,(x-a)/(b-a))); return k*k*(3-2*k); }
  function round(c,x,y,w,h,r) { c.beginPath(); c.roundRect(x,y,w,h,r); }
  function star(c,x,y,r,angle,alpha,col) {
    c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=alpha;c.fillStyle=col;
    c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*.24:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill();c.restore();
  }
  function token(c,x,y,r,ang,alpha,th) {
    if(th.type==='star'||th.type==='ember') return star(c,x,y,r,ang,alpha,th.accent);
    c.save();c.translate(x,y);c.rotate(ang);c.globalAlpha=alpha;c.fillStyle=th.accent;c.strokeStyle=th.second;c.lineWidth=.6;
    c.beginPath();
    if(th.type==='heart') {c.moveTo(0,r*.8);c.bezierCurveTo(-r*1.6,-r*.2,-r,-r*1.5,0,-r*.5);c.bezierCurveTo(r,-r*1.5,r*1.6,-r*.2,0,r*.8)}
    else {c.moveTo(-r,0);c.bezierCurveTo(-r*.3,-r*1.1,r*.9,-r*.7,r,0);c.bezierCurveTo(r*.1,r*.9,-r*.7,r*.8,-r,0)}
    c.closePath();c.fill();c.stroke();c.restore();
  }

  // Deform ornament regions only; the identity aperture remains geometrically stable.
  function deform(im,kind,t) {
    const key=im.src+kind;let f=fields[key];
    if(!f){const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;f=fields[key]={canvas,ctx:canvas.getContext('2d')};}
    if(f.time===t)return f.canvas;f.time=t;const c=f.ctx,w=im.width,h=im.height,p=t/LOOP*TAU;c.clearRect(0,0,w,h);
    const top=Math.round(h*(kind==='avatar'?.25:.14)),bottom=Math.round(h*(kind==='avatar'?.18:.12));
    c.drawImage(im,0,top,w,h-top-bottom,0,top,w,h-top-bottom);
    c.drawImage(im,0,0,w,top,Math.sin(p*2)*w*.008,Math.sin(p*2+.4)*h*.003,w,top);
    c.drawImage(im,0,h-bottom,w,bottom,Math.sin(p*2+1.4)*w*.009,h-bottom,w,bottom);return f.canvas;
  }
  function pageNineSlice(c,im,x,y,w,h) {
    const sh=im.height,sw=im.width,top=sh*.23,bottom=sh*.15,scale=w/sw;
    const dh1=top*scale,dh3=bottom*scale;
    c.drawImage(im,0,0,sw,top,x,y,w,dh1);
    c.drawImage(im,0,top,sw,sh-top-bottom,x,y+dh1,w,h-dh1-dh3);
    c.drawImage(im,0,sh-bottom,sw,bottom,x,y+h-dh3,w,dh3);
  }
  function overlay(c,th,kind,t,w,h) {
    const im=art[th.id][kind],animated=deform(im,kind,t);
    if(kind==='page') {const pad=w*.035;pageNineSlice(c,animated,pad,pad,w-pad*2,h-pad*2);}
    else {
      const ap=art[th.id].aperture,s=.86;
      c.drawImage(animated,w*(.5-ap.x*s),h*(.54-ap.y*s),w*s,h*s);
    }
    const phase=t/LOOP*TAU;
    for(let i=0;i<(kind==='page'?16:10);i++) {
      let x,y,r,ang;
      if(kind==='avatar') {
        const a=i*2.399963+phase*(i%2?1:-1);
        x=w*(.5+.375*Math.cos(a));y=h*(.54+.37*Math.sin(a));r=w*(.007+.002*(i%3));ang=a+phase;
      } else {
        const progress=(i/16+t/LOOP)%1;
        x=(i%2?w*.965:w*.035)+Math.sin(phase+i)*w*.009;
        y=h*(.07+progress*.86);r=w*(.009+.003*(i%3));ang=phase+i;
      }
      let alpha=.22+.66*(.5+.5*Math.sin(phase*2+i*1.9));
      if(kind==='page') {const p=(i/16+t/LOOP)%1;alpha*=smooth(0,.07,p)*(1-smooth(.93,1,p));}
      token(c,x,y,r,ang,alpha,th);
    }
  }
  const pending={};
  async function load(id){
    if(pending[id])return pending[id];const th=themes.find(a=>a.id===id);if(!th)throw Error('Unknown collection');
    pending[id]=(async()=>{const prefix='launch/decorations/originals/'+id+'/';const avatar=await imageAt(prefix+'avatar.png');art[id]={avatar,page:await imageAt(prefix+'page.png'),aperture:aperture(avatar)};
      if(th.mode==='fox'||th.mode==='sleep'){const fox=await imageAt(prefix+'fox.png');art[id].fox=fox;art[id].foxBounds=measure(fox).bounds;}return true;})();return pending[id];
  }
  window.LorefyOriginalRenderers=window.LorefyOriginalRenderers||{};
  window.LorefyOriginalRenderers["original"]={load,paint(c,id,kind,t,w,h){if(art[id])overlay(c,themes.find(a=>a.id===id),kind,t%LOOP,w,h);}};
})();
