const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'uploads', 'files', 'lorefy-app.js');
let source = fs.readFileSync(file, 'utf8');

const replacements = [
  [
    String.raw`sourceCoverOf=e=>{const i=typeof window<"u"&&window.LorefyCoverAPI;if(i&&i.primary)return i.primary(e);const l=e&&(e.cover||e.sourceCoverUrl||e.sourceCover||e.coverImage);return typeof l=="string"&&/^https?:\/\//i.test(l)?l.replace(/^http:\/\//i,"https://"):""},coversFor=`,
    String.raw`rawSourceCoverOf=e=>{const i=typeof window<"u"&&window.LorefyCoverAPI;if(i&&i.primary)return i.primary(e);const l=e&&(e.cover||e.sourceCoverUrl||e.sourceCover||e.coverImage);return typeof l=="string"&&/^https?:\/\//i.test(l)?l.replace(/^http:\/\//i,"https://"):""},sourceCoverOf=e=>{const i=typeof window<"u"&&window.LorefyCoverAPI,l=rawSourceCoverOf(e);return i&&i.displayUrl?i.displayUrl(l):l},coversFor=`
  ],
  [
    'I=t=>t&&(Tt[t.id]||Eo[t.id]||sourceCoverOf(t)||legalCoverOf(t)),je=',
    'I=t=>{if(!t)return"";const r=Tt[t.id];if(r)return r;const o=Eo[t.id],n=typeof window<"u"&&window.LorefyCoverAPI;return o?n&&n.displayUrl?n.displayUrl(o):o:sourceCoverOf(t)||legalCoverOf(t)},je='
  ],
  [
    'return[sourceCoverOf(r),...n].filter(Boolean).forEach(y=>{',
    'return[(t.primary?t.primary(r):rawSourceCoverOf(r)),...n].filter(Boolean).forEach(y=>{'
  ],
  [
    ',img:h}))}))}).catch(()=>{}).finally(()=>{o||No(!1)})',
    ',img:t.displayUrl?t.displayUrl(h):h}))}))}).catch(()=>{}).finally(()=>{o||No(!1)})'
  ],
  [
    'src:s.img,alt:"",style:{width:"100%",height:"100%",objectFit:"cover"},onError:R})',
    'src:s.img,alt:"","data-fallback":legalCoverOf(t),style:{width:"100%",height:"100%",objectFit:"cover"},onError:R})'
  ]
];

for (const [before, after] of replacements) {
  const matches = source.split(before).length - 1;
  if (matches !== 1) {
    throw new Error(`Expected one match for replacement, found ${matches}: ${before.slice(0, 96)}`);
  }
  source = source.replace(before, after);
}

fs.writeFileSync(file, source);
console.log(`Patched ${path.relative(process.cwd(), file)} with ${replacements.length} cover rendering changes.`);
