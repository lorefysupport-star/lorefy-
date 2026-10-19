(function (global) {
  "use strict";

  var doc = global.document;
  if (!doc) return;

  var LOCAL_POSTS_KEY = "lorefy.user.communityPosts.v1";
  var LOCAL_REACTIONS_KEY = "lorefy.user.communityReactions.v1";
  var SAVED_POSTS_KEY = "lorefy.user.savedCommunityPosts.v1";
  var LISTS_KEY = "lorefy.customLists.v1";
  var TOPS_KEY = "lorefy.charTopLists.v1";
  var DIARY_KEY = "lorefy.user.readingDiary.v1";
  var state = { page:null, posts:[], loaded:false, loading:false, attachment:null, composeSheet:null, unsubscribe:null, refreshTimer:0, legacySeedAttempted:false, filter:"all", followedIds:[], followsLoaded:false };
  var composerDrafts = new Map();
  var composerViewportCleanup = null;
  var composerReturnFocus = null;
  var replyActivityRows = [], replyActivityRoots = [], replyActivityAccount = '', replyActivityAt = 0;

  function uiText(ar, en) { return doc.documentElement.lang === 'en' ? en : ar; }

  function read(key, fallback) {
    try {
      var value = JSON.parse(global.localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch (error) { return fallback; }
  }

  function write(key, value) {
    try { global.localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) {}
  }

  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      var value = attrs[key];
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key === "hidden") node.hidden = !!value;
      else if (key.indexOf("on") === 0 && typeof value === "function") node.addEventListener(key.slice(2), value);
      else if (value != null) node.setAttribute(key, value);
    });
    (Array.isArray(children) ? children : children ? [children] : []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function icon(name, size) {
    return el("i", { "data-lucide":name, width:String(size || 18), height:String(size || 18), "aria-hidden":"true" });
  }

  function hydrateIcons(root) {
    try {
      if (global.lucide && global.lucide.createIcons) global.lucide.createIcons({ root:root || doc });
    } catch (error) {}
  }

  function toast(message) {
    try {
      if (global.LorefyUI && global.LorefyUI.toast) return global.LorefyUI.toast(message);
      global.dispatchEvent(new global.CustomEvent("lorefy:toast", { detail:{ message:message } }));
    } catch (error) {}
  }

  function communityOverlayHost() {
    return doc.querySelector(".lf-app") || doc.getElementById("screen") || doc.body;
  }
  var replyDrafts = new Map();

  function isDemo() {
    var params = new URLSearchParams(global.location.search || "");
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(global.location.hostname) && params.get("preview") === "demo";
  }

  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return "00000000-0000-4000-8000-" + String(Date.now()).slice(-12);
  }

  function identity() {
    var raw = read("lorefy.identity.v1", {}) || {};
    var session = read("lorefy.session.v1", {}) || {};
    return {
      id:session.userId || raw.id || "00000000-0000-4000-8000-000000000099",
      name:raw.name || raw.displayName || "قارئ Lorefy",
      username:String(raw.un || raw.username || "lorefy_reader").replace(/^@/, ""),
      avatar:raw.avatar || raw.av || ""
    };
  }

  function works() {
    if (Array.isArray(global.LorefyMangaData) && global.LorefyMangaData.length) return global.LorefyMangaData;
    var seen = {};
    return Array.prototype.map.call(doc.querySelectorAll(".lf-review-card"), function (card, index) {
      var paragraphs = card.querySelectorAll("p");
      var images = card.querySelectorAll("img");
      var title = String(paragraphs.length > 1 ? paragraphs[paragraphs.length - 1].textContent : "").trim();
      if (!title || seen[title]) return null;
      seen[title] = true;
      return {
        id:"community-visible-work-" + index,
        title:title,
        cover:images.length ? images[images.length - 1].src : ""
      };
    }).filter(Boolean);
  }

  function workById(id) {
    id = String(id || "");
    var rows = works();
    for (var i=0; i<rows.length; i++) if (String(rows[i].id) === id) return rows[i];
    return null;
  }

  function workTitle(work) {
    return String(work && (work.titleEnglish || work.english || work.title || work.ar) || "عمل على Lorefy");
  }

  function workCover(work) {
    return String(work && (work.sourceCoverUrl || work.cover || work.coverImage) || "");
  }

  function timeLabel(value) {
    var age = Date.now() - new Date(value || Date.now()).getTime();
    if (age < 60000) return uiText("الآن", "Now");
    if (age < 3600000) return Math.max(1, Math.floor(age / 60000)) + uiText("د", "m");
    if (age < 86400000) return Math.floor(age / 3600000) + uiText("س", "h");
    return Math.floor(age / 86400000) + uiText("ي", "d");
  }

  function avatar(profile, size) {
    var wrap = el("span", { class:"lf-community-post-avatar", style:"--avatar-size:" + (size || 42) + "px" });
    if (profile && profile.avatar) {
      var image = el("img", { src:profile.avatar, alt:"", loading:"lazy", decoding:"async", referrerpolicy:"no-referrer" });
      image.addEventListener("error", function () { image.remove(); wrap.textContent = String((profile.name || profile.username || "L")).slice(0, 1); });
      wrap.appendChild(image);
    } else wrap.textContent = String(profile && (profile.name || profile.username) || "L").slice(0, 1);
    return wrap;
  }

  function openProfile(profile) {
    if (!profile || !profile.id) return;
    global.dispatchEvent(new global.CustomEvent("lorefy:open-reader-profile", { detail:profile }));
  }

  function normalizePost(row) {
    row = row || {};
    var sourceReactions = row.reactions || {};
    var sourceMine = sourceReactions.mine;
    var mine = typeof sourceMine === "object" && sourceMine ? sourceMine : { like:!!sourceMine, dislike:false };
    return {
      id:String(row.id || uuid()),
      user_id:String(row.user_id || row.userId || ""),
      kind:["text", "list", "top"].indexOf(row.kind) >= 0 ? row.kind : "text",
      body:String(row.body || ""),
      attachment:row.attachment && typeof row.attachment === "object" ? row.attachment : {},
      parent_id:row.parent_id || null,
      is_deleted:!!row.is_deleted,
      created_at:row.created_at || new Date().toISOString(),
      profile:row.profile || { id:row.user_id || row.userId, name:row.user || "قارئ Lorefy", username:row.un || "lorefy_reader", avatar:row.av || "" },
      reactions:{
        like:Number(sourceReactions.like != null ? sourceReactions.like : row.likes || 0),
        dislike:Number(sourceReactions.dislike != null ? sourceReactions.dislike : row.dislikes || 0),
        mine:{ like:!!mine.like, dislike:!!mine.dislike }
      },
      replyCount:Number(row.replyCount || 0),
      demoReplies:Array.isArray(row.demoReplies) ? row.demoReplies : []
    };
  }

  function applyLocalReaction(post) {
    var saved = read(LOCAL_REACTIONS_KEY, {}) || {};
    var reaction = saved[post.id];
    if (!reaction || typeof reaction !== "object") return post;
    var mine = reaction.mine || {};
    post.reactions = {
      like:Math.max(0, Number(reaction.like || 0)),
      dislike:Math.max(0, Number(reaction.dislike || 0)),
      mine:{ like:!!mine.like, dislike:!!mine.dislike }
    };
    return post;
  }

  function mergedDemoReplies(post, local) {
    var replies = new Map((post.demoReplies || []).concat(local).map(normalizePost).map(function (row) { return [row.id,row]; }));
    return Array.from(replies.values()).filter(function (row) { return !row.is_deleted; });
  }

  function demoPosts() {
    var seeded = [];
    if (global.LorefyDemoCommunity && global.LorefyDemoCommunity.buildPosts) {
      seeded = global.LorefyDemoCommunity.buildPosts(works().slice(0, 30).map(function (work) { return work.id; }));
    }
    var mine = read(LOCAL_POSTS_KEY, []);
    var all = mine.concat(seeded).map(normalizePost);
    var byId = new Map(all.map(function (row) { return [row.id,row]; }));
    var replies = new Map();
    all.forEach(function (row) {
      if (!row.parent_id) return;
      var id = String(row.parent_id), group = replies.get(id) || [];
      group.push(row); replies.set(id,group);
    });
    var rows = all.filter(function (row) {
      var parent = byId.get(String(row.parent_id));
      return !row.is_deleted && (!parent || !parent.is_deleted);
    }).map(applyLocalReaction);
    return rows.map(function (row) {
      row.replyCount = mergedDemoReplies(row,replies.get(row.id) || []).length;
      return row;
    }).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  }

  async function loadFollowedProfileIds(force, current) {
    if (state.followsLoaded && !force) return state.followedIds;
    var ids = [];
    var backend = global.LorefyBackend;
    try {
      if (backend && backend.getFollowedProfileIds) ids = await backend.getFollowedProfileIds();
    } catch (error) {
      if (!isDemo()) throw error;
      console.warn("[Lorefy] followed profiles:", error);
    }
    if (isDemo() && (!Array.isArray(ids) || !ids.length) && global.LorefyDemoCommunity && global.LorefyDemoCommunity.buildReaders) {
      ids = global.LorefyDemoCommunity.buildReaders(works().slice(0, 30).map(function (work) { return work.id; }))
        .filter(function (profile) { return profile.is_following === true; })
        .map(function (profile) { return profile.id; });
    }
    if (current && !current()) return [];
    state.followedIds = Array.from(new Set((Array.isArray(ids) ? ids : []).map(String)));
    state.followsLoaded = true;
    return state.followedIds;
  }

  function loadPosts(force, older, context) {
    if (state.postJob && state.postJob.current()) return state.postJob.promise;
    if (state.loaded && !force) return Promise.resolve(true);
    state.loading = true;
    state.error = false;
    var request = state.feedRequest = (state.feedRequest || 0) + 1;
    var feedPage = state.page;
    var backend = global.LorefyBackend;
    var accountId = String(backend && backend.user && backend.user.id || '');
    var expired = false, timer, job = {};
    function ownRequest() { return request === state.feedRequest && feedPage === state.page; }
    job.current = function () { return !expired && ownRequest() && backend === global.LorefyBackend
      && accountId === String(backend && backend.user && backend.user.id || '') && (!context || !context.active || context.active()); };
    var deadline = new Promise(function (_, reject) { timer = global.setTimeout(function () {
      expired = true; reject(new Error('Community refresh timeout'));
    }, 14000); });
    var work = (async function () {
    try {
      if (!isDemo() && backend && backend.mode === "live" && backend.listCommunityPosts) {
        var cursor = older && state.posts[state.posts.length - 1];
        var rows = (await backend.listCommunityPosts({ limit:60, before:cursor || null })).map(normalizePost);
        if (!job.current()) return false;
        state.hasMore = rows.length === 60;
        var merged = older ? state.posts.concat(rows) : rows;
        state.posts = Array.from(new Map(merged.map(function (row) { return [row.id, row]; })).values());
      }
      else if (isDemo()) state.posts = demoPosts();
      else throw new Error('Community connection is unavailable.');
      await loadFollowedProfileIds(!!force, job.current);
      if (!job.current()) return false;
      state.loaded = true;
      return true;
    } catch (error) {
      if (!job.current()) return false;
      throw error;
    }
    })();
    job.promise = Promise.race([work, deadline]).catch(function () {
      if (ownRequest()) { state.error = true; state.loaded = true; }
      return false;
    }).finally(function () {
      expired = true; global.clearTimeout(timer);
      if (state.postJob === job) state.postJob = null;
      if (ownRequest()) { state.loading = false; renderPostFeed(); }
    });
    state.postJob = job;
    return job.promise;
  }

  function localSavePost(input) {
    var me = identity();
    var rows = read(LOCAL_POSTS_KEY, []);
    var post = normalizePost({
      id:uuid(), user_id:me.id, kind:input.kind, body:input.body, attachment:input.attachment,
      parent_id:input.parentId || null, created_at:new Date().toISOString(), profile:me,
      reactions:{ like:0, dislike:0, mine:{ like:false, dislike:false } }, replyCount:0
    });
    rows.unshift(post);
    write(LOCAL_POSTS_KEY, rows.slice(0, 200));
    return post;
  }

  function savedPosts() { return read(SAVED_POSTS_KEY, {}) || {}; }
  function toggleSavedPost(post, button) {
    var rows = savedPosts(), active = !!rows[post.id];
    if (active) delete rows[post.id]; else rows[post.id] = Object.assign({},post);
    write(SAVED_POSTS_KEY, rows);
    if (button) {
      button.setAttribute('aria-pressed', String(!active));
      button.classList.toggle('is-active', !active);
    }
    global.dispatchEvent(new global.CustomEvent('lorefy:community-post-changed'));
  }
  async function mutatePost(post, changes) {
    if (post.user_id !== identity().id) throw new Error(uiText('لا يمكنك تعديل هذا المنشور', 'You cannot edit this post'));
    var backend = global.LorefyBackend;
    if (!isDemo()) {
      if (!backend || backend.mode !== 'live' || !backend.mutateCommunityPost) throw new Error(uiText('تعذر الاتصال', 'Connection unavailable'));
      var updated = await backend.mutateCommunityPost(post.id, changes);
      Object.assign(post, normalizePost(Object.assign({},post,updated)));
    } else {
      var rows = read(LOCAL_POSTS_KEY, []), found = false;
      rows.forEach(function (row) { if (String(row.id) === post.id) { Object.assign(row, changes); found = true; } });
      if (!found) throw new Error(uiText('المنشور غير متوفر', 'Post unavailable'));
      write(LOCAL_POSTS_KEY, rows);
      Object.assign(post, changes);
    }
    var saved = savedPosts();
    if (saved[post.id]) { if (post.is_deleted) delete saved[post.id]; else saved[post.id] = Object.assign({},post); write(SAVED_POSTS_KEY,saved); }
    replyActivityAt = 0;
    global.dispatchEvent(new global.CustomEvent('lorefy:community-post-changed', {detail:{postId:post.id}}));
    state.loaded = false;
    await loadPosts(true);
    return post;
  }
  function editPost(post) {
    if (doc.querySelector('.lf-community-edit')) return;
    var returnFocus = doc.activeElement;
    var modal = el('div', {class:'lf-community-edit',role:'dialog','aria-modal':'true','aria-label':uiText('تعديل المنشور','Edit post')});
    var input = el('textarea', {rows:'5',maxlength:'500','aria-label':uiText('نص المنشور','Post text')});
    input.value = post.body;
    var close = el('button', {type:'button','aria-label':uiText('إغلاق','Close')}, icon('x',20));
    var save = el('button', {type:'button',class:'lf-community-edit-save',text:uiText('حفظ التغييرات','Save changes')});
    var status = el('p', {role:'status','aria-live':'polite'});
    function dismiss() { modal.remove(); if (returnFocus && returnFocus.isConnected) returnFocus.focus(); }
    function valid() { save.disabled = !input.value.trim() && !Object.keys(post.attachment || {}).length; }
    input.addEventListener('input',valid);
    close.addEventListener('click',dismiss);
    modal.addEventListener('keydown',function (event) {
      if (event.key === 'Escape') dismiss();
      if (event.key === 'Tab') {
        var controls = [close,input,save].filter(function (node) { return !node.disabled; });
        if (event.shiftKey && doc.activeElement === controls[0]) { event.preventDefault(); controls[controls.length-1].focus(); }
        else if (!event.shiftKey && doc.activeElement === controls[controls.length-1]) { event.preventDefault(); controls[0].focus(); }
      }
    });
    save.addEventListener('click',async function () {
      if (save.disabled) return;
      save.disabled = true;
      try { await mutatePost(post,{body:input.value.trim()}); dismiss(); }
      catch (error) { status.textContent = uiText('تعذر الحفظ. بقي النص هنا؛ حاول مجددًا.','Could not save. Your text is kept here; try again.'); valid(); }
    });
    modal.appendChild(el('section',null,[el('header',null,[el('strong',{text:uiText('تعديل المنشور','Edit post')}),close]),input,status,save]));
    communityOverlayHost().appendChild(modal);
    valid(); hydrateIcons(modal); input.focus();
  }
  async function removePost(post, button) {
    button.disabled = true;
    try {
      await mutatePost(post,{is_deleted:true});
      var undo = el('div', {class:'lf-community-undo',role:'status'}, [el('span',{text:uiText('حُذف المنشور','Post deleted')})]);
      var restore = el('button', {type:'button',text:uiText('تراجع','Undo')});
      var close = el('button',{type:'button','aria-label':uiText('إغلاق','Close')},icon('x',18));
      restore.addEventListener('click',async function () {
        restore.disabled = true;
        try { await mutatePost(post,{is_deleted:false}); undo.remove(); }
        catch (_) { restore.disabled = false; toast(uiText('تعذر التراجع. حاول مجددًا.','Could not undo. Try again.')); }
      });
      close.addEventListener('click',function () { undo.remove(); });
      undo.appendChild(restore); undo.appendChild(close);
      communityOverlayHost().appendChild(undo); hydrateIcons(undo);
    } catch (_) { button.disabled = false; toast(uiText('تعذر حذف المنشور','Could not delete post')); }
  }
  function replyActivity() {
    var me = identity().id;
    var rows = isDemo() ? demoPosts() : replyActivityAccount === me ? replyActivityRows : [];
    var roots = new Map((isDemo() ? rows : state.posts.concat(replyActivityRoots)).map(function (row) { return [row.id,row]; }));
    return rows.filter(function (row) {
      var parent = roots.get(String(row.parent_id));
      return row.parent_id && !row.is_deleted && (!parent || !parent.is_deleted) && (row.user_id === me || parent && parent.user_id === me);
    }).map(function (row) {
      var parent = roots.get(String(row.parent_id));
      return {id:row.id,kind:row.user_id === me ? 'outgoing' : 'incoming',body:row.body,
        postId:row.parent_id,author:((row.user_id === me ? parent && parent.profile : row.profile) || {}).name || uiText('قارئ','Reader'),
        work:uiText('محادثة مجتمع','Community conversation'),createdAt:row.created_at};
    });
  }
  async function refreshReplyActivity() {
    if (isDemo()) return replyActivity();
    var me = identity().id, backend = global.LorefyBackend;
    if (!backend || backend.mode !== 'live') return [];
    if (replyActivityAccount === me && Date.now()-replyActivityAt < 30000) return replyActivity();
    var ownPosts = await backend.listCommunityPosts({userId:me,limit:60});
    if (identity().id !== me) return [];
    replyActivityRoots = ownPosts.map(normalizePost);
    var roots = replyActivityRoots.map(function (row) { return row.id; });
    var rows = await backend.listCommunityPosts({replyActivity:true,userId:me,parentIds:roots,limit:100});
    if (identity().id !== me) return [];
    replyActivityRows = rows.map(normalizePost); replyActivityAccount = me; replyActivityAt = Date.now();
    return replyActivity();
  }
  async function openThreadById(id) {
    var post = (isDemo() ? demoPosts() : state.posts).find(function (row) { return row.id === String(id); });
    if (!post && !isDemo() && global.LorefyBackend) {
      var rows = await global.LorefyBackend.listCommunityPosts({postId:id,limit:1});
      post = rows[0] && normalizePost(rows[0]);
    }
    if (post && !post.is_deleted) return openThread(post);
    toast(uiText('المنشور غير متوفر','Post unavailable'));
  }

  function attachmentItems(kind, source) {
    if (kind === "list") {
      return (source.works || []).slice(0, 10).map(function (id) {
        var work = workById(id);
        var customCovers = read("lorefy.user.customCovers.v2", {}) || {};
        return { id:String(id), name:workTitle(work), image:customCovers[id] || workCover(work) };
      });
    }
    var customImages = read("lorefy.characterCustomImages.v1", {}) || {};
    var cachedImages = read("lorefy.characterBoardImages.v1", {}) || {};
    return (source.chars || []).slice(0, 10).map(function (character) {
      var id = String(character.id || character.key || character.name || "");
      return { id:id, name:String(character.name || "شخصية"), image:String(customImages[id] || cachedImages[id] || character.img || character.image || character.cover || "") };
    });
  }

  function savedAttachments() {
    var lists = (read(LISTS_KEY, []) || []).map(function (list) {
      return { kind: "list", id:list.id, title:list.name || "قائمة أعمال", items:attachmentItems("list", list), accent:list.accent || "#007aff" };
    });
    var tops = (read(TOPS_KEY, []) || []).map(function (top) {
      var work = workById(top.mid);
      return { kind: "top", id:top.id, title:top.title ? "أفضل شخصيات " + top.title : "أفضل شخصيات " + workTitle(work), items:attachmentItems("top", top), accent:top.accent || "#7b2fd6" };
    });
    var quoteCore = global.LorefyReadingDiaryCore;
    var diary = read(DIARY_KEY, []);
    var quotes = (Array.isArray(diary) ? diary : []).filter(function (event) { return event && event.type === "quote" && !event.spoiler; }).map(function (event) {
      var work = workById(event.id);
      return quoteCore && quoteCore.communityQuote(event, { title:workTitle(work), cover:workCover(work) });
    }).filter(Boolean);
    return lists.concat(tops).filter(function (item) { return item.items.length; }).concat(quotes);
  }

  function quoteAttachment(source) {
    var core = global.LorefyReadingDiaryCore;
    if (!core || !source || source.kind !== "quote") return null;
    return core.communityQuote({ id:source.workId, type:"quote", quote:source.quote, anchorType:source.anchorType, anchorValue:source.anchorValue, spoiler:source.spoiler }, { title:source.title, cover:source.image });
  }

  function renderQuotePreview(attachment, removable) {
    var position = { chapter:"الفصل", page:"الصفحة", volume:"المجلد" }[attachment.anchorType] + " " + attachment.anchorValue;
    var art = el("span", { class:"lf-community-quote-cover" });
    if (attachment.image && /^(https?:|data:image\/|\/)/.test(attachment.image)) art.appendChild(el("img", { src:attachment.image, alt:"", loading:"lazy", decoding:"async", referrerpolicy:"no-referrer" }));
    else art.appendChild(icon("book-open", 20));
    var source = el("div", { class:"lf-community-quote-source" }, [art, el("span", null, [el("strong", { text:attachment.title, dir:"auto" }), el("small", { text:position })])]);
    var passage = el("blockquote", { text:attachment.quote, dir:"auto" });
    var preview = el("div", { class:"lf-community-quote-attachment" }, [passage, source]);
    if (removable) {
      var remove = el("button", { type:"button", class:"lf-community-attachment-remove", "aria-label":"إزالة الاقتباس" }, icon("x", 16));
      remove.addEventListener("click", function () { state.attachment = null; syncComposerAttachment(); });
      preview.appendChild(remove);
    }
    hydrateIcons(preview);
    return preview;
  }

  function renderAttachmentPreview(attachment, removable) {
    if (attachment && attachment.kind === "quote") {
      var validQuote = quoteAttachment(attachment);
      return validQuote ? renderQuotePreview(validQuote, removable) : null;
    }
    if (!attachment || !Array.isArray(attachment.items)) return null;
    var grid = el("div", { class:"lf-community-attachment-grid" });
    attachment.items.slice(0, 4).forEach(function (item, index) {
      var cell = el("span", { class:"lf-community-attachment-item" });
      var image = global.LorefyArtwork ? global.LorefyArtwork.display(item.image) : item.image;
      if (image) cell.appendChild(el("img", { src:image, alt:item.name || "", loading:"lazy", decoding:"async", referrerpolicy:"no-referrer" }));
      else cell.appendChild(el("b", { class:"lf-community-attachment-fallback", text:String(item.name || "عمل بلا غلاف") }));
      cell.appendChild(el("small", { text:(index + 1) + "" }));
      grid.appendChild(cell);
    });
    var card = el("div", { class:"lf-community-attachment lf-community-attachment-" + attachment.kind }, [
      el("header", null, [
        el("span", { class:"lf-community-attachment-type", text:attachment.kind === "top" ? "ترتيب الشخصيات" : "قائمة" }),
        el("strong", { text:attachment.title || "مشاركة من Lorefy" })
      ]),
      grid
    ]);
    card.style.setProperty("--attachment-accent", attachment.accent || "#007aff");
    if (removable) {
      var remove = el("button", { type:"button", class:"lf-community-attachment-remove", "aria-label":"إزالة المرفق" }, icon("x", 15));
      remove.addEventListener("click", function () { state.attachment = null; syncComposerAttachment(); });
      card.appendChild(remove);
    }
    hydrateIcons(card);
    return card;
  }

  function openAttachmentPicker(preferredKind) {
    var options = savedAttachments().filter(function (item) { return !preferredKind || item.kind === preferredKind; });
    var overlay = el("div", { class:"lf-community-picker", role:"dialog", "aria-modal":"true", "aria-label":"اختر ما تريد مشاركته" });
    var sheet = el("section", null, [
      el("header", null, [
        el("div", null, [el("strong", { text:"إرفاق بالمشاركة" }), el("p", { text:preferredKind === "quote" ? "اختر اقتباسًا من سجل القراءة" : "اختر عنصرًا محفوظًا" })]),
        el("button", { type:"button", "aria-label":"إغلاق" }, icon("x", 19))
      ])
    ]);
    sheet.querySelector("button").addEventListener("click", function () { overlay.remove(); });
    var body = el("div", { class:"lf-community-picker-list" });
    if (!options.length) body.appendChild(el("div", { class:"lf-community-picker-empty" }, [
      icon("list-plus", 26), el("strong", { text:"لا توجد عناصر جاهزة" }),
      el("p", { text:preferredKind === "quote" ? "احفظ اقتباسًا غير معلّم بالحرق في سجل القراءة أولًا." : "أضف عنصرًا إلى سجلك أو قوائمك أولًا." })
    ]));
    options.forEach(function (item) {
      var button = el("button", { type:"button", class:"lf-community-picker-option" }, [renderAttachmentPreview(item, false)]);
      button.addEventListener("click", function () { state.attachment = item; overlay.remove(); syncComposerAttachment(); });
      body.appendChild(button);
    });
    sheet.appendChild(body);
    overlay.appendChild(sheet);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) overlay.remove(); });
    communityOverlayHost().appendChild(overlay);
    hydrateIcons(overlay);
  }

  function syncComposerAttachment() {
    var scope = state.composeSheet || doc;
    var host = scope.querySelector(".lf-community-composer-attachment");
    if (!host) return;
    host.textContent = "";
    if (state.attachment) host.appendChild(renderAttachmentPreview(state.attachment, true));
    host.hidden = !state.attachment;
    try { if (global.lucide && global.lucide.createIcons) global.lucide.createIcons({ nodes:[host] }); } catch (error) {}
    var quoteMode = !!(state.attachment && state.attachment.kind === "quote");
    scope.classList.toggle("is-quote-composer", quoteMode);
    var heading = scope.querySelector(".lf-community-compose-head > strong");
    if (heading) heading.textContent = quoteMode ? "مشاركة اقتباس" : "منشور جديد";
    var submit = scope.querySelector(".lf-community-compose-submit");
    var textarea = scope.querySelector(".lf-community-compose-text");
    if (textarea) {
      textarea.placeholder = quoteMode ? "ما الذي لفتك في هذا المقطع؟" : "اكتب منشورك";
      textarea.rows = quoteMode ? 3 : 8;
    }
    if (submit) submit.disabled = !(String(textarea && textarea.value || "").trim() || state.attachment);
  }

  function closeComposerSheet(clearDraft) {
    var sheet = state.composeSheet;
    if (sheet) {
      var input = sheet.querySelector('.lf-community-compose-text');
      var key = sheet.dataset.draftOwner;
      if (clearDraft === true) composerDrafts.delete(key);
      else if (input && (input.value.trim() || state.attachment)) composerDrafts.set(key, {body:input.value,attachment:state.attachment});
      else composerDrafts.delete(key);
      if (composerDrafts.size > 20) composerDrafts.delete(composerDrafts.keys().next().value);
    }
    if (composerViewportCleanup) composerViewportCleanup();
    composerViewportCleanup = null;
    if (state.composeSheet) state.composeSheet.remove();
    state.composeSheet = null;
    state.attachment = null;
    if (composerReturnFocus && composerReturnFocus.isConnected) composerReturnFocus.focus({preventScroll:true});
  }

  function openComposerSheet(initialText) {
    if (state.composeSheet && state.composeSheet.isConnected) return;
    var options = initialText && typeof initialText === "object" && !Array.isArray(initialText) ? initialText : {};
    state.attachment = quoteAttachment(options.attachment) || null;
    var me = identity();
    var draftOwner = String(me.id || me.username || 'guest');
    var draft = !options.attachment && !options.initialText && typeof initialText !== 'string' && composerDrafts.get(draftOwner);
    if (draft) state.attachment = draft.attachment;
    composerReturnFocus = doc.activeElement;
    var textarea = el("textarea", { class:"lf-community-compose-text", maxlength:"500", rows:"8", placeholder:"اكتب منشورك", "aria-label":"اكتب منشورًا" });
    textarea.value = typeof initialText === "string" ? initialText.slice(0, 500) : String(options.initialText || draft && draft.body || "").slice(0, 500);
    var count = el("span", { class:"lf-community-compose-count", text:textarea.value.length + " / 500" });
    var meter = el('progress', {class:'lf-community-compose-meter',max:'500',value:String(textarea.value.length),'aria-label':doc.documentElement.lang === 'en' ? 'Post length' : 'طول المنشور'});
    var submit = el("button", { type:"button", class:"lf-community-compose-submit", text:"نشر" });
    submit.disabled = !(textarea.value.trim() || state.attachment);
    var close = el("button", { type:"button", class:"lf-community-compose-close", "aria-label":"إلغاء النشر", title:"إلغاء النشر" }, icon('x', 22));
    var attachmentHost = el("div", { class:"lf-community-composer-attachment", hidden:true });
    var composer = el("div", { class:"lf-community-compose-sheet", role:"dialog", "aria-modal":"true", "aria-label":"إنشاء منشور" }, [
      el("section", null, [
        el("header", { class:"lf-community-compose-head" }, [close, el("strong", { text:"منشور جديد" }), submit]),
        el("div", { class:"lf-community-composer-main" }, [
          avatar(me, 46),
          el("div", { class:"lf-community-composer-copy" }, [
            el("div", { class:"lf-community-composer-identity" }, [el("strong", { text:me.name }), el("small", { text:"@" + me.username, dir:"ltr" })]),
            el('span', {class:'lf-community-compose-audience'}, [icon('globe',14),el('span',{text:doc.documentElement.lang === 'en' ? 'Public' : 'عام'})]),
            textarea,
            attachmentHost
          ])
        ]),
        el("footer", { class:"lf-community-compose-footer" }, [
          el("div", { class:"lf-community-compose-tools lf-community-compose-modes", role:"group", "aria-label":"نوع المرفق" }, [
            el("button", { type:"button", "aria-label":"إرفاق قائمة", title:"إرفاق قائمة" }, [icon("list", 20), el("span", { text:"قائمة" })]),
            el("button", { type:"button", "aria-label":"إرفاق ترتيب الشخصيات", title:"إرفاق ترتيب الشخصيات" }, [icon("trophy", 20), el("span", { text:"ترتيب الشخصيات" })]),
            el("button", { type:"button", "aria-label":"إرفاق اقتباس", title:"إرفاق اقتباس" }, [icon("quote", 20), el("span", { text:"اقتباس" })])
          ]),
          el('div',{class:'lf-community-compose-length'},[meter,count])
        ])
      ])
    ]);
    state.composeSheet = composer;
    composer.dataset.draftOwner = draftOwner;
    function fitComposerViewport() {
      var viewport = global.visualViewport;
      var host = composer.parentElement;
      if (!host) return;
      var height = Math.min(host.clientHeight, viewport ? viewport.height : global.innerHeight);
      composer.style.setProperty('--composer-viewport-height', height + 'px');
      composer.style.setProperty('--composer-viewport-top', Math.max(0,(viewport ? viewport.offsetTop : 0) - host.getBoundingClientRect().top) + 'px');
      composer.classList.toggle('is-keyboard-open', !!viewport && global.innerHeight - viewport.height > 120);
    }
    global.addEventListener('resize',fitComposerViewport);
    if (global.visualViewport) {
      global.visualViewport.addEventListener('resize',fitComposerViewport);
      global.visualViewport.addEventListener('scroll',fitComposerViewport);
    }
    composerViewportCleanup = function () {
      global.removeEventListener('resize',fitComposerViewport);
      if (global.visualViewport) {
        global.visualViewport.removeEventListener('resize',fitComposerViewport);
        global.visualViewport.removeEventListener('scroll',fitComposerViewport);
      }
    };
    var toolButtons = composer.querySelectorAll(".lf-community-compose-tools button");
    var publishing = false;
    toolButtons[0].addEventListener("click", function () { openAttachmentPicker("list"); });
    toolButtons[1].addEventListener("click", function () { openAttachmentPicker("top"); });
    toolButtons[2].addEventListener("click", function () { openAttachmentPicker("quote"); });
    close.addEventListener("click", closeComposerSheet);
    composer.addEventListener("click", function (event) { if (event.target === composer && !publishing) closeComposerSheet(); });
    composer.addEventListener('keydown', function (event) {
      if (publishing) return;
      if (event.key === 'Escape' && !doc.querySelector('.lf-community-picker')) { event.preventDefault(); closeComposerSheet(); }
      if (event.key === 'Tab') {
        var controls = Array.prototype.slice.call(composer.querySelectorAll('button:not(:disabled),textarea:not(:disabled)'));
        var first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    textarea.addEventListener("input", function () {
      count.textContent = textarea.value.length + " / 500";
      meter.value = textarea.value.length;
      submit.disabled = publishing || !(textarea.value.trim() || state.attachment);
    });
    submit.addEventListener("click", async function () {
      if (publishing) return;
      var body = textarea.value.trim();
      if (!body && !state.attachment) return;
      var attachment = state.attachment && state.attachment.kind === "quote" ? quoteAttachment(state.attachment) : state.attachment;
      if (state.attachment && !attachment) { toast("تعذر إرفاق الاقتباس"); return; }
      publishing = true;
      close.disabled = true;
      textarea.disabled = true;
      toolButtons.forEach(function (button) { button.disabled = true; });
      submit.disabled = true;
      var kind = attachment && (attachment.kind === "list" || attachment.kind === "top") ? attachment.kind : "text";
      var input = { body:body, kind:kind, attachment:attachment || {} };
      try {
        var backend = global.LorefyBackend;
        var post;
        if (!isDemo() && backend && backend.mode === "live" && backend.publishCommunityPost) post = normalizePost(await backend.publishCommunityPost(input));
        else if (isDemo()) post = localSavePost(input);
        else throw new Error('تعذر الاتصال بالمجتمع. أعد المحاولة.');
        state.posts.unshift(post);
        renderPostFeed();
        closeComposerSheet(true);
        global.dispatchEvent(new global.CustomEvent('lorefy:community-post-changed'));
        toast("تم نشر المنشور");
      } catch (error) {
        console.warn("[Lorefy] publish post:", error);
        toast(error && error.message || "تعذر نشر المنشور");
      } finally {
        publishing = false;
        close.disabled = false;
        textarea.disabled = false;
        toolButtons.forEach(function (button) { button.disabled = false; });
        submit.disabled = !(textarea.value.trim() || state.attachment);
      }
    });
    communityOverlayHost().appendChild(composer);
    fitComposerViewport();
    hydrateIcons(composer);
    syncComposerAttachment();
    global.setTimeout(function () { if (composer.isConnected) textarea.focus({preventScroll:true}); }, 40);
  }

  function createComposerFab() {
    var button = el("button", { type:"button", class:"lf-community-compose-fab", "aria-label":"إنشاء منشور", title:"إنشاء منشور" }, icon("plus", 27));
    button.addEventListener("click", openComposerSheet);
    communityOverlayHost().appendChild(button);
    hydrateIcons(button);
    return button;
  }

  function setPostReaction(post, kind, button, peerButton) {
    if (button.dataset.busy === "1") return;
    button.dataset.busy = "1";
    post.reactions = post.reactions || { like:0, dislike:0, mine:{ like:false, dislike:false } };
    post.reactions.mine = post.reactions.mine || { like:false, dislike:false };
    var active = !post.reactions.mine[kind];
    var other = kind === "like" ? "dislike" : "like";
    var otherWasActive = !!post.reactions.mine[other];
    var finish = function () {
      post.reactions[kind] = Math.max(0, Number(post.reactions[kind] || 0) + (active ? 1 : -1));
      post.reactions.mine[kind] = active;
      if (active && otherWasActive) {
        post.reactions[other] = Math.max(0, Number(post.reactions[other] || 0) - 1);
        post.reactions.mine[other] = false;
      }
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      var count = button.querySelector("span");
      if (count) count.textContent = String(post.reactions[kind]);
      if (peerButton) {
        peerButton.classList.toggle("is-active", !!post.reactions.mine[other]);
        peerButton.setAttribute("aria-pressed", post.reactions.mine[other] ? "true" : "false");
        var peerCount = peerButton.querySelector("span");
        if (peerCount) peerCount.textContent = String(post.reactions[other] || 0);
      }
      button.dataset.busy = "0";
    };
    var backend = global.LorefyBackend;
    if (!isDemo() && backend && backend.mode === "live" && backend.setCommunityPostReaction) {
      backend.setCommunityPostReaction(post.id, kind, active).then(finish).catch(function (error) { button.dataset.busy = "0"; toast(error && error.message || "تعذر حفظ التفاعل"); });
    } else {
      finish();
      var savedReactions = read(LOCAL_REACTIONS_KEY, {}) || {};
      savedReactions[post.id] = post.reactions;
      write(LOCAL_REACTIONS_KEY, savedReactions);
      var rows = read(LOCAL_POSTS_KEY, []);
      var mine = rows.find(function (row) { return String(row.id) === post.id; });
      if (mine) { mine.reactions = post.reactions; write(LOCAL_POSTS_KEY, rows); }
    }
  }

  async function sharePost(post) {
    var quote = quoteAttachment(post.attachment);
    var text = (post.body ? post.body + "\n" : "") + (quote ? "«" + quote.quote + "»\n" + quote.title + " · " + { chapter:"الفصل", page:"الصفحة", volume:"المجلد" }[quote.anchorType] + " " + quote.anchorValue + "\n" : post.attachment && post.attachment.title ? post.attachment.title + "\n" : "") + "#Lorefy";
    var studio = global.LorefyShareStudio;
    if (post.kind !== "text" && studio && studio.buildCommunityPostFile && studio.nativeFileShare) {
      try {
        var file = await studio.buildCommunityPostFile(post);
        await studio.nativeFileShare(file, post.attachment.title || "مشاركة من Lorefy", text);
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
        toast(error && error.code === "LOREFY_SHARE_MEDIA_UNAVAILABLE" ? error.message : "تعذر تجهيز صورة المنشور. أعد المحاولة.");
        return;
      }
    }
    if (global.navigator.share) global.navigator.share({ title:"Lorefy", text:text }).catch(function () {});
    else if (global.navigator.clipboard) global.navigator.clipboard.writeText(text).then(function () { toast("تم نسخ المنشور"); });
  }

  function postCard(post, compact, onReply, beforeOverlay) {
    var profile = post.profile || {};
    var author = el("button", { type:"button", class:"lf-community-post-author" }, [
      avatar(profile, compact ? 34 : 42),
      el("span", null, [el("strong", { text:profile.name || profile.username || "قارئ Lorefy" }), el("small", { text:"@" + String(profile.username || "lorefy_reader") + " · " + timeLabel(post.created_at) })])
    ]);
    author.addEventListener("click", function () { openProfile(profile); });
    var hasQuote = !!quoteAttachment(post.attachment);
    var typeLabel = hasQuote ? "اقتباس" : post.kind === "list" ? "قائمة" : post.kind === "top" ? "ترتيب الشخصيات" : "منشور";
    var header = el("header", {class:'lf-community-post-header'}, [author, el("span", { class:"lf-community-post-kind is-" + (hasQuote ? "quote" : post.kind), text:typeLabel })]);
    if (post.user_id === identity().id) {
      var menu = el('details', {class:'lf-community-post-menu'});
      var trigger = el('summary', {'aria-label':uiText('خيارات المنشور','Post options'),title:uiText('خيارات المنشور','Post options')},icon('ellipsis',20));
      var edit = el('button',{type:'button',text:uiText('تعديل المنشور','Edit post')});
      var remove = el('button',{type:'button',class:'is-destructive',text:uiText('حذف المنشور','Delete post')});
      edit.addEventListener('click',function () { menu.open = false; if (beforeOverlay) beforeOverlay(); editPost(post); });
      remove.addEventListener('click',function () { menu.open = false; if (beforeOverlay) beforeOverlay(); removePost(post,remove); });
      menu.addEventListener('keydown',function (event) { if (event.key === 'Escape') { menu.open = false; trigger.focus(); } });
      menu.appendChild(trigger); menu.appendChild(el('div',null,[edit,remove])); header.appendChild(menu);
    }
    var body = el("p", { class:"lf-community-post-body", dir:"auto", text:post.body });
    var card = el("article", { class:"lf-community-post-card" + (compact ? " is-compact" : ""), "data-community-post-id":post.id, "data-community-post-kind":hasQuote ? "quote" : post.kind }, [header]);
    var replyTo = post.attachment && post.attachment.replyTo;
    if (replyTo && replyTo.id) {
      var reference = el('button',{type:'button',class:'lf-community-reply-reference',text:uiText('ردًا على @','Replying to @') + String(replyTo.username || uiText('قارئ','reader'))});
      reference.addEventListener('click',function () {
        var parent = Array.from(doc.querySelectorAll('[data-community-post-id]')).find(function (node) { return node.getAttribute('data-community-post-id') === String(replyTo.id); });
        if (parent) { parent.scrollIntoView({block:'center',behavior:'auto'}); parent.setAttribute('tabindex','-1'); parent.focus({preventScroll:true}); }
        else toast(uiText('الرد السابق غير متوفر في هذه الصفحة','The earlier reply is not on this page'));
      });
      card.appendChild(reference);
    }
    if (post.body) card.appendChild(body);
    if (hasQuote) card.appendChild(renderAttachmentPreview(post.attachment, false));
    else if (post.attachment && Array.isArray(post.attachment.items)) card.appendChild(renderAttachmentPreview(Object.assign({ kind:post.kind }, post.attachment), false));
    var mine = post.reactions && post.reactions.mine || {};
    var reply = el("button", { type:"button", "aria-label":compact ? "الرد على الرد" : "فتح الردود" }, [icon("message-circle", 18), el("span", { text:String(post.replyCount || 0) })]);
    var like = el("button", { type:"button", class:"lf-community-post-like" + (mine.like ? " is-active" : ""), "aria-label":"إعجاب", "aria-pressed":mine.like ? "true" : "false" }, [icon("heart", 18), el("span", { text:String(post.reactions && post.reactions.like || 0) })]);
    var dislike = el("button", { type:"button", class:"lf-community-post-dislike" + (mine.dislike ? " is-active" : ""), "aria-label":"عدم إعجاب", "aria-pressed":mine.dislike ? "true" : "false" }, [icon("thumbs-down", 18), el("span", { text:String(post.reactions && post.reactions.dislike || 0) })]);
    var share = el("button", { type:"button", "aria-label":"مشاركة" }, [icon("share-2", 18)]);
    var saved = !!savedPosts()[post.id];
    var bookmark = el('button',{type:'button','aria-label':uiText('حفظ المنشور','Save post'),'aria-pressed':String(saved),class:saved ? 'is-active' : ''},icon('bookmark',18));
    bookmark.addEventListener('click',function () { toggleSavedPost(post,bookmark); });
    reply.addEventListener("click", function () { if (onReply) onReply(post); else { if (beforeOverlay) beforeOverlay(); openThread(post); } });
    like.addEventListener("click", function () { setPostReaction(post, "like", like, dislike); });
    dislike.addEventListener("click", function () { setPostReaction(post, "dislike", dislike, like); });
    share.addEventListener("click", function () { if (beforeOverlay) beforeOverlay(); sharePost(post); });
    card.appendChild(el("footer", { class:"lf-community-post-actions" }, [reply, like, dislike, bookmark, share]));
    if (!compact) {
      card.tabIndex = 0;
      function activateThread() { if (beforeOverlay) beforeOverlay(); openThread(post); }
      card.addEventListener('click',function(event){
        if(event.target.closest('button,a,input,textarea,summary,details'))return;
        if(global.getSelection && String(global.getSelection()))return;
        activateThread();
      });
      card.addEventListener('keydown',function(event){
        if(event.target===card && (event.key==='Enter' || event.key===' ')){event.preventDefault();activateThread();}
      });
    }
    hydrateIcons(card);
    return card;
  }

  async function threadReplies(post, replyBefore) {
    var backend = global.LorefyBackend;
    if (!isDemo() && backend && backend.mode === "live" && backend.listCommunityPosts) return (await backend.listCommunityPosts({ parentId:post.id, limit:40, latestReplies:true, before:replyBefore })).map(normalizePost).reverse();
    var local = read(LOCAL_POSTS_KEY, []).filter(function (row) { return String(row.parent_id || "") === post.id; });
    return mergedDemoReplies(post,local).filter(function (row) { return !replyBefore || row.created_at < replyBefore.created_at || row.created_at === replyBefore.created_at && row.id < replyBefore.id; }).sort(function (a, b) { return new Date(a.created_at) - new Date(b.created_at) || a.id.localeCompare(b.id); }).slice(-40);
  }

  function replyContext(post) {
    return post ? {id:String(post.id),username:String(post.profile && post.profile.username || '').slice(0,80)} : null;
  }
  async function openThread(post) {
    if (doc.querySelector('.lf-community-thread')) return;
    var sending = false;
    var repliesRequest = 0, replyRows = [], hasOlderReplies = false;
    var previousFocus = doc.activeElement;
    var overlay = el("div", { class:"lf-community-thread", role:"dialog", "aria-modal":"true", "aria-label":"محادثة المنشور" });
    var close = el("button", { type:"button", class:"lf-community-thread-close", "aria-label":"إغلاق" }, icon("x", 20));
    var repliesHost = el("div", { class:"lf-community-thread-replies" }, [el("p", { class:"lf-community-thread-loading", text:"جارٍ تحميل الردود..." })]);
    var input = el("textarea", { rows:"1", dir:"auto", maxlength:"500", placeholder:"اكتب رداً...", "aria-label":"اكتب رداً" });
    var replyTarget = null;
    var targetLabel = el('span');
    var clearTarget = el('button',{type:'button','aria-label':uiText('إلغاء الرد المحدد','Cancel reply target')},icon('x',18));
    var targetBar = el('div',{class:'lf-community-reply-target',hidden:true},[targetLabel,clearTarget]);
    clearTarget.addEventListener('click',function () { replyTarget = null; targetBar.hidden = true; input.focus(); });
    var send = el("button", { type:"button", disabled:"disabled", "aria-label":"إرسال الرد" }, icon("send", 18));
    var draftKey = String(identity().id || identity().username) + ':' + post.id;
    input.value = replyDrafts.get(draftKey) || '';
    send.disabled = !input.value.trim();
    function targetReply(replyPost) {
      var username = String(replyPost && replyPost.profile && replyPost.profile.username || "");
      replyTarget = replyPost.id === post.id ? null : replyPost;
      targetBar.hidden = !replyTarget;
      targetLabel.textContent = uiText('ردًا على @','Replying to @') + username;
      input.focus();
    }
    var sheet = el("section", null, [
      el("header", { class:"lf-community-thread-head" }, [close, el("strong", { text:"المنشور" }), el("span", { "aria-hidden":"true" })]),
      el("div", { class:"lf-community-thread-body" }, [el("div", { class:"lf-community-thread-origin" }, [postCard(post, true, targetReply)]), repliesHost]),
      targetBar, el("footer", { class:"lf-community-thread-compose" }, [avatar(identity(), 36), input, send])
    ]);
    function dismiss() {
      repliesRequest++;
      global.removeEventListener('lorefy:community-post-changed',changed);
      overlay.remove();
      if (global.visualViewport) {
        global.visualViewport.removeEventListener('resize', fitViewport);
        global.visualViewport.removeEventListener('scroll', fitViewport);
      }
      if (previousFocus && previousFocus.isConnected) previousFocus.focus({preventScroll:true});
    }
    function fitViewport() {
      var viewport = global.visualViewport;
      if (!viewport) return;
      overlay.style.height = viewport.height + 'px';
      overlay.style.top = viewport.offsetTop + 'px';
    }
    close.addEventListener("click", dismiss);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) dismiss(); });
    overlay.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') dismiss();
      if (event.key !== 'Tab') return;
      var controls = Array.from(overlay.querySelectorAll('button:not(:disabled), textarea, a[href]'));
      var first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    input.addEventListener("input", function () {
      if (input.value) replyDrafts.set(draftKey, input.value); else replyDrafts.delete(draftKey);
      if (replyDrafts.size > 30) replyDrafts.delete(replyDrafts.keys().next().value);
      send.disabled = sending || !input.value.trim();
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight,110) + 'px';
    });
    async function paintReplies(older) {
      var request = ++repliesRequest;
      var replyBefore = older && replyRows[0] || null;
      var scrollBody = sheet.querySelector('.lf-community-thread-body');
      var scrollHeight = scrollBody.scrollHeight, scrollTop = scrollBody.scrollTop;
      try {
        var chunk = await threadReplies(post, replyBefore);
        if (!overlay.isConnected || request !== repliesRequest) return;
        hasOlderReplies = chunk.length === 40;
        replyRows = Array.from(new Map((older ? chunk.concat(replyRows) : chunk).map(function (row) { return [row.id, row]; })).values()).sort(function (a,b) { return new Date(a.created_at)-new Date(b.created_at) || a.id.localeCompare(b.id); });
        if (!older && chunk.length < 40) {
          post.replyCount = chunk.length;
          var count = sheet.querySelector('.lf-community-thread-origin .lf-community-post-actions button span');
          if (count) count.textContent = String(post.replyCount);
        }
        var replies = replyRows;
        repliesHost.textContent = "";
        if (hasOlderReplies || older && chunk.length === 40) {
          var previous = el('button', { type:'button', class:'lf-community-load-more', text:'عرض الردود السابقة' });
          previous.addEventListener('click', function () { previous.disabled = true; paintReplies(true); }); repliesHost.appendChild(previous);
        }
        if (!replies.length) repliesHost.appendChild(el("p", { class:"lf-community-thread-empty", text:"كن أول من يرد" }));
        replies.forEach(function (replyPost) {
          var row = el("div", { class:"lf-community-thread-reply" }, [
            el("span", { class:"lf-community-thread-rail", "aria-hidden":"true" }),
            postCard(replyPost, true, targetReply)
          ]);
          repliesHost.appendChild(row);
        });
        hydrateIcons(repliesHost);
        if (older) scrollBody.scrollTop = scrollTop + scrollBody.scrollHeight - scrollHeight;
      } catch (error) {
        if (!overlay.isConnected || request !== repliesRequest) return;
        var retry = el('button', { type:'button', class:'lf-community-retry', text:'تعذر تحميل الردود · إعادة المحاولة' });
        retry.addEventListener('click', function () { retry.remove(); paintReplies(older); }); repliesHost.appendChild(retry);
      }
    }
    send.addEventListener("click", async function () {
      var body = input.value.trim();
      if (!body || sending) return;
      sending = true;
      send.disabled = true;
      try {
        var backend = global.LorefyBackend;
        var attachment = {replyTo:replyContext(replyTarget)};
        if (!isDemo() && backend && backend.mode === "live" && backend.replyCommunityPost) await backend.replyCommunityPost(post.id, body,attachment);
        else localSavePost({ kind:"text", body:body, attachment:{replyTo:replyContext(replyTarget)}, parentId:post.id });
      post.replyCount += 1;
        replyActivityAt = 0;
        if (input.value.trim() === body) input.value = "";
        replyTarget = null; targetBar.hidden = true;
        input.dispatchEvent(new global.Event('input'));
        input.style.height = 'auto';
        await paintReplies();
        var scrollBody = sheet.querySelector('.lf-community-thread-body');
        scrollBody.scrollTop = scrollBody.scrollHeight;
        renderPostFeed();
      } catch (error) { toast(error && error.message || "تعذر إرسال الرد"); }
      finally { sending = false; send.disabled = !input.value.trim(); }
    });
    overlay.appendChild(sheet);
    communityOverlayHost().appendChild(overlay);
    fitViewport();
    if (global.visualViewport) {
      global.visualViewport.addEventListener('resize', fitViewport);
      global.visualViewport.addEventListener('scroll', fitViewport);
    }
    hydrateIcons(overlay);
    close.focus({preventScroll:true});
    function changed() {
      if (!overlay.isConnected) { global.removeEventListener('lorefy:community-post-changed',changed); return; }
      if (post.is_deleted) { dismiss(); return; }
      var origin = sheet.querySelector('.lf-community-thread-origin');
      origin.textContent = ''; origin.appendChild(postCard(post,true,targetReply));
      paintReplies();
    }
    global.addEventListener('lorefy:community-post-changed',changed);
    await paintReplies();
  }

  function renderPostFeed() {
    var host = doc.querySelector(".lf-community-post-feed");
    if (!host) return;
    var list = host.querySelector(".lf-community-post-list");
    if (!list) return;
    var posts = visibleCommunityPosts();
    var signature = JSON.stringify([posts, state.filter, !!state.error, !!state.loading,
      !!state.hasMore, state.reviewFeed || {}, doc.documentElement.lang, Math.floor(Date.now() / 60000)]);
    if (host.__lorefyFeedSignature === signature && host.__lorefyFeedList === list) return;
    host.__lorefyFeedSignature = signature;
    host.__lorefyFeedList = list;
    list.textContent = "";
    if (state.error) {
      var retry = el('button', { type:'button', class:'lf-community-retry', text:uiText('تعذر تحميل المنشورات · إعادة المحاولة', 'Could not load posts · Retry') });
      retry.disabled = state.loading;
      retry.addEventListener('click', function () { loadPosts(true); }); list.appendChild(retry);
    }
    var status = host.querySelector(":scope > header > span");
    if (status) status.textContent = state.filter === "friends" ? uiText('المتابَعون', 'Following') : state.filter === "mine" ? uiText('محتواك', 'Your posts') : state.filter === "popular" ? uiText('الأكثر تفاعلاً', 'Popular') : uiText('الأحدث', 'Latest');
    if (!posts.length && !state.error) {
      var emptyTitle = state.filter === "friends" ? uiText('لا توجد منشورات من الحسابات التي تتابعها', 'No posts from people you follow yet') : state.filter === "mine" ? uiText('لا توجد منشورات لك بعد', 'You have not posted yet') : uiText('ابدأ أول محادثة', 'Start the first conversation');
      var emptyBody = state.filter === "friends" ? uiText('تابع قرّاء جدد لتظهر منشوراتهم هنا.', 'Follow new readers to see their posts here.') : uiText('اكتب فكرة أو شارك قائمة من حسابك.', 'Share a thought or a list from your profile.');
      list.appendChild(el("div", { class:"lf-community-post-empty" }, [icon("messages-square", 26), el("strong", { text:emptyTitle }), el("p", { text:emptyBody })]));
      if(state.filter==="friends"){
        var findReaders=el('button',{type:'button',class:'lf-community-load-more',text:doc.documentElement.lang==='en'?'Find readers':'اكتشف قرّاء'});
        findReaders.addEventListener('click',function(){global.dispatchEvent(new CustomEvent('lorefy:find-readers'));});
        list.querySelector('.lf-community-post-empty').appendChild(findReaders);
      }
    }
    posts.forEach(function (post) {
      var card = postCard(post, false);
      card.dataset.postTimestamp = String(Date.parse(post.created_at) || 0);
      list.appendChild(card);
    });
    if (state.hasMore) {
      var more = el('button', { type:'button', class:'lf-community-load-more', text:state.loading ? uiText('جارٍ التحميل…', 'Loading...') : uiText('عرض منشورات أقدم', 'Older posts') });
      more.disabled = state.loading; more.addEventListener('click', function () { loadPosts(true, true); }); list.appendChild(more);
    }
    var reviewFeed = state.reviewFeed || {};
    if (reviewFeed.hasMore || reviewFeed.error) {
      var reviewMore = el('button', { type:'button', class:'lf-community-load-more', 'data-review-pagination':'true',
        text:reviewFeed.loading ? uiText('جار التحميل...', 'Loading...') : reviewFeed.error ? uiText('إعادة تحميل المراجعات', 'Retry reviews') : uiText('عرض مراجعات أقدم', 'Older reviews') });
      reviewMore.disabled = !!reviewFeed.loading;
      reviewMore.addEventListener('click', function () {
        global.dispatchEvent(new global.CustomEvent(reviewFeed.error ? 'lorefy:community-refresh' : 'lorefy:load-more-reviews'));
      });
      list.appendChild(reviewMore);
    }
    orderCommunityFeed();
    hydrateIcons(list);
  }

  function orderCommunityFeed() {
    var page = state.page;
    if (!page || !page.isConnected) return;
    page.classList.add('lf-social-timeline');
    var cards = Array.prototype.slice.call(page.querySelectorAll('[data-post-timestamp], [data-review-timestamp]'));
    cards.sort(function (a, b) {
      return Number(b.dataset.postTimestamp || b.dataset.reviewTimestamp || 0) - Number(a.dataset.postTimestamp || a.dataset.reviewTimestamp || 0);
    }).forEach(function (card, index) { card.style.order = String(index); });
    var empty = page.querySelector('.lf-community-post-empty');
    if (empty) empty.hidden = cards.length > 0;
  }

  function visibleCommunityPosts() {
    var me = identity();
    var followed = new Set(state.followedIds.map(String));
    var rows = state.posts.filter(function (post) { return !post.parent_id; });
    if (state.filter === "friends") rows = rows.filter(function (post) { return followed.has(String(post.user_id || "")); });
    else if (state.filter === "mine") rows = rows.filter(function (post) {
      return String(post.user_id || "") === String(me.id || "") || String(post.profile && post.profile.username || "").replace(/^@/, "").toLowerCase() === String(me.username || "").replace(/^@/, "").toLowerCase();
    });
    else if (state.filter === "popular") rows = rows.slice().sort(function (left, right) {
      var leftScore = Number(left.replyCount || 0) * 2 + Number(left.reactions && left.reactions.like || 0) + Number(left.reactions && left.reactions.dislike || 0);
      var rightScore = Number(right.replyCount || 0) * 2 + Number(right.reactions && right.reactions.like || 0) + Number(right.reactions && right.reactions.dislike || 0);
      return rightScore - leftScore || new Date(right.created_at) - new Date(left.created_at);
    });
    return rows;
  }

  function createPostFeed() {
    return el("section", { class:"lf-community-post-feed", "aria-label":"منشورات المجتمع" }, [
      el("header", null, [el("div", null, [el("strong", { text:"المنشورات" })]), el("span", { text:"الأحدث" })]),
      el("div", { class:"lf-community-post-list" })
    ]);
  }

  function postsForReader(profile) {
    var id = String(profile && profile.id || "");
    var username = String(profile && profile.username || "").replace(/^@/, "").toLowerCase();
    var available = state.posts.length ? state.posts : (isDemo() ? demoPosts() : state.posts);
    return available.filter(function (post) {
      return (id && String(post.user_id || "") === id) || (username && String(post.profile && post.profile.username || "").toLowerCase() === username);
    });
  }

  function openReaderPosts(profile) {
    profile = profile || identity();
    var overlay = el("div", { class:"lf-community-profile-posts", role:"dialog", "aria-modal":"true", "aria-label":"منشورات القارئ" });
    var close = el("button", { type:"button", "aria-label":"إغلاق" }, icon("x", 19));
    var list = el("div", { class:"lf-community-profile-posts-list" });
    var rows = postsForReader(profile);
    if (rows.length) rows.forEach(function (post) { list.appendChild(postCard(post, false)); });
    else list.appendChild(el("div", { class:"lf-community-post-empty" }, [icon("messages-square", 28), el("strong", { text:"لا توجد منشورات بعد" }), el("p", { text:"ستظهر منشورات هذا القارئ هنا." })]));
    overlay.appendChild(el("section", null, [
      el("header", null, [close, el("div", null, [el("strong", { text:"المنشورات" }), el("small", { text:"@" + String(profile.username || "lorefy_reader").replace(/^@/, ""), dir:"ltr" })]), el("span", { text:String(rows.length) })]),
      list
    ]));
    close.addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (event) { if (event.target === overlay) overlay.remove(); });
    communityOverlayHost().appendChild(overlay);
    hydrateIcons(overlay);
  }

  async function readProfilePosts(profile, before) {
    var backend = global.LorefyBackend;
    if (!profile || !profile.id) return [];
    if (!isDemo() && backend && backend.mode === 'live') {
      return (await backend.listCommunityPosts({ userId:profile.id, limit:50, before:before || null })).map(normalizePost);
    }
    if (!isDemo()) throw new Error(uiText('تعذر الاتصال بالمجتمع', 'Community is unavailable'));
    var rows = demoPosts().filter(function(post) {
      return String(post.user_id) === String(profile.id) && !post.parent_id && !post.is_deleted;
    });
    if (before) rows = rows.filter(function(post) {
      return post.created_at < before.created_at || post.created_at === before.created_at && post.id < before.id;
    });
    return rows.slice(0,50);
  }

  function metricLeaf(page, label) {
    var labels = Array.isArray(label) ? label : [label];
    var nodes = page.querySelectorAll("span,p,small,strong");
    for (var i=0; i<nodes.length; i++) if (labels.indexOf(String(nodes[i].textContent || "").trim()) >= 0) return nodes[i];
    return null;
  }

  function metricItem(leaf) {
    var node = leaf && leaf.parentElement;
    for (var i=0; node && i<4; i++, node=node.parentElement) {
      if (node.parentElement && node.parentElement.children.length >= 3 && node.parentElement.children.length <= 7) return node;
    }
    return leaf && leaf.parentElement;
  }

  function ensureOwnerPostMetric() {
    var page = doc.querySelector(".lf-profile-page:not(.lf-public-profile-page), .lf-profile-screen, [data-lf-owner-profile]");
    if (!page) return false;
    var me = identity();
    var count = postsForReader(me).filter(function (post) { return !post.parent_id; }).length;
    var existing = page.querySelector(".lf-owner-post-metric");
    if (existing) {
      var existingCount = existing.querySelector("strong");
      if (existingCount && existingCount.textContent !== String(count)) existingCount.textContent = String(count);
      var existingLabel = existing.querySelector('span');
      var label = uiText('منشور', count === 1 ? 'Post' : 'Posts');
      if (existingLabel && existingLabel.textContent !== label) existingLabel.textContent = label;
      if(existing.getAttribute('data-no-translate')!=='1')existing.setAttribute('data-no-translate','1');
      var accessibleLabel=uiText('عرض منشوراتي','View my posts');
      if(existing.getAttribute('aria-label')!==accessibleLabel)existing.setAttribute('aria-label',accessibleLabel);
      return true;
    }
    var reviewLeaf = metricLeaf(page, ["مراجعة", "Review", "Reviews"]);
    var completedLeaf = metricLeaf(page, ["مكتملة", "مكتمل", "Completed"]);
    if (!reviewLeaf || !completedLeaf) return false;
    var reviewItem = metricItem(reviewLeaf);
    var completedItem = metricItem(completedLeaf);
    if (!reviewItem || !completedItem || reviewItem.parentElement !== completedItem.parentElement) return false;
    var button = el("button", { type:"button", class:"lf-owner-post-metric", "data-no-translate":"1", "data-profile-stat":"MessagesSquare", "aria-label":uiText("عرض منشوراتي", "View my posts") }, [
      icon("messages-square", 21), el("strong", { text:String(count) }), el("span", { text:uiText("منشور", count === 1 ? "Post" : "Posts") })
    ]);
    button.addEventListener("click", function () {
      if (global.LorefyProfileSections) global.dispatchEvent(new global.CustomEvent('lorefy:open-profile-section', {detail:{tab:'posts'}}));
      else openReaderPosts(me);
    });
    reviewItem.parentElement.insertBefore(button, completedItem);
    reviewItem.parentElement.classList.add("lf-owner-metrics-with-posts");
    hydrateIcons(button);
    return true;
  }

  function markLegacyCommunitySections(page) {
    var children = Array.prototype.slice.call(page.children);
    var tabs = page.querySelector(":scope > .lf-community-tabs");
    children.forEach(function (child) {
      if (child === tabs || child.classList.contains("lf-community-compose-fab") || child.classList.contains("lf-community-post-feed")) return;
      if (child.matches("article.lf-community-card")) child.classList.add("lf-community-review-post");
      else if (/أشخاص قد تعرفهم/.test(child.textContent || "")) child.classList.add("lf-community-people-rail");
      else if (/أوصي بها/.test(child.textContent || "")) child.classList.add("lf-community-recommendation-rail");
    });
  }

  function filterForCommunityTab(button) {
    var identity = button && button.dataset && button.dataset.communityFilter;
    if (/^(all|friends|mine|popular)$/.test(identity || "")) return identity;
    var label = String(button && button.textContent || "").trim();
    if (/الأصدقاء|أتابعهم|^Friends$|^Following$/.test(label)) return "friends";
    if (/مراجعاتي|منشوراتي|^My reviews$|^My posts$/.test(label)) return "mine";
    if (/المشهورة|الأكثر تفاعلاً|^Popular$/.test(label)) return "popular";
    return "all";
  }

  function syncCommunityTabSemantics(tabs) {
    if (!tabs) return;
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", uiText("تصفية منشورات المجتمع", "Community filters"));
    Array.prototype.forEach.call(tabs.querySelectorAll("button"), function (button) {
      var filter = filterForCommunityTab(button);
      button.dataset.communityFilter = filter;
      var labels = doc.documentElement.lang === "en"
        ? { all:"For You", friends:"Following", mine:"My posts", popular:"Popular" }
        : { all:"لك", friends:"أتابعهم", mine:"منشوراتي", popular:"الأكثر تفاعلاً" };
      if (button.textContent !== labels[filter]) button.textContent = labels[filter];
      var selected = filter === state.filter;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.setAttribute("aria-controls", "lf-community-post-feed");
      button.tabIndex = selected ? 0 : -1;
      button.classList.toggle("is-active", selected);
      if (button.dataset.communityFilterBound !== "1") {
        button.dataset.communityFilterBound = "1";
        button.addEventListener("click", function () {
          state.filter = filterForCommunityTab(button);
          syncCommunityTabSemantics(tabs);
          renderPostFeed();
        });
        button.addEventListener('keydown', function (event) {
          if (!/^(ArrowLeft|ArrowRight|Home|End)$/.test(event.key)) return;
          event.preventDefault();
          var buttons = Array.prototype.slice.call(tabs.querySelectorAll('button'));
          var index = buttons.indexOf(button);
          var next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + 1) % buttons.length;
          buttons[next].click(); buttons[next].focus({preventScroll:true});
        });
      }
    });
  }

  function communityFilterTabs(page) {
    return Array.prototype.find.call(page.children, function (child) {
      var buttons = child.querySelectorAll(":scope > button");
      return buttons.length === 2 && buttons[0].dataset.communityFilter === 'all' && buttons[1].dataset.communityFilter === 'friends';
    }) || null;
  }

  function enhance() {
    var page = doc.querySelector(".lf-community-page");
    if (!page) {
      var staleFab = doc.querySelector(".lf-community-compose-fab");
      if (staleFab) staleFab.remove();
      doc.querySelectorAll(".lf-community-post-feed").forEach(function (feed) { feed.remove(); });
      state.page = null;
      return false;
    }
    if (state.page !== page) {
      state.feedRequest = (state.feedRequest || 0) + 1; state.loading = false; state.hasMore = false; state.error = false; state.page = page; state.loaded = false; state.posts = [];
      var selectedTab = page.querySelector('[data-community-filter][aria-selected="true"]');
      state.filter = selectedTab ? filterForCommunityTab(selectedTab) : "all";
      state.followedIds = []; state.followsLoaded = false; state.legacySeedAttempted = false;
    }
    page.classList.add("lf-community-v2");
    var tabs = communityFilterTabs(page);
    if (tabs) { tabs.classList.add("lf-community-tabs"); syncCommunityTabSemantics(tabs); }
    var legacyComposer = page.querySelector(":scope > .lf-community-composer");
    if (legacyComposer) legacyComposer.remove();
    var host = communityOverlayHost();
    var fab = host.querySelector(":scope > .lf-community-compose-fab") || doc.querySelector(".lf-community-compose-fab");
    if (!fab) fab = createComposerFab();
    else if (fab.parentElement !== host) host.appendChild(fab);
    var feed = page.querySelector(":scope > .lf-community-post-feed");
    var activity = page.querySelector(":scope > .lf-friend-activity");
    var feedAnchor = activity || tabs;
    if (!feed) {
      feed = createPostFeed();
      feed.id = "lf-community-post-feed";
      if (feedAnchor && feedAnchor.nextSibling) page.insertBefore(feed, feedAnchor.nextSibling); else if (feedAnchor) page.appendChild(feed); else page.insertBefore(feed, page.firstChild);
    } else if (!feed.id) feed.id = "lf-community-post-feed";
    markLegacyCommunitySections(page);
    orderCommunityFeed();
    if (state.loaded && !state.legacySeedAttempted && state.posts.length === 0 && page.querySelector(".lf-review-card")) {
      state.legacySeedAttempted = true;
      state.loaded = false;
    }
    if (feedAnchor && feed.previousElementSibling !== feedAnchor) feedAnchor.insertAdjacentElement('afterend', feed);
    loadPosts(false);
    return true;
  }

  function scheduleRefresh() {
    global.clearTimeout(state.refreshTimer);
    state.refreshTimer = global.setTimeout(function () { state.loaded = false; loadPosts(true); }, 180);
  }

  function boot() {
    if (global.LorefyPageRefresh) global.LorefyPageRefresh.register('community-posts', function (context) { return loadPosts(true, false, context); });
    enhance();
    ensureOwnerPostMetric();
    if (!state.loaded) loadPosts(false).then(ensureOwnerPostMetric);
    var refreshScheduled = false;
    function scheduleEnhance() {
      if (refreshScheduled) return;
      refreshScheduled = true;
      global.requestAnimationFrame(function () {
        refreshScheduled = false;
        enhance();
        ensureOwnerPostMetric();
      });
    }
    var observer = new MutationObserver(function (mutations) {
      if (!mutations.some(function (mutation) {
        return Array.prototype.some.call(mutation.addedNodes, function (node) { return node.nodeType === 1; }) ||
          Array.prototype.some.call(mutation.removedNodes, function (node) { return node.nodeType === 1; });
      })) return;
      scheduleEnhance();
    });
    observer.observe(doc.documentElement, { childList:true, subtree:true });
    global.addEventListener("lorefy:routechange", scheduleEnhance);
    var backend = global.LorefyBackend;
    if (!isDemo() && backend && backend.subscribeCommunity) backend.subscribeCommunity(scheduleRefresh).then(function (unsubscribe) { state.unsubscribe = unsubscribe; }).catch(function () {});
    global.addEventListener("lorefy:open-reader-posts", function (event) { openReaderPosts(event.detail || identity()); });
    global.addEventListener("lorefy:profile-follow-changed", function (event) {
      var detail = event.detail || {};
      var id = String(detail.profileId || "");
      var followed = new Set(state.followedIds.map(String));
      if (detail.following === true) followed.add(id); else followed.delete(id);
      state.followedIds = Array.from(followed);
      state.followsLoaded = true;
      if (state.filter === "friends") renderPostFeed();
    });
  }

  global.addEventListener('lorefy:review-feed-state', function (event) {
    state.reviewFeed = Object.assign({}, state.reviewFeed || {}, event.detail || {});
    renderPostFeed();
  });
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
  global.LorefyCommunity = { enhance:enhance, openThread:openThread, openThreadById:openThreadById, replyActivity:replyActivity,
    refreshReplyActivity:refreshReplyActivity, savedPosts:savedPosts, toggleSavedPost:toggleSavedPost, postCard:postCard,
    openComposer:openComposerSheet, openReaderPosts:openReaderPosts, readProfilePosts:readProfilePosts, refresh:function () { state.loaded = false; return loadPosts(true); } };
})(typeof window !== "undefined" ? window : this);
