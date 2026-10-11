(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyExploreStudio = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

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
        add('collection-'+entry[0],entry[en?3:2],candidates.filter(function(w){return ids&&ids.has(idOf(w));}),entry[en?5:4],6,2);
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

  function Explore(props) {
    var React = root.React, h = React.createElement, en = props.language === 'en';
    var modeState = React.useState('you'), mode = modeState[0], setMode = modeState[1];
    var dialogState = React.useState(null), dialog = dialogState[0], setDialog = dialogState[1];
    var draftState = React.useState(null), draft = draftState[0], setDraft = draftState[1];
    var revisionState = React.useState(0), revision = revisionState[0], setRevision = revisionState[1];
    var opener = React.useRef(null), panel = React.useRef(null);
    React.useEffect(function(){
      var loader=root.LorefyCatalogLoader;
      if(loader&&loader.loadExplore)loader.loadExplore(props.activeType).catch(function(){});
    },[props.activeType]);
    var catalogState = root.LorefyCatalogLoader && root.LorefyCatalogLoader.state();
    var catalogReady = !catalogState || catalogState.ready;
    var catalogPartial = !!(catalogState && catalogState.partial);
    var ranked = React.useMemo(function () { return props.getRanked(); }, [props.getRanked, revision]);
    var seeds = (props.favorites || []).concat(props.preferences.seedWorkIds || [], Object.keys(props.library).filter(function (id) {
      return !/متوقف|متروك|paused|dropped/i.test(props.library[id]);
    })).slice(0, 24).map(props.getWork).filter(Boolean);
    var shelfPreferences = props.preferences;
    if (!(shelfPreferences.genres || []).length) {
      var genreCounts = new Map();
      seeds.forEach(function (work) { (work.genres || []).forEach(function (genre) { genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1); }); });
      shelfPreferences = Object.assign({}, props.preferences, {genres: Array.from(genreCounts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3).map(function (entry) { return entry[0]; })});
    }
    var shelves = buildShelves(ranked, shelfPreferences, props.library, seeds, props.language, props.activeType);
    var reading = readingItems(props.library, props.progress, props.getWork, props.getTotals);
    var t = function (ar, english) { return en ? english : ar; };
    var Icon = function (name, size) {
      if (en && name === 'ChevronLeft') name = 'ChevronRight';
      var component = root.NenIcons && root.NenIcons[name];
      return component ? h(component, {size: size || 19, 'aria-hidden': true}) : null;
    };
    function cover(work) { return h('img', {src: props.cover(work), alt: '', loading: 'lazy', decoding: 'async', onError: props.onCoverError, 'data-fallback': props.fallback(work)}); }
    function open(value) { opener.current = root.document.activeElement; setDialog(value); }
    function close() { setDialog(null); setDraft(null); }
    React.useEffect(function () {
      if (!dialog || !panel.current) return;
      panel.current.querySelector('button')?.focus();
      var changed = [], node = panel.current.parentElement;
      // Isolate the dialog without hiding the overlay or its ancestors.
      while (node && node.parentElement && node !== root.document.body) {
        Array.from(node.parentElement.children).forEach(function (sibling) {
          if (sibling === node || sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') return;
          changed.push([sibling, sibling.inert]); sibling.inert = true;
        });
        node = node.parentElement;
      }
      return function () {
        changed.forEach(function (entry) { entry[0].inert = entry[1]; });
        if (opener.current && opener.current.isConnected) opener.current.focus();
      };
    }, [dialog]);
    function trap(event) {
      if (event.key === 'Escape') { event.stopPropagation(); close(); }
      if (event.key !== 'Tab' || !panel.current) return;
      var controls = Array.from(panel.current.querySelectorAll('button:not([disabled]),input,select,a[href]')).filter(function (node) { return node.getClientRects().length; });
      var firstNode = controls[0], lastNode = controls[controls.length - 1];
      if (event.shiftKey && root.document.activeElement === firstNode) { event.preventDefault(); lastNode?.focus(); }
      if (!event.shiftKey && root.document.activeElement === lastNode) { event.preventDefault(); firstNode?.focus(); }
    }
    function item(work) {
      var value = Number(work.r), score = value > 0 && work.rSrc ? value.toFixed(1) : '';
      return h('article', {key: work.id, className: 'lf-explore-work'},
        h('button', {className: 'lf-explore-work-open', onClick: function () { props.onWork(work); }, 'aria-label': work.title}, cover(work),
          h('strong', {dir: 'auto', 'data-no-translate': ''}, work.title),
          h('small', {dir: 'auto', 'data-no-translate': ''}, work.auth || props.typeLabel(work.type))),
        h('div', {className: 'lf-explore-work-meta'}, h('span', null, props.typeLabel(work.type)), score && h('span', {className: 'lf-explore-score'}, Icon('Feather', 13), score),
          h('button', {className: 'lf-explore-icon', title: t('خيارات الاقتراح', 'Recommendation options'), 'aria-label': t('خيارات اقتراح ', 'Recommendation options for ') + work.title,
            onClick: function () { open({kind: 'feedback', work: work, title: work.title}); }}, Icon('Ellipsis', 16))));
    }
    function section(shelf) {
      return h('section', {key: shelf.key, className: 'lf-explore-shelf', 'data-shelf': shelf.key},
        h('header', {className: 'lf-explore-section-head'}, h('div', null, h('h2', {dir: 'auto'}, shelf.key.indexOf('genre-') === 0 ? genreLabel(shelf.title, props.language) : shelf.title), shelf.subtitle && h('p', null, shelf.subtitle)),
          h('button', {onClick: function () { open({kind: 'shelf', title: shelf.key.indexOf('genre-') === 0 ? genreLabel(shelf.title, props.language) : shelf.title, items: shelf.items}); }}, t('الكل', 'See all'), Icon('ChevronLeft', 16))),
        h('div', {className: 'lf-explore-rail'}, shelf.items.map(item)));
    }
    function toggle(field, value) {
      setDraft(function (current) {
        var next = Object.assign({}, current), values = (current[field] || []).slice();
        next[field] = values.includes(value) ? values.filter(function (x) { return x !== value; }) : values.concat(value);
        return next;
      });
    }
    function preferencesBody() {
      return h(React.Fragment, null, h('fieldset', null, h('legend', null, t('ماذا تحب أن تقرأ؟', 'What do you like to read?')),
        h('div', {className: 'lf-explore-preferences'}, props.types.filter(function (type) { return type !== props.allType; }).map(function (type) {
          return h('label', {key: type}, h('input', {type: 'checkbox', checked: (draft.formats || []).includes(type), onChange: function () { toggle('formats', type); }}), props.typeLabel(type));
        }))), h('fieldset', null, h('legend', null, t('أنواعك المفضلة', 'Favorite genres')),
        h('div', {className: 'lf-explore-preferences'}, props.genres.map(function (genre) {
          return h('label', {key: genre}, h('input', {type: 'checkbox', checked: (draft.genres || []).includes(genre), onChange: function () { toggle('genres', genre); }}), genreLabel(genre, props.language));
        }))),
        h('button', {className: 'lf-explore-save', onClick: function () { props.onPreferences(draft); close(); }}, Icon('Check'), t('حفظ ذوقي', 'Save preferences')));
    }
    return h('div', {className: 'lf-screen-scroll lf-discover-page lf-explore-studio', dir: en ? 'ltr' : 'rtl'},
      h('header', {className: 'lf-explore-header'}, h('div', null, h('p', null, t('رفّك القادم', 'Your next shelf')), h('h1', null, t('استكشف', 'Explore'))),
        h('button', {className: 'lf-explore-icon', title: t('تعديل ذوقي', 'Edit preferences'), 'aria-label': t('تعديل ذوقي', 'Edit preferences'), onClick: function () {
          setDraft(Object.assign({}, props.preferences)); open({kind: 'preferences', title: t('ذوقك في القراءة', 'Your reading taste')});
        }}, Icon('SlidersHorizontal', 22))),
      h('button', {className: 'lf-explore-search', onClick: props.onSearch}, Icon('Search'), h('span', null, t('عمل، مؤلف، أو نوع جديد', 'A work, author, or new genre'))),
      h('div', {className: 'lf-explore-tabs', role: 'tablist', 'aria-label': t('أقسام استكشف', 'Explore views')}, [['you', t('لك', 'For you')], ['browse', t('الأقسام', 'Browse')]].map(function (tab) {
        return h('button', {key: tab[0], role: 'tab', id: 'explore-tab-' + tab[0], 'aria-controls': 'explore-panel', 'aria-selected': mode === tab[0], onClick: function () { setMode(tab[0]); }}, tab[1]);
      })),
      !catalogReady && h('p', {className: 'lf-explore-catalog-status', role: 'status'}, t('جارٍ تحديث المكتبة…', 'Updating the library…')),
      h('div', {role: 'tabpanel', id: 'explore-panel', 'aria-labelledby': 'explore-tab-' + mode}, mode === 'you' ? h(React.Fragment, null,
        reading.length > 0 ? h('section', {className: 'lf-explore-reading'},
          h('header', {className: 'lf-explore-section-head'}, h('div', null, h('h2', null, t('تتابع قراءتها', 'Currently reading')), h('p', null, t('قيد القراءة · ', 'Reading · ') + reading.length)),
            h('button', {onClick: props.onLibrary}, t('الكل', 'See all'), Icon('ChevronLeft', 16))),
          h('div', {className: 'lf-explore-progress-grid'}, reading.slice(0, 3).map(function (row) {
            var work = row.work, snapshot = row.snapshot, unit = snapshot.unit === 'page' ? t('صفحة', 'pages') : t('فصل', 'chapters');
            return h('article', {key: work.id, className: 'lf-explore-progress-work'},
              h('button', {className: 'lf-explore-progress-cover', 'aria-label': work.title, onClick: function () { props.onWork(work); }}, cover(work)),
              h('strong', {dir: 'auto', 'data-no-translate': ''}, work.title),
              h('div', {className: 'lf-explore-progress-line'},
                h('b', null, snapshot.percent === null ? '—' : snapshot.percent + '%'),
                h('button', {className: 'lf-explore-icon', title: t('تحديث التقدم', 'Update progress'), 'aria-label': t('تحديث تقدم ', 'Update progress for ') + work.title,
                  onClick: function () { props.onEditProgress(work); }}, Icon('Pencil', 16))),
              snapshot.percent !== null && h('div', {className: 'lf-explore-progress-track', role: 'progressbar', 'aria-label': work.title,
                'aria-valuenow': snapshot.percent, 'aria-valuemin': 0, 'aria-valuemax': 100,
                'aria-valuetext': snapshot.current + ' / ' + snapshot.total + ' ' + unit + (snapshot.ongoing ? t(' من المتاح', ' available') : '')}, h('i', {style: {width: snapshot.percent + '%'}})),
              h('small', null, h('bdi', {dir: 'ltr'}, snapshot.current + (snapshot.total ? ' / ' + snapshot.total : '')), ' ', unit),
              snapshot.ongoing && h('small', {className: 'lf-explore-available'}, t('من الفصول المتاحة', 'Of available chapters')));
          }))) : h('section', {className: 'lf-explore-reading-empty'}, Icon('BookOpen', 22), h('strong', null, t('ماذا تقرأ الآن؟', 'What are you reading?')),
            h('button', {onClick: props.onLibrary}, t('مكتبتي', 'My library'), Icon('ChevronLeft', 16))),
        h('div', {className: 'lf-explore-format-row', role: 'group', 'aria-label': t('نوع العمل', 'Work format')}, props.types.map(function (type) {
          return h('button', {key: type, 'aria-pressed': props.activeType === type, onClick: function () { props.onType(type); }}, props.typeLabel(type));
        })),
        shelves.length > 0 && h('div',{className:'lf-explore-intro'},h('strong',null,t('حكايات وأفكار تستحق وقتك','Stories and ideas worth your time')),h('p',null,t('رفوف متنوعة · عمل واحد لكل كاتب داخل الرف','Varied shelves · one work per author in each shelf'))),
        shelves.length ? shelves.map(section) : h('div', {className: 'lf-explore-empty'}, h('h2', null, t('لا توجد اقتراحات لهذا الاختيار', 'No suggestions for this selection')),
          h('button', {onClick: function () { props.onType(props.allType); }}, t('كل الأنواع', 'All formats')))) :
        h('section', {className: 'lf-explore-browse'}, h('h2', null, t('اختر رفّك', 'Choose a shelf')),
          h('div', {className: 'lf-explore-category-grid'}, props.types.filter(function (type) { return type !== props.allType; }).map(function (type) {
            var category = props.categories.find(function (entry) { return entry.type === type; }) || {type: type, count: 0};
            return h('button', {key: category.type, className: 'lf-explore-category', onClick: function () { props.onBrowse(category.type); }}, category.rep ? cover(category.rep) : h('span', {className: 'lf-explore-category-placeholder'}, Icon('BookOpen', 25)),
              h('span', null, h('strong', null, props.typeLabel(category.type)), h('small', null, catalogReady && (!catalogPartial || category.count) ? category.count.toLocaleString(props.language) + (catalogPartial ? '+ ' : ' ') + t('عمل', 'works') : t('تصفح الأعمال', 'Browse works'))), Icon('ChevronLeft', 16));
          })))),
      dialog && h('div', {className: 'lf-explore-overlay', onClick: function (event) { if (event.target === event.currentTarget) close(); }, onKeyDown: trap},
        h('section', {className: 'lf-explore-dialog', ref: panel, role: 'dialog', 'aria-modal': true, 'aria-label': dialog.title},
          h('header', null, h('h2', {dir: 'auto', 'data-no-translate': dialog.kind === 'feedback' ? '' : undefined}, dialog.title),
            h('button', {className: 'lf-explore-icon', 'aria-label': t('إغلاق', 'Close'), onClick: close}, Icon('X'))),
          dialog.kind === 'preferences' ? preferencesBody() : dialog.kind === 'feedback' ?
            h('div', {className: 'lf-explore-feedback'}, [['more_like_this', t('المزيد مثل هذا', 'More like this'), 'Sparkles'], ['not_interested', t('غير مهتم', 'Not interested'), 'EyeOff']].map(function (action) {
              return h('button', {key: action[0], onClick: function () { props.onFeedback(dialog.work.id, action[0]); setRevision(function (n) { return n + 1; }); close(); }}, Icon(action[2]), action[1]);
            })) : h('div', {className: 'lf-explore-dialog-grid'}, dialog.items.map(item)))));
  }
  return {genreLabel: genreLabel, formatKey: formatKey, collections: COLLECTIONS, readingSnapshot: readingSnapshot, readingItems: readingItems, buildShelves: buildShelves, Explore: Explore};
});
