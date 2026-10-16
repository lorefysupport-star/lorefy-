const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.LOREFY_QA_URL || 'http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=home';
const out = process.env.LOREFY_QA_OUT || path.join(__dirname, '../output/playwright/diary-position');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.LOREFY_CHROME ? { executablePath: process.env.LOREFY_CHROME } : {}) });
  const results = [], errors = [];
  try {
    for (const language of ['ar', 'en']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin || /^(data:|blob:)/.test(route.request().url()) ? route.continue() : route.abort());
      const page = await context.newPage(); page.setDefaultTimeout(7000);
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.waitForFunction(() => window.LorefyReadingDiary && document.querySelector('#screen .lf-app') && window.LorefyMangaData?.length);
      const bookId = await page.evaluate(language => {
        const progress = JSON.parse(localStorage.getItem('lorefy.user.progress.v2') || '{}');
        const work = LorefyMangaData.find(w => /^(Book|كتاب)$/.test(w.type) && !progress[w.id]);
        if (!work) throw Error('No unstarted book in demo catalog');
        document.documentElement.lang = language;
        LorefyReadingDiary.open({ workId: work.id, compose: 'note' }); return work.id;
      }, language);
      assert.equal(await page.locator('.lf-diary-position-kind[aria-pressed=true]').innerText(), language === 'ar' ? 'صفحة' : 'Page');
      assert.equal(await page.locator('.lf-diary-position-input').inputValue(), '');
      await page.locator('.lf-diary-position-input').fill('23');
      await page.locator('textarea.lf-diary-textarea:not(.lf-diary-quote-input)').fill('QA private page note');
      await page.locator('.lf-diary-spoiler input').check();
      await page.screenshot({ path: path.join(out, `book-page-${language}.png`) });
      await page.locator('.lf-diary-save').click();
      await page.waitForFunction(() => !document.querySelector('.lf-diary-form'));
      const saved = await page.evaluate(id => JSON.parse(localStorage.getItem('lorefy.user.readingDiary.v1')).find(e => e.id === id && e.note === 'QA private page note'), bookId);
      assert.equal(saved.anchorType, 'page'); assert.equal(saved.anchorValue, 23); assert.equal(saved.chapter, 0);
      assert.equal(saved.spoiler, true);
      assert.equal(await page.getByText('QA private page note', { exact: true }).count(), 0);
      await page.locator('[data-diary-spoiler=reveal]').click();
      await page.getByText('QA private page note', { exact: true }).waitFor();
      await page.locator('[data-diary-spoiler=hide]').click();
      assert.equal(await page.getByText('QA private page note', { exact: true }).count(), 0);
      await page.reload();
      const persisted = await page.evaluate(id => JSON.parse(localStorage.getItem('lorefy.user.readingDiary.v1')).find(e => e.id === id && e.note === 'QA private page note'), bookId);
      assert.deepEqual(persisted, saved);
      results.push({ language, unit: saved.anchorType, position: saved.anchorValue, savedAndReloaded: true, spoilerRevealAndHide: true });
      await context.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log(JSON.stringify({ results, errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
