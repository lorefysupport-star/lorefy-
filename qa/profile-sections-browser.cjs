const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=process.env.LOREFY_QA_URL || 'http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=profile&decorationLab=1';
const out=path.join(__dirname,'../output/playwright/profile-sections');
fs.mkdirSync(out,{recursive:true});
async function settleTabs(page) {
  await page.waitForFunction(()=>[...document.querySelectorAll('.lf-profile-section-tabs button')].every(button=>{
    const transparent=getComputedStyle(button).borderBottomColor==='rgba(0, 0, 0, 0)';
    return button.getAttribute('aria-selected')==='true' ? !transparent : transparent;
  }));
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  const evidence=[], errors=[];
  try {
    const page=await browser.newPage({viewport:{width:440,height:956}});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    await page.getByRole('tab',{name:'القوائم',exact:true}).click();
    await settleTabs(page);
    assert.equal(await page.locator('.lf-profile-favorites').first().isVisible(),false);
    assert.equal(await page.locator('.lf-profile-top-works-head').isVisible(),false);
    await page.getByRole('button',{name:'قائمة جديدة',exact:true}).click();
    await page.getByRole('textbox',{name:'اسم القائمة',exact:true}).fill('أفضل أعمال فهد');
    await page.getByRole('combobox',{name:'القوائم',exact:true}).selectOption('works');
    await page.getByRole('searchbox',{name:'ابحث عن عمل'}).fill('One Piece');
    await page.locator('.lf-profile-list-results .is-result').first().click();
    await page.getByRole('searchbox',{name:'ابحث عن عمل'}).fill('Berserk');
    await page.locator('.lf-profile-list-results .is-result').first().click();
    assert.equal(await page.locator('.is-editing li').count(),2);
    const original=await page.locator('.is-editing li strong').allTextContents();
    await page.getByRole('button',{name:'خفض الترتيب',exact:true}).first().click();
    assert.deepEqual(await page.locator('.is-editing li strong').allTextContents(),original.slice().reverse());
    await page.getByRole('button',{name:'حفظ القائمة',exact:true}).click();
    await page.locator('[data-profile-folder]').waitFor();
    await page.reload();
    await page.getByRole('tab',{name:'القوائم',exact:true}).click();
    assert.equal(await page.locator('[data-profile-folder]').count(),1);
    await page.locator('[data-profile-folder]').click();
    assert.deepEqual(await page.locator('.lf-profile-ranked-list li strong').allTextContents(),original.slice().reverse());
    await page.getByRole('button',{name:'العودة للقوائم'}).click();
    await page.screenshot({path:path.join(out,'owner-lists-ar.png')});
    evidence.push('owner work list creation, reorder, save and reload');
    await page.getByRole('button',{name:'قائمة جديدة',exact:true}).click();
    await page.getByRole('textbox',{name:'اسم القائمة',exact:true}).fill('أفضل شخصيات ون بيس');
    await page.getByRole('searchbox',{name:'ابحث عن عمل'}).fill('One Piece');
    await page.locator('.lf-profile-list-results .is-result').first().click();
    await page.locator('.lf-profile-list-results .is-result').first().waitFor({timeout:45000});
    await page.locator('.lf-profile-list-results .is-result').first().click();
    await page.locator('.lf-profile-list-results .is-result:not(:disabled)').first().click();
    assert.equal(await page.locator('.is-editing li').count(),2);
    await page.getByRole('button',{name:'حفظ القائمة',exact:true}).click();
    await page.locator('[data-profile-folder]').first().waitFor();
    await page.locator('[data-profile-folder]').first().click();
    await page.screenshot({path:path.join(out,'owner-characters-ar.png')});
    evidence.push('character catalog selection and ranked list');
    await page.getByRole('button',{name:'العودة للقوائم'}).click();
    await page.locator('[data-profile-folder]').first().click();
    await page.getByRole('button',{name:'تعديل القائمة',exact:true}).click();
    await page.getByRole('textbox',{name:'اسم القائمة',exact:true}).fill('أسوأ شخصيات ون بيس');
    await page.getByRole('checkbox',{name:'ظاهرة للجميع',exact:true}).uncheck();
    await page.getByRole('button',{name:'حفظ القائمة',exact:true}).click();
    await page.locator('[data-profile-folder]').first().waitFor();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lorefy.user.profileLists.v1'))[0].isPublic),false);
    await page.locator('[data-profile-folder]').first().click();
    await page.getByRole('button',{name:'حذف القائمة',exact:true}).click();
    await page.getByRole('button',{name:'حذف',exact:true}).click();
    assert.equal(await page.locator('[data-profile-folder]').count(),1);
    evidence.push('rename, private visibility and confirmed deletion');
    await page.getByRole('tab',{name:'التغريدات',exact:true}).click();
    await page.getByRole('button',{name:'كتابة تغريدة',exact:true}).click();
    const composer=page.locator('.lf-community-compose-sheet');
    await composer.locator('textarea').fill('تغريدة فهد لاختبار تبويب البروفايل');
    await composer.locator('.lf-community-compose-submit').click();
    await composer.waitFor({state:'detached'});
    await page.locator('.lf-profile-post-feed .lf-community-post-card').waitFor();
    await page.locator('.lf-profile-post-feed .lf-community-post-body').first().click();
    await page.locator('.lf-community-thread').waitFor();
    await page.locator('.lf-community-thread button[aria-label="إغلاق"]').click();
    await page.screenshot({path:path.join(out,'owner-posts-ar.png')});
    evidence.push('post composer, profile feed, thread opening');
    await page.evaluate(()=>{
      const reader=window.LorefyPreviewReaders.findReader('qa-tester-02');
      window.dispatchEvent(new CustomEvent('lorefy:open-reader-profile',{detail:reader}));
    });
    await page.locator('.lf-reader-full').waitFor();
    await page.getByRole('tab',{name:'القوائم',exact:true}).click();
    await page.locator('[data-profile-folder]').waitFor();
    assert.equal(await page.getByRole('button',{name:'قائمة جديدة',exact:true}).count(),0);
    await page.locator('[data-profile-folder]').first().click();
    assert.equal(await page.locator('.lf-profile-ranked-list li').count(),10);
    assert.equal(await page.getByRole('button',{name:'تعديل القائمة',exact:true}).count(),0);
    await page.screenshot({path:path.join(out,'visitor-ranked-list-ar.png')});
    evidence.push('public owner-specific folder content and read-only visitor');
    for (const width of [320,375,390,414,430,440,768]) {
      await page.setViewportSize({width,height:956});
      await page.getByRole('tab',{name:'الرئيسية',exact:true}).click();
      await page.getByRole('tab',{name:'القوائم',exact:true}).click();
      const layout=await page.locator('.lf-reader-full').evaluate(n=>({
        width:n.clientWidth, scroll:n.scrollWidth,
        tabs:[...n.querySelectorAll('[role=tab]')].map(t=>({w:t.clientWidth,s:t.scrollWidth}))
      }));
      assert.ok(layout.scroll<=layout.width+1,JSON.stringify({width,layout}));
      assert.ok(layout.tabs.every(t=>t.s<=t.w+1),JSON.stringify({width,layout}));
    }
    evidence.push('no horizontal overflow at 320, 375, 390, 414, 430, 440 and 768px');
    await page.setViewportSize({width:440,height:956});
    await page.evaluate(()=>{
      localStorage.setItem('lorefy.ui.lang.v1',JSON.stringify('en'));
      document.documentElement.lang='en';document.documentElement.dir='ltr';
    });
    await page.getByRole('tab',{name:'Lists',exact:true}).waitFor();
    await page.screenshot({path:path.join(out,'visitor-lists-en.png')});
    await page.getByRole('tab',{name:'Posts',exact:true}).click();
    await page.locator('.lf-profile-section-panel').getByText('No posts yet',{exact:true}).waitFor();
    evidence.push('English profile tab and empty post translations');
    await page.evaluate(()=>{
      localStorage.setItem('lorefy.ui.lang.v1',JSON.stringify('en'));
      localStorage.setItem('lorefy.ui.theme.v1','custom-dark-cd6611');
      localStorage.setItem('lorefy.user.profileLayout.v1',JSON.stringify('immersive'));
    });
    await page.reload();
    await page.getByRole('tab',{name:'Lists',exact:true}).click();
    assert.equal(await page.locator('.lf-profile-page').getAttribute('data-profile-layout'),'immersive');
    assert.equal(await page.locator('[data-profile-folder]').count(),1);
    await settleTabs(page);
    await page.screenshot({path:path.join(out,'owner-lists-en-custom.png')});
    await page.getByRole('tab',{name:'Lists',exact:true}).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getByRole('tab',{name:'Posts',exact:true}).getAttribute('aria-selected'),'true');
    await page.locator('.lf-profile-post-feed .lf-community-post-card').waitFor();
    const post=page.locator('.lf-profile-post-feed .lf-community-post-card').first();
    const like=post.locator('.lf-community-post-like');
    await like.click();
    assert.equal(await like.getAttribute('aria-pressed'),'true');
    await page.getByRole('tab',{name:'Overview',exact:true}).click();
    assert.equal(await page.locator('.lf-profile-favorites').first().isVisible(),true);
    assert.equal(await page.locator('.lf-owner-post-metric').isVisible(),false);
    await page.getByRole('tab',{name:'Posts',exact:true}).click();
    assert.equal(await page.getByRole('tab',{name:'Posts',exact:true}).getAttribute('aria-selected'),'true');
    evidence.push('fresh English startup, panoramic custom theme, keyboard tabs, reactions and no duplicate post shortcut');
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({evidence,pageErrors:errors},null,2));
    console.log(JSON.stringify({evidence,pageErrors:errors},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
