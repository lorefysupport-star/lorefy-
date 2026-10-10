const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const catalogPolicy = require('../modules/lorefy-catalog-policy.js');
const bibliography = require('../modules/lorefy-bibliographic-overrides.js');

const root = path.join(__dirname, '..');
const outputPath = path.join(root, 'uploads', 'lorefy-arabic-library.js');
const cacheDir = path.join(__dirname, '.cache', 'arabic-library');
const MIN_RECORDS = 500;
const MIN_RELIGIOUS_RECORDS = 250;

// These are broad Arabic discovery subjects, not title guesses. They make the
// import repeatable and keep the religious collection explicitly classified.
const SEARCHES = [
  { q: 'الإسلام', type: 'كتاب', collection: 'إسلامي', genre: 'Religion' },
  { q: 'القرآن', type: 'كتاب', collection: 'إسلامي', genre: 'Religion' },
  { q: 'الحديث', type: 'كتاب', collection: 'إسلامي', genre: 'Religion' },
  { q: 'الفقه', type: 'كتاب', collection: 'إسلامي', genre: 'Religion' },
  { q: 'العقيدة', type: 'كتاب', collection: 'إسلامي', genre: 'Religion' },
  { q: 'السيرة النبوية', type: 'كتاب', collection: 'إسلامي', genre: 'Religion' },
  { q: 'رواية', type: 'رواية', collection: 'أدب عربي', genre: 'Fiction' },
  { q: 'قصص', type: 'رواية', collection: 'أدب عربي', genre: 'Fiction' },
  { q: 'الأدب', type: 'رواية', collection: 'أدب عربي', genre: 'Fiction' },
  { q: 'شعر', type: 'كتاب', collection: 'أدب عربي', genre: 'Poetry' },
  { q: 'تاريخ', type: 'كتاب', collection: 'معرفة عربية', genre: 'History' },
  { q: 'فلسفة', type: 'كتاب', collection: 'معرفة عربية', genre: 'Philosophy' },
  { q: 'علم النفس', type: 'كتاب', collection: 'معرفة عربية', genre: 'Psychology' },
  { q: 'تطوير الذات', type: 'كتاب', collection: 'معرفة عربية', genre: 'Self-Help' }
];

