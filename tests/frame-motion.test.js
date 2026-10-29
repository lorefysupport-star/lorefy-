const test = require('node:test');
const assert = require('node:assert/strict');
const motion = require('../modules/lorefy-frame-motion.js');
const fs = require('node:fs');
const path = require('node:path');

test('original page art removes transparent margins and keeps side rails outside content',()=>{
  const bounds={x:40,y:50,w:940,h:1400};
  for(const [w,h] of [[144,220],[320,568],[375,812],[390,844],[440,956],[956,440]]){
    const calls=[],ctx={drawImage:(...args)=>calls.push(args),fillRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},rotate(){}};
    motion.paintPageArt(ctx,{width:1024,height:1536},bounds,0,w,h);
    assert.ok(calls.length>9,'The bottom must use matching ornament artwork, not a flat accent line');
    const bands=calls.map(args=>args.slice(1));
    const top=bands[2],left=bands[5],right=bands[6],bottom=bands[7];
    assert.equal(bands[0][0],bounds.x);assert.equal(bands[0][1],bounds.y);
    assert.ok(Math.abs(top[4]+top[6]/2-w/2)<1e-8);
    assert.ok(bottom[5]+bottom[7]<=h-2);
    assert.ok(top[7]<=(w>=280&&w<380?72:64) && bottom[7]<=24);
    for(const i of [0,2,4,7,8])assert.ok(Math.abs(bands[i][6]/bands[i][2]-bands[i][7]/bands[i][3])<1e-8,'Faces and corner ornaments must not be flattened');
    for(const start of [0]){
      assert.equal(bands[start][4],2);assert.equal(bands[start+4][4]+bands[start+4][6],w-2);
      for(let i=start;i<start+4;i++)assert.ok(Math.abs(bands[i][4]+bands[i][6]-bands[i+1][4])<1e-8,'Horizontal frame pieces must connect');
    }
    assert.ok(left[4]+left[6]<=20 && right[4]>=w-20);
    assert.equal(left[5],top[5]+top[7]);
    assert.ok(Math.abs(left[5]+left[7]-bands[7][5])<1e-8);
    assert.ok(calls.every(args=>args.slice(1).every(Number.isFinite)));
  }
});

test('frame layout exposes matching header and footer reservations',()=>{
  const layout=motion.pageLayout({x:40,y:50,w:940,h:1400},440,882);
  assert.equal(layout.top,64);assert.equal(layout.bottom,24);
  assert.equal(layout.topWidth,436);assert.equal(layout.bottomWidth,436);
  assert.equal(layout.rail,440*.035);
});

test('wide ears remain in the uniformly scaled crest, not stretched connector bands',()=>{
  const calls=[];
  motion.paintPageArt({drawImage:(...a)=>calls.push(a),fillRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},rotate(){}},{},{w:940,h:1400,crest:.9,join:.72},0,440,956);
  const centre=calls[2].slice(1);
  assert.equal(centre[2],940*.9);
  assert.ok(Math.abs(centre[6]/centre[2]-centre[7]/centre[3])<1e-8);
  assert.equal(calls[1][8],4);assert.equal(calls[3][8],4);
});

test('selected full-bleed layout does not reserve detached header or footer bands',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-frame-motion.css'),'utf8');
  assert.doesNotMatch(css,/--profile-frame-dock|--active-profile-frame-bottom/);
  assert.match(css,/top:var\(--profile-frame-banner-top\); left:0/);
  assert.doesNotMatch(css,/transparent var\(--profile-frame/);
});

test('shared banner geometry covers every decorated owner and public profile, not only originals',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-frame-motion.css'),'utf8');
  assert.doesNotMatch(css,/\.has-original-page-decoration/);
  assert.match(css,/\.has-page-decoration\s*\{[^}]*--profile-frame-banner-top/);
  assert.match(css,/\.has-page-decoration :is\(\.lf-profile-banner,\.lf-reader-banner\)/);
  assert.match(css,/\.has-page-decoration \.lf-decoration-page-border\s*\{[^}]*background-image:linear-gradient/);
});

test('switching away from an original removes inline header geometry before another frame mounts',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-frame-motion.js'),'utf8');
  assert.match(source,/function dispose\(\)[\s\S]*?\['--profile-frame-top','--profile-frame-bottom','--profile-frame-banner-top','--profile-frame-controls-top','--profile-controls-left','--profile-controls-right'\]\.forEach\(key=>page\.style\.removeProperty\(key\)\)/);
});

test('banner joins the rope instead of starting behind the crest',()=>{
  const layout=motion.pageLayout({w:940,h:1400,join:.72},440,882);
  assert.equal(layout.line,64);
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-frame-motion.css'),'utf8');
  assert.match(css,/button:not\(\.lf-profile-avatar\)/);
  assert.match(css,/\.lf-profile-networks\s*\{[^}]*grid-column:3/);
});

test('all artwork joins share banner and button geometry and never copy raster fragments into the footer',()=>{
  for(const join of [.35,.44,.72,.92]){
    const layout=motion.pageLayout({w:940,h:1400,join},440,956);
    assert.equal(layout.line,64);assert.equal(layout.controls,16);
    assert.ok(Math.abs(layout.topY+layout.top*join-64)<1e-8);
    assert.ok(layout.topY>=4,'Central crests can rise between the button pairs without clipping');
  }
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-frame-motion.js'),'utf8');
  assert.doesNotMatch(source,/seamY|destY\+destHeight-6/);
  assert.match(source,/clipPageEffects/);
  for(const name of ['original','illustrated','autumn']){
    assert.match(fs.readFileSync(path.join(__dirname,`../modules/lorefy-original-${name}.js`),'utf8'),/clipPageEffects/);
  }
});

