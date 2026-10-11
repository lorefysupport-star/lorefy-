const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=process.env.LOREFY_QA_URL || 'http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=profile&decorationLab=1';
const out=path.join(__dirname,'../output/playwright/profile-header');
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true});
  const errors=[],evidence=[];
  try {
    for(const variant of [
      {lang:'ar',layout:'normal',theme:'dark'},
      {lang:'en',layout:'normal',theme:'light'},
      {lang:'ar',layout:'immersive',theme:'custom-dark-207b69'},
      {lang:'en',layout:'immersive',theme:'custom-light-367faa'}
    ]) {
      const context=await browser.newContext({viewport:{width:440,height:956}});
      const page=await context.newPage();
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(url);
      await page.locator('.lf-profile-section-tabs').waitFor();
      await page.evaluate(v=>{
        localStorage.setItem('lorefy.ui.lang.v1',JSON.stringify(v.lang));
        localStorage.setItem('lorefy.ui.theme.v1',v.theme);
        localStorage.setItem('lorefy.user.profileLayout.v1',JSON.stringify(v.layout));
      },variant);
      await page.reload();
      const tabs=variant.lang==='ar'?['الرئيسية','القوائم','التغريدات']:['Overview','Lists','Posts'];
      await page.getByRole('tab',{name:tabs[0],exact:true}).waitFor();
      assert.equal(await page.locator('.lf-profile-page').getAttribute('data-profile-layout'),variant.layout);
      const palette=await page.locator('.lf-profile-page').evaluate((n,theme)=>({
        actual:getComputedStyle(n).getPropertyValue('--ui-bg').trim().toLowerCase(),
        expected:window.LorefyDesignSystem.tokens(theme)['--ui-bg'].toLowerCase()
      }),variant.theme);
      assert.equal(palette.actual,palette.expected);
      for(const width of [320,375,390,440,768]) {
        await page.setViewportSize({width,height:956});
        const metrics=await page.locator('.lf-profile-metrics').evaluate(n=>({
          rows:[...n.children].filter(row=>getComputedStyle(row).display!=='none').map(row=>({text:row.textContent,width:row.clientWidth,scroll:row.scrollWidth})),
          columns:getComputedStyle(n).gridTemplateColumns.split(' ').length,width:n.clientWidth,scroll:n.scrollWidth
        }));
        assert.equal(metrics.rows.length,4);
        assert.equal(metrics.columns,4);
        assert.ok(metrics.scroll<=metrics.width+1);
        assert.ok(metrics.rows.every(row=>row.scroll<=row.width+1));
        assert.ok(metrics.rows.every(row=>!/مراجعة|منشور|Review|Post/.test(row.text)));
        const bar=page.locator('.lf-profile-section-tabs');
        assert.ok(await bar.evaluate(n=>n.scrollWidth<=n.clientWidth+1));
        await page.getByRole('tab',{name:tabs[1],exact:true}).click();
        await page.getByRole('button',{name:variant.lang==='ar'?'قائمة جديدة':'New list',exact:true}).waitFor();
        await page.getByRole('tab',{name:tabs[2],exact:true}).click();
        await page.getByRole('button',{name:variant.lang==='ar'?'كتابة تغريدة':'Write a post',exact:true}).waitFor();
        await page.getByRole('tab',{name:tabs[0],exact:true}).click();
        assert.equal(await page.locator('.lf-profile-favorites').first().isVisible(),true);
      }
      await page.setViewportSize({width:440,height:956});
      await page.evaluate(()=>{
        const reader=window.LorefyPreviewReaders.findReader('qa-tester-01');
        localStorage.setItem('lorefy.user.favorites.v2',JSON.stringify(reader.favorite_work_ids));
        window.dispatchEvent(new CustomEvent('lorefy:stored-state',{detail:{key:'lorefy.user.favorites.v2'}}));
      });
      await page.locator('.lf-profile-favorites img').first().waitFor();
      await page.evaluate(()=>window.LorefyLibraryView.setMode('spines'));
      await page.locator('.lf-profile-favorites.is-spine-view').first().waitFor();
      await page.evaluate(()=>document.querySelector('.lf-profile-page').scrollTop=0);
      const shelf=await page.locator('.lf-profile-favorites.is-spine-view').first().evaluate(n=>({
        bottom:n.getBoundingClientRect().bottom,
        nav:document.querySelector('.lf-bottom-nav').getBoundingClientRect().top
      }));
      assert.ok(shelf.bottom<=shelf.nav-8,`Full shelf ${shelf.bottom} overlaps navigation ${shelf.nav} (${variant.layout})`);
      for(const [width,height] of [[430,932],[390,844],[375,812]]) {
        await page.setViewportSize({width,height});
        await page.waitForFunction(()=>document.querySelector('.lf-profile-favorites').getBoundingClientRect().bottom<=document.querySelector('.lf-bottom-nav').getBoundingClientRect().top-8,{},{timeout:1500}).catch(async error=>{
          console.log({variant,width,height,geometry:await page.locator('.lf-profile-page').evaluate(n=>[...n.querySelectorAll('.lf-profile-banner,.lf-profile-identity>*,.lf-profile-favorites,.lf-bottom-nav')].map(n=>({c:n.className,top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom,height:n.clientHeight})))});
          throw error;
        });
        if(width===375) await page.screenshot({path:path.join(out,`owner-${variant.lang}-${variant.layout}-compact.png`)});
      }
      await page.setViewportSize({width:440,height:956});
      if(variant.lang==='en') await page.waitForFunction(()=>
        !/[\u0600-\u06ff]/.test(document.querySelector('.lf-profile-metrics').textContent));
      await page.screenshot({path:path.join(out,`owner-${variant.lang}-${variant.layout}.png`)});
      await page.evaluate(()=>window.dispatchEvent(new CustomEvent('lorefy:open-reader-profile',{
        detail:window.LorefyPreviewReaders.findReader('qa-tester-01')
      })));
      await page.locator('.lf-reader-full').waitFor();
      await page.getByRole('tab',{name:tabs[0],exact:true}).waitFor();
      await page.waitForFunction(()=>document.querySelector('.lf-reader-metrics')?.classList.contains('lf-profile-reading-metrics'));
      const metrics=await page.locator('.lf-reader-metrics').evaluate(n=>({
        names:[...n.children].filter(row=>getComputedStyle(row).display!=='none').map(row=>row.textContent),
        columns:getComputedStyle(n).gridTemplateColumns.split(' ').length
      }));
      assert.equal(metrics.names.length,4);
      assert.equal(metrics.columns,4);
      assert.equal(await page.locator('.lf-reader-metrics [data-favorite-type]').count(),1);
      await page.waitForFunction(lang=>document.querySelector('.lf-reader-metrics [data-favorite-type]')?.textContent.includes(lang==='ar'?'رواية':'Novel'),variant.lang);
      assert.equal(await page.locator('.lf-reader-type-chip').count(),0);
      await page.screenshot({path:path.join(out,`visitor-${variant.lang}-${variant.layout}.png`)});
      assert.ok(metrics.names.every(name=>!/مراجعة|منشور|Review|Post/.test(name)));
      assert.equal(await page.locator('.lf-public-profile-reviews').isVisible(),true);
      const underline=await page.getByRole('tab',{name:tabs[0],exact:true}).evaluate(n=>getComputedStyle(n).borderBottomWidth);
      assert.equal(underline,'2px');
      await page.getByRole('tab',{name:tabs[2],exact:true}).click();
      await page.locator('.lf-profile-section-panel').waitFor({state:'visible'});
      assert.equal(await page.locator('.lf-public-profile-reviews').isVisible(),false);
      await page.getByRole('tab',{name:tabs[0],exact:true}).click();
      assert.equal(await page.locator('.lf-public-profile-reviews').isVisible(),true);
      evidence.push({...variant,widths:[320,375,390,440,768],fullShelfViewports:[[440,956],[430,932],[390,844],[375,812]],ownerMetrics:4,visitorMetrics:4,shelf,reviewsPreserved:true});
      await context.close();
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({evidence,pageErrors:errors},null,2));
    console.log(JSON.stringify({evidence,pageErrors:errors},null,2));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
