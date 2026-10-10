const test = require('node:test');
const assert = require('node:assert/strict');
const motion = require('../modules/lorefy-frame-motion.js');
const fs = require('node:fs');
const path = require('node:path');

test('transparent overlays cannot inherit the general image placeholder background', () => {
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-frame-motion.css'),'utf8');
  assert.match(css,/\.lf-frame-overlay\s*\{[^}]*background:\s*transparent/);
});

test('motion descriptors reject code, remote images and unbounded work', () => {
  const d = motion.normalize({motif:'script',color:'url(evil)',count:1e9,speed:100});
  assert.equal(d.motif,'spark'); assert.equal(d.count,12); assert.equal(d.speed,2);
  assert.equal(d.color,'#9fe4ed'); assert.equal(Object.isFrozen(d),true);
});
test('avatar motion leaves the portrait aperture clear throughout the loop', () => {
  const d = motion.normalize({motif:'heart',count:8});
  for(let t=0;t<20;t+=.25)for(const p of motion.sample(d,'avatar',160,160,t)) {
    const distance = Math.hypot(p.x-80,p.y-80);
    assert.ok(distance-p.size>=160*.39);
    assert.ok(p.x-p.size>=0 && p.x+p.size<=160);
  }
});
test('page motion stays in the shared 24px edge band, not the text area', () => {
  for(const [w,h] of [[320,740],[440,956],[144,220]])for(let t=0;t<15;t+=.5)
    for(const p of motion.sample(motion.normalize({motif:'leaf'}),'page',w,h,t)) {
      assert.ok(p.x-p.size>=0 && p.x+p.size<=w && p.y-p.size>=0 && p.y+p.size<=h);
      assert.ok(Math.min(p.x,w-p.x,p.y,h-p.y)+p.size<=24);
    }
});
test('motion advances continuously beyond the former four-second opening effect', () => {
  const d=motion.normalize({motif:'ghost'});
  assert.notDeepEqual(motion.sample(d,'avatar',144,144,0),motion.sample(d,'avatar',144,144,8));
});
function schedulerHarness() {
  let next=0;const jobs=new Map(),document={hidden:false};
  const env={document,requestAnimationFrame:fn=>{jobs.set(++next,fn);return next;},cancelAnimationFrame:id=>jobs.delete(id)};
  return {jobs,document,scheduler:motion.createScheduler(env),step:time=>{const [id,fn]=jobs.entries().next().value;jobs.delete(id);fn(time);}};
}
test('visible frames share one scheduler and offscreen frames stop work', () => {
  const s=schedulerHarness();let paints=0;
  const a=s.scheduler.register(()=>paints++),b=s.scheduler.register(()=>paints++);
  assert.equal(s.jobs.size,0);a.setVisible(true);b.setVisible(true);assert.equal(s.jobs.size,1);
  s.step(40);assert.equal(paints,2);a.setVisible(false);b.setVisible(false);assert.equal(s.jobs.size,0);
  a.dispose();b.dispose();assert.equal(s.scheduler.size,0);
});
test('hidden documents pause and scheduler cleanup cancels pending animation', () => {
  const s=schedulerHarness();let paints=0;const a=s.scheduler.register(()=>paints++);
  a.setVisible(true);s.document.hidden=true;s.scheduler.refresh();assert.equal(s.jobs.size,0);
  s.document.hidden=false;s.scheduler.refresh();s.step(40);assert.equal(paints,1);
  a.dispose();assert.equal(s.jobs.size,0);
});
test('calibrated portrait apertures exclude moving decorations',()=>{
  const calls=[];
  const ctx=new Proxy({}, {set(){return true;},get(_,key){return (...args)=>calls.push([key,...args]);}});
  motion.paint(ctx,160,160,8,{portrait:{cx:.5,cy:.586,size:.718}},'avatar');
  assert.ok(calls.some(c=>c[0]==='clip'&&c[1]==='evenodd'));
  assert.ok(calls.some(c=>c[0]==='arc'&&c[1]===80&&c[2]===160*.586&&c[3]===160*.718/2));
  assert.equal(motion.normalize({portrait:{cx:10,cy:-1,size:200}}).portrait,undefined);
});
