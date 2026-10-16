(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyProfileSections = api;
})(typeof window !== 'undefined' ? window : null, function(root) {
  'use strict';
  const KEY = 'lorefy.user.profileLists.v1';
  const clean = (value, limit = 160) => String(value || '').trim().slice(0, limit);
  const safeImage = value => /^https?:\/\//i.test(clean(value, 2000)) ? clean(value, 2000) : '';
  function normalizeFolders(rows) {
    const ids = new Set();
    return (Array.isArray(rows) ? rows : []).slice(0, 40).map(row => {
      if (!row || typeof row !== 'object') return null;
      const id = clean(row.id, 100), name = clean(row.name, 100);
      if (!id || !name || ids.has(id)) return null;
      ids.add(id);
      const seen = new Set(), kind = row.kind === 'characters' ? 'characters' : 'works';
      const items = (Array.isArray(row.items) ? row.items : []).slice(0, 50).map(item => {
        if (!item || typeof item !== 'object') return null;
        const entryId = clean(item.id, 120), workId = clean(item.workId, 120);
        const key = workId + ':' + entryId;
        if (!entryId || seen.has(key)) return null;
        seen.add(key);
        return {id:entryId, workId, name:clean(item.name), image:safeImage(item.image)};
      }).filter(Boolean);
      return {id, name, description:clean(row.description, 500), kind,
        isPublic:row.isPublic === true, items, updatedAt:clean(row.updatedAt, 40)};
    }).filter(Boolean);
  }
  function read(storage, key, fallback) {
    try { return JSON.parse(storage.getItem(key) || 'null') || fallback; } catch (_) { return fallback; }
  }
  function account(storage) {
    return storage.getItem('lorefy.activeUser.v1') || read(storage, 'lorefy.session.v1', {}).userId ||
      read(storage, 'lorefy.identity.v1', {}).id || '00000000-0000-4000-8000-000000000099';
  }
  function foldersFor(profile, owner, storage) {
    return normalizeFolders(owner ? read(storage, KEY, []) : profile.profile_lists).filter(row => owner || row.isPublic);
  }
  function assertOwner(storage, owner) {
    if (!owner || account(storage) !== owner) throw Error('Profile list account changed');
  }
  function saveFolder(storage, owner, folder) {
    assertOwner(storage, owner);
    const normalized = normalizeFolders([folder])[0];
    if (!normalized) throw Error('Invalid profile list');
    const rows = foldersFor({}, true, storage);
    const index = rows.findIndex(row => row.id === normalized.id);
    if (index >= 0) rows[index] = normalized;
    else {
      if (rows.length >= 40) throw Error('Profile list limit reached');
      rows.unshift(normalized);
    }
    storage.setItem(KEY, JSON.stringify(rows));
    return normalized;
  }
  function deleteFolder(storage, owner, id) {
    assertOwner(storage, owner);
    storage.setItem(KEY, JSON.stringify(foldersFor({}, true, storage).filter(row => row.id !== id)));
  }
  function setFolderVisibility(storage, owner, id, isPublic) {
    assertOwner(storage, owner);
    if (typeof isPublic !== 'boolean') throw Error('Invalid profile list visibility');
    const folder = foldersFor({}, true, storage).find(row => row.id === id);
    if (!folder) throw Error('Profile list no longer exists');
    const saved = saveFolder(storage, owner, Object.assign({}, folder, {isPublic, updatedAt:new Date().toISOString()}));
    if (root && storage === root.localStorage) root.dispatchEvent(new root.CustomEvent('lorefy:stored-state', {detail:{key:KEY}}));
    return saved;
  }
  function moveItem(items, index, delta) {
    const result = items.slice(), target = index + delta;
    if (index >= 0 && index < result.length && target >= 0 && target < result.length)
      [result[index], result[target]] = [result[target], result[index]];
    return result;
  }
  function postsFor(rows, profile) {
    return rows.filter(row => !row.parent_id && !row.is_deleted &&
      (profile.id ? String(row.user_id) === String(profile.id) :
        clean(row.profile && row.profile.username).toLowerCase() === clean(profile.username).toLowerCase()))
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
  function profileEntries(posts, reviews, profile, owner) {
    const entries=postsFor(posts,profile).map(post=>({id:'post:'+post.id,ts:Date.parse(post.created_at)||0,post}));
    const seen=new Set();
    (reviews||[]).forEach(review=>{
      if (!review || seen.has(String(review.id)) || !(review.userId===profile.id || owner && review.userId==='me'))return;
      seen.add(String(review.id));entries.push({id:'review:'+review.id,ts:Number(review.ts)||0,review});
    });
    return entries.sort((a,b)=>b.ts-a.ts);
  }
  function labels(lang) {
    const en = lang === 'en';
    return en ? {
      tabs:['Overview','Lists','Posts'], navigation:'Profile sections', create:'New list', edit:'Edit list',
      name:'List name', description:'Description', works:'Works', characters:'Characters', public:'Visible to everyone',
      private:'Private', save:'Save list', cancel:'Cancel', back:'Back to lists', remove:'Delete list',
      confirm:'Delete this list?', yes:'Delete', no:'Keep list', empty:'No lists yet',
      emptyPosts:'No posts yet', write:'Write a post', search:'Search works', searchCharacters:'Search characters',
      chooseWork:'Choose a work', changeWork:'Change work', loading:'Loading...', retry:'Retry',
      failed:'Could not load. Try again.', saved:'List saved', saveFailed:'Could not save the list.',
      syncPending:'Saved on this device. Cloud sync is pending.', older:'Older posts',
      unavailable:'Public lists are not available yet. The database update is required.',
      up:'Move up', down:'Move down', removeItem:'Remove item', limit:'Up to 50 entries per list',
      add:'Add', selected:'Selected', noResults:'No results', count:'entries', position:'Position', newTitle:'New ranked list'
    } : {
      tabs:['الرئيسية','القوائم','التغريدات'], navigation:'أقسام البروفايل', create:'قائمة جديدة', edit:'تعديل القائمة',
      name:'اسم القائمة', description:'الوصف', works:'أعمال', characters:'شخصيات', public:'ظاهرة للجميع',
      private:'خاصة', save:'حفظ القائمة', cancel:'إلغاء', back:'العودة للقوائم', remove:'حذف القائمة',
      confirm:'حذف هذه القائمة؟', yes:'حذف', no:'إبقاء القائمة', empty:'لا توجد قوائم بعد',
      emptyPosts:'لا توجد تغريدات بعد', write:'كتابة تغريدة', search:'ابحث عن عمل', searchCharacters:'ابحث عن شخصية',
      chooseWork:'اختيار عمل', changeWork:'تغيير العمل', loading:'جارٍ التحميل...', retry:'إعادة المحاولة',
      failed:'تعذر التحميل. حاول مجدداً.', saved:'تم حفظ القائمة', saveFailed:'تعذر حفظ القائمة.',
      syncPending:'حُفظت على هذا الجهاز. المزامنة السحابية معلقة.', older:'تغريدات أقدم',
      unavailable:'القوائم العامة غير متاحة بعد. يلزم تفعيل تحديث قاعدة البيانات.',
      up:'رفع الترتيب', down:'خفض الترتيب', removeItem:'إزالة العنصر', limit:'حتى 50 عنصراً لكل قائمة',
      add:'إضافة', selected:'محدد', noResults:'لا توجد نتائج', count:'عنصر', position:'الترتيب', newTitle:'قائمة مرتبة جديدة'
    };
  }
  const api = {KEY, account, normalizeFolders, foldersFor, saveFolder, deleteFolder, setFolderVisibility, moveItem, postsFor, profileEntries, labels};
  if (!root || !root.document) return api;
  const doc = root.document, states = new WeakMap(), liveStates = new Set();
  let scheduled = false, serial = 0;
  const text = () => labels(doc.documentElement.lang);
  function node(tag, attrs = {}, children = []) {
    const element = doc.createElement(tag);
    Object.entries(attrs).forEach(([key,value]) => {
      if (key === 'text') element.textContent = value;
      else if (key === 'class') element.className = value;
      else if (key.startsWith('on')) element.addEventListener(key.slice(2),value);
      else if (value != null) element.setAttribute(key,value);
    });
    for (const child of children) if (child) element.appendChild(child);
    return element;
  }
  const icon = name => node('i', {'data-lucide':name, 'aria-hidden':'true'});
  function hydrate(host) { if (root.lucide) root.lucide.createIcons({root:host}); }
  function button(label, symbol, action, cls = '') {
    return node('button', {type:'button', class:'lf-profile-section-button ' + cls, 'aria-label':label,
      title:label, onclick:action}, [symbol && icon(symbol), !cls.includes('is-icon') && node('span',{text:label})]);
  }
  function image(item) {
    const holder = node('span', {class:'lf-profile-list-image'});
    if (safeImage(item.image)) {
      const img = node('img', {src:item.image, alt:'', loading:'lazy', decoding:'async'});
      img.addEventListener('error',() => { img.remove(); holder.textContent = clean(item.name).slice(0,1); });
      holder.appendChild(img);
    } else holder.textContent = clean(item.name).slice(0,1);
    return holder;
  }
  function identity() {
    const raw = read(root.localStorage,'lorefy.identity.v1',{});
    return {id:account(root.localStorage), username:raw.un || raw.username, name:raw.name, avatar:raw.avatar};
  }
  function contentHeader(title, action) {
    return node('header',{class:'lf-profile-section-head'},[node('h2',{text:title}), action]);
  }
  function notice(state, message) {
    state.panel.replaceChildren(node('p',{class:'lf-profile-section-empty',role:'status',text:message}));
  }
  function current(state) { return state.page.isConnected && states.get(state.page)===state &&
    (!state.owner || account(root.localStorage) === state.profile.id); }
  function folderMeta(folder, t) {
    return (folder.kind==='characters'?t.characters:t.works)+' · '+folder.items.length+' '+t.count;
  }
  function folderArtwork(folder, cls) {
    return node('span',{class:cls,'aria-hidden':'true',style:'--list-art-count:'+Math.max(1,Math.min(4,folder.items.length))},folder.items.slice(0,4).map(image));
  }
  function folderVisibility(folder, t) {
    return node('span',{class:'lf-profile-folder-visibility'},[
      icon(folder.isPublic?'globe':'lock'),node('small',{text:folder.isPublic?t.public:t.private})
    ]);
  }
  function folderPreview(folder, t) {
    const back = folder.items.length>1 ? folder.items.slice(1,4) : folder.items.slice(0,1);
    return node('span',{class:'lf-profile-folder-stage','aria-hidden':'true'},[
      node('span',{class:'lf-profile-folder-back'}),
      node('span',{class:'lf-profile-folder-fan','data-count':back.length},back.map(image)),
      node('span',{class:'lf-profile-folder-pocket'},[
        folder.items.length && image(folder.items[0]),
        node('span',{class:'lf-profile-folder-pocket-label'},[
          icon(folder.kind==='characters'?'users':'book-open'),
          node('span',{text:folder.kind==='characters'?t.characters:t.works})
        ])
      ])
    ]);
  }
  function chooseListKind(state) {
    const t=text(), en=doc.documentElement.lang==='en';
    state.panel.replaceChildren(contentHeader(t.create,button(t.back,doc.documentElement.lang==='en'?'arrow-left':'arrow-right',()=>renderFolders(state))),
      node('p',{class:'lf-profile-list-kind-intro',text:en?'What would you like to collect?':'ما الذي تريد جمعه؟'}));
    [['works','book-open',en?'Work list':'قائمة أعمال',en?'Collect, rank and share your reads':'اجمع أعمالك ورتّبها وشاركها'],
     ['characters','users',en?'Character list':'قائمة شخصيات',en?'Your favourite characters, ranked':'شخصياتك المفضلة بالترتيب']].forEach(([kind,symbol,title,description])=>{
      state.panel.appendChild(node('button',{type:'button',class:'lf-profile-list-kind',onclick:()=>editFolder(state,null,kind)},[
        icon(symbol),node('span',{},[node('strong',{text:title}),node('small',{text:description})]),icon('chevron-right')]));
    }); hydrate(state.panel);
  }
  function renderFolders(state) {
    const t = text(), rows = foldersFor(state.profile,state.owner,root.localStorage).concat(state.owner && root.LorefyLegacyLists ? root.LorefyLegacyLists.rows() : []);
    state.panel.replaceChildren(contentHeader(t.tabs[1],state.owner && button(t.create,'plus',() => chooseListKind(state),'is-profile-create')));
    if (!state.owner && state.profile.profile_lists_error) {
      state.panel.appendChild(node('p',{role:'status',class:'lf-profile-section-empty',text:t.unavailable}));
      return;
    }
    if (!rows.length) state.panel.appendChild(node('p',{class:'lf-profile-section-empty',text:t.empty}));
    const grid = node('div',{class:'lf-profile-folder-grid'});
    rows.forEach(folder => {
      const card = node('button',{type:'button',class:'lf-profile-folder','data-profile-folder':folder.id,
        'aria-label':folder.name+' · '+folderMeta(folder,t)+' · '+(folder.isPublic?t.public:t.private),
        onclick:() => folder.legacyId ? root.LorefyLegacyLists.open(folder) : showFolder(state,folder)},[
        folderPreview(folder,t),
        node('span',{class:'lf-profile-folder-caption'},[
          node('span',{},[node('strong',{'data-no-translate':'true',dir:'auto',text:folder.name}),
            node('small',{text:folder.items.length+' '+t.count}),folderVisibility(folder,t)])
        ])
      ]);
      grid.appendChild(card);
    });
    state.panel.appendChild(grid); hydrate(state.panel);
  }
  function showFolder(state, folder) {
    const t = text();
    const intro = node('header',{class:'lf-profile-list-intro'},[
      folderArtwork(folder,'lf-profile-list-artwork'),
      node('div',{class:'lf-profile-list-meta'},[node('span',{text:folderMeta(folder,t)}),folderVisibility(folder,t)]),
      node('h2',{'data-no-translate':'true',dir:'auto',text:folder.name})
    ]);
    state.panel.replaceChildren(node('div',{class:'lf-profile-list-toolbar'},[
      button(t.back,doc.documentElement.lang==='en'?'arrow-left':'arrow-right',() => {
        renderFolders(state);
        const card = Array.from(state.panel.querySelectorAll('[data-profile-folder]')).find(el => el.dataset.profileFolder===folder.id);
        if (card) card.focus({preventScroll:true});
        state.panel.scrollIntoView({block:'start',behavior:'instant'});
      },'is-back'),
      state.owner && button(t.edit,'pencil',() => editFolder(state,folder))
    ]),intro);
    if (folder.description) intro.appendChild(node('p',{class:'lf-profile-list-description',
      'data-no-translate':'true',dir:'auto',text:folder.description}));
    const list = node('ol',{class:'lf-profile-ranked-list'});
    folder.items.forEach((item,index) => list.appendChild(node('li',{class:index<3?'is-leading-rank':''},[
      node('span',{class:'lf-profile-list-rank',text:String(index+1)}), image(item),
      node('strong',{'data-no-translate':'true',dir:'auto',text:item.name})
    ])));
    state.panel.appendChild(list);
    if (!folder.items.length) state.panel.appendChild(node('p',{class:'lf-profile-section-empty',text:t.noResults}));
    if (state.owner) state.panel.appendChild(button(t.remove,'trash-2',() => {
      const confirmation = node('div',{class:'lf-profile-list-confirm'},[
        node('p',{text:t.confirm}),button(t.yes,'trash-2',() => {
          try { deleteFolder(root.localStorage,state.profile.id,folder.id); renderFolders(state); }
          catch (_) { notice(state,t.saveFailed); }
        },'is-destructive'),button(t.no,'x',() => confirmation.remove())
      ]);
      state.panel.appendChild(confirmation); hydrate(confirmation);
    },'is-destructive'));
    hydrate(state.panel);
    state.panel.scrollIntoView({block:'start',behavior:'instant'});
    state.panel.querySelector('.is-back').focus({preventScroll:true});
  }
  function catalog() { return root.LorefyMangaData || []; }
  function workItem(work) {
    const cover = root.LorefyCoverAPI;
    return {id:String(work.id), workId:String(work.id), name:work.titleEnglish || work.title || work.ar,
      image:safeImage(cover && cover.primary ? cover.primary(work) : work.cover || work.sourceCoverUrl || work.coverImage)};
  }
  function editFolder(state, source, initialKind) {
    const t = text(), draft = source ? JSON.parse(JSON.stringify(source)) :
      {id:root.crypto.randomUUID(),name:'',description:'',kind:initialKind||'characters',isPublic:true,items:[]};
    const editOwner = state.profile.id;
    state.panel.replaceChildren(contentHeader(source?t.edit:t.newTitle,button(t.cancel,'x',() => renderFolders(state))));
    const form = node('form',{class:'lf-profile-list-editor'});
    const name = node('input',{type:'text',maxlength:100,required:'required',value:draft.name,'aria-label':t.name,placeholder:t.name,dir:'auto','data-no-translate':'true'});
    const description = node('textarea',{maxlength:500,'aria-label':t.description,placeholder:t.description,dir:'auto','data-no-translate':'true'});
    description.value = draft.description;
    const kind = node('select',{'aria-label':t.tabs[1]},[
      node('option',{value:'characters',text:t.characters}),node('option',{value:'works',text:t.works})
    ]);
    kind.value = draft.kind; kind.disabled = draft.items.length > 0;
    const visibility = node('input',{type:'checkbox'}); visibility.checked = draft.isPublic;
    form.append(name,description,node('div',{class:'lf-profile-list-options'},[
      kind,node('label',{},[visibility,node('span',{text:t.public})])
    ]));
    const selected = node('ol',{class:'lf-profile-ranked-list is-editing'});
    const status = node('p',{role:'status',class:'lf-profile-list-meta'});
    const search = node('input',{type:'search','aria-label':t.search,placeholder:t.search,dir:'auto','data-no-translate':'true'});
    const results = node('div',{class:'lf-profile-list-results'});
    const workLabel = node('div',{class:'lf-profile-list-work-label'});
    let activeWork = null, cast = [], castBusy = false, generation = 0;
    function isEditing() { return current(state) && form.isConnected && editOwner === account(root.localStorage); }
    function selectedRows(focusIndex, action) {
      selected.replaceChildren();
      draft.items.forEach((item,index) => {
        function move(delta) {
          draft.items=moveItem(draft.items,index,delta);
          selectedRows(index+delta,delta<0?0:1);
          status.textContent=item.name+' · '+t.position+' '+(index+delta+1)+' / '+draft.items.length;
        }
        const up = button(t.up+' · '+item.name,'arrow-up',() => move(-1),'is-icon');
        const down = button(t.down+' · '+item.name,'arrow-down',() => move(1),'is-icon');
        up.disabled = index===0; down.disabled = index===draft.items.length-1;
        selected.appendChild(node('li',{},[node('span',{class:'lf-profile-list-rank',text:String(index+1)}),image(item),
          node('strong',{'data-no-translate':'true',dir:'auto',text:item.name}),
          node('div',{class:'lf-profile-rank-tools'},[up,down,button(t.removeItem+' · '+item.name,'x',() => {
            draft.items.splice(index,1); kind.disabled=draft.items.length>0;
            selectedRows(Math.min(index,draft.items.length-1),2); searchResults();
          },'is-icon')])
        ]));
      });
      kind.disabled = draft.items.length>0;
      status.textContent = draft.items.length+' / 50';
      hydrate(selected);
      if (action != null) {
        const row=selected.children[focusIndex], controls=row && row.querySelectorAll('button');
        const control=controls && (controls[action].disabled ? controls[action===0?1:0] : controls[action]);
        (control || search).focus();
      }
    }
    function add(item) {
      if (draft.items.length >= 50) { status.textContent=t.limit; return; }
      if (!draft.items.some(row => row.id===item.id && row.workId===item.workId)) draft.items.push(item);
      selectedRows(); searchResults();
    }
    async function chooseWork(work) {
      activeWork=work; cast=[]; castBusy=true; const request=++generation;
      search.value=''; search.placeholder=t.searchCharacters; search.setAttribute('aria-label',t.searchCharacters);
      workLabel.replaceChildren(node('strong',{'data-no-translate':'true',dir:'auto',text:work.title}),
        button(t.changeWork,'arrow-left-right',() => {
          ++generation; activeWork=null; castBusy=false; workLabel.replaceChildren();
          search.value=''; search.placeholder=t.search; search.setAttribute('aria-label',t.search); searchResults(); search.focus();
        }));
      const system=root.LorefyCharacterSystem;
      cast=system && system.catalogCast ? system.catalogCast(work.sourceWork || work) : [];
      searchResults();
      try {
        if (system && system.loadCast) cast=await system.loadCast(work.sourceWork || work,{allowTitleSearch:true});
        if (!isEditing() || request!==generation) return;
        castBusy=false; searchResults();
      } catch (_) {
        if (!isEditing() || request!==generation) return;
        castBusy=false; status.textContent=t.failed; searchResults();
        results.appendChild(button(t.retry,'rotate-cw',() => chooseWork(work)));
      }
    }
    function searchResults() {
      results.replaceChildren();
      const q=search.value.trim().toLowerCase();
      if (activeWork && draft.kind==='characters') {
        const matches=cast.filter(character => [character.name,character.latin,character.nameAr].join(' ').toLowerCase().includes(q)).slice(0,40);
        matches.forEach(character => {
          const entry={id:String(character.id || character.key || character.name),workId:String(activeWork.id),
            name:character.name || character.latin,image:safeImage(character.image || character.img || character.cover)};
          const chosen=draft.items.some(item=>item.id===entry.id && item.workId===entry.workId);
          const result=button(entry.name,chosen?'check':'plus',() => add(entry),'is-result');
          result.setAttribute('data-no-translate','true'); result.disabled=chosen;
          result.prepend(image(entry)); results.appendChild(result);
        });
        if (castBusy) results.appendChild(node('p',{text:t.loading,role:'status'}));
        else if (!matches.length) results.appendChild(node('p',{text:t.noResults}));
      } else {
        const library=read(root.localStorage,'lorefy.user.library.v2',{});
        const matches=catalog().filter(work => q ?
          (root.LorefyCatalogData && root.LorefyCatalogData.matchesCatalogQuery ?
            root.LorefyCatalogData.matchesCatalogQuery(work,q) :
            [work.title,work.titleEnglish,work.ar].join(' ').toLowerCase().includes(q)) : library[work.id]).slice(0,25);
        matches.forEach(work => {
          const entry=workItem(work), chosen=draft.kind==='works' && draft.items.some(item=>item.id===entry.id);
          const result=button(entry.name,chosen?'check':draft.kind==='characters'?'chevron-left':'plus',
            () => draft.kind==='characters'?chooseWork(work):add(entry),'is-result');
          result.setAttribute('data-no-translate','true'); result.disabled=chosen;
          result.prepend(image(entry)); results.appendChild(result);
        });
        if (!matches.length) results.appendChild(node('p',{text:q?t.noResults:t.chooseWork}));
      }
      hydrate(results); hydrate(workLabel);
    }
    kind.addEventListener('change',() => {
      draft.kind=kind.value; ++generation; activeWork=null; castBusy=false; workLabel.replaceChildren();
      search.value=''; search.placeholder=t.search; search.setAttribute('aria-label',t.search); searchResults();
    });
    search.addEventListener('input',searchResults);
    const save=button(t.save,'check',() => {}); save.type='submit';
    const saveError=node('p',{role:'alert',class:'lf-profile-list-error'});
    form.addEventListener('submit',async event => {
      event.preventDefault(); if (save.disabled || !isEditing()) return;
      draft.name=name.value; draft.description=description.value; draft.isPublic=visibility.checked;
      draft.updatedAt=new Date().toISOString();
      try { saveFolder(root.localStorage,editOwner,draft); }
      catch (_) { saveError.textContent=t.saveFailed; return; }
      save.disabled=true;
      const backend=root.LorefyBackend;
      let synced=true;
      if (backend && backend.mode==='live') {
        try { synced=await backend.push() !== false; } catch (_) { synced=false; }
      }
      if (!isEditing()) return;
      renderFolders(state);
      state.panel.appendChild(node('p',{role:'status',class:'lf-profile-list-meta',text:synced?t.saved:t.syncPending}));
    });
    form.append(selected,status,workLabel,search,results,saveError,save);
    state.panel.appendChild(form); selectedRows(); searchResults(); hydrate(state.panel); name.focus({preventScroll:true});
  }
  async function loadPosts(state, more=false) {
    const community=root.LorefyCommunity;
    if (!community) return;
    if (state.postBusy) { state.postDirty=true; return; }
    const request=++state.postRequest;
    state.postBusy=true; state.postError=false; renderPosts(state);
    try {
      const rows=await community.readProfilePosts(state.profile,more?state.cursor:null);
      if (!current(state) || request!==state.postRequest) return;
      const byId=new Map((more?state.posts:[]).concat(postsFor(rows,state.profile)).map(post=>[post.id,post]));
      state.posts=postsFor([...byId.values()],state.profile);
      state.cursor=rows.length ? {created_at:rows[rows.length-1].created_at,id:rows[rows.length-1].id} : null;
      state.more=rows.length===50; state.postLoaded=true;
    } catch (_) {
      if (!current(state) || request!==state.postRequest) return;
      state.postError=true;
    } finally {
      if (request===state.postRequest) {
        state.postBusy=false;
        if (state.tab==='posts' && current(state)) {
          renderPosts(state);
          if (state.postDirty) { state.postDirty=false; loadPosts(state); }
        }
      }
    }
  }
  function renderPosts(state) {
    if (state.tab!=='posts') return;
    const t=text(), community=root.LorefyCommunity;
    state.panel.replaceChildren(contentHeader(t.tabs[2],state.owner && community && button(t.write,'feather',() => community.openComposer(),'is-profile-create')));
    const feed=node('div',{class:'lf-profile-post-feed'});
    if(state.reviewRoots)state.reviewRoots.forEach(root=>root.unmount());state.reviewRoots=[];
    const reviews=root.LorefyProfileReviews ? root.LorefyProfileReviews(state.profile,state.owner) : [];
    const entries=profileEntries(state.posts,reviews,state.profile,state.owner);
    state.reviewStamp=JSON.stringify(reviews);
    entries.forEach(entry=>{
      if(entry.post && community)feed.appendChild(community.postCard(entry.post,false));
      else if(entry.review && root.LorefyProfileReviewCard && root.ReactDOM){
        const host=node('div',{class:'lf-profile-review-entry'});feed.appendChild(host);
        const renderer=root.ReactDOM.createRoot(host);state.reviewRoots.push(renderer);
        renderer.render(root.React.createElement(root.LorefyProfileReviewCard,{rev:entry.review}));
      }
    });
    state.panel.appendChild(feed);
    if (state.postBusy) state.panel.appendChild(node('p',{role:'status',class:'lf-profile-section-empty',text:t.loading}));
    else if (state.postError) state.panel.appendChild(node('div',{class:'lf-profile-section-empty'},[
      node('p',{role:'alert',text:t.failed}),button(t.retry,'rotate-cw',() => loadPosts(state,!!state.posts.length))]));
    else if (!entries.length) state.panel.appendChild(node('p',{class:'lf-profile-section-empty',text:t.emptyPosts}));
    if (state.more && !state.postBusy && !state.postError)
      state.panel.appendChild(button(t.older,'chevron-down',() => loadPosts(state,true)));
    hydrate(state.panel);
  }
  function selectTab(state, tab, focus=false) {
    state.tab=tab; state.page.dataset.profileSection=tab;
    state.panel.hidden=tab==='overview';
    state.buttons.forEach((button,index) => {
      const chosen=['overview','lists','posts'][index]===tab;
      button.setAttribute('aria-selected',String(chosen)); button.tabIndex=chosen?0:-1;
      if (chosen && focus) button.focus({preventScroll:true});
    });
    state.panel.setAttribute('aria-labelledby',state.buttons[['overview','lists','posts'].indexOf(tab)].id);
    if (tab==='lists') renderFolders(state);
    if (tab==='posts') { renderPosts(state); if (!state.postLoaded) loadPosts(state); }
  }
  function compactMetrics(page) {
    const socialLabels = new Set(['مراجعة','Review','Reviews','منشور','Post','Posts']);
    page.querySelectorAll('.lf-profile-metrics,.lf-reader-metrics').forEach(metrics => {
      let count = 0;
      Array.from(metrics.children).forEach(row => {
        const stat = row.getAttribute('data-profile-stat');
        const redundant = stat === 'MessageCircle' || stat === 'MessagesSquare' ||
          Array.from(row.querySelectorAll('p,span')).some(label => socialLabels.has(label.textContent.trim()));
        row.classList.toggle('is-profile-social-stat',redundant);
        if (!redundant) count++;
      });
      metrics.classList.add('lf-profile-reading-metrics');
      const value = String(Math.max(1,count));
      if (metrics.style.getPropertyValue('--profile-metric-count') !== value)
        metrics.style.setProperty('--profile-metric-count',value);
    });
  }
  function sync() {
    liveStates.forEach(state=>{if(!state.page.isConnected){if(state.reviewRoots)state.reviewRoots.forEach(renderer=>renderer.unmount());liveStates.delete(state);}});
    const lang=doc.documentElement.lang;
    doc.querySelectorAll('.lf-profile-page').forEach(page => {
      const owner=!page.classList.contains('lf-public-profile-page');
      const profile=owner?identity():page.__lorefyProfileSnapshot;
      if (!profile || !profile.id) return;
      const container=owner?page:page.querySelector('.lf-reader-surface');
      const identityNode=page.querySelector(owner?'.lf-profile-identity':'.lf-reader-identity');
      if (!container || !identityNode) return;
      compactMetrics(page);
      let state=states.get(page);
      if (state && state.profile.id!==profile.id) {
        if(state.reviewRoots)state.reviewRoots.forEach(renderer=>renderer.unmount());
        state.bar.remove(); state.panel.remove(); states.delete(page); liveStates.delete(state); state=null;
      }
      if (!state) {
        const id='lf-profile-sections-'+(++serial);
        const bar=node('nav',{class:'lf-profile-section-tabs',role:'tablist','aria-label':text().navigation});
        const panel=node('section',{class:'lf-profile-section-panel',role:'tabpanel',id:id+'-panel',tabindex:'0',hidden:'hidden'});
        state={page,profile,owner,bar,panel,tab:'overview',lang,posts:[],postRequest:0,postLoaded:false};
        states.set(page,state);liveStates.add(state);
        state.buttons=['overview','lists','posts'].map((tab,index) => {
          const b=node('button',{type:'button',role:'tab',id:id+'-'+tab,'aria-controls':tab==='overview'?id+'-overview':panel.id,
            onclick:() => selectTab(state,tab)},[icon(['layout-grid','folder-heart','feather'][index]),node('span',{text:text().tabs[index]})]);
          b.addEventListener('keydown',event => {
            const keys=['ArrowLeft','ArrowRight','Home','End'];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            const step=event.key==='ArrowRight'?(state.lang==='en'?1:-1):(state.lang==='en'?-1:1);
            const target=event.key==='Home'?0:event.key==='End'?2:(index+step+3)%3;
            selectTab(state,['overview','lists','posts'][target],true);
          });
          bar.appendChild(b); return b;
        });
        container.insertBefore(panel,identityNode.nextSibling);
        if (owner) identityNode.insertBefore(bar,identityNode.querySelector('.lf-profile-top-works-head'));
        else container.insertBefore(bar,panel);
        selectTab(state,'overview'); hydrate(bar);
      }
      state.profile=profile;
      if(state.tab==='posts' && root.LorefyProfileReviews && state.reviewStamp!==JSON.stringify(root.LorefyProfileReviews(profile,owner)))renderPosts(state);
      const favoriteHead=owner && identityNode.querySelector('.lf-profile-top-works-head');
      if (favoriteHead && state.bar.nextSibling!==favoriteHead) identityNode.insertBefore(state.bar,favoriteHead);
      if (!state.bar.isConnected) {
        if (owner) identityNode.insertBefore(state.bar,identityNode.querySelector('.lf-profile-top-works-head'));
        else container.insertBefore(state.bar,identityNode.nextSibling);
      }
      if (!state.panel.isConnected) container.insertBefore(state.panel,owner?identityNode.nextSibling:state.bar.nextSibling);
      // Leave React-owned children in place; only classify the overview sections.
      Array.from(container.children).forEach(child => {
        if (child===state.bar || child===state.panel || child===identityNode ||
          child.classList.contains('lf-profile-banner') || child.matches('canvas,svg,[data-decoration-layer],.lf-profile-page-frame,.lf-profile-effect-layer')) return;
        if (owner && (child.compareDocumentPosition(identityNode) & root.Node.DOCUMENT_POSITION_FOLLOWING)) return;
        if (!child.classList.contains('lf-profile-overview-content')) child.classList.add('lf-profile-overview-content');
      });
      const overview=container.querySelector('.lf-profile-overview-content');
      if (overview && !overview.id) {
        overview.id=state.buttons[0].getAttribute('aria-controls');
        overview.setAttribute('role','tabpanel'); overview.setAttribute('aria-labelledby',state.buttons[0].id);
      }
      if (state.lang!==lang) {
        state.lang=lang; state.bar.setAttribute('aria-label',text().navigation);
        state.buttons.forEach((b,i) => b.querySelector('span').textContent=text().tabs[i]);
        // Keep the active draft and native input node intact during language refreshes.
        if (!state.panel.querySelector(".lf-profile-list-editor")) selectTab(state,state.tab);
      }
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled=true; root.requestAnimationFrame(() => { scheduled=false; sync(); });
  }
  const observer=new root.MutationObserver(schedule);
  observer.observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['lang']});
  root.addEventListener('lorefy:stored-state',event => {
    if (!event.detail || event.detail.key !== KEY) return;
    liveStates.forEach(state => {
      if (state.owner && current(state) && state.tab === 'lists' && !state.panel.querySelector('.lf-profile-list-editor')) renderFolders(state);
    });
  });
  root.addEventListener('lorefy:profile-snapshot',event => {
    schedule();
    doc.querySelectorAll('.lf-public-profile-page').forEach(page => {
      const state=states.get(page);
      if (state && event.detail && event.detail.profile && state.profile.id===event.detail.profile.id) {
        state.profile=event.detail.profile;
        if (state.tab==='lists') renderFolders(state);
      }
    });
  });
  root.addEventListener('lorefy:community-post-changed',() => {
    doc.querySelectorAll('.lf-profile-page').forEach(page => {
      const state=states.get(page);
      if (state) { state.postLoaded=false; if (state.tab==='posts') loadPosts(state); }
    });
  });
  root.addEventListener('lorefy:open-profile-section',event => {
    const page=doc.querySelector('.lf-profile-page'), state=page && states.get(page);
    if (state) selectTab(state,event.detail && event.detail.tab || 'overview');
  });
  api.enhance=sync; schedule();
  return api;
});
