'use strict';
// Derive the small bootstrap manifest without rebuilding catalog records.
function catalogSummary(manifest) {
  const summary = {};
  for (const key of Object.keys(manifest)) if (key !== 'workParts') summary[key] = manifest[key];
  return summary;
}
function summarySource(manifest) {
  return '/* Generated from the catalog manifest; work IDs load on demand. */\nwindow.LorefyCatalogManifest=' + JSON.stringify(catalogSummary(manifest)) + ';\n';
}
module.exports = { catalogSummary, summarySource };
