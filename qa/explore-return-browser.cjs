const assert=require('node:assert/strict');
const {chromium}=require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.LOREFY_QA_URL || 'http://127.0.0.1:8843';
(async()=>{
  const browser=await chromium.launch();
  try{
    for(const [lang,width] of [['ar',320],['en',390]]){
      const page=await browser.newPage({viewport:{width,height:780},serviceWorkers:'block'});
      await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      await page.goto(base+'/output/library-workbench/qa/tester-app.html?preview=demo&demo=ready&qaTester=qa-tester-02&route=discover&lang='+lang,{waitUntil:'domcontentloaded'});
      await page.locator('#explore-tab-browse').click();
      await page.locator('.lf-explore-category').filter({hasText:lang==='ar'?'مانجا':'Manga'}).first().click();
      const dialog=page.locator('.lf-explore-dialog'),chip=page.locator('.lf-explore-applied button');
      await page.locator('.lf-explore-format-filter').click();
      await dialog.locator('select').nth(1).selectOption('completed');
      await dialog.locator('select').nth(2).selectOption('rating');
      await dialog.locator('.lf-explore-save').click();
      const card=page.locator('.lf-explore-format-grid .lf-explore-work-open').nth(10);
      await card.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
      const title=await card.getAttribute('title'), before=await card.evaluate(n=>n.getBoundingClientRect().top);
      await card.click();
      await page.locator('.lf-navigation-back').first().click();
      await chip.waitFor();
      assert.equal(await card.getAttribute('title'),title);
      assert.ok(Math.abs(await card.evaluate(n=>n.getBoundingClientRect().top)-before)<12,'format scroll restored');
      await page.locator('.lf-explore-format-filter').click();
      assert.equal(await dialog.locator('select').nth(1).inputValue(),'completed');
      assert.equal(await dialog.locator('select').nth(2).inputValue(),'rating');
      await dialog.locator('.lf-explore-icon').click();
      await chip.click();
      assert.equal(await chip.count(),0);
      await page.locator('.lf-explore-format-filter').click();
      assert.equal(await dialog.locator('select').nth(1).inputValue(),'all');
      await dialog.locator('.lf-explore-icon').click();
      await page.locator('.lf-explore-header > button').first().click();
      await page.locator('input[type=search]:visible').first().fill('the');
      await page.locator('.lf-explore-search-more').click();
      const extra=page.locator('.lf-design-search-grid .lf-explore-work-open').nth(40);
      await extra.click();
      await page.locator('.lf-navigation-back').first().click();
      await extra.waitFor();
      assert.equal(await page.locator('input[type=search]:visible').first().inputValue(),'the');
      await page.close();
      console.log('PASS: '+lang+' '+width+'px, format filters, sort, scroll and expanded search');
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
