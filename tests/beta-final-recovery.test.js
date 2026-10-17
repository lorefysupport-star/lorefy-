const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(require('node:path').resolve(__dirname,'..',p),'utf8');

test('onboarding exposes minimum and remaining selections before continuing',()=>{
  const auth=read('auth/lorefy-auth.js');
  assert.match(auth,/required=o===1\?1:3/);
  assert.match(auth,/disabled:I\|\|remaining>0/);
  assert.match(auth,/className:"lf-selection-status",role:"status"/);
  assert.match(auth,/lorefy:catalog-ingested/);
  assert.match(auth,/catalogRevision\]/);
});
test('imperative profile subtitles do not overwrite English on every observer pass',()=>{
  assert.match(read('modules/lorefy-reading-diary.js'), /nextSubtitle = global.LorefyI18n.translate\(nextSubtitle, doc.documentElement.lang\)/);
  const i18n=require('../modules/lorefy-i18n.js');
  assert.equal(i18n.translate('جلساتك وملاحظاتك واقتباساتك','en'),'Sessions, notes and quotes');
  assert.equal(i18n.translate('إعجاب، 4','en'),'Like, 4');
});
test('a failed identity-specific image lookup cannot fall back to name-only search',()=>{
  const src=read('modules/lorefy-character-system.js');
  const begin=src.indexOf('  function loadImageOptions('),end=src.indexOf('  var bundledCharacterCatalogPromises',begin);
  const scope={dedupeUrls:a=>a.filter(Boolean),fandomImageSource:()=>null,characterMalId:()=>17,jikanCharacterPictures:()=>Promise.reject(new Error('unavailable')),IMAGE_OPTIONS_LIMIT:20};
  vm.runInNewContext(src.slice(begin,end)+';this.run=loadImageOptions;',scope);
  return scope.run({mal:17,image:'https://source/verified.jpg'},{}).then(images=>assert.deepEqual(Array.from(images),['https://source/verified.jpg']));
});
test('notification list suppresses own actions but preserves system and other-user events',async()=>{
  const src=read('backend/lorefy-backend.js');
  const rows=[{id:'own',actor_id:'me'},{id:'system',actor_id:null},{id:'other',actor_id:'reader'}];
  const chain={select(){return this},eq(){return this},order(){return this},limit(){return Promise.resolve({data:rows})}};
  const window={};vm.runInNewContext(src,{window,console,URL,setTimeout,clearTimeout});
  const api=window.LorefyBackend;
  Object.assign(api,{mode:'live',user:{id:'me'},getSession:async()=>({userId:'me'}),client:{from:()=>chain}});
  assert.deepEqual(Array.from(await api.listNotifications(),row=>row.id),['system','other']);
});
