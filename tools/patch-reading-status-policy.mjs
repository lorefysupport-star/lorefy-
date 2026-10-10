import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'uploads/files/lorefy-app.js');
let source=fs.readFileSync(file,'utf8');
if (!source.includes('STATUS_DROPPED=')) {
  const replacements=[
    ['STATUS_OPTIONS=[STATUS_READING,STATUS_DONE,STATUS_WISHLIST,STATUS_PAUSED]',
      'STATUS_DROPPED="توقف نهائي",STATUS_OPTIONS=[STATUS_READING,STATUS_DONE,STATUS_WISHLIST,STATUS_PAUSED,STATUS_DROPPED]'],
    ['[STATUS_PAUSED]:4}', '[STATUS_PAUSED]:4,[STATUS_DROPPED]:0}'],
    ['u===STATUS_PAUSED?-34:12','u===STATUS_PAUSED?-34:u===STATUS_DROPPED?-70:12'],
    ['g=t.filter(o=>o.st===STATUS_PAUSED).length,r=', 'g=t.filter(o=>o.st===STATUS_PAUSED).length,dropCount=t.filter(o=>o.st===STATUS_DROPPED).length,r='],
    ['[STATUS_PAUSED,"\\u062A\\u0648\\u0642\\u0641",g]', '[STATUS_PAUSED,"متوقف مؤقتًا",g],[STATUS_DROPPED,"توقفت نهائيًا",dropCount]'],
    ['{k:STATUS_PAUSED,l:"\\u062A\\u0648\\u0642\\u0651\\u0641\\u062A \\u0639\\u0646\\u0647"}', '{k:STATUS_PAUSED,l:"متوقف مؤقتًا"},{k:STATUS_DROPPED,l:"توقفت نهائيًا"}'],
    ['{k:STATUS_PAUSED,c:"#9AA0A6"}]', '{k:STATUS_PAUSED,c:"#9AA0A6"},{k:STATUS_DROPPED,c:"#9AA0A6"}]'],
    ['borderBottom:h<3?', 'borderBottom:h<t.length-1?'],
    ['fontWeight:ie===d.k?700:400}},d.k)', 'fontWeight:ie===d.k?700:400}},d.k===STATUS_PAUSED?"متوقف مؤقتًا":d.k===STATUS_DROPPED?"توقفت نهائيًا":d.k)']
  ];
  for (const [from,to] of replacements) {
    if (!source.includes(from)) throw new Error('Reading status patch anchor missing: '+from);
    source=source.replace(from,to);
  }
  fs.writeFileSync(file,source);
}
console.log('Reading status policy applied.');
