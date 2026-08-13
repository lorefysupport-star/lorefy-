const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  MIN_NEW_PER_TYPE,
  TYPE_SLUGS,
  TYPE_LABELS,
  cleanText,
  normalizeText,
  normalizeType,
  selectNewWorks,
  validateExpansionManifest
} = require('./catalog-expansion-core.js');
const catalogIdentity = require('../modules/lorefy-catalog-identity.js');

const root = path.resolve(__dirname, '..');
const uploadsDir = path.join(root, 'uploads');
const outputDir = path.join(root, 'output', 'api-catalog');
const cacheDir = path.join(outputDir, '.cache');
const target = Number(process.env.LOREFY_API_TARGET || MIN_NEW_PER_TYPE);
const forceRefresh = process.env.LOREFY_REFRESH_API === '1';
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const OPEN_LIBRARY_SUBJECTS = {
  Book: [
    'science', 'history', 'philosophy', 'psychology', 'business', 'economics',
    'biography', 'technology', 'medicine', 'education', 'sociology',
    'political science', 'mathematics', 'astronomy', 'computer science'
  ],
  Novel: [
    'fantasy', 'historical fiction', 'science fiction', 'mystery', 'thriller',
    'romance', 'literary fiction', 'young adult fiction', 'crime fiction'
  ],
  Comics: [
    'graphic novels', 'comic books strips etc', 'comics', 'superheroes',
    'webcomics', 'comic strips'
  ],
  'Web Novel': [
    'serial fiction', 'online fiction', 'web novels', 'web fiction',
    'internet fiction', 'serialized fiction', 'fantasy fiction'
  ]
};

const ANILIST_CONFIGS = {
  Manga: [{ country: 'JP', format: 'MANGA' }],
  Manhwa: [{ country: 'KR', format: 'MANGA' }],
  Manhua: [{ country: 'CN', format: 'MANGA' }],
  'Light Novel': [{ country: 'JP', format: 'NOVEL' }],
  'Web Novel': [
    { country: 'KR', format: 'NOVEL' },
    { country: 'CN', format: 'NOVEL' }
  ]
};

const MANGADEX_LANGUAGES = {
  Manga: ['ja'],
  Manhwa: ['ko'],
  Manhua: ['zh', 'zh-hk']
};

