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
    return normalizedSearchText(value).normalize('NFKD')
      .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,'')
      .replace(/[أإآ]/g,'ا').replace(/ى/g,'ي')
      .replace(/[^\p{L}\p{N}]+/gu,' ')
      .replace(/\s+/g,' ').trim();
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
    return [].concat(record.altTitles || [], record.aliases || [], record.authorAliases || []).map(rawSearchField).join("\u0000");
  }
  var lastQuery, lastNormalizedQuery, lastQueryTokens;
  function buildQueryIndex(record) {
    var aliases = [].concat(record.altTitles || [], record.aliases || [], record.authorAliases || []);
    var signature = [record.title,record.ar,record.auth,record.author].concat(aliases).map(function(value){
      if (value && typeof value === 'object') value = Object.values(value).join(' ');
      return String(value == null ? '' : value);
    }).join('\u0000');
    var fields = signature.split('\u0000').map(queryText);
    var author = queryText(record.auth || record.author);
    authorNames.forEach(function(group){
      if (group.indexOf(author) !== -1) fields = fields.concat(group);
    });
    workNames.forEach(function(group){
      if (group.indexOf(queryText(record.title)) !== -1 || group.indexOf(queryText(record.ar)) !== -1) fields=fields.concat(group);
    });
    return {signature:signature,text:fields.join(' '),fields:fields,
      title:record.title,ar:record.ar,auth:record.auth,author:record.author,
      aliasCount:aliases.length,aliasContent:aliases.map(rawSearchField).join("\u0000")};
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
    var prepared = record._catalogCompact && record._queryIndex;
    var cached;
    if (prepared && prepared.title === record.title && prepared.ar === record.ar &&
      prepared.auth === record.auth && prepared.author === record.author &&
      prepared.aliasCount === (record.altTitles || []).length + (record.aliases || []).length + (record.authorAliases || []).length &&
      prepared.aliasContent === aliasSearchContent(record)) {
      cached = prepared;
    } else {
      cached = searchIndex.get(record);
      // Check raw field content first; normalization is needed only after a change.
      var signature = [record.title,record.ar,record.auth,record.author].concat(record.altTitles || [],record.aliases || [],record.authorAliases || []).map(function(value){
        if(value && typeof value === 'object')value=Object.values(value).join(' ');
        return String(value == null ? '' : value);
      }).join('\u0000');
      if (!cached || cached.signature !== signature) {
        cached = buildQueryIndex(record);
        searchIndex.set(record,cached);
      }
      if (record._catalogCompact) {
        record._queryIndex = cached;
        delete cached.signature;
      }
    }
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
        record._queryIndex = buildQueryIndex(record);
        delete record._queryIndex.signature;
      }
      return record;
    });
  }

  function prepareSearchIndexes(records) {
    (records || []).forEach(function(record){
      if(!record || !record.id)return;
      if(record._catalogCompact && !record._queryIndex){record._queryIndex=buildQueryIndex(record);delete record._queryIndex.signature;}
      else if(!record._catalogCompact && !searchIndex.has(record))searchIndex.set(record,buildQueryIndex(record));
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
    sourceSynopsis: sourceSynopsis,
    workLanguage: workLanguage,
    languageAffinity: languageAffinity
  };
});
