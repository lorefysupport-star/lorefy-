const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=process.env.LOREFY_QA_URL || 'http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=profile&decorationLab=1';
const out=path.join(__dirname,'../output/playwright/public-profile-layout');
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true}),errors=[],evidence=[];
  try {
    for(const lang of ['ar','en']) {
      const context=await browser.newContext({viewport:{width:440,height:956}});
      const page=await context.newPage();
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(url);
      await page.locator('.lf-profile-section-tabs').waitFor();
      await page.evaluate(lang=>localStorage.setItem('lorefy.ui.lang.v1',JSON.stringify(lang)),lang);
      await page.reload();
      await page.locator('.lf-profile-section-tabs').waitFor();
      for(const id of Array.from({length:10},(_,i)=>'qa-tester-'+String(i+1).padStart(2,'0'))) {
        await page.evaluate(id=>window.dispatchEvent(new CustomEvent('lorefy:open-reader-profile',{
          detail:window.LorefyPreviewReaders.findReader(id)
        })),id);
        await page.waitForFunction(id=>document.querySelector('.lf-reader-full')?.__lorefyProfileSnapshot?.id===id,id);
        await page.locator('.lf-reader-full .lf-profile-section-tabs').waitFor();
        for(const [width,height] of [[440,956],[430,932],[390,844],[375,812]]) {
          await page.setViewportSize({width,height});
          await page.locator('.lf-reader-full').evaluate(n=>n.scrollTop=0);
          if(height<900) await page.locator('.lf-reader-full').evaluate(n=>{
            const shelf=n.querySelector('[data-profile-shelf="works"]');
            n.scrollTop=Math.max(0,shelf.getBoundingClientRect().bottom-document.querySelector('.lf-bottom-nav').getBoundingClientRect().top+10);
          });
          await page.waitForFunction(()=>{
            const shelf=document.querySelector('.lf-reader-full [data-profile-shelf="works"]');
            return shelf && shelf.getBoundingClientRect().bottom<=document.querySelector('.lf-bottom-nav').getBoundingClientRect().top-8;
          },null,{timeout:2000}).catch(async error=>{
            console.log({lang,id,width,height,geometry:await page.locator('.lf-reader-full').evaluate(n=>[...n.querySelectorAll('.lf-reader-banner,.lf-reader-identity>*,.lf-profile-section-tabs,[data-profile-shelf="works"],.lf-reader-shelf-rail.is-spine-view')].map(el=>({c:el.className,y:el.getBoundingClientRect().y,b:el.getBoundingClientRect().bottom,h:el.clientHeight})))});
            throw error;
          });
          const result=await page.locator('.lf-reader-full').evaluate(n=>{
            const shelf=n.querySelector('[data-profile-shelf="works"]'),rail=shelf.querySelector('.lf-reader-shelf-rail');
            const cards=[...rail.children],actions=n.querySelector('.lf-reader-primary-actions'),rect=actions.getBoundingClientRect();
            return {layout:n.dataset.profileLayout,view:n.dataset.ownerLibraryView,theme:n.dataset.ownerTheme,scrollTop:n.scrollTop,
              bottom:shelf.getBoundingClientRect().bottom,nav:document.querySelector('.lf-bottom-nav').getBoundingClientRect().top,
              columns:getComputedStyle(rail).gridTemplateColumns.split(' ').length,libraryGrid:rail.classList.contains('lf-library-grid'),
              overflow:n.scrollWidth>n.clientWidth,
              cards:cards.map(card=>({width:card.getBoundingClientRect().width,height:card.getBoundingClientRect().height,
                cover:card.querySelector('.lf-library-cover')?.getBoundingClientRect().height,
                bottom:card.getBoundingClientRect().bottom,expected:window.LorefyLibraryView.profileSpineHeight?.(card.querySelector('img')?.alt)})),
              actions:[...actions.querySelectorAll('button,a')].map(el=>({height:el.clientHeight,bottom:el.getBoundingClientRect().bottom,inside:el.getBoundingClientRect().bottom<=rect.bottom+1}))};
          });
          assert.equal(result.columns,4);
          assert.equal(result.cards.length,4);
          assert.equal(result.overflow,false);
          assert.equal(result.libraryGrid,false,'Favorites must not inherit paginated library row geometry');
          assert.ok(result.actions.every(action=>action.height>=44 && action.inside));
          if(result.view==='spines') {
            assert.ok(result.cards.every(card=>card.width<=74.1 && card.height===card.expected && card.cover===card.expected));
            assert.ok(Math.max(...result.cards.map(c=>c.bottom))-Math.min(...result.cards.map(c=>c.bottom))<1,'Spines share the shelf baseline');
          } else assert.ok(result.cards.every(card=>Math.abs(card.width/card.height-2/3)<0.01));
          evidence.push({lang,id,width,height,...result});
          if(width===440 && ['qa-tester-01','qa-tester-02','qa-tester-04'].includes(id)) {
            await page.waitForTimeout(700);
            await page.screenshot({path:path.join(out,`${id}-${lang}.png`)});
          }
        }
        const tabs=lang==='ar'?['الرئيسية','القوائم','التغريدات']:['Overview','Lists','Posts'];
        await page.getByRole('tab',{name:tabs[1],exact:true}).click();
        await page.locator('.lf-profile-folder').first().waitFor();
        await page.getByRole('tab',{name:tabs[2],exact:true}).click();
        await page.locator('.lf-profile-section-panel').waitFor({state:'visible'});
        await page.getByRole('tab',{name:tabs[0],exact:true}).click();
        await page.locator('[data-profile-shelf="works"]').waitFor({state:'visible'});
        await page.locator('.lf-reader-back').click();
        await page.locator('.lf-reader-full').waitFor({state:'detached'});
      }
      await context.close();
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({evidence,pageErrors:errors},null,2));
    console.log(JSON.stringify({profiles:10,languages:2,phoneLayouts:evidence.length,pageErrors:errors}));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
