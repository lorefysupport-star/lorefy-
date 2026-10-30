(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LorefyCatalogData = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function extractCatalogRecords(source) {
    var marker = "Array.prototype.push.apply(window.LorefyMangaData,";
    var start = String(source || "").indexOf(marker);
    if (start < 0) return [];
    var payload = String(source || "").slice(start + marker.length).trim();
    var match = payload.match(/^(\[[\s\S]*\])\s*\);\s*$/);
    if (!match) return [];
    try {
      var records = JSON.parse(match[1]);
      return Array.isArray(records) ? records : [];
    } catch (error) {
      return [];
    }
  }

  function normalizedSearchText(value) {
    return String(value == null ? "" : value).toLowerCase();
  }

  function queryText(value) {
    if (value == null || value === "") return "";
    var text = normalizedSearchText(value);
    // Most source titles/authors are ASCII. This is equivalent to the Unicode
    // path for that range and avoids five Unicode passes for every cold row.
    if (/^[\x00-\x7f]*$/.test(text)) return text.replace(/[^a-z0-9]+/g, ' ').trim();
    return text.normalize('NFKD')
      .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,'')
      .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي')
      .replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  }

  var searchIndex = new WeakMap();
  var authorNames = [
    ['نجيب محفوظ','محفوظ نجيب','Naguib Mahfouz','Najib Mahfuz','Naguib Mahfuz'],
    ['طه حسين','حسين طه','Taha Hussein','Taha Husayn'],
    ['غسان كنفاني','Ghassan Kanafani'],
    ['توفيق الحكيم','Tawfiq al Hakim','Tawfiq Hakim'],
    ['الطيب صالح','Tayeb Salih','Al Tayeb Salih'],
    ['أحمد خالد توفيق','Ahmed Khaled Tawfik','Ahmad Khalid Tawfiq'],
    ['جورج مارتن','George R R Martin','George Martin']
  ].map(function(group){return group.map(queryText);});
  var workNames = [
    ['Hunter x Hunter','هنتر','هنتر هنتر','القناص'],
    ['One Piece','ون بيس','وان بيس'],
    ['Berserk','بيرسيرك','برسيرك'],
    ['Attack on Titan','Shingeki no Kyojin','هجوم العمالقة'],
    ['Death Note','مذكرة الموت','ديث نوت'],
    ['Jujutsu Kaisen','جوجوتسو كايسن'],
    ['Demon Slayer','Kimetsu no Yaiba','قاتل الشياطين'],
    ['Solo Leveling','التطور بمفردي','سولو ليفلينج'],
    ['Omniscient Reader','Omniscient Reader\'s Viewpoint','القارئ العليم']
  ].map(function(group){return group.map(queryText);});
  function rawSearchField(value) {
    if (value && typeof value === "object") value = Object.values(value).join(" ");
    return String(value == null ? "" : value);
  }
  function aliasSearchContent(record) {
    if (!record.altTitles && !record.aliases && !record.authorAliases) return "";
    var content = "", count = 0;
    [record.altTitles, record.aliases, record.authorAliases].forEach(function (values) {
      if (values == null) return;
      if (!Array.isArray(values)) values = [values];
      for (var index = 0; index < values.length; index++) {
        if (count++) content += "\u0000";
        content += rawSearchField(values[index]);
      }
    });
    return content;
  }
  function aliasLookup(groups) {
    var lookup = new Map();
    groups.forEach(function (group) { group.forEach(function (name) { lookup.set(name, group); }); });
    return lookup;
  }
  var authorLookup = aliasLookup(authorNames), workLookup = aliasLookup(workNames);
  var lastQuery, lastNormalizedQuery, lastQueryTokens;
  function buildQueryIndex(record, aliasContent) {
    var fields = [record.title, record.ar, record.auth, record.author].map(function (value) { return queryText(rawSearchField(value)); });
    if (aliasContent) [].concat(record.altTitles || [], record.aliases || [], record.authorAliases || []).forEach(function (value) {
      fields.push(queryText(rawSearchField(value)));
    });
    var authorAliases = authorLookup.get(fields[2] || fields[3]);
    if (authorAliases) fields = fields.concat(authorAliases);
    var titleAliases = workLookup.get(fields[0]), arabicAliases = workLookup.get(fields[1]);
    if (titleAliases) fields = fields.concat(titleAliases);
    if (arabicAliases && arabicAliases !== titleAliases) fields = fields.concat(arabicAliases);
    return {text:fields.join(' '),fields:fields,
      title:record.title,ar:record.ar,auth:record.auth,author:record.author,
      aliasContent:aliasContent,
      objectContent:[record.title,record.ar,record.auth,record.author].some(function (value) { return value && typeof value === 'object'; })
        ? [record.title,record.ar,record.auth,record.author].map(rawSearchField).join('\u0000') : null};
  }
  function getCatalogQueryIndex(record) {
    if (!record || typeof record !== 'object') return null;
    var cached = record._catalogCompact && record._queryIndex || searchIndex.get(record);
    // Raw snapshots keep same-count/in-place alias edits observable. Avoid
    // rebuilding whole field arrays and signatures for every unchanged row.
    var aliases = aliasSearchContent(record);
    if (!cached || cached.title !== record.title || cached.ar !== record.ar ||
      cached.auth !== record.auth || cached.author !== record.author || cached.aliasContent !== aliases ||
      cached.objectContent != null && cached.objectContent !== [record.title,record.ar,record.auth,record.author].map(rawSearchField).join('\u0000')) {
      cached = buildQueryIndex(record, aliases);
      if (record._catalogCompact) record._queryIndex = cached;
      else searchIndex.set(record, cached);
    }
    return cached;
  }
  function matchesCatalogQuery(record, query) {
    if (!record || typeof record !== 'object' || !record.id) return false;
    if (query !== lastQuery) {
      lastQuery = query;
      lastNormalizedQuery = queryText(query);
      lastQueryTokens = lastNormalizedQuery.split(' ');
    }
    var text = lastNormalizedQuery || '';
    if (!text) return true;
    var cached = getCatalogQueryIndex(record);
    if (cached.text.indexOf(text) !== -1) return true;
    var tokens = lastQueryTokens;
    if (!tokens.every(function(token){ return cached.text.indexOf(token) !== -1; })) return false;
    // Keywords may span a title and its author; only match word prefixes,
    // not arbitrary fragments spread across unrelated fields.
    var words = cached.text.split(' ');
    return tokens.length > 1 && tokens.every(function(token){
      return words.some(function(word){
        return word.indexOf(token) === 0 || token.indexOf('ال') === 0 && word.indexOf('وال') === 0 && word.slice(1).indexOf(token) === 0;
      });
    });
  }

  function sourceSynopsis(record, language) {
    record = record || {};
    var arabic = language !== 'en';
    var values = arabic
      ? [record.synopsisAr,record.arSynopsis,record.sourceSynopsis,record.originalSynopsis,record.synopsisEn,record.enSynopsis,record.synopsis]
      : [record.synopsisEn,record.enSynopsis,record.sourceSynopsis,record.originalSynopsis,record.synopsis,record.synopsisAr];
    var candidates = values.map(function(value){
      return String(value || '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    }).filter(function(value){
      return value && !/^(?:curated .* entry|a cataloged .* imported|عمل مستورد من|«[^»]+» (?:عمل مصوّر|رواية|كتاب|مانجا|مانهوا))/i.test(value)
        && !/^تدور القصة حول «[^»]+»، (?:كتاب|رواية|مانجا|مانهوا|عمل مصور) من تأليف .*\. يمزج العمل بين /.test(value)
        && !/^(?:completed web novel listed on FreeWebNovel|عمل باللغة العربية ضمن .* في فهرس Open Library|عنوان عربي منتقى ضمن )/i.test(value)
        && !/(?:this (?:lorefy|catalog) entry includes|is available in the Lorefy .* catalog|Open Library subjects:)/i.test(value)
        && !/\.\s*متاح ضمن فهرس مكتبة جرير في تصنيف [^.]+\.$/.test(value);
    });
    var preferred = candidates.find(function(value){ return /[\u0600-\u06ff]/.test(value) === arabic; });
    return preferred || candidates[0] || (arabic ? 'الوصف غير متوفر من المصدر.' : 'No source synopsis available.');
  }

  function prepareCatalogRecords(records) {
    if (!Array.isArray(records)) return [];
    return records.map(function (record) {
      if (!record || typeof record !== "object") return record;
      record._tl = normalizedSearchText(record.title);
      record._al = normalizedSearchText(record.auth || record.author);
      if (typeof record.ar !== "string") record.ar = record.ar == null ? "" : String(record.ar);
      // The React runtime owns the richer derived fields, so force it to
      // rebuild them after a worker replaces the catalog.
      record._indexed = false;
      if (record._catalogCompact) {
        getCatalogQueryIndex(record);
      }
      return record;
    });
  }

  function prepareSearchIndexes(records) {
    (records || []).forEach(function(record){
      if(!record || !record.id)return;
      getCatalogQueryIndex(record);
    });
  }

  function sortRanked(records, score) {
    return records.map(function(record,index){
      var value = Number(score(record));
      return {record:record,index:index,score:Number.isFinite(value)?value:-Infinity};
    }).sort(function(a,b){ return b.score-a.score || a.index-b.index; })
      .map(function(entry){ return entry.record; });
  }

  function topRanked(records, score, limit) {
    limit = Math.max(0, Math.floor(Number(limit) || 0));
    if (!limit) return [];
    var heap = [];
    function worse(a, b) { return a.score < b.score || a.score === b.score && a.index > b.index; }
    function down(index) {
      while (index * 2 + 1 < heap.length) {
        var child = index * 2 + 1;
        if (child + 1 < heap.length && worse(heap[child + 1], heap[child])) child++;
        if (!worse(heap[child], heap[index])) break;
        var temp = heap[index]; heap[index] = heap[child]; heap[child] = temp;
        index = child;
      }
    }
    for (var i = 0; i < records.length; i++) {
      var value = Number(score(records[i], i));
      var entry = { record: records[i], score: Number.isFinite(value) ? value : -Infinity, index: i };
      if (heap.length < limit) {
        heap.push(entry);
        var at = heap.length - 1;
        while (at > 0) {
          var parent = Math.floor((at - 1) / 2);
          if (!worse(heap[at], heap[parent])) break;
          var previous = heap[parent]; heap[parent] = heap[at]; heap[at] = previous;
          at = parent;
        }
      } else if (worse(heap[0], entry)) {
        heap[0] = entry; down(0);
      }
    }
    return heap.sort(function(a,b){ return b.score-a.score || a.index-b.index; })
      .map(function(entry){ return entry.record; });
  }

  function workLanguage(record) {
    record = record || {};
    var language = String(record.language || record.originalLanguage || '').toLowerCase().split(/[-_]/)[0];
    var aliases = {ara:'ar',eng:'en',jpn:'ja',kor:'ko',chi:'zh',zho:'zh'};
    if (language) return aliases[language] || language;
    // A translated display alias does not establish an available reading language.
    return /[\u0621-\u064a]/.test(String(record.title || '')) ? 'ar' : '';
  }

  function languageAffinity(record, uiLanguage, readingLanguages) {
    var language = workLanguage(record);
    if (!language) return 0;
    var history = readingLanguages || {};
    var total = Object.values(history).reduce(function(sum, weight) { return sum + Math.max(0, Number(weight) || 0); }, 0);
    if (total > 0) return Math.max(0, Number(history[language]) || 0) / total * 100;
    return language === uiLanguage ? 60 : 0;
  }

  return {
    extractCatalogRecords: extractCatalogRecords,
    prepareCatalogRecords: prepareCatalogRecords,
    prepareSearchIndexes:prepareSearchIndexes,
    topRanked: topRanked,
    sortRanked: sortRanked,
    matchesCatalogQuery: matchesCatalogQuery,
    normalizeQuery: queryText,
    getCatalogQueryIndex: getCatalogQueryIndex,
    sourceSynopsis: sourceSynopsis,
    workLanguage: workLanguage,
    languageAffinity: languageAffinity
  };
});
