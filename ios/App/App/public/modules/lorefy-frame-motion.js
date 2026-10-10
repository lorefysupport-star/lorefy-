(function(root,factory){
  const api=factory(root);
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.LorefyFrameMotion=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const motifs=new Set(['spark','leaf','heart','ghost','flower','bubble','rune']);
  const clamp=(value,low,high,fallback)=>Number.isFinite(Number(value))?Math.max(low,Math.min(high,Number(value))):fallback;
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
        angle=phase*Math.PI*2;const radius=Math.min(width,height)*.45;
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
    const descriptor=normalize(value),signature=JSON.stringify([descriptor,kind]);
    const old=mounted.get(element);if(old && old.signature===signature)return old.dispose;
    if(old)old.dispose();
    if(!scheduler){scheduler=createScheduler(root);root.document.addEventListener('visibilitychange',scheduler.refresh);}
    const canvas=root.document.createElement('canvas');canvas.className='lf-frame-motion';canvas.setAttribute('aria-hidden','true');
    const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
    element.appendChild(canvas);let width=0,height=0,frames=0;
    const ratio=Math.min(2,root.devicePixelRatio||1);
    function resize(){width=element.offsetWidth;height=element.offsetHeight;if(!width||!height)return;
      const style=root.getComputedStyle(element);
      canvas.style.left=-parseFloat(style.borderLeftWidth||0)+'px';canvas.style.top=-parseFloat(style.borderTopWidth||0)+'px';
      canvas.style.width=width+'px';canvas.style.height=height+'px';
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
    let io,ro,disposed=false;
    const handle=scheduler.register(time=>{if(!element.isConnected){dispose();return;}if(width&&height){paint(ctx,width,height,time,descriptor,kind);canvas.dataset.motionFrame=String(++frames);}});
    function dispose(){if(disposed)return;disposed=true;handle.dispose();if(io)io.disconnect();if(ro)ro.disconnect();canvas.remove();mounted.delete(element);}
    resize();if(width&&height)paint(ctx,width,height,0,descriptor,kind);
    if(root.IntersectionObserver){io=new root.IntersectionObserver(entries=>handle.setVisible(entries.some(e=>e.isIntersecting)),{threshold:0});io.observe(element);}else handle.setVisible(true);
    if(root.ResizeObserver){ro=new root.ResizeObserver(resize);ro.observe(element);}
    mounted.set(element,{signature,dispose});return dispose;
  }
  function sweep(){for(const [element,item]of mounted)if(!element.isConnected)item.dispose();}
  return Object.freeze({normalize,sample,paint,createScheduler,mount,sweep});
});
