const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const outputPath = path.join(root, 'uploads', 'lorefy-booktok-library.js');
const cacheDir = path.join(__dirname, '.cache', 'booktok-library');

// The first group is TikTok Newsroom's June 2026 #BookTok reading list. The
// rest are durable high-discovery BookTok titles, retained to keep the shelf
// useful between editorial refreshes. Ratings are deliberately left unrated;
// selection by a trend list is not a reader score.
const CURATED_WORKS = [
  ['Daggermouth', 'H. M. Wolfe', 'رومانسية ديستوبية', 'TikTok 2026 Summer'],
  ['Alchemised', 'SenLinYu', 'فانتازيا رومانسية', 'TikTok 2026 Summer'],
  ['There Is No Antimemetics Division', 'QNTM', 'خيال علمي', 'TikTok 2026 Summer'],
  ['The Secrets We Hide', 'Karin Slaughter', 'غموض وتشويق', 'TikTok 2026 Summer'],
  ['Near to the Wild Heart', 'Clarice Lispector', 'أدب', 'TikTok 2026 Summer'],
  ['The Word for World Is Forest', 'Ursula K. Le Guin', 'خيال علمي', 'TikTok 2026 Summer'],
  ['The Song of Achilles', 'Madeline Miller', 'خيال تاريخي', 'TikTok 2026 Summer'],
  ['Just for the Summer', 'Abby Jimenez', 'رومانسية', 'TikTok 2026 Summer'],
  ['The Last Contract of Isako', 'Fonda Lee', 'خيال علمي', 'TikTok 2026 Summer'],
  ['Mistborn', 'Brandon Sanderson', 'فانتازيا', 'TikTok 2026 Summer'],
  ['The Housemaid', 'Freida McFadden', 'إثارة نفسية', 'BookTok evergreen'],
  ["The Housemaid's Secret", 'Freida McFadden', 'إثارة نفسية', 'BookTok evergreen'],
  ['Never Lie', 'Freida McFadden', 'إثارة نفسية', 'BookTok evergreen'],
  ['Fourth Wing', 'Rebecca Yarros', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['Iron Flame', 'Rebecca Yarros', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['Onyx Storm', 'Rebecca Yarros', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['Quicksilver', 'Callie Hart', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['Powerless', 'Lauren Roberts', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['Reckless', 'Lauren Roberts', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['Fearless', 'Lauren Roberts', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['A Court of Thorns and Roses', 'Sarah J. Maas', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['The Serpent and the Wings of Night', 'Carissa Broadbent', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['The Cruel Prince', 'Holly Black', 'فانتازيا', 'BookTok evergreen'],
  ['Once Upon a Broken Heart', 'Stephanie Garber', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ['Divine Rivals', 'Rebecca Ross', 'فانتازيا رومانسية', 'BookTok evergreen'],
  ["A Good Girl's Guide to Murder", 'Holly Jackson', 'غموض وتشويق', 'BookTok evergreen'],
  ['The Inheritance Games', 'Jennifer Lynn Barnes', 'غموض', 'BookTok evergreen'],
  ['The Naturals', 'Jennifer Lynn Barnes', 'غموض', 'BookTok evergreen'],
  ['The Love Hypothesis', 'Ali Hazelwood', 'رومانسية', 'BookTok evergreen'],
  ['Deep End', 'Ali Hazelwood', 'رومانسية', 'BookTok evergreen'],
  ['It Ends with Us', 'Colleen Hoover', 'رومانسية معاصرة', 'BookTok evergreen'],
  ['Verity', 'Colleen Hoover', 'إثارة نفسية', 'BookTok evergreen'],
  ['The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', 'دراما تاريخية', 'BookTok evergreen'],
  ['The Silent Patient', 'Alex Michaelides', 'إثارة نفسية', 'BookTok evergreen'],
  ['Butcher & Blackbird', 'Brynne Weaver', 'رومانسية مظلمة', 'BookTok evergreen'],
  ['The Perfect Marriage', 'Jeneva Rose', 'إثارة قانونية', 'BookTok evergreen'],
  ['The Poppy War', 'R. F. Kuang', 'فانتازيا مظلمة', 'BookTok evergreen'],
  ['Babel', 'R. F. Kuang', 'فانتازيا تاريخية', 'BookTok evergreen'],
  ['Yellowface', 'R. F. Kuang', 'أدب معاصر', 'BookTok evergreen'],
  ['Caraval', 'Stephanie Garber', 'فانتازيا', 'BookTok evergreen'],
  ['Icebreaker', 'Hannah Grace', 'رومانسية رياضية', 'BookTok evergreen'],
  ['Twisted Love', 'Ana Huang', 'رومانسية معاصرة', 'BookTok evergreen']
];

function slug(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function cachePathFor(title, author) {
  return path.join(cacheDir, `${slug(`${title}-${author}`)}.json`);
}

async function fetchOpenLibrary(title, author) {
  const cachePath = cachePathFor(title, author);
  if (fs.existsSync(cachePath)) return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('title', title);
  url.searchParams.set('author', author);
  url.searchParams.set('limit', '5');
  url.searchParams.set('fields', 'title,author_name,first_publish_year,cover_i,key');
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error(`Open Library ${response.status} for ${title}`);
  const payload = await response.json();
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(payload));
  return payload;
}

function matchOpenLibrary(payload, title, author) {
  const normalizedTitle = String(title).toLowerCase();
  const normalizedAuthor = String(author).toLowerCase();
  const docs = Array.isArray(payload && payload.docs) ? payload.docs : [];
  return docs.find((item) => {
    const itemTitle = String(item && item.title || '').toLowerCase();
    const authors = Array.isArray(item && item.author_name) ? item.author_name.join(' ').toLowerCase() : '';
    return itemTitle === normalizedTitle && authors.includes(normalizedAuthor.split(' ')[0]);
  }) || docs[0] || null;
}

function makeRecord([title, auth, genre, shelf], source) {
  const coverId = Number(source && source.cover_i) || 0;
  const year = Number(source && source.first_publish_year) || 0;
  return {
    id: `lorefy-booktok-${slug(`${title}-${auth}`)}`,
    title,
    ar: title,
    auth,
    type: 'رواية',
    yr: year,
    r: 0,
    rSrc: 'اختيار BookTok',
    pop: 0,
    baseRatings: 0,
    sourceCoverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : '',
    genres: [genre, 'BookTok'],
    tags: ['BookTok', 'رائج', shelf],
    language: 'en',
    source: 'TikTok Newsroom + Lorefy editorial',
    _apiDynamic: true,
    _apiSource: 'booktok',
    _apiSourceId: slug(`${title}-${auth}`),
    synopsis: `رواية منتقاة ضمن قوائم ${shelf === 'TikTok 2026 Summer' ? 'TikTok الرسمية لصيف 2026' : 'BookTok الرائجة'}.`
  };
}

function render(records, metadata) {
  return `/* Generated by tools/build-booktok-library.js. Do not hand-edit. */\n` +
    `(function (global) {\n` +
    `  var records = ${JSON.stringify(records)};\n` +
    `  global.LorefyMangaData = global.LorefyMangaData || [];\n` +
    `  Array.prototype.push.apply(global.LorefyMangaData, records);\n` +
    `  global.LorefyBookTokLibrary = ${JSON.stringify(metadata)};\n` +
    `})(window);\n`;
}

async function main() {
  const records = [];
  for (const work of CURATED_WORKS) {
    let source = null;
    try {
      source = matchOpenLibrary(await fetchOpenLibrary(work[0], work[1]), work[0], work[1]);
    } catch (error) {
      console.warn(`Metadata lookup failed for ${work[0]}: ${error.message}`);
    }
    records.push(makeRecord(work, source));
  }
  const ids = new Set(records.map((work) => work.id));
  if (ids.size !== records.length) throw new Error('Duplicate BookTok record identifiers');
  fs.writeFileSync(outputPath, render(records, {
    schema: 1,
    version: '2026-08-30-booktok-library-v1',
    source: 'TikTok Newsroom June 2026 + Lorefy editorial',
    generatedAt: new Date().toISOString(),
    count: records.length,
    officialTikTokCount: CURATED_WORKS.filter((work) => work[3] === 'TikTok 2026 Summer').length
  }));
  console.log(JSON.stringify({ count: records.length, outputPath }));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
