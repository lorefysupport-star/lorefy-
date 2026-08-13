"use strict";

importScripts(
  "lorefy-catalog-data.js?v=20260726-catalog-search-v1",
  "lorefy-catalog-identity.js?v=20260722-catalog-identity-security-v2"
);

// Larger, acknowledged batches reduce message overhead without doing catalog
// parsing on the UI thread.
var batchSize = 240;
var waitingForAck = null;
var stopped = false;
var started = false;

function sourceUrl(part, version) {
  var name = "lorefy-data-part" + String(part).padStart(2, "0") + ".js?v=" + encodeURIComponent(version || "");
  return new URL("../uploads/" + name, self.location.href).toString();
}

function waitForAck() {
  return new Promise(function (resolve) { waitingForAck = resolve; });
}

async function loadCatalog(parts, version) {
  try {
    var records = [];
    var aliases = {};
    for (var index = 0; index < parts.length && !stopped; index += 1) {
      var part = Number(parts[index]);
      var response = await fetch(sourceUrl(part, version), { cache: "no-store" });
      if (!response.ok) throw new Error("catalog part " + String(part) + " returned " + String(response.status));
      var source = await response.text();
      var partRecords = self.LorefyCatalogData.extractCatalogRecords(source);
      if (!partRecords.length) throw new Error("catalog part " + String(part) + " had no records");
      Array.prototype.push.apply(records, partRecords);
    }
    if (stopped) return;
    self.LorefyCatalogIdentity.organizeCatalog(records, { aliases: aliases });
    records = self.LorefyCatalogData.prepareCatalogRecords(records);
    for (var offset = 0; offset < records.length && !stopped; offset += batchSize) {
      self.postMessage({ type: "records", records: records.slice(offset, offset + batchSize) });
      await waitForAck();
    }
    if (!stopped) self.postMessage({ type: "complete", parts: parts, aliases: aliases });
  } catch (error) {
    self.postMessage({ type: "error", message: String(error && error.message || error) });
  }
}

self.addEventListener("message", function (event) {
  var message = event.data || {};
  if (message.type === "ack" && waitingForAck) {
    var resolve = waitingForAck;
    waitingForAck = null;
    resolve();
    return;
  }
  if (message.type === "stop") {
    stopped = true;
    if (waitingForAck) {
      var pending = waitingForAck;
      waitingForAck = null;
      pending();
    }
    return;
  }
  if (message.type === "load" && !started) {
    started = true;
    loadCatalog(Array.isArray(message.parts) ? message.parts : [], message.version || "");
  }
});
