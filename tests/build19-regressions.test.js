const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

function response(status, json) {
  return { ok: status >= 200 && status < 300, status, json: async () => json };
}

function loadCharacterSystem(fetchImpl) {
  const storage = new Map();
  const sandbox = {
    URL,
    URLSearchParams,
    Promise,
    Date,
    setTimeout,
    clearTimeout,
    fetch: fetchImpl,
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    LorefyCharacterCatalog: {
      "mal:42": Array.from({ length: 25 }, (_, index) => ({
        id: `preview-${index + 1}`,
        key: `preview-${index + 1}`,
        name: `Preview ${index + 1}`,
        latin: `Preview ${index + 1}`,
        image: `https://images.example/preview-${index + 1}.jpg`,
        source: "preview"
      }))
    },
    LorefyCatalogAliases: {}
  };
  sandbox.window = sandbox;
  vm.runInNewContext(read("modules", "lorefy-character-system.js"), sandbox);
  return sandbox.LorefyCharacterSystem;
}

test("MAL manga merge the paginated Kitsu cast when AniList is unavailable", async () => {
  const requests = [];
  const mediaRows = (offset) => Array.from({ length: 20 }, (_, index) => {
    const id = offset + index + 1;
    return {
      id: `media-${id}`,
      type: "mediaCharacters",
      attributes: { role: id < 5 ? "main" : "supporting" },
      relationships: { character: { data: { id: String(id), type: "characters" } } }
    };
  });
  const includedRows = (offset) => Array.from({ length: 20 }, (_, index) => {
    const id = offset + index + 1;
    return {
      id: String(id),
      type: "characters",
      attributes: {
        name: `Kitsu Character ${id}`,
        names: { en: `Kitsu Character ${id}` },
        image: { original: `https://media.kitsu.app/characters/images/${id}/original.jpg` }
      }
    };
  });
  const system = loadCharacterSystem(async (request) => {
    const url = String(request);
    requests.push(url);
    if (url.includes("catalog-anilist") || url.includes("graphql.anilist.co")) return response(403, {});
    if (url.includes("api.tenrai.org")) {
      return response(200, { data: Array.from({ length: 25 }, (_, index) => ({
        role: "Supporting",
        character: { mal_id: index + 1, name: `Jikan Character ${index + 1}`, images: { jpg: { image_url: "" } } }
      })) });
    }
    if (/kitsu\.io\/api\/edge\/manga\?/.test(url)) {
      return response(200, { data: [{ id: "111", attributes: { canonicalTitle: "Dragon Ball", titles: { en: "Dragon Ball" } } }] });
    }
    if (/kitsu\.io\/api\/edge\/manga\/111\/characters/.test(url) && !url.includes("offset%5D=20")) {
      return response(200, {
        data: mediaRows(0),
        included: includedRows(0),
        links: { next: "https://kitsu.io/api/edge/manga/111/characters?include=character&page%5Blimit%5D=20&page%5Boffset%5D=20" }
      });
    }
    if (url.includes("offset%5D=20")) {
      return response(200, { data: mediaRows(20), included: includedRows(20), links: { next: null } });
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  const cast = await system.loadCast({ id: "mal-manga-42-dragon-ball", title: "Dragon Ball", type: "مانجا" });

  assert.equal(requests.some((url) => url.includes("kitsu.io/api/edge/manga")), true);
  assert.ok(cast.length > 25, `expected more than 25 characters, got ${cast.length}`);
  assert.equal(cast.some((character) => /media\.kitsu\.app/.test(character.image || "")), true);
  assert.equal(cast.complete, false);
});

test("AniList-only works supplement short manga casts with the exact anime adaptation", async () => {
  const calls = [];
  const system = loadCharacterSystem(async request => {
    const url = String(request); calls.push(url);
    if (url.includes('anilist')) return response(403, {});
    if (url.includes('/manga?')) return response(200, {data:[{id:'bad', attributes:{canonicalTitle:'Unrelated Story'}}]});
    if (url.includes('/anime?')) return response(200, {data:[{id:'ds', attributes:{canonicalTitle:'Demon Slayer'}}]});
    if (url.includes('/anime/ds/characters')) {
      const offset = url.includes('offset') ? 20 : 0;
      const ids = Array.from({length:20},(_,i)=>String(offset+i));
      return response(200, {data:ids.map(id=>({relationships:{character:{data:{id}}}})), included:ids.map(id=>({id,type:'characters',attributes:{name:'Character '+id,image:{original:'https://media.kitsu.app/'+id+'.jpg'}}})), links:{next:offset?null:'https://kitsu.io/api/edge/anime/ds/characters?offset=20'}});
    }
    throw new Error('Unexpected '+url);
  });
  const cast = await system.loadCast({id:'anilist-87216',title:'Demon Slayer',type:'مانجا'});
  assert.equal(cast.length,40);
  assert.equal(calls.some(url=>url.includes('/manga/bad/')),false);
  assert.equal(calls.some(url=>url.includes('offset=20')),true);
});

test("Demon Slayer merges every paginated Fandom category character when tracker APIs are incomplete", async () => {
  const calls = [];
  const system = loadCharacterSystem(async request => {
    const url = String(request);
    calls.push(url);
    if (url.includes('anilist')) return response(403, {});
    if (url.includes('api.tenrai.org')) return response(504, {});
    if (url.includes('kitsu.io/api/edge/manga?')) {
      return response(200, {data:[{id:'ds-manga',attributes:{canonicalTitle:'Demon Slayer: Kimetsu no Yaiba'}}]});
    }
    if (url.includes('/manga/ds-manga/characters')) return response(200, {data:[],included:[],links:{}});
    if (url.includes('kitsu.io/api/edge/anime?')) return response(200, {data:[]});
    if (url.includes('kimetsu-no-yaiba.fandom.com/api.php')) {
      const page = url.includes('gcmcontinue=next-page') ? 1 : 0;
      const rows = Array.from({length:page ? 36 : 120},(_,index)=>{
        const id=page*120+index+1;
        return {pageid:id,title:`Demon Character ${id}`,thumbnail:{source:`https://static.wikia.nocookie.net/kimetsu-no-yaiba/${id}.png`}};
      });
      return response(200, {continue:page ? undefined : {gcmcontinue:'next-page'},query:{pages:Object.fromEntries(rows.map(row=>[row.pageid,row]))}});
    }
    throw new Error('Unexpected '+url);
  });

  const cast = await system.loadCast({id:'mal-manga-96792-kimetsu-no-yaiba',title:'Demon Slayer: Kimetsu no Yaiba',type:'مانجا'});

  assert.equal(cast.length,156);
  assert.equal(cast.filter(character=>character.image).length,156);
  assert.equal(cast.complete,false, 'AniList failure must leave the cached cast retryable');
  assert.equal(calls.some(url=>url.includes('gcmcontinue=next-page')),true);
});

test("Dr. Stone loads the complete work-scoped character category instead of a short tracker preview", async () => {
  const system = loadCharacterSystem(async request => {
    const url = String(request);
    if (url.includes('anilist')) return response(403, {});
    if (url.includes('api.tenrai.org')) return response(504, {});
    if (url.includes('kitsu.io/api/edge/manga?')) {
      return response(200, {data:[{id:'dr-stone',attributes:{canonicalTitle:'Dr. Stone'}}]});
    }
    if (url.includes('/manga/dr-stone/characters')) return response(200, {data:[],included:[],links:{}});
    if (url.includes('kitsu.io/api/edge/anime?')) return response(200, {data:[]});
    if (url.includes('dr-stone.fandom.com/api.php')) {
      const rows = Array.from({length:85},(_,index)=>({
        pageid:index+1,
        title:`Dr Stone Character ${index+1}`,
        thumbnail:{source:`https://static.wikia.nocookie.net/dr-stone/${index+1}.png`}
      }));
      return response(200, {query:{pages:Object.fromEntries(rows.map(row=>[row.pageid,row]))}});
    }
    throw new Error('Unexpected '+url);
  });

  const cast = await system.loadCast({id:'mal-manga-103897-dr-stone',title:'Dr. Stone',type:'Manga'});

  assert.equal(cast.length,85);
  assert.equal(cast.filter(character=>character.image).length,85);
  assert.equal(cast.complete,false, 'AniList failure must leave the cached cast retryable');
});

test("a short tracker cast stays retryable when the work-scoped character source fails", async () => {
  let jikanRequests = 0;
  const system = loadCharacterSystem(async request => {
    const url = String(request);
    if (url.includes('anilist')) return response(403, {});
    if (url.includes('api.tenrai.org')) {
      jikanRequests += 1;
      return response(200, {data:Array.from({length:25},(_,index)=>({
        role:'Supporting',
        character:{mal_id:index+1,name:`Tracker Character ${index+1}`,images:{jpg:{image_url:''}}}
      }))});
    }
    if (url.includes('kitsu.io')) return response(404, {});
    if (url.includes('dr-stone.fandom.com')) return response(503, {});
    throw new Error('Unexpected '+url);
  });

  const work = {id:'mal-manga-103897-dr-stone',title:'Dr. Stone',type:'Manga'};
  const first = await system.loadCast(work);
  const second = await system.loadCast(work);

  assert.equal(first.length,25);
  assert.equal(first.complete,false);
  assert.equal(second.complete,false);
  assert.equal(jikanRequests,2);
});

test("multi-word manga titles can discover an exact matching Fandom character category", async () => {
  const calls=[];
  const system=loadCharacterSystem(async request=>{
    const url=String(request); calls.push(url);
    if(url.includes('meta=siteinfo')) {
      return response(200,{query:{general:{sitename:'Jujutsu Kaisen Wiki'}}});
    }
    if(url.includes('generator=categorymembers')) {
      return response(200,{query:{pages:{1:{pageid:1,title:'Yuji Itadori',thumbnail:{source:'https://static.wikia.nocookie.net/jujutsu-kaisen/yuji.png'}}}}});
    }
    throw new Error('Unexpected '+url);
  });

  const cast=await system.fandomCategoryCast({id:'mal-manga-999-jujutsu-kaisen',title:'Jujutsu Kaisen',type:'Manga'});

  assert.equal(cast.length,1);
  assert.equal(cast[0].name,'Yuji Itadori');
  assert.equal(calls.some(url=>url.includes('jujutsu-kaisen.fandom.com')),true);
});

test("single-word visual titles can discover a title-verified Fandom character category", async () => {
  const calls=[];
  const system=loadCharacterSystem(async request=>{
    const url=String(request); calls.push(url);
    if(url.includes('meta=siteinfo')) {
      return response(200,{query:{general:{sitename:'Berserk Wiki'}}});
    }
    if(url.includes('generator=categorymembers')) {
      return response(200,{query:{pages:{1:{pageid:1,title:'Guts',thumbnail:{source:'https://static.wikia.nocookie.net/berserk/guts.png'}}}}});
    }
    throw new Error('Unexpected '+url);
  });

  const cast=await system.fandomCategoryCast({id:'mal-manga-2-berserk',title:'Berserk',type:'Manga'});

  assert.equal(calls.some(url=>url.startsWith('https://berserk.fandom.com/api.php')),true);
  assert.equal(cast.length,1);
  assert.equal(cast[0].name,'Guts');
  assert.equal(cast.complete,true);
});

test("a title-derived domain accepts a branded community name", async () => {
  const system=loadCharacterSystem(async request=>{
    const url=String(request);
    if(url.includes('meta=siteinfo')) {
      return response(200,{query:{general:{sitename:'Narutopedia'}}});
    }
    if(url.includes('generator=categorymembers')) {
      return response(200,{query:{pages:{1:{pageid:1,title:'Naruto Uzumaki',thumbnail:{source:'https://static.wikia.nocookie.net/naruto/naruto.png'}}}}});
    }
    throw new Error('Unexpected '+url);
  });

  const cast=await system.fandomCategoryCast({id:'mal-manga-11-naruto',title:'Naruto',type:'Manga'});

  assert.equal(cast.length,1);
  assert.equal(cast[0].name,'Naruto Uzumaki');
  assert.equal(cast.complete,true);
});

test("all visual-work categories merge their exact work-scoped character community", async () => {
  const siteNames = {
    'jujutsu-kaisen.fandom.com': 'Jujutsu Kaisen Wiki',
    'solo-leveling.fandom.com': 'Solo Leveling Wiki',
    'martial-peak.fandom.com': 'Martial Peak Wiki',
    'the-walking-dead.fandom.com': 'The Walking Dead Wiki'
  };
  const system = loadCharacterSystem(async request => {
    const url = String(request);
    const domain = Object.keys(siteNames).find(candidate => url.includes(candidate));
    if (domain && url.includes('meta=siteinfo')) {
      return response(200, {query:{general:{sitename:siteNames[domain]}}});
    }
    if (domain && url.includes('generator=categorymembers')) {
      const prefix = siteNames[domain].replace(/ Wiki$/, '');
      return response(200, {query:{pages:{
        1:{pageid:1,title:`${prefix} Character One`,thumbnail:{source:`https://static.wikia.nocookie.net/${domain}/one.png`}},
        2:{pageid:2,title:`${prefix} Character Two`,thumbnail:{source:`https://static.wikia.nocookie.net/${domain}/two.png`}}
      }}});
    }
    throw new Error(`Unavailable provider: ${url}`);
  });
  const works = [
    {id:'anilist-1-jujutsu-kaisen',title:'Jujutsu Kaisen',type:'Manga'},
    {id:'anilist-2-solo-leveling',title:'Solo Leveling',type:'Manhwa'},
    {id:'anilist-3-martial-peak',title:'Martial Peak',type:'مانهوا صيني'},
    {id:'comic-the-walking-dead',title:'The Walking Dead',type:'Comics'}
  ];

  for (const work of works) {
    const cast = await system.loadCast(work);
    assert.equal(cast.length, 2, `${work.type} should use the complete work category`);
    assert.equal(cast.filter(character => character.image).length, 2);
    assert.equal(cast.complete, work.type === 'Comics');
  }
});

test("work-scoped character communities include paginated descendant categories", async () => {
  const calls = [];
  const system = loadCharacterSystem(async request => {
    const url = String(request);
    calls.push(url);
    if (url.includes('meta=siteinfo')) {
      return response(200, {query:{general:{sitename:'Solo Leveling Wiki'}}});
    }
    if (url.includes('gcmtitle=Category%3ACharacters')) {
      return response(200, {query:{pages:{
        1:{pageid:1,ns:0,title:'Sung Jinwoo',thumbnail:{source:'https://static.wikia.nocookie.net/solo-leveling/jinwoo.png'}},
        2:{pageid:2,ns:14,title:'Category:Hunters'}
      }}});
    }
    if (url.includes('gcmtitle=Category%3AHunters')) {
      return response(200, {query:{pages:{
        3:{pageid:3,ns:0,title:'Thomas Andre',thumbnail:{source:'https://static.wikia.nocookie.net/solo-leveling/thomas.png'}},
        4:{pageid:4,ns:0,title:'Liu Zhigang',thumbnail:{source:'https://static.wikia.nocookie.net/solo-leveling/liu.png'}}
      }}});
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  const cast = await system.fandomCategoryCast({id:'anilist-105398',title:'Solo Leveling',type:'Manhwa'});

  assert.deepEqual(Array.from(cast, character => character.name), ['Sung Jinwoo', 'Thomas Andre', 'Liu Zhigang']);
  assert.equal(calls.some(url => url.includes('gcmtitle=Category%3AHunters')), true);
});

test("a broad root character category does not fan out into unrelated taxonomy branches", async () => {
  const calls=[];
  const system=loadCharacterSystem(async request=>{
    const url=String(request); calls.push(url);
    if(url.includes('meta=siteinfo')) {
      return response(200,{query:{general:{sitename:'Dragon Ball Wiki'}}});
    }
    if(url.includes('gcmtitle=Category%3ACharacters')) {
      const rows=Array.from({length:120},(_,index)=>({
        pageid:index+1,
        ns:0,
        title:`Dragon Ball Character ${index+1}`,
        thumbnail:{source:`https://static.wikia.nocookie.net/dragonball/${index+1}.png`}
      }));
      rows.push({pageid:999,ns:14,title:'Category:Characters who can fly'});
      return response(200,{query:{pages:Object.fromEntries(rows.map(row=>[row.pageid,row]))}});
    }
    if(url.includes('Characters+who+can+fly') || url.includes('Characters%20who%20can%20fly')) {
      return response(503,{});
    }
    throw new Error('Unexpected '+url);
  });

  const cast=await system.fandomCategoryCast({id:'mal-manga-42-dragon-ball',title:'Dragon Ball',type:'Manga'});

  assert.equal(cast.length,120);
  assert.equal(cast.complete,true);
  assert.equal(calls.some(url=>/Characters(?:\+|%20)who(?:\+|%20)can(?:\+|%20)fly/.test(url)),false);
});

test("an empty root prefers a complete gender partition over every taxonomy branch", async () => {
  const calls=[];
  const system=loadCharacterSystem(async request=>{
    const url=String(request); calls.push(url);
    const category=new URL(url).searchParams.get('gcmtitle');
    if(url.includes('meta=siteinfo')) return response(200,{query:{general:{sitename:'One Piece Wiki'}}});
    if(category==='Category:Characters') {
      return response(200,{query:{pages:{
        1:{pageid:1,ns:14,title:'Category:Characters by Gender'},
        2:{pageid:2,ns:14,title:'Category:Characters by Occupation'}
      }}});
    }
    if(category==='Category:Characters by Gender') {
      return response(200,{query:{pages:{
        3:{pageid:3,ns:14,title:'Category:Female Characters'},
        4:{pageid:4,ns:14,title:'Category:Male Characters'}
      }}});
    }
    if(category==='Category:Female Characters' || category==='Category:Male Characters') {
      const female=category==='Category:Female Characters';
      const rows=Array.from({length:60},(_,index)=>({
        pageid:(female?1000:2000)+index,
        ns:0,
        title:`${female?'Female':'Male'} Pirate ${index+1}`,
        thumbnail:{source:`https://static.wikia.nocookie.net/onepiece/${female?'f':'m'}-${index+1}.png`}
      }));
      return response(200,{query:{pages:Object.fromEntries(rows.map(row=>[row.pageid,row]))}});
    }
    if(url.includes('Occupation')) return response(503,{});
    throw new Error('Unexpected '+url);
  });

  const cast=await system.fandomCategoryCast({id:'mal-manga-13-one-piece',title:'One Piece',type:'Manga'});

  assert.equal(cast.length,120);
  assert.equal(cast.complete,true);
  assert.equal(calls.some(url=>url.includes('Occupation')),false);
});

test("visual character categories are not truncated at one thousand rows", async () => {
  let page = 0;
  const system = loadCharacterSystem(async request => {
    const url = String(request);
    if (!url.includes('dr-stone.fandom.com') || !url.includes('generator=categorymembers')) {
      throw new Error(`Unexpected request: ${url}`);
    }
    const current = page++;
    const size = current < 2 ? 500 : 100;
    const start = current * 500;
    const rows = Array.from({length:size}, (_, index) => ({
      pageid:start+index+1,
      ns:0,
      title:`Expanded Character ${start+index+1}`,
      thumbnail:{source:`https://static.wikia.nocookie.net/dr-stone/expanded-${start+index+1}.png`}
    }));
    return response(200, {
      continue:current < 2 ? {gcmcontinue:`page-${current+2}`} : undefined,
      query:{pages:Object.fromEntries(rows.map(row => [row.pageid, row]))}
    });
  });

  const cast = await system.fandomCategoryCast({id:'mal-manga-103897-dr-stone',title:'Dr. Stone',type:'Manga'});

  assert.equal(cast.length, 1100);
  assert.equal(page, 3);
  assert.equal(cast.complete, true);
});

test("comic communities prefer their comic-only character category over franchise-wide characters", async () => {
  const calls = [];
  const system = loadCharacterSystem(async request => {
    const url = String(request);
    calls.push(url);
    if (url.includes('the-walking-dead.fandom.com') && url.includes('meta=siteinfo')) {
      throw new Error('legacy article domain is unavailable');
    }
    if (url.includes('walkingdead.fandom.com') && url.includes('meta=siteinfo')) {
      return response(200, {query:{general:{sitename:'Walking Dead Wiki'}}});
    }
    if (url.includes('list=categorymembers')) {
      return response(200, {query:{categorymembers:[
        {ns:14,title:'Category:Comic Series Characters'},
        {ns:14,title:'Category:TV Series Characters'}
      ]}});
    }
    if (url.includes('generator=categorymembers') && url.includes('gcmtitle=Category%3AComic+Series+Characters')) {
      return response(200, {query:{pages:{
        1:{pageid:1,ns:0,title:'Rick Grimes (Comic Series)',thumbnail:{source:'https://static.wikia.nocookie.net/walkingdead/rick.png'}},
        2:{pageid:2,ns:0,title:'Carl Grimes (Comic Series)',thumbnail:{source:'https://static.wikia.nocookie.net/walkingdead/carl.png'}}
      }}});
    }
    throw new Error(`Unexpected request: ${url}`);
  });

  const cast = await system.fandomCategoryCast({id:'comic-the-walking-dead',title:'The Walking Dead',type:'Comics'});

  assert.equal(cast.length, 2);
  assert.equal(calls.some(url => url.includes('walkingdead.fandom.com')), true);
  assert.equal(calls.some(url => url.includes('generator=categorymembers') && url.includes('gcmtitle=Category%3ACharacters')), false);
});

test("character deduplication keeps artwork supplied by a later source", () => {
  const system = loadCharacterSystem(async () => { throw new Error('network not expected'); });
  const cast = system.dedupeCast([
    { id: 'kitsu-1', key: 'tanjiro-kamado', name: 'Tanjiro Kamado', latin: 'Tanjiro Kamado', image: '', source: 'Kitsu' },
    { id: 'fandom-1', key: 'tanjiro-kamado', name: 'Tanjiro Kamado', latin: 'Tanjiro Kamado', image: 'https://static.wikia.nocookie.net/tanjiro.png', source: 'Demon Slayer Wiki' },
    { id: 'kitsu-2', key: 'kyoujurou-rengoku', name: 'Kyoujurou Rengoku', latin: 'Kyoujurou Rengoku', image: '', source: 'Kitsu' },
    { id: 'fandom-2', key: 'kyojuro-rengoku', name: 'Kyojuro Rengoku', latin: 'Kyojuro Rengoku', image: 'https://static.wikia.nocookie.net/kyojuro.png', source: 'Demon Slayer Wiki' }
  ]);

  assert.equal(cast.length, 2);
  assert.equal(cast[0].image, 'https://static.wikia.nocookie.net/tanjiro.png');
  assert.equal(cast[1].image, 'https://static.wikia.nocookie.net/kyojuro.png');
});

test("review recommendation buttons expose their selected state", () => {
  const growth = read("modules", "lorefy-growth-features.js");

  assert.match(growth, /data-lf-recommendation-bound/);
  assert.match(growth, /setAttribute\("aria-pressed", candidate === selected \? "true" : "false"\)/);
  assert.match(growth, /classList\.toggle\("is-active", candidate === selected\)/);
});

test("profile boards use a supported Arabic or English display title", () => {
  const app = read("uploads", "files", "lorefy-app.js");

  assert.match(app, /supportedWorkTitle=/);
  assert.match(app, /unsupportedWorkTitleScript=/);
  assert.match(app, /!unsupportedWorkTitleScript\(value\)/);
  assert.match(app, /const tt=supportedWorkTitle\(work\)/);
  assert.match(app, /work\?supportedWorkTitle\(work\):"خانة فارغة"/);
  assert.doesNotMatch(app, /String\(work\.ar\|\|work\.title\|\|""\)/);
});

test("native full-screen routes apply the top safe area exactly once", () => {
  const css = read("styles", "lorefy-native-layout-fix.css");

  assert.match(css, /\.lf-character-page,\s*\.lf-pref-board-hub\s*\{[^}]*padding-top:\s*0\s*!important/s);
  assert.match(css, /\.lf-character-page-top,[\s\S]*\.lf-pref-board-hub-head[\s\S]*padding-top:\s*calc\(var\(--lf-safe-top\) \+ 14px\)/);
});

test("dark preference headers preserve readable dark-mode contrast", () => {
  const css = read("styles", "lorefy-apple-ui.css");

  assert.match(css, /\.lf-app\.is-dark \.lf-pref-board-hub-head[\s\S]*background:\s*color-mix\(in srgb, var\(--lf-surface\) 94%, transparent\)/);
  assert.match(css, /\.lf-app\.is-dark \.lf-pref-board-hub-head h2[\s\S]*color:\s*var\(--lf-ink\)/);
});

test("Kitsu character artwork is accepted by local and share-image allowlists", () => {
  const covers = read("modules", "lorefy-cover-api.js");
  const edge = read("supabase", "functions", "lorefy-public", "index.ts");

  assert.match(covers, /"media\.kitsu\.app"/);
  assert.match(edge, /"media\.kitsu\.app"/);
});

test("the Top 4 editor shows the complete roster for a selected work", () => {
  const growth = read("modules", "lorefy-growth-features.js");

  assert.match(growth, /return activeWorkId \? rows : rows\.slice\(0, 120\)/);
});
