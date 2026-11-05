(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LorefyCraftCrochet=api;})(typeof window==='undefined'?globalThis:window,function(root){
 'use strict';
 const IDS=Object.freeze(['garden','patchwork']),TAU=Math.PI*2;
 const NAMES={garden:['حديقة الغرز','Stitch Garden'],patchwork:['خيط وحكاية','Thread Tales']};
 function pose(id,seconds){
  if(!IDS.includes(id))throw Error('Unknown crochet frame');const p=((seconds%10)+10)%10/10*TAU,s=Math.sin;
  if(id==='garden')return {petal:.10*s(p*3)+.035*s(p*5),tassel:.14*s(p*2),leaf:.16*s(p*2-.8),bow:.07*s(p*2-1.3),phase:p};
  return {hook:-.09+.18*s(p*2),ball:.16*s(p*2-.6),square:.065*s(p*3),heart:.14*s(p*2-1),slack:14+8*s(p*2-1.2),phase:p};
 }
 function flex(id,t,v){if(v===0)return 0;const p=pose(id,t);return Math.sin(p.phase*2-v*4)*9*v*v;}
 function yarnPath(t){
  const p=pose('patchwork',t),hook=[473+Math.sin(p.hook)*150,390-Math.cos(p.hook)*150],ball=[426,487];
  return {start:ball,ball,end:hook,hook,controls:[[515+p.slack*.25,477],[528,300+p.slack]]};
 }
 function sprite(c,im,x,y,w,h,angle=0,px=.5,py=.5){c.save();c.translate(x,y);c.rotate(angle);c.drawImage(im,-w*px,-h*py,w,h);c.restore();}
 function textile(c,im,id,t,x,y,w,h,angle=0){
  c.save();c.translate(x,y);c.rotate(angle);
  for(let i=0;i<32;i++){const v=i/32,bend=flex(id,t,v)*w/50;c.drawImage(im,0,im.height*v,im.width,im.height/32,-w/2+bend,v*h,w,h/32+.7);}
  c.restore();
 }
 function bloom(c,rig,x,y,w,h,bend){
  const positions=rig.vertices.map(([u,v])=>{const dx=u-.5,dy=v-.5,d=Math.hypot(dx,dy),a=bend*Math.min(1,d*d*6)*Math.sin(Math.atan2(dy,dx)*3);return [.5+dx*Math.cos(a)-dy*Math.sin(a),.5+dx*Math.sin(a)+dy*Math.cos(a)];});
  c.save();c.translate(x-w/2,y-h/2);root.LorefyBitmapRig.paint(c,rig,positions,w,h);c.restore();
 }
 function strand(c,path){
  for(const [color,width,dash]of[['#a93670',4,[]],['#ee9bbb',1.6,[1.4,2.3]]]){
   c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.setLineDash(dash);c.beginPath();c.moveTo(...path.start);c.bezierCurveTo(...path.controls[0],...path.controls[1],...path.end);c.stroke();
  }c.setLineDash([]);
 }
 function avatar(c,e,id,t){
  const p=pose(id,t),s=e.cells;c.save();c.beginPath();c.rect(-20,-20,660,660);c.moveTo(448,330);c.arc(310,330,138,0,TAU);c.clip('evenodd');
  sprite(c,s[0],310,330,396,396);
  if(id==='garden'){
   textile(c,s[3],id,t,130,304,54,152,p.tassel);
   bloom(c,e.topper,310,151,170,170,p.petal);
   bloom(c,e.flower,477,414,82,82,-p.petal*.75);
   textile(c,s[5],id,t+.5,310,500,112,74,p.bow);
  }else{
   strand(c,yarnPath(t));
   bloom(c,e.topper,310,153,135,135,p.square);
   sprite(c,s[3],473,390,34,171,p.hook,.5,.9);
   sprite(c,s[4],399,500,82,82,p.ball);
   sprite(c,s[5],132,320,50,91,p.heart,.5,0);
  }c.restore();
 }
 function prepare(image,doc){const e=root.LorefyCraftObjects.prepare(image,doc);return {...e,topper:root.LorefyBitmapRig.prepare(e.cells[2],8),flower:root.LorefyBitmapRig.prepare(e.cells[4],8)};}
 return Object.freeze({IDS,NAMES,pose,flex,prepare,avatar,yarnPath,bloom});
});
