export type WorkType = "Manga" | "Manhwa" | "Novel" | "Comics" | "Book" | "Light Novel" | "Web Novel";

export type Character = {
  id: string;
  name: string;
  image: string;
  role: "رئيسية" | "مساعدة";
};

export type Work = {
  id: string;
  title: string;
  author: string;
  type: WorkType;
  score: number;
  cover: string;
  progress: number;
  total: number;
  year?: number;
  synopsis?: string;
  characters?: Character[];
};

export type Reader = {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar?: string;
  genres: string[];
  following: boolean;
};

export const demoWorks: Work[] = [
  {
    id: "one-piece",
    title: "One Piece",
    author: "Eiichiro Oda",
    type: "Manga",
    score: 4.7,
    cover: "https://cdn.myanimelist.net/images/manga/2/253146l.jpg",
    progress: 1185,
    total: 1185,
    year: 1997,
    synopsis: "رحلة طاقم قبعة القش بحثاً عن الكنز الذي سيغيّر عالم القراصنة.",
    characters: [
      { id: "luffy", name: "Monkey D. Luffy", image: "https://cdn.myanimelist.net/images/characters/9/310307.jpg", role: "رئيسية" },
      { id: "zoro", name: "Roronoa Zoro", image: "https://cdn.myanimelist.net/images/characters/9/307078.jpg", role: "رئيسية" },
      { id: "nami", name: "Nami", image: "https://cdn.myanimelist.net/images/characters/3/100534.jpg", role: "رئيسية" }
    ]
  },
  {
    id: "berserk",
    title: "Berserk",
    author: "Kentaro Miura",
    type: "Manga",
    score: 4.8,
    cover: "https://cdn.myanimelist.net/images/manga/1/157897l.jpg",
    progress: 0,
    total: 384,
    year: 1989,
    synopsis: "ملحمة غاتس في عالم قاسٍ بين الانتقام والقدر.",
    characters: [{ id: "guts", name: "Guts", image: "https://cdn.myanimelist.net/images/characters/6/341453.jpg", role: "رئيسية" }]
  },
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    author: "Chugong",
    type: "Manhwa",
    score: 4.4,
    cover: "https://cdn.myanimelist.net/images/manga/3/222295l.jpg",
    progress: 201,
    total: 201,
    year: 2018,
    synopsis: "أضعف صياد يكتسب نظاماً يمنحه فرصة النمو بلا حدود."
  },
  {
    id: "lord-of-mysteries",
    title: "Lord of Mysteries",
    author: "Cuttlefish That Loves Diving",
    type: "Web Novel",
    score: 4.6,
    cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1625150829i/58476883.jpg",
    progress: 0,
    total: 1432,
    year: 2018,
    synopsis: "غموض وفانتازيا في عالم فيكتوري حيث الأسرار تمنح القوة."
  },
  {
    id: "omniscient-reader",
    title: "Omniscient Reader's Viewpoint",
    author: "Sing Shong",
    type: "Manhwa",
    score: 4.5,
    cover: "https://cdn.myanimelist.net/images/manga/3/281399l.jpg",
    progress: 0,
    total: 551,
    year: 2020,
    synopsis: "قارئ وحيد يجد أن روايته المفضلة أصبحت واقعه الحقيقي."
  },
  {
    id: "a-game-of-thrones",
    title: "A Game of Thrones",
    author: "George R. R. Martin",
    type: "Novel",
    score: 4.3,
    cover: "https://covers.openlibrary.org/b/id/8306661-L.jpg",
    progress: 0,
    total: 864,
    year: 1996,
    synopsis: "صراع العائلات الكبرى على العرش الحديدي في ويستروس."
  },
  {
    id: "percy-jackson",
    title: "The Lightning Thief",
    author: "Rick Riordan",
    type: "Book",
    score: 4.2,
    cover: "https://covers.openlibrary.org/b/id/10521270-L.jpg",
    progress: 0,
    total: 377,
    year: 2005,
    synopsis: "فتى يكتشف أن الأساطير اليونانية جزء من حياته اليومية."
  },
  {
    id: "watchmen",
    title: "Watchmen",
    author: "Alan Moore",
    type: "Comics",
    score: 4.5,
    cover: "https://covers.openlibrary.org/b/id/12629776-L.jpg",
    progress: 0,
    total: 12,
    year: 1986,
    synopsis: "تحقيق سياسي وأخلاقي داخل عالم من الأبطال المقنّعين."
  }
];

export const demoReaders: Reader[] = [
  { id: "reader-qa", username: "qa_reader", name: "قارئ Lorefy", bio: "أرتب مكتبتي وأشارك مراجعاتي.", genres: ["مانجا", "خيال"], following: true },
  { id: "reader-noura", username: "noura_pages", name: "نورة", bio: "روايات وويب نوفل وكل قصة تترك أثراً.", genres: ["رواية", "رومانسية"], following: false },
  { id: "reader-faisal", username: "faisal_manga", name: "فيصل", bio: "مانجا أسبوعية وشونين كلاسيكي.", genres: ["مانجا", "أكشن"], following: false },
  { id: "reader-sara", username: "sara_reads", name: "سارة العتيبي", bio: "أبحث عن أفضل المانهوا المكتملة.", genres: ["مانهوا", "فانتازيا"], following: false }
];

function normalize(value: string) {
  return String(value ?? "").replace(/^\s*@\s*/, "").trim().toLocaleLowerCase();
}

export function searchWorks(works: Work[], query: string) {
  const needle = normalize(query);
  if (!needle) return works;
  const ids = new Set<string>();
  return works.filter((work) => {
    const matches = `${work.title} ${work.author}`.toLocaleLowerCase().includes(needle);
    if (!matches || ids.has(work.id)) return false;
    ids.add(work.id);
    return true;
  });
}

export function findReaders(readers: Reader[], query: string) {
  const needle = normalize(query);
  if (needle.length < 2) return [];
  return readers
    .filter((reader) => `${reader.username} ${reader.name}`.toLocaleLowerCase().includes(needle))
    .sort((left, right) => Number(right.username === needle) - Number(left.username === needle));
}
