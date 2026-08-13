const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  organizeCatalog,
  sameWork,
  validWorkTitle
} = require('../modules/lorefy-catalog-identity.js');

function loadCatalogParts() {
  const uploads = path.join(__dirname, '..', 'uploads');
  const parts = fs.readdirSync(uploads)
    .filter((name) => /^lorefy-data-part\d+\.js$/.test(name))
    .sort();
  const sandbox = { window: { LorefyMangaData: [] } };
  sandbox.window.window = sandbox.window;
  parts.forEach((name) => {
    vm.runInNewContext(fs.readFileSync(path.join(uploads, name), 'utf8'), sandbox, { filename: name });
  });
  return sandbox.window.LorefyMangaData;
}

test('merges MAL and AniList records for Solo Leveling into one complete work', () => {
  const aliases = {};
  const works = [
    {
      id: 'mal-manhwa-121496-solo-leveling',
      title: 'Solo Leveling',
      type: 'مانهوا',
      auth: 'Chugong',
      yr: 2016,
      ch: 0,
      vol: 0,
      pop: 145459,
      sourceCoverUrl: 'https://cdn.myanimelist.net/solo.jpg'
    },
    {
      id: 'anilist-105398',
      title: 'Solo Leveling',
      type: 'مانهوا',
      auth: 'Seong-Rak Jang',
      yr: 2018,
      ch: 201,
      vol: 15,
      pop: 75737,
      sourceCoverUrl: 'https://s4.anilist.co/solo.jpg'
    }
  ];

  const report = organizeCatalog(works, { aliases });

  assert.equal(works.length, 1);
  assert.equal(works[0].id, 'mal-manhwa-121496-solo-leveling');
  assert.equal(works[0].ch, 201);
  assert.equal(works[0].vol, 15);
  assert.equal(aliases['anilist-105398'], works[0].id);
  assert.equal(report.duplicatesRemoved, 1);
});

test('keeps genuinely different works with the same title separate', () => {
  const works = [
    { id: 'mal-manga-13290', title: 'No Longer Human', type: 'مانجا', auth: 'Usamaru Furuya', yr: 2009 },
    { id: 'anilist-43290', title: 'No Longer Human', type: 'مانجا', auth: 'Furuya, Usamaru', yr: 2009 },
    { id: 'mal-manga-106609', title: 'No Longer Human', type: 'مانجا', auth: 'Junji Ito', yr: 2017 },
    { id: 'anilist-107790', title: 'No Longer Human', type: 'مانجا', auth: 'Itou, Junji', yr: 2017 }
  ];

  organizeCatalog(works, { aliases: {} });

  assert.equal(works.length, 2);
  assert.notEqual(works[0].yr, works[1].yr);
});

test('merges duplicate editions by matching cover or author and year', () => {
  const byCover = [
    { id: 'ol-a', title: 'Reading by Numbers', type: 'رواية', auth: 'Worpole, Ken', yr: 1984, sourceCoverUrl: 'https://covers.openlibrary.org/b/id/4160939-L.jpg' },
    { id: 'ol-b', title: 'Reading by numbers', type: 'رواية', auth: 'Ken Worpole', yr: 1984, sourceCoverUrl: 'https://covers.openlibrary.org/b/id/4160939-M.jpg' }
  ];
  assert.equal(sameWork(byCover[0], byCover[1], {}), true);
  organizeCatalog(byCover, { aliases: {} });
  assert.equal(byCover.length, 1);
});

test('bounds same-title organization for hostile large groups', () => {
  const works = Array.from({ length: 2000 }, (_, index) => ({
    id: `remote-${index}`,
    title: 'Same Title',
    type: 'مانجا',
    yr: 1980 + (index % 40)
  }));
  const started = Date.now();
  const report = organizeCatalog(works, { aliases: {} });
  const elapsed = Date.now() - started;

  assert.equal(report.after, 2000);
  assert.equal(report.duplicatesRemoved, 0);
  assert.ok(elapsed < 1000, `same-title organization took ${elapsed}ms`);
});