const ANILIST_QUERY = `
query LorefyExpansion($page:Int,$perPage:Int,$country:CountryCode,$format:MediaFormat){
  Page(page:$page,perPage:$perPage){
    pageInfo{hasNextPage}
    media(type:MANGA,countryOfOrigin:$country,format:$format,sort:POPULARITY_DESC,isAdult:false){
      id idMal title{romaji english native} countryOfOrigin format status chapters volumes
      coverImage{extraLarge large medium} genres averageScore popularity favourites
      description(asHtml:false) startDate{year} siteUrl
      staff(sort:RELEVANCE,perPage:2){nodes{name{full}}}
    }
  }
}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function cachePathFor(key) {
  return path.join(cacheDir, `${key.replace(/[^a-z0-9_.-]+/gi, '-')}.json`);
}

async function fetchJsonCached(key, url, options = {}, attempts = 6) {
  const filePath = cachePathFor(key);
  if (!forceRefresh && fs.existsSync(filePath)) {
    const age = Date.now() - fs.statSync(filePath).mtimeMs;
    if (age < CACHE_MAX_AGE_MS) return readJson(filePath);
  }

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'LorefyCatalogExpansion/1.0',
          ...(options.headers || {})
        }
      }).finally(() => clearTimeout(timer));
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get('retry-after') || 0);
        const error = new Error(`${response.status} ${response.statusText}`);
        error.waitMs = retryAfter ? retryAfter * 1000 : Math.min(30000, 1500 * attempt);
        throw error;
      }
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const json = await response.json();
      writeJson(filePath, json);
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(error.waitMs || 1000 * attempt);
    }
  }
  throw lastError;
}

function loadBundledCatalog() {
  const files = fs.readdirSync(uploadsDir)
    .filter((name) => /^lorefy-data-part\d+\.js$/.test(name))
    .sort();
  const sandbox = { window: { LorefyMangaData: [] }, Array };
  sandbox.window.window = sandbox.window;
  for (const file of files) {
    vm.runInNewContext(fs.readFileSync(path.join(uploadsDir, file), 'utf8'), sandbox, { filename: file });
  }
  return sandbox.window.LorefyMangaData;
}

function clampRating(value) {
  let rating = Number(value) || 0;
  if (rating > 10) rating /= 20;
  else if (rating > 5) rating /= 2;
  if (!rating) rating = 3.8;
  return Math.max(1, Math.min(5, Math.round(rating * 10) / 10));
}

function statusLabel(value) {
  const status = String(value || '').toUpperCase();
  if (/FINISHED|COMPLETED/.test(status)) return '\u0645\u0643\u062a\u0645\u0644\u0629';
  if (/RELEASING|ONGOING/.test(status)) return '\u0645\u0633\u062a\u0645\u0631\u0629';
  if (/HIATUS|CANCELLED/.test(status)) return '\u0645\u062a\u0648\u0642\u0641\u0629';
  if (/NOT_YET/.test(status)) return '\u0642\u0627\u062f\u0645\u0629';
  return '\u0645\u0633\u062a\u0648\u0631\u062f\u0629';
}

function scoreFields(rating, visual) {
  return {
    story: rating,
    art: visual ? rating : Math.min(5, Math.round((rating + 0.1) * 10) / 10),
    trans: rating,
    chars: rating,
    world: Math.min(5, Math.round((rating + 0.1) * 10) / 10)
  };
}

function finishWork(work, type, provider, sourceId) {
  const rating = clampRating(work.r);
  const popularity = Math.max(1, Number(work.pop) || Number(work.baseRatings) || 100);
  const visual = ['Manga', 'Manhwa', 'Manhua', 'Comics'].includes(type);
  return {
    id: String(work.id),
    title: cleanText(work.title),
    ar: cleanText(work.ar || work.title),
    auth: cleanText(work.auth || 'Unknown'),
    yr: Number(work.yr) || 0,
    cover: '',
    coverMode: work.sourceCoverUrl ? 'external' : 'generated',
    sourceCoverUrl: cleanText(work.sourceCoverUrl),
    r: rating,
    rSrc: provider,
    st: statusLabel(work.st),
    ch: Math.max(0, Number(work.ch) || 0),
    vol: Math.max(0, Number(work.vol) || 0),
    pages: Math.max(0, Number(work.pages) || 0),
    pl: provider,
    type: TYPE_LABELS[type],
    synopsis: cleanText(work.synopsis || `${work.title} is available in the Lorefy ${type} catalog.`),
    rec: rating >= 4.3,
    sc: scoreFields(rating, visual),
    prog: { ch: 0 },
    mySt: null,
    pop: popularity,
    related: [],
    banner: '',
    baseRatings: Math.max(1, Number(work.baseRatings) || Math.round(popularity / 4)),
    baseReviews: Math.max(0, Number(work.baseReviews) || Math.round(popularity / 40)),
    weeklyReads: Math.max(0, Number(work.weeklyReads) || Math.round(popularity / 10)),
    listAdds: Math.max(0, Number(work.listAdds) || Math.round(popularity / 20)),
    genres: Array.isArray(work.genres) ? work.genres.map(cleanText).filter(Boolean).slice(0, 8) : [],
    coverImage: '',
    _apiDynamic: true,
    _apiSource: provider,
    _apiSourceId: String(sourceId || ''),
    _apiFetchedAt: new Date().toISOString()
  };
}

function mapAniList(media, type) {
  const title = cleanText(media && media.title && (media.title.english || media.title.romaji || media.title.native));
  if (!media || !media.id || !title) return null;
  const author = media.staff && media.staff.nodes && media.staff.nodes[0] && media.staff.nodes[0].name && media.staff.nodes[0].name.full;
  return finishWork({
    id: `anilist-${media.id}`,
    title,
    ar: media.title.native || title,
    auth: author,
    yr: media.startDate && media.startDate.year,
    sourceCoverUrl: media.coverImage && (media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium),
    r: Number(media.averageScore) / 20,
    st: media.status,
    ch: media.chapters,
    vol: media.volumes,
    synopsis: media.description,
    pop: media.popularity || media.favourites,
    baseRatings: media.popularity,
    baseReviews: media.favourites,
    genres: media.genres
  }, type, 'AniList', media.id);
}

function mapOpenLibrary(doc, type) {
  const olid = String(doc && doc.key || '').split('/').pop();
  if (!olid || !doc.title) return null;
  const title = cleanText(doc.title);
  const subjects = Array.isArray(doc.subject) ? doc.subject.slice(0, 8) : [];
  return finishWork({
    id: `ol-${olid}`,
    title,
    ar: title,
    auth: Array.isArray(doc.author_name) ? doc.author_name.slice(0, 2).join(', ') : 'Unknown',
    yr: doc.first_publish_year,
    sourceCoverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : '',
    r: doc.ratings_average,
    st: 'FINISHED',
    vol: doc.edition_count,
    pages: doc.number_of_pages_median,
    synopsis: `${title} by ${Array.isArray(doc.author_name) ? doc.author_name[0] : 'Unknown'}. Open Library subjects: ${subjects.slice(0, 3).join(', ') || type}.`,
    pop: doc.want_to_read_count || doc.ratings_count || doc.edition_count,
    baseRatings: doc.ratings_count,
    genres: subjects
  }, type, 'Open Library', olid);
}

function firstObjectValue(value) {
  if (!value || typeof value !== 'object') return '';
  return value.en || value['en-us'] || value.ja || value['ja-ro'] || value.ko || value['ko-ro'] || value.zh || value['zh-hk'] || Object.values(value)[0] || '';
}

function mapMangaDex(item, type) {
  const attrs = item && item.attributes;
  if (!item || !item.id || !attrs) return null;
  const title = cleanText(firstObjectValue(attrs.title) || (attrs.altTitles || []).map(firstObjectValue).find(Boolean));
  if (!title) return null;
  const coverRel = (item.relationships || []).find((rel) => rel.type === 'cover_art' && rel.attributes && rel.attributes.fileName);
  const authorRel = (item.relationships || []).find((rel) => rel.type === 'author' && rel.attributes && rel.attributes.name);
  const tags = (attrs.tags || []).map((tag) => cleanText(firstObjectValue(tag.attributes && tag.attributes.name))).filter(Boolean).slice(0, 8);
  return finishWork({
    id: `md-${item.id}`,
    title,
    ar: title,
    auth: authorRel && authorRel.attributes.name,
    yr: attrs.year,
    sourceCoverUrl: coverRel ? `https://uploads.mangadex.org/covers/${item.id}/${coverRel.attributes.fileName}.512.jpg` : '',
    r: 3.9,
    st: attrs.status,
    ch: Number(attrs.lastChapter) || 0,
    vol: Number(attrs.lastVolume) || 0,
    synopsis: cleanText(firstObjectValue(attrs.description)),
    pop: 800,
    genres: tags
  }, type, 'MangaDex', item.id);
}

