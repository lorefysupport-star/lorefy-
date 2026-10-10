const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const metadata = require('../modules/lorefy-chapter-metadata.js');

const wikiResponse = {
  query: {
    pages: {
      99: {
        pageid: 99,
        title: 'Chapter 1',
        pageimage: 'Kimetsu_no_Yaiba_CH1.png',
        thumbnail: { source: 'https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/d/d6/Kimetsu_no_Yaiba_CH1.png/revision/latest/scale-to-width-down/240' },
        revisions: [{ slots: { main: { '*': '{{Chapter Infobox\n|name = Cruelty\n|chapter title = Cruelty\n|volume = [[Volume 1|1]]\n|pages = 56\n|date = February 15th, 2016\n}}' } } }]
      },
      100: {
        pageid: 100,
        title: 'Chapter 2',
        pageimage: 'Unrelated.png',
        thumbnail: { source: 'https://evil.example/chapter.png' },
        revisions: [{ slots: { main: { '*': '{{Chapter Infobox\n|chapter title = The Stranger\n|volume = [[Volume 1|1]]\n}}' } } }]
      }
    }
  }
};

test('Hunter x Hunter has a verified chapter source and an official offline baseline', () => {
  const source = metadata.sourceFor('mal-manga-26-hunter-x-hunter');
  assert.ok(source, 'ongoing manga must not disappear because MAL has no final total');
  assert.equal(source.domain, 'hunterxhunter');
  assert.equal(source.count, 420);
  assert.equal(metadata.sourceFor('anilist-30026'), source);
  assert.equal(metadata.sourceFor('mal-manga-26-hunter-spinoff'), null);
  assert.equal(new URL(metadata.requestUrl(source, [1])).hostname, 'hunterxhunter.fandom.com');
});