// Anchor records cover Arabic classics that are often absent from public search
// APIs or only indexed in transliteration. They are bibliographic entries, not
// scans or copyrighted text.
const CURATED_WORKS = [
  ['صحيح البخاري', 'محمد بن إسماعيل البخاري', 846, 'كتاب', 'إسلامي', 'Religion'],
  ['صحيح مسلم', 'مسلم بن الحجاج', 875, 'كتاب', 'إسلامي', 'Religion'],
  ['سنن أبي داود', 'أبو داود السجستاني', 889, 'كتاب', 'إسلامي', 'Religion'],
  ['جامع الترمذي', 'محمد بن عيسى الترمذي', 892, 'كتاب', 'إسلامي', 'Religion'],
  ['سنن النسائي', 'أحمد بن شعيب النسائي', 915, 'كتاب', 'إسلامي', 'Religion'],
  ['سنن ابن ماجه', 'ابن ماجه القزويني', 887, 'كتاب', 'إسلامي', 'Religion'],
  ['موطأ الإمام مالك', 'مالك بن أنس', 795, 'كتاب', 'إسلامي', 'Religion'],
  ['رياض الصالحين', 'يحيى بن شرف النووي', 1277, 'كتاب', 'إسلامي', 'Religion'],
  ['الأربعون النووية', 'يحيى بن شرف النووي', 1277, 'كتاب', 'إسلامي', 'Religion'],
  ['الأذكار', 'يحيى بن شرف النووي', 1270, 'كتاب', 'إسلامي', 'Religion'],
  ['حصن المسلم', 'سعيد بن علي القحطاني', 1989, 'كتاب', 'إسلامي', 'Religion'],
  ['الرحيق المختوم', 'صفي الرحمن المباركفوري', 1979, 'كتاب', 'إسلامي', 'Religion'],
  ['زاد المعاد في هدي خير العباد', 'ابن قيم الجوزية', 1350, 'كتاب', 'إسلامي', 'Religion'],
  ['مدارج السالكين', 'ابن قيم الجوزية', 1350, 'كتاب', 'إسلامي', 'Religion'],
  ['الداء والدواء', 'ابن قيم الجوزية', 1350, 'كتاب', 'إسلامي', 'Religion'],
  ['تفسير القرآن العظيم', 'ابن كثير', 1373, 'كتاب', 'إسلامي', 'Religion'],
  ['جامع البيان عن تأويل آي القرآن', 'محمد بن جرير الطبري', 923, 'كتاب', 'إسلامي', 'Religion'],
  ['تيسير الكريم الرحمن في تفسير كلام المنان', 'عبد الرحمن السعدي', 1956, 'كتاب', 'إسلامي', 'Religion'],
  ['الجامع لأحكام القرآن', 'محمد بن أحمد القرطبي', 1273, 'كتاب', 'إسلامي', 'Religion'],
  ['في ظلال القرآن', 'سيد قطب', 1965, 'كتاب', 'إسلامي', 'Religion'],
  ['فقه السنة', 'السيد سابق', 1959, 'كتاب', 'إسلامي', 'Religion'],
  ['الفقه الإسلامي وأدلته', 'وهبة الزحيلي', 1984, 'كتاب', 'إسلامي', 'Religion'],
  ['العقيدة الواسطية', 'أحمد بن تيمية', 1328, 'كتاب', 'إسلامي', 'Religion'],
  ['العقيدة الطحاوية', 'أبو جعفر الطحاوي', 933, 'كتاب', 'إسلامي', 'Religion'],
  ['كتاب التوحيد', 'محمد بن عبد الوهاب', 1744, 'كتاب', 'إسلامي', 'Religion'],
  ['خلق المسلم', 'محمد الغزالي', 1960, 'كتاب', 'إسلامي', 'Religion'],
  ['جدد حياتك', 'محمد الغزالي', 1953, 'كتاب', 'إسلامي', 'Religion'],
  ['لا تحزن', 'عائض القرني', 2001, 'كتاب', 'إسلامي', 'Religion'],
  ['السيرة النبوية لابن هشام', 'عبد الملك بن هشام', 833, 'كتاب', 'إسلامي', 'Religion'],
  ['البداية والنهاية', 'ابن كثير', 1373, 'كتاب', 'إسلامي', 'History'],
  ['تاريخ الخلفاء', 'جلال الدين السيوطي', 1505, 'كتاب', 'إسلامي', 'History'],
  ['صور من حياة الصحابة', 'عبد الرحمن رأفت الباشا', 1952, 'كتاب', 'إسلامي', 'History'],
  ['رجال حول الرسول', 'خالد محمد خالد', 1958, 'كتاب', 'إسلامي', 'History'],
  ['فقه السيرة', 'محمد الغزالي', 1989, 'كتاب', 'إسلامي', 'Religion'],
  ['ألف ليلة وليلة', '', 1704, 'رواية', 'أدب عربي', 'Fiction'],
  ['كليلة ودمنة', 'عبد الله بن المقفع', 750, 'رواية', 'أدب عربي', 'Fiction'],
  ['حي بن يقظان', 'ابن طفيل', 1185, 'رواية', 'أدب عربي', 'Fiction'],
  ['رسالة الغفران', 'أبو العلاء المعري', 1033, 'رواية', 'أدب عربي', 'Fiction'],
  ['البخلاء', 'الجاحظ', 868, 'كتاب', 'أدب عربي', 'Literature'],
  ['البيان والتبيين', 'الجاحظ', 869, 'كتاب', 'أدب عربي', 'Literature'],
  ['الأغاني', 'أبو الفرج الأصفهاني', 967, 'كتاب', 'أدب عربي', 'Literature'],
  ['مقدمة ابن خلدون', 'عبد الرحمن بن خلدون', 1377, 'كتاب', 'معرفة عربية', 'History'],
  ['تحفة النظار في غرائب الأمصار وعجائب الأسفار', 'ابن بطوطة', 0, 'كتاب', 'معرفة عربية', 'Travel'],
  ['رحلة ابن جبير', 'ابن جبير', 0, 'كتاب', 'معرفة عربية', 'Travel'],
  ['أحسن التقاسيم في معرفة الأقاليم', 'المقدسي', 0, 'كتاب', 'معرفة عربية', 'Geography'],
  ['المسالك والممالك', 'الإصطخري', 0, 'كتاب', 'معرفة عربية', 'Geography'],
  ['صورة الأرض', 'ابن حوقل', 0, 'كتاب', 'معرفة عربية', 'Geography'],
  ['كتاب البلدان', 'اليعقوبي', 0, 'كتاب', 'معرفة عربية', 'History'],
  ['كتاب المناظر', 'ابن الهيثم', 0, 'كتاب', 'معرفة عربية', 'Science'],
  ['القانون في الطب', 'ابن سينا', 0, 'كتاب', 'معرفة عربية', 'Medicine'],
  ['المختصر في حساب الجبر والمقابلة', 'الخوارزمي', 0, 'كتاب', 'معرفة عربية', 'Mathematics'],
  ['تهافت الفلاسفة', 'أبو حامد الغزالي', 0, 'كتاب', 'معرفة عربية', 'Philosophy'],
  ['تهافت التهافت', 'ابن رشد', 0, 'كتاب', 'معرفة عربية', 'Philosophy'],
  ['فصل المقال فيما بين الحكمة والشريعة من الاتصال', 'ابن رشد', 0, 'كتاب', 'معرفة عربية', 'Philosophy'],
  ['آراء أهل المدينة الفاضلة', 'الفارابي', 0, 'كتاب', 'معرفة عربية', 'Philosophy'],
  ['الشفاء', 'ابن سينا', 0, 'كتاب', 'معرفة عربية', 'Philosophy'],
  ['المنقذ من الضلال', 'أبو حامد الغزالي', 0, 'كتاب', 'معرفة عربية', 'Philosophy'],
  ['طوق الحمامة', 'ابن حزم الأندلسي', 1022, 'كتاب', 'أدب عربي', 'Literature'],
  ['بين القصرين', 'نجيب محفوظ', 1956, 'رواية', 'أدب عربي', 'Fiction'],
  ['قصر الشوق', 'نجيب محفوظ', 1957, 'رواية', 'أدب عربي', 'Fiction'],
  ['السكرية', 'نجيب محفوظ', 1957, 'رواية', 'أدب عربي', 'Fiction'],
  ['أولاد حارتنا', 'نجيب محفوظ', 1959, 'رواية', 'أدب عربي', 'Fiction'],
  ['زقاق المدق', 'نجيب محفوظ', 1947, 'رواية', 'أدب عربي', 'Fiction'],
  ['بداية ونهاية', 'نجيب محفوظ', 1949, 'رواية', 'أدب عربي', 'Fiction'],
  ['اللص والكلاب', 'نجيب محفوظ', 1961, 'رواية', 'أدب عربي', 'Fiction'],
  ['الطريق', 'نجيب محفوظ', 1964, 'رواية', 'أدب عربي', 'Fiction'],
  ['ثرثرة فوق النيل', 'نجيب محفوظ', 1966, 'رواية', 'أدب عربي', 'Fiction'],
  ['ميرامار', 'نجيب محفوظ', 1967, 'رواية', 'أدب عربي', 'Fiction'],
  ['الحرافيش', 'نجيب محفوظ', 1977, 'رواية', 'أدب عربي', 'Fiction'],
  // Bibliographic titles verified against Egypt's State Information Service
  // and the publisher's Mahfouz author page; no invented plots or ratings.
  ['عبث الأقدار', 'نجيب محفوظ', 1939, 'رواية', 'أدب عربي', 'Fiction'],
  ['رادوبيس', 'نجيب محفوظ', 1943, 'رواية', 'أدب عربي', 'Fiction'],
  ['كفاح طيبة', 'نجيب محفوظ', 1944, 'رواية', 'أدب عربي', 'Fiction'],
  ['خان الخليلي', 'نجيب محفوظ', 0, 'رواية', 'أدب عربي', 'Fiction'],
  ['القاهرة الجديدة', 'نجيب محفوظ', 0, 'رواية', 'أدب عربي', 'Fiction'],
  ['السراب', 'نجيب محفوظ', 0, 'رواية', 'أدب عربي', 'Fiction'],
  ['الشحاذ', 'نجيب محفوظ', 1965, 'رواية', 'أدب عربي', 'Fiction'],
  ['المرايا', 'نجيب محفوظ', 1971, 'رواية', 'أدب عربي', 'Fiction'],
  ['الكرنك', 'نجيب محفوظ', 1974, 'رواية', 'أدب عربي', 'Fiction'],
  ['قلب الليل', 'نجيب محفوظ', 1975, 'رواية', 'أدب عربي', 'Fiction'],
  ['حضرة المحترم', 'نجيب محفوظ', 1975, 'رواية', 'أدب عربي', 'Fiction'],
  ['أفراح القبة', 'نجيب محفوظ', 1981, 'رواية', 'أدب عربي', 'Fiction'],
  ['ليالي ألف ليلة', 'نجيب محفوظ', 0, 'رواية', 'أدب عربي', 'Fiction'],
  ['الباقي من الزمن ساعة', 'نجيب محفوظ', 1982, 'رواية', 'أدب عربي', 'Fiction'],
  ['رحلة ابن فطومة', 'نجيب محفوظ', 1983, 'رواية', 'أدب عربي', 'Fiction'],
  ['العائش في الحقيقة', 'نجيب محفوظ', 1985, 'رواية', 'أدب عربي', 'Fiction'],
  ['يوم قتل الزعيم', 'نجيب محفوظ', 1985, 'رواية', 'أدب عربي', 'Fiction'],
  ['حديث الصباح والمساء', 'نجيب محفوظ', 1987, 'رواية', 'أدب عربي', 'Fiction'],
  ['موسم الهجرة إلى الشمال', 'الطيب صالح', 1966, 'رواية', 'أدب عربي', 'Fiction'],
  ['عرس الزين', 'الطيب صالح', 1969, 'رواية', 'أدب عربي', 'Fiction'],
  ['رجال في الشمس', 'غسان كنفاني', 1963, 'رواية', 'أدب عربي', 'Fiction'],
  ['ما تبقى لكم', 'غسان كنفاني', 1966, 'رواية', 'أدب عربي', 'Fiction'],
  ['عائد إلى حيفا', 'غسان كنفاني', 1969, 'رواية', 'أدب عربي', 'Fiction'],
  ['ذاكرة الجسد', 'أحلام مستغانمي', 1993, 'رواية', 'أدب عربي', 'Fiction'],
  ['فوضى الحواس', 'أحلام مستغانمي', 1997, 'رواية', 'أدب عربي', 'Fiction'],
  ['عابر سرير', 'أحلام مستغانمي', 2003, 'رواية', 'أدب عربي', 'Fiction'],
  ['الأسود يليق بك', 'أحلام مستغانمي', 2012, 'رواية', 'أدب عربي', 'Fiction'],
  ['مدن الملح', 'عبد الرحمن منيف', 1984, 'رواية', 'أدب عربي', 'Fiction'],
  ['شرق المتوسط', 'عبد الرحمن منيف', 1975, 'رواية', 'أدب عربي', 'Fiction'],
  ['النهايات', 'عبد الرحمن منيف', 1977, 'رواية', 'أدب عربي', 'Fiction'],
  ['الأيام', 'طه حسين', 1929, 'كتاب', 'أدب عربي', 'Biography'],
  ['دعاء الكروان', 'طه حسين', 1934, 'رواية', 'أدب عربي', 'Fiction'],
  ['عودة الروح', 'توفيق الحكيم', 1933, 'رواية', 'أدب عربي', 'Fiction'],
  ['أهل الكهف', 'توفيق الحكيم', 1933, 'كتاب', 'أدب عربي', 'Drama'],
  ['يوميات نائب في الأرياف', 'توفيق الحكيم', 1937, 'رواية', 'أدب عربي', 'Fiction'],
  ['رد قلبي', 'يوسف السباعي', 1951, 'رواية', 'أدب عربي', 'Fiction'],
  ['الباب المفتوح', 'لطيفة الزيات', 1960, 'رواية', 'أدب عربي', 'Fiction'],
  ['ثلاثية غرناطة', 'رضوى عاشور', 1994, 'رواية', 'أدب عربي', 'Fiction'],
  ['الطنطورية', 'رضوى عاشور', 2010, 'رواية', 'أدب عربي', 'Fiction'],
  ['واحة الغروب', 'بهاء طاهر', 2007, 'رواية', 'أدب عربي', 'Fiction'],
  ['عزازيل', 'يوسف زيدان', 2008, 'رواية', 'أدب عربي', 'Fiction'],
  ['فيرتيجو', 'أحمد مراد', 2007, 'رواية', 'أدب عربي', 'Fiction'],
  ['تراب الماس', 'أحمد مراد', 2010, 'رواية', 'أدب عربي', 'Fiction'],
  ['الفيل الأزرق', 'أحمد مراد', 2012, 'رواية', 'أدب عربي', 'Fiction'],
  ['يوتوبيا', 'أحمد خالد توفيق', 2008, 'رواية', 'أدب عربي', 'Fiction'],
  ['في ممر الفئران', 'أحمد خالد توفيق', 2016, 'رواية', 'أدب عربي', 'Fiction'],
  ['عمارة يعقوبيان', 'علاء الأسواني', 2002, 'رواية', 'أدب عربي', 'Fiction'],
  ['اللجنة', 'صنع الله إبراهيم', 1981, 'رواية', 'أدب عربي', 'Fiction'],
  ['شرف', 'صنع الله إبراهيم', 1997, 'رواية', 'أدب عربي', 'Fiction'],
  ['الرهينة', 'زيد مطيع دماج', 1984, 'رواية', 'أدب عربي', 'Fiction'],
  ['طوق الحمام', 'رجاء عالم', 2010, 'رواية', 'أدب عربي', 'Fiction'],
  ['موت صغير', 'محمد حسن علوان', 2016, 'رواية', 'أدب عربي', 'Fiction'],
  ['فرانكشتاين في بغداد', 'أحمد سعداوي', 2013, 'رواية', 'أدب عربي', 'Fiction']
];

