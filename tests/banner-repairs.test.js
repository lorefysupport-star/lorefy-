const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const header=require('../modules/lorefy-profile-header.js');
const motion=require('../modules/lorefy-frame-motion.js');

test('Reader reserves the full decorated avatar and uses the measured edge inset',()=>{
  assert.equal(header.avatarSpace(171.27),186);
  assert.equal(header.avatarSpace(84),112);
  assert.equal(header.avatarSpace(NaN),112);
  const css=fs.readFileSync('styles/lorefy-reader-layout.css','utf8');
  assert.match(css,/inset-inline-start:\s*max\(var\(--reader-layout-inline\),var\(--profile-avatar-frame-inset,0px\)\)/);
  assert.match(css,/width:\s*calc\(100% - var\(--profile-header-avatar-space,112px\)\)/);
  assert.match(css,/margin-inline:\s*0\s*!important;\s*justify-self:\s*end\s*!important/,'LTR handles and RTL names must share the same grid column');
  const responsive=fs.readFileSync('styles/lorefy-profile-header.css','utf8');
  assert.match(responsive,/@media\s*\(max-width:\s*350px\)/);
  assert.match(responsive,/padding-top:\s*var\(--profile-header-identity-inset/);
});

test('legacy banner styling does not override saved focal positions',()=>{
  const css=fs.readFileSync('styles/lorefy-share-studio.css','utf8');
  const rule=css.match(/\.lf-profile-banner > img\s*\{([^}]+)\}/)[1];
  assert.doesNotMatch(rule,/object-position/);
});

test('editor preview maps final banner geometry without changing its focal position',()=>{
  assert.deepEqual(header.previewGeometry(320,254,132),{ratio:'320 / 254',textStart:'51.9685%',fadeStart:'23.622%',fadeEnd:'92.126%'});
  assert.equal(header.previewGeometry(0,254,132),null);
  const source=fs.readFileSync('modules/lorefy-profile-header.js','utf8');
  assert.match(source,/syncPreview/);
  const app=fs.readFileSync('uploads/files/lorefy-app.js','utf8');
  assert.match(app,/normalize\(yn\?profileLayoutDraft:profileLayout\)/);
  assert.match(app,/bannerPreviewHeight/);
});

test('narrow crests stay readable below the controls; wide headers keep their compact geometry',()=>{
  for(const width of [320,350,375])for(const crest of [.52,.9])for(const join of [.35,.72,.92]){
    const b={w:940,h:1400,crest,join},l=motion.pageLayout(b,width,800);
    const cw=b.w*crest*l.top/l.sourceTop;
    assert.ok(cw>=96,'crest must not collapse to the old 68px central gap');
    assert.ok(cw<=144.01);
    assert.ok(l.topY>=64,'ornament row must clear 44px controls starting at16px');
    assert.ok(Math.abs(l.topY+l.top*join-l.line)<.01,'image and ornament ribbon stay joined');
  }
  assert.equal(motion.pageLayout({w:940,h:1400,join:.72},440,956).line,64);
});

test('preview synchronization is idempotent and crop ratio follows the live draft geometry',()=>{
  const values=new Map();let writes=0;
  const preview={style:{getPropertyValue:k=>values.get(k)||'',setProperty:(k,v)=>{writes++;values.set(k,v);}}};
  const image={getBoundingClientRect:()=>({width:320,height:254})};
  const banner={querySelector:()=>image};
  const page={querySelector:s=>s.includes('banner')?banner:null,style:{getPropertyValue:()=> '132px'}};
  const doc={querySelector:s=>s==='.lf-customize-banner'?preview:image};
  header.syncPreview(doc,page);header.syncPreview(doc,page);
  assert.equal(writes,4);assert.equal(values.get('--profile-preview-ratio'),'320 / 254');
  assert.equal(header.cropRatio(doc),320/254);
  assert.equal(header.cropRatio({querySelector:()=>null}),1200/450);
});
