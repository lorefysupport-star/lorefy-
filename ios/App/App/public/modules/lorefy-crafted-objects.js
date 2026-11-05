(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LorefyCraftObjects=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const IDS=Object.freeze(['witch','moon','ink','theatre']),TAU=Math.PI*2;
 const NAMES={witch:['قبعة منتصف الليل','Midnight Milliner'],moon:['باب القمر','Lunar Gate'],ink:['حبر حيّ','Living Manuscript'],theatre:['مسرح المخمل','Velvet Proscenium']};
 function pose(id,seconds){
  if(!IDS.includes(id))throw Error('Unknown frame');
  const p=((seconds%8)+8)%8/8*TAU,s=Math.sin;
  if(id==='witch')return {tip:s(p*2)*5+s(p*3)*2,pendant:s(p)*.14,cloth:s(p*2-.6)*7,shine:.45+.2*s(p*3),phase:p};
  if(id==='moon')return {orbit:p,pendant:s(p*2)*.11,crescent:s(p)*.16,shine:.6+.3*s(p*2),phase:p};
  if(id==='ink')return {write:(1-Math.cos(p))/2,nib:s(p*4)*.15,seal:s(p-.6)*.045,ink:.6+.3*s(p*3),phase:p};
  return {open:(1-Math.cos(p))/2,fold:s(p*2-.7)*6,tassel:s(p-.9)*.12,mask:s(p)*.045,phase:p};
 }
 function flex(id,t,v){const p=pose(id,t);if(v===0)return 0;return (id==='witch'?Math.sin(p.phase*2-v*4)*9:Math.sin(p.phase*2-v*5)*10)*v*v;}
 function sprite(c,image,x,y,w,h,angle=0,px=.5,py=.5,flip=1){c.save();c.translate(x,y);c.rotate(angle);c.scale(flip,1);c.drawImage(image,-w*px,-h*py,w,h);c.restore();}
 function cloth(c,image,x,y,w,h,t,id,flip=1){
  c.save();c.translate(x,y);c.scale(flip,1);
  for(let i=0;i<32;i++){const v=i/32,bend=flex(id,t,v)*w/50;c.drawImage(image,0,image.height*v,image.width,image.height/32,-w/2+bend,v*h,w,h/32+.6);}
  c.restore();
 }
 function hat(c,image,x,y,w,h,t){
  c.save();c.translate(x,y);
  for(let i=0;i<38;i++){const v=i/38,free=1-v;c.drawImage(image,0,image.height*v,image.width,image.height/38,-w/2+flex('witch',t,free)*w/250,-h+v*h,w,h/38+.65);}
  c.restore();
 }
 function portraitClip(c){c.beginPath();c.rect(-30,-30,580,580);c.moveTo(260+133,300);c.arc(260,300,133,0,TAU);c.clip('evenodd');}
 function inkPath(c,t,r=178){
  const p=pose('ink',t),end=-.5+p.write*1.7;
  c.strokeStyle='#bd9250';c.lineWidth=2.6;c.lineCap='round';c.beginPath();
  for(let i=0;i<=48;i++){const a=-.5+(end+.5)*i/48,x=260+Math.cos(a)*r,y=300+Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
  return {x:260+Math.cos(end)*r,y:300+Math.sin(end)*r,angle:end-.28+p.nib};
 }
 function avatar(c,e,id,t){
  const p=pose(id,t),s=e.cells;
  c.save();portraitClip(c);sprite(c,s[0],260,300,380,380);
  if(id==='witch'){
   cloth(c,s[4],115,305,49,146,t,id);
   sprite(c,s[3],403,285,42,144,p.pendant,.5,0);
   hat(c,s[2],248,209,300,204,t);
   sprite(c,s[5],113,415,38,38,Math.sin(p.phase)*.18);
  }else if(id==='moon'){
   sprite(c,s[2],382,150,116,127,p.crescent,.5,.75);
   sprite(c,s[3],113,325,37,134,p.pendant,.5,0);
   c.save();c.translate(260,300);c.rotate(p.orbit);sprite(c,s[5],0,-190,27,38,-p.orbit);c.restore();
   sprite(c,s[4],369,439,65,65,p.crescent);
  }else if(id==='ink'){
   const nib=inkPath(c,t);sprite(c,s[2],nib.x,nib.y,64,122,nib.angle,.05,.97);
   sprite(c,s[3],114,340,54,93,p.seal,.5,0);
   sprite(c,s[5],348,468,75,69);
   sprite(c,s[4],389,169,68,83,Math.sin(p.phase)*.11);
  }else{
   const spread=p.open*20;
   cloth(c,s[3],101-spread,210,53,204,t,id);
   cloth(c,s[3],419+spread,210,53,204,t+.6,id,-1);
   sprite(c,s[2],260,145,340,141,p.fold*.001);
   sprite(c,s[4],116,184,27,122,p.tassel,.5,0);
   sprite(c,s[4],404,184,27,122,-p.tassel,.5,0);
   sprite(c,s[5],260,478,64,66,p.mask);
  }
  c.restore();
 }
 function prepare(image,doc){
  const cells=[],alpha=[];
  for(let i=0;i<6;i++){
   const cell=doc.createElement('canvas');cell.width=cell.height=512;const g=cell.getContext('2d',{willReadFrequently:true});
   g.drawImage(image,(i%2)*image.width/2,Math.floor(i/2)*image.height/3,image.width/2,image.height/3,0,0,512,512);
   const px=g.getImageData(0,0,512,512);let left=512,right=-1,top=512,bottom=-1,solid=0;
   for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const a=(y*512+x)*4+3;if(px.data[a]<12)px.data[a]=0;
    if(px.data[a]>64){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);solid++;}
   }
   if(right<left)throw Error('Missing sprite '+i);g.putImageData(px,0,0);
   const crop=doc.createElement('canvas');crop.width=right-left+5;crop.height=bottom-top+5;
   crop.getContext('2d').drawImage(cell,left-2,top-2,crop.width,crop.height,0,0,crop.width,crop.height);cells.push(crop);alpha.push(solid);
  }
  return {cells,alpha};
 }
 return Object.freeze({IDS,NAMES,pose,flex,prepare,avatar});
});
