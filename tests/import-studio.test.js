const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {harness,flush,deferred}=require('./helpers/import-dialog.js');

test('English import has localized first-render chrome and visible labels, not placeholders alone',()=>{
 const h=harness();assert.equal(h.page.attrs['aria-label'],'Import your library');assert.doesNotMatch(h.page.textContent,/[\u0600-\u06ff]/);
 for(const service of ['AniList','Kitsu']){const input=h.input(service);assert.equal(input.parentNode.tag,'label');assert.ok(input.parentNode.textContent.includes(service));}
 assert.equal(h.find('lf-im-paste').parentNode.tag,'label');
});

for(const lang of ['ar','en'])test(`import reading-state controls expose a single pressed selection in ${lang}`,()=>{
 const h=harness(lang),chips=h.all('lf-im-chip');assert.equal(chips[0].attrs['aria-pressed'],'true');assert.equal(chips.filter(n=>n.attrs['aria-pressed']==='true').length,1);
 chips[2].click();assert.equal(chips[2].attrs['aria-pressed'],'true');assert.equal(chips.filter(n=>n.attrs['aria-pressed']==='true').length,1);assert.equal(h.find('lf-im-chips').attrs.role,'group');
});

for(const service of ['AniList','Kitsu'])test(`${service} empty username has an inline announced error and starts no request`,()=>{
 const h=harness();h.start(service,'  ');const input=h.input(service);assert.equal(h.requests.length,0);assert.equal(input.attrs['aria-invalid'],'true');assert.equal(h.doc.activeElement,input);
 const error=input.parentNode.querySelector('.lf-im-field-error');assert.ok(error);assert.equal(error.attrs.role,'alert');assert.equal(error.hidden,false);
});

test('provider loading is announced, keeps the draft and never imports without confirmation',async()=>{
 const pending=deferred(),h=harness();h.hooks.fetch=()=>pending.promise;h.start();
 assert.equal(h.find('lf-im-result').attrs['aria-busy'],'true');assert.ok(h.find('lf-im-loading'));assert.equal(h.input('AniList').value,'reader');assert.equal(h.writes.length,0);
 pending.resolve({rows:[{work:h.works[0],status:'done'}],misses:0});await flush();
 assert.equal(h.find('lf-im-result').attrs['aria-busy'],'false');assert.ok(h.find('lf-im-confirm'));assert.equal(h.doc.activeElement,h.find('lf-im-preview').querySelector('h3'));assert.equal(h.writes.length,0);
});

test('a failed provider remains retryable, preserves the username and clears its validation error',async()=>{
 const h=harness();h.start('AniList','');h.hooks.fetch=async()=>{throw Error('offline fixture');};h.start('AniList','reader');await flush();
 assert.equal(h.input('AniList').attrs['aria-invalid'],undefined);assert.equal(h.input('AniList').value,'reader');
 const error=h.find('lf-im-error');assert.equal(error.attrs.role,'alert');assert.equal(h.doc.activeElement,error);assert.equal(h.find('lf-im-result').attrs['aria-busy'],'false');
 h.hooks.fetch=async()=>({rows:[],misses:2});h.start('AniList','reader');await flush();assert.equal(h.find('lf-im-confirm').disabled,true);assert.equal(h.writes.length,0);
});

test('pasted-title validation stays beside the draft and valid matches do not write before confirmation',()=>{
 const h=harness(),paste=h.find('lf-im-paste');h.find('lf-im-go-wide').click();assert.equal(paste.attrs['aria-invalid'],'true');assert.equal(h.doc.activeElement,paste);
 paste.value='First\nMissing';h.find('lf-im-go-wide').click();assert.equal(paste.value,'First\nMissing');assert.equal(paste.attrs['aria-invalid'],undefined);assert.ok(h.find('lf-im-preview'));assert.equal(h.writes.length,0);
});

