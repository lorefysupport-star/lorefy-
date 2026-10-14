const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const source = html.slice(html.indexOf('function installImageResilience(){'), html.indexOf('function mountApp(){'));
function setup() {
  let mutation, intersection, scans = 0;
  const timers = [], frames = [], observed = new Set();
  const image = (picker = false) => ({tagName:'IMG',nodeType:1,isConnected:true,dataset:{},style:{},loading:'lazy',complete:false,naturalWidth:0,src:'https://example.org/cover.jpg',
    getAttribute(name){return name === 'src' ? this.src : '';},hasAttribute(name){return picker && name === 'data-cover-picker-image';},closest(){return null;},
    getBoundingClientRect(){throw Error('synchronous layout forbidden');},addEventListener(name,fn){this[name]=fn;},removeAttribute(){},dispatchEvent(event){this.dispatched=event.type;},querySelectorAll(){return [];}});
  const first = image();
  const context = {Set,Event,encodeURIComponent,document:{documentElement:{},querySelectorAll(){scans++;return [first];}},
    IntersectionObserver:class{constructor(fn){intersection=fn;}observe(img){observed.add(img);}unobserve(img){observed.delete(img);}},
    MutationObserver:class{constructor(fn){mutation=fn;}observe(){}},
    window:{IntersectionObserver:true,setTimeout(fn){timers.push(fn);},requestAnimationFrame(fn){frames.push(fn);}}};
  vm.runInNewContext(source+'installImageResilience();',context);
  return {first,image,timers,frames,observed,intersect(img){intersection([{target:img,isIntersecting:true}]);},mutate(records){mutation(records);},get scans(){return scans;}};
}
test('lazy fallbacks wait for visibility without layout reads; failures retain fallback',()=>{
 const s=setup();assert.equal(s.timers.length,0);assert.ok(s.observed.has(s.first));s.intersect(s.first);assert.equal(s.timers.length,1);s.timers[0]();assert.match(s.first.src,/^data:image/);
});
test('new images are guarded without rescanning the document; picker errors remain errors',()=>{
 const s=setup();const picker=s.image(true);s.mutate([{type:'childList',addedNodes:[picker]}]);s.frames.shift()();assert.equal(s.scans,1);s.intersect(picker);s.timers[0]();assert.equal(picker.dispatched,'error');assert.match(picker.src,/^https:/);
 s.mutate([{type:'childList',addedNodes:[{nodeType:3}]}]);assert.equal(s.frames.length,0);
});