test('the official offline baseline initializes shared progress metadata before the app mounts', () => {
  const work = { id: 'mal-manga-26-hunter-x-hunter', ch: 0, st: 'مكتملة', prog: { chapter: 12 } };
  const root = { document: {}, LorefyMangaData: [work], LorefyChapterData: { other: { chapters: 99 } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../modules/lorefy-chapter-metadata.js'), 'utf8'), { window: root });
  assert.equal(root.LorefyChapterData[work.id]?.chapters, 420);
  assert.equal(root.LorefyChapterData[work.id]?.sourceUrl, metadata.sourceFor(work.id).countSourceUrl);
  assert.equal(root.LorefyChapterData.other.chapters, 99);
  assert.equal(work.st, 'مستمرة');
  assert.equal(work.prog.chapter, 12);
});

test('Hunterpedia fields retain the English title, real cover, volume and first publication date', () => {
  const result = metadata.parsePages({ query: { pages: { 1: {
    title: 'Chapter 1', pageimage: 'Chapter_1_Intro_Page.png',
    thumbnail: { source: 'https://static.wikia.nocookie.net/hunterxhunter/images/c/cf/Chapter_1_Intro_Page.png' },
    revisions: [{ slots: { main: { '*': '{{Hunterpedia:Chapter\n|Name = The Day of Departure\n|Page length = 32\n|Volume number = 1\n|Release Date = March 2<sup>nd</sup>, 1998 (\'\'Weekly Shonen Jump\'\') <br /> June 4, 1998 (tankobon)\n}}' } } }]
  } } } }, metadata.sourceFor('mal-manga-26-hunter-x-hunter'), [1]);
  assert.equal(result[1]?.title, 'The Day of Departure');
  assert.equal(result[1]?.volume, '1');
  assert.equal(result[1]?.pages, 32);
  assert.equal(result[1]?.date, 'March 2nd, 1998');
  assert.match(result[1]?.image || '', /hunterxhunter\/images/);
});

test('ongoing chapter catalogs traverse every API page and exclude extras and other series', async () => {
  let calls = 0;
  const fetcher = async url => {
    calls++;
    const query = new URL(url);
    assert.equal(query.hostname, 'kingdom.fandom.com');
    assert.equal(query.searchParams.get('apnamespace'), '0');
    const page = query.searchParams.get('apcontinue');
    return { ok: true, json: async () => page ? { query: { allpages: [
      { ns: 0, title: 'Chapter 501' }, { ns: 0, title: 'Chapter 502' }
    ] } } : { continue: { apcontinue: 'Chapter_501', continue: '-||' }, query: { allpages: [
      { ns: 0, title: 'Chapter 1' }, { ns: 0, title: 'Chapter 500' },
      { ns: 0, title: 'Chapter 500 Extra' }, { ns: 1, title: 'Chapter 999' },
      { ns: 0, title: 'Chapter 99 (another manga)' }
    ] } } };
  };
  const result = await metadata.loadCatalog('mal-manga-16765-kingdom', fetcher);
  assert.equal(calls, 2);
  assert.equal(result.total, 502);
  assert.deepEqual(result.numbers, [1, 500, 501, 502]);
  assert.equal(metadata.catalogFor('mal-manga-16765-kingdom'), result);
  assert.equal(await metadata.loadCatalog('anilist-46765', fetcher), result);
  assert.equal(calls, 2, 'identical works share the same catalog cache');
});

test('missing chapter totals can use the exact MAL identity without inventing ongoing totals', async () => {
  const unknown = await metadata.loadCatalog('mal-manga-999999-test', async url => {
    assert.equal(url, 'https://api.jikan.moe/v4/manga/999999');
    return { ok: true, json: async () => ({ data: { mal_id: 999999, chapters: null } }) };
  });
  assert.equal(unknown.total, 0);
  const completed = await metadata.loadCatalog('mal-manga-11-naruto', async () => ({
    ok: true, json: async () => ({ data: { mal_id: 11, chapters: 700 } })
  }));
  assert.equal(completed.total, 700);
  assert.equal(completed.numbers, null);
  const unrelated = await metadata.loadCatalog('mal-manga-999998-test', async () => ({
    ok: true, json: async () => ({ data: { mal_id: 11, chapters: 700 } })
  }));
  assert.equal(unrelated.total, 0);
});

test('failed catalogs never turn partial pages into a complete list and can be retried', async () => {
  await assert.rejects(metadata.loadCatalog('mal-manga-135496-dandadan', async () => ({
    ok: true, json: async () => ({ error: { code: 'ratelimited' } })
  })));
  assert.equal(metadata.catalogFor('mal-manga-135496-dandadan'), null);
  const retry = await metadata.loadCatalog('mal-manga-135496-dandadan', async () => ({
    ok: true, json: async () => ({ query: { allpages: [{ ns: 0, title: 'Chapter 1' }] } })
  }), true);
  assert.deepEqual(retry.numbers, [1]);
});

test('indented chapter infobox fields and release date aliases are supported', () => {
  const result = metadata.parsePages({ query: { pages: { 1: {
    title: 'Chapter 1', revisions: [{ slots: { main: { '*': '{{Chapter Infobox\n | title = The Legendary Hit Man\n | pages = 55\n | release date = November 21, 2020\n}}' } } }]
  } } } }, metadata.sourceFor('mal-manga-131334-sakamoto-days'), [1]);
  assert.equal(result[1]?.title, 'The Legendary Hit Man');
  assert.equal(result[1]?.pages, 55);
  assert.equal(result[1]?.date, 'November 21, 2020');
});

test('Kingdom accepts its verified historical image namespace and a final inline infobox field', () => {
  const result = metadata.parsePages({ query: { pages: { 1: {
    title: 'Chapter 1', pageimage: 'Chapter_1_cover.png',
    thumbnail: { source: 'https://static.wikia.nocookie.net/kingdom-anime/images/4/4b/Chapter_1_cover.png' },
    revisions: [{ slots: { main: { '*': '{{Chapters\n|chapter title= The Boy with No Name\n|pages=54}}' } } }]
  } } } }, metadata.sourceFor('mal-manga-16765-kingdom'), [1]);
  assert.equal(result[1]?.pages, 54);
  assert.match(result[1]?.image || '', /kingdom-anime/);
});

test('One-Punch Man includes the online manga chapters but not the different webcomic', async () => {
  const source = metadata.sourceFor('mal-manga-44347-one-punch-man');
  const catalog = await metadata.loadCatalog('mal-manga-44347-one-punch-man', async () => ({
    ok: true, json: async () => ({ query: { allpages: [
      { ns: 0, title: 'Chapter 1' }, { ns: 0, title: 'Chapter 200' },
      { ns: 0, title: 'Chapter 201 (Online)' }, { ns: 0, title: 'Chapter 270 (Online)' },
      { ns: 0, title: 'Chapter 400 (Webcomic)' }
    ] } })
  }));
  assert.equal(catalog.total, 270);
  assert.deepEqual(catalog.numbers, [1, 200, 201, 270]);
  assert.match(new URL(metadata.requestUrl(source, [201])).searchParams.get('titles'), /Chapter 201 \(Online\)/);
  const result = metadata.parsePages({ query: { pages: { 1: {
    title: 'Chapter 201 (Online)', revisions: [{ slots: { main: { '*': '{{Chapter\n|title= Online manga\n}}' } } }]
  }, 2: {
    title: 'Chapter 201 (Webcomic)', revisions: [{ slots: { main: { '*': '{{Chapter\n|title= Webcomic\n}}' } } }]
  } } } }, source, [201]);
  assert.equal(result[201]?.title, 'Online manga');
  assert.match(result[201]?.sourceUrl || '', /Chapter_201_\(Online\)/);
});

test('wiki metadata is limited to verified work identities', () => {
  assert.equal(metadata.sourceFor('mal-manga-96792-kimetsu-no-yaiba').domain, 'kimetsu-no-yaiba');
  assert.equal(metadata.sourceFor('mal-manga-13-one-piece').domain, 'onepiece');
  assert.equal(metadata.sourceFor('mal-manga-116778-chainsaw-man').domain, 'chainsaw-man');
  assert.equal(metadata.sourceFor('mal-manga-113138-jujutsu-kaisen').domain, 'jujutsu-kaisen');
  assert.equal(metadata.sourceFor('mal-manga-113138-jujutsu-kaisen').count, 271);
  assert.equal(metadata.sourceFor('mal-manga-140150-chainsaw-man'), null);
  assert.equal(metadata.sourceFor('mal-manga-96792-kimetsu-academy'), null);
  assert.equal(metadata.sourceFor('mal-manga-1-monster'), null);
});

test('chapter infoboxes using singular page still supply the page count', () => {
  const source = metadata.sourceFor('mal-manga-116778-chainsaw-man');
  const parsed = metadata.parsePages({ query: { pages: { 1: {
    title: 'Chapter 1', pageimage: 'Chapter_1_Title_Page.png',
    thumbnail: { source: 'https://static.wikia.nocookie.net/chainsaw-man/images/a/a6/Chapter_1_Title_Page.png/revision/latest/scale-to-width-down/280' },
    revisions: [{ slots: { main: { '*': '{{Chapter box\n|title = Dog & Chainsaw\n|page = 54\n|date = December 3, 2018\n}}' } } }]
  } } } }, source, [1]);
  assert.equal(parsed[1].title, 'Dog & Chainsaw');
  assert.equal(parsed[1].pages, 54);
  assert.match(parsed[1].image, /chainsaw-man/);
});

test('wiki query requests only the visible chapter range', () => {
  const source = metadata.sourceFor('mal-manga-96792-kimetsu-no-yaiba');
  const url = new URL(metadata.requestUrl(source, [1, 2]));
  assert.equal(url.hostname, 'kimetsu-no-yaiba.fandom.com');
  assert.equal(url.searchParams.get('titles'), 'Chapter 1|Chapter 2');
  assert.equal(url.searchParams.get('rvsection'), '0');
  assert.equal(url.searchParams.get('origin'), '*');
});

test('extracts real chapter title, cover, volume, and date while rejecting unrelated images', () => {
  const source = metadata.sourceFor('mal-manga-96792-kimetsu-no-yaiba');
  const result = metadata.parsePages(wikiResponse, source, [1, 2]);
  assert.deepEqual(result[1], {
    number: 1,
    title: 'Cruelty',
    image: wikiResponse.query.pages[99].thumbnail.source + '?format=original',
    volume: '1',
    pages: 56,
    date: 'February 15th, 2016',
    sourceUrl: 'https://kimetsu-no-yaiba.fandom.com/wiki/Chapter_1'
  });
  assert.equal(result[2].title, 'The Stranger');
  assert.equal(result[2].image, '');
  assert.equal(result[3], undefined);
});

test('malformed wiki fields do not become chapter titles or clickable images', () => {
  const source = metadata.sourceFor('mal-manga-13-one-piece');
  const result = metadata.parsePages({ query: { pages: { 1: {
    title: 'Chapter 1', pageimage: 'Chapter_1.png',
    thumbnail: { source: 'javascript:alert(1)' },
    revisions: [{ slots: { main: { '*': '{{Chapter Box\n|title = {{Ruby|悪|あく}}\n|ename = Romance Dawn\n}}' } } }]
  } } } }, source, [1]);
  assert.equal(result[1].title, 'Romance Dawn');
  assert.equal(result[1].image, '');
});

test('wiki release dates are rendered in Arabic without changing the sourced day', () => {
  assert.match(metadata.displayDate('February 15th, 2016'), /١٥.*فبراير.*٢٠١٦/);
  assert.equal(metadata.displayDate('February 15th, 2016','en'), 'February 15, 2016');
  assert.equal(metadata.displayDate('unknown date'), 'unknown date');
});

test('chapter metadata enriches the work page and ships in the offline shell', () => {
  const root = path.join(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const detail = fs.readFileSync(path.join(root, 'modules/lorefy-chapter-detail.js'), 'utf8');
  assert.match(index, /modules\/lorefy-chapter-metadata\.js/);
  assert.match(worker, /modules\/lorefy-chapter-metadata\.js/);
  assert.match(detail, /metadata\.load\(/);
  assert.match(detail, /lf-chapter-title/);
  assert.match(detail, /lf-chapter-art/);
  assert.match(detail, /LorefyDataProxy\.mediaUrl/);
  assert.match(detail, /verifiedSource\.count/);
});