test('bounds colliding author-year candidates without changing their identity result', () => {
  const works = Array.from({ length: 8000 }, (_, index) => ({
    id: `remote-colliding-${index}`,
    title: 'Same Title',
    type: 'Manga',
    auth: 'Same Author',
    yr: 2000
  }));
  const started = Date.now();
  const report = organizeCatalog(works, { aliases: {} });
  const elapsed = Date.now() - started;

  assert.equal(report.after, 1);
  assert.equal(report.duplicatesRemoved, 7999);
    assert.ok(elapsed < 5000, `colliding author-year organization took ${elapsed}ms`);
});

test('rejects empty and numeric-only catalog titles', () => {
  assert.equal(validWorkTitle(''), false);
  assert.equal(validWorkTitle('12'), false);
  assert.equal(validWorkTitle('  '), false);
  assert.equal(validWorkTitle('One Piece'), true);
  assert.equal(validWorkTitle('1984: A Novel'), true);
});

test('organizes all bundled catalog parts with no remaining duplicate identities', () => {
  const works = loadCatalogParts();
  const before = works.length;
  const report = organizeCatalog(works, { aliases: {} });

  assert.ok(report.duplicatesRemoved > 500, `expected a library-wide cleanup, removed ${report.duplicatesRemoved}`);
  assert.ok(works.length < before);
  assert.ok(works.every((work) => validWorkTitle(work.title, work)));

  const solo = works.filter((work) => work.type === 'مانهوا' && work.title.toLowerCase() === 'solo leveling');
  assert.equal(solo.length, 1);

  const exactTitleGroups = new Map();
  works.forEach((work) => {
    const key = `${work.type}|${work.title.toLowerCase()}`;
    if (!exactTitleGroups.has(key)) exactTitleGroups.set(key, []);
    exactTitleGroups.get(key).push(work);
  });
  for (const group of exactTitleGroups.values()) {
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        assert.equal(sameWork(group[i], group[j], {}), false, `${group[i].id} duplicates ${group[j].id}`);
      }
    }
  }
});

test('browser bootstrap organizes loaded catalog parts before the app mounts', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'lorefy-catalog-identity.js'), 'utf8');
  const sandbox = {
    window: {
      LorefyMangaData: [
        { id: 'mal-manhwa-1', title: 'Solo Leveling', type: 'مانهوا', auth: 'Chugong', yr: 2016 },
        { id: 'anilist-1', title: 'Solo Leveling', type: 'مانهوا', auth: 'Seong-Rak Jang', yr: 2018 }
      ],
      LorefyCatalogAliases: {}
    }
  };
  sandbox.window.window = sandbox.window;

  vm.runInNewContext(source, sandbox, { filename: 'lorefy-catalog-identity.js' });

  assert.equal(sandbox.window.LorefyMangaData.length, 1);
  assert.equal(sandbox.window.LorefyCatalogAliases['anilist-1'], 'mal-manhwa-1');
});

test('every catalog entrypoint organizes records before refreshing the interface', () => {
  const root = path.join(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const loader = fs.readFileSync(path.join(root, 'modules', 'lorefy-catalog-loader.js'), 'utf8');
  const updater = fs.readFileSync(path.join(root, 'modules', 'lorefy-catalog-updater.js'), 'utf8');
  const apiCatalog = fs.readFileSync(path.join(root, 'modules', 'lorefy-api-catalog.js'), 'utf8');

  const identityAt = index.indexOf('modules/lorefy-catalog-identity.js');
  const appAt = index.indexOf('uploads/files/lorefy-app.js');
  assert.ok(identityAt > 0 && identityAt < appAt, 'catalog identity must run before the app');

  assert.ok(loader.indexOf('LorefyCatalogIdentity.organizeCatalog') < loader.indexOf('__lorefyIngest'));
  assert.ok(updater.indexOf('LorefyCatalogIdentity.organizeCatalog') < updater.indexOf('__lorefyIngest'));
  assert.match(apiCatalog, /LorefyCatalogIdentity\.uniqueWorks/);
  assert.match(apiCatalog, /LorefyCatalogIdentity\.sameWork/);
});
