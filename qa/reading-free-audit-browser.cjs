const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=profile';
const out=path.resolve(__dirname,'../output/playwright/reading-free-audit');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[],evidence=[];
 try{
  const page=await browser.newPage({viewport:{width:440,height:956}});
  await page.addInitScript(()=>{window.LOREFY_RELEASE={betaProfileDecorations:true};});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.locator('.lf-profile-section-tabs').waitFor();
  const id=await page.evaluate(()=>{
   const reader=window.LorefyPreviewReaders.findReader('qa-tester-02');
   const id=reader.favorite_work_ids[0];
   localStorage.setItem('lorefy.user.privateReviews.v2','[]');
   localStorage.setItem('lorefy.user.library.v2',JSON.stringify({[id]:'تم القراءة'}));
   localStorage.setItem('lorefy.user.progress.v2',JSON.stringify({[id]:{chapter:23,volume:0,page:0,note:'audit'}}));
   localStorage.setItem('lorefy.user.readLog.v1',JSON.stringify({'2026-10-11':23}));
   return id;
  });
  await page.reload();
  await page.locator('.lf-profile-metrics').waitFor();
  const metricText=()=>page.locator('.lf-profile-metrics').innerText();
  await page.waitForFunction(()=>document.querySelector('.lf-profile-metrics')?.textContent.includes('23'));
  const baseline=await metricText();
  for(let cycle=0;cycle<3;cycle++){
   await page.evaluate(({id,cycle})=>{
    window.LorefyChapterData=window.LorefyChapterData||{};
    window.LorefyChapterData[id]={latestChapter:420+cycle*100};
    window.dispatchEvent(new CustomEvent('lorefy:catalog-ingested'));
   },{id,cycle});
   await page.getByRole('tab',{name:'القوائم',exact:true}).click();
   await page.getByRole('tab',{name:'التغريدات',exact:true}).click();
   await page.getByRole('tab',{name:'الرئيسية',exact:true}).click();
   assert.equal(await metricText(),baseline);
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('.lf-profile-metrics')?.textContent.includes('23'));
   assert.equal(await metricText(),baseline);
   assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('lorefy.user.progress.v2'))[id].chapter,id),23);
  }
  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('lorefy.user.readLog.v1')));
  assert.deepEqual(history,{'2026-10-11':23});
  await page.evaluate(id=>{
   const saved=JSON.parse(localStorage.getItem('lorefy.user.progress.v2'));
   saved[id].chapter=28;
   localStorage.setItem('lorefy.user.progress.v2',JSON.stringify(saved));
   window.dispatchEvent(new CustomEvent('lorefy:stored-state',{detail:{key:'lorefy.user.progress.v2'}}));
  },id);
  await page.waitForFunction(()=>document.querySelector('.lf-profile-metrics')?.textContent.includes('28'));
  await page.screenshot({path:path.join(out,'stable-metrics-ar.png')});
  evidence.push('saved chapters/hours stay fixed through catalog events, tabs and three reloads; explicit progress update changes totals; history remains intact');
  await page.waitForFunction(()=>window.LorefyProfileShop?.offered.length===17);
  const packs=await page.evaluate(()=>window.LorefyProfileShop.offered.map(p=>({id:p.id,ar:p.names.ar,en:p.names.en,parts:p.parts})));
  for(const lang of ['ar','en']){
   await page.evaluate(lang=>localStorage.setItem('lorefy.ui.lang.v1',JSON.stringify(lang)),lang);
   await page.reload();
   await page.locator('.lf-profile-section-tabs').waitFor();
   await page.evaluate(()=>{
    window.__auditBillingCalls=[];
    window.LorefyDecorationBilling=Object.fromEntries(['has','owned','availability','watch','buy','restore'].map(key=>[key,()=>{window.__auditBillingCalls.push(key);throw Error('Unexpected billing '+key);} ]));
    window.LorefyProfileShop.open();
   });
   await page.locator('.lf-shop-dialog').waitFor();
   assert.equal(await page.locator('.lf-shop-product').count(),17);
   assert.equal(await page.getByRole('button',{name:lang==='ar'?'استعادة المشتريات':'Restore purchases',exact:true}).count(),0);
   assert.ok((await page.locator('.lf-shop-price').allTextContents()).every(t=>t===(lang==='ar'?'مجانية':'Free')));
   await page.screenshot({path:path.join(out,`free-catalog-${lang}.png`)});
   for(const pack of packs){
    await page.getByRole('button',{name:(lang==='ar'?'معاينة ':'Preview ')+pack[lang],exact:true}).click();
    await page.locator('.lf-shop-footer').waitFor();
    assert.ok(!(await page.locator('.lf-shop-footer').innerText()).includes('SAR'));
    await page.locator('.lf-shop-apply').click();
    await page.locator('.lf-shop-status').waitFor();
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('lorefy.user.profileDecoration.v1')));
    for(const part of pack.parts)assert.equal(state[part],pack.id);
    const canvas=page.locator('.lf-shop-frame .lf-frame-motion').first();
    await canvas.waitFor();
    await page.waitForFunction(()=>[...document.querySelectorAll('.lf-shop-frame .lf-frame-motion')].some(c=>Number(c.dataset.motionFrame)>2));
    const before=await canvas.getAttribute('data-motion-frame');
    await page.waitForFunction(before=>Number(document.querySelector('.lf-shop-frame .lf-frame-motion')?.dataset.motionFrame)>Number(before),before);
    const rendered=await page.locator('.lf-shop-profile .lf-frame-motion').evaluateAll(canvases=>canvases.map(canvas=>{
     const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
     let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)visible++;
     return {frames:Number(canvas.dataset.motionFrame),visible};
    }));
    assert.equal(rendered.length,2);
    assert.ok(rendered.every(canvas=>canvas.frames>2&&canvas.visible>10),JSON.stringify({pack:pack.id,rendered}));
    await page.getByRole('button',{name:lang==='ar'?'رجوع إلى الحزم':'Back to collections',exact:true}).click();
   }
   await page.getByRole('button',{name:(lang==='ar'?'معاينة ':'Preview ')+packs[0][lang],exact:true}).click();
   await page.locator('.lf-shop-remove').click();
   await page.locator('.lf-shop-status').waitFor();
   const cleared=await page.evaluate(()=>JSON.parse(localStorage.getItem('lorefy.user.profileDecoration.v1')));
   assert.equal(cleared.frame,null);assert.equal(cleared.page,null);assert.equal(cleared.effect,null);
   assert.deepEqual(await page.evaluate(()=>window.__auditBillingCalls),[]);
   await page.getByRole('button',{name:lang==='ar'?'إنهاء المعاينة':'End preview',exact:true}).click();
   evidence.push(`${lang}: all 17 collections preview/apply, avatar and page canvases advance with nonblank pixels, remove works, no purchase controls/calls`);
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({evidence,pageErrors:errors},null,2));
  console.log(JSON.stringify({evidence,pageErrors:errors},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
