(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LorefyCraftElves=api;})(typeof window==='undefined'?globalThis:window,function(root){
 'use strict';
 const IDS=Object.freeze(['dawn','dusk']),TAU=Math.PI*2;
 const NAMES={dawn:['مسافرة الفجر','Dawn Wayfarer'],dusk:['إلف الشفق','Aurora Sentinel']};
 const wrap=t=>((t%12)+12)%12;
 function pulse(t,center,width){let d=wrap(t-center+6)-6;return Math.abs(d)>=width?0:Math.cos(d/width*Math.PI/2)**2;}
 function flick(t,center){const d=wrap(t-center);return d>1.5?0:Math.sin(d*26)*Math.exp(-d*4.5)*(1-Math.exp(-d*30));}
 function pose(id,seconds){
  if(!IDS.includes(id))throw Error('Unknown elf');const t=wrap(seconds),p=t/12*TAU,s=Math.sin;
  if(id==='dawn')return {
   left:.035*s(p*3)+.30*pulse(t,1.3,.65)-.13*pulse(t,5.1,.7)+.22*flick(t,3.45)+.20*flick(t,8.1)+.23*pulse(t,10.2,.6),
   right:.03*s(p*3+.6)+.28*pulse(t,1.85,.65)-.12*pulse(t,5.7,.7)+.24*flick(t,3.9)+.21*flick(t,8.6)+.24*pulse(t,10.05,.6),
   tipLeft:.055*s(p*5)+.10*pulse(t,1.47,.65)+.09*flick(t,3.57),tipRight:.05*s(p*5+.9)+.09*pulse(t,1.69,.65)+.10*flick(t,3.8),
   pendant:.13*s(p*4-.6)+.15*flick(t,3.77),phase:p
  };
  return {
   left:.025*s(p*2)+.38*pulse(t,2.4,1.1)+.25*pulse(t,7.1,.85)+.15*flick(t,.8)+.15*flick(t,5.2)+.18*flick(t,10.3),
   right:.03*s(p*2+.8)+.36*pulse(t,3,1.1)+.27*pulse(t,7.6,.85)+.15*flick(t,1.2)+.16*flick(t,5.6)+.18*flick(t,10.7),
   tipLeft:.065*s(p*3)+.14*pulse(t,2.6,1.1)+.09*flick(t,5.38),tipRight:.06*s(p*3+.6)+.13*pulse(t,2.94,1.1)+.10*flick(t,5.6),
   pendant:.11*s(p*3-1.1)+.20*pulse(t,3.05,1),phase:p
  };
 }
 function bend(id,t,u,side){const p=pose(id,t),distance=side==='left'?1-u:u;if(distance===0)return 0;return p[side==='left'?'tipLeft':'tipRight']*distance*distance;}
 function sprite(c,im,x,y,w,h,angle=0,px=.5,py=.5){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(im,-w*px,-h*py,w,h);c.restore();}
 function ear(c,e,id,t,side,x,y,w,h,scale=1){
  const left=side==='left',p=pose(id,t),bone=p[side]*(left?1:-1),u0=left?.98:.02,v0=.9,rig=e.ears[left?0:1];
  c.save();c.translate(x,y);c.rotate(bone);c.scale(scale,scale);c.translate(-w*u0,-h*v0);
  const positions=rig.vertices.map(([u,v])=>[u,v+bend(id,t,u,side)]);
  root.LorefyBitmapRig.paint(c,rig,positions,w,h);c.restore();
  return {x:x+Math.sin(bone)*-8,y:y+Math.cos(bone)*8,angle:bone};
 }
 function prepare(image,doc){
  const base=root.LorefyCraftObjects.prepare(image,doc);
  return {...base,ears:[root.LorefyBitmapRig.prepare(base.cells[2],8),root.LorefyBitmapRig.prepare(base.cells[3],8)]};
 }
 function avatar(c,e,id,t){
  const p=pose(id,t),s=e.cells;c.save();
  c.beginPath();c.rect(-20,-20,660,660);c.moveTo(455,330);c.arc(310,330,145,0,TAU);c.clip('evenodd');
  sprite(c,s[0],310,330,390,390);
  const dusk=id==='dusk',w=dusk?134:127,h=dusk?156:62,y=dusk?294:285;
  const l=ear(c,e,id,t,'left',dusk?151:145,y,w,h),r=ear(c,e,id,t,'right',dusk?469:475,y,w,h);
  sprite(c,s[4],l.x+7,l.y,24,dusk?78:65,p.pendant+l.angle*.4,.5,0);
  sprite(c,s[4],r.x-7,r.y,24,dusk?78:65,-p.pendant+r.angle*.4,.5,0);
  sprite(c,s[5],310,132,dusk?65:127,dusk?61:47,0);
  c.restore();
 }
 return Object.freeze({IDS,NAMES,pose,bend,prepare,avatar,ear});
});