function currentSelection(base, candidates, type) {
  const preliminary = selectNewWorks(base, candidates, type, Number.MAX_SAFE_INTEGER);
  const byTitle = new Map();

  function remember(work) {
    const key = `${normalizeType(work && work.type)}|${catalogIdentity.canonicalWorkKey(work && work.title)}`;
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(work);
  }

  for (const work of base) remember(work);
  const verified = [];
  for (const candidate of preliminary) {
    const key = `${normalizeType(candidate.type)}|${catalogIdentity.canonicalWorkKey(candidate.title)}`;
    const matches = byTitle.get(key) || [];
    if (matches.some((work) => catalogIdentity.sameWork(work, candidate, {}))) continue;
    remember(candidate);
    verified.push(candidate);
    if (verified.length >= target) break;
  }
  return verified;
}

async function collectAniList(type, base, candidates) {
  const configs = ANILIST_CONFIGS[type] || [];
  for (const config of configs) {
    for (let page = 1; page <= 50; page += 1) {
      if (currentSelection(base, candidates, type).length >= target) break;
      const json = await fetchJsonCached(
        `anilist-${TYPE_SLUGS[type]}-${config.country}-${page}`,
        'https://graphql.anilist.co',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: ANILIST_QUERY,
            variables: { page, perPage: 50, country: config.country, format: config.format }
          })
        }
      );
      const media = json && json.data && json.data.Page && json.data.Page.media || [];
      candidates.push(...media.map((item) => mapAniList(item, type)).filter(Boolean));
      const count = currentSelection(base, candidates, type).length;
      console.log(`${type}: AniList page ${page}, ${count}/${target} new`);
      if (!json || !json.data || !json.data.Page || !json.data.Page.pageInfo.hasNextPage || media.length === 0) break;
      await sleep(850);
    }
  }
}

