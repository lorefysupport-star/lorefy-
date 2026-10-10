import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = path.join(root, 'uploads', 'catalog-runtime');
const summary = JSON.parse(fs.readFileSync(path.join(runtime, 'manifest.json'), 'utf8'));
const parts = fs.readdirSync(runtime)
  .map(name => /^lorefy-data-part(\d+)\.json$/.exec(name))
  .filter(Boolean)
  .map(match => Number(match[1]))
  .sort((a, b) => a - b);

if (!parts.length || parts.some((part, index) => part !== index + 1)) {
  throw new Error('Catalog runtime parts must be consecutively numbered.');
}

const rows = [];
for (const part of parts) {
  const name = `lorefy-data-part${String(part).padStart(2, '0')}.json`;
  const records = JSON.parse(fs.readFileSync(path.join(runtime, name), 'utf8'));
  if (!Array.isArray(records)) throw new Error(`${name} is not an array.`);
  for (const work of records) {
    if (!work || !work.id || !work.title) throw new Error(`Invalid work in ${name}.`);
    // Keep exactly the fields used by LorefyCatalogData.matchesCatalogQuery.
    // Full records stay in their existing parts and are loaded only when needed.
    rows.push([
      part, work.id, work.title, work.ar || '', work.auth || work.author || '',
      work.type || '', work.altTitles || [], work.aliases || [], work.authorAliases || []
    ]);
  }
}
if (rows.length !== summary.count) {
  throw new Error(`Search index has ${rows.length} records; runtime manifest expects ${summary.count}.`);
}

const output = path.join(root, 'uploads', 'catalog-search-index.json');
fs.writeFileSync(output, JSON.stringify({schema: 1, sourceHash: summary.contentHash, records: rows}));
console.log(`Indexed ${rows.length} works from ${parts.length} parts (${fs.statSync(output).size} bytes).`);
