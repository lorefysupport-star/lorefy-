import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
const version='20261029-library-media-v1';
const assets=['styles/lorefy-cover-media.css','modules/lorefy-cover-media.js','modules/lorefy-library-media.js','modules/lorefy-library-view.js','modules/lorefy-public-profile.js','modules/lorefy-reader-layout.js','modules/lorefy-growth-features.js','uploads/files/lorefy-app.js'];
for(const file of ['index.html','sw.js']){
 let source=readFileSync(file,'utf8');
 if(!source.includes('modules/lorefy-library-media.js')){
  const line=file==='index.html'?`  <script defer src="modules/lorefy-library-media.js?v=${version}"></script>\n`:`  './modules/lorefy-library-media.js?v=${version}',\n`;
  const anchor=source.match(file==='index.html'?/^.*<script defer src="modules\/lorefy-cover-media\.js.*$/m:/^.*'\.\/modules\/lorefy-cover-media\.js.*$/m)?.[0];
  if(!anchor)throw new Error('Missing media script anchor in '+file);
  source=source.replace(anchor,anchor+'\n'+line.trimEnd());
 }
 for(const asset of assets){
  const escaped=asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  source=source.replace(new RegExp('('+escaped+'\\?v=)[^"\'\\s]+','g'),'$1'+version);
 }
 if(file==='sw.js')source=source.replace(/const CACHE = '[^']+';/,"const CACHE = 'lorefy-v625-library-media';");
 writeFileSync(file,source);
}
for(const file of ['index.html','sw.js',...assets])for(const mirror of ['ios-web','ios/App/App/public'])copyFileSync(file,mirror+'/'+file);
