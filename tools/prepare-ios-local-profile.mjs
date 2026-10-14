// Run after prepare-ios-web.mjs, before capacitor copy. Final builds use normal prepare.
import fs from 'node:fs';
fs.copyFileSync(new URL('./lorefy-performance-local.js',import.meta.url),new URL('../ios-web/monitoring/lorefy-performance-local.js',import.meta.url));
const entry=new URL('../ios-web/index.html',import.meta.url);
let html=fs.readFileSync(entry,'utf8');if(!html.includes('monitoring/lorefy-performance-local.js'))html=html.replace('<head>','<head>\n<script src="monitoring/lorefy-performance-local.js"></script>');fs.writeFileSync(entry,html);
console.log('Prepared local native timing instrumentation; canonical index unchanged.');
