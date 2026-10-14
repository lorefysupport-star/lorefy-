const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.LOREFY_PLAYWRIGHT_MODULE||'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(__dirname,'../output/playwright/all-profile-banners');fs.mkdirSync(out,{recursive:true});

async function geometry(page,selector){
 return page.locator(selector).evaluate(p=>{
  const rect=p.getBoundingClientRect(),banner=p.querySelector('.lf-profile-banner,.lf-reader-banner'),image=banner.querySelector('img').getBoundingClientRect();
  const buttons=[...banner.querySelectorAll('button:not(.lf-profile-avatar)')].map(b=>{
   const r=b.getBoundingClientRect();return {top:r.top-rect.top,width:r.width,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b};
  });
  const avatar=p.querySelector('.lf-decoration-avatar-frame').getBoundingClientRect();
  return {imageTop:image.top-rect.top,imageHeight:image.height,bannerHeight:banner.getBoundingClientRect().height,
   buttons,avatarFits:avatar.left>=rect.left&&avatar.right<=rect.right,overflow:p.scrollWidth>p.clientWidth,overflowX:getComputedStyle(p).overflowX,
   overflowNodes:p.scrollWidth>p.clientWidth?[...p.querySelectorAll('*')].filter(n=>{const r=n.getBoundingClientRect();return r.right>rect.right+1||r.left<rect.left-1;}).slice(0,12).map(n=>({class:n.className,text:n.textContent?.slice(0,80),tag:n.tagName,left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right,parent:n.parentElement.className})):[]};
 });
}
function check(value){
 assert.ok(Math.abs(value.imageTop-66)<1,JSON.stringify(value));
 assert.ok(value.imageHeight>=90&&value.avatarFits&&(!value.overflow||value.overflowX==='hidden'),JSON.stringify(value));
 assert.ok(value.buttons.every(b=>Math.abs(b.top-16)<1&&b.width>=43.9&&b.height>=43.9&&b.hit),JSON.stringify(value));
}

(async()=>{
 const browser=await chromium.launch({headless:true}),errors=[],results=[];
 try{
  const page=await browser.newPage({viewport:{width:440,height:956},deviceScaleFactor:2});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=profile&decorationLab=1');
  await page.waitForFunction(()=>window.LorefyProfileShop?.offered.length===17);
  const packs=await page.evaluate(()=>window.LorefyProfileShop.bundles.map(p=>p.id));
  for(const variant of [{lang:'ar',theme:'dark',layout:'normal'},{lang:'en',theme:'light',layout:'immersive'}]){
   await page.evaluate(v=>{
    localStorage.setItem('lorefy.ui.lang.v1',JSON.stringify(v.lang));localStorage.setItem('lorefy.ui.theme.v1',v.theme);
    localStorage.setItem('lorefy.user.profileLayout.v1',JSON.stringify(v.layout));
   },variant);
   await page.reload();await page.locator('.lf-profile-section-tabs').waitFor();
   await page.evaluate(()=>{
    const identity=JSON.parse(localStorage.getItem('lorefy.identity.v1')||'{}');
    identity.banner=location.origin+'/launch/brand/lorefy-reading-scene.jpg';
    localStorage.setItem('lorefy.identity.v1',JSON.stringify(identity));
    window.__qaIdentity=localStorage.getItem('lorefy.identity.v1');
    window.LorefyBackend.getPublicProfile=async()=>window.__qaBannerReader;
    window.LorefyBackend.searchPublicProfiles=async()=>[window.__qaBannerReader];
   });
   for(const [width,height] of [[320,568],[375,812],[440,956]]){
    await page.setViewportSize({width,height});
    for(const id of packs){
     await page.evaluate(({id,variant})=>{
      const owner=window.LorefyBackend.user?.id||JSON.parse(localStorage.getItem('lorefy.session.v1')).userId;
      // Persisted legacy selections remain supported even when no longer offered.
      localStorage.setItem(window.LorefyProfileShop.DECORATION_KEY,JSON.stringify({ownerId:owner,frame:id,page:id,effect:null}));
      window.dispatchEvent(new CustomEvent('lorefy:decoration-change',{detail:{owner}}));
      document.querySelector('.lf-profile-page').scrollTop=0;
      window.__qaBannerReader={...window.LorefyPreviewReaders.findReader('qa-tester-02'),
       username:'frame_qa_reader',profile_layout:variant.layout,theme:variant.theme,
       banner:location.origin+'/launch/brand/lorefy-reading-scene.jpg',profile_decoration:{frame:id,page:id,effect:null}};
     },{id,variant});
     await page.waitForFunction(id=>{
      const p=document.querySelector('.lf-profile-page');return p?.dataset.decorationRendered?.includes(id)&&Number(p.querySelector('.lf-decoration-page-border canvas')?.dataset.motionFrame)>2;
     },id);
     const owner=await geometry(page,'.lf-profile-page:not(.lf-public-profile-page)');check(owner);
     assert.equal(await page.evaluate(()=>localStorage.getItem('lorefy.identity.v1')),await page.evaluate(()=>window.__qaIdentity));
     await page.evaluate(()=>window.dispatchEvent(new CustomEvent('lorefy:find-readers')));
     await page.locator('.lf-reader-discovery-page input').fill('frame_qa_reader');
     await page.locator('.lf-reader-discovery-page .lf-reader-inline-row').click();
     await page.waitForFunction(id=>{
      const p=document.querySelector('.lf-reader-full');return p?.dataset.decorationRendered?.includes(id)&&Number(p.querySelector('.lf-decoration-page-border canvas')?.dataset.motionFrame)>2;
     },id);
     const visitor=await geometry(page,'.lf-reader-full');check(visitor);
     assert.ok(Math.abs(owner.imageTop-visitor.imageTop)<1&&Math.abs(owner.imageHeight-visitor.imageHeight)<1,'Owner and searched reader must use the same banner dimensions');
     results.push({id,width,height,...variant,owner,visitor,entry:'reader-search'});
     if(width===440&&variant.lang==='en'&&['original-ribbon-bunny','original-mint-raccoon','pfpvibes-bunny-hug'].includes(id))await page.screenshot({path:path.join(out,'searched-'+id+'.png')});
     await page.locator('.lf-reader-back').click();await page.locator('.lf-reader-full').waitFor({state:'detached'});
    }
   }
   await page.evaluate(async()=>{
    const owner=window.LorefyBackend.user?.id||JSON.parse(localStorage.getItem('lorefy.session.v1')).userId;
    await window.LorefyProfileShop.applyDecoration('original-mint-raccoon','all',owner);
   });
   await page.waitForFunction(()=>document.querySelector('.lf-profile-page').style.getPropertyValue('--profile-frame-banner-top'));
   await page.evaluate(async()=>await window.LorefyProfileShop.applyDecoration(null,'all',window.LorefyBackend.user?.id||JSON.parse(localStorage.getItem('lorefy.session.v1')).userId));
   await page.waitForFunction(()=>{
    const p=document.querySelector('.lf-profile-page');return !p.classList.contains('has-page-decoration')&&!p.style.getPropertyValue('--profile-frame-banner-top');
   });
   assert.equal(await page.locator('.lf-profile-page').evaluate(p=>p.style.getPropertyValue('--profile-frame-banner-top')),'');
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({packs:packs.length,profileLayouts:results.length*2,searchEntries:results.length,results,errors},null,2));
  console.log(JSON.stringify({packs:packs.length,profileLayouts:results.length*2,searchEntries:results.length,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
