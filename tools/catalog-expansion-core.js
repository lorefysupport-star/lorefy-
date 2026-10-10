const fs = require('node:fs');
const path = require('node:path');

const MIN_NEW_PER_TYPE = 500;

const TYPE_SLUGS = Object.freeze({
  Manga: 'manga',
  Manhwa: 'manhwa',
  Manhua: 'manhua',
  Comics: 'comics',
  Novel: 'novel',
  Book: 'book',
  'Light Novel': 'light-novel',
  'Web Novel': 'web-novel'
});

const TYPE_LABELS = Object.freeze({
  Manga: '\u0645\u0627\u0646\u062c\u0627',
  Manhwa: '\u0645\u0627\u0646\u0647\u0648\u0627',
  Manhua: '\u0645\u0627\u0646\u0647\u0648\u0627 \u0635\u064a\u0646\u064a\u0629',
  Comics: '\u0643\u0648\u0645\u064a\u0643\u0633',
  Novel: '\u0631\u0648\u0627\u064a\u0629',
  Book: '\u0643\u062a\u0627\u0628',
  'Light Novel': '\u0644\u0627\u064a\u062a \u0646\u0648\u0641\u0644',
  'Web Novel': '\u0648\u064a\u0628 \u0646\u0648\u0641\u0644'
});

const TYPE_ALIASES = new Map();
for (const type of Object.keys(TYPE_SLUGS)) {
  TYPE_ALIASES.set(normalizeText(type), type);
  TYPE_ALIASES.set(normalizeText(TYPE_LABELS[type]), type);
}
TYPE_ALIASES.set('manhwa', 'Manhwa');
TYPE_ALIASES.set('manhua chinese', 'Manhua');
TYPE_ALIASES.set('light novels', 'Light Novel');
TYPE_ALIASES.set('web novels', 'Web Novel');
TYPE_ALIASES.set('\u0643\u062a\u0628', 'Book');

