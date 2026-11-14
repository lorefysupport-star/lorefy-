const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.LOREFY_QA_URL || 'http://127.0.0.1:8796';
const out = process.env.LOREFY_QA_OUT || path.resolve('output/playwright/profile-display');
const art = 'data:image/webp;base64,' + fs.readFileSync(path.resolve('assets/home/berserk-home-v1.webp')).toString('base64');
fs.mkdirSync(out, {recursive:true});

(async () => {
  const browser = await chromium.launch(), checks = [], errors = [];
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/index.html?preview=demo&demo=ready&route=profile&adaptive=1&decorationLab=1',{waitUntil:'domcontentloaded'});
    await page.locator('.lf-profile-favorites').waitFor();
    for (const width of [320,440]) for (const lang of ['ar','en']) for (const theme of ['dark','light','custom-light-51ad79']) {
    await page.setViewportSize({width,height:956});
    await page.evaluate(lang=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';},lang);
    for (const layout of ['normal','immersive','reader']) for (const view of ['grid','spines','showcase','shelf']) for (const count of [1,3,4,7]) {
      await page.evaluate(({layout,view,count,theme,art}) => {
        if (LorefyBackend.mode !== 'demo') throw Error('QA requires isolated demo mode');
        const reader = {...LorefyPreviewReaders.findReader('qa-tester-01'),id:'display-'+layout+'-'+view+'-'+count,
          profile_layout:layout,library_view:view,theme,profile_decoration:null,banner:art,avatar:art,
          favorite_work_ids:LorefyMangaData.slice(0,count).map(work=>work.id)};
        reader.custom_work_covers=Object.fromEntries(reader.favorite_work_ids.map(id=>[id,art]));
        LorefyBackend.getPublicProfile=async()=>reader;
        window.dispatchEvent(new CustomEvent('lorefy:open-reader-profile',{detail:reader}));
      },{layout,view,count,theme,art});
      await page.waitForFunction(({layout,view,count})=>document.querySelector('.lf-reader-full')?.__lorefyProfileSnapshot?.id==='display-'+layout+'-'+view+'-'+count,{layout,view,count});
      await page.waitForFunction(()=>!document.querySelector('.lf-reader-loading'));
      await page.evaluate(()=>LorefyLibraryView.mount(document,localStorage));
      await page.waitForFunction(()=>[...document.querySelectorAll('[data-profile-shelf="works"] .lf-cover-image')].every(img=>img.complete&&img.naturalWidth>0));
      const result = await page.evaluate(() => {
        const rail=document.querySelector('[data-profile-shelf="works"] .lf-reader-shelf-rail');
        const r=rail.getBoundingClientRect(), style=getComputedStyle(rail);
        const cards=[...rail.children].filter(n=>getComputedStyle(n).display!=='none');
        return {width:r.width,contentWidth:rail.parentElement.clientWidth-parseFloat(getComputedStyle(rail.parentElement).paddingLeft)-parseFloat(getComputedStyle(rail.parentElement).paddingRight),
          columns:style.gridTemplateColumns.split(' ').length,cards:cards.map(card=>{
            const c=card.getBoundingClientRect(), cover=card.querySelector('[data-lorefy-book-cover]')?.getBoundingClientRect();
            return {width:c.width,bottom:c.bottom,coverBottom:cover?.bottom,coverHeight:cover?.height};
          })};
      });
      const visible=Math.min(count,view==='spines'?7:view==='showcase'?3:4);
      const pass=result.cards.length===visible && (view!=='spines' || result.columns===visible &&
        result.width>=result.contentWidth-1 && result.cards.every(card=>card.coverHeight>=176 && Math.abs(card.bottom-card.coverBottom)<1));
      checks.push({layout,view,count,width,lang,theme,pass,...(!pass?{result}:{})});
      if (count===4 && layout==='normal' && width===440 && lang==='ar' && theme==='dark') {
        await page.locator('[data-profile-shelf="works"]').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(out,'visitor-'+view+'.png')});
      }
    }
    }
    for (const width of [320,440]) for (const layout of ['normal','immersive','reader']) for (const view of ['grid','spines','showcase','shelf']) {
      await page.evaluate(({layout,view,art})=>{
        if (LorefyBackend.mode!=='demo') throw Error('QA requires isolated demo mode');
        const ids=LorefyMangaData.slice(0,7).map(work=>work.id);
        localStorage.setItem('lorefy.user.favorites.v2',JSON.stringify(ids));
        localStorage.setItem('lorefy.user.customCovers.v2',JSON.stringify(Object.fromEntries(ids.map(id=>[id,art]))));
        localStorage.setItem('lorefy.user.profileLayout.v1',JSON.stringify(layout));
        localStorage.setItem('lorefy.library.view.v1',view);
      },{layout,view,art});
      await page.setViewportSize({width,height:844});
      await page.goto(base+'/index.html?preview=demo&demo=ready&route=profile&adaptive=1&decorationLab=1',{waitUntil:'domcontentloaded'});
      await page.locator('.lf-profile-favorites>[data-work-title]').first().waitFor();
      await page.waitForFunction(({layout,view})=>document.querySelector('.lf-profile-page')?.dataset.profileLayout===layout&&
        (view==='spines'?document.querySelector('.lf-profile-favorites.is-spine-view'):view==='showcase'?document.querySelector('.lf-profile-favorites.is-showcase-view'):!document.querySelector('.lf-profile-favorites.is-spine-view,.lf-profile-favorites.is-showcase-view')),{layout,view});
      const result=await page.evaluate(()=>{
        const rail=document.querySelector('.lf-profile-favorites'),r=rail.getBoundingClientRect();
        const cards=[...rail.children].filter(n=>getComputedStyle(n).display!=='none');
        return {width:r.width,left:r.left,right:r.right,cards:cards.map(n=>{
          const rect=n.querySelector('[data-lorefy-book-cover]')?.getBoundingClientRect();
          return rect?{width:rect.width,height:rect.height}:null;
        }),saved:JSON.parse(localStorage.getItem('lorefy.user.favorites.v2')).length};
      });
      const pass=result.saved===7&&result.cards.length===(view==='spines'?7:view==='showcase'?3:4)&&result.left>=-1&&result.right<=width+1&&result.cards.every(c=>c?.width>10&&c.height>60);
      checks.push({surface:'owner',width,layout,view,pass,...(!pass?{result}:{})});
    }
    const report={checks:checks.length,passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass),errors};
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
    assert.equal(report.failed.length,0); assert.deepEqual(errors,[]);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
