(function (root) {
  'use strict';
  var CACHE_KEY = 'lorefy.workRelations.v1';
  var KINDS = {
    PREQUEL: ['الجزء السابق', 'Prequel'], SEQUEL: ['الجزء التالي', 'Sequel'],
    PARENT: ['العمل الأصلي', 'Parent work'], SOURCE: ['المصدر الأصلي', 'Source material'],
    SIDE_STORY: ['قصة جانبية', 'Side story'], SPIN_OFF: ['عمل مشتق', 'Spin-off'],
    ALTERNATIVE: ['نسخة بديلة', 'Alternative version'], ADAPTATION: ['اقتباس', 'Adaptation'],
    SUMMARY: ['ملخص', 'Summary'], COMPILATION: ['مجموعة', 'Compilation'],
    CONTAINS: ['يتضمن هذا العمل', 'Contains'], CHARACTER: ['شخصيات مشتركة', 'Shared characters'],
    SAME_UNIVERSE: ['العالم نفسه', 'Same universe'], OTHER: ['عمل مرتبط', 'Related work']
  };
  var QUERY = 'query LorefyRelations($id:Int,$idMal:Int){Media(id:$id,idMal:$idMal,type:MANGA){id idMal relations{pageInfo{hasNextPage} edges{relationType node{id idMal type format countryOfOrigin isAdult title{english romaji native} coverImage{large} status chapters volumes averageScore popularity genres startDate{year} staff(perPage:10){edges{role node{name{full}}}} tags{name}}}}}}';
  function positive(value) { var n = Number(value); return Number.isSafeInteger(n) && n > 0 ? n : null; }
  function identity(work) {
    if (!work || /anime/i.test(String(work.type || ''))) return null;
    var id = String(work.id || ''), match;
    if (/^mal-anime-/.test(id)) return null;
    var ani = positive(work.anilistId);
    if (!ani && (match = /^(?:api-)?anilist-(\d+)(?:-|$)/.exec(id))) ani = positive(match[1]);
    if (ani) return { id: ani, key: 'anilist:' + ani };
    var mal = positive(work.malId);
    if (!mal && (match = /^mal-(?:manga|novel|manhwa|manhua)-(\d+)(?:-|$)/.exec(id))) mal = positive(match[1]);
    return mal ? { idMal: mal, key: 'mal:' + mal } : null;
  }
  function label(kind, language) { return (KINDS[kind] || KINDS.OTHER)[language === 'en' ? 1 : 0]; }
  function title(node) {
    var t = node && node.title || {};
    return [t.english, t.romaji].find(function (v) { return typeof v === 'string' && v.trim(); }) || '';
  }
  function toWork(node) {
    if (!node || !positive(node.id) || !title(node)) return null;
    var name = title(node).trim(), type = node.format === 'NOVEL'
      ? node.countryOfOrigin === 'JP' ? 'لايت نوفل' : 'رواية'
      : node.countryOfOrigin === 'KR' ? 'مانهوا' : node.countryOfOrigin === 'CN' ? 'مانهوا صيني' : 'مانجا';
    var score = Number(node.averageScore) || 0;
    var author = (node.staff && node.staff.edges || []).find(function (edge) { return /^(?:Story|Story & Art|Author|Writer|Writing)$/.test(edge.role || '') && edge.node && edge.node.name && edge.node.name.full; });
    return {
      id: 'api-anilist-' + node.id + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      anilistId: node.id, malId: positive(node.idMal), title: name, ar: name, type: type,
      auth: author ? author.node.name.full : '',
      yr: node.startDate && node.startDate.year || 0,
      sourceCoverUrl: /^https:\/\//.test(node.coverImage && node.coverImage.large || '') ? node.coverImage.large : '',
      coverMode: 'external', cover: '', r: score > 0 ? Math.min(5, score / 20) : 0,
      rSrc: score > 0 ? 'AniList' : '', ch: Number(node.chapters) || 0, vol: Number(node.volumes) || 0,
      st: node.status === 'FINISHED' ? 'مكتملة' : node.status === 'RELEASING' ? 'مستمرة' : 'مستوردة',
      synopsis: '', genres: node.genres || [], tags: (node.tags || []).map(function (t) { return t.name; }),
      isAdult: node.isAdult, isAiGenerated: node.isAiGenerated === true,
      pop: Number(node.popularity) || 0, related: [], sc: {}, pl: 'AniList',
      _apiSource: 'AniList', _apiSourceId: String(node.id), _apiDynamic: true
    };
  }
  function safe(work, policy) {
    return work && work.isAdult === false && !(policy &&
      (policy.isExcludedWork(work) || policy.isExplicitWork(work) || policy.isAiGeneratedWork(work)));
  }
  function parse(media, source, policy) {
    if (!media || !source || (source.id && media.id !== source.id) || (source.idMal && media.idMal !== source.idMal)) throw new Error('Relation source identity mismatch');
    if (!media.relations || !Array.isArray(media.relations.edges)) throw new Error('Invalid relation response');
    var seen = new Set(), items = [];
    media.relations.edges.forEach(function (edge) {
      var n = edge && edge.node, w = toWork(n), key = edge && edge.relationType + ':' + (n && n.id);
      if (!n || n.type !== 'MANGA' || n.id === media.id || !KINDS[edge.relationType] || !safe(w, policy) || seen.has(key)) return;
      seen.add(key); items.push({ kind: edge.relationType, node: n });
    });
    var order = Object.keys(KINDS);
    items.sort(function (a, b) { return order.indexOf(a.kind) - order.indexOf(b.kind); });
    return { status: 'ready', sourceId: media.id, sourceUrl: 'https://anilist.co/manga/' + media.id,
      items: items.slice(0, 120), partial: items.length > 120 || !!(media.relations.pageInfo && media.relations.pageInfo.hasNextPage) };
  }
  function resolve(node, catalog) {
    for (var i = 0; i < catalog.length; i++) {
      var w = catalog[i], key = identity(w);
      if (key && ((key.id && key.id === node.id) || (key.idMal && key.idMal === positive(node.idMal)))) return w;
      // Records with both IDs prefer AniList for requests, but MAL remains an exact lookup key.
      if (key && positive(w && w.malId) === positive(node.idMal) && positive(node.idMal)) return w;
    }
    return null;
  }
  function creditKey(name) { return String(name || '').toLowerCase().replace(/[.,]/g, ' ').trim().split(/\s+/).sort().join(' '); }
  function withVerifiedCredit(work, node) {
    var id = identity(work), authored = toWork(node);
    if (!id || !authored || !authored.auth || id.id && id.id !== node.id || id.idMal && id.idMal !== node.idMal) return work;
    var current = creditKey(work.auth);
    if (current === creditKey(authored.auth)) return work;
    var otherRole = (node.staff && node.staff.edges || []).some(function (edge) {
      return /^(?:Original Creator|Illustration|Art)$/.test(edge.role || '') && edge.node && edge.node.name && creditKey(edge.node.name.full) === current;
    });
    if (current && !otherRole) return work;
    return Object.assign({}, work, { auth: authored.auth, _authorCreditSource: 'AniList staff role' });
  }
  function createClient(options) {
    options = options || {};
    var fetcher = options.fetch || root.fetch.bind(root), now = options.now || Date.now;
    var storage = options.storage, policy = options.policy || root.LorefyCatalogPolicy;
    var ttl = options.ttlMs == null ? 86400000 : options.ttlMs;
    var cache = new Map(), pending = new Map(), opened = new Map();
    try {
      var saved = JSON.parse(storage && storage.getItem(CACHE_KEY) || 'null');
      (saved && saved.schema === 2 && saved.entries || []).slice(-40).forEach(function (row) {
        if (row && typeof row.key === 'string' && Number.isFinite(row.at) && row.media) cache.set(row.key, row);
      });
      (saved && saved.opened || []).slice(-500).forEach(function (node) {
        if (node && node.type === 'MANGA' && safe(toWork(node), policy)) opened.set(node.id, node);
      });
    } catch (e) {}
    function persist() {
      try { if (storage) storage.setItem(CACHE_KEY, JSON.stringify({ schema: 2, entries: Array.from(cache.values()), opened: Array.from(opened.values()) })); } catch (e) {}
    }
    function rememberOpened(node) {
      if (!node || node.type !== 'MANGA' || !safe(toWork(node), policy)) return;
      opened.delete(node.id); opened.set(node.id, node);
      while (opened.size > 500) opened.delete(opened.keys().next().value);
      persist();
    }
    function remember(key, media) {
      cache.delete(key); cache.set(key, { key: key, at: now(), media: media });
      while (cache.size > 40) cache.delete(cache.keys().next().value);
      persist();
    }
    function load(work, refresh) {
      var source = identity(work);
      if (!source) return Promise.resolve({ status: 'unsupported', items: [] });
      var saved = cache.get(source.key);
      if (!refresh && saved && now() - saved.at >= 0 && now() - saved.at < ttl) {
        try { return Promise.resolve(parse(saved.media, source, policy)); } catch (e) { cache.delete(source.key); }
      }
      if (pending.has(source.key)) return pending.get(source.key);
      var controller = new AbortController(), timer;
      var deadline = new Promise(function (_, reject) {
        timer = setTimeout(function () { controller.abort(); reject(new Error('Relation request timeout')); }, options.timeoutMs || 10000);
      });
      var url = options.url || (root.LorefyDataProxy ? root.LorefyDataProxy.catalogUrl('anilist', 'https://graphql.anilist.co') : 'https://graphql.anilist.co');
      var request = Promise.resolve().then(function () {
        var query = QUERY.replace('($id:Int,$idMal:Int)', source.id ? '($id:Int!)' : '($idMal:Int!)')
          .replace('id:$id,idMal:$idMal', source.id ? 'id:$id' : 'idMal:$idMal');
        return fetcher(url, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ query: query, variables: source.id ? { id: source.id } : { idMal: source.idMal } }) });
      }).then(function (response) {
        if (!response.ok) throw new Error('Relation request failed (' + response.status + ')');
        return response.json();
      }).then(function (data) {
        if (data.errors && data.errors.length) throw new Error(data.errors[0].message || 'Relation request failed');
        var m = data.data && data.data.Media;
        var result = parse(m, source, policy);
        return { result: result, media: { id: m.id, idMal: m.idMal, relations: { pageInfo: { hasNextPage: result.partial }, edges: result.items.map(function (item) { return { relationType: item.kind, node: item.node }; }) } } };
      });
      // Commit only the winning response; a fetch implementation may ignore abort.
      var task = Promise.race([request, deadline]).then(function (value) {
        remember(source.key, value.media); return value.result;
      }).finally(function () { clearTimeout(timer); pending.delete(source.key); });
      pending.set(source.key, task); return task;
    }
    return { load: load, rememberOpened: rememberOpened, openedNodes: function () { return Array.from(opened.values()); }, openedWorks: function () { return Array.from(opened.values()).map(toWork).filter(function (w) { return safe(w, policy); }); } };
  }
  var client;
  function browserClient() {
    if (!client) { var storage; try { storage = root.localStorage; } catch (e) {} client = createClient({ storage: storage }); }
    return client;
  }
  function hydrateOpened() {
    var nodes = browserClient().openedNodes();
    if (!nodes.length) return;
    var catalog = root.LorefyMangaData || (root.LorefyMangaData = []), known = new Map();
    catalog.forEach(function (w) { var id = identity(w); if (id) known.set(id.key, w); if (id && positive(w.malId)) known.set('mal:' + w.malId, w); });
    var added = false;
    nodes.forEach(function (node) {
      var w = toWork(node), existing = known.get('anilist:' + w.anilistId) || w.malId && known.get('mal:' + w.malId);
      if (existing) {
        var corrected = withVerifiedCredit(existing, node);
        if (corrected !== existing) { existing.auth = corrected.auth; existing._authorCreditSource = corrected._authorCreditSource; existing._indexed = false; existing._al = existing.auth.toLowerCase(); added = true; }
        return;
      }
      catalog.push(w); known.set('anilist:' + w.anilistId, w); if (w.malId) known.set('mal:' + w.malId, w); added = true;
    });
    if (added && root.__lorefyIngest) root.__lorefyIngest();
  }
  function Section(props) {
    var React = root.React, h = React.createElement, lang = props.language === 'en' ? 'en' : 'ar';
    var source = identity(props.work), key = source && source.key;
    var state = React.useState({ key: key, status: 'loading', items: [] }), result = state[0], set = state[1];
    var retry = React.useState(0), attempt = retry[0], setAttempt = retry[1];
    React.useEffect(function () {
      if (!key) return;
      var current = true;
      set({ key: key, status: 'loading', items: [] });
      browserClient().load(props.work, attempt > 0).then(function (value) { if (current) set(Object.assign({ key: key }, value)); })
        .catch(function () { if (current) set({ key: key, status: 'error', items: [] }); });
      return function () { current = false; };
    }, [key, attempt]);
    if (!key || (result.key === key && result.status === 'ready' && !result.items.length)) return null;
    var loading = result.key !== key || result.status === 'loading', error = result.status === 'error';
    function open(item) {
      var catalog = root.LorefyMangaData || [], w = resolve(item.node, catalog);
      if (w && root.LorefyCatalogPolicy && !safe(Object.assign({}, w, { isAdult: item.node.isAdult }), root.LorefyCatalogPolicy)) return;
      if (!w) {
        w = toWork(item.node);
        if (!safe(w, root.LorefyCatalogPolicy)) return;
        if (root.LorefyCatalogUpdater) root.LorefyCatalogUpdater.applyDelta({ schema: 1, version: 'relation-' + item.node.id, upserts: [w] }, { cache: false, canonicalize: false });
        else { catalog.push(w); if (root.__lorefyIngest) root.__lorefyIngest(); }
        browserClient().rememberOpened(item.node);
      }
      var credited = withVerifiedCredit(w, item.node);
      if (credited !== w) {
        browserClient().rememberOpened(item.node);
        if (root.LorefyCatalogUpdater) root.LorefyCatalogUpdater.applyDelta({ schema: 1, version: 'credit-' + item.node.id, patches: [{ id: w.id, auth: credited.auth, _authorCreditSource: credited._authorCreditSource }] }, { cache: false, canonicalize: false });
        w = credited;
      }
      try { root.sessionStorage.setItem('lorefy.catalog.openWork.v1', JSON.stringify(w)); } catch (e) {}
      props.onOpen(w);
    }
    return h('section', { className: 'lf-work-relations', dir: lang === 'en' ? 'ltr' : 'rtl', 'aria-label': lang === 'en' ? 'Series and related works' : 'الأجزاء والأعمال المرتبطة', 'aria-busy': loading },
      h('header', null, h('h2', null, lang === 'en' ? 'Series & related works' : 'الأجزاء والأعمال المرتبطة'),
        !loading && !error && h('a', { href: result.sourceUrl, target: '_blank', rel: 'noopener noreferrer', 'aria-label': lang === 'en' ? 'Relationship source: AniList' : 'مصدر العلاقات: AniList' }, 'AniList')),
      loading ? h('p', { className: 'lf-work-relations-status', role: 'status' }, lang === 'en' ? 'Loading related works…' : 'جارٍ تحميل الأعمال المرتبطة…')
        : error ? h('div', { className: 'lf-work-relations-status', role: 'status' },
          h('span', null, lang === 'en' ? 'Related works could not be loaded.' : 'تعذر تحميل الأعمال المرتبطة.'),
          h('button', { type: 'button', onClick: function () { setAttempt(function (n) { return n + 1; }); } }, lang === 'en' ? 'Try again' : 'إعادة المحاولة'))
        : h('div', { className: 'lf-work-relations-list' }, result.items.map(function (item) {
          return h('button', { type: 'button', key: item.kind + ':' + item.node.id, className: 'lf-work-relation', onClick: function () { open(item); } },
            item.node.coverImage && item.node.coverImage.large ? h('img', { src: item.node.coverImage.large, alt: '', loading: 'lazy', decoding: 'async' }) : h('span', { className: 'lf-work-relation-cover', 'aria-hidden': true }),
            h('span', { className: 'lf-work-relation-copy' }, h('small', null, label(item.kind, lang)), h('strong', { dir: 'auto', 'data-no-translate': '1' }, title(item.node)),
              item.node.startDate && item.node.startDate.year ? h('span', { className: 'lf-work-relation-year' }, item.node.startDate.year) : null),
            props.Chevron ? h(props.Chevron, { size: 18, 'aria-hidden': true }) : null);
        })),
      !loading && result.partial ? h('p', { className: 'lf-work-relations-status' }, lang === 'en' ? 'Some relationships are unavailable.' : 'بعض العلاقات غير متاحة.') : null);
  }
  var api = { identity: identity, label: label, parse: parse, resolve: resolve, toWork: toWork, withVerifiedCredit: withVerifiedCredit, createClient: createClient, Section: Section };
  root.LorefyWorkRelations = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root.document) { hydrateOpened(); root.addEventListener('lorefy:catalog-ready', hydrateOpened); }
})(typeof window !== 'undefined' ? window : globalThis);