test('central crest fits between two controls on either side on small phones',()=>{
  for(const width of [320,375,390,440])for(const crest of [.52,.9]){
    const bounds={w:940,h:1400,crest,join:.92};
    const layout=motion.pageLayout(bounds,width,956);
    const centreWidth=bounds.w*crest*layout.top/layout.sourceTop;
    if(width<380)assert.ok(layout.topY>=64&&centreWidth<=144.01,'Use a separate ornament row below both button groups');
    else assert.ok(centreWidth<=width-252+.01,'Leave a 4px gap between the crest and both button groups');
  }
});

test('decoration shortcut is beside the bell and the cover preserves its image height after raising',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-frame-motion.css'),'utf8');
  assert.match(css,/\.lf-shop-shortcut\s*\{[^}]*right:52px !important; top:0 !important/);
  assert.match(css,/clamp\(190px,calc\(100svh - 754px\),250px\)/);
  assert.match(css,/--profile-frame-banner-top:calc\(var\(--profile-frame-safe-top\) \+ 66px\)/);
});

test('autumn page animal stays centered between control pairs throughout its animation',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-original-autumn.js'),'utf8');
  const body=source.slice(source.indexOf('  function fox('),source.indexOf('  function fireflies('));
  const draw=new Function('art','window','TAU','LOOP',body+';return fox;')(
    {fixture:{fox:{},foxBounds:{x:0,y:0,w:100,h:100},pageBounds:{w:940,h:1400}}},
    {LorefyFrameMotion:motion},Math.PI*2,8);
  for(const width of [320,375,390,440])for(const time of [0,1,2,3,4,5,6,7]){
    const points=[];
    draw({save(){},restore(){},translate:(x,y)=>points.push([x,y]),rotate(){},scale(){},drawImage(){}},
      {id:'fixture',mode:'fox'},'page',time,width,956);
    assert.equal(points[0][0],width/2);
    assert.ok(Math.abs(points[0][1]-38)<=2,'Keep the animal level with the button centers');
  }
});

test('footer ornament uses uniform rotated side artwork below the home indicator',()=>{
  const calls=[],moves=[];
  const ctx={drawImage:(...a)=>calls.push(a),fillRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate:(...a)=>moves.push(a),rotate(){}};
  motion.paintPageArt(ctx,{}, {x:40,y:50,w:940,h:1400,left:90,right:95},0,440,956);
  assert.ok(calls.length>9);
  for(const draw of calls.slice(9)){
    assert.ok(Math.abs(draw[7]/draw[3]-draw[8]/draw[4])<1e-8,'Do not flatten or stretch the footer ornament');
    assert.ok(draw[7]<=10);
  }
  assert.ok(moves.every(([,y])=>y===954));
});

test('page animation leaves header controls and home indicator clear',()=>{
  const rectangles=[];
  motion.clipPageEffects({beginPath(){},rect:(...a)=>rectangles.push(a),clip(){}},440,956);
  assert.deepEqual(rectangles,[[0,64,440,852],[124,0,192,64],[0,0,20,956],[420,0,20,956]]);
});

test('upper controls render above the opaque frame header backing',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-frame-motion.css'),'utf8');
  assert.match(css,/left:26px !important; gap:8px !important; z-index:11 !important/);
  assert.match(css,/right:26px !important; z-index:11 !important/);
});

test('native safe area shifts the entire header instead of parsing an unresolved CSS expression',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-frame-motion.css'),'utf8');
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-frame-motion.js'),'utf8');
  assert.match(css,/padding-top:var\(--profile-frame-safe-top,0px\); padding-bottom:0/);
  assert.match(css,/data-lorefy-native-shell='true'/);
  assert.match(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/setAttribute\('data-lorefy-native-shell', nativeApp/);
  assert.doesNotMatch(source,/parseFloat\(root\.getComputedStyle\(page\)\.getPropertyValue\('--nc-top'\)\)/);
});

test('all original renderers use shared page geometry instead of independent insets',()=>{
  for(const name of ['original','illustrated','autumn']){
    const source=fs.readFileSync(path.join(__dirname,`../modules/lorefy-original-${name}.js`),'utf8');
    assert.match(source,/LorefyFrameMotion\.paintPageArt/);
    assert.match(source,/LorefyFrameMotion\.measurePageArt/);
    assert.doesNotMatch(source,/const pad=w\*\./);
  }
});

test('page and avatar ornaments remain intact instead of cutting through their illustrated faces',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../modules/lorefy-original-original.js'),'utf8');
  assert.doesNotMatch(source,/deform\(/);
  assert.match(source,/paintPageArt\(c,im,/);
  assert.match(source,/c\.drawImage\(im,w\*/);
});

test('avatar clearance does not add the same empty space below the biography',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../styles/lorefy-profile-sections.css'),'utf8');
  assert.match(css,/\.lf-profile-identity:has\(\.lf-profile-section-tabs\) > \.lf-profile-bio\s*\{\s*margin: var\(--profile-frame-bio-gap,8px\) 0 8px !important/);
});

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

test('avatar particle silhouettes and their glow fit inside the canvas',()=>{
  for(const size of [144,160,220])for(let t=0;t<12;t+=.25){
    for(const p of motion.sample({motif:'heart'},'avatar',size,size,t)){
      const extent=p.size*1.25+2;
      assert.ok(p.x-extent>=0&&p.x+extent<=size&&p.y-extent>=0&&p.y+extent<=size);
    }
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
