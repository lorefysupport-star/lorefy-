// Start the local app server first. No production accounts or services are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.LOREFY_PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.LOREFY_QA_URL || 'http://127.0.0.1:8795/index.html?preview=demo&demo=ready&route=home';
const out = process.env.LOREFY_QA_OUT || path.join(__dirname, '../output/playwright/friend-activity');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.LOREFY_CHROME ? { executablePath: process.env.LOREFY_CHROME } : {}) });
  const errors = [], results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route('**/*', route => new URL(route.request().url()).origin === new URL(url).origin || /^(data:|blob:)/.test(route.request().url()) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(() => window.LorefyFriendActivity && window.ReactDOM && document.querySelector('#screen .lf-app'));
    await page.evaluate(() => {
      const host = document.createElement('div');
      host.id = 'friend-layout-qa'; host.className = 'lf-app';
      host.style.cssText = 'position:fixed;inset:0;z-index:999999;overflow:auto;background:var(--lf-bg,#111);';
      document.body.appendChild(host);
      window.friendLayoutRoot = ReactDOM.createRoot(host);
      const style = document.createElement('style');
      style.textContent = '#friend-layout-qa[data-large="true"] .lf-friend-reader,#friend-layout-qa[data-large="true"] .lf-friend-score-value{font-size:22px!important}';
      document.head.appendChild(style);
    });
    for (const width of [320, 360, 390, 440]) for (const language of ['ar', 'en']) for (const theme of ['dark', 'light', 'pink', 'custom-light', 'custom-dark']) for (const large of [false, true]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(({ language, theme, large }) => {
        const host = document.querySelector('#friend-layout-qa');
        const mode = theme.startsWith('custom-') ? LorefyDesignSystem.customMode('#955baf', theme.endsWith('dark') ? 'dark' : 'light') : theme;
        const palette = LorefyDesignSystem.palette(mode);
        host.className = 'lf-app' + (LorefyDesignSystem.isDark(mode) ? ' is-dark' : ''); host.dataset.large = String(large);
        for (const [key, value] of Object.entries(LorefyDesignSystem.tokens(mode))) host.style.setProperty(key, value);
        for (const [key, field] of Object.entries({ bg: 'bg', text: 'text', sub: 'sub', fill: 'fill', border: 'border', accent: 'accent' })) host.style.setProperty('--lf-' + key, palette[field]);
        host.style.fontFamily = getComputedStyle(document.querySelector('#screen .lf-app')).fontFamily;
        const names = ['قارئ باسم طويل جداً للاختبار Reader 123', 'Reader with a very long mixed name قارئ', 'ريم', 'A'];
        const reviews = names.map((name, i) => ({ id: 'qa-' + i, userId: 'qa-' + i, mid: 'work-' + i, user: name, r: [.25, 2.75, 4.5, 5][i], ts: 100 - i }));
        window.friendLayoutRoot.render(React.createElement(LorefyFriendActivity.Rails, {
          language, following: reviews.map(r => r.userId), reviews,
          getWork: id => ({ id, title: 'QA book ' + id }),
          cover: () => 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="%234d6870"/></svg>',
          fallback: () => '', onWork() {}, onReader() {},
          Stars: () => React.createElement('span', null, '★★★★★')
        }));
      }, { language, theme, large });
      await page.waitForFunction(language => document.querySelector('#friend-layout-qa .lf-friend-activity')?.dir === (language === 'ar' ? 'rtl' : 'ltr'), language);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const cards = await page.locator('#friend-layout-qa .lf-friend-section:first-child .lf-friend-item').evaluateAll(items => items.map(item => {
        const reader = item.querySelector('.lf-friend-reader'), score = item.querySelector('.lf-friend-score'), value = score.querySelector('b');
        const c = item.getBoundingClientRect(), n = reader.getBoundingClientRect(), s = score.getBoundingClientRect(), v = value.getBoundingClientRect();
        return { separate: s.top >= n.bottom - .5, contained: s.left >= c.left - .5 && s.right <= c.right + .5, unclipped: value.scrollWidth <= value.clientWidth + 1, target: n.height >= 44, direction: getComputedStyle(value).direction, value: value.textContent, offset: s.top - c.top };
      }));
      const result = { width, language, theme, large, cards }; results.push(result);
      fs.writeFileSync(path.join(out, 'layout-results.json'), JSON.stringify({ results, errors }, null, 2));
      assert.equal(cards.length, 4);
      for (const card of cards) {
        assert.ok(card.separate, JSON.stringify(result));
        assert.ok(card.contained && card.unclipped && card.target, JSON.stringify(result));
        assert.equal(card.direction, 'ltr');
      }
      assert.deepEqual(cards.map(c => c.value), ['0.25', '2.75', '4.5', '5']);
      assert.ok(Math.max(...cards.map(c => c.offset)) - Math.min(...cards.map(c => c.offset)) < 1);
      if (width === 390 && !large) await page.screenshot({ path: path.join(out, `friends-${language}-${theme}.png`) });
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ cases: results.length, cards: results.length * 4, pageErrors: errors }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
