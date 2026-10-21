(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LorefyPhotoFramer=api;
})(typeof window!=='undefined'?window:null,function(root){
  'use strict';
  function geometry(width,height,ratio,zoom,x,y){
    zoom=Math.max(1,Math.min(4,Number(zoom)||1));
    var cropWidth=Math.min(width,height*ratio)/zoom,cropHeight=cropWidth/ratio;
    return {x:(width-cropWidth)*Math.max(0,Math.min(1,x)),y:(height-cropHeight)*Math.max(0,Math.min(1,y)),width:cropWidth,height:cropHeight};
  }
  function open(options){
    var doc=root.document,host=doc.querySelector('.lf-app')||doc.body,en=options.language==='en',avatar=options.slot==='avatar';
    var alive=true,ready=false,zoom=1,x=.5,y=.5,drag=null,previous=doc.activeElement,inert=[];
    var overlay=doc.createElement('div');overlay.className='lf-photo-framer';overlay.dir=en?'ltr':'rtl';
    var panel=doc.createElement('section');panel.className='lf-photo-framer-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',en?'Adjust photo framing':'ضبط إطار الصورة');
    var title=doc.createElement('h2');title.textContent=en?'Adjust your photo':'اضبط صورتك';panel.appendChild(title);
    var help=doc.createElement('p');help.textContent=en?'Move the photo inside the outline. Pinch to zoom.':'حرّك الصورة داخل الإطار. باعد بين إصبعين للتكبير.';panel.appendChild(help);
    var canvas=doc.createElement('canvas');canvas.width=600;canvas.height=600;canvas.tabIndex=0;canvas.className='lf-photo-framer-preview';canvas.setAttribute('aria-label',en?'Photo crop preview':'معاينة اقتصاص الصورة');panel.appendChild(canvas);
    var image=new root.Image(),context=canvas.getContext('2d'),ratio=avatar?1:1200/450,outline=null,pointers=new Map();
    function current(){return alive&&options.isCurrent();}
    function crop(){return geometry(image.naturalWidth||image.width,image.naturalHeight||image.height,ratio,zoom,x,y);}
    function paint(){
      if(!ready||!current())return;
      var w=image.naturalWidth||image.width,h=image.naturalHeight||image.height,g=crop();
      if(!outline){var fit=Math.min(canvas.width/w,canvas.height/h)*.9,base=geometry(w,h,ratio,1,.5,.5);outline={width:base.width*fit*.85,height:base.height*fit*.85};}
      var left=(canvas.width-outline.width)/2,top=(canvas.height-outline.height)/2,scale=outline.width/g.width;
      context.clearRect(0,0,canvas.width,canvas.height);
      context.drawImage(image,left-g.x*scale,top-g.y*scale,w*scale,h*scale);
      context.beginPath();context.rect(0,0,canvas.width,canvas.height);
      if(avatar)context.arc(canvas.width/2,canvas.height/2,outline.width/2,0,Math.PI*2);
      else context.rect(left,top,outline.width,outline.height);
      context.fillStyle='rgba(0,0,0,.5)';context.fill('evenodd');
      context.beginPath();
      if(avatar)context.arc(canvas.width/2,canvas.height/2,outline.width/2,0,Math.PI*2);
      else context.rect(left,top,outline.width,outline.height);
      context.strokeStyle='#fff';context.lineWidth=3;context.stroke();
    }
    var error=doc.createElement('p');error.setAttribute('role','status');panel.appendChild(error);
    var actions=doc.createElement('div');actions.className='lf-photo-framer-actions';
    function button(text,fn){var b=doc.createElement('button');b.type='button';b.textContent=text;b.addEventListener('click',fn);actions.appendChild(b);return b;}
    function dispose(){if(!alive)return;alive=false;observer.disconnect();overlay.remove();inert.forEach(function(entry){entry[0].inert=entry[1];});doc.removeEventListener('keydown',key);if(previous&&previous.isConnected)previous.focus();}
    function cancel(){if(!alive)return;var valid=options.isCurrent();dispose();if(valid)options.onCancel();}
    button(en?'Cancel':'إلغاء',cancel);
    button('−',function(){zoom=Math.max(1,zoom-.2);paint();}).setAttribute('aria-label',en?'Zoom out':'تصغير');
    button('+',function(){zoom=Math.min(4,zoom+.2);paint();}).setAttribute('aria-label',en?'Zoom in':'تكبير');
    button(en?'Reset':'إعادة ضبط',function(){zoom=1;x=y=.5;paint();});
    var apply=button(en?'Use this framing':'استخدام الإطار',function(){if(!ready||!current())return;try{var output=doc.createElement('canvas'),g=crop();output.width=avatar?512:1200;output.height=avatar?512:450;output.getContext('2d').drawImage(image,g.x,g.y,g.width,g.height,0,0,output.width,output.height);var result=output.toDataURL('image/jpeg',.9);dispose();options.onApply(result);}catch(_){error.textContent=en?'Could not prepare this photo. Try again.':'تعذر تجهيز الصورة. حاول مجددًا.';}});apply.disabled=true;
    panel.appendChild(actions);overlay.appendChild(panel);host.appendChild(overlay);Array.from(host.children).forEach(function(node){if(node!==overlay){inert.push([node,node.inert]);node.inert=true;}});
    // The crop belongs to the opening profile editor/account, including during auth changes.
    var observer=new root.MutationObserver(function(){if(alive&&!options.isCurrent())dispose();});observer.observe(host,{childList:true,subtree:true});
    function key(event){if(!current())return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();}if(event.key==='Tab'){var nodes=Array.from(panel.querySelectorAll('button:not([disabled]),input'));nodes.unshift(canvas);var first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}}}
    doc.addEventListener('keydown',key);
    function gesture(){
      var points=Array.from(pointers.values()),center=points.reduce(function(sum,p){return {x:sum.x+p.x/points.length,y:sum.y+p.y/points.length};},{x:0,y:0});
      return {center:center,distance:points.length>1?Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y):0};
    }
    function start(){var point=gesture();drag={x:point.center.x,y:point.center.y,distance:point.distance,zoom:zoom,startX:x,startY:y};}
    canvas.addEventListener('pointerdown',function(event){if(!ready||!current())return;event.preventDefault();canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});start();});
    canvas.addEventListener('pointermove',function(event){
      if(!pointers.has(event.pointerId)||!current())return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});var point=gesture();
      if(drag.distance&&point.distance)zoom=Math.max(1,Math.min(4,drag.zoom*point.distance/drag.distance));
      var g=crop(),rect=canvas.getBoundingClientRect(),scale=outline.width/g.width*rect.width/canvas.width;
      var dx=(image.naturalWidth||image.width)-g.width,dy=(image.naturalHeight||image.height)-g.height;
      if(dx>0)x=Math.max(0,Math.min(1,drag.startX-(point.center.x-drag.x)/scale/dx));
      if(dy>0)y=Math.max(0,Math.min(1,drag.startY-(point.center.y-drag.y)/scale/dy));paint();
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(type){canvas.addEventListener(type,function(event){pointers.delete(event.pointerId);if(pointers.size)start();else drag=null;});});
    canvas.addEventListener('wheel',function(event){if(!current()||!event.ctrlKey)return;event.preventDefault();zoom=Math.max(1,Math.min(4,zoom*Math.exp(-event.deltaY*.01)));paint();},{passive:false});
    canvas.addEventListener('keydown',function(event){
      if(!current())return;var handled=true;
      if(event.key==='+'||event.key==='=')zoom=Math.min(4,zoom+.1);
      else if(event.key==='-')zoom=Math.max(1,zoom-.1);
      else if(event.key==='ArrowLeft')x=Math.max(0,x-.02);
      else if(event.key==='ArrowRight')x=Math.min(1,x+.02);
      else if(event.key==='ArrowUp')y=Math.max(0,y-.02);
      else if(event.key==='ArrowDown')y=Math.min(1,y+.02);
      else handled=false;if(handled){event.preventDefault();paint();}
    });
    image.onload=function(){if(!current())return;ready=true;apply.disabled=false;paint();canvas.focus();};
    image.onerror=function(){if(current())error.textContent=en?'Could not open this photo. Cancel and choose another.':'تعذر فتح الصورة. ألغِ واختر صورة أخرى.';};image.src=options.src;
    return cancel;
  }
  return {geometry:geometry,open:open};
});
