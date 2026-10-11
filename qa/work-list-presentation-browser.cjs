const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url='http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=profile&decorationLab=1';
const out=path.join(__dirname,'../output/playwright/work-list-presentation');
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
      await page.evaluate(lang=>{
        localStorage.setItem('lorefy.ui.lang.v1',JSON.stringify(lang));
        localStorage.setItem('lorefy.ui.theme.v1',lang==='ar'?'pink':'custom-dark-387f76');
        const normalized = value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
        const names=['One Piece','Berserk','Naruto','Bleach','Kingdom','Death Note','Hunter x Hunter','Attack on Titan','Demon Slayer: Kimetsu no Yaiba','Dragon Ball'];
        const preferred=names.map(name=>window.LorefyMangaData.find(w=>[w.title,w.titleEnglish].some(title=>normalized(title)===normalized(name)))).filter(Boolean);
        const other=window.LorefyMangaData.filter(w=>/Berserk|One Piece|Hunter|Naruto|Bleach|Kingdom|Death Note|Demon Slayer|Attack on Titan|Dragon Ball/.test(w.titleEnglish||w.title)&&!preferred.some(p=>p.id===w.id));
        const works=preferred.concat(other).slice(0,10);
        const items=works.map(w=>({id:String(w.id),workId:String(w.id),name:w.titleEnglish||w.title,image:window.LorefyCoverAPI.primary(w)}));
        localStorage.setItem(window.LorefyProfileSections.KEY,JSON.stringify([
          {id:'ranked',name:lang==='ar'?'أعمال تستحق العودة إليها':'Stories worth returning to',description:lang==='ar'?'عشرة أعمال، لكل واحد منها مكانه في قائمتي.':'Ten stories, each with a place in my list.',kind:'works',isPublic:true,items},
          {id:'empty',name:lang==='ar'?'قائمتي القادمة':'My next list',kind:'characters',isPublic:false,items:[]},
          {id:'one',name:lang==='ar'?'رحلة البداية':'A first adventure',kind:'works',isPublic:true,items:items.slice(0,1)},
          {id:'two',name:lang==='ar'?'حكايات مظلمة':'Darker stories',kind:'works',isPublic:false,items:items.slice(1,3)},
          {id:'three',name:lang==='ar'?'مغامرات لا تنسى':'Unforgettable adventures',kind:'works',isPublic:true,items:items.slice(2,5)},
          {id:'four',name:lang==='ar'?'على قائمة القراءة':'On my reading list',kind:'works',isPublic:true,items:items.slice(5,9)}
        ]));
      },lang);
      await page.reload();
      await page.getByRole('tab',{name:lang==='ar'?'القوائم':'Lists',exact:true}).click();
      for(const width of [320,375,390,440,768]) {
        await page.setViewportSize({width,height:956});
        const card=page.locator('[data-profile-folder="ranked"]');
        await card.scrollIntoViewIfNeeded();
        const overview=await card.evaluate(n=>({w:n.clientWidth,s:n.scrollWidth,art:n.querySelector('.lf-profile-folder-stage').clientHeight,panel:n.parentElement.clientWidth,columns:getComputedStyle(n.parentElement).gridTemplateColumns.split(' ').length,
          clipped:[...n.querySelectorAll('.lf-profile-folder-fan > .lf-profile-list-image')].some(img=>{const a=img.getBoundingClientRect(),b=n.querySelector('.lf-profile-folder-stage').getBoundingClientRect();return a.left<b.left-1||a.right>b.right+1||a.top<b.top-1;})}));
        assert.ok(overview.s<=overview.w+1);
        assert.equal(overview.columns,2);
        assert.ok(overview.art>=110);
        assert.equal(overview.clipped,false);
        const tiles=await page.locator('.lf-profile-folder').evaluateAll(nodes=>nodes.map(n=>({w:n.clientWidth,s:n.scrollWidth,fan:n.querySelector('.lf-profile-folder-fan').children.length,
          outside:[...n.querySelectorAll('.lf-profile-folder-fan > .lf-profile-list-image')].some(img=>{const a=img.getBoundingClientRect(),b=n.querySelector('.lf-profile-folder-stage').getBoundingClientRect();return a.left<b.left-1||a.right>b.right+1||a.top<b.top-1;})})));
        assert.ok(tiles.every(tile=>tile.s<=tile.w+1 && !tile.outside),JSON.stringify({width,tiles}));
        if(width===440) {await page.waitForTimeout(1000);await page.screenshot({path:path.join(out,`lists-${lang}.png`)});}
        await card.click();
        assert.equal(await page.locator('.lf-profile-ranked-list li').count(),10);
        assert.equal(await page.locator('.is-leading-rank').count(),3);
        assert.equal(await page.locator('.is-back').evaluate(n=>document.activeElement===n),true);
        const detail=await page.locator('.lf-profile-section-panel').evaluate(n=>({w:n.clientWidth,s:n.scrollWidth,portrait:n.querySelector('.lf-profile-ranked-list .lf-profile-list-image').clientHeight,top:n.querySelector('.lf-profile-list-toolbar').getBoundingClientRect().top-n.closest('.lf-profile-page').getBoundingClientRect().top}));
        assert.ok(detail.s<=detail.w+1,JSON.stringify({width,detail}));
        assert.equal(detail.portrait,86);
        assert.ok(detail.top>=-1 && detail.top<=12,JSON.stringify({width,detail}));
        if(width===440) await page.screenshot({path:path.join(out,`ranked-${lang}.png`)});
        await page.getByRole('button',{name:lang==='ar'?'العودة للقوائم':'Back to lists',exact:true}).click();
        assert.equal(await card.evaluate(n=>document.activeElement===n),true);
        evidence.push({lang,width,overview,detail});
      }
      await page.setViewportSize({width:440,height:956});
      await page.locator('.lf-profile-section-panel').evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
      await page.waitForTimeout(1200);
      await page.screenshot({path:path.join(out,`folder-grid-${lang}.png`)});
      await page.locator('[data-profile-folder="ranked"]').click();
      await page.getByRole('button',{name:lang==='ar'?'تعديل القائمة':'Edit list',exact:true}).click();
      await page.getByRole('textbox',{name:lang==='ar'?'اسم القائمة':'List name',exact:true}).fill('A very long list title '.repeat(4));
      await page.getByRole('textbox',{name:lang==='ar'?'الوصف':'Description',exact:true}).fill('Long description '.repeat(25));
      await page.getByRole('button',{name:lang==='ar'?'إزالة العنصر':'Remove item',exact:true}).last().click();
      assert.equal(await page.locator('.is-editing li').count(),9);
      await page.getByRole('button',{name:lang==='ar'?'حفظ القائمة':'Save list',exact:true}).click();
      await page.locator('[data-profile-folder="ranked"]').click();
      assert.equal(await page.locator('.lf-profile-ranked-list li').count(),9);
      assert.ok(await page.locator('.lf-profile-section-panel').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
      await page.getByRole('button',{name:lang==='ar'?'العودة للقوائم':'Back to lists',exact:true}).click();
      await page.locator('[data-profile-folder="empty"]').click();
      assert.equal(await page.locator('.lf-profile-list-artwork').isVisible(),false);
      await page.getByRole('button',{name:lang==='ar'?'العودة للقوائم':'Back to lists',exact:true}).click();
      await page.evaluate(()=>window.dispatchEvent(new CustomEvent('lorefy:open-reader-profile',{detail:window.LorefyPreviewReaders.findReader('qa-tester-02')})));
      await page.locator('.lf-reader-full .lf-profile-section-tabs').waitFor();
      await page.getByRole('tab',{name:lang==='ar'?'القوائم':'Lists',exact:true}).click();
      await page.locator('[data-profile-folder]').first().click();
      assert.equal(await page.getByRole('button',{name:lang==='ar'?'تعديل القائمة':'Edit list',exact:true}).count(),0);
      await page.locator('.lf-reader-back').click();
      await page.evaluate(()=>window.dispatchEvent(new CustomEvent('lorefy:open-reader-profile',{detail:window.LorefyPreviewReaders.findReader('qa-tester-02')})));
      await page.locator('.lf-reader-full .lf-reader-cover.is-work').first().click();
      await page.locator('.lf-work-identity').waitFor();
      for(const width of [320,375,390,440,768]) {
        await page.setViewportSize({width,height:956});
        await page.locator('.lf-detail-page').evaluate(n=>n.scrollTop=0);
        const work=await page.locator('.lf-detail-page').evaluate(n=>({
          w:n.clientWidth,s:n.scrollWidth,banner:n.querySelector('.lf-detail-hero').getBoundingClientRect().height,
          poster:n.querySelector('.lf-work-poster').getBoundingClientRect().height,
          title:n.querySelector('h1').textContent,
          buttons:[...n.querySelectorAll('.lf-detail-hero button')].map(b=>({w:b.clientWidth,h:b.clientHeight}))
        }));
        assert.ok(work.banner>=240,JSON.stringify(work));
        assert.ok(work.s<=work.w+1,JSON.stringify({width,work}));
        assert.ok(work.buttons.every(b=>b.w>=44 && b.h>=44));
        if(width===440) {await page.waitForTimeout(1400);await page.screenshot({path:path.join(out,`work-${lang}.png`)});}
        evidence.push({lang,width,work});
      }
      await context.close();
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({evidence,pageErrors:errors},null,2));
    console.log(JSON.stringify({layouts:evidence.length,pageErrors:errors}));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