test('import material is scoped, uses semantic pairs, readable fields and unframed source sections',()=>{
 const css=fs.existsSync('styles/lorefy-import-studio.css')?fs.readFileSync('styles/lorefy-import-studio.css','utf8'):'';
 assert.match(css,/@layer lorefy-glass-materials/);assert.match(css,/\.lf-im-page\s*\{[^}]*var\(--ui-page-wash\)/s);
 assert.match(css,/\.lf-im-page \.lf-im-card\s*\{[^}]*background:transparent !important/s);
 assert.match(css,/\.lf-im-page :is\(input\[type='text'\],textarea\)\s*\{[^}]*font-size:16px !important/s);
 assert.match(css,/color:var\(--ui-on-action\) !important/);assert.match(css,/min-height:44px !important/);assert.match(css,/focus-visible/);
 assert.match(css,/margin-block-start:29px !important/);
 assert.match(css,/max-width:760px/);
 assert.match(css,/\.lf-im-page \.lf-im-preview-row select\s*\{[^}]*white-space:nowrap !important/s);
});

test('a failed confirmation keeps its preview and focuses the announced save error',()=>{
 const h=harness();h.find('lf-im-paste').value='First';h.find('lf-im-go-wide').click();h.hooks.saveError=Error('storage unavailable');h.find('lf-im-confirm').click();
 assert.ok(h.find('lf-im-preview'));assert.equal(h.find('lf-im-confirm').disabled,false);assert.equal(h.doc.activeElement,h.find('lf-im-save-error'));assert.equal(h.find('lf-im-summary'),null);
});

test('import material is versioned and cached with the current entry',()=>{
 const asset='styles/lorefy-import-studio.css?v=20261030-import-reviews-v1';for(const path of ['index.html','sw.js'])assert.ok(fs.readFileSync(path,'utf8').includes(asset),path);
});

for(const [raw,expected] of [
 ['اسم المستخدم غير موجود في AniList','AniList username was not found.'],
 ['اسم المستخدم غير موجود في Kitsu','Kitsu username was not found.'],
 ['الملف لا يبدو تصدير مانجا من MAL','This file is not a MAL manga export.'],
 ['الملف لا يبدو تصدير Goodreads (لا يوجد عمود Title)','This Goodreads export has no Title column.'],
 ['ملف فارغ','The file is empty.'],
 ['ملف فارغ أو بلا صفوف','The file has no records.'],
 ['لم أجد عمود العنوان (Title) في الملف','The file has no Title column.'],
 ['تعذر قراءة الملف','Could not read the file.'],
 ['لا توجد أعمال مانجا في هذا الحساب','This account has no manga entries.']
])test('English import localizes the existing provider/file error: '+raw,async()=>{
 const h=harness();h.hooks.fetch=async()=>{throw Error(raw);};h.start();await flush();assert.equal(h.find('lf-im-error').textContent,expected);
});

test('unrecognized provider errors remain literal even if they match object property names',async()=>{
 for(const message of ['constructor','toString','__proto__']){const h=harness();h.hooks.fetch=async()=>{throw Error(message);};h.start();await flush();assert.equal(h.find('lf-im-error').textContent,message);}
});

for(const lang of ['ar','en'])test('review text is previewed as literal text and import can be disabled in '+lang,async()=>{
 const h=harness(lang),body='A review\n<script>not executable</script>';
 h.hooks.fetch=async()=>({rows:[{work:h.works[0],status:'done',score:4,review:body}],misses:0});
 h.start();await flush();
 const preview=h.find('lf-im-review-preview');assert.ok(preview);assert.ok(preview.textContent.includes(body));
 assert.equal(preview.querySelector('script'),null);assert.equal(h.writes.length,0);
 const choice=h.find('lf-im-include-reviews');assert.equal(choice.checked,true);choice.checked=false;
 let options;h.hooks.apply=(rows,value)=>options=value;h.find('lf-im-confirm').click();
 assert.equal(options.reviews,false);
});
