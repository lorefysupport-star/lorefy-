const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.LOREFY_PLAYWRIGHT_MODULE||'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(__dirname,'../output/playwright/frame-chrome');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true}),errors=[],results=[];
 try{
  const page=await browser.newPage({viewport:{width:440,height:956},deviceScaleFactor:2});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=profile&decorationLab=1&adaptive=1');
  await page.locator('.lf-profile-section-tabs').waitFor();
  await page.evaluate(()=>{
   const identity=JSON.parse(localStorage.getItem('lorefy.identity.v1')||'{}');
   identity.banner=location.origin+'/launch/brand/lorefy-reading-scene.jpg';
   localStorage.setItem('lorefy.identity.v1',JSON.stringify(identity));
   localStorage.setItem('lorefy.user.favorites.v2',JSON.stringify(window.LorefyPreviewReaders.findReader('qa-tester-01').favorite_work_ids));
  });
  for(const variant of [{lang:'ar',theme:'dark',layout:'normal'},{lang:'en',theme:'light',layout:'immersive'},{lang:'en',theme:'dark',layout:'immersive',safeTop:59}]){
   await page.evaluate(v=>{
    localStorage.setItem('lorefy.ui.lang.v1',JSON.stringify(v.lang));localStorage.setItem('lorefy.ui.theme.v1',v.theme);
    localStorage.setItem('lorefy.user.profileLayout.v1',JSON.stringify(v.layout));
   },variant);
   await page.reload();await page.locator('.lf-profile-section-tabs').waitFor();
   if(variant.safeTop)await page.addStyleTag({content:'.lf-profile-page { --profile-frame-safe-top:max(0px,59px) !important; }'});
  const packs=await page.evaluate(()=>window.LorefyProfileShop.offered.filter(p=>p.renderer).map(p=>p.id));
  for(const [width,height] of [[320,568],[375,812],[390,844],[440,956]]){
   await page.setViewportSize({width,height});
   let sharedHeader;
   for(const id of packs){
    await page.evaluate(async id=>{await window.LorefyProfileShop.applyDecoration(id,'all',JSON.parse(localStorage.getItem('lorefy.session.v1')).userId);document.querySelector('.lf-profile-page').scrollTop=0;},id);
    await page.waitForFunction(id=>document.querySelector('.lf-profile-page')?.dataset.decorationRendered?.includes(id)&&document.querySelector('.lf-decoration-page-border canvas')?.dataset.motionFrame>2,id);
    const geometry=await page.locator('.lf-profile-page').evaluate(p=>{
     const border=p.querySelector('.lf-decoration-page-border'),br=border.getBoundingClientRect(),cs=getComputedStyle(border);
     const top=Number.parseFloat(getComputedStyle(p).getPropertyValue('--profile-frame-top'))||0;
     const bottom=Number.parseFloat(getComputedStyle(p).getPropertyValue('--profile-frame-bottom'))||0;
     const safeTop=Number.parseFloat(cs.paddingTop)||0,safeBottom=Number.parseFloat(cs.paddingBottom)||0;
     const artBottom=br.bottom-safeBottom-2-bottom,artTop=br.top+safeTop+2+top;
     const ropeTop=parseFloat(getComputedStyle(p).getPropertyValue('--profile-frame-banner-top'));
     const buttons=[...p.querySelectorAll('.lf-profile-banner > div > button,.lf-profile-banner > button:not(.lf-profile-avatar)')];
     const controls=buttons.map(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button');return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,hit:hit===b,hitClass:hit?.className,ink:getComputedStyle(b.querySelector('svg')).color};});
     const nav=document.querySelector('.lf-bottom-nav').getBoundingClientRect();
     const image=p.querySelector('.lf-profile-banner > img').getBoundingClientRect();
     const bio=p.querySelector('.lf-profile-bio');
     const canvas=border.querySelector('canvas'),ctx=canvas.getContext('2d'),ratio=canvas.width/br.width;
     const footer=ctx.getImageData(Math.ceil(24*ratio),Math.ceil((br.height-safeBottom-38)*ratio),Math.floor((br.width-48)*ratio),Math.floor(26*ratio)).data;
     const footerClear=!footer.some((v,i)=>i%4===3&&v>12);
     const railPixels=ctx.getImageData(Math.ceil(24*ratio),Math.floor((br.height-11)*ratio),Math.floor((br.width-48)*ratio),Math.floor(8*ratio)).data;
     const footerArtCount=railPixels.filter((v,i)=>i%4===3&&v>24).length;
     const toolbar=p.querySelector('.lf-profile-banner > div:has(> button)');
     const shortcut=p.querySelector('.lf-shop-shortcut').getBoundingClientRect(),bell=p.querySelector('.lf-profile-banner > button:not(.lf-profile-avatar)').getBoundingClientRect();
     const shortcutGap=bell.left-shortcut.right;
     const controlLayer=Number(getComputedStyle(toolbar).zIndex),frameLayer=Number(getComputedStyle(border.parentElement).zIndex);
     return {top,bottom,artTop,artBottom,ropeTop,controls,shortcutGap,footerClear,footerArtCount,controlLayer,frameLayer,navBottom:nav.bottom,imageTop:image.top,imageHeight:image.height,profileTop:p.getBoundingClientRect().top,bioBottomMargin:Number.parseFloat(getComputedStyle(bio).marginBottom)};
    });
    assert.ok(geometry.top>0&&geometry.bottom>0,JSON.stringify({id,width,geometry}));
    const header=[geometry.imageTop,geometry.imageHeight,...geometry.controls.map(b=>b.top)];
    if(!sharedHeader)sharedHeader=header;
    assert.ok(header.every((value,i)=>Math.abs(value-sharedHeader[i])<1),'Every bundle must preserve identical banner and control dimensions');
    assert.ok(geometry.footerClear,JSON.stringify({id,width,geometry}));
    assert.ok(geometry.footerArtCount>20,'The bottom edge must carry the actual collection ornament');
    assert.ok(geometry.controlLayer>geometry.frameLayer,'Header backing must never paint over the buttons');
    assert.ok(Math.abs(geometry.shortcutGap-8)<1,'The decoration shortcut must sit immediately beside the bell');
    if(variant.safeTop)assert.ok(geometry.controls.every(b=>b.top>=variant.safeTop+12),JSON.stringify({id,width,geometry,message:'Native status-bar clearance shifts the complete header'}));
    assert.ok(geometry.controls.every(b=>b.top>=geometry.profileTop+12&&b.bottom<=geometry.imageTop-6&&b.width>=43.9&&b.height>=43.9&&b.hit),JSON.stringify({id,width,geometry}));
    assert.ok(Math.abs(geometry.imageTop-geometry.profileTop-geometry.ropeTop)<1,'The cover joins the frame rope, with no detached white toolbar');
    assert.ok(geometry.navBottom>=height-60,JSON.stringify({id,width,geometry}));
    assert.ok(geometry.imageHeight>=90,JSON.stringify({id,width,geometry}));
    assert.ok(geometry.top<=96.01&&geometry.bottom<=24.01,JSON.stringify({id,width,geometry}));
    if(variant.layout==='immersive')assert.ok(geometry.bioBottomMargin<=8,JSON.stringify({id,width,geometry}));
    assert.ok(geometry.controls.every(b=>b.ink!=='rgb(255, 255, 255)'),JSON.stringify({id,width,geometry}));
    results.push({id,width,height,...variant,...geometry});
    if(width===440&&['original-ribbon-bunny','original-mint-raccoon','original-maple-scout','original-midnight-bloom','original-twilight-den'].includes(id))await page.screenshot({path:path.join(out,(variant.safeTop?'safe-area-':'')+variant.theme+'-'+id+'.png')});
   }
  }
  const initialButtonTop=results.at(-1).controls[0].top;
  await page.locator('.lf-profile-page').evaluate(p=>p.scrollTop=400);
  const scrolled=await page.locator('.lf-profile-banner > div:has(> button)').evaluate(n=>{
   const r=n.getBoundingClientRect();return {top:r.top,scroll:n.closest('.lf-profile-page').scrollTop};
  });
  assert.ok(Math.abs(scrolled.top-initialButtonTop+scrolled.scroll)<1,'Cover controls scroll away instead of covering profile content');
  const geometryBefore=await page.locator('.lf-bottom-nav').evaluate(n=>n.getBoundingClientRect().bottom);
  await page.getByRole('button',{name:variant.lang==='ar'?'الرئيسية':'Home',exact:true}).click();
  await page.locator('.lf-profile-page').waitFor({state:'detached'});
  const withoutFrame=await page.locator('.lf-bottom-nav').evaluate(n=>n.getBoundingClientRect().bottom);
  assert.ok(Math.abs(withoutFrame-geometryBefore)<=1,'Profile decoration never lifts the navigation bar');
  await page.getByRole('button',{name:variant.lang==='ar'?'حسابي':'Profile',exact:true}).click();
  await page.locator('.lf-profile-section-tabs').waitFor();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks:results.length,results,errors},null,2));
  console.log(JSON.stringify({checks:results.length,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
