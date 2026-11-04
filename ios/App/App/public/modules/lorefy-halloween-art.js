/* Generated from the approved local Halloween authoring rig; no runtime framework. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LorefyHalloweenArt=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const IDS = ['H1', 'H2', 'H3', 'W2', 'W3', 'G2'];
const NAMES = {H1:'Ember Harvest',H2:'Ghost Parade',H3:'Crimson Masquerade',W2:'Poison Conservatory',W3:'Velvet Familiar',G2:'Silk Widow'};
const TAU = Math.PI * 2;

function motion(id, frame) {
  const p = (((frame % 240) + 240) % 240) / 240 * TAU;
  return {
    baseRotation:0, baseScale:1,
    sway: Math.sin(p) * (id === 'G2' ? 0.065 : 0.085),
    counter: Math.sin(p + 1.7) * 0.08,
    lift: Math.sin(p * 2 + 0.4) * 7,
    flap: 0.82 + 0.18 * Math.cos(p * 4),
    cloth: Math.sin(p * 2) * 6,
    blink: Math.pow(Math.max(0, Math.cos(p * 2 - 1.7)), 70),
    ear: Math.pow(Math.max(0, Math.sin(p * 3 + 0.5)), 12) * 0.19,
    glow: 0.65 + 0.22 * Math.sin(p * 5) + 0.1 * Math.sin(p * 11),
    phase:p,
  };
}

function nineSlices(r, w, h) {
  const [sx,sy,sw,sh]=r;
  const bx=sw*0.18, by=sh*0.19;
  const dx=Math.min(w*0.16,60), dy=Math.min(w*0.22,90);
  const xs=[0,bx,sw-bx,sw], ys=[0,by,sh-by,sh];
  const xd=[0,dx,w-dx,w], yd=[0,dy,h-dy,h];
  const out=[];
  for(let y=0;y<3;y++) for(let x=0;x<3;x++) out.push([sx+xs[x],sy+ys[y],xs[x+1]-xs[x],ys[y+1]-ys[y],xd[x],yd[y],xd[x+1]-xd[x],yd[y+1]-yd[y]]);
  return out;
}

function sprite(ctx,img,r,x,y,w,h,angle=0,px=0.5,py=0.5,scaleX=1,alpha=1) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(scaleX,1); ctx.globalAlpha=alpha;
  ctx.drawImage(img,...r,-w*px,-h*py,w,h); ctx.restore();
}

function lantern(ctx,img,r,x,y,w,h,angle,intensity) {
  sprite(ctx,img,r,x,y,w,h,angle);
  ctx.save();ctx.globalCompositeOperation='screen';
  sprite(ctx,img,r,x,y,w,h,angle,.5,.5,1,intensity*.22);
  ctx.restore();
}

// Only free fabric/tail layers deform. Attachment displacement is exactly zero.
function fabric(ctx,img,r,x,y,w,h,phase,amplitude=7,flip=false) {
  ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
  const strips=42;
  for(let i=0;i<strips;i++) {
    const v=i/strips, dh=h/strips;
    const bend=Math.sin(phase*2-v*5)*amplitude*v*v;
    ctx.drawImage(img,r[0],r[1]+r[3]*v,r[2],r[3]/strips,-w/2+bend,h*v,w,dh+0.65);
  }
  ctx.restore();
}

function tail(ctx,img,r,x,y,w,h,phase) {
  ctx.save();ctx.translate(x,y);ctx.rotate(.28);
  for(let i=0;i<40;i++) {
    const v=i/40, free=1-v;
    const bend=Math.sin(phase*2-free*4)*7*free*free;
    ctx.drawImage(img,r[0],r[1]+r[3]*v,r[2],r[3]/40,-w*.15+bend,-h*free,w,h/40+.6);
  }
  ctx.restore();
}

function bubbles(ctx,x,y,p,count=7,color='#a8f25d') {
  for(let i=0;i<count;i++) {
    const u=((p/TAU+i/count)%1+1)%1;
    const a=Math.sin(Math.PI*u)*0.8;
    ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=color;ctx.lineWidth=1.3;
    ctx.beginPath();ctx.arc(x+Math.sin(u*8+i)*14,y-u*75,1.5+u*4,0,TAU);ctx.stroke();ctx.restore();
  }
}

function details(ctx,img,rs,id,frame) {
  const m=motion(id,frame), p=m.phase;
  const [,,a,b,c,d]=rs;
  if(id==='H1') {
    lantern(ctx,img,a,174,119,102,103,m.sway,m.glow);
    lantern(ctx,img,d,370,407,83,99,-m.sway,1-m.glow*.5);
    sprite(ctx,img,b,105,317,64,64,m.counter,0.2,0.2);
    sprite(ctx,img,c,410,232,65,67,m.sway,0.5,0.1);
    bubbles(ctx,166,104,p,6,'#ffb04c');
  } else if(id==='H2') {
    sprite(ctx,img,a,370+Math.sin(p)*9,147+m.lift,113,125,m.sway);
    sprite(ctx,img,b,133-Math.sin(p+1)*8,389-m.lift,130,87,-m.sway);
    sprite(ctx,img,c,365+Math.sin(p+2)*6,399+Math.cos(p)*6,70,90,m.counter);
    fabric(ctx,img,d,100,183,44,120,p,8);
  } else if(id==='H3') {
    sprite(ctx,img,b,217,153,140,122,-0.19-m.sway,0.88,0.76,m.flap);
    sprite(ctx,img,a,303,153,140,134,0.19+m.sway,0.12,0.84,m.flap);
    sprite(ctx,img,c,260,419,18,55,m.counter,0.5,0);
    fabric(ctx,img,d,418,265,43,76,p,5);
  } else if(id==='W2') {
    sprite(ctx,img,a,260,422,118,106);
    ctx.save();ctx.strokeStyle=`rgba(188,255,69,${m.glow})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(260,388,28+Math.sin(p*4)*3,5,0,0,TAU);ctx.stroke();ctx.restore();
    bubbles(ctx,260,384,p,9);
    sprite(ctx,img,b,125,161,34,73,m.sway,0.5,0);
    sprite(ctx,img,b,395,202,28,60,m.counter,0.5,0);
    fabric(ctx,img,c,395,310,38,95,p,6);
  } else if(id==='W3') {
    // Tail behind the head; its root stays attached while the tip curls.
    tail(ctx,img,d,313,163,62,96,p);
    sprite(ctx,img,b,215,106,32,40,-0.35+m.ear,0.5,1);
    sprite(ctx,img,c,296,108,32,40,0.35-m.ear*0.7,0.5,1);
    sprite(ctx,img,a,260,107,155,148);
    if(m.blink>0.03) {
      ctx.save();ctx.strokeStyle='#16151c';ctx.lineWidth=2+7*m.blink;ctx.lineCap='round';
      for(const [x,y] of [[232,126],[267,133]]) {ctx.beginPath();ctx.moveTo(x-6,y);ctx.quadraticCurveTo(x,y+3,x+6,y);ctx.stroke();}
      ctx.restore();
    }
  } else if(id==='G2') {
    fabric(ctx,img,a,111,180,59,181,p,9);
    fabric(ctx,img,b,409,181,70,176,p+1.4,10);
    sprite(ctx,img,c,260,416,108,86,m.sway*0.35,0.5,0.5);
    sprite(ctx,img,d,260,449,14,38,m.counter,0.5,0);
  }
}



return Object.freeze({IDS,NAMES,motion,nineSlices,sprite,fabric,tail,lantern,bubbles,details});
});
