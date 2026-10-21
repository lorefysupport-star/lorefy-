const test=require('node:test'),assert=require('node:assert/strict');
const {geometry}=require('../modules/lorefy-photo-framer');
test('avatar crop preserves square aspect and supports the full horizontal range',()=>{
 assert.deepEqual(geometry(1600,800,1,1,0,.5),{x:0,y:0,width:800,height:800});
 assert.equal(geometry(1600,800,1,1,1,.5).x,800);
});
test('banner crop uses actual output ratio and allows zoom and vertical position',()=>{
 const g=geometry(1200,1600,1200/450,2,.5,1);
 assert.equal(g.width,600);assert.equal(g.height,225);assert.equal(g.x,300);assert.equal(g.y,1375);
});
test('framing stays within source pixels at either orientation and control limits',()=>{
 for(const [w,h]of [[1600,400],[400,1600],[800,800]])for(const ratio of [1,1200/450])for(const zoom of [-1,1,2,4,10])for(const x of [-1,0,.5,1,2]){
  const g=geometry(w,h,ratio,zoom,x,x);assert.ok(g.x>=0&&g.y>=0);assert.ok(g.x+g.width<=w+1e-8&&g.y+g.height<=h+1e-8);assert.ok(Math.abs(g.width/g.height-ratio)<1e-8);
 }
});

function ui(){
 const fs=require('node:fs'),vm=require('node:vm');const canvases=[],images=[];let applied=null,cancelled=0;
 function element(tag){const e={tag,children:[],listeners:{},style:{},setAttribute(k,v){this[k]=v;},appendChild(n){this.children.push(n);return n;},addEventListener(k,fn){this.listeners[k]=fn;},remove(){this.removed=true;},focus(){},setPointerCapture(){},getBoundingClientRect(){return{width:600,height:600};}};
 if(tag==='canvas'){e.draws=[];e.getContext=()=>({clearRect(){},beginPath(){},rect(){},arc(){},fill(){},stroke(){},drawImage(...args){e.draws.push(args);}});e.toDataURL=()=>`crop:${e.width}x${e.height}`;canvases.push(e);}return e;}
 const host=element('div'),doc={activeElement:null,body:host,querySelector:()=>host,createElement:element,addEventListener(){},removeEventListener(){}};
 const win={document:doc,Image:class{constructor(){this.naturalWidth=1200;this.naturalHeight=800;images.push(this);}},MutationObserver:class{observe(){}disconnect(){}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../modules/lorefy-photo-framer'),'utf8'),{window:win});
 win.LorefyPhotoFramer.open({src:'fixture',slot:'avatar',language:'en',isCurrent:()=>true,onApply:v=>applied=v,onCancel:()=>cancelled++});images[0].onload();
 function all(e=host){return[e,...e.children.flatMap(all)];}
 return{canvases,host,applied:()=>applied,cancelled:()=>cancelled,all,button:text=>all().find(e=>e.tag==='button'&&e.textContent===text)};
}
test('photo framing has a full-image stage without sliders and dragging changes the applied crop',()=>{
 const h=ui(),stage=h.canvases[0];assert.equal(h.all().some(e=>e.tag==='input'),false);
 stage.listeners.pointerdown({pointerId:1,clientX:300,clientY:300,preventDefault(){}});
 stage.listeners.pointermove({pointerId:1,clientX:0,clientY:300});
 h.button('Use this framing').listeners.click();const output=h.canvases[1],args=output.draws[0];
 assert.equal(h.applied(),'crop:512x512');assert.equal(args[1],400);assert.equal(args[3],800);
});
test('two-finger pinch enlarges the image while the output frame stays square',()=>{
 const h=ui(),stage=h.canvases[0];
 for(const [pointerId,clientX]of [[1,250],[2,350]])stage.listeners.pointerdown({pointerId,clientX,clientY:300,preventDefault(){}});
 stage.listeners.pointermove({pointerId:2,clientX:450,clientY:300});
 h.button('Use this framing').listeners.click();const args=h.canvases[1].draws[0];assert.equal(args[3],400);assert.equal(args[4],400);
});
