const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.LOREFY_QA_URL || 'http://127.0.0.1:8796';
const out = path.join(__dirname, '../output/playwright/profile-caption-20261110');

(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync(out, { recursive: true });
  const results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 440, height: 956 } });
    await page.goto(base + '/index.html?preview=demo&demo=ready&route=profile&adaptive=1', { waitUntil: 'domcontentloaded' });
    await page.locator('.lf-profile-section-tabs').waitFor();
    await page.evaluate(() => {
      const reader = window.LorefyPreviewReaders.findReader('qa-tester-01');
      localStorage.setItem('lorefy.user.favorites.v2', JSON.stringify(reader.favorite_work_ids));
      localStorage.setItem('lorefy.user.profileLayout.v1', JSON.stringify('reader'));
      localStorage.setItem('lorefy.library.view.v1', 'grid');
    });
    for (const lang of ['ar', 'en']) {
      await page.evaluate(lang => localStorage.setItem('lorefy.ui.lang.v1', JSON.stringify(lang)), lang);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.lf-reader-layout-cover-title').first().waitFor();
      assert.equal(await page.locator('.lf-profile-page').getAttribute('data-profile-layout'), 'reader');
      await page.evaluate(() => document.fonts.ready);
      for (const width of [320, 390, 440]) {
        await page.setViewportSize({ width, height: 956 });
        const rows = await page.locator('.lf-profile-favorites .lf-reader-layout-cover-title').evaluateAll(nodes => nodes.map(el => {
          const style = getComputedStyle(el);
          const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
          return { text: el.textContent, height: el.clientHeight, padding, line: parseFloat(style.lineHeight) };
        }));
        assert.ok(rows.length, 'Populated Reader favorites required');
        results.push({ lang, width, rows });
        await page.screenshot({ path: path.join(out, `captions-${lang}-${width}.png`) });
      }
    }
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    for (const sample of results) for (const row of sample.rows) {
      assert.ok(row.height - row.padding >= row.line * 2 - 1,
        `Two complete lines need room inside padding: ${JSON.stringify({ lang: sample.lang, width: sample.width, ...row })}`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
