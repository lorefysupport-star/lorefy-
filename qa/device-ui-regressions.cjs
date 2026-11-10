const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'C:/Users/PCD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.LOREFY_QA_URL || 'http://127.0.0.1:8796';
const out = path.join(__dirname, '../output/playwright/device-ui-20261109');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [], failures = [];
  fs.mkdirSync(out, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 440, height: 956 } });
    await page.goto(base + '/index.html?preview=demo&demo=ready&route=profile&adaptive=1', { waitUntil: 'domcontentloaded' });
    await page.locator('.lf-profile-section-tabs').waitFor();
    await page.evaluate(() => {
      localStorage.setItem('lorefy.user.profileLists.v1', JSON.stringify([{ id: 'safe-area-check', name: 'QA list', kind: 'works', isPublic: true,
        items: Array.from({ length: 12 }, (_, i) => ({ id: 'qa-' + i, name: 'QA work ' + i })) }]));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.lf-profile-section-tabs').waitFor();
    for (const lang of ['ar', 'en']) {
      for (const layout of ['normal', 'immersive', 'reader']) {
        await page.evaluate(({ lang, layout }) => {
          localStorage.setItem('lorefy.ui.lang.v1', JSON.stringify(lang));
          localStorage.setItem('lorefy.user.profileLayout.v1', JSON.stringify(layout));
        }, { lang, layout });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.locator('.lf-profile-section-tabs').waitFor();
        assert.equal(await page.locator('.lf-profile-page').getAttribute('data-profile-layout'), layout);
        for (const safeTop of [0, 62]) {
          await page.evaluate(safeTop => {
            document.documentElement.style.setProperty('--nc-top', safeTop + 'px');
            document.querySelector('.lf-app').style.setProperty('--nc-top', safeTop + 'px');
          }, safeTop);
          const lists = page.getByRole('tab', { name: lang === 'ar' ? 'القوائم' : 'Lists', exact: true });
          await lists.click();
          await page.locator('[data-profile-folder="safe-area-check"]').click();
          const back = page.getByRole('button', { name: lang === 'ar' ? 'العودة للقوائم' : 'Back to lists', exact: true });
          const rect = await back.boundingBox();
          const hit = await back.evaluate(el => {
            const r = el.getBoundingClientRect();
            return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          });
          const result = { kind: 'list-safe-area', lang, layout, safeTop, top: rect.y, hit };
          results.push(result);
          if (rect.y < safeTop || !hit) failures.push(result);
          await page.screenshot({ path: path.join(out, `list-${lang}-${layout}-${safeTop}.png`) });
          await back.click();
          await page.locator('[data-profile-folder="safe-area-check"]').waitFor();
        }
      }
    }
    // Use the shipped styles and the actual post action DOM order in both contexts.
    const css = ['styles/lorefy-community.css', 'styles/lorefy-home-immersive.css'].map(file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')).join('\n');
    for (const dir of ['rtl', 'ltr']) {
      await page.setContent(`<html dir="${dir}"><style>${css}</style><main class="lf-app"><section class="lf-home-cinema" id="feed"></section><section class="lf-community-thread" id="thread"></section></main></html>`);
      await page.evaluate(() => {
        const actions = '<footer class="lf-community-post-actions"><button class="lf-community-post-replies">Reply</button><button class="lf-community-post-like">Like</button><button class="lf-community-post-dislike">Dislike</button><button>Save</button><button>Share</button></footer>';
        document.querySelector('#feed').innerHTML = actions;
        document.querySelector('#thread').innerHTML = actions;
      });
      const orders = await page.evaluate(() => Object.fromEntries(['feed', 'thread'].map(id => [id,
        [...document.querySelectorAll('#' + id + ' button')].sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x).map(el => el.textContent)])));
      results.push({ kind: 'post-action-parity', dir, ...orders });
      if (JSON.stringify(orders.feed) !== JSON.stringify(orders.thread)) failures.push({ dir, ...orders });
    }
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, failures }, null, 2));
    console.log(JSON.stringify({ results, failures }, null, 2));
    assert.deepEqual(failures, [], 'Device-observed safe area and action-order regressions');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
