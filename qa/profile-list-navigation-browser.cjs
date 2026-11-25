const assert = require('node:assert/strict');
const {chromium} = require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.LOREFY_QA_URL || 'http://127.0.0.1:8843';

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
    await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await page.goto(base+'/index.html?preview=demo&demo=ready&adaptive=1&route=profile',{waitUntil:'domcontentloaded'});
    const owner = page.locator('.lf-profile-page:not(.lf-public-profile-page)').first();
    await owner.locator('[role=tab]').first().waitFor();
    await page.evaluate(() => {
      if (LorefyBackend.mode !== 'demo') throw Error('Test requires isolated demo');
      const folders=Array.from({length:32},(_,i)=>({id:'list-'+i,name:'List '+i,isPublic:true,items:[]}));
      localStorage.setItem('lorefy.user.profileLists.v1',JSON.stringify(folders));
    });
    await owner.locator('[role=tab]').nth(1).click();
    const card=owner.locator('[data-profile-folder="list-21"]');
    await card.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
    const top=await card.evaluate(n=>n.getBoundingClientRect().top);
    const ancestry=n=>{let a=[];for(;n;n=n.parentElement)if(n.scrollHeight>n.clientHeight)a.push([n.className||n.tagName,n.scrollTop,n.clientHeight,n.scrollHeight,getComputedStyle(n).overflowY]);return a;};
    const before=await card.evaluate(ancestry);
    await card.click();
    const detail=owner.locator('.lf-profile-list-intro h2');
    await detail.waitFor();
    await page.evaluate(()=>dispatchEvent(new CustomEvent('lorefy:stored-state',{detail:{key:'lorefy.user.profileLists.v1'}})));
    assert.equal(await detail.count(),1,'storage refresh must not close detail');
    await owner.locator('.lf-profile-list-toolbar-actions button').first().click();
    const name=owner.locator('.lf-profile-list-editor input[type=text]');
    await name.fill('Unsaved');
    await owner.locator('[role=tab]').nth(1).click();
    assert.equal(await name.inputValue(),'Unsaved');
    await owner.locator('.lf-profile-section-panel header button').first().click();
    assert.equal(await detail.textContent(),'List 21','cancel returns to the unmodified detail');
    await owner.locator('.lf-profile-list-toolbar .is-back').click();
    const after=await card.evaluate(n=>n.getBoundingClientRect().top);
    assert.ok(Math.abs(after-top)<4,JSON.stringify({top,after,before,end:await card.evaluate(ancestry)}));
    assert.ok(await card.evaluate(n=>document.activeElement===n),'focus returns to the card');
    const id='profile-nav-visitor';
    await page.evaluate(id=>{
      const reader={...LorefyPreviewReaders.findReader('qa-tester-01'),id,profile_lists:[{id:'public-list',name:'Original',isPublic:true,items:[]}]};
      LorefyBackend.getPublicProfile=async()=>reader;
      dispatchEvent(new CustomEvent('lorefy:open-reader-profile',{detail:reader}));
    },id);
    const visitor=page.locator('.lf-reader-full');
    await visitor.locator('[role=tab]').nth(1).click();
    await visitor.locator('[data-profile-folder="public-list"]').click();
    const intro=visitor.locator('.lf-profile-list-intro');
    const old=await intro.elementHandle();
    const refresh=(name,isPublic)=>page.evaluate(({name,isPublic})=>{
      const page=document.querySelector('.lf-reader-full');
      const profile={...page.__lorefyProfileSnapshot,profile_lists:[{id:'public-list',name,isPublic,items:[]}]};
      page.__lorefyProfileSnapshot=profile;
      dispatchEvent(new CustomEvent('lorefy:profile-snapshot',{detail:{profile}}));
    },{name,isPublic});
    await refresh('Original',true);
    assert.ok(await old.evaluate(n=>n.isConnected),'identical refresh preserves the reading view');
    await refresh('Renamed',true);
    assert.equal(await intro.locator('h2').textContent(),'Renamed');
    await refresh('Renamed',false);
    assert.equal(await intro.count(),0,'private detail removed');
    assert.equal(await visitor.locator('[data-profile-folder="public-list"]').count(),0);
    console.log('PASS: owner position, focus and draft; visitor refresh, rename and privacy.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