function normalize(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function containsArabic(value) {
  return /[\u0600-\u06ff]/.test(String(value || ''));
}

function validTitle(value) {
  const title = String(value || '').replace(/\s+/g, ' ').trim();
  return title.length >= 3 && title.length <= 180 && containsArabic(title) && !/[\uFFFD]/.test(title);
}

function slug(value) {
  return normalize(value).replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]+/gu, '').slice(0, 90);
}

function loadBundledIdentityKeys() {
  const uploads = path.join(root, 'uploads');
  const sandbox = { window: { LorefyMangaData: [] } };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  fs.readdirSync(uploads)
    .filter((name) => /^lorefy-data-part\d+\.js$/.test(name))
    .sort()
    .forEach((name) => vm.runInContext(fs.readFileSync(path.join(uploads, name), 'utf8'), sandbox, { filename: name }));
  return new Set(sandbox.window.LorefyMangaData.map((work) => `${normalize(work.title || work.ar)}|${normalize(work.auth)}`));
}

async function fetchJson(search) {
  const name = `${normalize(search.q).replace(/\s+/g, '-')}.json`;
  const cachePath = path.join(cacheDir, name);
  if (fs.existsSync(cachePath)) return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', search.q);
  url.searchParams.set('language', 'ara');
  url.searchParams.set('limit', '100');
  url.searchParams.set('fields', 'key,title,author_name,first_publish_year,cover_i,edition_count,subject,language');
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Open Library ${response.status} for ${search.q}`);
  const payload = await response.json();
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(payload));
  return payload;
}

function mapRecord(item, search) {
  const title = String(item && item.title || '').replace(/\s+/g, ' ').trim();
  const author = Array.isArray(item && item.author_name) ? String(item.author_name[0] || '').trim() : '';
  const key = String(item && item.key || '').trim();
  const subjects = Array.isArray(item && item.subject) ? item.subject.map(String) : [];
  const languages = Array.isArray(item && item.language) ? item.language : [];
  const policyRecord = {title,auth:author,genres:subjects,tags:subjects};
  if (!key || !validTitle(title) || !author || /^(?:unknown|anonymous|لا يوجد|مجهول)$/i.test(author) ||
    !languages.some(language => language === 'ara' || language === 'ar') ||
    catalogPolicy.isExcludedWork(policyRecord) || catalogPolicy.isExplicitWork(policyRecord) ||
    catalogPolicy.isAiGeneratedWork(policyRecord)) return null;
  const sourceId = key.replace(/^\/works\//i, '').toLowerCase();
  if (!/^ol\d+w$/.test(sourceId)) return null;
  const year = Number(item && item.first_publish_year) || 0;
  const editionCount = Math.max(0, Number(item && item.edition_count) || 0);
  const cover = Number(item && item.cover_i) || 0;
  const topic = normalize(subjects.join(' '));
  if (/graphic novels?|comic books|comic strips|\bmanga\b|\bmanhwa\b|\bmanhua\b/.test(topic)) return null;
  const shortStories = /short stories|short fiction|قصص قصيرة|مجموعات قصصية/.test(topic);
  const reference = shortStories || /history and criticism|criticism and interpretation|study and teaching|bibliography|literary criticism|biograph|poetry|drama|نقد ادبي|سيرة ذاتية/.test(topic);
  const fiction = !reference && (/\bfiction\b|\bnovels?\b|روايات/.test(topic) || /(?:^|[\s:،(])رواية(?:[\s:،)]|$)/.test(title));
  const type = fiction ? 'رواية' : 'كتاب';
  const religious = /islam|qur.?an|koran|hadith|fiqh|sunnah|اسلام|قران|فقه|عقيدة|سيرة نبوية|حديث نبوي|احاديث|توحيد|رسول الله/.test(normalize(`${title} ${topic}`));
  const collection = search.collection === 'إسلامي' && !religious ? 'معرفة عربية' : search.collection;
  const genre = collection === 'إسلامي' ? 'Religion' : fiction ? 'Fiction'
    : search.genre === 'Religion' || search.genre === 'Fiction' ? 'Literature' : search.genre;
  const tags = ['عربي', collection];
  const knownSubjects = {History:/history|تاريخ/,Philosophy:/philosophy|فلسفة/,Psychology:/psychology|علم النفس/,Science:/science|agriculture|علوم|زراعة/};
  const genres = Object.keys(knownSubjects).filter(genre => knownSubjects[genre].test(topic));
  if (collection === 'إسلامي') tags.push('إسلامي');
  return {
    id: `ol-ar-${sourceId}`,
    title,
    ar: title,
    auth: author,
    type,
    yr: year,
    r: 0,
    rSrc: '',
    pop: 0,
    editionCount,
    baseRatings: 0,
    sourceCoverUrl: cover ? `https://covers.openlibrary.org/b/id/${cover}-L.jpg` : '',
    genres: [...new Set([shortStories ? 'Short Stories' : genre, ...genres, 'Arabic'])],
    tags,
    language: 'ar',
    source: 'Open Library',
    provenance: {url:`https://openlibrary.org${key}`,kind:'bibliographic-metadata'},
    // The worker replaces bundled shards as they finish loading. Mark this
    // curated local extension as dynamic so the loader retains it in that swap.
    _apiDynamic: true,
    _apiSource: 'openLibrary',
    _apiSourceId: sourceId,
    synopsis: ''
  };
}