async function collectMangaDex(type, base, candidates) {
  const languages = MANGADEX_LANGUAGES[type] || [];
  for (let page = 1; page <= 50; page += 1) {
    if (currentSelection(base, candidates, type).length >= target) break;
    const params = new URLSearchParams();
    params.set('limit', '100');
    params.set('offset', String((page - 1) * 100));
    params.append('includes[]', 'cover_art');
    params.append('includes[]', 'author');
    params.append('contentRating[]', 'safe');
    params.append('contentRating[]', 'suggestive');
    params.set('order[followedCount]', 'desc');
    for (const language of languages) params.append('originalLanguage[]', language);
    const json = await fetchJsonCached(
      `mangadex-${TYPE_SLUGS[type]}-${page}`,
      `https://api.mangadex.org/manga?${params}`
    );
    const rows = json && json.data || [];
    candidates.push(...rows.map((item) => mapMangaDex(item, type)).filter(Boolean));
    console.log(`${type}: MangaDex page ${page}, ${currentSelection(base, candidates, type).length}/${target} new`);
    if (rows.length === 0) break;
    await sleep(300);
  }
}

async function collectOpenLibrary(type, base, candidates) {
  const subjects = OPEN_LIBRARY_SUBJECTS[type] || [];
  for (const subject of subjects) {
    for (let page = 1; page <= 12; page += 1) {
      if (currentSelection(base, candidates, type).length >= target) return;
      const params = new URLSearchParams({
        subject,
        language: 'eng',
        fields: 'key,title,author_name,first_publish_year,cover_i,subject,ratings_average,ratings_count,want_to_read_count,edition_count,number_of_pages_median',
        limit: '100',
        page: String(page)
      });
      const json = await fetchJsonCached(
        `openlibrary-${TYPE_SLUGS[type]}-${normalizeText(subject).replace(/\s+/g, '-')}-${page}`,
        `https://openlibrary.org/search.json?${params}`
      );
      const docs = json && json.docs || [];
      const mapped = docs.map((doc) => mapOpenLibrary(doc, type)).filter(Boolean);
      mapped.sort((a, b) => Number(Boolean(b.sourceCoverUrl)) - Number(Boolean(a.sourceCoverUrl)) || b.pop - a.pop);
      candidates.push(...mapped);
      console.log(`${type}: Open Library ${subject} page ${page}, ${currentSelection(base, candidates, type).length}/${target} new`);
      if (docs.length === 0) break;
      await sleep(140);
    }
  }
}

async function collectType(type, base) {
  const candidates = [];
  if (ANILIST_CONFIGS[type]) await collectAniList(type, base, candidates);
  if (currentSelection(base, candidates, type).length < target && MANGADEX_LANGUAGES[type]) {
    await collectMangaDex(type, base, candidates);
  }
  if (currentSelection(base, candidates, type).length < target && OPEN_LIBRARY_SUBJECTS[type]) {
    await collectOpenLibrary(type, base, candidates);
  }
  return currentSelection(base, candidates, type);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });
  const bundled = loadBundledCatalog();
  const generated = [];
  const manifest = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    targetPerType: target,
    verifiedAgainstBundled: true,
    bundledWorksChecked: bundled.length,
    sources: ['AniList GraphQL API', 'MangaDex API', 'Open Library Search API'],
    types: {}
  };

  console.log(`Bundled works checked: ${bundled.length}`);
  for (const type of Object.keys(TYPE_SLUGS)) {
    const works = await collectType(type, bundled.concat(generated));
    if (works.length < target) throw new Error(`${type} reached only ${works.length}/${target} new works`);
    const file = `${TYPE_SLUGS[type]}.json`;
    const sources = works.reduce((counts, work) => {
      counts[work._apiSource] = (counts[work._apiSource] || 0) + 1;
      return counts;
    }, {});
    writeJson(path.join(outputDir, file), { schema: 1, type, count: works.length, works });
    manifest.types[type] = { file, count: works.length, sources };
    generated.push(...works);
    console.log(`${type}: complete with ${works.length} verified additions`);
  }

  manifest.totalWorks = generated.length;
  writeJson(path.join(outputDir, 'manifest.json'), manifest);
  const validation = validateExpansionManifest(manifest, outputDir);
  writeJson(path.join(outputDir, 'coverage-report.json'), validation);
  if (!validation.valid) throw new Error(validation.errors.join('\n'));
  console.log(JSON.stringify({ totalWorks: manifest.totalWorks, counts: validation.counts }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack || error);
    process.exitCode = 1;
  });
}

module.exports = { loadBundledCatalog, mapAniList, mapOpenLibrary, mapMangaDex, collectType };
