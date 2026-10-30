(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyExploreStudio = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  function SearchSuggestions(props) {
    var state = props.state || {}, query = String(props.query || '').trim();
    function typeKey(type) { return root.LorefyCatalogPlan.normalizeSearchType(type); }
    if (!query || state.searching || state.searchError || state.searchQuery !== query
      || typeKey(state.searchType) !== typeKey(props.type) || !Array.isArray(state.suggestions) || !state.suggestions.length) return null;
    var h = root.React.createElement, en = props.language === 'en';
    return h('section', {className:'lf-search-suggestions', 'aria-label':en ? 'Suggested searches' : 'اقتراحات البحث'},
      h('p', null, en ? 'Did you mean?' : 'هل تقصد؟'),
      h('div', null, state.suggestions.slice(0, 3).map(function (text) {
        return h('button', {key:text, type:'button', dir:'auto', onClick:function () { props.onChoose(text); }}, text);
      })));
  }

  function count(value) { return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0; }
  function first(value, keys) {
    for (var i = 0; i < keys.length; i++) if (count(value && value[keys[i]])) return count(value[keys[i]]);
    return 0;
  }
  function readingSnapshot(work, progress, totals) {
    work = work || {}; totals = totals || {};
    progress = typeof progress === 'number' ? {chapter: progress} : progress || {};
    var page = count(progress.page), chapter = count(progress.chapter != null ? progress.chapter : progress.ch);
    var pages = first(totals, ['page']) || first(work, ['pages', 'pageCount', 'totalPages']);
    var chapters = first(totals, ['chapter']) || first(work, ['ch', 'chapters', 'chapterCount', 'totalChapters']);
    var text = /^(Book|Novel|كتاب|رواية)$/i.test(work.type || '');
    var unit = text && (pages || page) ? 'page' : chapters || chapter ? 'chapter' : text ? 'page' : 'chapter';
    var current = unit === 'page' ? page : chapter, total = unit === 'page' ? pages : chapters;
    var ongoing = typeof totals.ongoing === 'boolean' ? totals.ongoing : /مستمر|ongoing|publishing/i.test(work.st || work.status || '');
    return {unit: unit, current: current, total: total, percent: total ? Math.min(100, Math.round(current / total * 100)) : null, ongoing: ongoing};
  }
  function readingItems(library, progress, getWork, getTotals) {
    return Object.keys(library || {}).filter(function (id) {
      return /^(أقرأ حالياً|reading)$/i.test(library[id]);
    }).map(function (id) {
      var work = getWork(id);
      return work && {work: work, snapshot: readingSnapshot(work, (progress || {})[id], getTotals && getTotals(work))};
    }).filter(Boolean);
  }
  function normalized(value) { return String(value || '').trim().toLowerCase(); }
  function formatKey(value) {
    var key=normalized(value), types={all:'الكل',manga:'مانجا',manhwa:'مانهوا',manhua:'مانهوا صيني',comics:'كوميكس',novel:'رواية',book:'كتاب','light novel':'لايت نوفل','web novel':'ويب نوفل','مانهوا صينية':'مانهوا صيني'};
    return types[key] || key;
  }
  var COLLECTIONS = [
    ['manga-worlds','مانجا','مغامرات بين الصفحات','Adventures between pages','خيال وأكشن وعوالم مختلفة','Fantasy, action and different worlds'],
    ['manga-mystery','مانجا','ألغاز تبقيك مستيقظًا','Mysteries to keep you reading','غموض وحكايات نفسية','Mystery and psychological stories'],
    ['manga-life','مانجا','حياة وعلاقات وأحلام','Life, relationships and dreams','دراما وكوميديا وقصص إنسانية','Drama, comedy and human stories'],
    ['manhwa-worlds','مانهوا','أبواب إلى عوالم أخرى','Doors to other worlds','مغامرات وخيال من سلاسل مختلفة','Adventure and fantasy across different series'],
    ['manhwa-mystery','مانهوا','كل صفحة تخفي سرًا','Every page hides a secret','ألغاز وصراعات نفسية','Mysteries and psychological conflicts'],
    ['manhwa-life','مانهوا','بين الضحك والدراما','Between comedy and drama','علاقات وحكايات قريبة من الحياة','Relationships and stories close to life'],
    ['manhua-worlds','مانهوا صيني','رحلات القوة والخيال','Journeys of power and imagination','عوالم صينية ومغامرات متنوعة','Chinese worlds and varied adventures'],
    ['manhua-mystery','مانهوا صيني','وجوه وأسرار','Faces and secrets','غموض وتشويق وشخصيات مختلفة','Mystery, suspense and different characters'],
    ['manhua-life','مانهوا صيني','حكايات من زوايا أخرى','Stories from other perspectives','كوميديا ودراما وعلاقات','Comedy, drama and relationships'],
    ['comic-worlds','كوميكس','عوالم مرسومة بلا حدود','Worlds beyond the panel','مغامرات وخيال من رسامين وكتّاب مختلفين','Adventure and imagination from different creators'],
    ['comic-life','كوميكس','حياة تُروى بالرسوم','Life in pictures','المدرسة والعائلة والصداقة من زوايا مختلفة','School, family and friendship through different eyes'],
    ['comic-laugh','كوميكس','ابتسامة في كل صفحة','A smile on every page','شخصيات وحكايات بروح خفيفة','Characters and stories with a lighter touch'],
    ['comic-heroes','كوميكس','خلف أقنعة الأبطال','Behind the heroes’ masks','حكايات الأبطال وخياراتهم الصعبة','Heroes and the choices they face'],
    ['novel-world','رواية','روايات تعبر الحدود','Stories across borders','أصوات عربية وعالمية وحكايات مختلفة','Arabic and international voices, different stories'],
    ['novel-classics','رواية','كلاسيكيات تستحق العودة','Classics worth returning to','من العائلة والمجتمع إلى المغامرة والخيال','From family and society to adventure and imagination'],
    ['novel-adventure','رواية','رحلات ومغامرات بعيدة','Journeys and adventures','بحار وأسفار ومواجهات غير متوقعة','Voyages, journeys and unexpected encounters'],
    ['novel-imagination','رواية','حين يتجاوز الخيال الواقع','When imagination goes further','حكايات عجيبة وعوالم غير مألوفة','Strange tales and unfamiliar worlds'],
    ['book-science','كتاب','أسئلة يجيب عنها العلم','Questions for science','الكون والطبيعة والعقل والتقنيات','Space, nature, the mind and technology'],
    ['book-ideas','كتاب','أفكار تغيّر زاوية النظر','Ideas that change your perspective','فلسفة وأخلاق وسياسة من مدارس مختلفة','Philosophy, ethics and politics from different traditions'],
    ['book-journeys','كتاب','أماكن وتجارب إنسانية','Places and human experiences','رحلات وسِيَر وأصوات من بلدان متعددة','Travel, memoir and voices from different countries'],
    ['book-history','كتاب','ذاكرة العالم والمجتمع','The world’s memory','تاريخ وثقافة وتحولات اجتماعية','History, culture and social change'],
    ['light-worlds','لايت نوفل','عوالم سحرية ومغامرات','Magic and adventure','سلاسل مختلفة تستحق بداية جديدة','Different series to begin exploring'],
    ['light-mystery','لايت نوفل','ألغاز وشخصيات معقدة','Mystery and complex characters','غموض وقرارات تغيّر مصير الحكاية','Mysteries and decisions that shape the story'],
    ['light-future','لايت نوفل','المستقبل كما تتخيله القصص','Imagined futures','خيال علمي وعوالم تتجاوز المألوف','Science fiction and worlds beyond the familiar'],
    ['light-life','لايت نوفل','قربٌ من الحياة اليومية','Closer to everyday life','علاقات وكوميديا ولحظات صغيرة','Relationships, comedy and small moments'],
    ['web-magic','ويب نوفل','مغامرات تتطور معك','Adventures that grow','سحر وعوالم ومسارات مختلفة','Magic, worlds and different paths'],
    ['web-escape','ويب نوفل','هروب إلى حكاية جديدة','Escape into a new story','خيال وكوميديا وحياة بين المغامرات','Fantasy, comedy and life between adventures'],
    ['web-future','ويب نوفل','قوى وتقنيات غير مألوفة','Unfamiliar powers and technologies','خيال علمي وأبطال خارج القواعد','Science fiction and unconventional heroes']
  ];
  var GENRES = [['أكشن','Action'],['مغامرة','Adventure'],['خيال','Fantasy'],['رومانسي','Romance'],['إثارة','Thriller'],
    ['خيال علمي','Science Fiction'],['غموض','Mystery'],['كوميدي','Comedy'],['دراما','Drama'],['رعب','Horror'],
    ['إيسيكاي','Isekai'],['شونين','Shounen'],['شوجو','Shoujo'],['سينين','Seinen'],['نفسي','Psychological'],
    ['تاريخي','Historical'],['تاريخ','History'],['تطوير الذات','Self-help'],['سيرة ذاتية','Biography'],['فلسفة','Philosophy'],['غير خيالي','Nonfiction']];
  function genreLabel(value, lang) {
    var pair = GENRES.find(function (entry) { return entry.some(function (label) { return normalized(label) === normalized(value); }); });
    return pair ? pair[lang === 'en' ? 1 : 0] : value;
  }
  function genreMatches(work, genre) {
    var key = normalized(genreLabel(genre, 'en'));
    return (work.genres || []).concat(work._tasteGenreKeys || []).some(function (value) { return normalized(genreLabel(value, 'en')) === key; });
  }
  function buildShelves(ranked, preferences, library, seeds, lang, activeType) {
    preferences = preferences || {}; library = library || {};
    var en = lang === 'en', seen = new Set(), shelves = [];
    var identity=root.LorefyCatalogIdentity, aliases=root.LorefyCatalogAliases || {};
    function idOf(work) { var key=String(work.id), checked=new Set();while(aliases[key]&&!checked.has(key)){checked.add(key);key=String(aliases[key]);}return key; }
    var owned=new Set(Object.keys(library).map(function(id){return idOf({id:id});}));
    var candidates = (ranked || []).filter(function (work) {
      return work && work.id && work._discoveryEligible !== false &&
        (work._discoveryEligible === true || work._recommendationEligible !== false) && !owned.has(idOf(work));
    });
    function add(key, title, items, subtitle, limit, minimum) {
      var selected = [], authors = new Map(), localIds = new Set();
      items.forEach(function (work) {
        var author = normalized(work._tasteAuthor || work.auth), id = idOf(work);
        if (selected.length >= (limit || 12) || seen.has(id) || localIds.has(id)) return;
        if (author && authors.has(author)) return;
        if (identity && selected.some(function(previous){return identity.sameWork(previous,work,aliases);})) return;
        selected.push(work); localIds.add(id);
        if (author) authors.set(author, (authors.get(author) || 0) + 1);
      });
      if (selected.length < (minimum || 3)) return;
      selected.forEach(function (w) { seen.add(idOf(w)); });
      shelves.push({key: key, title: title, subtitle: subtitle || '', items: selected});
    }
    add('for-you', en ? 'You might like' : 'قد يعجبك', candidates, '', 6, 1);
    var genreKeys=new Set();
    (preferences.genres || []).forEach(function (genre, index) {
      var key=normalized(genreLabel(genre,'en'));
      if(genreKeys.has(key)||genreKeys.size>=3)return;genreKeys.add(key);
      add('genre-' + index, genre, candidates.filter(function (w) { return genreMatches(w, genre); }), en ? 'From your favorite genres' : 'من أنواعك المفضلة');
    });
    // Author bibliographies remain on author pages; general discovery mixes writers.
    add('short', en ? 'A shorter next read' : 'قراءات لوقت أقصر', candidates.filter(function (w) {
      var pages = first(w, ['pages', 'pageCount']), chapters = first(w, ['ch', 'chapters']);
      return pages > 0 && pages <= 250 || chapters > 0 && chapters <= 40;
    }));
    // Keep short reads available without preloading extra catalog shards.
    if(candidates.length&&!shelves.some(function(shelf){return shelf.key==='short';}))shelves.push({key:'short',title:en?'A shorter next read':'قراءات لوقت أقصر',subtitle:'',items:[]});
    return shelves;
  }

  var SECTION_TOPICS={worlds:['Fantasy','Adventure','Action'],world:['Fantasy','Adventure','Drama'],mystery:['Mystery','Psychological','Thriller'],life:['Drama','Comedy','Romance'],laugh:['Comedy'],heroes:['Action','Adventure'],classics:['Classics','Historical','Drama'],adventure:['Adventure'],imagination:['Fantasy'],science:['Science','Science Fiction'],ideas:['Philosophy','Nonfiction'],journeys:['Biography','Adventure'],history:['History','Historical'],future:['Science Fiction'],magic:['Fantasy','Action'],escape:['Fantasy','Comedy']};
  function sectionType(key,fallback){var entry=COLLECTIONS.find(function(row){return 'collection-'+row[0]===key;});return entry?entry[1]:fallback;}
  function sectionWorks(key,catalog,preferences,library,seeds){
    preferences=preferences||{};library=library||{};
    var definition=COLLECTIONS.find(function(row){return 'collection-'+row[0]===key;}),topic=definition&&definition[0].split('-').slice(1).join('-');
    var curated=new Set(((root.LorefyEditorialCatalog||{}).picks||[]).filter(function(work){return definition&&(work.editorialTopics||[]).includes(definition[0]);}).map(function(work){return String(work.id);}));
    var aliases=root.LorefyCatalogAliases||{},seen=new Set(),owned=new Set(),authors=new Set((seeds||[]).map(function(w){return normalized(w.auth);}));
    var feedback=root.LorefyProductTools&&root.LorefyProductTools.core.recommendations.getFeedback()||{};
    function idOf(work){var id=String(work.id),visited=new Set();while(aliases[id]&&!visited.has(id)){visited.add(id);id=String(aliases[id]);}return id;}
    Object.keys(library).forEach(function(id){owned.add(idOf({id:id}));});
    return (catalog||[]).filter(function(work){
      if(!work||!work.id)return false;var id=idOf(work);if(seen.has(id)||owned.has(id))return false;seen.add(id);
      if(work._discoveryEligible===false||work._discoveryEligible!==true&&work._recommendationEligible===false||feedback[id]&&feedback[id].value==='not_interested')return false;
      var policy=root.LorefyCatalogPolicy;if(policy&&(policy.isExcludedWork(work)||policy.isExplicitWork(work)||policy.isAiGeneratedWork(work)))return false;
      if(definition)return formatKey(work.type)===formatKey(definition[1])&&(curated.has(id)||(work.editorialTopics||[]).includes(definition[0])||(SECTION_TOPICS[topic]||[]).some(function(g){return genreMatches(work,g);}));
      if(key.indexOf('genre-')===0)return genreMatches(work,(preferences.genres||[])[Number(key.slice(6))]);
      if(key==='short')return first(work,['pages','pageCount'])>0&&first(work,['pages','pageCount'])<=250||first(work,['ch','chapters'])>0&&first(work,['ch','chapters'])<=40;
      if(key==='finished')return /^(مكتمل|مكتملة|completed|finished)$/i.test(work.st||work.status||'');
      if(key==='new-voices')return !!work.auth&&!authors.has(normalized(work.auth));
      if(key==='beyond')return !(preferences.genres||[]).some(function(g){return genreMatches(work,g);});
      return key==='for-you';
    });
  }
  function matchesFilters(work,filters) {
    if((filters.genres||[]).length && !(filters.genres||[]).some(function(genre){return genreMatches(work,genre);}))return false;
    var status=normalized(work.st||work.status);
    if(filters.status==='completed'&&!/^(مكتمل|مكتملة|completed|finished)$/.test(status))return false;
    if(filters.status==='ongoing'&&!/^(مستمر|مستمرة|ongoing|publishing)$/.test(status))return false;
    return !filters.rating || !!work.rSrc && Number(work.r)>=Number(filters.rating);
  }
  function catalogResults(catalog, type, query, sort, ratingScore) {
    var policy = root.LorefyCatalogPolicy, data = root.LorefyCatalogData;
    var seen = new Set(), aliases = root.LorefyCatalogAliases || {}, requestedFormat=formatKey(type), allFormats=!type||/^(all|الكل)$/i.test(type), normalizedQuery=normalized(query);
    var rows = (catalog || []).filter(function (work) {
      if (!work || !work.id || !allFormats && formatKey(work.type) !== requestedFormat) return false;
      if (policy && (policy.isExcludedWork(work) || policy.isExplicitWork(work) || policy.isAiGeneratedWork(work))) return false;
      if (query && !(data && data.matchesCatalogQuery ? data.matchesCatalogQuery(work, query) :
        normalized([work.title, work.ar, work.auth].join(' ')).includes(normalizedQuery))) return false;
      var id = String(work.id), visited = new Set();
      while (aliases[id] && !visited.has(id)) { visited.add(id); id = String(aliases[id]); }
      if (seen.has(id)) return false;
      seen.add(id); return true;
    });
    function score(work) {
      if (sort === 'rating') return ratingScore ? ratingScore(work) : work.rSrc ? count(work.r) : 0;
      if (sort === 'newest') return count(work.yr);
      // Catalog has no time-window trend metrics yet; use sourced popularity as a fallback.
      if (sort === 'trending') return count(work.pop);
      return count(work.pop);
    }
    var scores=sort==='rating'?new Map(rows.map(function(work){return [work,score(work)];})):null;
    rows.sort(function (a, b) { return (scores?scores.get(b)-scores.get(a):score(b)-score(a)) || String(a.id).localeCompare(String(b.id)); });
    return root.LorefyComicsSearch ? root.LorefyComicsSearch.groupResults(rows) : rows;
  }
  function featuredWorks(ranked) {
    var seen = new Set();
    return (ranked || []).filter(function (work) {
      if (!work || !work.id || work._discoveryEligible === false ||
        (work._discoveryEligible !== true && work._recommendationEligible === false)) return false;
      var policy = root.LorefyCatalogPolicy;
      if (policy && (policy.isExcludedWork(work) || policy.isExplicitWork(work) || policy.isAiGeneratedWork(work))) return false;
      if (seen.has(String(work.id))) return false;
      seen.add(String(work.id)); return true;
    }).slice().sort(function (a, b) { return count(b.pop) - count(a.pop) || Number(!!b.rec) - Number(!!a.rec); }).slice(0, 3);
  }
  function featureArtwork(work,cover,rightsSafe) {
    return root.LorefyHomeCinema ? root.LorefyHomeCinema.artwork(work,cover,rightsSafe) : cover;
  }
  function searchKey(value) {
    return String(value||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
  }
  function searchEditionKey(work) {
    var type=formatKey(work.type),title=searchKey(work.title),author=searchKey(work.auth||work.author);
    if(!['كتاب','رواية','لايت نوفل','ويب نوفل'].includes(type)||!title||work.volumeNumber||work.issueNumber)return '';
    var description=[work.title,work.subtitle].concat(work.genres||[]).join(' ');
    if(/\b(?:vol(?:ume)?|part|book|issue)\.?\s*#?\s*[0-9٠-٩]|\b(?:adaptation|abridged|collection|omnibus|study guide|graphic novel)\b|اقتباس|مختصر|مجلد|الجزء|مجموعة كاملة/i.test(description))return '';
    var linked=String(work.openLibraryId||'');
    if(/^OL\d+W$/.test(linked))return 'ol:'+type+':'+linked;
    // Cached records without a known subtitle cannot safely identify editions.
    if(work.catalogLevel!=='edition'||typeof work.subtitle!=='string'||!author||/^(unknown|various authors|غير معروف|مجهول)$/.test(author))return '';
    return 'edition:'+JSON.stringify([type,title,author,searchKey(work.subtitle)]);
  }
  function groupSearchEditions(rows, previous) {
    var groups=[],byKey=new Map(),seen=new Set();
    (rows||[]).forEach(function(work){
      if(!work||work.id==null||seen.has(String(work.id)))return;
      seen.add(String(work.id));var family=searchEditionKey(work),key=family||'id:'+String(work.id),group=byKey.get(key);
      if(!group){group={key:key,work:work,items:[],eligible:!!family};byKey.set(key,group);groups.push(group);}
      group.items.push(work);
    });
    var ordered=[];
    (previous||[]).forEach(function(old){var group=byKey.get(old.key);if(!group)return;group.work=group.items.find(function(work){return String(work.id)===String(old.work.id);})||group.work;ordered.push(group);byKey.delete(old.key);});
    return ordered.concat(groups.filter(function(group){return byKey.has(group.key);}));
  }
  function editionDescription(work) {
    return [work.publisher,work.publicationDate||work.yr,work.language,work.isbn13&&'ISBN '+work.isbn13,work._apiSource||work.source].filter(Boolean).join(' · ');
  }
  function editionCountLabel(count, language) {
    if(language==='en')return count+(count===1?' edition':' editions');
    return count===1?'طبعة واحدة':count===2?'طبعتان':count+(count%100>=3&&count%100<=10?' طبعات':' طبعة');
  }
  var relevanceIndexes=new WeakMap();
  function rankSearchResults(rows,query) {
    var q=searchKey(query),tokens=q.split(' ');
    function score(work){
      var data=root.LorefyCatalogData,index=data&&data.getCatalogQueryIndex&&data.getCatalogQueryIndex(work),entry=index&&relevanceIndexes.get(index);
      if(!entry){
        entry={titles:index?index.fields.slice(0,2).filter(Boolean):[work.title,work.ar].filter(Boolean).map(searchKey),aliases:[].concat(work.altTitles||[],work.aliases||[]).slice(0,40).filter(value=>typeof value==='string').map(searchKey),author:index?index.fields[work.auth?2:3]:searchKey(work.auth||work.author)};
        if(index)relevanceIndexes.set(index,entry);
      }
      var titles=entry.titles,aliases=entry.aliases,author=entry.author;
      if(titles.includes(q))return 0;if(aliases.includes(q))return 1;
      if(titles.some(title=>title.startsWith(q)))return 2;
      if(titles.some(title=>tokens.every(token=>title.includes(token))))return 3;
      return author===q?4:author.startsWith(q)?5:6;
    }
    if(!q)return (rows||[]).slice();
    return (rows||[]).map(work=>({work:work,score:score(work),popularity:count(work.pop),id:String(work.id)})).sort((a,b)=>a.score-b.score||b.popularity-a.popularity||a.id.localeCompare(b.id)).map(row=>row.work);
  }
  function searchPhase(query,total,busy,failed){
    if(!String(query||'').trim())return 'idle';if(searchKey(query).length<2)return 'short';
    if(busy)return total?'updating':'loading';if(failed)return total?'partial':'error';return total?'ready':'empty';
  }
  function searchHistoryKey(owner){return 'lorefy.search.recent.v1.'+encodeURIComponent(String(owner||''));}
  function readSearchHistory(storage,owner,now){
    if(!owner)return [];now=now==null?Date.now():now;
    try{var rows=JSON.parse(storage.getItem(searchHistoryKey(owner))||'[]');return (Array.isArray(rows)?rows:[]).filter(row=>row&&typeof row.q==='string'&&row.q.length<=120&&searchKey(row.q).length>=2&&['media','people','lists'].includes(row.mode)&&typeof row.format==='string'&&row.format.length<=60&&Number.isFinite(row.at)&&row.at<=now+300000&&now-row.at<30*86400000).slice(0,8);}catch(_){return [];}
  }
  function saveSearchHistory(storage,owner,entry,now){
    var rows=readSearchHistory(storage,owner,now),q=String(entry&&entry.q||'').trim().replace(/\s+/g,' ').slice(0,120);
    if(!owner||searchKey(q).length<2)return rows;
    var mode=['media','people','lists'].includes(entry.mode)?entry.mode:'media',format=mode==='media'?String(entry.format||'').slice(0,60):'';
    var next={q:q,mode:mode,format:format,at:now==null?Date.now():now};
    rows=[next].concat(rows.filter(row=>!(searchKey(row.q)===searchKey(q)&&row.mode===mode&&formatKey(row.format)===formatKey(format)))).slice(0,8);
    try{storage.setItem(searchHistoryKey(owner),JSON.stringify(rows));}catch(_){}return rows;
  }
  function clearSearchHistory(storage,owner){try{storage.removeItem(searchHistoryKey(owner));}catch(_){}return [];}
  // Transient navigation only; preferences and library still use their existing owner storage.
  var viewMemory = new Map();
  function Explore(props) {
    var React = root.React, h = React.createElement, en = props.language === 'en';
    var owner = String(props.userKey || 'local'), saved = viewMemory.get(owner) || {mode:'you', format:'', query:'', sort:'popular', limit:60, scroll:0};
    var modeState = React.useState(saved.mode), mode = modeState[0], setMode = modeState[1];
    var formatState = React.useState(saved.format), format = formatState[0], setFormat = formatState[1];
    var queryState = React.useState(saved.query), query = queryState[0], setQuery = queryState[1];
    var sortState = React.useState(saved.sort==='trending'?'newest':saved.sort), sort = sortState[0], setSort = sortState[1];
    var limitState = React.useState(saved.limit), limit = limitState[0], setLimit = limitState[1];
    var filtersState=React.useState({genres:[],status:'all',rating:0}),filters=filtersState[0],setFilters=filtersState[1];
    var collectionLimitState=React.useState(60),collectionLimit=collectionLimitState[0],setCollectionLimit=collectionLimitState[1];
    var dialogState = React.useState(null), dialog = dialogState[0], setDialog = dialogState[1];
    var draftState = React.useState(null), draft = draftState[0], setDraft = draftState[1];
    var revisionState = React.useState(0), revision = revisionState[0], setRevision = revisionState[1];
    var slideState = React.useState(0), slide = slideState[0], setSlide = slideState[1];
    var searchState=React.useState(!!saved.searchActive),searchActive=searchState[0],setSearchActive=searchState[1];
    var searchQueryState=React.useState(saved.searchQuery||''),searchQuery=searchQueryState[0],setSearchQuery=searchQueryState[1];
    var searchFiltersState=React.useState(saved.searchFilters||{format:'',genres:[],status:'all',sort:'relevance'}),searchFilters=searchFiltersState[0],setSearchFilters=searchFiltersState[1];
    var searchLimitState=React.useState(36),searchLimit=searchLimitState[0],setSearchLimit=searchLimitState[1];
    var attemptState=React.useState(0),searchAttempt=attemptState[0],setSearchAttempt=attemptState[1];
    var historyStorage;try{historyStorage=root.sessionStorage;}catch(_){}
    var recentState=React.useState(readSearchHistory(historyStorage,owner)),recent=recentState[0],setRecent=recentState[1];
    var searchRetry=React.useRef(0);
    var pendingState=React.useState(false),searchPending=pendingState[0],setSearchPending=pendingState[1];
    var inputTimer=React.useRef(null), searchInput=React.useRef(null), formatSearchInput=React.useRef(null);
    React.useEffect(function(){return function(){root.clearTimeout(inputTimer.current);};},[]);
    var searchModeState=React.useState(saved.searchMode||'media'),searchMode=searchModeState[0],setSearchMode=searchModeState[1];
    React.useEffect(function(){searchRetry.current++;setSearchLimit(36);return function(){searchRetry.current++;};},[owner,format,query,searchQuery,searchMode,searchFilters]);
    var previousOwner=React.useRef(owner);
    React.useEffect(function(){
      if(previousOwner.current===owner)return;
      previousOwner.current=owner;searchRetry.current++;root.clearTimeout(inputTimer.current);
      if(searchInput.current)searchInput.current.value='';
      setSearchQuery('');setSearchMode('media');setSearchActive(false);setRemoteSearch(null);
      setSearchFilters({format:'',genres:[],status:'all',sort:'relevance'});setRecent(readSearchHistory(historyStorage,owner));
    },[owner]);
    var readersState=React.useState([]),readers=readersState[0],setReaders=readersState[1];
    var searchStatusState=React.useState(''),searchStatus=searchStatusState[0],setSearchStatus=searchStatusState[1];
    var remoteState=React.useState(null),remoteSearch=remoteState[0],setRemoteSearch=remoteState[1];
    React.useEffect(function(){function changed(event){setRemoteSearch(event.detail);}root.addEventListener('lorefy:catalog-remote-search',changed);return function(){root.removeEventListener('lorefy:catalog-remote-search',changed);};},[]);
    var activeSearchType=format||searchFilters.format||props.allType;
    var remoteMatches=remoteSearch&&formatKey(remoteSearch.type)===formatKey(activeSearchType)&&normalized(remoteSearch.query)===normalized(format?query:searchQuery),remoteBusy=remoteMatches&&remoteSearch.status==='searching',remoteFailed=remoteMatches&&(remoteSearch.status==='error'||remoteSearch.status==='partial');
    var pauseState = React.useState(true), paused = pauseState[0], setPaused = pauseState[1];
    var reducedMotion = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var errorState = React.useState(false), loadError = errorState[0], setLoadError = errorState[1];
    var opener = React.useRef(null), panel = React.useRef(null), screen = React.useRef(null), sentinel = React.useRef(null), hero = React.useRef(null), busy = React.useRef(false);
    var t = function (ar, english) { return en ? english : ar; };
    var Icon = function (name, size) {
      if (en && name === 'ChevronLeft') name = 'ChevronRight';
      var component = root.NenIcons && root.NenIcons[name];
      return component ? h(component, {size:size || 19, 'aria-hidden':true}) : null;
    };
    function remember(scroll) {
      viewMemory.set(owner, {mode:mode, format:format, query:query, sort:sort, limit:limit,searchActive:searchActive,searchQuery:searchQuery,searchMode:searchMode,searchFilters:searchFilters, scroll:scroll == null ? screen.current && screen.current.scrollTop || 0 : scroll});
      if (viewMemory.size > 8) viewMemory.delete(viewMemory.keys().next().value);
    }
    React.useEffect(function () { remember(); }, [owner, mode, format, query, sort, limit,searchActive,searchQuery,searchMode,searchFilters]);
    React.useLayoutEffect(function () { if (screen.current) screen.current.scrollTop = saved.scroll; }, []);
    function top() { if (screen.current) screen.current.scrollTop = 0; }
    React.useEffect(function () {
      var loader = root.LorefyCatalogLoader, active = true;
      setLoadError(false);
      if (loader) {
        var request = format && loader.loadFormat ? loader.loadFormat(format, query) : loader.loadExplore(props.allType);
        Promise.resolve(request).catch(function () { if (active) setLoadError(true); });
      }
      return function () { active = false; };
    }, [format, query]);
    React.useEffect(function () {
      function changed() { setRevision(function (n) { return n + 1; }); }
      root.addEventListener('lorefy:catalog-ingested', changed);
      root.addEventListener('lorefy:catalog-progress', changed);
      root.addEventListener('lorefy:reader-safety-changed', changed);
      return function () {
        root.removeEventListener('lorefy:catalog-ingested', changed);
        root.removeEventListener('lorefy:catalog-progress', changed);
        root.removeEventListener('lorefy:reader-safety-changed', changed);
      };
    }, []);
    var catalogState = root.LorefyCatalogLoader && root.LorefyCatalogLoader.state();
    var catalogReady = !catalogState || catalogState.ready, catalogPartial = !!(catalogState && catalogState.partial);
    // Search has its own relevance/filter pipeline. Catalog progress must not
    // also rebuild personalized shelves and featured picks hidden behind it.
    var needsRanked = !props.getCatalog || !format && (!searchActive || searchMode==='media'&&!searchQuery.trim());
    var needsShelves = !format && !searchActive && mode==='you';
    var ranked = React.useMemo(function () { if(!needsRanked)return [];return root.LorefyPerformanceProbe?root.LorefyPerformanceProbe.measure("explore.ranking",function(){return props.getRanked(props.allType);}):props.getRanked(props.allType); }, [needsRanked,props.getRanked,props.allType,revision]);
    var seeds = (props.favorites || []).concat(props.preferences.seedWorkIds || [], Object.keys(props.library).filter(function (id) {
      return !/متوقف|متروك|paused|dropped/i.test(props.library[id]);
    })).slice(0, 24).map(props.getWork).filter(Boolean);
    var shelfPreferences = props.preferences;
    if (!(shelfPreferences.genres || []).length) {
      var genreCounts = new Map();
      seeds.forEach(function (work) { (work.genres || []).forEach(function (genre) { genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1); }); });
      shelfPreferences = Object.assign({}, props.preferences, {genres:Array.from(genreCounts).sort(function (a,b) { return b[1]-a[1]; }).slice(0,3).map(function (entry) { return entry[0]; })});
    }
    var shelves = React.useMemo(function(){if(!needsShelves)return [];return root.LorefyPerformanceProbe?root.LorefyPerformanceProbe.measure("explore.shelves",function(){return buildShelves(ranked, shelfPreferences, props.library, seeds, props.language, props.allType);}):buildShelves(ranked, shelfPreferences, props.library, seeds, props.language, props.allType);},[needsShelves,ranked,props.preferences,props.library,props.favorites,props.language]);
    // Bring account recommendations forward, without changing their ranking or deduplication.
    shelves.sort(function (a, b) { return Number(b.key === 'for-you') - Number(a.key === 'for-you'); });
    var features = React.useMemo(function(){return needsShelves?featuredWorks(ranked):[];},[needsShelves,ranked]), selected = features[slide % (features.length || 1)];
    var results = React.useMemo(function () {
      return format ? catalogResults(props.getCatalog ? props.getCatalog() : ranked, format, query, sort, props.ratingScore).filter(function(work){return matchesFilters(work,filters);}) : [];
    }, [format, query, sort, revision, props.getCatalog,filters]);
    function more() {
      var currentState = root.LorefyCatalogLoader && root.LorefyCatalogLoader.state();
      if (busy.current || currentState && currentState.searchError) return;
      if (limit < resultCount) { setLimit(function (n) { return n + 60; }); return; }
      if (catalogState && catalogState.hasMore && root.LorefyCatalogLoader) {
        busy.current = true; setLoadError(false);
        root.LorefyCatalogLoader.loadMore().catch(function () { setLoadError(true); }).finally(function () {
          busy.current = false; setLimit(function (n) { return n + 60; }); setRevision(function (n) { return n + 1; });
        });
      }
    }
    function retryMediaSearch() {
      var loader = root.LorefyCatalogLoader;
      if(remoteFailed&&root.LorefyApiCatalog){
        var request=++searchRetry.current,text=format?query:searchQuery,type=activeSearchType;
        setRemoteSearch({query:text,type:type,status:'searching'});
        Promise.resolve().then(function(){if(request!==searchRetry.current)return {cancelled:true};return root.LorefyApiCatalog.search(text,type,{force:true,isCurrent:function(){return request===searchRetry.current;}});}).then(function(result){if(request!==searchRetry.current||result&&result.cancelled)return;var failed=result&&(result.error||result.providerErrors&&result.providers&&result.providers.length&&result.providerErrors.length===result.providers.length);setRemoteSearch({query:text,type:type,status:failed?'error':result&&result.providerErrors&&result.providerErrors.length?'partial':'ready'});}).catch(function(){if(request===searchRetry.current)setRemoteSearch({query:text,type:type,status:'error'});});return;
      }
      if (!loader) return;
      setLoadError(false);
      if (catalogState && catalogState.searchError && loader.retrySearch) loader.retrySearch();
      else Promise.resolve(loader.loadFormat(activeSearchType, format ? query : searchQuery)).catch(function () { setLoadError(true); });
    }
    React.useEffect(function () {
      if (!format || !sentinel.current || !root.IntersectionObserver) return;
      var observer = new root.IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) more();
      }, {root:screen.current, rootMargin:'0px 0px 300px 0px'});
      observer.observe(sentinel.current); return function () { observer.disconnect(); };
    }, [format, limit, results.length, revision]);
    React.useEffect(function () {
      if (features.length < 2 || paused || format || mode !== 'you' || searchActive || reducedMotion) return;
      var timer = root.setInterval(function () {
        if (root.document.hidden || hero.current && hero.current.contains(root.document.activeElement)) return;
        setSlide(function (n) { return n + 1; });
      }, 7000);
      return function () { root.clearInterval(timer); };
    }, [features.length, paused, format, mode,searchActive,reducedMotion]);
    React.useEffect(function(){
      setSearchPending(false);
      if(!searchActive||searchMode!=='media'||searchKey(searchQuery).length<2)return;
      var active=true;setLoadError(false);setSearchPending(true);
      var timer=root.setTimeout(function(){var loader=root.LorefyCatalogLoader;Promise.resolve().then(function(){return loader&&loader.loadFormat?loader.loadFormat(searchFilters.format||props.allType,searchQuery):null;}).catch(function(){if(active)setLoadError(true);}).finally(function(){if(active)setSearchPending(false);});},0);
      return function(){active=false;root.clearTimeout(timer);};
    },[searchActive,searchQuery,searchMode,searchFilters.format]);
    React.useEffect(function(){
      setReaders([]);setSearchStatus('');
      if(!searchActive||searchMode!=='people'||searchKey(searchQuery).length<2)return;
      setSearchStatus('loading');
      var active=true,timer=root.setTimeout(function(){
        setSearchStatus('loading');var discovery=root.LorefyUserDiscovery;
        Promise.resolve().then(function(){if(!discovery||!discovery.buildDirectory)throw Error('Reader directory unavailable');return discovery.buildDirectory().search(searchQuery,{strict:!!(root.LorefyBackend&&root.LorefyBackend.mode==='live'),includeFollowing:false});}).then(function(rows){if(active){setReaders(rows);setSearchStatus('');}}).catch(function(){if(active)setSearchStatus('error');});
      },0);
      return function(){active=false;root.clearTimeout(timer);};
    },[owner,searchActive,searchQuery,searchMode,searchAttempt]);
    var mediaResults=React.useMemo(function(){
      if(!searchActive||searchMode!=='media'||searchKey(searchQuery).length<2)return [];
      var rows=catalogResults(props.getCatalog?props.getCatalog():ranked,searchFilters.format||props.allType,searchQuery,searchFilters.sort==='relevance'?'popular':searchFilters.sort,props.ratingScore).filter(function(work){return matchesFilters(work,searchFilters);});
      return searchFilters.sort==='relevance'?rankSearchResults(rows,searchQuery):rows;
    },[searchActive,searchMode,searchQuery,revision,ranked,props.getCatalog,props.allType,props.ratingScore,searchFilters]);
    var editionContext=JSON.stringify([owner,format,format?query:searchQuery,searchMode,searchFilters,filters,sort]);
    var editionView=React.useRef({context:'',entries:[]});
    var groupingActive=format?searchKey(query).length>=2:searchActive&&searchMode==='media'&&searchKey(searchQuery).length>=2;
    var editionEntries=React.useMemo(function(){
      var previous=editionView.current.context===editionContext?editionView.current.entries:[];
      var entries=groupSearchEditions(format?results:mediaResults,previous);
      editionView.current={context:editionContext,entries:entries};return entries;
    },[results,mediaResults,editionContext,format]);
    var resultCount=groupingActive?editionEntries.length:results.length;
    React.useEffect(function(){if(dialog&&dialog.kind==='editions'&&dialog.context!==editionContext)close();},[editionContext,dialog]);
    React.useEffect(function(){
      if(searchActive&&searchMode==='media'&&searchInput.current&&searchInput.current.value.trim().length>=3)searchInput.current.dispatchEvent(new root.Event('input',{bubbles:true}));
    },[searchMode,searchFilters.format]);
    function rememberSearch(){
      var text=searchInput.current?searchInput.current.value:searchQuery;
      setRecent(saveSearchHistory(historyStorage,owner,{q:text,mode:searchMode,format:searchFilters.format}));
    }
    function clearSearch(){
      searchRetry.current++;root.clearTimeout(inputTimer.current);
      if(searchInput.current){searchInput.current.value='';searchInput.current.dispatchEvent(new root.Event('input',{bubbles:true}));searchInput.current.focus();}
      setSearchQuery('');setRemoteSearch(null);
      if(searchMode==='media'&&root.LorefyCatalogLoader)Promise.resolve(root.LorefyCatalogLoader.loadFormat(searchFilters.format||props.allType,'')).catch(function(){});
    }
    function cancelSearch(){clearSearch();setSearchActive(false);setSearchMode('media');if(root.document.activeElement&&root.document.activeElement.blur)root.document.activeElement.blur();}
    function chooseSearchSuggestion(text) {
      if (format) { if(formatSearchInput.current&&formatSearchInput.current.value.trim()!==query.trim())return;root.clearTimeout(inputTimer.current);if(formatSearchInput.current)formatSearchInput.current.value=text;setQuery(text); setLimit(60); }
      else {
        // An uncontrolled field may be ahead of its debounced state.
        if (!searchInput.current || searchInput.current.value.trim() !== searchQuery.trim()) return;
        root.clearTimeout(inputTimer.current);
        searchInput.current.value = text;
        searchRetry.current++;
        setSearchQuery(text);
        searchInput.current.dispatchEvent(new root.Event('input',{bubbles:true}));
        searchInput.current.focus();
      }
    }
    function suggestionsFor(text, type) {
      return h(SearchSuggestions, {state:catalogState, query:text, type:type, language:props.language, onChoose:chooseSearchSuggestion});
    }
    function changeSearchMode(nextMode){
      searchRetry.current++;root.clearTimeout(inputTimer.current);
      if(searchInput.current)setSearchQuery(searchInput.current.value);
      setRemoteSearch(null);setSearchMode(nextMode);
      if(nextMode!=='media'&&root.LorefyCatalogLoader)Promise.resolve(root.LorefyCatalogLoader.loadFormat(searchFilters.format||props.allType,'')).catch(function(){});
      if(nextMode==='media')root.setTimeout(function(){
        var input=searchInput.current;
        if(input&&input.isConnected&&!input.closest('[data-lorefy-search-local]'))input.dispatchEvent(new root.Event('input',{bubbles:true}));
      },0);
    }
    function replaySearch(entry){
      searchRetry.current++;root.clearTimeout(inputTimer.current);setSearchMode(entry.mode);setSearchActive(true);setRemoteSearch(null);
      setSearchFilters({format:entry.format,genres:[],status:'all',sort:'relevance'});setSearchQuery(entry.q);
      if(searchInput.current){searchInput.current.value=entry.q;searchInput.current.focus();}
      setRecent(saveSearchHistory(historyStorage,owner,entry));
      root.setTimeout(function(){if(searchInput.current)searchInput.current.dispatchEvent(new root.Event('input',{bubbles:true}));},0);
    }
    function searchIdle(){
      return h('section',{className:'lf-explore-search-idle'},
        recent.length>0&&h('section',{className:'lf-explore-recent'},h('header',null,h('h2',null,t('بحثك الأخير','Recent searches')),h('button',{onClick:function(){setRecent(clearSearchHistory(historyStorage,owner));}},t('مسح الكل','Clear all'))),recent.map(function(entry,index){return h('button',{key:entry.mode+entry.q+index,className:'lf-explore-recent-row',onClick:function(){replaySearch(entry);}},Icon('History',18),h('span',{dir:'auto'},entry.q),h('small',null,entry.mode==='people'?t('الأشخاص','People'):entry.mode==='lists'?t('قوائمي','My lists'):entry.format?props.typeLabel(entry.format):t('الأعمال','Media')),Icon('ArrowUpLeft',17));})),
        searchMode==='media'?h('section',null,h('h2',null,t('اكتشف عملك القادم','Find your next read')),h('div',{className:'lf-design-search-grid'},ranked.slice(0,6).map(function(work){return item(work,false);})))
          :h('div',{className:'lf-explore-search-message'},Icon(searchMode==='people'?'Users':'List',32),h('h2',null,searchMode==='people'?t('ابحث عن قارئ','Find a reader'):t('ابحث في قوائمك','Search your lists')),h('p',null,searchMode==='people'?t('الاسم أو اسم المستخدم','Name or username'):t('اسم القائمة أو وصفها','List name or description'))));
    }
    function searchMessage(phase){
      var messages={short:[t('أكمل البحث','Keep typing'),t('حرفان على الأقل','At least two characters')],loading:[t('جارٍ البحث…','Searching…'),''],error:[t('تعذّر الاتصال','Could not connect'),t('حاول مجدداً بعد التحقق من اتصالك','Check your connection and try again')],empty:[t('لا توجد نتائج مطابقة','No matching results'),t('جرّب عنواناً آخر أو غيّر الفلاتر','Try another title or change the filters')]};
      if(phase==='empty'&&searchMode==='people')messages.empty=[t('لا توجد حسابات مطابقة','No matching readers'),t('جرّب الاسم أو اسم المستخدم','Try a name or username')];
      var text=messages[phase];return text&&h('div',{className:'lf-explore-search-message',role:'status'},Icon(phase==='error'?'WifiOff':'Search',30),h('h2',null,text[0]),text[1]&&h('p',null,text[1]));
    }
    function searchBody(){
      if(!searchQuery.trim())return searchIdle();
      if(searchKey(searchQuery).length<2)return searchMessage('short');
      var rows=mediaResults;
      if(searchMode==='media'){
        var scoped=catalogState&&normalized(catalogState.searchQuery)===normalized(searchQuery)&&formatKey(catalogState.searchType)===formatKey(activeSearchType),failed=loadError||remoteFailed||scoped&&catalogState.searchError;
        var phase=searchPhase(searchQuery,rows.length,searchPending||remoteBusy||scoped&&catalogState.searching,failed);
        return h('section',{className:'lf-design-inline-results'},h('p',{className:'lf-design-search-status',role:'status'},phase==='updating'?t('جارٍ تحديث النتائج…','Updating results…'):phase==='partial'?t('بعض المصادر غير متاحة؛ هذه النتائج المتوفرة','Some sources are unavailable; showing available results'):phase==='ready'?editionEntries.length+' '+t('نتيجة متوفرة','available results'):''),
          searchMessage(phase),failed&&h('button',{type:'button',className:'lf-explore-search-retry',onClick:retryMediaSearch},Icon('RotateCw',17),t('إعادة المحاولة','Try again')),
          suggestionsFor(searchQuery,activeSearchType),h('div',{className:'lf-design-search-grid'},editionEntries.slice(0,searchLimit).map(searchEntry)),
          editionEntries.length>searchLimit&&h('button',{className:'lf-explore-search-more',onClick:function(){setSearchLimit(searchLimit+36);}},t('عرض المزيد','Show more')),
          (phase==='empty'||phase==='partial'||phase==='error')&&root.LorefyProductTools&&root.LorefyProductTools.openMissingRequests&&h('button',{className:'lf-catalog-request-button',onClick:function(){root.LorefyProductTools.openMissingRequests(searchQuery);}},Icon('BookPlus',18),t('طلب إضافة عمل','Request a missing work')));
      }
      if(searchMode==='people')return h('section',{className:'lf-design-inline-results'},searchStatus?searchMessage(searchStatus==='loading'?'loading':'error'):readers.length?readers.map(function(reader){return h('button',{key:reader.id,className:'lf-design-person',onClick:function(){rememberSearch();remember();root.LorefyUserDiscovery.openReaderProfile(reader,root.LorefyUserDiscovery.buildDirectory());}},reader.avatar?h('img',{src:reader.avatar,alt:''}):Icon('UserRound',24),h('span',null,h('strong',{dir:'auto'},reader.name),h('small',{dir:'ltr'},'@'+reader.username)),Icon('ChevronLeft',18));}):searchMessage('empty'),searchStatus==='error'&&h('button',{className:'lf-explore-search-retry',onClick:function(){setSearchAttempt(searchAttempt+1);}},Icon('RotateCw',17),t('إعادة المحاولة','Try again')));
      var lists=[];try{lists=root.LorefyProfileSections?root.LorefyProfileSections.foldersFor({},true,root.localStorage):[];}catch(_){}
      lists=lists.filter(function(list){return normalized(list.name+' '+list.description).includes(normalized(searchQuery));});
      return h('section',{className:'lf-design-inline-results'},lists.length?lists.map(function(list){return h('button',{key:list.id,className:'lf-design-person',onClick:function(){rememberSearch();open({kind:'shelf',title:list.name,items:list.items.map(function(entry){return props.getWork(entry.workId||entry.id);}).filter(Boolean)});}},Icon('List',20),h('span',null,h('strong',null,list.name),h('small',null,list.items.length+' '+t('عنصر','items'))),Icon('ChevronLeft',18));}):h('p',{className:'lf-design-search-status',role:'status'},t('لا توجد قوائم مطابقة في حسابك','No matching lists in your account')));
    }
    function cover(work, eager, featured) {
      var src=props.cover(work),safe=!!(root.LOREFY_RUNTIME&&root.LOREFY_RUNTIME.rightsSafeMedia||root.LOREFY_RELEASE&&root.LOREFY_RELEASE.rightsSafeMedia);
      return h('img', {className:featured?'lf-explore-feature-art':undefined,src:featured?featureArtwork(work,src,safe):src,alt:'',loading:eager?'eager':'lazy',decoding:'async',onError:props.onCoverError,'data-fallback':props.fallback(work)});
    }
    function heroArtwork(work){
      var src=props.cover(work),safe=!!(root.LOREFY_RUNTIME&&root.LOREFY_RUNTIME.rightsSafeMedia||root.LOREFY_RELEASE&&root.LOREFY_RELEASE.rightsSafeMedia);
      if(!root.LorefyCoverMedia)return h('div',{className:'lf-explore-immersive-art','aria-hidden':true},cover(work,true,true));
      return h(root.LorefyCoverMedia,{workId:'explore-art:'+work.id,src:featureArtwork(work,src,safe),fallback:props.fallback(work),language:props.language,loading:'eager',fetchPriority:'high',render:function(surface,retry){
        return h(React.Fragment,null,h('div',{className:'lf-explore-immersive-art','aria-hidden':true},surface),retry&&React.cloneElement(retry,{className:'lf-cover-retry lf-explore-art-retry','aria-label':t('إعادة تحميل الصورة','Retry artwork'),title:t('إعادة تحميل الصورة','Retry artwork')}));
      }});
    }
    function open(value) { opener.current = root.document.activeElement; setDialog(value); }
    function close() { collectionRequest.current++;setDialog(null); setDraft(null); }
    function openWork(work) { if(searchActive&&searchQuery.trim())rememberSearch();remember(); if (root.document.activeElement && root.document.activeElement.blur) root.document.activeElement.blur(); props.onWork(work); }
    React.useEffect(function () {
      if (!dialog || !panel.current) return;
      panel.current.querySelector('button')?.focus();
      var changed = [], node = panel.current.parentElement;
      while (node && node.parentElement && node !== root.document.body) {
        Array.from(node.parentElement.children).forEach(function (sibling) {
          if (sibling === node || sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') return;
          changed.push([sibling, sibling.inert]); sibling.inert = true;
        }); node = node.parentElement;
      }
      return function () { changed.forEach(function (entry) { entry[0].inert = entry[1]; }); if (opener.current && opener.current.isConnected) opener.current.focus(); };
    }, [dialog]);
    function trap(event) {
      if (event.key === 'Escape') { event.stopPropagation(); close(); }
      if (event.key !== 'Tab' || !panel.current) return;
      var controls = Array.from(panel.current.querySelectorAll('button:not([disabled]),input,select,a[href]')).filter(function (node) { return node.getClientRects().length; });
      var firstNode = controls[0], lastNode = controls[controls.length - 1];
      if (event.shiftKey && root.document.activeElement === firstNode) { event.preventDefault(); lastNode?.focus(); }
      if (!event.shiftKey && root.document.activeElement === lastNode) { event.preventDefault(); firstNode?.focus(); }
    }
    function searchEntry(entry) {
      var multiple=entry.items.length>1;
      return h('div',{key:entry.key,className:'lf-explore-search-entry','data-edition-group':entry.key},item(entry.work,false),
        h('div',{className:'lf-search-edition-actions'},entry.eligible&&h('button',{type:'button',className:'lf-search-editions-button',disabled:!multiple,'aria-label':t('طبعات ','Editions of ')+entry.work.title+' · '+entry.items.length,
          onClick:function(){open({kind:'editions',title:entry.work.title,context:editionContext,items:entry.items.map(function(work){return Object.assign({},work);})});}},Icon('BookOpen',16),editionCountLabel(entry.items.length,props.language))));
    }
    function item(work, feedback, edition) {
      var byline=work.metadataOnly?work.source||work._apiSource:work.auth;
      function renderCard(surface, retry) {return h('article', {key:work.id, className:'lf-explore-work lf-cover-card'},
        h('button', {type:'button', className:'lf-explore-work-open','data-no-translate':'1',onClick:function () { openWork(work); }, 'aria-label':[work.title,byline,edition&&editionDescription(work)].filter(Boolean).join(' · '), title:work.title}, surface,h('strong',{className:'lf-explore-work-caption lf-catalog-work-title',dir:'auto',title:work.title,'data-no-translate':'1'},work.title),h('small',{className:'lf-explore-work-author',dir:'auto',title:byline,'data-no-translate':'1'},byline),edition&&h('small',{className:'lf-search-edition-meta',dir:'auto',title:editionDescription(work),'data-no-translate':'1'},editionDescription(work)||t('بيانات الطبعة غير متاحة','Edition details unavailable'))),retry,
        feedback && h('button', {type:'button', className:'lf-explore-work-options', 'aria-label':t('خيارات اقتراح ', 'Recommendation options for ') + work.title,
          onClick:function () { open({kind:'feedback', work:work, title:work.title}); }}, Icon('Ellipsis', 16)));}
      return root.LorefyCoverMedia?h(root.LorefyCoverMedia,{key:work.id,workId:work.id,src:props.cover(work),fallback:props.fallback(work),loading:'lazy',language:props.language,render:renderCard}):renderCard(cover(work),null);
    }
    var collectionRequest=React.useRef(0);
    React.useEffect(function(){return function(){collectionRequest.current++;};},[owner]);
    async function fillCollection(shelf,title,target,request,existingPager) {
      var pager=existingPager,loader=root.LorefyCatalogLoader;
      if(!pager&&loader&&loader.createCollectionPager)pager=loader.createCollectionPager(sectionType(shelf.key,props.allType));
      function active(){return collectionRequest.current===request;}
      function collect(){return sectionWorks(shelf.key,ranked.concat(props.getCatalog?props.getCatalog():[]),shelfPreferences,props.library,seeds);}
      var items=collect();
      if(active())setDialog({kind:'shelf',title:title,items:items,shelf:shelf,pager:pager,loading:true});
      try {
        // At most three catalog shards per explicit open/Load more action.
        for(var batch=0;active()&&pager&&pager.hasMore()&&items.length<target&&batch<3;batch++){
          await pager.next(active);if(!active())return;items=collect();
        }
        if(active())setDialog({kind:'shelf',title:title,items:items,shelf:shelf,pager:pager,loading:false});
      }catch(_){if(active())setDialog({kind:'shelf',title:title,items:items,shelf:shelf,pager:pager,loading:false,error:true});}
    }
    function openShelf(shelf,title) {
      var request=++collectionRequest.current;setCollectionLimit(60);
      open({kind:'shelf',title:title,items:[],shelf:shelf,loading:true});
      fillCollection(shelf,title,60,request);
    }
    function moreCollection(){
      if(dialog.loading)return;
      var target=collectionLimit+60;setCollectionLimit(target);
      if(dialog.shelf)fillCollection(dialog.shelf,dialog.title,target,collectionRequest.current,dialog.pager);
    }
    function filtersBody() {
      var searching=dialog.kind==='searchFilters';
      return h(React.Fragment,null,
        searching&&h('label',{className:'lf-explore-filter-field'},t('نوع العمل','Format'),h('select',{value:draft.format||'',onChange:function(event){setDraft(Object.assign({},draft,{format:event.target.value}));}},h('option',{value:''},t('كل الأعمال','All formats')),props.types.filter(function(type){return type!==props.allType;}).map(function(type){return h('option',{key:type,value:type},props.typeLabel(type));}))),
        h('label',{className:'lf-explore-filter-field'},t('التصنيف','Genre'),h('select',{value:(draft.genres||[])[0]||'',onChange:function(event){setDraft(Object.assign({},draft,{genres:event.target.value?[event.target.value]:[]}));}},h('option',{value:''},t('الكل','All genres')),props.genres.map(function(genre){return h('option',{key:genre,value:genre},genreLabel(genre,props.language));}))),
        h('label',{className:'lf-explore-filter-field'},t('الحالة','Status'),h('select',{value:draft.status,onChange:function(event){setDraft(Object.assign({},draft,{status:event.target.value}));}},[['all',t('الكل','All')],['completed',t('مكتمل','Completed')],['ongoing',t('مستمر','Ongoing')]].map(function(entry){return h('option',{key:entry[0],value:entry[0]},entry[1]);}))),
        h('label',{className:'lf-explore-filter-field'},t('الترتيب','Sort'),h('select',{value:draft.sort,onChange:function(event){setDraft(Object.assign({},draft,{sort:event.target.value}));}},(searching?[['relevance',t('الأكثر صلة','Most relevant')]]:[]).concat([['popular',t('الشائع','Popular')],['rating',t('الأعلى تقييماً','Top rated')],['newest',t('الأحدث','Newest')]]).map(function(entry){return h('option',{key:entry[0],value:entry[0]},entry[1]);}))),
        h('button',{className:'lf-explore-save',onClick:function(){if(searching){searchRetry.current++;setSearchFilters(draft);setSearchLimit(36);}else{setFilters({genres:draft.genres,status:draft.status,rating:0});setSort(draft.sort);setLimit(60);}close();top();}},t('تطبيق','Apply')),
        h('button',{className:'lf-explore-filter-reset',onClick:function(){setDraft({format:'',genres:[],status:'all',rating:0,sort:searching?'relevance':'popular'});}},t('إعادة ضبط','Reset')));
    }
    function section(shelf) {
      var title = shelf.key.indexOf('genre-') === 0 ? genreLabel(shelf.title, props.language) : shelf.title;
      return h('section', {key:shelf.key, className:'lf-explore-shelf', 'data-shelf':shelf.key},
        h('header', {className:'lf-explore-section-head'}, h('div', null, h('h2', {dir:'auto'}, title)),
          h('button', {onClick:function () { openShelf(shelf,title); }}, t('عرض الكل', 'See all'), Icon('ChevronLeft', 16))),
        shelf.items.length?h('div', {className:'lf-explore-rail'}, shelf.items.slice(0,shelf.key==='for-you'?3:shelf.items.length).map(function (work) { return item(work, false); })):h('button',{className:'lf-explore-empty',onClick:function(){openShelf(shelf,title);}},t('اكتشف قراءة قصيرة','Find a shorter read')));
    }
    function toggle(field, value) {
      setDraft(function (current) { var next=Object.assign({},current), values=(current[field] || []).slice(); next[field]=values.includes(value)?values.filter(function(x){return x!==value;}):values.concat(value); return next; });
    }
    function preferencesBody() {
      return h(React.Fragment,null,
        h('details',{className:'lf-explore-filter-options'},h('summary',null,t('أنواع الأعمال','Formats')+' · '+(draft.formats||[]).length),
          h('div',{className:'lf-explore-preferences'},props.types.filter(function(type){return type!==props.allType;}).map(function(type){return h('label',{key:type},h('input',{type:'checkbox',checked:(draft.formats||[]).includes(type),onChange:function(){toggle('formats',type);}}),props.typeLabel(type));}))),
        h('details',{className:'lf-explore-filter-options'},h('summary',null,t('التصنيفات','Genres')+' · '+(draft.genres||[]).length),
          h('div',{className:'lf-explore-preferences'},props.genres.map(function(genre){return h('label',{key:genre},h('input',{type:'checkbox',checked:(draft.genres||[]).includes(genre),onChange:function(){toggle('genres',genre);}}),genreLabel(genre,props.language));}))),
        h('button',{className:'lf-explore-save',onClick:function(){props.onPreferences(draft);close();}},t('حفظ','Save')));
    }
    function chooseFormat(type) { root.clearTimeout(inputTimer.current);setFilters({genres:[],status:'all',rating:0});setFormat(type); setMode('browse'); setQuery(''); setSort('popular'); setLimit(60); top(); }
    function back() { root.clearTimeout(inputTimer.current);setFormat(''); setMode('browse'); setQuery(''); top(); }
    function featureControls() {
      return h('div',{className:'lf-explore-feature-controls'},h('button',{'aria-label':t('العمل السابق','Previous work'),onClick:function(){setPaused(true);setSlide((slide+features.length-1)%features.length);}},Icon(en?'ChevronLeft':'ChevronRight',16)),
          features.map(function(work,index){return h('button',{key:work.id,className:'lf-explore-feature-dot','aria-label':work.title,'aria-pressed':index===slide%features.length,onClick:function(){setPaused(true);setSlide(index);}},h('span',null));}),
          h('button',{'aria-label':t('العمل التالي','Next work'),onClick:function(){setPaused(true);setSlide(slide+1);}},Icon('ChevronLeft',16)),
          !reducedMotion && h('button',{type:'button',className:'lf-explore-feature-rotation','aria-label':paused?t('تشغيل العرض التلقائي','Start automatic slideshow'):t('إيقاف العرض التلقائي','Pause automatic slideshow'),title:paused?t('تشغيل العرض التلقائي','Start automatic slideshow'):t('إيقاف العرض التلقائي','Pause automatic slideshow'),onClick:function(){setPaused(function(value){return !value;});}},Icon(paused?'Play':'Pause',16)));
    }
    function carousel() {
      if (!selected) return null;
      var rating=Number(selected.r),rated=selected.rSrc&&Number.isFinite(rating)&&rating>0&&rating<=5;
      var poster=h('button',{type:'button',className:'lf-explore-feature-poster','aria-label':t('فتح ','Open ')+selected.title,onClick:function(){openWork(selected);}},cover(selected,true));
      if(root.LorefyLibraryMedia)poster=root.LorefyLibraryMedia.card(poster,{lang:props.language,workId:selected.id,title:selected.title,loading:'eager'});
      return h('section', {className:'lf-explore-feature',ref:hero,'aria-label':t('اختيار اليوم','Featured pick'),'data-featured-work':selected.id},
        h('div',{className:'lf-explore-feature-card'},
          h('div',{className:'lf-design-feature-copy',dir:'ltr'},
            features.length>1?h('details',{className:'lf-explore-feature-selector'},h('summary',null,t('اختيار اليوم','Featured pick')),featureControls()):h('span',{className:'lf-explore-feature-label'},t('اختيار اليوم','Featured pick')),
            h('button',{type:'button',className:'lf-explore-feature-open',onClick:function(){openWork(selected);},'aria-label':selected.title},h('strong',{dir:'auto','data-no-translate':'1'},selected.title)),
            h('div',{className:'lf-explore-feature-action-row'},
              props.onEditProgress&&h('button',{type:'button',className:'lf-explore-feature-add','aria-label':t('إضافة إلى مكتبتي: ','Add to my library: ')+selected.title,title:t('إضافة إلى مكتبتي','Add to my library'),onClick:function(){remember();props.onEditProgress(selected);}},Icon('Plus',23)),
              h('span',{className:'lf-explore-feature-meta',dir:en?'ltr':'rtl'},props.typeLabel(selected.type),rated&&h('span',{className:'lf-explore-feature-score',dir:'ltr'},rating.toFixed(1),Icon('Star',18))))),
          poster));
    }
    var immersive=!!selected&&!format&&mode==='you'&&!searchActive;
    return h('div', {className:'lf-screen-scroll lf-discover-page lf-explore-studio lf-explore-cinema'+(format?' is-format':'')+(immersive?' has-feature':'')+(searchActive?' is-searching':'')+(!format&&!searchActive&&mode==='browse'?' is-types':''),dir:en?'ltr':'rtl',ref:screen,onScroll:function(){remember();}},
      immersive&&heroArtwork(selected),
      h('header',{className:'lf-explore-header',dir:format?'ltr':undefined},
        format && h('button',{className:'lf-explore-icon','aria-label':t('العودة إلى الأنواع','Back to types'),onClick:back},Icon(en?'ArrowLeft':'ArrowRight')),
        h('div',null,h('h1',null,format?props.typeLabel(format):searchActive?t('البحث','Search'):t('استكشف','Explore'))),
        searchActive&&!format?h('button',{className:'lf-explore-search-cancel',onClick:cancelSearch},t('إلغاء','Cancel')):format ? h('button',{className:'lf-explore-icon lf-explore-format-filter','aria-label':t('تصفية الأعمال','Filter works'),onClick:function(){setDraft(Object.assign({},filters,{sort:sort}));open({kind:'filters',title:t('تصفية الأعمال','Filter works')});}},Icon('SlidersHorizontal',22)) : h('button',{className:'lf-explore-icon','aria-label':t('تعديل ذوقي','Edit preferences'),onClick:function(){setDraft(Object.assign({},props.preferences));open({kind:'preferences',title:t('ذوقك في القراءة','Your reading taste')});}},Icon('SlidersHorizontal',22))),
      format ? h('label',{key:'format-search-'+format,className:'lf-explore-format-search','data-lorefy-catalog-search':format},Icon('Search'),h('input',{type:'search',dir:'auto',ref:formatSearchInput,defaultValue:query,'aria-label':t('بحث في ','Search ')+props.typeLabel(format),placeholder:t('ابحث في ','Search ')+props.typeLabel(format),onChange:function(event){var value=event.target.value;searchRetry.current++;root.clearTimeout(inputTimer.current);inputTimer.current=root.setTimeout(function(){setQuery(value);setLimit(60);},180);},onKeyDown:function(event){if(event.key==='Escape'){event.target.blur();back();}if(event.key==='Enter'){root.clearTimeout(inputTimer.current);setQuery(event.currentTarget.value);setLimit(60);}}})) :
        h('div',{key:'global-search',className:'lf-design-inline-search lf-search-box','data-lorefy-catalog-search':searchFilters.format||props.allType,'data-lorefy-search-local':searchMode==='media'?undefined:'true'},Icon('Search'),h('input',{type:'search',dir:'auto',ref:searchInput,defaultValue:searchQuery,autoComplete:'off',enterKeyHint:'search','aria-label':t('بحث','Search'),placeholder:searchMode==='people'?t('ابحث عن شخص','Search people'):searchMode==='lists'?t('ابحث في قوائمك','Search your lists'):t('ابحث عن عمل أو مؤلف','Search media or authors'),onFocus:function(){setSearchActive(true);},onChange:function(event){var value=event.target.value;searchRetry.current++;root.clearTimeout(inputTimer.current);inputTimer.current=root.setTimeout(function(){setSearchQuery(value);},180);},onKeyDown:function(event){if(event.key==='Escape')cancelSearch();if(event.key==='Enter'){root.clearTimeout(inputTimer.current);setSearchQuery(event.currentTarget.value);rememberSearch();event.currentTarget.blur();}}}),searchActive&&h('button',{type:'button',className:'lf-explore-search-clear','aria-label':t('مسح البحث','Clear search'),title:t('مسح البحث','Clear search'),onClick:clearSearch},Icon('X',17))),
      format&&root.LorefyProductTools&&root.LorefyProductTools.openMissingRequests&&h('button',{type:'button',className:'lf-catalog-request-button',onClick:function(){root.LorefyProductTools.openMissingRequests(query);}},Icon('BookPlus',16),t('عمل غير موجود؟','Missing work?')),
      !format&&searchActive&&h('div',{className:'lf-design-search-modes',role:'tablist','aria-label':t('نوع البحث','Search type'),onKeyDown:function(event){
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        var buttons=Array.from(event.currentTarget.querySelectorAll('[role=tab]')),index=buttons.indexOf(root.document.activeElement);
        if(index<0)return;event.preventDefault();
        var step=event.key==='ArrowRight'?(en?1:-1):(en?-1:1),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+step+buttons.length)%buttons.length;
        buttons[next].click();buttons[next].focus();
      }},[['media',t('الأعمال','Media'),'BookOpen'],['people',t('الأشخاص','People'),'Users'],['lists',t('قوائمي','My lists'),'List']].map(function(entry){return h('button',{key:entry[0],role:'tab',tabIndex:searchMode===entry[0]?0:-1,'aria-selected':searchMode===entry[0],onClick:function(){changeSearchMode(entry[0]);}},Icon(entry[2],16),entry[1]);})),
      !format&&searchActive&&searchMode==='media'&&h('div',{className:'lf-explore-search-tools'},h('button',{className:'lf-explore-search-filter',onClick:function(){setDraft(Object.assign({},searchFilters));open({kind:'searchFilters',title:t('تصفية البحث','Search filters')});}},Icon('SlidersHorizontal',17),t('الفلاتر','Filters'),(searchFilters.format||searchFilters.genres.length||searchFilters.status!=='all')&&h('span',null,t('مفعّلة','Active'))),h('small',null,searchFilters.format?props.typeLabel(searchFilters.format):t('كل الأعمال','All formats'))),
      format ? h('div',{className:'lf-explore-sorts',role:'group','aria-label':t('ترتيب الأعمال','Sort works')},[['popular',t('الشائع','Popular')],['rating',t('الأعلى تقييماً','Top rated')],['newest',t('الجديد','New')]].map(function(entry){return h('button',{key:entry[0],'aria-pressed':sort===entry[0],onClick:function(){setSort(entry[0]);setLimit(60);top();}},entry[1]);})) :
        !searchActive&&h('div',{className:'lf-explore-tabs',role:'tablist','aria-label':t('أقسام استكشف','Explore views')},[['you',t('تصفّح','Browse')],['browse',t('الأنواع','Types')]].map(function(tab){return h('button',{key:tab[0],role:'tab',id:'explore-tab-'+tab[0],'aria-controls':'explore-panel','aria-selected':mode===tab[0],onClick:function(){setMode(tab[0]);top();}},tab[1]);})),
      format ? h(React.Fragment,null,
        h('p',{className:'lf-explore-catalog-status',role:'status'},loadError||remoteFailed||catalogState&&catalogState.searchError?t('تعذر تحميل النتائج، حاول مجدداً.','Could not load results. Try again.'):remoteBusy||catalogState&&catalogState.searching?t('جارٍ البحث…','Searching…'):!catalogReady?t('جارٍ تحميل الأعمال…','Loading works…'):''),
        suggestionsFor(query,format),
        h('div',{className:'lf-explore-format-grid'},groupingActive?editionEntries.slice(0,limit).map(searchEntry):results.slice(0,limit).map(function(work){return item(work,false);})),
        !results.length&&catalogReady&&!loadError&&!remoteBusy&&!remoteFailed&&!(catalogState&&(catalogState.searching||catalogState.searchError))&&h('p',{className:'lf-explore-empty'},t('لا توجد نتائج لهذا البحث','No results for this search')),
        h('div',{ref:sentinel,className:'lf-explore-more'},loadError||remoteFailed||catalogState&&catalogState.searchError?h('button',{type:'button',onClick:retryMediaSearch},t('إعادة المحاولة','Try again')):(limit<resultCount||catalogState&&catalogState.hasMore)&&h('button',{onClick:more},t('تحميل المزيد','Load more')))) :
        searchActive?searchBody():h('div',{role:'tabpanel',id:'explore-panel','aria-labelledby':'explore-tab-'+mode},mode==='you'?h(React.Fragment,null,carousel(),
          !catalogReady&&h('p',{className:'lf-explore-catalog-status',role:'status'},t('جارٍ تحديث المكتبة…','Updating the library…')),
          shelves.length?shelves.slice(0,1).map(section):h('div',{className:'lf-explore-empty'},h('h2',null,t('لا توجد اقتراحات بعد','No suggestions yet'))),
          root.LorefyFriendActivity&&props.friendProps&&h(root.LorefyFriendActivity.Rails,Object.assign({},props.friendProps,{compact:true,showRecent:false,onSeeAll:function(title,items){setCollectionLimit(60);open({kind:'shelf',title:title,items:items});}})),shelves.slice(1).map(section)):
          h('section',{className:'lf-explore-browse'},h('h2',null,t('أنواع الأعمال','Formats')),h('div',{className:'lf-explore-category-grid'},props.types.filter(function(type){return type!==props.allType;}).map(function(type){
            var category=props.categories.find(function(entry){return entry.type===type;})||{type:type,count:0};
            var representative=ranked.find(function(work){return formatKey(work.type)===formatKey(type)&&!work.metadataOnly;})||category.rep;
            var categoryCard=h('button',{key:type,className:'lf-explore-category',onClick:function(){chooseFormat(type);}},h('span',{className:'lf-explore-category-art'},representative?cover(representative):Icon('BookOpen',32)),
              h('span',{className:'lf-explore-category-copy'},h('strong',null,props.typeLabel(type)),Icon('ChevronLeft',18)));
            return root.LorefyLibraryMedia&&representative?root.LorefyLibraryMedia.card(categoryCard,{lang:props.language,workId:'format:'+type+':'+representative.id,title:props.typeLabel(type)}):categoryCard;
          })))),
      dialog&&h('div',{className:'lf-explore-overlay'+(dialog.kind==='shelf'?' is-fullscreen':''),onClick:function(event){if(event.target===event.currentTarget)close();},onKeyDown:trap},h('section',{className:'lf-explore-dialog'+(dialog.kind==='editions'?' lf-search-editions-dialog':''),ref:panel,role:'dialog','aria-modal':true,'aria-label':dialog.title},
        h('header',null,h('h2',{dir:'auto'},dialog.title),h('button',{className:'lf-explore-icon','aria-label':t('إغلاق','Close'),onClick:close},Icon('X'))),
        dialog.kind==='editions'?h('div',{className:'lf-explore-dialog-grid lf-search-edition-grid'},dialog.items.map(function(work){return item(work,false,true);})):dialog.kind==='preferences'?preferencesBody():dialog.kind==='filters'||dialog.kind==='searchFilters'?filtersBody():dialog.kind==='feedback'?h('div',{className:'lf-explore-feedback'},[['more_like_this',t('المزيد مثل هذا','More like this'),'Sparkles'],['not_interested',t('غير مهتم','Not interested'),'EyeOff']].map(function(action){return h('button',{key:action[0],onClick:function(){props.onFeedback(dialog.work.id,action[0]);setRevision(function(n){return n+1;});close();}},Icon(action[2]),action[1]);})):
          h('div',{className:'lf-explore-dialog-grid'},dialog.items.slice(0,collectionLimit).map(function(work){return item(work,false);}),dialog.loading&&h('p',{className:'lf-explore-collection-status',role:'status'},t('جارٍ تحميل الأعمال…','Loading works…')),(collectionLimit<dialog.items.length||dialog.pager&&dialog.pager.hasMore()||dialog.error)&&h('button',{className:'lf-explore-collection-more',disabled:dialog.loading,onClick:moreCollection},dialog.error?t('إعادة المحاولة','Try again'):t('تحميل المزيد','Load more'))))));
  }
  return {editionCountLabel:editionCountLabel,groupSearchEditions:groupSearchEditions,rankSearchResults:rankSearchResults,searchPhase:searchPhase,readSearchHistory:readSearchHistory,saveSearchHistory:saveSearchHistory,clearSearchHistory:clearSearchHistory,featureArtwork:featureArtwork,sectionWorks:sectionWorks,sectionType:sectionType,matchesFilters:matchesFilters,catalogResults:catalogResults, featuredWorks:featuredWorks, genreLabel: genreLabel, formatKey: formatKey, collections: COLLECTIONS, SearchSuggestions: SearchSuggestions, readingSnapshot: readingSnapshot, readingItems: readingItems, buildShelves: buildShelves, Explore: Explore};
});