function mapCuratedWork([title, auth, yr, type, collection, genre]) {
  const tags = ['عربي', collection, 'اختيار المحررين'];
  if (collection === 'إسلامي') tags.push('إسلامي');
  const publisher = bibliography.find({title,auth,type});
  return {
    id: `lorefy-ar-curated-${slug(`${title}-${auth}`)}`,
    title,
    ar: title,
    auth,
    type,
    yr,
    r: 0,
    rSrc: '',
    pop: 0,
    baseRatings: 0,
    sourceCoverUrl: publisher ? publisher.coverUrl : '',
    genres: [genre, 'Arabic'],
    tags,
    language: 'ar',
    source: 'Lorefy editorial',
    ...(auth === 'نجيب محفوظ' ? {provenance:{
      url:'https://sis.gov.eg/en/egypt/egyptian-figures/naguib-mahfouz/',
      publisherUrl:publisher ? publisher.publisherUrl : 'https://www.safahat.org/contributors/71616385/',
      kind:'bibliographic-metadata', verifiedAt:'2026-10-08'
    }} : {}),
    _apiDynamic: true,
    _apiSource: 'lorefy',
    _apiSourceId: slug(`${title}-${auth}`),
    ...(publisher ? {contentRating:'safe',contentScreening:'editorial-publisher-metadata'} : {}),
    synopsis: publisher && publisher.synopsis || '',
    ...(publisher && publisher.synopsis ? {synopsisAr:publisher.synopsis,synopsisAttribution:publisher.publisherUrl} : {})
  };
}

