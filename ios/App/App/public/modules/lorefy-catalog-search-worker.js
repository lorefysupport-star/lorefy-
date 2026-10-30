"use strict";

self.window = self;
importScripts(
  "lorefy-catalog-data.js?v=20261017-search-alias-v1-fast-search-v1-search-audit-v2",
  "lorefy-catalog-plan.js?v=20261019-search-authors-v1-search-audit-v2"
);

var indexPromise = null;
var latestInputRequest = null;

function loadIndex() {
  if (!indexPromise) {
    var url = new URL("../uploads/catalog-search-index.json", self.location.href);
    indexPromise = fetch(url).then(function (response) {
      if (!response.ok) throw new Error("Search index returned " + response.status);
      return response.json();
    }).then(function (index) {
      if (!index || index.schema !== 1 || !Array.isArray(index.records)) {
        throw new Error("Invalid catalog search index");
      }
      return index.records.map(function (row) {
        return {
          part: Number(row[0]),
          work: {
            id: row[1], title: row[2], ar: row[3], auth: row[4], type: row[5],
            altTitles: row[6], aliases: row[7], authorAliases: row[8]
          }
        };
      });
    }).catch(function (error) {
      indexPromise = null;
      throw error;
    });
  }
  return indexPromise;
}

self.addEventListener("message", function (event) {
  var request = event.data || {};
  if (request.type !== "search") return;
  if (request.channel === "input") latestInputRequest = request.requestId;
  loadIndex().then(function (records) {
    // While the first download is pending, only the latest typing job needs
    // a full scan. Independent author lookups retain their own results.
    if (request.channel === "input" && request.requestId !== latestInputRequest) {
      self.postMessage({type: "result", requestId: request.requestId, matches: [], suggestions: [], cancelled: true});
      return;
    }
    var result = self.LorefyCatalogPlan.searchIndexResult(
      records, String(request.query || ""), String(request.catalogType || ""), self.LorefyCatalogData, request.withSuggestions
    );
    self.postMessage({
      type: "result", requestId: request.requestId,
      matches: result.matches, suggestions: result.suggestions
    });
  }).catch(function (error) {
    self.postMessage({type: "error", requestId: request.requestId, message: String(error && error.message || error)});
  });
});
