const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.LOREFY_PLAYWRIGHT_MODULE||'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(__dirname,'../output/playwright/original-frame-fit');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[],results=[];
 try{
  const page=await browser.newPage({viewport:{width:440,height:956},deviceScaleFactor:2});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=profile&decorationLab=1');
  await page.waitForFunction(()=>window.LorefyProfileShop?.offered.length===17);
  await page.locator('.lf-profile-section-tabs').waitFor();
  const packs=await page.evaluate(()=>window.LorefyProfileShop.offered.map(p=>({id:p.id,renderer:p.renderer})));
  if(!process.env.LOREFY_QA_VISITORS_ONLY)for(const layout of ['normal','immersive']){
   await page.evaluate(layout=>localStorage.setItem('lorefy.user.profileLayout.v1',JSON.stringify(layout)),layout);
   await page.reload();await page.locator('.lf-profile-section-tabs').waitFor();
  for(const [width,height] of [[320,568],[375,812],[390,844],[393,852],[414,896],[430,932],[440,956]]){
   await page.setViewportSize({width,height});
   for(const pack of packs){
    await page.evaluate(async id=>{
     const owner=window.LorefyBackend.user?.id||JSON.parse(localStorage.getItem('lorefy.session.v1')).userId;
     await window.LorefyProfileShop.applyDecoration(id,'all',owner);
     document.querySelector('.lf-profile-page').scrollTop=0;
    },pack.id);
    await page.waitForFunction(id=>document.querySelector('.lf-profile-page')?.dataset.decorationRendered.includes(id)&&document.querySelector('.lf-decoration-page-border .lf-frame-motion')?.dataset.motionFrame>2,pack.id);
    const fit=await page.evaluate(()=>{
     const border=document.querySelector('.lf-decoration-page-border'),canvas=border.querySelector('canvas');
     const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
     const sx=canvas.width/border.offsetWidth,sy=canvas.height/border.offsetHeight;
     let centre=0,left=0,right=0;
     for(let y=Math.floor(canvas.height*.3);y<canvas.height*.7;y++)for(let x=0;x<canvas.width;x++){
      if(pixels[(y*canvas.width+x)*4+3]<24)continue;
      const px=x/sx;
      if(px<22)left++;else if(px>border.offsetWidth-22)right++;else centre++;
     }
     const avatar=document.querySelector('.lf-decoration-avatar-frame canvas');
     const ap=avatar.getContext('2d').getImageData(0,0,avatar.width,avatar.height).data;
     let avatarCut=0;
     for(let y=0;y<avatar.height;y++)for(let x=0;x<avatar.width;x++)if((x===0||y===0||x===avatar.width-1||y===avatar.height-1)&&ap[(y*avatar.width+x)*4+3]>24)avatarCut++;
     const rect=border.getBoundingClientRect(),profile=document.querySelector('.lf-profile-page').getBoundingClientRect();
     const ar=avatar.getBoundingClientRect();
     const bio=document.querySelector('.lf-profile-bio');
     return {centre,left,right,width:border.offsetWidth,height:border.offsetHeight,
      edgeOffset:Math.abs(rect.left-profile.left),avatarFrames:Number(avatar?.dataset.motionFrame),
      pageFrames:Number(canvas.dataset.motionFrame),sx,sy,avatarCut,
      avatarFits:ar.left>=profile.left&&ar.right<=profile.right,
      bioClear:!bio||ar.bottom<=bio.getBoundingClientRect().top};
    });
    assert.equal(fit.centre,0,JSON.stringify({width,pack,fit}));
    assert.ok(fit.left>10&&fit.right>10,JSON.stringify({width,pack,fit}));
    assert.ok(fit.edgeOffset<1&&fit.avatarFrames>1);
    assert.equal(fit.avatarCut,0,JSON.stringify({width,layout,pack,fit}));
    assert.ok(fit.avatarFits,JSON.stringify({width,layout,pack,fit}));
    if(layout==='immersive')assert.ok(fit.bioClear,JSON.stringify({width,layout,pack,fit}));
    results.push({width,height,layout,id:pack.id,...fit});
    if(width===440&&['original-ribbon-bunny','original-maple-scout','original-crimson-current'].includes(pack.id)){
     await page.screenshot({path:path.join(out,layout+'-'+pack.id+'.png')});
    }
   }
  }
  }
  await page.evaluate(()=>{
   const original=window.LorefyBackend.getPublicProfile.bind(window.LorefyBackend);
   window.LorefyBackend.getPublicProfile=id=>id===window.__frameVisitor?.id?Promise.resolve(window.__frameVisitor):original(id);
  });
  for(const layout of ['normal','immersive'])for(const [width,height] of [[320,568],[375,812],[440,956]]){
   await page.setViewportSize({width,height});
   for(const pack of packs){
    await page.evaluate(({layout,id})=>{
     window.__frameVisitor={...window.LorefyPreviewReaders.findReader('qa-tester-02'),profile_layout:layout,
      profile_decoration:{frame:id,page:id,effect:null}};
     window.dispatchEvent(new CustomEvent('lorefy:open-reader-profile',{detail:window.__frameVisitor}));
    },{layout,id:pack.id});
    await page.waitForFunction(({layout,id})=>{
     const p=document.querySelector('.lf-reader-full');
     return p?.dataset.profileLayout===layout&&p.dataset.decorationRendered?.includes(id)&&p.querySelector('.lf-decoration-page-border canvas')?.dataset.motionFrame>2;
    },{layout,id:pack.id},{timeout:5000}).catch(async e=>{
     console.log({width,layout,id:pack.id,actual:await page.locator('.lf-reader-full').evaluate(p=>({data:{...p.dataset},snapshot:p.__lorefyProfileSnapshot?.profile_decoration}))});throw e;
    });
    const fit=await page.locator('.lf-reader-full').evaluate(p=>{
     const ar=p.querySelector('.lf-decoration-avatar-frame').getBoundingClientRect(),pr=p.getBoundingClientRect();
     const border=p.querySelector('.lf-decoration-page-border'),c=border.querySelector('canvas');
     const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,sx=c.width/border.offsetWidth;
     let centre=0;
     for(let y=Math.floor(c.height*.3);y<c.height*.7;y++)for(let x=Math.ceil(22*sx);x<c.width-22*sx;x++)if(a[(y*c.width+x)*4+3]>=24)centre++;
     return {centre,avatarFits:ar.left>=pr.left&&ar.right<=pr.right,overflow:p.scrollWidth>p.clientWidth};
    });
    assert.equal(fit.centre,0,JSON.stringify({width,layout,pack,fit}));
    assert.ok(fit.avatarFits&&!fit.overflow,JSON.stringify({width,layout,pack,fit}));
    results.push({visitor:true,width,height,layout,id:pack.id,...fit});
    await page.locator('.lf-reader-back').click();
    await page.locator('.lf-reader-full').waitFor({state:'detached'});
   }
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks:results.length,results,errors},null,2));
  console.log(JSON.stringify({checks:results.length,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