function cleanText(value) {
  return String(value == null ? '' : value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function normalizeType(value) {
  return TYPE_ALIASES.get(normalizeText(value)) || String(value || '').trim();
}

function authorKey(value) {
  const normalized = normalizeText(value);
  if (!normalized || /^(unknown|n a|anonymous)$/.test(normalized)) return '';
  return normalized.split(' ').filter(Boolean).sort().join(' ');
}

function providerIdentity(work) {
  const sourceId = cleanText(work && (work._apiSourceId || work.sourceId || work.source && work.source.id));
  const id = cleanText(work && work.id);
  if (sourceId) return `${normalizeText(work._apiSource || work.source && work.source.provider)}:${normalizeText(sourceId)}`;
  const ani = id.match(/(?:^|-)anilist-(\d+)/i);
  if (ani) return `anilist:${ani[1]}`;
  const mal = id.match(/(?:^|-)mal-(?:manga-)?(\d+)/i);
  if (mal) return `mal:${mal[1]}`;
  const ol = id.match(/(OL\d+[WM])/i);
  if (ol) return `open library:${ol[1].toLowerCase()}`;
  const md = id.match(/(?:^|-)md-([0-9a-f-]{24,})/i);
  if (md) return `mangadex:${md[1].toLowerCase()}`;
  return id ? `id:${normalizeText(id)}` : '';
}

function identityKey(work) {
  const title = normalizeText(work && (work.title || work.ar));
  const author = authorKey(work && (work.auth || work.author));
  const year = Number(work && (work.yr || work.year)) || 0;
  if (!title) return '';
  const format = normalizeType(work && work.type) === 'Web Novel' ? 'web:' : '';
  if (author) return `${format}title:${title}|author:${author}`;
  return `${format}title:${title}|year:${year || 'unknown'}`;
}

function buildIdentityIndex(works) {
  const ids = new Set();
  const providers = new Set();
  const identities = new Set();
  const titleYears = new Set();
  for (const work of Array.isArray(works) ? works : []) {
    const id = cleanText(work && work.id);
    const provider = providerIdentity(work);
    const identity = identityKey(work);
    const title = normalizeText(work && (work.title || work.ar));
    const year = Number(work && (work.yr || work.year)) || 0;
    if (id) ids.add(normalizeText(id));
    if (provider) providers.add(provider);
    if (identity) identities.add(identity);
    if (title && year) titleYears.add(`${title}|${year}`);
  }
  return { ids, providers, identities, titleYears };
}

function isIndexed(index, work) {
  const id = normalizeText(work && work.id);
  const provider = providerIdentity(work);
  const identity = identityKey(work);
  const title = normalizeText(work && (work.title || work.ar));
  const year = Number(work && (work.yr || work.year)) || 0;
  return Boolean(
    (id && index.ids.has(id)) ||
    (provider && index.providers.has(provider)) ||
    (identity && index.identities.has(identity)) ||
    (title && year && !authorKey(work && (work.auth || work.author)) && index.titleYears.has(`${title}|${year}`))
  );
}

function addToIndex(index, work) {
  const id = normalizeText(work && work.id);
  const provider = providerIdentity(work);
  const identity = identityKey(work);
  const title = normalizeText(work && (work.title || work.ar));
  const year = Number(work && (work.yr || work.year)) || 0;
  if (id) index.ids.add(id);
  if (provider) index.providers.add(provider);
  if (identity) index.identities.add(identity);
  if (title && year) index.titleYears.add(`${title}|${year}`);
}

function selectNewWorks(existing, candidates, type, limit = MIN_NEW_PER_TYPE) {
  const index = buildIdentityIndex(existing);
  const selected = [];
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    if (!candidate || !cleanText(candidate.title) || !cleanText(candidate.id)) continue;
    if (type && normalizeType(candidate.type) !== normalizeType(type)) continue;
    if (isIndexed(index, candidate)) continue;
    addToIndex(index, candidate);
    selected.push(candidate);
    if (selected.length >= limit) break;
  }
  return selected;
}

function validateExpansionManifest(manifest, directory) {
  const errors = [];
  const counts = {};
  if (!manifest || manifest.schema !== 1) errors.push('Invalid expansion manifest schema');
  if (!manifest || manifest.verifiedAgainstBundled !== true) errors.push('Expansion was not verified against bundled catalog');

  for (const [type, slug] of Object.entries(TYPE_SLUGS)) {
    const entry = manifest && manifest.types && manifest.types[type];
    if (!entry) {
      errors.push(`Missing ${type} manifest entry`);
      counts[type] = 0;
      continue;
    }
    const file = path.basename(entry.file || `${slug}.json`);
    const filePath = path.join(directory, file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing ${type} shard: ${file}`);
      counts[type] = 0;
      continue;
    }
    let works = [];
    try {
      const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      works = Array.isArray(payload) ? payload : payload.works || [];
    } catch (error) {
      errors.push(`Unreadable ${type} shard: ${error.message}`);
    }
    const unique = selectNewWorks([], works, type, Number.MAX_SAFE_INTEGER);
    counts[type] = unique.length;
    if (unique.length !== works.length) errors.push(`${type} shard contains ${works.length - unique.length} duplicate or invalid records`);
    if (unique.length < MIN_NEW_PER_TYPE) errors.push(`${type} has ${unique.length}/${MIN_NEW_PER_TYPE} verified additions`);
    if (Number(entry.count) !== works.length) errors.push(`${type} manifest count does not match shard`);
  }

  return { valid: errors.length === 0, counts, errors };
}

module.exports = {
  MIN_NEW_PER_TYPE,
  TYPE_SLUGS,
  TYPE_LABELS,
  cleanText,
  normalizeText,
  normalizeType,
  identityKey,
  providerIdentity,
  buildIdentityIndex,
  selectNewWorks,
  validateExpansionManifest
};
