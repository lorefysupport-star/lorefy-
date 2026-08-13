"use strict";

// The shipped React bundle is intentionally a single generated file. Keep the
// source change deterministic and fail loudly if the expected runtime shape
// changes, instead of applying a broad text mutation.
const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "..", "uploads", "files", "lorefy-app.js");
const source = fs.readFileSync(file, "utf8");
const original = "};;window.__lorefyIngest=function(){let e=0;for(const i of MANGA)i._indexed||(prepWork(i),MANGA_BY_ID.set(String(i.id),i),e++);try{window.LorefyEnrich&&(window.LorefyEnrich.applyCachedAll(MANGA),window.LorefyEnrich.enrichVisible&&window.LorefyEnrich.enrichVisible(MANGA))}catch{}if(e){try{HOME_ROWS_CACHE.clear()}catch{}try{SEARCH_CACHE.key=null}catch{}typeof window.__lorefyRefresh==\"function\"&&window.__lorefyRefresh()}return e};const COVER_PICKER_BATCH=18,PROFILE_LIBRARY_BATCH=60,V2_SEED={lib:{},prog:{}};";
const replacement = `};;let __lorefyIngestRunning=!1,__lorefyIngestQueued=!1,__lorefyIngestRerun=!1;
const __lorefyIdle=e=>{typeof window.requestIdleCallback=="function"?window.requestIdleCallback(e,{timeout:180}):setTimeout(()=>e({didTimeout:!0,timeRemaining:()=>0}),0)};
function __lorefyRunIngest(){let e=0,i=0;__lorefyIngestRunning=!0;function l(u){const d=Date.now();let h=0;for(;i<MANGA.length&&h<260&&Date.now()-d<9&&(!u||u.didTimeout||typeof u.timeRemaining!="function"||u.timeRemaining()>2);){const g=MANGA[i++];g&&g._indexed||(prepWork(g),MANGA_BY_ID.set(String(g.id),g),e++),h++}if(i<MANGA.length){__lorefyIdle(l);return}try{window.LorefyEnrich&&(window.LorefyEnrich.applyCachedAll(MANGA),window.LorefyEnrich.enrichVisible&&window.LorefyEnrich.enrichVisible(MANGA))}catch{}e&&(HOME_ROWS_CACHE.clear(),SEARCH_CACHE.key=null);__lorefyIngestRunning=!1;e&&typeof window.__lorefyRefresh=="function"&&window.__lorefyRefresh();if(__lorefyIngestRerun){__lorefyIngestRerun=!1;window.__lorefyIngest()}}__lorefyIdle(l)}
window.__lorefyIngest=function(){if(__lorefyIngestRunning||__lorefyIngestQueued){__lorefyIngestRerun=!0;return 0}__lorefyIngestQueued=!0;__lorefyIdle(()=>{__lorefyIngestQueued=!1;__lorefyRunIngest()});return 0};window.__lorefyIngestAsync=!0;const COVER_PICKER_BATCH=18,PROFILE_LIBRARY_BATCH=60,V2_SEED={lib:{},prog:{}};`;

if (!source.includes(original)) {
  throw new Error("Lorefy app ingest implementation changed; refusing to patch an unknown bundle");
}
if (source.includes("__lorefyIngestRunning")) {
  process.stdout.write("Lorefy cooperative ingest already installed.\n");
  process.exit(0);
}

fs.writeFileSync(file, source.replace(original, replacement), "utf8");
process.stdout.write("Installed cooperative Lorefy catalog ingest.\n");
