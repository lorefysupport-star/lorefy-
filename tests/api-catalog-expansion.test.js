const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const {
  MIN_NEW_PER_TYPE,
  TYPE_SLUGS,
  selectNewWorks,
  validateExpansionManifest
} = require('../tools/catalog-expansion-core.js');
const catalogIdentity = require('../modules/lorefy-catalog-identity.js');
const { loadBundledCatalog } = require('../tools/build-api-catalog-expansion.js');

test('catalog expansion policy covers every section with 500 new works', () => {
  assert.equal(MIN_NEW_PER_TYPE, 500);
  assert.deepEqual(Object.keys(TYPE_SLUGS).sort(), [
    'Book', 'Comics', 'Light Novel', 'Manga',
    'Manhua', 'Manhwa', 'Novel', 'Web Novel'
  ]);

  const config = fs.readFileSync(path.join(root, 'config', 'lorefy-config.js'), 'utf8');
  assert.match(config, /minimumNewWorksPerType:\s*500/);
  // The selected type's local shard loads after the base catalog; other types stay lazy.
  assert.match(config, /autoWarmCurrentType:\s*true/);
  assert.match(config, /warmAllTypes:\s*false/);
  assert.match(config, /pagesPerWarmType:\s*0/);
});

test('candidate selection excludes bundled identities and duplicate editions', () => {
  const existing = [
    { id: 'mal-1', title: 'Solo Leveling', auth: 'Chugong', type: 'Manhwa', yr: 2016 }
  ];
  const candidates = [
    { id: 'anilist-1', title: 'Solo Leveling', auth: 'Chugong', type: 'Manhwa', yr: 2016 },
    { id: 'anilist-2', title: 'A New Journey', auth: 'Writer A', type: 'Manhwa', yr: 2024 },
    { id: 'md-2', title: 'A New Journey', auth: 'Writer A', type: 'Manhwa', yr: 2024 },
    { id: 'anilist-3', title: 'Another Work', auth: 'Writer B', type: 'Manhwa', yr: 2025 }
  ];

  const selected = selectNewWorks(existing, candidates, 'Manhwa', 500);
  assert.deepEqual(selected.map((work) => work.id), ['anilist-2', 'anilist-3']);
});

test('legacy API additions remain available when promoted into the larger bundled catalog', () => {
  const manifestPath = path.join(root, 'output', 'api-catalog', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'run tools/build-api-catalog-expansion.js');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const report = validateExpansionManifest(manifest, path.dirname(manifestPath));

  assert.equal(report.valid, true, report.errors.join('\n'));
  const bundled = loadBundledCatalog();
  catalogIdentity.organizeCatalog(bundled, { aliases: {} });
  for (const type of Object.keys(TYPE_SLUGS)) {
    assert.ok(report.counts[type] >= MIN_NEW_PER_TYPE, `${type} has ${report.counts[type]} additions`);
    const entry = manifest.types[type];
    const shard = JSON.parse(fs.readFileSync(path.join(path.dirname(manifestPath), entry.file), 'utf8')).works;
    const combined = bundled.map((work) => ({ ...work })).concat(shard.map((work) => ({ ...work })));
    const aliases = {};
    catalogIdentity.organizeCatalog(combined, { aliases });
    const ids = new Set(combined.map(work=>work.id));
    // Bulk imports can already contain these source works. They must still
    // resolve to a real canonical record, not be counted again as new works.
    for(const work of shard) {
      let id=work.id;
      const visited=new Set();
      while(aliases[id] && !visited.has(id)){visited.add(id);id=aliases[id];}
      assert.ok(ids.has(id),`${type}: lost ${work.id}`);
    }
  }
});

test('the canonical bundled catalog plus the lightweight API baseline stays above 21.9k series-level works', () => {
  const manifestPath = path.join(root, 'output', 'api-catalog', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const combined = loadBundledCatalog().map((work) => ({ ...work }));

  for (const type of Object.keys(TYPE_SLUGS)) {
    const entry = manifest.types[type];
    const shard = JSON.parse(fs.readFileSync(path.join(path.dirname(manifestPath), entry.file), 'utf8')).works;
    combined.push(...shard.slice(0, 100).map((work) => ({ ...work })));
  }

  catalogIdentity.organizeCatalog(combined, { aliases: {} });
  // Comics are counted as series now, not as separate print editions.
  assert.ok(combined.length >= 21_900, `expected >= 21.9k canonical works, got ${combined.length}`);
});

test('app serves and consumes the paginated expansion endpoint lazily', () => {
  const server = fs.readFileSync(path.join(root, 'tools', 'lorefy-api-server.js'), 'utf8');
  const catalog = fs.readFileSync(path.join(root, 'modules', 'lorefy-api-catalog.js'), 'utf8');

  assert.match(server, /\/api\/catalog\/expanded/);
  assert.match(catalog, /loadExpandedType/);
  assert.match(catalog, /minimumNewWorksPerType/);
  assert.match(catalog, /baselineWarmTarget/);
  assert.match(catalog, /lorefy:catalog-ready/);
  assert.match(catalog, /document\.readyState\s*===\s*["']loading["']/);
});
