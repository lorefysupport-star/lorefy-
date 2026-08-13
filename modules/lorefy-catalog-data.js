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
      return record;
    });
  }

  return {
    extractCatalogRecords: extractCatalogRecords,
    prepareCatalogRecords: prepareCatalogRecords
  };
});
