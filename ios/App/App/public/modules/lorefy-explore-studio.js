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
    var key=normalized(value), types={manga:'مانجا',manhwa:'مانهوا',manhua:'مانهوا صيني',comics:'كوميكس',novel:'رواية',book:'كتاب','light novel':'لايت نوفل','web novel':'ويب نوفل','مانهوا صينية':'مانهوا صيني'};
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
    var editorial=root.LorefyEditorialCatalog;
    if(editorial) {
      var topics=new Map();
      editorial.picks.forEach(function(pick){(pick.editorialTopics || []).forEach(function(topic){var ids=topics.get(topic)||new Set();ids.add(idOf(pick));topics.set(topic,ids);});});
      COLLECTIONS.filter(function(entry){return !activeType || /^(?:all|الكل)$/i.test(activeType) || formatKey(entry[1])===formatKey(activeType);}).forEach(function(entry){
        var ids=topics.get(entry[0]);
        var collection=candidates.filter(function(w){return ids&&ids.has(idOf(w));});
        // Prefer complete cards within an editorial collection, while keeping
        // personal ranking and author diversity for all other shelves.
        collection.sort(function(a,b){
          function quality(w){return (w.synopsisAttribution && (w.synopsisAr || w.synopsisEn) ? 4 : 0) + (w.sourceCoverUrl || w.coverImage ? 1 : 0);}
          return quality(b)-quality(a);
        });
        add('collection-'+entry[0],entry[en?3:2],collection,entry[en?5:4],6,2);
      });
    }
    add('for-you', en ? 'Picked for you' : 'مختارة لك', candidates, '', 6, shelves.length ? 2 : 1);
    (preferences.genres || []).slice(0, 3).forEach(function (genre, index) {
      add('genre-' + index, genre, candidates.filter(function (w) { return genreMatches(w, genre); }), en ? 'From your favorite genres' : 'من أنواعك المفضلة');
    });
    // Author bibliographies remain on author pages; general discovery mixes writers.
    add('short', en ? 'A shorter next read' : 'قراءات لوقت أقصر', candidates.filter(function (w) {
      var pages = first(w, ['pages', 'pageCount']), chapters = first(w, ['ch', 'chapters']);
      return pages > 0 && pages <= 250 || chapters > 0 && chapters <= 40;
    }));
    add('finished', en ? 'Complete stories' : 'حكايات مكتملة', candidates.filter(function (w) { return /^(مكتمل|مكتملة|completed|finished)$/i.test(w.st || w.status || ''); }));
    var knownAuthors = new Set((seeds || []).map(function (w) { return normalized(w && w.auth); }).filter(Boolean));
    add('new-voices', en ? 'New voices to discover' : 'أسماء تستحق الاكتشاف', candidates.filter(function (w) { return w.auth && !knownAuthors.has(normalized(w.auth)); }));
    add('beyond', en ? 'Beyond your usual shelf' : 'خارج رفّك المعتاد', candidates.filter(function (work) {
      return !(preferences.genres || []).some(function (genre) { return genreMatches(work, genre); });
    }));
    return shelves;
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
    var dialogState = React.useState(null), dialog = dialogState[0], setDialog = dialogState[1];
    var draftState = React.useState(null), draft = draftState[0], setDraft = draftState[1];
    var revisionState = React.useState(0), revision = revisionState[0], setRevision = revisionState[1];
    var slideState = React.useState(0), slide = slideState[0], setSlide = slideState[1];
    var searchState=React.useState(!!saved.searchActive),searchActive=searchState[0],setSearchActive=searchState[1];
    var searchQueryState=React.useState(saved.searchQuery||''),searchQuery=searchQueryState[0],setSearchQuery=searchQueryState[1];
    var inputTimer=React.useRef(null), searchInput=React.useRef(null);
    React.useEffect(function(){return function(){root.clearTimeout(inputTimer.current);};},[]);
    var searchModeState=React.useState(saved.searchMode||'media'),searchMode=searchModeState[0],setSearchMode=searchModeState[1];
    var readersState=React.useState([]),readers=readersState[0],setReaders=readersState[1];
    var searchStatusState=React.useState(''),searchStatus=searchStatusState[0],setSearchStatus=searchStatusState[1];
    var pauseState = React.useState(false), paused = pauseState[0], setPaused = pauseState[1];
    var errorState = React.useState(false), loadError = errorState[0], setLoadError = errorState[1];
    var opener = React.useRef(null), panel = React.useRef(null), screen = React.useRef(null), sentinel = React.useRef(null), hero = React.useRef(null), busy = React.useRef(false);
    var t = function (ar, english) { return en ? english : ar; };
    var Icon = function (name, size) {
      if (en && name === 'ChevronLeft') name = 'ChevronRight';
      var component = root.NenIcons && root.NenIcons[name];
      return component ? h(component, {size:size || 19, 'aria-hidden':true}) : null;
    };
    function remember(scroll) {
      viewMemory.set(owner, {mode:mode, format:format, query:query, sort:sort, limit:limit,searchActive:searchActive,searchQuery:searchQuery,searchMode:searchMode, scroll:scroll == null ? screen.current && screen.current.scrollTop || 0 : scroll});
      if (viewMemory.size > 8) viewMemory.delete(viewMemory.keys().next().value);
    }
    React.useEffect(function () { remember(); }, [owner, mode, format, query, sort, limit,searchActive,searchQuery,searchMode]);
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
    var ranked = React.useMemo(function () { return root.LorefyPerformanceProbe?root.LorefyPerformanceProbe.measure("explore.ranking",function(){return props.getRanked(props.allType);}):props.getRanked(props.allType); }, [props.getRanked, revision]);
    var seeds = (props.favorites || []).concat(props.preferences.seedWorkIds || [], Object.keys(props.library).filter(function (id) {
      return !/متوقف|متروك|paused|dropped/i.test(props.library[id]);
    })).slice(0, 24).map(props.getWork).filter(Boolean);
    var shelfPreferences = props.preferences;
    if (!(shelfPreferences.genres || []).length) {
      var genreCounts = new Map();
      seeds.forEach(function (work) { (work.genres || []).forEach(function (genre) { genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1); }); });
      shelfPreferences = Object.assign({}, props.preferences, {genres:Array.from(genreCounts).sort(function (a,b) { return b[1]-a[1]; }).slice(0,3).map(function (entry) { return entry[0]; })});
    }
    var shelves = React.useMemo(function(){return root.LorefyPerformanceProbe?root.LorefyPerformanceProbe.measure("explore.shelves",function(){return buildShelves(ranked, shelfPreferences, props.library, seeds, props.language, props.allType);}):buildShelves(ranked, shelfPreferences, props.library, seeds, props.language, props.allType);},[ranked,props.preferences,props.library,props.favorites,props.language]);
    // Bring account recommendations forward, without changing their ranking or deduplication.
    shelves.sort(function (a, b) { return Number(b.key === 'for-you') - Number(a.key === 'for-you'); });
    var features = React.useMemo(function(){return featuredWorks(ranked);},[ranked]), selected = features[slide % (features.length || 1)];
    var results = React.useMemo(function () {
      return format ? catalogResults(props.getCatalog ? props.getCatalog() : ranked, format, query, sort, props.ratingScore) : [];
    }, [format, query, sort, revision, props.getCatalog]);
    function more() {
      var currentState = root.LorefyCatalogLoader && root.LorefyCatalogLoader.state();
      if (busy.current || currentState && currentState.searchError) return;
      if (limit < results.length) { setLimit(function (n) { return n + 60; }); return; }
      if (catalogState && catalogState.hasMore && root.LorefyCatalogLoader) {
        busy.current = true; setLoadError(false);
        root.LorefyCatalogLoader.loadMore().catch(function () { setLoadError(true); }).finally(function () {
          busy.current = false; setLimit(function (n) { return n + 60; }); setRevision(function (n) { return n + 1; });
        });
      }
    }
    function retryMediaSearch() {
      var loader = root.LorefyCatalogLoader;
      if (!loader) return;
      setLoadError(false);
      if (catalogState && catalogState.searchError && loader.retrySearch) loader.retrySearch();
      else Promise.resolve(loader.loadFormat(format || props.allType, format ? query : searchQuery)).catch(function () { setLoadError(true); });
    }
    React.useEffect(function () {
      if (!format || !sentinel.current || !root.IntersectionObserver) return;
      var observer = new root.IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) more();
      }, {root:screen.current, rootMargin:'0px 0px 300px 0px'});
      observer.observe(sentinel.current); return function () { observer.disconnect(); };
    }, [format, limit, results.length, revision]);
    React.useEffect(function () {
      if (features.length < 2 || paused || format || mode !== 'you' || searchActive || root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var timer = root.setInterval(function () {
        if (root.document.hidden || hero.current && hero.current.contains(root.document.activeElement)) return;
        setSlide(function (n) { return n + 1; });
      }, 7000);
      return function () { root.clearInterval(timer); };
    }, [features.length, paused, format, mode,searchActive]);
    React.useEffect(function(){
      if(!searchActive||searchMode!=='media')return;
      var timer=root.setTimeout(function(){var loader=root.LorefyCatalogLoader;if(loader&&loader.loadFormat)loader.loadFormat(props.allType,searchQuery).catch(function(){setLoadError(true);});},180);
      return function(){root.clearTimeout(timer);};
    },[searchActive,searchQuery,searchMode]);
    React.useEffect(function(){
      setReaders([]);setSearchStatus('');
      if(!searchActive||searchMode!=='people'||searchQuery.trim().length<2)return;
      var active=true,timer=root.setTimeout(function(){
        setSearchStatus('loading');var discovery=root.LorefyUserDiscovery;
        Promise.resolve(discovery&&discovery.buildDirectory?discovery.buildDirectory().search(searchQuery):[]).then(function(rows){if(active){setReaders(rows);setSearchStatus('');}}).catch(function(){if(active)setSearchStatus('error');});
      },180);
      return function(){active=false;root.clearTimeout(timer);};
    },[owner,searchActive,searchQuery,searchMode]);
    var mediaResults=React.useMemo(function(){return searchActive&&searchMode==='media'&&searchQuery.trim()?catalogResults(props.getCatalog?props.getCatalog():ranked,props.allType,searchQuery,'popular',props.ratingScore):[];},[searchActive,searchMode,searchQuery,revision,ranked,props.getCatalog,props.allType,props.ratingScore]);
    function cancelSearch(){root.clearTimeout(inputTimer.current);if(searchInput.current)searchInput.current.value='';setSearchActive(false);setSearchQuery('');setSearchMode('media');if(root.document.activeElement&&root.document.activeElement.blur)root.document.activeElement.blur();}
    function chooseSearchSuggestion(text) {
      if (format) { setQuery(text); setLimit(60); }
      else {
        // An uncontrolled field may be ahead of its debounced state.
        if (!searchInput.current || searchInput.current.value.trim() !== searchQuery.trim()) return;
        root.clearTimeout(inputTimer.current);
        searchInput.current.value = text;
        setSearchQuery(text);
        searchInput.current.focus();
      }
    }
    function suggestionsFor(text, type) {
      return h(SearchSuggestions, {state:catalogState, query:text, type:type, language:props.language, onChoose:chooseSearchSuggestion});
    }
    function searchBody(){
      if(!searchQuery.trim())return h('section',{className:'lf-design-inline-results','aria-live':'polite'});
      var rows=mediaResults;
      if(searchMode==='media')return h('section',{className:'lf-design-inline-results','aria-live':'polite'},h('p',{className:'lf-design-search-status'},loadError||catalogState&&catalogState.searchError?t('تعذر البحث، حاول مجدداً.','Search failed. Try again.'):catalogState&&catalogState.searching?t('جارٍ البحث…','Searching…'):rows.length+' '+t('نتيجة','results')),(loadError||catalogState&&catalogState.searchError)&&h('button',{type:'button',className:'lf-explore-search-retry',onClick:retryMediaSearch},t('إعادة المحاولة','Try again')),suggestionsFor(searchQuery,props.allType),h('div',{className:'lf-design-search-grid'},rows.slice(0,120).map(function(w){return item(w,false);})));
      if(searchMode==='people')return h('section',{className:'lf-design-inline-results','aria-live':'polite'},searchStatus?h('p',{className:'lf-design-search-status'},searchStatus==='loading'?t('جارٍ البحث…','Searching…'):t('تعذر البحث','Search failed')):readers.length?readers.map(function(reader){return h('button',{key:reader.id,className:'lf-design-person',onClick:function(){remember();root.LorefyUserDiscovery.openReaderProfile(reader,root.LorefyUserDiscovery.buildDirectory());}},reader.avatar&&h('img',{src:reader.avatar,alt:''}),h('span',{dir:'auto'},reader.name+' · @'+reader.username));}):h('p',{className:'lf-design-search-status'},t('لا توجد حسابات مطابقة','No matching people')));
      var lists=[];try{lists=root.LorefyProfileSections?root.LorefyProfileSections.foldersFor({},true,root.localStorage):[];}catch(_){}
      lists=lists.filter(function(list){return normalized(list.name+' '+list.description).includes(normalized(searchQuery));});
      return h('section',{className:'lf-design-inline-results','aria-live':'polite'},lists.length?lists.map(function(list){return h('button',{key:list.id,className:'lf-design-person',onClick:function(){open({kind:'shelf',title:list.name,items:list.items.map(function(entry){return props.getWork(entry.workId||entry.id);}).filter(Boolean)});}},Icon('List',20),list.name);}):h('p',{className:'lf-design-search-status'},t('لا توجد قوائم مطابقة في حسابك','No matching lists in your account')));
    }
    function cover(work, eager) { return h('img', {src:props.cover(work), alt:'', loading:eager ? 'eager' : 'lazy', decoding:'async', onError:props.onCoverError, 'data-fallback':props.fallback(work)}); }
    function open(value) { opener.current = root.document.activeElement; setDialog(value); }
    function close() { setDialog(null); setDraft(null); }
    function openWork(work) { remember(); if (root.document.activeElement && root.document.activeElement.blur) root.document.activeElement.blur(); props.onWork(work); }
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
    function item(work, feedback) {
      return h('article', {key:work.id, className:'lf-explore-work'},
        h('button', {type:'button', className:'lf-explore-work-open', onClick:function () { openWork(work); }, 'aria-label':work.title, title:work.title}, cover(work)),
        feedback && h('button', {type:'button', className:'lf-explore-work-options', 'aria-label':t('خيارات اقتراح ', 'Recommendation options for ') + work.title,
          onClick:function () { open({kind:'feedback', work:work, title:work.title}); }}, Icon('Ellipsis', 16)));
    }
    function section(shelf) {
      var title = shelf.key.indexOf('genre-') === 0 ? genreLabel(shelf.title, props.language) : shelf.title;
      return h('section', {key:shelf.key, className:'lf-explore-shelf', 'data-shelf':shelf.key},
        h('header', {className:'lf-explore-section-head'}, h('div', null, h('h2', {dir:'auto'}, title)),
          h('button', {onClick:function () { open({kind:'shelf', title:title, items:shelf.items}); }}, t('الكل', 'See all'), Icon('ChevronLeft', 16))),
        h('div', {className:'lf-explore-rail'}, shelf.items.map(function (work) { return item(work, false); })));
    }
    function toggle(field, value) {
      setDraft(function (current) { var next=Object.assign({},current), values=(current[field] || []).slice(); next[field]=values.includes(value)?values.filter(function(x){return x!==value;}):values.concat(value); return next; });
    }
    function preferencesBody() {
      return h(React.Fragment, null, h('fieldset', null, h('legend', null, t('ماذا تحب أن تقرأ؟','What do you like to read?')),
        h('div', {className:'lf-explore-preferences'}, props.types.filter(function(type){return type!==props.allType;}).map(function(type){return h('label',{key:type},h('input',{type:'checkbox',checked:(draft.formats||[]).includes(type),onChange:function(){toggle('formats',type);}}),props.typeLabel(type));}))),
        h('fieldset',null,h('legend',null,t('أنواعك المفضلة','Favorite genres')),h('div',{className:'lf-explore-preferences'},props.genres.map(function(genre){return h('label',{key:genre},h('input',{type:'checkbox',checked:(draft.genres||[]).includes(genre),onChange:function(){toggle('genres',genre);}}),genreLabel(genre,props.language));}))),
        h('button',{className:'lf-explore-save',onClick:function(){props.onPreferences(draft);close();}},Icon('Check'),t('حفظ ذوقي','Save preferences')));
    }
    function chooseFormat(type) { setFormat(type); setMode('browse'); setQuery(''); setSort('popular'); setLimit(60); top(); }
    function back() { setFormat(''); setMode('browse'); setQuery(''); top(); }
    function carousel() {
      if (!selected) return null;
      return h('section', {className:'lf-explore-feature', ref:hero, 'aria-label':t('أعمال معروفة','Well-known works')},
        h('div',{className:'lf-explore-feature-card'},
          h('button',{className:'lf-explore-feature-open',onClick:function(){openWork(selected);},'aria-label':selected.title},cover(selected,true),
            h('span',{className:'lf-design-feature-copy'},h('span',{className:'lf-design-work-badges'},h('span',null,props.typeLabel(selected.type)),Number(selected.r)>0&&selected.rSrc&&h('span',null,'★ '+Number(selected.r).toFixed(1))),h('strong',{dir:'auto','data-no-translate':''},selected.title),h('p',{dir:'auto','data-no-translate':''},String(selected[en?'synopsisEn':'synopsisAr']||selected.synopsis||selected.auth||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim())))),
        features.length>1 && h('div',{className:'lf-explore-feature-controls'},h('button',{'aria-label':t('العمل السابق','Previous work'),onClick:function(){setPaused(true);setSlide((slide+features.length-1)%features.length);}},Icon(en?'ChevronLeft':'ChevronRight',16)),
          features.map(function(work,index){return h('button',{key:work.id,className:'lf-explore-feature-dot','aria-label':work.title,'aria-pressed':index===slide%features.length,onClick:function(){setPaused(true);setSlide(index);}},h('span',null));}),
          h('button',{'aria-label':t('العمل التالي','Next work'),onClick:function(){setPaused(true);setSlide(slide+1);}},Icon('ChevronLeft',16))));
    }
    return h('div', {className:'lf-screen-scroll lf-discover-page lf-explore-studio'+(format?' is-format':''),dir:en?'ltr':'rtl',ref:screen,onScroll:function(){remember();}},
      h('header',{className:'lf-explore-header'},
        format && h('button',{className:'lf-explore-icon','aria-label':t('العودة إلى الأنواع','Back to types'),onClick:back},Icon(en?'ArrowLeft':'ArrowRight')),
        h('div',null,!format&&h('p',null,t('رفّك القادم','Your next shelf')),h('h1',null,format?props.typeLabel(format):t('استكشف','Explore'))),
        !format && h('button',{className:'lf-explore-icon','aria-label':t('تعديل ذوقي','Edit preferences'),onClick:function(){setDraft(Object.assign({},props.preferences));open({kind:'preferences',title:t('ذوقك في القراءة','Your reading taste')});}},Icon('SlidersHorizontal',22))),
      format ? h('label',{className:'lf-explore-format-search'},Icon('Search'),h('input',{type:'search',value:query,'aria-label':t('بحث في ','Search ')+props.typeLabel(format),placeholder:t('ابحث في ','Search ')+props.typeLabel(format),onChange:function(event){setQuery(event.target.value);setLimit(60);},onKeyDown:function(event){if(event.key==='Escape'){event.target.blur();back();}}})) :
        h('label',{className:'lf-design-inline-search lf-search-box'},Icon('Search'),h('input',{type:'search',ref:searchInput,defaultValue:searchQuery,autoComplete:'off','aria-label':t('بحث','Search'),placeholder:searchMode==='people'?t('ابحث عن شخص','Search people'):searchMode==='lists'?t('ابحث عن قائمة','Search lists'):t('ابحث عن عمل أو مؤلف','Search media'),onFocus:function(){setSearchActive(true);},onChange:function(event){var value=event.target.value;root.clearTimeout(inputTimer.current);inputTimer.current=root.setTimeout(function(){setSearchQuery(value);},180);},onKeyDown:function(event){if(event.key==='Escape')cancelSearch();}})),
      !format&&searchActive&&h('div',{className:'lf-design-search-modes',role:'tablist','aria-label':t('نوع البحث','Search type')},[['media',t('الأعمال','Media')],['people',t('الأشخاص','People')],['lists',t('القوائم','Lists')]].map(function(entry){return h('button',{key:entry[0],role:'tab','aria-selected':searchMode===entry[0],onClick:function(){setSearchMode(entry[0]);}},entry[1]);}),h('button',{className:'lf-design-search-close',onClick:cancelSearch},t('إلغاء','Cancel'))),
      format ? h('div',{className:'lf-explore-sorts',role:'group','aria-label':t('ترتيب الأعمال','Sort works')},[['popular',t('الشائع','Popular')],['rating',t('الأعلى تقييماً','Top rated')],['newest',t('الجديد','New')]].map(function(entry){return h('button',{key:entry[0],'aria-pressed':sort===entry[0],onClick:function(){setSort(entry[0]);setLimit(60);top();}},entry[1]);})) :
        !searchActive&&h('div',{className:'lf-explore-tabs',role:'tablist','aria-label':t('أقسام استكشف','Explore views')},[['you',t('تصفّح','Browse')],['browse',t('النوع','Type')]].map(function(tab){return h('button',{key:tab[0],role:'tab',id:'explore-tab-'+tab[0],'aria-controls':'explore-panel','aria-selected':mode===tab[0],onClick:function(){setMode(tab[0]);top();}},tab[1]);})),
      format ? h(React.Fragment,null,
        h('p',{className:'lf-explore-catalog-status',role:'status'},loadError||catalogState&&catalogState.searchError?t('تعذر تحميل النتائج، حاول مجدداً.','Could not load results. Try again.'):catalogState&&catalogState.searching?t('جارٍ البحث…','Searching…'):!catalogReady?t('جارٍ تحميل الأعمال…','Loading works…'):t('الأعمال المتاحة · ','Available works · ')+results.length.toLocaleString(props.language)),
        suggestionsFor(query,format),
        h('div',{className:'lf-explore-format-grid'},results.slice(0,limit).map(function(work){return item(work,false);})),
        !results.length&&catalogReady&&!loadError&&!(catalogState&&(catalogState.searching||catalogState.searchError))&&h('p',{className:'lf-explore-empty'},t('لا توجد نتائج لهذا البحث','No results for this search')),
        h('div',{ref:sentinel,className:'lf-explore-more'},loadError||catalogState&&catalogState.searchError?h('button',{type:'button',onClick:retryMediaSearch},t('إعادة المحاولة','Try again')):(limit<results.length||catalogState&&catalogState.hasMore)&&h('button',{onClick:more},t('تحميل المزيد','Load more')))) :
        searchActive?searchBody():h('div',{role:'tabpanel',id:'explore-panel','aria-labelledby':'explore-tab-'+mode},mode==='you'?h(React.Fragment,null,carousel(),
          !catalogReady&&h('p',{className:'lf-explore-catalog-status',role:'status'},t('جارٍ تحديث المكتبة…','Updating the library…')),
          shelves.length?shelves.slice(0,1).map(section):h('div',{className:'lf-explore-empty'},h('h2',null,t('لا توجد اقتراحات بعد','No suggestions yet'))),
          root.LorefyFriendActivity&&props.friendProps&&h(root.LorefyFriendActivity.Rails,Object.assign({},props.friendProps,{compact:true})),shelves.slice(1).map(section)):
          h('section',{className:'lf-explore-browse'},h('h2',null,t('اختر نوع العمل','Choose a type')),h('div',{className:'lf-explore-category-grid'},props.types.filter(function(type){return type!==props.allType;}).map(function(type){
            var category=props.categories.find(function(entry){return entry.type===type;})||{type:type,count:0};
            return h('button',{key:type,className:'lf-explore-category',onClick:function(){chooseFormat(type);}},category.rep?cover(category.rep):h('span',{className:'lf-explore-category-placeholder'},Icon('BookOpen',25)),
              h('span',null,h('strong',null,props.typeLabel(type)),h('small',null,catalogReady&&(!catalogPartial||category.count)?category.count.toLocaleString(props.language)+(catalogPartial?'+ ':' ')+t('عمل','works'):t('تصفح الأعمال','Browse works'))));
          })))),
      dialog&&h('div',{className:'lf-explore-overlay',onClick:function(event){if(event.target===event.currentTarget)close();},onKeyDown:trap},h('section',{className:'lf-explore-dialog',ref:panel,role:'dialog','aria-modal':true,'aria-label':dialog.title},
        h('header',null,h('h2',{dir:'auto'},dialog.title),h('button',{className:'lf-explore-icon','aria-label':t('إغلاق','Close'),onClick:close},Icon('X'))),
        dialog.kind==='preferences'?preferencesBody():dialog.kind==='feedback'?h('div',{className:'lf-explore-feedback'},[['more_like_this',t('المزيد مثل هذا','More like this'),'Sparkles'],['not_interested',t('غير مهتم','Not interested'),'EyeOff']].map(function(action){return h('button',{key:action[0],onClick:function(){props.onFeedback(dialog.work.id,action[0]);setRevision(function(n){return n+1;});close();}},Icon(action[2]),action[1]);})):
          h('div',{className:'lf-explore-dialog-grid'},dialog.items.map(function(work){return item(work,false);})))));
  }
  return {catalogResults:catalogResults, featuredWorks:featuredWorks, genreLabel: genreLabel, formatKey: formatKey, collections: COLLECTIONS, SearchSuggestions: SearchSuggestions, readingSnapshot: readingSnapshot, readingItems: readingItems, buildShelves: buildShelves, Explore: Explore};
});