function render(records, metadata) {
  return `/* Generated by tools/build-arabic-library.js. Do not hand-edit. */\n` +
    `(function (global) {\n` +
    `  var records = ${JSON.stringify(records)};\n` +
    `  global.LorefyMangaData = global.LorefyMangaData || [];\n` +
    `  Array.prototype.push.apply(global.LorefyMangaData, records);\n` +
    `  global.LorefyArabicLibrary = ${JSON.stringify(metadata)};\n` +
    `})(window);\n`;
}

async function main() {
  const bundled = loadBundledIdentityKeys();
  const selected = [];
  const ids = new Set();
  const identities = new Set(bundled);

  for (const search of SEARCHES) {
    const payload = await fetchJson(search);
    for (const item of Array.isArray(payload.docs) ? payload.docs : []) {
      const record = mapRecord(item, search);
      if (!record || ids.has(record.id)) continue;
      const identity = `${normalize(record.title)}|${normalize(record.auth)}`;
      if (identities.has(identity)) continue;
      ids.add(record.id);
      identities.add(identity);
      selected.push(record);
    }
  }

  const collections = bibliography.entries.filter(entry=>entry.type)
    .map(entry=>[entry.title,entry.auth,entry.yr,entry.type,'أدب عربي',entry.genre]);
  for (const seed of [...CURATED_WORKS, ...collections]) {
    const record = mapCuratedWork(seed);
    if (catalogPolicy.isExcludedWork(record)) continue;
    // Keep an editorial anchor even when a sparse provider edition exists.
    // Catalog identity merges it later, preserving fuller metadata.
    if (ids.has(record.id)) continue;
    ids.add(record.id);
    selected.push(record);
  }

  selected.sort((a, b) => a.type.localeCompare(b.type, 'ar') || a.title.localeCompare(b.title, 'ar'));
  const religiousCount = selected.filter((record) => record.tags.includes('إسلامي')).length;
  if (selected.length < MIN_RECORDS) throw new Error(`Arabic import has ${selected.length}/${MIN_RECORDS} records`);
  if (religiousCount < MIN_RELIGIOUS_RECORDS) throw new Error(`Religious import has ${religiousCount}/${MIN_RELIGIOUS_RECORDS} records`);

  const metadata = {
    schema: 1,
    version: '2026-10-08-arabic-library-v4',
    source: 'Open Library',
    generatedAt: new Date().toISOString(),
    count: selected.length,
    religiousCount
  };
  fs.writeFileSync(outputPath, render(selected, metadata));
  console.log(JSON.stringify(metadata));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
