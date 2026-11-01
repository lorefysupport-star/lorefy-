/* ════════════════════════════════════════════════════════════════════════
   Lorefy — Growth features  ·  Character Rating system   (growth-v15)
   → window.LorefyGrowth

   What this module does
   ─────────────────────
   • Adds a "تقييم الشخصيات" (Rate Characters) action on every work‑detail
     screen, sitting RIGHT NEXT TO the "اكتب مراجعة" (Write a review) button.
   • Opens a full, Apple‑styled character‑rating page: hero, search + filters,
     a per‑character 1–5 score control, an inline review composer, and an
     "add character" row.
   • Loads the cast from MAL / Jikan with an AniList GraphQL fallback. Works
     fully as a TEMPLATE with zero network (cast falls back to a sample set),
     so the design is always populated.
   • Persists scores + review to NEW localStorage keys only — it never touches
     the app's existing keys, routes, data or DOM ownership.

   Styling lives in styles/lorefy-system.css (the .lf-character-* classes).
   This file only builds DOM + behaviour; it adds no colors of its own.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";

  var doc = global.document;
  if (!doc) return;

  /* ── small helpers ─────────────────────────────────────────────────── */
  var params = (function () { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(""); } });
  function qp(key) { try { return params().get(key); } catch (e) { return null; } }
  function el(tag, props, kids) {
    var node = doc.createElement(tag);
    if (props) for (var k in props) {
      if (k === "class") node.className = props[k];
      else if (k === "html") node.innerHTML = props[k];
      else if (k === "text") node.textContent = props[k];
      else if (k.slice(0, 2) === "on" && typeof props[k] === "function") node.addEventListener(k.slice(2).toLowerCase(), props[k]);
      else if (k === "style") node.setAttribute("style", props[k]);
      else if (props[k] != null) node.setAttribute(k, props[k]);
    }
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? doc.createTextNode(c) : c);
    });
    return node;
  }
  function read(key, fallback) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function write(key, val) { try { var serialized=JSON.stringify(val); if(global.LorefyStorageBudget)return global.LorefyStorageBudget.write(localStorage,key,serialized);localStorage.setItem(key,serialized);return true; } catch (e) { return false; } }
  global.addEventListener('lorefy:image-error', function (event) {
    toastSafe(event.detail && event.detail.message || 'تعذر قراءة الصورة');
  });
  function slug(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF-]/g, ""); }
  function uiText(ar, en) { return doc.documentElement.lang === "en" ? en : ar; }

  /* ── storage (new namespaces — additive, never collide with app keys) ─ */
  var K_SCORES = "lorefy.characterRatings.v1";   // { [workId]: { [charKey]: 1..5 } }
  var K_REVIEW = "lorefy.characterReview.v1";     // { [workId]: { overall, text, ts } }
  var K_CHARIMG    = "lorefy.characterBoardImages.v2";  // invalidate unverified legacy portraits
  var K_CHARCUSTOM = "lorefy.characterCustomImages.v1"; // { [charId]: dataURL|url } user-picked
  function getScores(workId) { var all = read(K_SCORES, {}); return (all && all[workId]) || {}; }
  function setScore(workId, charKey, value) {
    var all = read(K_SCORES, {}); if (!all[workId]) all[workId] = {};
    if (value) all[workId][charKey] = value; else delete all[workId][charKey];
    write(K_SCORES, all);
  }
  function getReview(workId) { var all = read(K_REVIEW, {}); return (all && all[workId]) || { overall: 0, text: "" }; }
  function setReview(workId, data) { var all = read(K_REVIEW, {}); all[workId] = Object.assign({}, all[workId], data, { ts: Date.now() }); write(K_REVIEW, all); }

  /* ── template cast (used until real data arrives; design never looks empty) */
  var CHARACTER_LOADING_TEXT = "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0634\u062e\u0635\u064a\u0627\u062a \u0627\u0644\u0645\u0648\u062b\u0642\u0629...";
  var CHARACTER_NO_SOURCE_TEXT = "\u0644\u0627 \u062a\u0648\u062c\u062f \u0634\u062e\u0635\u064a\u0627\u062a \u0645\u0648\u062b\u0642\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u0644 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646.";
  var CHARACTER_EMPTY_SEARCH_TEXT = "\u0644\u0627 \u062a\u0648\u062c\u062f \u0634\u062e\u0635\u064a\u0629 \u0628\u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u0645.";
  var TEMPLATE_CAST = [
    { id: "luffy",  name: "مونكي د. لوفي", latin: "Monkey D. Luffy", role: "رئيسية", note: "قبعة القش — الكابتن" },
    { id: "zoro",   name: "رورونوا زورو", latin: "Roronoa Zoro", role: "رئيسية", note: "السيّاف — ثلاثة سيوف" },
    { id: "nami",   name: "نامي", latin: "Nami", role: "رئيسية", note: "ملاّحة الطاقم" },
    { id: "usopp",  name: "أوسوب", latin: "Usopp", role: "رئيسية", note: "القنّاص" },
    { id: "sanji",  name: "سانجي", latin: "Sanji", role: "رئيسية", note: "الطبّاخ" },
    { id: "chopper",name: "توني توني تشوبر", latin: "Tony Tony Chopper", role: "رئيسية", note: "الطبيب" },
    { id: "robin",  name: "نيكو روبن", latin: "Nico Robin", role: "رئيسية", note: "عالمة الآثار" },
    { id: "franky", name: "فرانكي", latin: "Franky", role: "مساعدة", note: "المهندس" },
    { id: "brook",  name: "بروك", latin: "Brook", role: "مساعدة", note: "الموسيقيّ" },
    { id: "jinbe",  name: "جينبي", latin: "Jinbe", role: "مساعدة", note: "القائد البحري" },
    { id: "shanks", name: "شانكس", latin: "Shanks", role: "مساعدة", note: "أحد اليونكو" },
    { id: "law",    name: "تراف. د. لو", latin: "Trafalgar Law", role: "مساعدة", note: "حليف" }
  ];
  function castKey(c) { return c.key || c.id || slug(c.latin || c.name); }
  function initials(c) {
    var base = (c.latin || c.name || "?").trim();
    var parts = base.split(/\s+/).filter(Boolean);
    var s = parts.length > 1 ? (parts[0][0] + parts[1][0]) : base.slice(0, 2);
    return s.toUpperCase();
  }
  function characterImageKey(c) { return String((c && (c.id || c.key)) || slug(c && (c.latin || c.name)) || "").trim(); }
  function characterImageUrl(c) {
    var key = characterImageKey(c), custom = read(K_CHARCUSTOM, {}), cache = read(K_CHARIMG, {});
    var chosen = custom && custom[key];
    return (chosen && global.LorefyArtwork ? global.LorefyArtwork.display(chosen) : chosen) || (cache && cache[key]) || (c && (c.image || c.img || c.cover)) || "";
  }
  async function setCharacterImage(c, url) {
    var key = characterImageKey(c); if (!key) return;
    await global.LorefyArtwork.saveCharacter(key, url);
    cbInvalidateEmbeds();
  }
  function renderCharacterPortraitImage(wrap, c) {
    if (!wrap) return;
    if (global.LorefyPortraitMedia) {
      if (wrap._portraitMedia) wrap._portraitMedia.dispose(true);
      wrap._portraitMedia = global.LorefyPortraitMedia.mount(wrap, { src: characterImageUrl(c), alt: c.name || c.latin || "", initials: initials(c), language: doc.documentElement.lang, loading: "lazy" });
      scheduleCharacterActionIcons();
      return;
    }
    var old = wrap.querySelector("img");
    if (old) old.remove();
    var label = wrap.querySelector(".lf-character-initial");
    if (!label) {
      label = el("span", { class: "lf-character-initial", text: initials(c) });
      wrap.insertBefore(label, wrap.firstChild || null);
    }
    label.textContent = initials(c);
    var url = characterImageUrl(c);
    label.hidden = !!url;
    if (url) {
      var img = el("img", { src: url, alt: c.name || c.latin || "", loading: "lazy", referrerpolicy: "no-referrer" });
      img.addEventListener("error", function () {
        try { img.remove(); } catch (e) {}
        label.hidden = false;
      });
      wrap.insertBefore(img, label);
    }
  }
  function releaseCharacterPortraits(host) {
    if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('[data-lorefy-portrait]'), function (node) { if (node._portraitMedia) node._portraitMedia.dispose(); });
  }
  function characterPortrait(c, cls, onChange, work) {
    var portrait = el("div", { class: cls || "lf-character-portrait" });
    renderCharacterPortraitImage(portrait, c);
    var edit = el("button", {
      type: "button",
      class: "lf-character-image-edit",
      "data-character-image-edit": characterImageKey(c),
      "aria-label": uiText("تعديل صورة ", "Edit image for ") + (c.name || c.latin || uiText("الشخصية", "character")),
      title: uiText("تعديل صورة ", "Edit image for ") + (c.name || c.latin || uiText("الشخصية", "character"))
    }, el("i", { "data-lucide": "pencil", "aria-hidden": "true" }));
    edit.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      openCharacterImagePicker(c, function () {
        renderCharacterPortraitImage(portrait, c);
        if (onChange) onChange(c);
      }, work);
    });
    portrait.appendChild(edit);
    return portrait;
  }

  /* ── resolve which work we're on (real app) ───────────────────────────── */
  function malIdFromWorkId(workId) {
    var m = String(workId || "").match(/mal-(?:manga|novel|anime|manhwa|manhua)?-?(\d+)/i);
    if (m) return m[1];
    m = String(workId || "").match(/(\d{2,})/);
    return m ? m[1] : null;
  }
  function findWork(workId) {
    if (!workId) return null;
    var data = global.LorefyMangaData || [];
    for (var i = 0; i < data.length; i++) if (String(data[i].id) === String(workId)) return data[i];
    return null;
  }
  function addWorkTitleCandidate(out, value) {
    value = String(value || "").replace(/\s+/g, " ").trim();
    if (value && out.indexOf(value) < 0) out.push(value);
  }
  function workContext(opts) {
    opts = opts || {};
    var workId = opts.workId || qp("novel") || "preview-one-piece";
    var work = opts.work || findWork(workId) || null;
    var routeSearch = opts.searchTitle || qp("search") || "";
    var title = mlTitleOf(work) || (isSupportedDisplayTitle(opts.title) ? opts.title : "") || routeSearch || "عمل في مكتبتك";
    var type = opts.type || (work && work.type) || qp("type") || "";
    var mal = opts.mal || (work && (work.mal || work.malId)) || malIdFromWorkId(workId) || "13";
    var cover = opts.cover || (work && (work.cover || work.image || work.sourceCoverUrl || (work.covers && work.covers[0]))) || "";
    var titleCandidates = [];
    addWorkTitleCandidate(titleCandidates, routeSearch);
    addWorkTitleCandidate(titleCandidates, title);
    if (work) {
      addWorkTitleCandidate(titleCandidates, work.title);
      addWorkTitleCandidate(titleCandidates, work.ar);
    }
    var sourceWork = Object.assign({}, work || {}, {
      id: workId,
      title: (work && work.title) || title,
      ar: (work && work.ar) || title,
      type: type,
      searchTitle: routeSearch,
      titleCandidates: titleCandidates
    });
    return { workId: workId, id: workId, title: title, type: type, mal: mal, cover: cover, cast: opts.cast || null, sourceWork: sourceWork };
  }
  function isTextCharacterWork(work) {
    var source = (work && (work.sourceWork || work)) || {};
    if (global.LorefyCharacterSystem && typeof global.LorefyCharacterSystem.isTextWork === "function") {
      return global.LorefyCharacterSystem.isTextWork(source);
    }
    var type = String(source.type || work && work.type || "").toLowerCase();
    return /novel|رواية|ويب نوفل|لايت نوفل/.test(type) || /^n-/.test(String(source.id || work && work.workId || ""));
  }
  function isComicCharacterWork(work) {
    var source = (work && (work.sourceWork || work)) || {};
    var type = String(source.type || work && work.type || "").toLowerCase();
    return /comics?|كوميكس/.test(type);
  }
  function characterSourceLabel(work) {
    if (isTextCharacterWork(work)) return uiText("المصدر: كتالوج أدبي · Wikipedia/Fandom", "Source: Literary catalog · Wikipedia/Fandom");
    if (isComicCharacterWork(work)) return uiText("المصدر: كتالوج الكوميكس · Wikipedia/DC/Marvel", "Source: Comics catalog · Wikipedia/DC/Marvel");
    return uiText("المصدر: MAL · AniList", "Source: MAL · AniList");
  }
  function characterSourceLink(work) {
    if (isTextCharacterWork(work) || isComicCharacterWork(work)) {
      return {
        href: "https://en.wikipedia.org/w/index.php?search=" + encodeURIComponent((work && work.title) || ""),
        text: "Wikipedia ↗"
      };
    }
    return {
      href: "https://myanimelist.net/manga/" + (work && work.mal || ""),
      text: "MAL ↗"
    };
  }

  /* ════════════════════════════════════════════════════════════════════
     CHARACTER PAGE
     ════════════════════════════════════════════════════════════════════ */
  var activePage = null;
  var activeImagePicker = null;

  function closeCharacterImagePicker(picker) {
    picker = picker || activeImagePicker;
    if (!picker || picker !== activeImagePicker) return;
    activeImagePicker = null;
    if (picker._releasePicker) picker._releasePicker();
    releaseCharacterPortraits(picker);
    if (picker.parentNode) picker.parentNode.removeChild(picker);
  }
  function imagePickerMount() { return doc.getElementById("screen") || doc.body; }
  function appendImageChoice(host, c, url, label, save) {
    if (!url) return;
    var pick = el("button", { type: "button", class: "lf-image-choice", "aria-label": label || uiText("اختيار الصورة", "Choose image") }, [
      el("img", { src: url, alt: c.name || c.latin || "", loading: "lazy", referrerpolicy: "no-referrer" }),
      el("span", { text: label || uiText("اختيار", "Choose") })
    ]);
    pick.addEventListener("click", function () {
      return save(url, uiText("تم حفظ صورة ", "Saved image for ") + (c.name || c.latin || uiText("الشخصية", "character")));
    });
    host.appendChild(pick);
  }
  function mudaeSearchUrl(c) {
    var name = (c && (c.latin || c.name)) || "";
    return "https://mudae.net/search?type=character&query=" + encodeURIComponent(name);
  }
  function openCharacterImagePicker(c, onChange, work) {
    closeCharacterImagePicker();
    var owner = profileRatedCharacterOwner(), picker, released = false, saving = false;
    var requestId = 0, requestTimer = null, loading = false, unsubscribeAuth;
    function close() { closeCharacterImagePicker(picker); }
    function isCurrent() {
      if (released || activeImagePicker !== picker || !picker.isConnected) return false;
      if (profileRatedCharacterOwner() !== owner) { close(); return false; }
      return true;
    }
    function ownerChanged() { if (profileRatedCharacterOwner() !== owner) close(); }
    function paintSaving() {
      card.setAttribute("aria-busy", String(saving));
      var buttons = [resetBtn, uploadBtn].concat(Array.from(choices.querySelectorAll("button")));
      if (saving && buttons.indexOf(doc.activeElement) !== -1) closeBtn.focus();
      buttons.forEach(function (button) { button.disabled = saving; });
    }
    async function saveImage(url, message) {
      if (!isCurrent() || saving) return;
      saving = true; paintSaving();
      try {
        await setCharacterImage(c, url);
        if (!isCurrent()) return;
        if (onChange) onChange(url);
        toastSafe(message);
        close();
      } catch (error) { if (isCurrent()) toastSafe(error.message); }
      finally { if (isCurrent()) { saving = false; paintSaving(); } }
    }
    var current = characterImageUrl(c);
    var card = el("div", { class: "lf-image-choice-card" });
    var closeBtn = el("button", { type: "button", class: "lf-image-choice-close", "aria-label": uiText("إغلاق", "Close"), text: "×" });
    closeBtn.addEventListener("click", close);
    var preview = el("div", { class: "lf-image-choice-preview" });
    renderCharacterPortraitImage(preview, c);
    var fileInput = el("input", { type: "file", accept: "image/*", style: "display:none" });
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f || !isCurrent() || saving) return;
      cbReadImageFile(f, function (dataUrl) {
        return saveImage(dataUrl, uiText("تم حفظ الصورة المرفوعة", "Uploaded image saved"));
      });
      fileInput.value = '';
    });
    var resetBtn = el("button", { type: "button", class: "lf-image-choice-secondary", text: uiText("الصورة التلقائية", "Automatic image") });
    resetBtn.addEventListener("click", function () {
      return saveImage("", uiText("رجعت للصورة التلقائية", "Automatic image restored"));
    });
    var uploadBtn = el("button", { type: "button", class: "lf-image-choice-primary", text: uiText("رفع صورة", "Upload image") });
    uploadBtn.addEventListener("click", function () { if (isCurrent() && !saving) fileInput.click(); });
    var mudaeLink = el("a", {
      class: "lf-image-choice-external",
      href: mudaeSearchUrl(c),
      target: "_blank",
      rel: "noopener",
      text: "Mudae ↗"
    });
    var choices = el("div", { class: "lf-image-choice-grid" });
    var status = el("p", { class: "lf-image-choice-status", role: "status", "aria-live": "polite", "aria-atomic": "true" });
    var retryBtn = el("button", { type: "button", class: "lf-image-choice-secondary lf-image-choice-retry", text: uiText("إعادة المحاولة", "Retry") });
    retryBtn.hidden = true;
    retryBtn.addEventListener("click", loadChoices);
    card.appendChild(el("div", { class: "lf-image-choice-grabber", "aria-hidden": "true" }));
    card.appendChild(el("div", { class: "lf-image-choice-head" }, [
      closeBtn,
      el("div", {}, [
        el("strong", { text: uiText("تعديل صورة الشخصية", "Edit character image") }),
        el("span", { text: c.name || c.latin || uiText("شخصية", "Character") })
      ]),
      preview
    ]));
    card.appendChild(el("div", { class: "lf-image-choice-actions" }, [resetBtn, uploadBtn, mudaeLink, fileInput]));
    card.appendChild(status);
    card.appendChild(retryBtn);
    card.appendChild(choices);
    card.addEventListener("click", function (e) { e.stopPropagation(); });
    picker = el("div", { class: "lf-image-choice-sheet", role: "dialog", "aria-modal": "true", "aria-label": uiText("اختيار صورة شخصية", "Choose character image") }, card);
    activeImagePicker = picker;
    picker.addEventListener("click", close);
    imagePickerMount().appendChild(picker);
    var releaseDialog = bindDialogKeys(picker, close, closeBtn);
    picker._releasePicker = function () {
      if (released) return;
      released = true; requestId++;
      clearTimeout(requestTimer);
      global.removeEventListener("lorefy:stored-state", ownerChanged);
      global.removeEventListener("storage", ownerChanged);
      if (unsubscribeAuth) unsubscribeAuth();
      releaseDialog();
    };
    global.addEventListener("lorefy:stored-state", ownerChanged);
    global.addEventListener("storage", ownerChanged);
    if (global.LorefyBackend && global.LorefyBackend.onAuth) {
      unsubscribeAuth = global.LorefyBackend.onAuth(function (session) {
        if (!session || String(session.userId || session.user && session.user.id || "") !== owner) close();
      });
    }
    appendImageChoice(choices, c, current, uiText("الحالية", "Current"), saveImage);
    function loadFailed(id) {
      if (!isCurrent() || id !== requestId) return;
      requestId++; loading = false; clearTimeout(requestTimer);
      choices.setAttribute("aria-busy", "false");
      status.textContent = uiText("تعذر جلب الصور البديلة الآن.", "Could not load alternative images.");
      retryBtn.hidden = false; retryBtn.disabled = false;
    }
    function loadChoices() {
      if (!isCurrent() || loading) return;
      var loader = global.LorefyCharacterSystem && global.LorefyCharacterSystem.loadImageOptions;
      if (!loader) {
        status.textContent = uiText("مصدر الصور البديلة غير متاح حالياً.", "Alternative image provider is unavailable.");
        retryBtn.hidden = false; retryBtn.disabled = false;
        return;
      }
      var id = ++requestId;
      if (doc.activeElement === retryBtn) closeBtn.focus();
      loading = true; retryBtn.disabled = true;
      status.textContent = uiText("جارٍ تحميل صور بديلة…", "Loading alternative images…");
      choices.setAttribute("aria-busy", "true");
      requestTimer = setTimeout(function () { loadFailed(id); }, 20000);
      Promise.resolve().then(function () {
        if (!isCurrent() || id !== requestId) return [];
        return loader(c, work && (work.sourceWork || work), { reportErrors: true });
      }).then(function (urls) {
        if (!isCurrent() || id !== requestId) return;
        clearTimeout(requestTimer); loading = false;
        var seen = [current], count = 0;
        (urls || []).forEach(function (url) {
          if (!url || seen.indexOf(url) !== -1) return;
          seen.push(url);
          appendImageChoice(choices, c, url, count++ ? uiText("بديلة ", "Alternative ") + count : uiText("من المصدر", "From source"), saveImage);
        });
        paintSaving(); choices.setAttribute("aria-busy", "false");
        status.textContent = count ? uiText("اختر صورة بديلة أو ارفع صورتك.", "Choose an alternative image or upload your own.") : uiText("لم نجد صوراً بديلة لهذه الشخصية.", "No alternative images found for this character.");
        // Do not strand keyboard focus on a control that is about to be hidden.
        if (doc.activeElement === retryBtn) closeBtn.focus();
        retryBtn.hidden = true;
      }).catch(function () { loadFailed(id); });
    }
    loadChoices();
  }

  function scoreControl(workId, charKey, getStatus, displayName) {
    var current = getScores(workId)[charKey] || 0;
    var label = uiText("تقييم الشخصية من 5", "Character rating out of 5");
    var row = el("div", { class: "lf-character-score-row", role: "group", "aria-label": label });
    var scale = el("div", { class: "lf-rating-scale" });
    var slider = el("input", { type: "range", min: "0", max: "5", step: "0.25", value: String(current), "aria-label": label + (displayName ? " · " + displayName : "") });
    var output = el("output", { class: "lf-character-score-value", "data-no-translate": "" });
    function paint(v) {
      row.setAttribute("data-score", String(v || 0));
      output.textContent = v ? Number(v).toFixed(2) : "—";
      slider.setAttribute("aria-valuetext", v ? Number(v).toFixed(2) + uiText(" من 5", " out of 5") : uiText("لم تقيّم بعد", "Not rated"));
      slider.style.setProperty("--rating-progress", String(v / 5 * 100) + "%");
    }
    row.appendChild(el("i", { "data-lucide": "feather", "aria-hidden": "true" }));
    row.appendChild(el("small", { class: "lf-character-score-label", text: uiText("تقييمك", "Your rating") }));
    slider.addEventListener("input", function () {
      var next = Number(slider.value);
      setScore(workId, charKey, next); paint(next);
      if (getStatus) getStatus(next);
    });
    scale.appendChild(slider);
    row.appendChild(scale);
    row.appendChild(output);
    paint(current);
    scheduleCharacterActionIcons();
    return row;
  }

  function characterRow(work, c) {
    var key = castKey(c);
    var portrait = characterPortrait(c, "lf-character-portrait", null, work);
    var nameLine = el("div", { class: "lf-character-name-line" }, [
      el("strong", { text: c.name || c.latin || "—" }),
      el("em", { text: uiText(c.role || "شخصية", /رئيس/.test(c.role || "") ? "Main" : /مساعد/.test(c.role || "") ? "Supporting" : /مخص/.test(c.role || "") ? "Custom" : (c.role || "Character")) })
    ]);
    var meta = el("div", { class: "lf-character-meta" }, [
      nameLine,
      el("span", { text: c.latin && c.latin !== c.name ? c.latin : (c.note || "") }),
      c.note && c.latin && c.latin !== c.name ? el("small", { text: c.note }) : null
    ]);
    var control = scoreControl(work.workId, key, null, c.name || c.latin);
    var rowEl = el("div", { class: "lf-character-rating-row", "data-name": (c.name || "") + " " + (c.latin || ""), "data-role": c.role || "" }, [portrait, meta, control]);
    return rowEl;
  }

  function reviewComposer(work) {
    var saved = getReview(work.workId);
    var starRow = el("div", { class: "lf-cr-star-row lf-character-review-scale lf-rating-scale" });
    var slider = el("input", { type: "range", min: "0", max: "5", step: "0.25", value: String(saved.overall || 0), "aria-label": uiText("تقييم عام من 5", "Overall character rating out of 5") });
    var output = el("output", { class: "lf-character-score-value", "data-no-translate": "" });
    function paintStars(v) {
      output.textContent = v ? Number(v).toFixed(2) : "—";
      slider.setAttribute("aria-valuetext", v ? Number(v).toFixed(2) + uiText(" من 5", " out of 5") : uiText("لم تقيّم بعد", "Not rated"));
      slider.style.setProperty("--rating-progress", String(v / 5 * 100) + "%");
    }
    slider.addEventListener("input", function () {
      var next = Number(slider.value);
      setReview(work.workId, { overall: next }); paintStars(next);
    });
    starRow.appendChild(slider); starRow.appendChild(output);
    paintStars(saved.overall || 0);
    scheduleCharacterActionIcons();

    var area = el("textarea", { class: "lf-cr-textarea", rows: "3", placeholder: "شاركنا رأيك في القصّة والشخصيات…", maxlength: "1200" });
    area.value = saved.text || "";
    var status = el("p", { class: "lf-cr-review-status", "data-character-status": "", text: "" });
    var saveBtn = el("button", { type: "button", class: "lf-cr-review-save", text: "حفظ المراجعة" });
    var draftTimer;
    area.addEventListener("input", function () {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(function () { setReview(work.workId, { text: area.value }); }, 350);
    });
    saveBtn.addEventListener("click", function () {
      setReview(work.workId, { text: area.value });
      status.textContent = "تم حفظ مراجعتك على هذا الجهاز ✓";
      status.setAttribute("data-kind", "ok");
      saveBtn.textContent = "تم الحفظ";
      setTimeout(function () { saveBtn.textContent = "حفظ المراجعة"; }, 1600);
    });

    return el("section", { class: "lf-cr-review-card", "aria-label": "اكتب مراجعة" }, [
      el("div", { class: "lf-cr-review-head" }, [
        el("strong", { text: "اكتب مراجعة" }),
        starRow
      ]),
      area,
      el("div", { class: "lf-cr-review-foot" }, [status, saveBtn])
    ]);
  }

  function buildPage(work, cast) {
    work.cast = cast;
    var scores = getScores(work.workId);
    var rated = cast.filter(function (c) { return scores[castKey(c)]; }).length;
    var vals = cast.map(function (c) { return scores[castKey(c)] || 0; }).filter(Boolean);
    var avg = vals.length ? (vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : 0;

    /* hero */
    var heroCover = el("div", { class: "lf-character-hero-cover" }, work.cover ? el("img", { src: work.cover, alt: work.title }) : (work.title || "؟").slice(0, 1));
    var hero = el("div", { class: "lf-character-hero" }, [
      heroCover,
      el("div", { class: "lf-character-hero-copy" }, [
        el("span", { class: "lf-character-kicker", text: "تقييم الشخصيات" }),
        el("strong", { text: work.title }),
        el("div", { class: "lf-character-stat-grid" }, [
          el("div", {}, [el("b", { "data-stat": "count", text: String(cast.length) + (work._template ? "+" : "") }), el("span", { text: uiText("شخصية", "Characters") })]),
          el("div", {}, [el("b", { "data-stat": "rated", text: String(rated) }), el("span", { text: uiText("قيّمتها", "Rated") })]),
          el("div", {}, [el("b", { "data-stat": "avg", text: avg ? avg.toFixed(2) : "—" }), el("span", { text: uiText("متوسّطك", "Your average") })])
        ])
      ])
    ]);

    /* toolbar: search + filters */
    var searchInput = el("input", { type: "search", inputmode: "search", dir:"auto", placeholder: uiText("ابحث عن شخصية…", "Search characters…"), "aria-label": uiText("ابحث عن شخصية", "Search characters") });
    var search = el("div", { class: "lf-character-search" }, [el("i", { "data-lucide": "search", "aria-hidden": "true" }), searchInput]);
    var filterDefs = [["all", uiText("الكل", "All")], ["rated", uiText("قيّمتها", "Rated")], ["main", uiText("رئيسية", "Main")], ["support", uiText("مساعدة", "Supporting")]];
    var filterRow = el("div", { class: "lf-character-filter-row", role: "tablist", "aria-label": uiText("تصفية الشخصيات", "Filter characters") });
    var currentFilter = "all";
    var chips = filterDefs.map(function (d) {
      var chip = el("button", { type: "button", role: "tab", tabindex:d[0]==="all"?"0":"-1", "aria-selected": d[0] === "all" ? "true" : "false", class: "lf-character-filter-chip" + (d[0] === "all" ? " is-active" : ""), text: d[1], "data-filter": d[0] });
      chip.addEventListener("click", function () {
        currentFilter = d[0];
        chips.forEach(function (x) {
          x.classList.toggle("is-active", x === chip);
          x.setAttribute("aria-selected", x === chip ? "true" : "false");
          x.tabIndex=x===chip?0:-1;
        });
        applyFilter(true);
      });
      filterRow.appendChild(chip); return chip;
    });
    filterRow.addEventListener("keydown",function(event){
      var index=chips.indexOf(event.target),next=index,rtl=uiText("rtl","ltr")==="rtl";
      if(index<0)return;
      if(event.key==="Home")next=0;
      else if(event.key==="End")next=chips.length-1;
      else if(event.key===(rtl?"ArrowLeft":"ArrowRight"))next=(index+1)%chips.length;
      else if(event.key===(rtl?"ArrowRight":"ArrowLeft"))next=(index+chips.length-1)%chips.length;
      else return;
      event.preventDefault();chips[next].click();chips[next].focus();
    });

    /* list */
    var list = el("div", { class: "lf-character-page-list" });
    /* Keep the first paint light; the full cast remains available via load more. */
    var INITIAL_CHARACTER_RENDER_LIMIT = 60;
    var renderLimit = INITIAL_CHARACTER_RENDER_LIMIT;
    var rows = [];
    var empty = el("p", { class: "lf-character-empty-search", hidden: "", text: cast.length ? CHARACTER_EMPTY_SEARCH_TEXT : CHARACTER_LOADING_TEXT });
    list.appendChild(empty);

    function applyFilter() {
      var q = (searchInput.value || "").trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (r) {
        var hay = (r.getAttribute("data-name") || "").toLowerCase();
        var role = r.getAttribute("data-role") || "";
        var matchQ = !q || hay.indexOf(q) !== -1;
        var matchF = currentFilter === "all"
          || (currentFilter === "rated" && rowScored(r))
          || (currentFilter === "main" && /رئيس/.test(role))
          || (currentFilter === "support" && !/رئيس/.test(role));
        var ok = matchQ && matchF;
        r.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      empty.hidden = shown !== 0;
    }
    function rowScored(r) {
      var control = r.querySelector(".lf-character-score-row");
      return !!control && Number(control.getAttribute("data-score")) > 0;
    }
    var loadMore = el("button", { type: "button", class: "lf-character-load-more" });
    function renderCharacterRows(resetLimit) {
      if (resetLimit) renderLimit = INITIAL_CHARACTER_RENDER_LIMIT;
      var q = (searchInput.value || "").trim().toLowerCase();
      var scores = getScores(work.workId);
      var matches = cast.filter(function (character) {
        var name = [character.name, character.latin, character.nameAr, character.nameEn].filter(Boolean).join(" ").toLowerCase();
        var role = String(character.role || "");
        var filterMatches = currentFilter === "all"
          || (currentFilter === "rated" && !!scores[castKey(character)])
          || (currentFilter === "main" && /\u0631\u0626\u064a\u0633/.test(role))
          || (currentFilter === "support" && !/\u0631\u0626\u064a\u0633/.test(role));
        return (!q || name.indexOf(q) !== -1) && filterMatches;
      });
      releaseCharacterPortraits(list);
      while (list.firstChild) list.removeChild(list.firstChild);
      rows = matches.slice(0, renderLimit).map(function (character) {
        var row = characterRow(work, character);
        list.appendChild(row);
        return row;
      });
      empty.hidden = rows.length > 0;
      empty.textContent = cast.length ? uiText(CHARACTER_EMPTY_SEARCH_TEXT, "No matching characters") : uiText(CHARACTER_LOADING_TEXT, "Loading verified characters…");
      list.appendChild(empty);
      if (matches.length > renderLimit) {
        loadMore.textContent = uiText("عرض ", "Show ") + String(Math.min(60, matches.length - renderLimit)) + uiText(" شخصية أخرى", " more characters");
        list.appendChild(loadMore);
      }
    }
    loadMore.addEventListener("click", function () {
        renderLimit += 60;
      renderCharacterRows(false);
    });
    applyFilter = renderCharacterRows;
    var searchTimer = 0;
    searchInput.addEventListener("input", function () {
      if (searchTimer) global.clearTimeout(searchTimer);
      searchTimer = global.setTimeout(function () { renderCharacterRows(true); }, 90);
    });
    renderCharacterRows(false);

    /* add custom character */
    var addInput = el("input", { type: "text", placeholder: uiText("أضف شخصية غير مدرجة…", "Add a missing character…"), "aria-label": uiText("أضف شخصية", "Add character") });
    var addBtn = el("button", { type: "button", text: uiText("إضافة", "Add") });
    function addChar() {
      var name = (addInput.value || "").trim();
      if (!name) return;
      var c = { id: "custom-" + slug(name) + "-" + Date.now().toString(36), name: name, latin: "", role: "مخصّصة", note: "أضفتها أنت" };
      cast.unshift(c);
      addInput.value = "";
      refreshStats();
      applyFilter(true);
    }
    addBtn.addEventListener("click", addChar);
    addInput.addEventListener("keydown", function (e) { if (e.key === "Enter") addChar(); });
    var addRow = el("div", { class: "lf-character-add-row" }, [addInput, addBtn]);

    function refreshStats() {
      var sc = getScores(work.workId);
      var r2 = cast.filter(function (c) { return sc[castKey(c)]; }).length;
      var v2 = cast.map(function (c) { return sc[castKey(c)] || 0; }).filter(Boolean);
      var a2 = v2.length ? (v2.reduce(function (a, b) { return a + b; }, 0) / v2.length) : 0;
      var elCount = hero.querySelector('[data-stat="count"]'); if (elCount) elCount.textContent = String(cast.length) + (work._template ? "+" : "");
      var elRated = hero.querySelector('[data-stat="rated"]'); if (elRated) elRated.textContent = String(r2);
      var elAvg = hero.querySelector('[data-stat="avg"]'); if (elAvg) elAvg.textContent = a2 ? a2.toFixed(2) : "—";
    }
    list.addEventListener("input", function (e) {
      if (e.target && e.target.closest && e.target.closest(".lf-character-score-row")) refreshStats();
    });

    /* source row */
    var sourceLink = characterSourceLink(work);
    var sourceChildren = [el("span", { class: "lf-cr-source-label", text: work._template ? CHARACTER_LOADING_TEXT : characterSourceLabel(work) })];
    if (sourceLink && sourceLink.href) sourceChildren.push(el("a", { href: sourceLink.href, target: "_blank", rel: "noopener", text: sourceLink.text }));
    var source = el("div", { class: "lf-character-source-row", "data-character-status": "" }, sourceChildren);

    /* top bar */
    var back = el("button", { type: "button", class: "lf-character-page-back", "aria-label": uiText("رجوع","Back"), title:uiText("رجوع","Back") }, el("i", {"data-lucide":uiText("chevron-right","chevron-left"),"aria-hidden":"true"}));
    back.addEventListener("click", closePage);
    var top = el("div", { class: "lf-character-page-top" }, [
      back,
      el("div", {}, [el("strong", { text: "تقييم الشخصيات" }), el("span", { text: work.title })])
    ]);

    /* rating panel head */
    var panelHead = el("div", { class: "lf-character-page-head" }, [
      el("div", {}, [el("strong", { text: "الشخصيات" }), el("span", { text: "اختر تقييمًا من 1 إلى 5 لكل شخصية" })])
    ]);

    var shell = el("div", { class: "lf-character-page-shell" }, [
      top,
      hero,
      el("section", { class: "lf-character-page-panel" }, [
        panelHead,
        el("div", { class: "lf-character-toolbar" }, [search, filterRow]),
        list,
        addRow,
        source
      ]),
      el("details", { class: "lf-character-work-review" }, [el("summary", { text: "مراجعة العمل" }), reviewComposer(work)])
    ]);

    var page = el("div", { class: "lf-character-page", role: "dialog", "aria-modal": "true", "aria-label": uiText("تقييم شخصيات ", "Rate characters in ") + work.title }, shell);
    page.classList.add("lf-character-studio");
    page._refreshStats = refreshStats;
    page._releasePortraitMedia = function () { global.clearTimeout(searchTimer); releaseCharacterPortraits(page); };
    page._source = source;
    page._work = work;
    enhanceInteractionAccessibility(page);
    page._setEmptyStatus = function (text) {
      empty.textContent = text || CHARACTER_EMPTY_SEARCH_TEXT;
      empty.hidden = rows.length > 0;
    };
    page._setCast = function (newCast) {
      // replace cast list while keeping user scores (matched by latin/name key)
      cast.length = 0; rows.length = 0;
      newCast.forEach(function (c) { cast.push(c); });
      renderLimit = INITIAL_CHARACTER_RENDER_LIMIT;
      refreshStats(); applyFilter(false);
    };
    return page;
  }

  function mountHost() {
    return doc.getElementById("screen") || doc.getElementById("root") || doc.body;
  }
  function closePage() {
    if (!activePage) return;
    closeCharacterImagePicker();
    var p = activePage; activePage = null;
    if (p._releasePortraitMedia) p._releasePortraitMedia();
    p.classList.add("is-leaving");
    if (p._releaseDialog) p._releaseDialog();
    p.inert = true;
    setTimeout(function () { if (p && p.parentNode) p.parentNode.removeChild(p); }, 220);
  }

  function characterLoadStatus(work, complete, retry) {
    if (complete) return characterSourceLabel(work);
    return retry < 2 ? uiText("جاري التحقق من القائمة الكاملة...", "Checking the complete character list...") : uiText("هذه الشخصيات المتاحة حاليًا؛ تعذّر استكمال بقية القائمة من المصدر.", "Showing available characters; the rest of the source list is currently unavailable.");
  }

  function openCharacterPage(opts) {
    var work = workContext(opts);
    if (isNormalBookLike(work.sourceWork || work)) {
      removeCharacterButtons();
      return null;
    }
    var characterSystem = global.LorefyCharacterSystem;
    var cast = (opts && opts.cast) || work.cast || [];
    if (!cast.length && characterSystem && typeof characterSystem.catalogCast === "function") {
      cast = characterSystem.catalogCast(work.sourceWork || work);
    }
    var shouldLoad = characterSystem && typeof characterSystem.needsRemoteRefresh === "function"
      ? characterSystem.needsRemoteRefresh(work.sourceWork || work, cast)
      : cast.length < 250;
    if (opts && opts.preview && !cast.length) cast = TEMPLATE_CAST.slice();
    if (shouldLoad) work._template = true;
    if (activePage) closePage();
    var page = buildPage(work, cast);
    activePage = page;
    mountHost().appendChild(page);
    requestAnimationFrame(function () { page.classList.add("is-in"); });
    page._releaseDialog = bindDialogKeys(page, closePage, page.querySelector(".lf-character-page-back"));

    /* best‑effort enrichment from MAL/AniList — never blocks the template */
    function refreshRemoteCast(retry) {
      loadCast(work).then(function (real) {
        if (!real || !real.length || activePage !== page) return;
        var complete = real.complete === true;
        work._template = !complete;
        page._setCast(real);
        if (page._source) {
          var lbl = page._source.querySelector(".lf-cr-source-label");
          if (lbl) lbl.textContent = characterLoadStatus(work, complete, retry);
        }
        if (!complete && retry < 2) {
          global.setTimeout(function () { if (activePage === page) refreshRemoteCast(retry + 1); }, retry ? 20000 : 7000);
        }
      }).catch(function () {
        if (activePage !== page) return;
        if (retry < 2) {
          if (page._source) {
            var lbl = page._source.querySelector(".lf-cr-source-label");
            if (lbl) lbl.textContent = uiText("تعذّر الوصول للمصدر، ستتم إعادة المحاولة...", "Unable to reach the source. Retrying...");
          }
          global.setTimeout(function () { if (activePage === page) refreshRemoteCast(retry + 1); }, retry ? 20000 : 7000);
        } else {
          if (page._setEmptyStatus) page._setEmptyStatus(CHARACTER_NO_SOURCE_TEXT);
          if (page._source) {
            var finalLabel = page._source.querySelector(".lf-cr-source-label");
            if (finalLabel) finalLabel.textContent = CHARACTER_NO_SOURCE_TEXT;
          }
        }
      });
    }
    if (shouldLoad || !cast.length) refreshRemoteCast(0);
    return page;
  }

  /* ── cast loading: Jikan (MAL) → AniList fallback ─────────────────────── */
  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error("timeout")); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }
  function growthCatalogUrl(provider, directUrl) {
    try {
      if (global.LorefyDataProxy && typeof global.LorefyDataProxy.catalogUrl === "function") {
        return global.LorefyDataProxy.catalogUrl(provider, directUrl);
      }
    } catch (e) {}
    return directUrl;
  }
  function loadCast(work) {
    if (global.LorefyCharacterSystem && typeof global.LorefyCharacterSystem.loadCast === "function") {
      return global.LorefyCharacterSystem.loadCast(work.sourceWork || work, { allowTitleSearch: true });
    }
    return jikanCast(work.mal).catch(function () { return anilistCast(work.mal); });
  }
  function jikanCast(mal) {
    if (!mal) return Promise.reject(new Error("no mal"));
    return withTimeout(fetch(growthCatalogUrl("jikan", "https://api.tenrai.org/v1/manga/" + mal + "/characters"), { headers: { Accept: "application/json" } }), 7000)
      .then(function (r) { if (!r.ok) throw new Error("jikan " + r.status); return r.json(); })
      .then(function (j) {
        var rows = (j && j.data) || [];
        if (!rows.length) throw new Error("empty");
        rows.sort(function (a, b) { return (b.favorites || 0) - (a.favorites || 0); });
        return rows.map(function (row) {
          var ch = row.character || {};
          var latin = ch.name || "";
          return {
            id: "mal-" + (ch.mal_id || slug(latin)),
            key: slug(latin),
            name: latin,
            latin: latin,
            role: /main/i.test(row.role || "") ? "رئيسية" : "مساعدة",
            note: row.favorites ? ("★ " + row.favorites.toLocaleString("en")) : "",
            image: (ch.images && ((ch.images.webp && ch.images.webp.image_url) || (ch.images.jpg && ch.images.jpg.image_url))) || ""
          };
        });
      });
  }
  function anilistCast(mal) {
    if (!mal) return Promise.reject(new Error("no mal"));
    var query = "query($id:Int){Media(idMal:$id,type:MANGA){characters(sort:[ROLE,FAVOURITES_DESC],perPage:80){edges{role node{name{full} image{large}}}}}}";
    return withTimeout(fetch(growthCatalogUrl("anilist", "https://graphql.anilist.co"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: query, variables: { id: parseInt(mal, 10) } })
    }), 7000)
      .then(function (r) { if (!r.ok) throw new Error("anilist " + r.status); return r.json(); })
      .then(function (j) {
        var edges = (((j.data || {}).Media || {}).characters || {}).edges || [];
        if (!edges.length) throw new Error("empty");
        return edges.map(function (e) {
          var latin = (e.node && e.node.name && e.node.name.full) || "";
          return {
            id: "al-" + slug(latin), key: slug(latin), name: latin, latin: latin,
            role: /main/i.test(e.role || "") ? "رئيسية" : "مساعدة", note: "",
            image: (e.node && e.node.image && e.node.image.large) || ""
          };
        });
      });
  }

  /* ════════════════════════════════════════════════════════════════════
     DETAIL‑SCREEN INJECTION  (button next to "اكتب مراجعة")
     ════════════════════════════════════════════════════════════════════ */
  function isReviewButton(b) {
    if (b.getAttribute && b.getAttribute("data-lorefy-action") === "write-review") return true;
    var t = (b.textContent || "").trim();
    return t === "اكتب مراجعة" || t === "أضف مراجعتك" || t === "Write a review" || t === "Add your review";
  }
  /* undo any earlier over-eager injection (e.g. into the community tab bar) */
  function cleanupStrayCharButtons() {
    var rows = doc.querySelectorAll(".lf-detail-action-row-with-characters");
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var anchor = row.querySelector(".lf-review-action-button");
      if (anchor && isReviewButton(anchor)) continue;   // legit detail row
      var strays = row.querySelectorAll(".lf-character-action-button");
      for (var sx = 0; sx < strays.length; sx++) strays[sx].remove();
      row.classList.remove("lf-detail-action-row-with-characters");
      if (anchor) anchor.classList.remove("lf-review-action-button");
    }
  }
  function removeCharacterButtons() {
    var buttons = doc.querySelectorAll ? doc.querySelectorAll(".lf-character-action-button") : [];
    for (var i = 0; i < buttons.length; i++) {
      var parent = buttons[i].parentElement;
      buttons[i].remove();
      if (parent) parent.classList.remove("lf-detail-action-row-with-characters");
    }
  }
  function charactersAllowedForCurrentWork() {
    var ctx = workContext({});
    return !isNormalBookLike(ctx.sourceWork || ctx);
  }
  function isNormalBookLike(work) {
    var source = (work && (work.sourceWork || work)) || {};
    var type = String(source.type || qp("type") || "").trim().toLowerCase();
    if (type === "book" || type === "books" || type === "كتاب" || type === "كتب") return true;
    if (global.LorefyCharacterSystem && typeof global.LorefyCharacterSystem.isNormalBook === "function") {
      try { return !!global.LorefyCharacterSystem.isNormalBook(source); } catch (e) {}
    }
    return false;
  }
  var characterActionIconsPending = false;
  function scheduleCharacterActionIcons() {
    if (characterActionIconsPending) return;
    characterActionIconsPending = true;
    global.requestAnimationFrame(function () {
      characterActionIconsPending = false;
      try { if (global.lucide && global.lucide.createIcons) global.lucide.createIcons(); } catch (e) {}
    });
  }
  function makeCharacterButton() {
    var b = el("button", { type: "button", class: "lf-character-action-button", "aria-haspopup": "dialog" }, [
      el("span", { class: "lf-cab-icon", "aria-hidden": "true" }, el("i", { "data-lucide": "feather", width: "16", height: "16" })),
      el("span", { class: "lf-cab-label", text: "تقييم الشخصيات" })
    ]);
    scheduleCharacterActionIcons();
    b.addEventListener("click", function () { openCharacterPage({}); });
    return b;
  }
  function makeTopCharsButton() {
    var b = el("button", { type: "button", class: "lf-character-action-button lf-topchars-action-button", "aria-haspopup": "dialog" }, [
      el("span", { class: "lf-cab-icon", "aria-hidden": "true" }, el("i", { "data-lucide": "trophy", width: "16", height: "16" })),
      el("span", { class: "lf-cab-label", text: "ترتيب الشخصيات" })
    ]);
    scheduleCharacterActionIcons();
    b.addEventListener("click", function () { clOpenForWork(); });
    return b;
  }
  function clOpenForWork() {
    var ctx = workContext({});
    var mid = String(ctx.workId);
    var lists = clLists();
    var list = null;
    for (var i = 0; i < lists.length; i++) if (String(lists[i].mid) === mid) { list = lists[i]; break; }
    if (!list) {
      list = { id: "c" + Date.now(), mid: mid, title: ctx.title || "", accent: ML_ACCENTS[(lists.length + 2) % ML_ACCENTS.length], chars: [], ts: Date.now() };
      lists.unshift(list); clSave(lists);
    }
    openListsHub({ charListId: list.id });
  }
  function enhanceDetail(scope) {
    scope = scope || doc;
    if (!charactersAllowedForCurrentWork()) {
      removeCharacterButtons();
      return false;
    }
    var buttons = scope.querySelectorAll ? scope.querySelectorAll("button") : [];
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (!isReviewButton(b)) continue;
      if (b.classList.contains("lf-review-action-button")) {
        var row0 = b.parentElement;
        if (row0 && row0.querySelector(".lf-character-action-button")) {
          if (!row0.querySelector(".lf-topchars-action-button")) row0.appendChild(makeTopCharsButton());
          return true; // already done
        }
      }
      var row = b.parentElement;
      if (!row) continue;
      b.classList.add("lf-review-action-button");
      row.classList.add("lf-detail-action-row-with-characters");
      if (!row.querySelector(".lf-character-action-button")) {
        var cb = makeCharacterButton();
        if (b.nextSibling) row.insertBefore(cb, b.nextSibling); else row.appendChild(cb);
      }
      if (!row.querySelector(".lf-topchars-action-button")) row.appendChild(makeTopCharsButton());
      return true;
    }
    return false;
  }

  /* observe the app for detail screens appearing */
  var scanScheduled = false;
  function scheduleScan() {
    if (scanScheduled) return; scanScheduled = true;
    requestAnimationFrame(function () { scanScheduled = false; try { enhanceDetail(doc); } catch (e) {} });
  }
  function startObserver() {
    try {
      var host = doc.getElementById("root") || doc.body;
      var mo = new MutationObserver(function (mutations) {
        if (!mutations.some(function (mutation) {
          return Array.prototype.some.call(mutation.addedNodes, function (node) { return node.nodeType === 1; }) ||
            Array.prototype.some.call(mutation.removedNodes, function (node) { return node.nodeType === 1; });
        })) return;
        scheduleScanSafe();
        scheduleGrowthMaintenance();
      });
      mo.observe(host, { childList: true, subtree: true });
      doc.__lorefyGrowthObserver = mo;
    } catch (e) {}
    scheduleScanSafe();
  }
  function scheduleScanSafe() {
    if (scanScheduled) return; scanScheduled = true;
    (global.requestAnimationFrame || setTimeout)(function () {
      scanScheduled = false; try { enhanceDetail(doc); } catch (e) {} try { injectCharacterLauncher(); } catch (e) {}
    });
  }

  /* ── floating preview affordance (design‑handoff only, behind ?qa flag) ── */
  function installPreviewAffordance() {
    if (qp("qa") !== "growth-v15") return;
    if (doc.getElementById("lf-cr-preview-fab")) return;
    var fab = el("button", { id: "lf-cr-preview-fab", type: "button", class: "lf-cr-preview-fab", text: "معاينة تقييم الشخصيات" });
    fab.addEventListener("click", function () { openCharacterPage({ title: "ون بيس", workId: qp("novel") || "preview-one-piece", cast: TEMPLATE_CAST.slice() }); });
    (doc.getElementById("screen") || doc.body).appendChild(fab);
  }

  /* ════════════════════════════════════════════════════════════════════
     CHARACTER PREFERENCE BOARDS  (profile — "أفضل الشخصيات")
     A premium, Apple-styled hub that mirrors the work preference boards:
     8 category tabs, 10 character slots each, a curated picker with search,
     gradient-initial portraits (+ best-effort MAL images), copy-text and a
     shareable poster. Additive: new localStorage keys, never touches app data.
     ════════════════════════════════════════════════════════════════════ */
  var K_CHARBOARDS = "lorefy.characterBoards.v1";       // { [catKey]: [charId x10] }
  var K_CHARIMG    = "lorefy.characterBoardImages.v2";  // verified portraits only
  var K_CHARCUSTOM = "lorefy.characterCustomImages.v1"; // { [charId]: dataURL } user-uploaded
  var K_CBUI       = "lorefy.characterBoards.ui.v1";    // { cat }
  var CB_SLOTS = 10;

  var CB_CATS = [
    { key: "manga",      label: "مانجا",       accent: "#7C3AED" },
    { key: "manhwa",     label: "مانهوا",      accent: "#2563EB" },
    { key: "manhua",     label: "مانهوا صيني", accent: "#DC2626" },
    { key: "comics",     label: "كوميكس",      accent: "#EA580C" },
    { key: "novel",      label: "رواية",       accent: "#0D9488" },
    { key: "book",       label: "كتاب",        accent: "#65A30D" },
    { key: "lightnovel", label: "لايت نوفل",   accent: "#DB2777" },
    { key: "webnovel",   label: "ويب نوفل",    accent: "#4F46E5" }
  ];
  function cbCat(key) { for (var i = 0; i < CB_CATS.length; i++) if (CB_CATS[i].key === key) return CB_CATS[i]; return CB_CATS[0]; }

  function C(id, name, latin, work) { return { id: id, name: latin || name, nameAr: name, latin: latin, work: work }; }
  var CB_CATALOG = {
    manga: [
      C("luffy","مونكي د. لوفي","Monkey D. Luffy","ون بيس"), C("goku","سون غوكو","Son Goku","دراغون بول"),
      C("naruto","ناروتو أوزوماكي","Naruto Uzumaki","ناروتو"), C("sasuke","ساسكي أوتشيها","Sasuke Uchiha","ناروتو"),
      C("ichigo","إيتشيغو كوروساكي","Ichigo Kurosaki","بليتش"), C("light","لايت ياغامي","Light Yagami","مذكرة الموت"),
      C("levi","ليفاي أكرمان","Levi Ackerman","هجوم العمالقة"), C("eren","إيرين ييغر","Eren Yeager","هجوم العمالقة"),
      C("tanjiro","تانجيرو كامادو","Tanjiro Kamado","قاتل الشياطين"), C("gojo","ساتورو غوجو","Satoru Gojo","جوجوتسو كايسن"),
      C("guts","غاتس","Guts","بيرسيرك"), C("vegeta","فيجيتا","Vegeta","دراغون بول"),
      C("gon","غون فريكس","Gon Freecss","هنتر × هنتر"), C("killua","كيلوا زولديك","Killua Zoldyck","هنتر × هنتر"),
      C("saitama","سايتاما","Saitama","ون بانش مان"), C("zoro","رورونوا زورو","Roronoa Zoro","ون بيس"),
      C("itachi","إيتاتشي أوتشيها","Itachi Uchiha","ناروتو"), C("yuji","يوجي إيتادوري","Yuji Itadori","جوجوتسو كايسن"),
      C("denji","دينجي","Denji","تشينسو مان"), C("mikasa","ميكاسا أكرمان","Mikasa Ackerman","هجوم العمالقة")
    ],
    manhwa: [
      C("jinwoo","سونغ جين-وو","Sung Jinwoo","التطور بمفردي"), C("chahaein","تشا هاي-إن","Cha Hae-In","التطور بمفردي"),
      C("kimdokja","كيم دوك-جا","Kim Dokja","قارئ النقطة المحورية"), C("joonghyuk","يو جونغ-هيوك","Yoo Joonghyuk","قارئ النقطة المحورية"),
      C("cale","كايل هينيتوس","Cale Henituse","وُلدت نبيلاً شرّيراً"), C("baam","الخامس والعشرون بام","Twenty-Fifth Baam","برج الإله"),
      C("khun","خون آغويرو","Khun Aguero Agnis","برج الإله"), C("jinmori","جين موري","Jin Mori","ملك الأبطال"),
      C("raizel","كاديس رايزل","Cadis Etrama Di Raizel","نوبليس"), C("danielpark","دانييل بارك","Daniel Park","لوكيزم"),
      C("leesu","لي سو-هو","Lee Suho","الجمال الحقيقي"), C("jugyeong","جو-غيونغ ليم","Jugyeong Lim","الجمال الحقيقي"),
      C("cheon","تشون يو-وون","Cheon Yeo-Woon","آلة النانو"), C("gongservant","سيو مون","Seomun Juyeong","الحرّاس")
    ],
    manhua: [
      C("tangsan","تانغ سان","Tang San","أرض الأرواح"), C("xiaowu","شياو وو","Xiao Wu","أرض الأرواح"),
      C("xiaoyan","شياو يان","Xiao Yan","الاختراق عبر السماء"), C("yunche","يون تشي","Yun Che","ضدّ الآلهة"),
      C("nieli","نيه لي","Nie Li","حكايات الشياطين والآلهة"), C("wangling","وانغ لينغ","Wang Ling","الحياة اليومية لملك الخالدين"),
      C("mofan","مو فان","Mo Fan","الساحر متعدّد المهارات"), C("yangkai","يانغ كاي","Yang Kai","قمّة القتال"),
      C("menghao","منغ هاو","Meng Hao","سأختم السماوات"), C("tangwulin","تانغ وولين","Tang Wulin","أرض الأرواح ٢"),
      C("luofeng","لو فنغ","Luo Feng","النجم المُبتَلَع"), C("shihao","شي هاو","Shi Hao","العالم المثالي"),
      C("yefan","يي فان","Ye Fan","الأبدية المُغطّاة"), C("baixiaochun","باي شياو تشون","Bai Xiaochun","تجسّد الفوضى")
    ],
    comics: [
      C("spiderman","سبايدر-مان","Spider-Man","مارفل"), C("batman","باتمان","Batman","دي سي"),
      C("superman","سوبرمان","Superman","دي سي"), C("ironman","آيرون مان","Iron Man","مارفل"),
      C("wolverine","ولفرين","Wolverine","مارفل"), C("deadpool","ديدبول","Deadpool","مارفل"),
      C("joker","الجوكر","The Joker","دي سي"), C("harley","هارلي كوين","Harley Quinn","دي سي"),
      C("wonderwoman","وندر وومان","Wonder Woman","دي سي"), C("captain","كابتن أمريكا","Captain America","مارفل"),
      C("thor","ثور","Thor","مارفل"), C("hulk","هالك","Hulk","مارفل"),
      C("flash","الفلاش","The Flash","دي سي"), C("spawn","سبون","Spawn","إيمج"),
      C("venom","فينوم","Venom","مارفل"), C("strange","دكتور سترينج","Doctor Strange","مارفل")
    ],
    novel: [
      C("sherlock","شرلوك هولمز","Sherlock Holmes","شرلوك هولمز"), C("harry","هاري بوتر","Harry Potter","هاري بوتر"),
      C("hermione","هيرميون غرينجر","Hermione Granger","هاري بوتر"), C("frodo","فرودو باغنز","Frodo Baggins","سيّد الخواتم"),
      C("gandalf","غاندالف","Gandalf","سيّد الخواتم"), C("aragorn","أراغورن","Aragorn","سيّد الخواتم"),
      C("geralt","جيرالت الريفي","Geralt of Rivia","الويتشر"), C("jonsnow","جون سنو","Jon Snow","صراع العروش"),
      C("tyrion","تيريون لانستر","Tyrion Lannister","صراع العروش"), C("katniss","كاتنيس إيفردين","Katniss Everdeen","ألعاب الجوع"),
      C("elizabeth","إليزابيث بينيت","Elizabeth Bennet","كبرياء وتحامل"), C("gatsby","جاي غاتسبي","Jay Gatsby","غاتسبي العظيم"),
      C("paul","بول أتريدس","Paul Atreides","الكثيب"), C("kvothe","كفوث","Kvothe","اسم الريح"),
      C("ender","إندر ويغن","Ender Wiggin","لعبة إندر")
    ],
    book: [
      C("hamlet","هاملت","Hamlet","هاملت"), C("odysseus","أوديسيوس","Odysseus","الأوديسة"),
      C("achilles","أخيل","Achilles","الإلياذة"), C("dracula","الكونت دراكولا","Count Dracula","دراكولا"),
      C("frankenstein","وحش فرانكنشتاين","Frankenstein's Monster","فرانكنشتاين"), C("valjean","جان فالجان","Jean Valjean","البؤساء"),
      C("anna","آنّا كارينينا","Anna Karenina","آنّا كارينينا"), C("raskolnikov","راسكولنيكوف","Raskolnikov","الجريمة والعقاب"),
      C("ahab","الكابتن آهاب","Captain Ahab","موبي ديك"), C("quixote","دون كيخوته","Don Quixote","دون كيخوته"),
      C("gregor","غريغور سامسا","Gregor Samsa","المسخ"), C("santiago","سانتياغو","Santiago","العجوز والبحر"),
      C("winston","وينستون سميث","Winston Smith","1984"), C("atticus","أتيكوس فينش","Atticus Finch","أن تقتل طائراً بريئاً")
    ],
    lightnovel: [
      C("kirito","كيريتو","Kirito","سورد آرت أونلاين"), C("asuna","أسونا","Asuna","سورد آرت أونلاين"),
      C("rimuru","ريمورو تيمبست","Rimuru Tempest","تجسّدت وحلاً"), C("ainz","أينز أوول غاون","Ainz Ooal Gown","أوفرلورد"),
      C("subaru","سوبارو ناتسوكي","Subaru Natsuki","ري:زيرو"), C("rem","ريم","Rem","ري:زيرو"),
      C("emilia","إميليا","Emilia","ري:زيرو"), C("kazuma","كازوما ساتو","Kazuma Sato","كونوسوبا"),
      C("megumin","ميغومين","Megumin","كونوسوبا"), C("aqua","أكوا","Aqua","كونوسوبا"),
      C("tanya","تانيا","Tanya Degurechaff","سجلّ تانيا الحربي"), C("bell","بيل كرانيل","Bell Cranel","دانماتشي"),
      C("cid","سيد كاجينو","Cid Kagenou","بروز في الظلّ"), C("anos","أنوس فولديغود","Anos Voldigoad","الملك الشيطاني المنبوذ"),
      C("kumoko","كوموكو","Kumoko","إذن أنا عنكبوت، وماذا في ذلك؟")
    ],
    webnovel: [
      C("wkimdokja","كيم دوك-جا","Kim Dokja","قارئ النقطة المحورية"), C("wjoonghyuk","يو جونغ-هيوك","Yoo Joonghyuk","قارئ النقطة المحورية"),
      C("wcale","كايل هينيتوس","Cale Henituse","وُلدت نبيلاً شرّيراً"), C("wjinwoo","سونغ جين-وو","Sung Jinwoo","التطور بمفردي"),
      C("wluofeng","لو فنغ","Luo Feng","النجم المُبتَلَع"), C("wshihao","شي هاو","Shi Hao","العالم المثالي"),
      C("wyefan","يي فان","Ye Fan","الأبدية المُغطّاة"), C("wmenghao","منغ هاو","Meng Hao","سأختم السماوات"),
      C("wwanglin","وانغ لين","Wang Lin","الخالد المنشقّ"), C("wbaixiaochun","باي شياو تشون","Bai Xiaochun","تجسّد الفوضى"),
      C("wfangyuan","فانغ يوان","Fang Yuan","سيّد الطفيليات"), C("wyangkai","يانغ كاي","Yang Kai","قمّة القتال")
    ]
  };
  function cbCatalog(cat) {
    var works = mlWorks(), catalogs = [global.LorefyCharacterCatalog, global.LorefyLiteraryCharacterCatalog, global.LorefyComicsCharacterCatalog].filter(Boolean);
    var signature = works.length + "|" + catalogs.map(function(c){return Object.keys(c).length;}).join("|");
    if (!cbCatalog.cache || cbCatalog.cache.signature !== signature) {
      var byId = new Map(), index = {};
      works.forEach(function(w){byId.set(String(w.id),w); if(w.comicUniverse) byId.set(String(w.comicUniverse),w);});
      catalogs.forEach(function(catalog){Object.keys(catalog).forEach(function(id){
        var w = byId.get(id); if(!w) return;
        var type = String(w.type || "").toLowerCase().replace(/\s+/g, "");
        var key = ({"مانجا":"manga","مانهوا":"manhwa","مانهواصيني":"manhua","كوميكس":"comics","رواية":"novel","كتاب":"book","لايتنوفل":"lightnovel","ويبنوفل":"webnovel"})[type] || type;
        (catalog[id] || []).forEach(function(c){
          if(!c || !c.id) return;
          (index[key] || (index[key]=[])).push(Object.assign({},c,{workId:String(w.id),work:mlTitleOf(w),cat:key}));
        });
      });});
      cbCatalog.cache = {signature:signature,index:index};
    }
    var rows = (CB_CATALOG[cat] || []).concat(cbCatalog.cache.index[cat] || [],cbCatalog.remote && cbCatalog.remote[cat] || []);
    var saved = read("lorefy.characterBoards.catalog.v1",{});
    Object.keys(saved).forEach(function(id){if(saved[id] && saved[id].cat===cat) rows.push(saved[id]);});
    var seen = {};
    return rows.filter(function(c){if(seen[c.id]) return false; seen[c.id]=true; return true;});
  }
  function cbCharById(id) {
    for (var k in CB_CATALOG) { var list = cbCatalog(k); for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; }
    return null;
  }
  function cbLoadWorkCharacters(work, cat) {
    var system = global.LorefyCharacterSystem;
    if (!system || !system.loadCast) return Promise.reject(new Error("Character source unavailable"));
    return system.loadCast(work.sourceWork || work,{allowTitleSearch:true}).then(function(cast){
      var rows = (cast || []).map(function(c){return Object.assign({},c,{name:c.latin || c.name,workId:String(work.id),work:mlTitleOf(work),cat:cat});});
      cbCatalog.remote = cbCatalog.remote || {};
      var previous = (cbCatalog.remote[cat] || []).filter(function(c){return c.workId !== String(work.id);});
      cbCatalog.remote[cat] = previous.concat(rows);
      return rows;
    });
  }
  function cbImageWork(c, cat) {
    var typeMap = { manga: "Manga", manhwa: "Manhwa", manhua: "Manhua", comics: "Comics", novel: "Novel", book: "Book", lightnovel: "Light Novel", webnovel: "Web Novel" };
    var work = { id: "top-character-" + (cat || ""), title: c && c.work || "", type: typeMap[cat] || "" };
    if (cat === "comics") {
      var source = String(c && c.work || "").toLowerCase();
      if (/marvel|مارفل/.test(source)) work.comicPublisher = "Marvel";
      if (/dc|دي سي/.test(source)) work.comicPublisher = "DC";
    }
    return work;
  }

  /* ── state + storage ──────────────────────────────────────────────── */
  var CB = { cat: "manga", editing: null, query: "", pickerEl: null, shareEl: null };
  (function () { var ui = read(K_CBUI, {}); if (ui && cbCat(ui.cat).key === ui.cat) CB.cat = ui.cat; })();
  function cbBoards() { var b = read(K_CHARBOARDS, {}); return (b && typeof b === "object" && !Array.isArray(b)) ? b : {}; }
  function cbSlots(cat) { var arr = (cbBoards()[cat] || []); return Array.from({ length: CB_SLOTS }).map(function (_, i) { return arr[i] || ""; }); }
  function cbSetSlot(cat, idx, charId) {
    if (charId) {
      var character = cbCharById(charId), catalog = read("lorefy.characterBoards.catalog.v1",{});
      if (character) { catalog[charId]=Object.assign({},character,{cat:cat}); write("lorefy.characterBoards.catalog.v1",catalog); }
    }
    var all = cbBoards(); var slots = cbSlots(cat); slots[idx] = charId || ""; all[cat] = slots; write(K_CHARBOARDS, all);
  }
  function cbTotalFilled() { var b = cbBoards(), n = 0; CB_CATS.forEach(function (c) { (b[c.key] || []).forEach(function (x) { if (x) n++; }); }); return n; }

  /* ── portraits: gradient-initial base, best-effort MAL image on top ── */
  function cbHash(s) { s = String(s); var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function cbGrad(id) { var h = cbHash(id), a = h % 360, b = (a + 42) % 360; return "linear-gradient(150deg, hsl(" + a + " 60% 54%), hsl(" + b + " 56% 36%))"; }
  function cbIsNativeRuntime() {
    var capacitor = global.Capacitor;
    try {
      return !!(capacitor && (
        (typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform()) ||
        (typeof capacitor.getPlatform === "function" && capacitor.getPlatform() !== "web")
      ));
    } catch (e) { return false; }
  }
  function cbShareImageUrl(url) {
    url = String(url || "");
    if (!/^https:\/\//i.test(url) || cbIsNativeRuntime()) return url;
    return "/api/media?url=" + encodeURIComponent(url);
  }
  function cbDisplayImageUrl(url) {
    url = String(url || "").trim();
    if (!url) return "";
    try {
      var parsed = new URL(url, global.location.href);
      if (parsed.pathname === "/api/media") return parsed.searchParams.get("url") || url;
    } catch (e) {}
    return url;
  }
  function cbPaintPortrait(wrap,c,url,shareUrl,retryHost) {
    if(wrap._portraitMedia)wrap._portraitMedia.dispose(true);
    wrap.setAttribute('data-cb-source',url||'');
    wrap._cbRetryHost=retryHost;
    wrap._portraitMedia=global.LorefyPortraitMedia.mount(wrap,{src:url,alt:c.name||'',initials:initials(c),language:doc.documentElement.lang,loading:'lazy',shareSrc:shareUrl,retry:retryHost!==false,retryHost:retryHost||undefined,focusTarget:function(){return retryHost&&retryHost.querySelector('.lf-cb-slot-select,.lf-cb-picker-select')||wrap.parentNode&&wrap.parentNode.querySelector('.lf-cb-custom-api');}});
    scheduleCharacterActionIcons();
  }
  function cbPortrait(c, cls, retryHost) {
    var wrap = el("div", { class: "lf-cb-portrait" + (cls ? " " + cls : ""), style: "background-image:" + cbGrad(c.id) },
      global.LorefyPortraitMedia?null:el("span", { class: "lf-cb-initial", text: initials(c) }));
    var cache = read(K_CHARIMG, {}), customUrl = cbCustomImg(c.id), originalUrl = customUrl || c.image || c.img || cache[c.id], url = cbDisplayImageUrl(originalUrl);
    if(global.LorefyPortraitMedia){cbPaintPortrait(wrap,c,url,customUrl||cbShareImageUrl(originalUrl),retryHost);return wrap;}
    if (url) {
      var img = el("img", { src: url, alt: c.name, loading: "lazy", referrerpolicy: "no-referrer", "data-share-src": customUrl || cbShareImageUrl(originalUrl) });
      img.addEventListener("error", function () { try { img.remove(); } catch (e) {} });
      wrap.appendChild(img);
    }
    return wrap;
  }
  function cbRefreshPortrait(wrap,c,url,shareUrl) {
    if(!wrap||!wrap.isConnected||wrap.closest&&wrap.closest('.is-leaving'))return;
    var custom=cbCustomImg(c.id),next=cbDisplayImageUrl(custom||url);
    if(!next)return;
    if(global.LorefyPortraitMedia){if(wrap.getAttribute('data-cb-source')!==next)cbPaintPortrait(wrap,c,next,custom||shareUrl||cbShareImageUrl(next),wrap._cbRetryHost);return;}
    if(wrap.querySelector('img'))return;
    var img=el('img',{src:next,alt:c.name||'',referrerpolicy:'no-referrer','data-share-src':custom||shareUrl||cbShareImageUrl(next)});
    img.addEventListener('error',function(){img.remove();});wrap.appendChild(img);
  }
  var cbImgQueue = [], cbImgBusy = false, cbImgRetried = {};
  function cbCustomImg(id) {
    var m = read(K_CHARCUSTOM, {}), value = (m && typeof m === "object" && m[id]) || "";
    return global.LorefyArtwork ? global.LorefyArtwork.display(value) : value;
  }
  async function cbSetCustomImg(id, dataUrl) {
    await global.LorefyArtwork.saveCharacter(id, dataUrl);
  }
  function cbReadImageFile(file, cb) {
    if (!file || !/^image\//.test(file.type || "")) { toastSafe("اختر ملف صورة"); return; }
    var fr = new FileReader();
    fr.onerror = function () { toastSafe('تعذر قراءة ملف الصورة. اختر صورة أخرى.'); };
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var MAX = 420, s = Math.min(1, MAX / Math.max(img.width, img.height));
        var cv = doc.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.width * s)); cv.height = Math.max(1, Math.round(img.height * s));
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        try { cb(cv.toDataURL("image/jpeg", 0.82)); } catch (e) { toastSafe("تعذر قراءة الصورة"); }
      };
      img.onerror = function () { toastSafe("تعذر قراءة الصورة"); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function cbInvalidateEmbeds() {
    var em = doc.querySelectorAll(".lf-cb-embed");
    for (var i = 0; i < em.length; i++) em[i].setAttribute("data-sig", "stale");
  }
  global.addEventListener("lorefy:artwork-ready", function () {
    cbInvalidateEmbeds();
    syncCharEmbed();
    if (global.__lorefyRefresh) global.__lorefyRefresh();
  });
  function cbEnqueueImage(c, onDone) {
    if (cbCustomImg(c.id)) return; /* user-uploaded image wins — no fetch needed */
    var cache = read(K_CHARIMG, {});
    /* already known (image shown by cbPortrait, or a known miss) → nothing to do.
       Never call onDone synchronously here: callers re-render on it, which would recurse. */
    if (Object.prototype.hasOwnProperty.call(cache, c.id)) {
      if (cache[c.id] || cbImgRetried[c.id]) return;
      cbImgRetried[c.id] = 1;
    }
    cbImgQueue.push({ c: c, cb: onDone }); cbDrainImages();
  }
  function cbDrainImages() {
    if (cbImgBusy || !cbImgQueue.length) return; cbImgBusy = true;
    var job = cbImgQueue.shift();
    cbFetchImage(job.c).then(function (url) {
      var cache = read(K_CHARIMG, {}); cache[job.c.id] = url || ""; write(K_CHARIMG, cache);
      job.cb && job.cb(cbDisplayImageUrl(url || ""), cbShareImageUrl(url || ""));
    }).catch(function () { job.cb && job.cb(""); }).then(function () {
      setTimeout(function () { cbImgBusy = false; cbDrainImages(); }, 380); // respect Jikan rate limit
    });
  }
  function cbFetchImage(c) {
    var isComic = c.cat === "comics" || (CB_CATALOG.comics || []).some(function(row){return row.id===c.id;});
    if (isComic) {
      var system = global.LorefyCharacterSystem;
      if (!system || !system.loadImageOptions) return Promise.resolve("");
      return system.loadImageOptions(c, cbImageWork(c,"comics")).then(function(urls){return urls[0] || "";}).catch(function(){return "";});
    }
    if (c.image || c.img) return Promise.resolve(c.image || c.img);
    var name = c.latin || c.name;
    if (!name) return Promise.resolve("");
    var jikanImage = withTimeout(fetch(growthCatalogUrl("jikan", "https://api.tenrai.org/v1/characters?q=" + encodeURIComponent(name) + "&limit=1&order_by=favorites&sort=desc"), { headers: { Accept: "application/json" } }), 7000)
      .then(function (r) { if (!r.ok) throw new Error("jikan " + r.status); return r.json(); })
      .then(function (j) {
        var d = (j && j.data || []).find(function(row){
          return profileTopCharacterSearchText(row.name).split(/\W+/).filter(Boolean).sort().join(" ") === profileTopCharacterSearchText(name).split(/\W+/).filter(Boolean).sort().join(" ");
        });
        return (d && d.images && ((d.images.webp && d.images.webp.image_url) || (d.images.jpg && d.images.jpg.image_url))) || "";
      });
    function anilistImage(search) {
      var query = "query($search:String){Character(search:$search){name{full} image{large}}}";
      return withTimeout(fetch(growthCatalogUrl("anilist", "https://graphql.anilist.co"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: query, variables: { search: search } })
      }), 7000).then(function (r) {
        if (!r.ok) throw new Error("anilist " + r.status);
        return r.json();
      }).then(function (j) {
        var found=j && j.data && j.data.Character;
        var actual=profileTopCharacterSearchText(found && found.name && found.name.full).split(/\W+/).filter(Boolean).sort().join(" ");
        var expected=profileTopCharacterSearchText(name).split(/\W+/).filter(Boolean).sort().join(" ");
        return actual===expected && found && found.image && found.image.large || "";
      });
    }
    return jikanImage.catch(function () { return ""; }).then(function(url){
      return url || anilistImage(name).catch(function(){return "";});
    });
  }

  /* ── embedded inside the work-preferences hub (under the work board) ── */
  /* which work category is active in the open preferences hub? map its
     Arabic tab label to our character category. */
  function catFromHub() {
    var hub = doc.querySelector(".lf-pref-board-hub");
    if (!hub) return null;
    var active = hub.querySelector(".lf-pref-board-tabs button.is-active");
    var label = active ? (active.textContent || "").trim() : "";
    for (var i = 0; i < CB_CATS.length; i++) if (CB_CATS[i].label === label) return CB_CATS[i];
    // fallback: derive from head/card title text
    var title = hub.querySelector(".lf-pref-board-card-title");
    var t = title ? (title.textContent || "") : "";
    for (var j = 0; j < CB_CATS.length; j++) if (t.indexOf(CB_CATS[j].label) >= 0) return CB_CATS[j];
    return CB_CATS[0];
  }

  function closePicker() { if(CB.pickerEl){if(CB.pickerEl._nestedImagePicker)closeCharacterImagePicker(CB.pickerEl._nestedImagePicker);releaseCharacterPortraits(CB.pickerEl);}if (CB.pickerEl && CB.pickerEl.parentNode) CB.pickerEl.parentNode.removeChild(CB.pickerEl); CB.pickerEl = null; CB.editing = null; if(CB.pickerOpener && CB.pickerOpener.isConnected) CB.pickerOpener.focus(); CB.pickerOpener=null; }
  function closeShare() { if (CB.shareEl && CB.shareEl.parentNode) CB.shareEl.parentNode.removeChild(CB.shareEl); CB.shareEl = null; }
  function overlayMount() { return doc.getElementById("screen") || doc.body; }

  function openPicker(cat, index) {
    closePicker();
    CB.pickerOpener=doc.activeElement;
    CB.editing = index; CB.query = "";
    CB.pickerEl = buildPicker(cat);
    overlayMount().appendChild(CB.pickerEl);
    CB.pickerEl.querySelector("input").focus();
  }
  function openShare(cat) {
    closeShare();
    if(global.LorefyShareComposer)return global.LorefyShareComposer.open({kind:'ranking',title:'أفضل شخصيات '+cat.label,profile:global.LorefyShareComposer.currentProfile(),items:cbSlots(cat.key).map(function(id,index){var c=id&&cbCharById(id);return c?{id:c.id,name:c.name,image:cbCustomImg(c.id)||read(K_CHARIMG,{})[c.id]||characterImageUrl(c),rank:index+1}:null;}).filter(Boolean),resolveImage:function(item){var c=cbCharById(item.id);return c?cbFetchImage(c):'';}});
    CB.shareEl = buildShareSheet(cat, cbSlots(cat.key));
    overlayMount().appendChild(CB.shareEl);
  }

  /* build the character block that lives at the bottom of the hub rail */
  function buildCharEmbed(cat) {
    var slots = cbSlots(cat.key), filled = slots.filter(Boolean).length;

    var shareChip = el("button", { type: "button", class: "lf-cb-card-share" }, [ el("span", { class: "lf-cb-share-ic", html: "&#9633;", "aria-hidden": "true" }), "شير" ]);
    shareChip.addEventListener("click", function () { openShare(cat); });
    var cardHead = el("div", { class: "lf-cb-card-head" }, [
      el("div", { class: "lf-cb-card-main" }, [
        el("span", { class: "lf-cb-card-title", text: "أفضل شخصيات " + cat.label }),
        el("span", { class: "lf-cb-card-meta", text: filled + " / " + CB_SLOTS + " شخصيات" })
      ]),
      shareChip
    ]);
    var note = el("p", { class: "lf-cb-card-note", text: "رتّب أفضل 10 شخصيات من تصنيف " + cat.label });

    var grid = el("div", { class: "lf-cb-cover-grid" }, slots.map(function (id, index) {
      var c = id ? cbCharById(id) : null;
      var slot = el("div", { class: "lf-cb-slot" + (c ? " is-filled" : "") },
        [ el("span", { class: "lf-cb-slot-num", text: String(index + 1) }) ]);
      if (c) {
        var portrait = cbPortrait(c, "lf-cb-slot-portrait", slot);
        slot.appendChild(portrait);
        slot.appendChild(el("span", { class: "lf-cb-slot-name", text: c.name }));
        cbEnqueueImage(c, function (url,shareUrl) { cbRefreshPortrait(portrait,c,url,shareUrl); });
      }
      var select=el("button",{type:"button",class: "lf-cb-slot-select","aria-haspopup":"dialog","aria-label":c?uiText("تعديل خانة ","Edit slot ")+(index+1)+": "+c.name:uiText("خانة فارغة ","Empty slot ")+(index+1)});
      select.addEventListener("click", function () { openPicker(cat, index); });slot.appendChild(select);
      return slot;
    }));

    var openBtn = el("button", { type: "button", class: "lf-cb-act-primary", text: filled ? "تعديل القائمة" : "ابدأ الاختيار" });
    openBtn.addEventListener("click", function () { var next = slots.indexOf(""); openPicker(cat, next < 0 ? 0 : next); });
    var copyBtn = el("button", { type: "button", class: "lf-cb-act-secondary", text: "نسخ النص" });
    copyBtn.addEventListener("click", function () { cbCopyText(cat.key); });
    var actions = el("div", { class: "lf-cb-card-actions" }, [ openBtn, copyBtn ]);

    var card = el("article", { class: "lf-cb-card-shell", style: "--lf-cb-accent:" + cat.accent }, [ cardHead, note, grid, actions ]);

    var label = el("div", { class: "lf-cb-embed-label" }, [
      el("span", { class: "lf-cb-embed-kicker", text: "قائمة قابلة للمشاركة" }),
      el("h3", { text: "أفضل الشخصيات" }),
      el("p", { text: "نفس فكرة قوائم الأعمال — عشر شخصيات لكل تصنيف، تتبع القسم المحدّد بالأعلى." })
    ]);

    return el("section", { class: "lf-cb-embed", style: "--lf-cb-accent:" + cat.accent, "aria-label": "أفضل الشخصيات" }, [ label, card ]);
  }

  /* keep the character block in sync with the open hub + active category */
  function syncCharEmbed() {
    var hub = doc.querySelector(".lf-pref-board-hub");
    if (!hub) { releaseCharacterPortraits(CB.embedEl);CB.embedEl=null;var stray = doc.querySelector(".lf-cb-embed"); if (stray && stray.parentNode) stray.parentNode.removeChild(stray); closePicker(); closeShare(); return false; }
    var rail = hub.querySelector(".lf-pref-board-rail");
    if (!rail) return false;
    var cat = catFromHub();
    if (!cat) return false;
    var sig = "embed|" + cat.key + "|" + cbSlots(cat.key).join(",");
    var existing = rail.querySelector(".lf-cb-embed");
    if(CB.embedEl&&CB.embedEl!==existing)releaseCharacterPortraits(CB.embedEl);
    CB.embedEl=existing;
    if (existing && existing.getAttribute("data-sig") === sig) return true;
    var next = buildCharEmbed(cat); next.setAttribute("data-sig", sig);
    if (existing && existing.parentNode === rail) {releaseCharacterPortraits(existing);rail.replaceChild(next, existing);}
    else rail.appendChild(next);
    CB.embedEl=next;
    return true;
  }

  function buildPicker(cat) {
    var owner=profileRatedCharacterOwner(),picker,imageSaving=false;
    function isPickerCurrent(){return !!(picker && CB.pickerEl === picker && picker.isConnected && profileRatedCharacterOwner() === owner);}
    var slots = cbSlots(cat.key), currentId = slots[CB.editing];
    var usedExceptThis = {}; slots.forEach(function (id, i) { if (id && i !== CB.editing) usedExceptThis[id] = 1; });
    var q = profileTopCharacterSearchText(CB.query);
    var candidates = cbCatalog(cat.key).filter(function (c) {
      if (usedExceptThis[c.id]) return false;
      if (!q) return true;
      return clCastText(c).indexOf(q) >= 0 || profileTopCharacterSearchText(c.work).indexOf(q) >= 0;
    });

    var closeBtn = el("button", { type: "button", "aria-label": "إغلاق", html: "&#10005;" });
    closeBtn.addEventListener("click", function () { closePicker(); });
    var pickerHead = el("div", { class: "lf-cb-picker-head" }, [
      el("div", null, [ el("strong", { text: "اختر شخصية" }), el("span", { text: cat.label + " · خانة " + (CB.editing + 1) }) ]),
      closeBtn
    ]);

    var search = el("input", { type: "search", class: "lf-cb-picker-search", placeholder: "ابحث عن شخصية…", value: CB.query || "", "aria-label": "بحث" });
    search.addEventListener("input", function () {
      CB.query = search.value;
      var host = CB.pickerEl ? CB.pickerEl.querySelector(".lf-cb-picker-options") : null; if (host) { host.setAttribute("data-visible","80"); fillPickerOptions(host, cat); }
    });

    var clear = null, customRow = null;
    if (currentId) {
      var curC = cbCharById(currentId);
      if (curC) {
        var fileInput = el("input", { type: "file", accept: "image/*", style: "display:none" });
        fileInput.addEventListener("change", function () {
          var f = fileInput.files && fileInput.files[0];
          if (!f || !isPickerCurrent()) return;
          cbReadImageFile(f, async function (dataUrl) {
            if (!isPickerCurrent() || imageSaving) return;
            imageSaving=true;
            upBtn.disabled = true;
            try { await cbSetCustomImg(curC.id, dataUrl); }
            catch (error) { if(isPickerCurrent())toastSafe(error.message); return; }
            finally { imageSaving=false;if(isPickerCurrent())upBtn.disabled = false; }
            if (!isPickerCurrent()) return;
            toastSafe("تم حفظ صورتك لـ " + curC.name);
            cbInvalidateEmbeds(); syncCharEmbed();
            openPicker(cat, CB.editing); /* rebuild picker with new preview */
          });
          fileInput.value = '';
        });
        var upBtn = el("button", { type: "button", class: "lf-cb-custom-up", text: cbCustomImg(currentId) ? "تغيير الصورة" : "ارفع صورة من جهازك" });
        upBtn.addEventListener("click", function () { fileInput.click(); });
        var apiBtn = el("button", { type: "button", class: "lf-cb-custom-api", text: "صور API" });
        apiBtn.addEventListener("click", function () {
          if(!isPickerCurrent()||imageSaving)return;
          openCharacterImagePicker(curC, function () {
            if (!isPickerCurrent()) return;
            cbInvalidateEmbeds(); syncCharEmbed();
            openPicker(cat, CB.editing);
          }, cbImageWork(curC, cat.key));
          picker._nestedImagePicker=activeImagePicker;
        });
        var kids = [
          cbPortrait(curC, "lf-cb-custom-preview"),
          el("span", { class: "lf-cb-custom-copy" }, [
            el("strong", { text: curC.name }),
            el("em", { text: "صورة الشخصية — تلقائية أو من جهازك" })
          ]),
          apiBtn, upBtn, fileInput
        ];
        if (cbCustomImg(currentId)) {
          var rmBtn = el("button", { type: "button", class: "lf-cb-custom-rm", "aria-label": "إزالة الصورة المخصصة", text: "×" });
          rmBtn.addEventListener("click", async function () {
            if(!isPickerCurrent()||imageSaving)return;
            imageSaving=true;
            rmBtn.disabled = true;
            try { await cbSetCustomImg(curC.id, ""); }
            catch (error) { if(isPickerCurrent())toastSafe(error.message); return; }
            finally { imageSaving=false;if(isPickerCurrent())rmBtn.disabled = false; }
            if (!isPickerCurrent()) return;
            toastSafe("أُزيلت الصورة المخصصة");
            cbInvalidateEmbeds(); syncCharEmbed();
            openPicker(cat, CB.editing);
          });
          kids.push(rmBtn);
        }
        customRow = el("div", { class: "lf-cb-custom-row" }, kids);
      }
      clear = el("button", { type: "button", class: "lf-cb-picker-clear", text: "تفريغ هذه الخانة" });
      clear.addEventListener("click", function () { cbSetSlot(cat.key, CB.editing, ""); closePicker(); syncCharEmbed(); toastSafe("تم تفريغ الخانة"); });
    }

    var options = el("div", { class: "lf-cb-picker-options" });
    fillPickerOptions(options, cat);

    var workSearch = el("input",{type:"search",class:"lf-cb-picker-search",placeholder:uiText("شخصيات عمل آخر… ابحث عن العمل","Characters from another work…"),"aria-label":uiText("ابحث عن عمل لتحميل شخصياته","Find a work to load its characters")});
    var workResults = el("div",{class:"lf-ml-results"});
    var workStatus = el("p",{class:"lf-cb-picker-status",role:"status","aria-live":"polite"});
    var workRequest = 0;
    workSearch.addEventListener("input",function(){
      workRequest++; workResults.textContent=""; workStatus.textContent="";
      var query=workSearch.value.trim(); if(query.length<2) return;
      var types={manga:"Manga",manhwa:"Manhwa",manhua:"Manhua",comics:"Comics",novel:"Novel",book:"Book",lightnovel:"Light Novel",webnovel:"Web Novel"};
      var data=global.LorefyCatalogData;
      var matches=mlWorks().filter(function(w){return (w.type===types[cat.key] || w.type===cat.label) && data && data.matchesCatalogQuery(w,query);}).slice(0,20);
      matches.forEach(function(w){
        var button=el("button",{type:"button",class:"lf-ml-result"},[mlResultCover(w),el("strong",{text:mlTitleOf(w)})]);
        button.addEventListener("click",function(){
          var request=++workRequest; workStatus.textContent=uiText("جاري تحميل الشخصيات…","Loading characters…");
          cbLoadWorkCharacters(w,cat.key).then(function(rows){
            if(request!==workRequest || !isPickerCurrent()) return;
            workStatus.textContent=rows.length?rows.length+uiText(" شخصية"," characters"):uiText("لا توجد شخصيات موثقة لهذا العمل","No verified characters for this work");
            workResults.textContent="";
            CB.query=search.value; options.setAttribute("data-visible","80"); fillPickerOptions(options,cat);
          }).catch(function(){if(request===workRequest && workStatus.isConnected) workStatus.textContent=uiText("تعذر التحميل. حاول مجددًا.","Unable to load. Try again.");});
        });
        workResults.appendChild(button);
      });
      if(!matches.length) workStatus.textContent=uiText("لا توجد أعمال مطابقة","No matching works");
    });
    var cardKids = [ el("div", { class: "lf-cb-picker-grabber", "aria-hidden": "true" }), pickerHead, search,workSearch,workResults,workStatus ];
    if (customRow) cardKids.push(customRow);
    if (clear) cardKids.push(clear);
    cardKids.push(options);
    var pickerCard = el("div", { class: "lf-cb-picker-card",role:"dialog","aria-modal":"true","aria-label":uiText("اختيار شخصية","Choose a character") }, cardKids);
    pickerCard.addEventListener("click", function (e) { e.stopPropagation(); });
    pickerCard.addEventListener("keydown",function(e){
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closePicker();return;}
      if(e.key!=="Tab") return;
      var items=Array.from(pickerCard.querySelectorAll("button,input,select,a[href]")).filter(function(x){return !x.disabled && x.getClientRects().length;});
      var first=items[0],last=items[items.length-1];
      if(e.shiftKey && doc.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && doc.activeElement===last){e.preventDefault();first.focus();}
    });

    picker = el("div", { class: "lf-cb-picker" }, pickerCard);
    picker.addEventListener("click", function () { closePicker(); });
    return picker;
  }

  function fillPickerOptions(host, cat) {
    var slots = cbSlots(cat.key), currentId = slots[CB.editing];
    var usedExceptThis = {}; slots.forEach(function (id, i) { if (id && i !== CB.editing) usedExceptThis[id] = 1; });
    var q = profileTopCharacterSearchText(CB.query);
    var candidates = cbCatalog(cat.key).filter(function (c) {
      if (usedExceptThis[c.id]) return false;
      if (!q) return true;
      return clCastText(c).indexOf(q) >= 0 || profileTopCharacterSearchText(c.work).indexOf(q) >= 0;
    });
    releaseCharacterPortraits(host);
    host.innerHTML = "";
    if (!candidates.length) { host.appendChild(el("p", { class: "lf-cb-picker-empty", text: "لا توجد نتائج مطابقة" })); return; }
    var visible = Number(host.getAttribute("data-visible")) || 80;
    candidates.slice(0,visible).forEach(function (c) {
      var opt = el("div", { class: "lf-cb-picker-option" + (c.id === currentId ? " is-current" : "") });
      [cbPortrait(c, "lf-cb-opt-portrait", opt),
        el("span", { class: "lf-cb-opt-copy" }, [ el("strong", { text: c.name }), el("em", { text: c.latin + " · " + c.work }) ])
      ].forEach(function(child){opt.appendChild(child);});
      var select=el("button",{type:"button",class: "lf-cb-picker-select","aria-label":c.name,"aria-pressed":String(c.id===currentId)});
      select.addEventListener("click", function () { cbSetSlot(cat.key, CB.editing, c.id); closePicker(); syncCharEmbed(); toastSafe("تم حفظ الخانة"); });opt.appendChild(select);
      cbEnqueueImage(c, function (url,shareUrl) { cbRefreshPortrait(opt.querySelector('.lf-cb-portrait'),c,url,shareUrl); });
      host.appendChild(opt);
    });
    if(candidates.length>visible){
      var more=el("button",{type:"button",class:"lf-clx-load-more",text:uiText("عرض المزيد","Show more")});
      more.addEventListener("click",function(){host.setAttribute("data-visible",String(visible+80));fillPickerOptions(host,cat);});
      host.appendChild(more);
    }
  }

  function cbShareText(catKey) {
    var cat = cbCat(catKey), slots = cbSlots(catKey), name = cbUserName();
    var lines = slots.map(function (id, i) { var c = id ? cbCharById(id) : null; return (i + 1) + ". " + (c ? c.name : "____"); }).join("\n");
    return name + " · أفضل شخصيات " + cat.label + "\nقائمتي المختارة من تصنيف " + cat.label + "\n" + lines + "\n#Lorefy";
  }
  function cbCopyText(catKey) {
    var txt = cbShareText(catKey);
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toastSafe("تم نسخ نص القائمة"); }, function () { toastSafe("تعذّر النسخ"); });
    else toastSafe("النسخ غير مدعوم");
  }
  function cbUserName() {
    try { var id = read("lorefy.identity.v1", null); if (id && id.name) return id.name; } catch (e) {}
    return "Lorefy Reader";
  }
  function toastSafe(msg) {
    try { if (global.LorefyToast) return global.LorefyToast(msg); } catch (e) {}
    var t = el("div", { class: "lf-cb-toast", text: msg }); (doc.getElementById("screen") || doc.body).appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-in"); });
    setTimeout(function () { t.classList.remove("is-in"); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260); }, 1800);
  }

  function buildShareSheet(cat, slots) {
    var name = cbUserName(), filled = slots.filter(Boolean).length;
    var poster = el("div", { class: "lf-cb-poster", style: "--lf-cb-accent:" + cat.accent }, [
      el("div", { class: "lf-cb-poster-top" }, [ el("span", { text: name }), el("strong", { text: CB_SLOTS + " شخصيات" }) ]),
      el("h3", { text: "أفضل شخصيات " + cat.label }),
      el("p", { text: "قائمتي المختارة من تصنيف " + cat.label }),
      el("div", { class: "lf-cb-poster-grid" }, slots.map(function (id, i) {
        var c = id ? cbCharById(id) : null;
        var tile = el("div", { class: "lf-cb-poster-tile" + (c ? " is-filled" : "") }, el("b", { text: String(i + 1) }));
        if (c) {
          tile.style.backgroundImage = cbGrad(c.id);
          tile.appendChild(el("span", { class: "lf-cb-poster-name", text: c.name }));
          var cache = read(K_CHARIMG, {}), custom = cbCustomImg(c.id), original = custom || cache[c.id], cbu = cbDisplayImageUrl(original);
          if (cbu) {
            var im = el("img", { src: cbu, alt: c.name, referrerpolicy: "no-referrer", "data-share-src": custom || cbShareImageUrl(original) });
            im.addEventListener("error", function () { try { im.remove(); } catch (e) {} });
            tile.insertBefore(im, tile.firstChild);
          }
          cbEnqueueImage(c,function(url, shareUrl) {
            if (!url || tile.querySelector("img")) return;
            var loaded = el("img", { src: url, alt: c.name, referrerpolicy: "no-referrer", "data-share-src": shareUrl || cbShareImageUrl(url) });
            loaded.addEventListener("error", function () { try { loaded.remove(); } catch (e) {} });
            tile.insertBefore(loaded, tile.firstChild);
          });
        }
        return tile;
      })),
      el("footer", { text: "On the Lorefy app" })
    ]);

    var closeBtn = el("button", { type: "button", class: "lf-cb-share-close", "aria-label": "إغلاق", html: "&#10005;" });
    closeBtn.addEventListener("click", function () { closeShare(); });
    var head = el("div", { class: "lf-cb-share-head" }, [
      closeBtn,
      el("div", null, [ el("strong", { text: "حفظ ومشاركة القائمة" }), el("span", { text: cat.label + " · " + filled + " / " + CB_SLOTS }) ]),
      el("span", { class: "lf-cb-share-mark", text: "PNG" })
    ]);

    var saveBtn = el("button", { type: "button", class: "lf-cb-share-save" }, "حفظ كصورة");
    saveBtn.addEventListener("click", function () { cbSaveImage(cat, slots); });
    var shareBtn = el("button", { type: "button", class: "lf-cb-share-native" }, "مشاركة");
    shareBtn.addEventListener("click", function () { cbNativeShare(cat, slots); });
    var copyBtn2 = el("button", { type: "button", class: "lf-cb-share-copy" }, "نسخ النص");
    copyBtn2.addEventListener("click", function () { cbCopyText(cat.key); });
    var actions = el("div", { class: "lf-cb-share-actions" }, [ saveBtn, shareBtn, copyBtn2 ]);

    var sheetCard = el("div", { class: "lf-cb-share-card" }, [ el("div", { class: "lf-cb-share-grabber", "aria-hidden": "true" }), head, el("div", { class: "lf-cb-share-preview" }, poster), actions ]);
    sheetCard.addEventListener("click", function (e) { e.stopPropagation(); });
    var sheet = el("div", { class: "lf-cb-share-sheet" }, sheetCard);
    sheet.addEventListener("click", function () { closeShare(); });
    return sheet;
  }

  function cbNativeShare(cat, slots) {
    var txt = cbShareText(cat.key);
    if (global.LorefyShareStudio) {
      var studioCard = shareStudioCard("أفضل شخصيات " + cat.label, slots.map(function (id) {
        var c = id ? cbCharById(id) : null, cache = read(K_CHARIMG, {}), custom = c && cbCustomImg(c.id), original = c && (custom || cache[c.id]);
        return c ? { name: c.name, img: cbDisplayImageUrl(original), shareImg: custom || cbShareImageUrl(original) } : { name: "", img: "" };
      }));
      return global.LorefyShareStudio.buildShelfStoryFile(studioCard).then(function (file) {
        return global.LorefyShareStudio.nativeFileShare(file, "أفضل شخصيات " + cat.label, txt);
      }).catch(function () { cbCopyText(cat.key); });
    }
    if (global.navigator && navigator.share) { navigator.share({ title: "أفضل شخصيات " + cat.label, text: txt }).catch(function () {}); }
    else cbCopyText(cat.key);
  }
  function shareStudioCard(title, items) {
    var card = el("div", { class: "lf-share-shelf-preview", "data-lf-share-layout": "shelf" }, [el("h3", { text: title })]);
    (items || []).forEach(function (item) {
      var row = el("div", { class: "lf-share-studio-source" });
      if (item && item.img) {
        var image = el("img", { src: cbDisplayImageUrl(item.img), alt: item.name || "", referrerpolicy: "no-referrer", "data-share-src": item.shareImg || cbShareImageUrl(item.img) });
        image.addEventListener("error", function () { try { image.remove(); } catch (e) {} });
        row.appendChild(image);
      }
      row.appendChild(el("span", { class: "lf-cb-poster-name", text: (item && item.name) || "" }));
      card.appendChild(row);
    });
    return card;
  }
  /* poster → canvas (gradient portraits only, so export never taints) */
  function cbSaveImage(cat, slots) {
    if (global.LorefyShareStudio) {
      var studioCard = shareStudioCard("أفضل شخصيات " + cat.label, slots.map(function (id) {
        var c = id ? cbCharById(id) : null, cache = read(K_CHARIMG, {}), custom = c && cbCustomImg(c.id), original = c && (custom || cache[c.id]);
        return c ? { name: c.name, img: cbDisplayImageUrl(original), shareImg: custom || cbShareImageUrl(original) } : { name: "", img: "" };
      }));
      return global.LorefyShareStudio.buildShelfStoryFile(studioCard).then(function (file) {
        global.LorefyShareStudio.saveFile(file);
        toastSafe("تم حفظ صورة الرف");
      }).catch(function () { cbCopyText(cat.key); });
    }
    try {
      var W = 1080, H = 1350, cv = doc.createElement("canvas"); cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d"), AC = cat.accent || "#7C3AED";
      ctx.fillStyle = "#0b0812"; ctx.fillRect(0, 0, W, H);
      function az(x, y, r, c1, c2) { var gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c1); gr.addColorStop(1, c2); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
      az(W * 0.82, 140, 700, AC + "3d", AC + "00");
      az(110, H - 180, 740, AC + "24", AC + "00");
      ctx.strokeStyle = "rgba(255,255,255,0.028)"; ctx.lineWidth = 1;
      for (var gx = 0; gx <= W; gx += 90) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = 0; gy <= H; gy += 90) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      /* header */
      ctx.fillStyle = AC; roundRect(ctx, W - 84 - 176, 86, 176, 44, 22); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.font = "900 22px Arial"; ctx.fillText("LOREFY \u2605", W - 84 - 88, 116);
      ctx.textAlign = "right"; ctx.direction = "rtl";
      ctx.fillStyle = "#fff"; ctx.font = "950 72px Cairo, Arial";
      ctx.fillText(cbTrim2(ctx, "\u0623\u0641\u0636\u0644 \u0634\u062e\u0635\u064a\u0627\u062a " + cat.label, W - 300), W - 84, 236);
      ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "700 30px Cairo, Arial";
      ctx.fillText(cbUserName() + " \u00b7 " + slots.filter(Boolean).length + " \u0645\u0646 " + CB_SLOTS, W - 84, 290);
      var dv = ctx.createLinearGradient(84, 0, W - 84, 0); dv.addColorStop(0, AC + "00"); dv.addColorStop(.5, AC + "88"); dv.addColorStop(1, AC + "00");
      ctx.fillStyle = dv; ctx.fillRect(84, 340, W - 168, 3);
      /* portrait grid 5x2 */
      var cols = 5, gap = 26, sx = 84, sy = 404, tw = (W - 168 - gap * (cols - 1)) / cols, th = tw * 1.32;
      ctx.direction = "ltr";
      slots.forEach(function (id, i) {
        var c = id ? cbCharById(id) : null;
        var x = sx + (i % cols) * (tw + gap), y = sy + Math.floor(i / cols) * (th + gap + 56);
        if (c) {
          ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
          var hsh = cbHash(c.id), ha = hsh % 360, hb = (ha + 42) % 360;
          var gg = ctx.createLinearGradient(x, y, x + tw, y + th);
          gg.addColorStop(0, "hsl(" + ha + " 62% 52%)"); gg.addColorStop(1, "hsl(" + hb + " 58% 32%)");
          roundRect(ctx, x, y, tw, th, 18); ctx.fillStyle = gg; ctx.fill(); ctx.restore();
          var fg = ctx.createLinearGradient(0, y + th - 64, 0, y + th);
          fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(1, "rgba(0,0,0,.4)");
          ctx.save(); roundRect(ctx, x, y, tw, th, 18); ctx.clip(); ctx.fillStyle = fg; ctx.fillRect(x, y + th - 64, tw, 64); ctx.restore();
          ctx.strokeStyle = AC + "55"; ctx.lineWidth = 2; roundRect(ctx, x + 1, y + 1, tw - 2, th - 2, 17); ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.textAlign = "center"; ctx.font = "800 52px -apple-system, Arial";
          ctx.fillText(initials(c), x + tw / 2, y + th / 2 + 18);
          ctx.fillStyle = AC; ctx.beginPath(); ctx.arc(x + tw - 24, y + 24, 18, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "900 19px Arial"; ctx.fillText(String(i + 1), x + tw - 24, y + 31);
          ctx.fillStyle = "rgba(255,255,255,.88)"; ctx.font = "700 22px Cairo, Arial"; ctx.direction = "rtl";
          ctx.fillText(cbTrim(ctx, c.name, tw + 12), x + tw / 2, y + th + 34); ctx.direction = "ltr";
        } else {
          ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 2; ctx.setLineDash([9, 8]);
          roundRect(ctx, x + 1, y + 1, tw - 2, th - 2, 18); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255,255,255,.04)"; roundRect(ctx, x + 1, y + 1, tw - 2, th - 2, 18); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.28)"; ctx.textAlign = "center"; ctx.font = "300 44px Arial";
          ctx.fillText("+", x + tw / 2, y + th / 2 + 15); ctx.restore();
        }
      });
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "700 24px Arial";
      ctx.fillText("On the Lorefy app", 84, H - 84);
      ctx.textAlign = "right"; ctx.fillStyle = AC; ctx.font = "900 40px Arial";
      ctx.fillText("#Lorefy", W - 84, H - 78);
      cv.toBlob(function (blob) {
        if (!blob) { cbCopyText(cat.key); return; }
        var url = URL.createObjectURL(blob), aa = doc.createElement("a"); aa.href = url; aa.download = "lorefy-characters-" + cat.key + ".png"; doc.body.appendChild(aa); aa.click(); aa.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1600); toastSafe("\u062a\u0645 \u062d\u0641\u0638 \u0635\u0648\u0631\u0629 \u0627\u0644\u0642\u0627\u0626\u0645\u0629");
      }, "image/png");
    } catch (e) { cbCopyText(cat.key); }
  }
  function cbTrim2(ctx, text, max) { var s = String(text); if (ctx.measureText(s).width <= max) return s; while (s.length > 1 && ctx.measureText(s + "\u2026").width > max) s = s.slice(0, -1); return s + "\u2026"; }
  function cbTrim(ctx, text, max) { var s = String(text); if (ctx.measureText(s).width <= max) return s; while (s.length > 1 && ctx.measureText(s + "…").width > max) s = s.slice(0, -1); return s + "…"; }
  function roundRect(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* embed the character block into the open preferences hub (kept name so
     the observer/boot callers below stay unchanged) */
  function injectCharacterLauncher() { try { return syncCharEmbed(); } catch (e) { return false; } }

  /* ════════════════════════════════════════════════════════════════════
     MY CUSTOM LISTS + YEARLY WRAP  (growth-v22)
     Additive: lorefy.customLists.v1; reads app data read-only for stats.
     ════════════════════════════════════════════════════════════════════ */
  var K_LISTS = "lorefy.customLists.v1"; /* [{id,name,accent,works:[mid],ts}] */
  var ML_ACCENTS = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];
  var mlWorkMap = null;
  function mlWorks() { return (global.LorefyMangaData && global.LorefyMangaData.length ? global.LorefyMangaData : []); }
  function mlWorkBy(id) {
    if (!mlWorkMap || mlWorkMap.size !== mlWorks().length) {
      mlWorkMap = new Map();
      mlWorks().forEach(function (w) { mlWorkMap.set(String(w.id), w); });
    }
    return mlWorkMap.get(String(id)) || null;
  }
  function mlCoverOf(w) { return w ? (w.sourceCoverUrl || w.cover || w.coverImage || "") : ""; }
  function isSupportedDisplayTitle(value) {
    var title = String(value || "").replace(/\s+/g, " ").trim();
    if (!title || /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(title)) return false;
    return /[A-Za-z\u00c0-\u024f\u0600-\u06ff]/.test(title);
  }
  function mlTitleOf(w) {
    if (!w) return "";
    var candidates = [w.titleEnglish, w.english, w.title, w.searchTitle, w.ar];
    for (var i = 0; i < candidates.length; i++) {
      var title = String(candidates[i] || "").replace(/\s+/g, " ").trim();
      if (isSupportedDisplayTitle(title)) return title;
    }
    return "";
  }
  function mlLists() { return read(K_LISTS, []) || []; }
  function mlSave(lists) {
    write(K_LISTS, lists);
    var sub = doc.querySelector(".lf-extra-lists .lf-extra-sub");
    if (sub) sub.textContent = lists.length ? lists.length + " قائمة" : "أنشئ قوائم خاصة وشاركها";
  }

  /* ── top-10 characters per work ── */
  var K_CLISTS = "lorefy.charTopLists.v1"; /* [{id,mid,accent,chars:[{id,name,img}],ts}] */
  var CLX_CAST_BATCH = 80;
  var clCastCache = {};
  function clLists() {
    return (read(K_CLISTS, []) || []).map(function (list) {
      return Object.assign({}, list, { title: mlTitleOf(mlWorkBy(list.mid)) || list.title || "" });
    });
  }
  function clSave(lists) { write(K_CLISTS, lists); }
  function clCastText(ch) {
    var knownNames={kurapika:"كورابيكا كورا", "killua zoldyck":"كيلوا زولديك", "gon freecss":"غون جون فريكس", "leorio paladiknight":"ليوريو", "hisoka morow":"هيسوكا", "chrollo lucilfer":"كرولو", "illumi zoldyck":"إيلومي ايلومي", "meruem":"ميرويم", "guts":"غاتس جاتس", "griffith":"غريفيث جريفيث", "casca":"كاسكا"};
    var arabicName=knownNames[String(ch && (ch.latin || ch.name) || '').toLowerCase()] || '';
    return profileTopCharacterSearchText([ch && ch.name,ch && ch.latin,ch && ch.nameAr,ch && ch.key,arabicName].concat(ch && ch.aliases || []).filter(Boolean).join(" "));
  }
  function clFilterCast(rows, query) {
    rows = Array.isArray(rows) ? rows : [];
    query = profileTopCharacterSearchText(query);
    if (!query) return rows.slice();
    return rows.filter(function (ch) { return clCastText(ch).indexOf(query) >= 0; });
  }
  function clLoadCast(mid, cb) {
    if (clCastCache[mid]) return cb(clCastCache[mid]);
    var w = mlWorkBy(mid);
    var characterSystem = global.LorefyCharacterSystem;
    if (w && characterSystem && typeof characterSystem.loadCast === "function") {
      characterSystem.loadCast(w.sourceWork || w, { allowTitleSearch: true }).then(function (cast) {
        clCastCache[mid] = (cast || []); cb(clCastCache[mid]);
      }).catch(function () { cb(null); });
      return;
    }
    var mal = (w && (w.mal || w.malId)) || malIdFromWorkId(String(mid)) || "";
    if (!mal) return cb(null);
    loadCast({ mal: mal }).then(function (cast) {
      clCastCache[mid] = (cast || []); cb(clCastCache[mid]);
    }).catch(function () { cb(null); });
  }
  function clGrad(seed) { var h = 0, s = String(seed); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; var a = h % 360; return "linear-gradient(150deg, hsl(" + a + " 60% 54%), hsl(" + ((a + 42) % 360) + " 56% 36%))"; }
  function clFace(ch, cls, retryHost) {
    var wrap = el("span", { class: "lf-clx-face" + (cls ? " " + cls : "") });
    wrap.style.backgroundImage = clGrad(ch.id || ch.name);
    if (global.LorefyPortraitMedia) {
      wrap._portraitMedia = global.LorefyPortraitMedia.mount(wrap, { src: characterImageUrl(ch), alt: ch.name || "", initials: String(ch.name || "?").trim().slice(0,1), language: doc.documentElement.lang, loading: "lazy", retry:!!retryHost, retryHost:retryHost, focusTarget:function(){return retryHost && (retryHost.querySelector('.lf-clx-cast-select') || retryHost.parentNode && retryHost.parentNode.querySelector('.lf-clx-slot-select'));} });
      scheduleCharacterActionIcons();
      return wrap;
    }
    var init = el("b", { text: String(ch.name || "?").trim().slice(0, 1) });
    wrap.appendChild(init);
    var src = characterImageUrl(ch);
    if (src) {
      var im = doc.createElement("img"); im.src = src; im.alt = ch.name || ""; im.loading = "lazy"; im.referrerPolicy = "no-referrer";
      im.addEventListener("error", function () { try { im.remove(); } catch (e) {} });
      wrap.appendChild(im);
    }
    return wrap;
  }

  function bindDialogKeys(page, close, initial) {
    var opener=doc.activeElement;
    var isolated=[], current=page, released=false;
    // Preserve each layer's state so nested dialogs restore only their own background.
    while(current && current!==doc.body && current.parentElement){
      Array.from(current.parentElement.children).forEach(function(sibling){
        if(sibling===current)return;
        isolated.push({node:sibling,inert:sibling.inert});
        sibling.inert=true;
      });
      current=current.parentElement;
    }
    function keys(e){
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close();return;}
      if(e.key!=="Tab")return;
      var items=Array.from(page.querySelectorAll("button,input,textarea,select,a[href],[tabindex='0']")).filter(function(x){return !x.disabled && x.tabIndex>=0 && x.getClientRects().length;});
      var first=items[0],last=items[items.length-1];
      if(e.shiftKey && doc.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && doc.activeElement===last){e.preventDefault();first.focus();}
    }
    page.addEventListener("keydown",keys);
    if(initial) initial.focus();
    return function(){
      if(released)return;
      released=true;
      page.removeEventListener("keydown",keys);
      isolated.forEach(function(state){state.node.inert=state.inert;});
      if(opener && opener.isConnected)opener.focus();
    };
  }
  function ovOpen(cls, titleText) {
    var page = el("div", { class: "lf-ov-page " + cls,role:"dialog","aria-modal":"true","aria-label":titleText });
    var back = el("button", { type: "button", class: "lf-ov-back", "aria-label": uiText("رجوع", "Back"), text: "‹" });
    var restoreFocus;
    function closePage() {
      releaseCharacterPortraits(page);
      page.classList.add("is-leaving");
      if(restoreFocus)restoreFocus();
      page.inert=true;
      setTimeout(function () { page.remove(); }, 210);
    }
    back.addEventListener("click", closePage);
    var head = el("header", { class: "lf-ov-head" }, [back, el("strong", { class: "lf-ov-title", text: titleText }), el("span", { class: "lf-ov-headslot" })]);
    var body = el("div", { class: "lf-ov-body" });
    page.appendChild(head); page.appendChild(body);
    (doc.getElementById("screen") || doc.body).appendChild(page);
    restoreFocus=bindDialogKeys(page, closePage, back);
    return { page: page, head: head, body: body, close: closePage };
  }

  /* ── poster helpers (aurora style, shared) ── */
  function mlLoadImg(src, ms) {
    return new Promise(function (res) {
      if (!src) return res(null);
      var img = new Image(); img.crossOrigin = "anonymous";
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; res(null); } }, ms || 2600);
      img.onload = function () { if (!done) { done = true; clearTimeout(t); res(img); } };
      img.onerror = function () { if (!done) { done = true; clearTimeout(t); res(null); } };
      img.src = src;
    });
  }
  function auroraBg(ctx, W, H, AC) {
    ctx.fillStyle = "#0B0810"; ctx.fillRect(0, 0, W, H);
    function az(x, y, r, c1, c2) { var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    az(W * 0.10, -80, W * 0.62, AC + "2b", AC + "00");
    az(W * 1.02, H * 1.05, W * 0.62, AC + "1c", AC + "00");
    /* film grain */
    ctx.save(); ctx.globalAlpha = 0.045; ctx.fillStyle = "#ffffff";
    var seed = 48271;
    for (var i = 0; i < 1100; i++) {
      seed = (seed * 16807) % 2147483647; var gx = seed % W;
      seed = (seed * 16807) % 2147483647; var gy = seed % H;
      ctx.fillRect(gx, gy, 1, 1);
    }
    ctx.restore();
    /* accent spine (right edge) */
    ctx.fillStyle = AC; ctx.fillRect(W - 10, 0, 10, H);
    ctx.fillStyle = AC + "40"; ctx.fillRect(W - 22, 0, 5, H);
  }
  function auroraChrome(ctx, W, H, AC, title, subtitle) {
    ctx.textBaseline = "alphabetic";
    /* eyebrow: accent square + wordmark */
    ctx.fillStyle = AC; ctx.fillRect(W - 84 - 16, 88, 16, 16);
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.textAlign = "right"; ctx.direction = "ltr"; ctx.font = "900 25px Arial";
    ctx.fillText("L O R E F Y", W - 84 - 30, 104);
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.textAlign = "left"; ctx.font = "700 22px Arial";
    ctx.fillText(new Date().getFullYear() + "", 84, 104);
    /* big two-tone title */
    ctx.direction = "rtl"; ctx.textAlign = "right";
    ctx.fillStyle = "#fff"; ctx.font = "950 82px Cairo, Arial";
    ctx.fillText(cbTrim2(ctx, title, W - 240), W - 84, 232);
    ctx.fillStyle = AC; ctx.font = "800 30px Cairo, Arial";
    ctx.fillText(cbTrim2(ctx, subtitle, W - 280), W - 84, 290);
    /* hairline */
    ctx.fillStyle = "rgba(255,255,255,.13)"; ctx.fillRect(84, 330, W - 168, 2);
    /* footer */
    ctx.direction = "ltr"; ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.font = "700 23px Arial";
    ctx.fillText("lorefy · on the app", 84, H - 78);
    ctx.textAlign = "right"; ctx.fillStyle = AC; ctx.font = "900 34px Arial";
    ctx.fillText("#Lorefy", W - 84, H - 74);
  }
  function posterDownload(cv, name) {
    try {
      cv.toBlob(function (blob) {
        if (!blob) { toastSafe("تعذر إنشاء الصورة"); return; }
        function dl() {
          var url = URL.createObjectURL(blob), a = doc.createElement("a");
          a.href = url; a.download = name; doc.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1600);
          toastSafe("تم حفظ الصورة");
        }
        var shared = false;
        try {
          if (navigator.share && navigator.canShare) {
            var f = new File([blob], name, { type: "image/png" });
            if (navigator.canShare({ files: [f] })) {
              shared = true;
              navigator.share({ files: [f], title: "Lorefy" }).catch(function (e) {
                if (e && e.name === "AbortError") return;
                dl();
              });
            }
          }
        } catch (e) { shared = false; }
        if (!shared) dl();
      }, "image/png");
    } catch (e) { toastSafe("تعذر إنشاء الصورة"); }
  }

  /* ── list poster: aurora + 5×2 cover grid (real covers, gradient fallback) */
  function mlPoster(list) {
    if(global.LorefyShareComposer)return global.LorefyShareComposer.open({kind:'list',title:list.name,profile:global.LorefyShareComposer.currentProfile(),items:(list.works||[]).map(function(id,index){var w=mlWorkBy(id);return {id:id,name:mlTitleOf(w),image:mlCoverOf(w),rank:index+1};})});
    if (global.LorefyShareStudio) {
      var studioCard = shareStudioCard(list.name || "قائمتي", (list.works || []).slice(0, 10).map(function (id) {
        var w = mlWorkBy(id);
        return { name: mlTitleOf(w), img: mlCoverOf(w) };
      }));
      toastSafe("جاري تجهيز صورة الرف…");
      return global.LorefyShareStudio.buildShelfStoryFile(studioCard).then(function (file) {
        return global.LorefyShareStudio.nativeFileShare(file, list.name || "قائمتي", "قائمة أعمال من Lorefy");
      }).then(function () {
        toastSafe("تم فتح خيارات المشاركة والحفظ");
      }).catch(function (error) {
        if (error && error.name === "AbortError") return false;
        toastSafe("تعذر مشاركة الصورة");
        return false;
      });
    }
    var W = 1080, H = 1350, cv = doc.createElement("canvas"); cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d"), AC = list.accent || ML_ACCENTS[0];
    var ids = (list.works || []).slice(0, 10);
    toastSafe("جارٍ تجهيز الصورة…");
    Promise.all(ids.map(function (id) { return mlLoadImg(mlCoverOf(mlWorkBy(id))); })).then(function (imgs) {
      auroraBg(ctx, W, H, AC);
      auroraChrome(ctx, W, H, AC, list.name || "قائمتي", cbUserName() + " \u00b7 " + ids.length + " عمل");
      var cols = 5, gap = 26, sx = 84, sy = 404, tw = (W - 168 - gap * (cols - 1)) / cols, th = tw * 1.42;
      for (var i = 0; i < 10; i++) {
        var x = sx + (i % cols) * (tw + gap), y = sy + Math.floor(i / cols) * (th + gap + 58);
        var w = i < ids.length ? mlWorkBy(ids[i]) : null;
        if (w) {
          ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
          ctx.fillStyle = "#181322"; roundRect(ctx, x, y, tw, th, 18); ctx.fill(); ctx.restore();
          ctx.save(); roundRect(ctx, x, y, tw, th, 18); ctx.clip();
          if (imgs[i]) {
            var iw = imgs[i].width, ih = imgs[i].height, sc = Math.max(tw / iw, th / ih);
            ctx.drawImage(imgs[i], x + (tw - iw * sc) / 2, y + (th - ih * sc) / 2, iw * sc, ih * sc);
          } else {
            var hs = 0, nm = mlTitleOf(w);
            for (var c = 0; c < nm.length; c++) hs = (hs * 31 + nm.charCodeAt(c)) >>> 0;
            var ha = hs % 360, gg = ctx.createLinearGradient(x, y, x + tw, y + th);
            gg.addColorStop(0, "hsl(" + ha + " 58% 46%)"); gg.addColorStop(1, "hsl(" + ((ha + 44) % 360) + " 55% 28%)");
            ctx.fillStyle = gg; ctx.fillRect(x, y, tw, th);
            ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.textAlign = "center"; ctx.font = "800 52px Arial";
            ctx.fillText(nm.slice(0, 1).toUpperCase(), x + tw / 2, y + th / 2 + 18);
          }
          var fg = ctx.createLinearGradient(0, y + th - 70, 0, y + th);
          fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(1, "rgba(0,0,0,.55)");
          ctx.fillStyle = fg; ctx.fillRect(x, y + th - 70, tw, 70);
          ctx.restore();
          ctx.strokeStyle = AC + "55"; ctx.lineWidth = 2; roundRect(ctx, x + 1, y + 1, tw - 2, th - 2, 17); ctx.stroke();
          ctx.fillStyle = i === 0 ? "#E8A93C" : AC; roundRect(ctx, x + tw - 42, y + 10, 32, 32, 9); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.direction = "ltr"; ctx.font = "900 18px Arial"; ctx.fillText(String(i + 1), x + tw - 26, y + 32);
          ctx.fillStyle = "rgba(255,255,255,.88)"; ctx.font = "700 21px Cairo, Arial"; ctx.direction = "rtl";
          ctx.fillText(cbTrim(ctx, mlTitleOf(w), tw + 10), x + tw / 2, y + th + 34);
          ctx.direction = "ltr";
        } else {
          ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 2; ctx.setLineDash([9, 8]);
          roundRect(ctx, x + 1, y + 1, tw - 2, th - 2, 18); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255,255,255,.04)"; roundRect(ctx, x + 1, y + 1, tw - 2, th - 2, 18); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,.28)"; ctx.textAlign = "center"; ctx.font = "300 44px Arial";
          ctx.fillText("+", x + tw / 2, y + th / 2 + 15); ctx.restore();
        }
      }
      posterDownload(cv, "lorefy-list-" + (slug(list.name || "") || "list") + ".png");
    });
  }

  /* ── lists hub + editor ── */
  function mlCoverStrip(list) {
    var strip = el("div", { class: "lf-ml-strip" });
    (list.works || []).slice(0, 5).forEach(function (id) {
      var w = mlWorkBy(id), src = mlCoverOf(w);
      var cell = el("span", { class: "lf-ml-strip-cover" });
      if (src) {
        var img = doc.createElement("img"); img.src = src; img.alt = ""; img.loading = "lazy";
        img.addEventListener("error", function () { img.remove(); cell.textContent = mlTitleOf(w).slice(0, 1); });
        cell.appendChild(img);
      } else cell.textContent = mlTitleOf(w).slice(0, 1);
      strip.appendChild(cell);
    });
    if (!(list.works || []).length) strip.appendChild(el("span", { class: "lf-ml-strip-empty", text: "قائمة فارغة — اضغط للإضافة" }));
    return strip;
  }
  function mlResultCover(w) {
    var title = mlTitleOf(w);
    var cover = el("span", { class: "lf-ml-result-cover", "aria-hidden": "true" });
    var src = mlCoverOf(w);
    if (!src) {
      cover.classList.add("is-fallback");
      cover.textContent = title.slice(0, 1);
      return cover;
    }
    var img = doc.createElement("img");
    img.src = src;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", function () {
      img.remove();
      cover.classList.add("is-fallback");
      cover.textContent = title.slice(0, 1);
    });
    cover.appendChild(img);
    return cover;
  }
  // Keep existing list storage and editors; expose them through the profile Lists tab.
  global.LorefyLegacyLists = {
    rows: function () {
      return mlLists().map(function(l){return {id:'legacy-work:'+l.id,legacyId:l.id,legacyKind:'works',name:l.name,kind:'works',isPublic:false,items:(l.works||[]).map(function(id){var w=mlWorkBy(id);return {id:String(id),name:mlTitleOf(w),image:w ? (global.LorefyCoverAPI && global.LorefyCoverAPI.primary ? global.LorefyCoverAPI.primary(w) : w.cover || w.sourceCoverUrl || '') : ''};})};})
      .concat(clLists().map(function(l){return {id:'legacy-character:'+l.id,legacyId:l.id,legacyKind:'characters',name:l.title||'قائمة شخصيات',kind:'characters',isPublic:false,items:(l.chars||[]).map(function(ch){return {id:ch.id,name:ch.name,image:ch.img};})};}));
    },
    open: function(row){openListsHub(row.legacyKind==='characters'?{charListId:row.legacyId}:{listId:row.legacyId});},
    remove: function(row, owner){
      if (!owner || !global.LorefyProfileSections || global.LorefyProfileSections.account(global.localStorage)!==owner) throw Error('Profile list account changed');
      if (row.legacyKind==='works') mlSave(mlLists().filter(function(list){return list.id!==row.legacyId;}));
      else if (row.legacyKind==='characters') clSave(clLists().filter(function(list){return list.id!==row.legacyId;}));
      else throw Error('Invalid legacy list kind');
    }
  };
  function openListsHub(opts) {
    opts = opts || {};
    var ov = ovOpen("lf-ml-page", "قوائمي");
    function renderHub() {
      releaseCharacterPortraits(ov.body);
      ov.body.textContent = "";
      var add = el("button", { type: "button", class: "lf-ml-add" }, [
        el("span", { class: "lf-ml-add-plus", text: "+" }),
        el("span", { text: "قائمة أعمال" })
      ]);
      add.addEventListener("click", function () {
        var lists = mlLists();
        var nl = { id: "l" + Date.now(), name: "قائمة جديدة", accent: ML_ACCENTS[lists.length % ML_ACCENTS.length], works: [], ts: Date.now() };
        renderEditor(nl.id, nl);
      });
      var addCl = el("button", { type: "button", class: "lf-ml-add lf-ml-add-chars" }, [
        el("span", { class: "lf-ml-add-plus", text: "★" }),
        el("span", { text: "أفضل ١٠ شخصيات" })
      ]);
      addCl.addEventListener("click", function () {
        var lists = clLists();
        var nl = { id: "c" + Date.now(), mid: "", title: "", accent: ML_ACCENTS[(lists.length + 2) % ML_ACCENTS.length], chars: [], ts: Date.now() };
        renderCharEditor(nl.id, nl);
      });
      ov.body.appendChild(el("div", { class: "lf-ml-add-row" }, [add, addCl]));
      var lists = mlLists(), cls = clLists();
      if (!lists.length && !cls.length) {
        ov.body.appendChild(el("div", { class: "lf-ml-empty" }, [
          el("strong", { text: "لا قوائم بعد" }),
          el("p", { text: "أنشئ قوائم مثل «أعمال أبكتني» أو «أفضل مانهوا 2026» وشاركها كصورة." })
        ]));
      }
      lists.forEach(function (l) {
        var dot = el("span", { class: "lf-ml-dot" });
        dot.style.background = l.accent || ML_ACCENTS[0];
        var card = el("button", { type: "button", class: "lf-ml-card" }, [
          el("div", { class: "lf-ml-card-head" }, [
            dot,
            el("strong", { class: "lf-ml-card-name", text: l.name }),
            el("span", { class: "lf-ml-card-count", text: (l.works || []).length + " عمل" })
          ]),
          mlCoverStrip(l)
        ]);
        card.addEventListener("click", function () { renderEditor(l.id); });
        ov.body.appendChild(card);
      });
      cls.forEach(function (l) {
        var dot = el("span", { class: "lf-ml-dot" });
        dot.style.background = l.accent || ML_ACCENTS[0];
        var strip = el("div", { class: "lf-ml-strip" });
        (l.chars || []).slice(0, 6).forEach(function (ch) { strip.appendChild(clFace(ch)); });
        if (!(l.chars || []).length) strip.appendChild(el("span", { class: "lf-ml-strip-empty", text: "لم تُضف شخصيات بعد" }));
        var card = el("button", { type: "button", class: "lf-ml-card lf-ml-card-chars" }, [
          el("div", { class: "lf-ml-card-head" }, [
            dot,
            el("strong", { class: "lf-ml-card-name", text: l.title ? "أفضل شخصيات " + l.title : "قائمة شخصيات" }),
            el("span", { class: "lf-ml-card-count", text: (l.chars || []).length + " / 10" })
          ]),
          strip
        ]);
        card.addEventListener("click", function () { renderCharEditor(l.id); });
        ov.body.appendChild(card);
      });
    }
    function renderCharEditor(listId, draft) {
      var lists = clLists();
      if (draft) lists.unshift(draft);
      var list = null;
      for (var li = 0; li < lists.length; li++) if (lists[li].id === listId) { list = lists[li]; break; }
      if (!list) return renderHub();
      function persist() { clSave(lists); }
      releaseCharacterPortraits(ov.body);
      ov.body.textContent = "";
      var backRow = el("button", { type: "button", class: "lf-ml-backrow", text: "‹ كل القوائم" });
      backRow.addEventListener("click", renderHub);
      ov.body.appendChild(backRow);

      /* step 1 — pick the work */
      if (!list.mid) {
        ov.body.appendChild(el("p", { class: "lf-clx-step", text: "اختر العمل الذي سترتّب أفضل ١٠ شخصياته" }));
        var search = el("input", { class: "lf-ml-search", type: "search", placeholder: "ابحث عن عمل…", "aria-label": "ابحث عن عمل" });
        var results = el("div", { class: "lf-ml-results" });
        search.addEventListener("input", function () {
          var q = search.value.trim().toLowerCase();
          results.textContent = "";
          if (q.length < 2) return;
          var found = 0, all = mlWorks();
          for (var i = 0; i < all.length && found < 20; i++) {
            var w = all[i];
            if (String(w.title || "").toLowerCase().indexOf(q) < 0 && String(w.ar || "").toLowerCase().indexOf(q) < 0) continue;
            found++;
            (function (w) {
              var r = el("button", { type: "button", class: "lf-ml-result" }, [
                mlResultCover(w),
                el("span", { class: "lf-ml-result-title", text: mlTitleOf(w) }),
                el("span", { class: "lf-ml-result-type", text: w.type || "" }),
                el("span", { class: "lf-ml-result-add", text: "اختيار" })
              ]);
              r.addEventListener("click", function () {
                list.mid = String(w.id); list.title = mlTitleOf(w); persist();
                renderCharEditor(list.id);
              });
              results.appendChild(r);
            })(w);
          }
          if (!found) results.appendChild(el("span", { class: "lf-ml-noresults", text: "لا نتائج" }));
        });
        ov.body.appendChild(search);
        ov.body.appendChild(results);
        var delEarly = el("button", { type: "button", class: "lf-ml-delete", text: "إلغاء" });
        delEarly.addEventListener("click", function () {
          var at = lists.indexOf(list); if (at >= 0) { lists.splice(at, 1); clSave(lists); }
          renderHub();
        });
        ov.body.appendChild(delEarly);
        return;
      }

      /* step 2 — rank the characters */
      var w = mlWorkBy(list.mid);
      var headCover = el("span", { class: "lf-ml-row-cover" });
      var hsrc = mlCoverOf(w);
      if (hsrc) { var him = doc.createElement("img"); him.src = hsrc; him.alt = ""; him.addEventListener("error", function () { him.remove(); headCover.textContent = (list.title || "?").slice(0, 1); }); headCover.appendChild(him); }
      else headCover.textContent = (list.title || "?").slice(0, 1);
      ov.body.appendChild(el("div", { class: "lf-clx-workhead" }, [
        headCover,
        el("span", { class: "lf-clx-workhead-copy" }, [
          el("strong", { text: "أفضل شخصيات " + (list.title || "") }),
          el("em", { text: (list.chars || []).length + " / 10 شخصيات" })
        ])
      ]));
      var chosen = el("div", { class: "lf-ml-chosen" });
      var castHost = el("div", { class: "lf-clx-cast" });
      var castSearch = el("input", { class: "lf-ml-search lf-clx-search", type: "search", placeholder: "\u0627\u0628\u062d\u062b \u062f\u0627\u062e\u0644 \u0634\u062e\u0635\u064a\u0627\u062a \u0627\u0644\u0639\u0645\u0644...", "aria-label": "\u0628\u062d\u062b \u0634\u062e\u0635\u064a\u0627\u062a \u0627\u0644\u0639\u0645\u0644" });
      var castMeta = el("span", { class: "lf-clx-meta", text: "" });
      var castTools = el("div", { class: "lf-clx-tools" }, [castSearch, castMeta]);
      var castVisible = CLX_CAST_BATCH;
      castSearch.addEventListener("input", function () {
        castVisible = CLX_CAST_BATCH;
        paintCast();
      });
      function refreshHead() {
        var em = ov.body.querySelector(".lf-clx-workhead-copy em");
        if (em) em.textContent = (list.chars || []).length + " / 10 شخصيات";
      }
      function inList(ch) {
        for (var i = 0; i < list.chars.length; i++) if (list.chars[i].id === ch.id || list.chars[i].name === ch.name) return i;
        return -1;
      }
      function slotEl(ix, size) {
        var ch = list.chars[ix] || null;
        var slot = el("div", { class: "lf-clx-slot lf-clx-slot-" + size + (ch ? " is-filled" : " is-empty") });
        if (ix === 0 && ch) slot.appendChild(el("span", { class: "lf-clx-crown", "aria-hidden": "true", text: "♛" }));
        var faceWrap = el("span", { class: "lf-clx-slot-facewrap" + (ix === 0 ? " is-first" : "") });
        if (ch) faceWrap.appendChild(clFace(ch, "lf-clx-slot-face", faceWrap));
        else faceWrap.appendChild(el("span", { class: "lf-clx-slot-hole", text: "+" }));
        faceWrap.appendChild(el("span", { class: "lf-clx-slot-rank" + (ix === 0 ? " is-gold" : ""), text: String(ix + 1) }));
        slot.appendChild(faceWrap);
        slot.appendChild(el("span", { class: "lf-clx-slot-name", text: ch ? ch.name : "فارغ" }));
        if (ch) {
          var remove = el("button", {type:"button",class:"lf-clx-slot-select","aria-label":uiText("إزالة ","Remove ")+ch.name+uiText(" من المركز "," from rank ")+(ix+1)});
          remove.addEventListener("click", function () { list.chars.splice(ix, 1); persist(); paintChosen(); updateCastSelection(); refreshHead(); var next=chosen.querySelector('.lf-clx-slot-select');if(next)next.focus();else castSearch.focus(); });
          slot.appendChild(remove);
          var editImg = el("button", { type: "button", class: "lf-clx-image-edit", "data-character-image-edit": ch.id || ch.name, "aria-label": uiText("تعديل صورة ","Edit image for ") + ch.name, title:uiText("تعديل صورة ","Edit image for ") + ch.name },el("i",{"data-lucide":"pencil","aria-hidden":"true"}));
          editImg.addEventListener("click", function (e) {
            e.preventDefault(); e.stopPropagation();
            openCharacterImagePicker(ch, function (url) {
              if (url) ch.img = url;
              persist(); paintChosen(); paintCast(); refreshHead();
            }, w);
          });
          slot.appendChild(editImg);
        }
        scheduleCharacterActionIcons();
        return slot;
      }
      var chosenPodium=null, chosenRest=null, chosenHint=null, chosenSlotNodes=[];
      function paintChosen() {
        if(!chosenPodium){
          chosenPodium=el("div",{class:"lf-clx-podium"});chosenRest=el("div",{class:"lf-clx-rest"});chosenHint=el("p",{class:"lf-clx-hint"});
          chosen.appendChild(chosenPodium);chosen.appendChild(chosenRest);chosen.appendChild(chosenHint);
        }
        function updateSlot(index,size,host){
          var key=JSON.stringify([list.chars[index]||null,size]),previous=chosenSlotNodes[index];
          if(previous&&previous.key===key)return;
          var node=slotEl(index,size);
          if(previous){releaseCharacterPortraits(previous.node);host.replaceChild(node,previous.node);}else host.appendChild(node);
          chosenSlotNodes[index]={key:key,node:node};
        }
        updateSlot(1,"md",chosenPodium);updateSlot(0,"lg",chosenPodium);updateSlot(2,"md",chosenPodium);
        for(var ri=3;ri<10;ri++)updateSlot(ri,"sm",chosenRest);
        chosenHint.textContent=(list.chars||[]).length?"اضغط على شخصية مُرتّبة لإزالتها":"اضغط على الشخصيات بالأسفل — أول اختيار يأخذ المركز الأول";
      }
      var castData = null;
      var castSelectionUpdates=[];
      function updateCastSelection(){castSelectionUpdates.forEach(function(update){update();});}
      function paintCast() {
        castSelectionUpdates=[];
        releaseCharacterPortraits(castHost);
        castHost.textContent = "";
        if (castData === null) {
          castMeta.textContent = "";
          castHost.appendChild(el("p", { class: "lf-clx-hint", text: "جاري تحميل شخصيات العمل..." }));
          return;
        }
        if (!castData.length) {
          castMeta.textContent = "";
          castHost.appendChild(el("p", { class: "lf-clx-hint", text: "تعذر جلب شخصيات هذا العمل تلقائيا - أضفها بالاسم من الحقل بالأسفل" }));
          return;
        }
        var filtered = clFilterCast(castData, castSearch.value);
        castMeta.textContent = filtered.length + " / " + castData.length + " شخصية";
        if (!filtered.length) {
          castHost.appendChild(el("p", { class: "lf-clx-hint", text: "لا توجد شخصية مطابقة" }));
          return;
        }
        filtered.slice(0, castVisible).forEach(function (c) {
          var ch = { id: c.id, name: c.name, img: c.image || "" };
          var at = inList(ch);
          var item = el("div", { class: "lf-clx-cast-item" + (at >= 0 ? " is-in" : "") });
          [
            clFace(ch, null, item),
            el("span", { class: "lf-clx-cast-name", text: ch.name }),
            at >= 0 ? el("span", { class: "lf-clx-cast-badge", text: String(at + 1) }) : null
          ].forEach(function(child){if(child)item.appendChild(child);});
          var select = el("button",{type:"button",class: "lf-clx-cast-select","aria-label":ch.name});item.appendChild(select);
          var badge=item.querySelector(".lf-clx-cast-badge") || el("span",{class:"lf-clx-cast-badge"});
          if(!badge.parentNode)item.appendChild(badge);
          function updateSelection(){var rank=inList(ch);item.setAttribute("class","lf-clx-cast-item"+(rank>=0?" is-in":""));badge.hidden=rank<0;badge.textContent=rank>=0?String(rank+1):"";select.setAttribute("aria-pressed",String(rank>=0));}
          castSelectionUpdates.push(updateSelection);updateSelection();
          select.addEventListener("click", function () {
            var ix = inList(ch);
            if (ix >= 0) list.chars.splice(ix, 1);
            else { if (list.chars.length >= 10) { toastSafe("الحد ١٠ شخصيات"); return; } list.chars.push(ch); }
            persist(); paintChosen(); updateCastSelection(); refreshHead();
          });
          castHost.appendChild(item);
        });
        if (filtered.length > castVisible) {
          var more = el("button", { type: "button", class: "lf-clx-load-more", text: "عرض المزيد" });
          more.addEventListener("click", function () {
            castVisible += CLX_CAST_BATCH;
            paintCast();
          });
          castHost.appendChild(more);
        }
      }
      paintChosen(); paintCast();
      ov.body.appendChild(chosen);
      ov.body.appendChild(castTools);
      ov.body.appendChild(castHost);
      clLoadCast(list.mid, function (cast) { if (!ov.page.isConnected || ov.page.inert || chosen.parentNode !== ov.body) return; castData = cast || []; paintCast(); });
      /* manual add — works even when the cast can't be fetched */
      var man = el("input", { class: "lf-ml-search", type: "text", maxlength: "40", placeholder: "أو أضف شخصية باسمها…", "aria-label": "أضف شخصية باسمها" });
      man.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        var nm = man.value.trim();
        if (nm.length < 2) return;
        if (list.chars.length >= 10) { toastSafe("الحد ١٠ شخصيات"); return; }
        list.chars.push({ id: "manual-" + Date.now(), name: nm, img: "" });
        man.value = ""; persist(); paintChosen(); paintCast(); refreshHead();
      });
      ov.body.appendChild(man);
      var share = el("button", { type: "button", class: "lf-ml-share", text: "مشاركة أو حفظ الصورة" });
      share.addEventListener("click", function () { clPoster(list); });
      var del = el("button", { type: "button", class: "lf-ml-delete", text: "حذف القائمة" });
      del.addEventListener("click", function () {
        var at = lists.indexOf(list); if (at >= 0) { lists.splice(at, 1); clSave(lists); }
        renderHub();
      });
      ov.body.appendChild(el("div", { class: "lf-ml-actions" }, [share, del]));
    }
    function renderEditor(listId, draft) {
      var lists = mlLists();
      if (draft) lists.unshift(draft);
      var list = null;
      for (var li = 0; li < lists.length; li++) if (lists[li].id === listId) { list = lists[li]; break; }
      if (!list) return renderHub();
      function persist() { mlSave(lists); }
      releaseCharacterPortraits(ov.body);
      ov.body.textContent = "";
      var backRow = el("button", { type: "button", class: "lf-ml-backrow", text: "‹ كل القوائم" });
      backRow.addEventListener("click", renderHub);
      ov.body.appendChild(backRow);
      var name = el("input", { class: "lf-ml-name", type: "text", maxlength: "40", placeholder: "اسم القائمة" });
      name.value = list.name || "";
      name.addEventListener("input", function () { list.name = name.value.trim() || "قائمة"; persist(); });
      ov.body.appendChild(name);
      var sw = el("div", { class: "lf-ml-swatches" });
      ML_ACCENTS.forEach(function (c) {
        var b = el("button", { type: "button", class: "lf-ml-swatch" + (list.accent === c ? " is-on" : ""), "aria-label": c });
        b.style.background = c;
        b.addEventListener("click", function () {
          list.accent = c; persist();
          sw.querySelectorAll(".lf-ml-swatch").forEach(function (x) { x.classList.remove("is-on"); });
          b.classList.add("is-on");
        });
        sw.appendChild(b);
      });
      ov.body.appendChild(sw);
      var chosen = el("div", { class: "lf-ml-chosen" });
      function paintChosen() {
        chosen.textContent = "";
        (list.works || []).forEach(function (id, ix) {
          var w = mlWorkBy(id); if (!w) return;
          var src = mlCoverOf(w);
          var cover = el("span", { class: "lf-ml-row-cover" });
          if (src) {
            var im = doc.createElement("img"); im.src = src; im.alt = ""; im.loading = "lazy";
            im.addEventListener("error", function () { im.remove(); cover.textContent = mlTitleOf(w).slice(0, 1); });
            cover.appendChild(im);
          } else cover.textContent = mlTitleOf(w).slice(0, 1);
          var row = el("div", { class: "lf-ml-row" }, [
            el("span", { class: "lf-ml-row-rank", text: String(ix + 1) }),
            cover,
            el("span", { class: "lf-ml-row-title", text: mlTitleOf(w) })
          ]);
          var rm = el("button", { type: "button", class: "lf-ml-row-remove", "aria-label": "إزالة", text: "×" });
          rm.addEventListener("click", function () { list.works.splice(ix, 1); persist(); paintChosen(); });
          row.appendChild(rm);
          chosen.appendChild(row);
        });
      }
      paintChosen();
      ov.body.appendChild(chosen);
      var search = el("input", { class: "lf-ml-search", type: "search", placeholder: "أضف عملاً… ابحث بالاسم", "aria-label": "ابحث عن عمل لإضافته" });
      var results = el("div", { class: "lf-ml-results" });
      search.addEventListener("input", function () {
        var q = search.value.trim().toLowerCase();
        results.textContent = "";
        if (q.length < 2) return;
        var found = 0, all = mlWorks();
        for (var i = 0; i < all.length && found < 20; i++) {
          var w = all[i];
          if (String(w.title || "").toLowerCase().indexOf(q) < 0 && String(w.ar || "").toLowerCase().indexOf(q) < 0) continue;
          found++;
          (function (w) {
            var inList = list.works.indexOf(String(w.id)) >= 0;
            var r = el("button", { type: "button", class: "lf-ml-result" + (inList ? " is-in" : "") }, [
              mlResultCover(w),
              el("span", { class: "lf-ml-result-title", text: mlTitleOf(w) }),
              el("span", { class: "lf-ml-result-type", text: w.type || "" }),
              el("span", { class: "lf-ml-result-add", text: inList ? "✓" : "إضافة" })
            ]);
            r.addEventListener("click", function () {
              var at = list.works.indexOf(String(w.id));
              if (at >= 0) list.works.splice(at, 1);
              else {
                if (list.works.length >= 50) { toastSafe("الحد 50 عملاً"); return; }
                list.works.push(String(w.id));
              }
              persist(); paintChosen();
              search.dispatchEvent(new Event("input"));
            });
            results.appendChild(r);
          })(w);
        }
        if (!found) results.appendChild(el("span", { class: "lf-ml-noresults", text: "لا نتائج" }));
      });
      ov.body.appendChild(search);
      ov.body.appendChild(results);
      var share = el("button", { type: "button", class: "lf-ml-share", text: "مشاركة أو حفظ الصورة" });
      share.addEventListener("click", function () { mlPoster(list); });
      var del = el("button", { type: "button", class: "lf-ml-delete", text: "حذف القائمة" });
      del.addEventListener("click", function () {
        var at = lists.indexOf(list);
        if (at >= 0) { lists.splice(at, 1); mlSave(lists); }
        renderHub();
      });
      var actions = el("div", { class: "lf-ml-actions" }, [share, del]);
      ov.body.appendChild(actions);
    }
    if (opts.charListId) renderCharEditor(opts.charListId); else if (opts.listId) renderEditor(opts.listId); else renderHub();
  }

  /* ── top-10 characters poster: editorial — hero #1 + ranked rows ── */
  function clPoster(list, castAttempted) {
    var chars = (list.chars || []).slice(0, 10);
    if (!castAttempted && !clCastCache[list.mid] && chars.some(function (ch) { return !characterImageUrl(ch); })) {
      return new Promise(function (resolve) { clLoadCast(list.mid, resolve); }).then(function () { return clPoster(list, true); });
    }
    var shareChars = global.LorefyShareStudio && global.LorefyShareStudio.characterShareItems
      ? global.LorefyShareStudio.characterShareItems(chars, clCastCache[list.mid], characterImageUrl)
      : chars.map(function (ch) { return { name: ch.name || "", img: characterImageUrl(ch) }; });
    if(global.LorefyShareComposer)return global.LorefyShareComposer.open({kind:'top',title:list.title||'أفضل الشخصيات',profile:global.LorefyShareComposer.currentProfile(),items:shareChars});
    if (global.LorefyShareStudio) {
      var studioCard = shareStudioCard("أفضل 10 شخصيات · " + (list.title || ""), shareChars);
      toastSafe("جاري تجهيز صورة الرف…");
      return global.LorefyShareStudio.buildShelfStoryFile(studioCard).then(function (file) {
        return global.LorefyShareStudio.nativeFileShare(file, "أفضل 10 شخصيات · " + (list.title || ""), "قائمة شخصيات من Lorefy");
      }).then(function () {
        toastSafe("تم فتح خيارات المشاركة والحفظ");
      }).catch(function (error) {
        if (error && error.name === "AbortError") return false;
        toastSafe("تعذر مشاركة الصورة");
        return false;
      });
    }
    var W = 1080, H = 1350, cv = doc.createElement("canvas"); cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d"), AC = list.accent || ML_ACCENTS[0];
    toastSafe("جارٍ تجهيز الصورة…");
    Promise.all(shareChars.map(function (ch) { return mlLoadImg(ch.img); })).then(function (imgs) {
      auroraBg(ctx, W, H, AC);
      auroraChrome(ctx, W, H, AC, "أفضل ١٠ شخصيات", (list.title || "") + " \u00b7 " + cbUserName());
      function drawFace(i, x, y, w, h, rad) {
        var ch = i < chars.length ? chars[i] : null;
        if (!ch) {
          ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.lineWidth = 2; ctx.setLineDash([9, 8]);
          roundRect(ctx, x + 1, y + 1, w - 2, h - 2, rad); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.textAlign = "center"; ctx.direction = "ltr"; ctx.font = "300 40px Arial";
          ctx.fillText("+", x + w / 2, y + h / 2 + 14); ctx.restore();
          return;
        }
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 9;
        ctx.fillStyle = "#171221"; roundRect(ctx, x, y, w, h, rad); ctx.fill(); ctx.restore();
        ctx.save(); roundRect(ctx, x, y, w, h, rad); ctx.clip();
        if (imgs[i]) {
          var iw = imgs[i].width, ih = imgs[i].height, s = Math.max(w / iw, h / ih);
          ctx.drawImage(imgs[i], x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s);
        } else {
          var hs = 0, nm = ch.name || "?";
          for (var c2 = 0; c2 < nm.length; c2++) hs = (hs * 31 + nm.charCodeAt(c2)) >>> 0;
          var ha = hs % 360, gg = ctx.createLinearGradient(x, y, x + w, y + h);
          gg.addColorStop(0, "hsl(" + ha + " 58% 46%)"); gg.addColorStop(1, "hsl(" + ((ha + 44) % 360) + " 55% 28%)");
          ctx.fillStyle = gg; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.textAlign = "center"; ctx.direction = "ltr";
          ctx.font = "800 " + Math.round(h * 0.32) + "px Arial";
          ctx.fillText(nm.slice(0, 1).toUpperCase(), x + w / 2, y + h / 2 + h * 0.11);
        }
        ctx.restore();
        /* number tag */
        var ts = Math.max(34, Math.round(w * 0.16));
        ctx.fillStyle = i === 0 ? "#E8A93C" : AC;
        roundRect(ctx, x + w - ts - 10, y + 10, ts, ts, Math.round(ts * 0.28)); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.direction = "ltr";
        ctx.font = "900 " + Math.round(ts * 0.52) + "px Arial";
        ctx.fillText(String(i + 1), x + w - ts / 2 - 10, y + 10 + ts * 0.68);
      }
      /* ghost numeral behind hero */
      var hw = 424, hh = 520, hx = W - 84 - hw, hy = 380;
      ctx.fillStyle = AC + "22"; ctx.textAlign = "left"; ctx.direction = "ltr"; ctx.font = "950 330px Arial";
      ctx.fillText("1", hx - 96, hy + 296);
      drawFace(0, hx, hy, hw, hh, 28);
      /* crown + name under hero */
      if (chars[0]) {
        ctx.fillStyle = "#E8A93C"; ctx.textAlign = "center"; ctx.direction = "ltr"; ctx.font = "900 30px Arial";
        ctx.fillText("\u265B", hx + hw / 2, hy + hh + 46);
        ctx.fillStyle = "#fff"; ctx.direction = "rtl"; ctx.font = "900 36px Cairo, Arial";
        ctx.fillText(cbTrim(ctx, chars[0].name, hw), hx + hw / 2, hy + hh + 96);
      }
      /* ranks 2–5: rows on the left */
      var rx = 84, rw = hx - 84 - 48, ry = 380, rh = 126;
      for (var i = 1; i <= 4; i++) {
        var y = ry + (i - 1) * rh;
        var fx = rx + rw - 96;
        drawFace(i, fx, y, 96, 96, 20);
        if (i < chars.length && chars[i]) {
          ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.font = "700 27px Cairo, Arial";
          ctx.fillText(cbTrim(ctx, chars[i].name, rw - 120), fx - 18, y + 58);
        }
        if (i < 4) { ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(rx, y + rh - 16, rw, 1); }
      }
      /* ranks 6–10: bottom strip */
      var bw = Math.floor((W - 168 - 4 * 26) / 5), by = 1046;
      for (var k = 5; k < 10; k++) {
        var bx = W - 84 - bw - (k - 5) * (bw + 26);
        drawFace(k, bx, by, bw, bw, 22);
        if (k < chars.length && chars[k]) {
          ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.font = "700 22px Cairo, Arial";
          ctx.fillText(cbTrim(ctx, chars[k].name, bw + 18), bx + bw / 2, by + bw + 34);
        }
      }
      posterDownload(cv, "lorefy-top10-chars.png");
    });
  }

  /* ── yearly wrap ── */
  function wrStats() {
    var year = new Date().getFullYear();
    var lib = read("lorefy.user.library.v2", {}) || {};
    var mids = Object.keys(lib);
    function statusOf(v) { return typeof v === "string" ? v : (v && (v.st || v.status)) || ""; }
    var done = 0, reading = 0;
    mids.forEach(function (k) {
      var s = statusOf(lib[k]);
      if (s.indexOf("تم") === 0) done++;
      else if (s.indexOf("أقرأ") === 0) reading++;
    });
    var rl = read("lorefy.user.readLog.v1", {}) || {};
    var chYear = 0;
    Object.keys(rl).forEach(function (d) { if (d.indexOf(year + "-") === 0) chYear += Number(rl[d]) || 0; });
    var streak = 0, dt = new Date();
    for (var i = 0; i < 366; i++) {
      var key = dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate();
      if (Number(rl[key]) > 0) streak++;
      else if (i > 0) break;
      dt.setDate(dt.getDate() - 1);
    }
    var revs = (read("lorefy.user.privateReviews.v2", []) || []).filter(function (r) { return r && r.userId === "me"; });
    var avg = revs.length ? revs.reduce(function (a, r) { return a + (Number(r.r) || 0); }, 0) / revs.length : 0;
    var favs = (read("lorefy.user.favorites.v2", []) || []).length;
    var cr = read(K_SCORES, {}) || {}, charCount = 0;
    Object.keys(cr).forEach(function (k) { charCount += Object.keys(cr[k] || {}).length; });
    var g = {}, t = {};
    mids.forEach(function (k) {
      var w = mlWorkBy(k); if (!w) return;
      (w.genres || []).forEach(function (x) { g[x] = (g[x] || 0) + 1; });
      if (w.type) t[w.type] = (t[w.type] || 0) + 1;
    });
    var topG = Object.keys(g).sort(function (a, b) { return g[b] - g[a]; })[0] || "—";
    var topT = Object.keys(t).sort(function (a, b) { return t[b] - t[a]; })[0] || "—";
    var topWorks = revs.slice().sort(function (a, b) { return (b.r || 0) - (a.r || 0); }).slice(0, 3)
      .map(function (r) { return mlWorkBy(r.mid); }).filter(Boolean);
    return {
      year: year, total: mids.length, done: done, reading: reading,
      chapters: chYear, hours: Math.round(chYear * 12 / 60), streak: streak,
      reviews: revs.length, avg: avg, favs: favs, chars: charCount,
      topGenre: topG, topType: topT, topWorks: topWorks, lists: mlLists().length
    };
  }
  function wrTile(num, label) {
    return el("div", { class: "lf-wr-tile" }, [
      el("strong", { class: "lf-wr-num", text: String(num) }),
      el("span", { class: "lf-wr-label", text: label })
    ]);
  }
  function wrRow(num, label) {
    return el("div", { class: "lf-wr-row" }, [
      el("span", { class: "lf-wr-row-label", text: label }),
      el("span", { class: "lf-wr-row-dots", "aria-hidden": "true" }),
      el("strong", { class: "lf-wr-row-num", text: String(num) })
    ]);
  }
  function openWrapped() {
    var s = wrStats();
    var ov = ovOpen("lf-wr-page", "ملخّص " + s.year);
    var eyebrow = el("div", { class: "lf-wr-hero-eyebrow" }, [
      el("i", { "aria-hidden": "true" }),
      el("span", { text: "LOREFY — سنتك القرائية" })
    ]);
    ov.body.appendChild(el("div", { class: "lf-wr-hero" }, [
      el("span", { class: "lf-wr-hero-ghost", "aria-hidden": "true", text: String(s.year).slice(2) }),
      eyebrow,
      el("strong", { class: "lf-wr-hero-num", text: String(s.chapters) }),
      el("span", { class: "lf-wr-hero-unit", text: "فصلاً قرأتها هذه السنة" }),
      el("div", { class: "lf-wr-hero-meta" }, [
        el("span", { text: "≈ " + s.hours + " ساعات تقديرية" }),
        el("span", { text: s.streak + " يوم قراءة متواصل" })
      ])
    ]));
    ov.body.appendChild(el("div", { class: "lf-wr-ledger" }, [
      el("p", { class: "lf-wr-sec", text: "دفتر السنة" }),
      wrRow(s.total, "عمل في مكتبتك"),
      wrRow(s.done, "أكملتها حتى النهاية"),
      wrRow(s.reviews, "مراجعة كتبتها"),
      wrRow(s.avg ? s.avg.toFixed(1) + " / 5" : "—", "متوسط تقييمك"),
      wrRow(s.chars, "شخصية قيّمتها"),
      wrRow(s.favs, "في مفضّلتك"),
      wrRow(s.lists, "قائمة أنشأتها")
    ]));
    ov.body.appendChild(el("div", { class: "lf-wr-taste" }, [
      el("p", { class: "lf-wr-sec", text: "ذوقك هذه السنة" }),
      el("div", { class: "lf-wr-taste-chips" }, [
        el("span", { class: "lf-wr-chip is-accent", text: s.topGenre }),
        el("span", { class: "lf-wr-chip", text: s.topType })
      ]),
      el("em", { class: "lf-wr-taste-note", text: "أكثر تصنيف ونوع حضورًا في مكتبتك" })
    ]));
    if (s.topWorks.length) {
      ov.body.appendChild(el("p", { class: "lf-wr-sec lf-wr-sec-solo", text: "أعلى تقييماتك" }));
      var strip = el("div", { class: "lf-wr-topworks" });
      s.topWorks.forEach(function (w, ix) {
        var src = mlCoverOf(w);
        var cell = el("span", { class: "lf-wr-topcover" });
        if (src) {
          var im = doc.createElement("img"); im.src = src; im.alt = ""; im.loading = "lazy";
          im.addEventListener("error", function () { im.remove(); cell.textContent = mlTitleOf(w).slice(0, 1); });
          cell.appendChild(im);
        } else cell.textContent = mlTitleOf(w).slice(0, 1);
        cell.appendChild(el("b", { class: "lf-wr-toprank" + (ix === 0 ? " is-gold" : ""), text: String(ix + 1) }));
        strip.appendChild(el("span", { class: "lf-wr-topitem" }, [cell, el("span", { class: "lf-wr-topname", text: mlTitleOf(w) })]));
      });
      ov.body.appendChild(strip);
    }
    var share = el("button", { type: "button", class: "lf-wr-share", text: "مشاركة ملخّصي كصورة" });
    share.addEventListener("click", function () { wrSharePoster(share, s); });
    ov.body.appendChild(share);
  }
  function wrPoster(s) {
    var W = 1080, H = 1350, cv = doc.createElement("canvas"); cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d"), AC = "#7C3AED";
    auroraBg(ctx, W, H, AC);
    auroraChrome(ctx, W, H, AC, "ملخّصي في لورفي " + s.year, cbUserName());
    ctx.textAlign = "center"; ctx.direction = "ltr";
    ctx.fillStyle = AC; ctx.font = "950 200px Arial";
    ctx.fillText(String(s.chapters), W / 2, 640);
    ctx.direction = "rtl";
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "800 40px Cairo, Arial";
    ctx.fillText("فصلاً مقروءاً هذه السنة", W / 2, 706);
    var tiles = [
      [String(s.total), "في مكتبتي"], [String(s.done), "أكملتها"], [String(s.streak), "يوم توالي"],
      [String(s.reviews), "مراجعة"], [s.avg ? s.avg.toFixed(1) : "—", "متوسط تقييمي"], [String(s.chars), "شخصية قيّمتها"]
    ];
    var cols = 3, gap = 24, sx = 84, sy = 780, tw = (W - 168 - gap * (cols - 1)) / cols, th = 170;
    tiles.forEach(function (tl, i) {
      var x = sx + (i % cols) * (tw + gap), y = sy + Math.floor(i / cols) * (th + gap);
      ctx.fillStyle = AC; ctx.fillRect(x + tw / 2 - 23, y, 46, 4);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.direction = "ltr"; ctx.font = "900 54px Arial";
      ctx.fillText(tl[0], x + tw / 2, y + 84);
      ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "700 22px Cairo, Arial";
      ctx.fillText(tl[1], x + tw / 2, y + 128);
    });
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "700 30px Cairo, Arial"; ctx.textAlign = "center";
    ctx.fillText("أكثر تصنيف: " + s.topGenre + "  ·  أكثر نوع: " + s.topType, W / 2, 1190);
    posterDownload(cv, "lorefy-wrapped-" + s.year + ".png");
  }

  function wrPosterLocalized(s) {
    var W = 1080, H = 1350, cv = doc.createElement("canvas"); cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d"), AC = "#7C3AED";
    auroraBg(ctx, W, H, AC);
    auroraChrome(ctx, W, H, AC, "\u0645\u0644\u062e\u0651\u0635\u064a \u0641\u064a \u0644\u0648\u0631\u0641\u064a " + s.year, cbUserName());
    ctx.textAlign = "center"; ctx.direction = "ltr";
    ctx.fillStyle = AC; ctx.font = "950 200px Arial";
    ctx.fillText(String(s.chapters), W / 2, 640);
    ctx.direction = "rtl";
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "800 40px Cairo, Arial";
    ctx.fillText("\u0641\u0635\u0644\u0627\u064b \u0645\u0642\u0631\u0648\u0621\u0627\u064b \u0647\u0630\u0647 \u0627\u0644\u0633\u0646\u0629", W / 2, 706);
    var tiles = [
      [String(s.total), "\u0641\u064a \u0645\u0643\u062a\u0628\u062a\u064a"], [String(s.done), "\u0623\u0643\u0645\u0644\u062a\u0647\u0627"], [String(s.streak), "\u064a\u0648\u0645 \u062a\u0648\u0627\u0644\u064a"],
      [String(s.reviews), "\u0645\u0631\u0627\u062c\u0639\u0629"], [s.avg ? s.avg.toFixed(1) : "-", "\u0645\u062a\u0648\u0633\u0637 \u062a\u0642\u064a\u064a\u0645\u064a"], [String(s.chars), "\u0634\u062e\u0635\u064a\u0629 \u0642\u064a\u0651\u0645\u062a\u0647\u0627"]
    ];
    var cols = 3, gap = 24, sx = 84, sy = 780, tw = (W - 168 - gap * (cols - 1)) / cols, th = 170;
    tiles.forEach(function (tile, i) {
      var x = sx + (i % cols) * (tw + gap), y = sy + Math.floor(i / cols) * (th + gap);
      ctx.fillStyle = AC; ctx.fillRect(x + tw / 2 - 23, y, 46, 4);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.direction = "ltr"; ctx.font = "900 54px Arial";
      ctx.fillText(tile[0], x + tw / 2, y + 84);
      ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "700 22px Cairo, Arial";
      ctx.fillText(tile[1], x + tw / 2, y + 128);
    });
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "700 30px Cairo, Arial"; ctx.textAlign = "center";
    ctx.fillText("\u0623\u0643\u062b\u0631 \u062a\u0635\u0646\u064a\u0641: " + s.topGenre + "  |  \u0623\u0643\u062b\u0631 \u0646\u0648\u0639: " + s.topType, W / 2, 1190);
    posterDownload(cv, "lorefy-wrapped-" + s.year + ".png");
  }

  function wrSharePoster(button, summary) {
    var original = button ? button.textContent : "";
    if (button) {
      button.textContent = "\u062c\u0627\u0631\u064a \u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0635\u0648\u0631\u0629...";
      button.setAttribute("aria-live", "polite");
    }
    try {
      wrPosterLocalized(summary);
      if (button) button.textContent = "\u062a\u0645 \u062a\u062c\u0647\u064a\u0632 \u0627\u0644\u0635\u0648\u0631\u0629";
    } finally {
      if (button) setTimeout(function () { button.textContent = original; }, 5000);
    }
  }

  function wrNumber(n, digits) {
    var v = Number(n) || 0;
    if (digits != null) v = Number(v.toFixed(digits));
    try { return new Intl.NumberFormat(doc.documentElement.lang === 'en' ? 'en-US' : 'ar-SA', digits != null ? { maximumFractionDigits: digits } : {}).format(v); }
    catch (e) { return String(v); }
  }
  function wrPercent(n) { return wrNumber(Math.max(0, Math.min(100, Math.round(Number(n) || 0)))) + "%"; }
  function wrGoalCaption(chapters, goal) {
    return goal ? wrNumber(chapters) + uiText(" من "," of ") + wrNumber(goal) + uiText(" فصل"," chapters") : uiText("اختر عدد الفصول الذي ترغب بقراءته هذا العام","Choose how many chapters you want to read this year");
  }
  function wrEntryValue(v) {
    if (v == null) return 0;
    if (typeof v === "number" || typeof v === "string") return Number(v) || 0;
    if (typeof v === "object") return Number(v.chapters || v.chapter || v.count || v.value || v.pages || 0) || 0;
    return 0;
  }
  function wrPad(n) { return n < 10 ? "0" + n : String(n); }
  function wrDateKey(d, padded) {
    var y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    return y + "-" + (padded ? wrPad(m) : m) + "-" + (padded ? wrPad(day) : day);
  }
  function wrDateFromKey(key) {
    var m = String(key || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return null;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  function wrDayValue(log, d) {
    return wrEntryValue(log[wrDateKey(d, false)]) || wrEntryValue(log[wrDateKey(d, true)]);
  }
  function wrTopKey(map) {
    return Object.keys(map).sort(function (a, b) { return (map[b] || 0) - (map[a] || 0); })[0] || "—";
  }
  function wrMetric(value, label, note, accent) {
    return el("div", { class: "lf-wr-metric" + (accent ? " is-accent" : "") }, [
      el("strong", { text: value }),
      el("span", { text: label }),
      note ? el("em", { text: note }) : null
    ]);
  }
  function wrPanelHead(title, note) {
    return el("div", { class: "lf-wr-panel-head" }, [
      el("strong", { text: title }),
      note ? el("span", { text: note }) : null
    ]);
  }
  function wrAccuracyRow(label, value, note) {
    return el("div", { class: "lf-wr-accuracy-row" }, [
      el("span", { text: label }),
      el("strong", { text: value }),
      note ? el("em", { text: note }) : null
    ]);
  }
  function wrBuildTimeline(weeks) {
    var max = weeks.reduce(function (a, w) { return Math.max(a, w.total || 0); }, 0) || 1;
    var box = el("div", { class: "lf-wr-timeline", role: "img", "aria-label": "خط زمني لآخر 12 أسبوع قراءة" });
    weeks.forEach(function (w) {
      var pct = Math.max(0, Math.round((w.total || 0) / max * 100));
      box.appendChild(el("span", { class: "lf-wr-bar", title: w.label + ": " + wrNumber(w.total) }, [
        el("i", { style: "height:" + pct + "%" })
      ]));
    });
    return box;
  }

  wrStats = function wrStatsInteractive() {
    var year = new Date().getFullYear();
    var lib = read("lorefy.user.library.v2", {}) || {};
    var mids = Object.keys(lib);
    function statusOf(v) { return typeof v === "string" ? v : (v && (v.st || v.status)) || ""; }
    var done = 0, reading = 0;
    mids.forEach(function (k) {
      var s = String(statusOf(lib[k]) || "");
      if (s.indexOf("تم") === 0 || /done|complete|finished/i.test(s)) done++;
      else if (s.indexOf("أقرأ") === 0 || /reading|current/i.test(s)) reading++;
    });
    var rl = read("lorefy.user.readLog.v1", {}) || {};
    var chYear = 0, daysActive = 0, bestDay = null, bestDayValue = 0;
    var monthly = Array(12).fill(0);
    Object.keys(rl).forEach(function (key) {
      var d = wrDateFromKey(key), val = wrEntryValue(rl[key]);
      if (!d || d.getFullYear() !== year || val <= 0) return;
      chYear += val;
      daysActive++;
      monthly[d.getMonth()] += val;
      if (val > bestDayValue) { bestDayValue = val; bestDay = d; }
    });
    var streak = 0, today = new Date();
    for (var i = 0; i < 366; i++) {
      var d0 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      if (wrDayValue(rl, d0) > 0) streak++;
      else if (i > 0) break;
    }
    var weekly = [];
    for (var wi = 11; wi >= 0; wi--) {
      var sum = 0;
      for (var dd = 0; dd < 7; dd++) {
        var day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (wi * 7 + dd));
        if (day.getFullYear() === year) sum += wrDayValue(rl, day);
      }
      weekly.push({ label: "أسبوع " + (12 - wi), total: sum });
    }
    var revs = (read("lorefy.user.privateReviews.v2", []) || []).filter(function (r) { return r && (!r.userId || r.userId === "me"); });
    var avg = revs.length ? revs.reduce(function (a, r) { return a + (Number(r.r) || 0); }, 0) / revs.length : 0;
    var favs = (read("lorefy.user.favorites.v2", []) || []).length;
    var cr = read(K_SCORES, {}) || {}, charCount = 0, characterWorks = 0;
    Object.keys(cr).forEach(function (k) {
      var count = Object.keys(cr[k] || {}).length;
      if (count) characterWorks++;
      charCount += count;
    });
    var g = {}, t = {};
    mids.forEach(function (k) {
      var w = mlWorkBy(k); if (!w) return;
      (w.genres || []).forEach(function (x) { g[x] = (g[x] || 0) + 1; });
      if (w.type) t[w.type] = (t[w.type] || 0) + 1;
    });
    var topWorks = revs.slice().sort(function (a, b) { return (Number(b.r) || 0) - (Number(a.r) || 0); }).slice(0, 3)
      .map(function (r) { return mlWorkBy(r.mid); }).filter(Boolean);
    var completionRate = mids.length ? Math.round(done / mids.length * 100) : 0;
    var avgPerActiveDay = daysActive ? chYear / daysActive : 0;
    var goals = read("lorefy.user.readingGoal.v1", {}) || {};
    var goal = Math.max(0, Math.min(1000000, Math.floor(Number(goals[year]) || 0)));
    var goalProgress = goal ? Math.min(100, Math.round(chYear / goal * 100)) : 0;
    return {
      year: year, total: mids.length, done: done, reading: reading,
      chapters: chYear, hours: Math.round(chYear * 12 / 60), streak: streak,
      reviews: revs.length, avg: avg, favs: favs, chars: charCount,
      topGenre: wrTopKey(g), topType: wrTopKey(t), topWorks: topWorks, lists: mlLists().length,
      completionRate: completionRate, daysActive: daysActive, bestDay: bestDay,
      bestDayLabel: bestDay ? (bestDay.getDate() + " / " + (bestDay.getMonth() + 1)) : "—",
      bestDayValue: bestDayValue, avgPerActiveDay: avgPerActiveDay,
      monthly: monthly, weekly: weekly, goal: goal, goalProgress: goalProgress,
      sources: { library: mids.length, readDays: daysActive, reviews: revs.length, characterWorks: characterWorks, favorites: favs, lists: mlLists().length }
    };
  };

  openWrapped = function openWrappedInteractive() {
    var s = wrStats();
    var ov = ovOpen("lf-wr-page", "ملخّص " + s.year);
    var dashboard = el("div", { class: "lf-wr-dashboard" });
    function summaryBand(title, note, kids, extraClass) {
      return el("section", { class: "lf-wr-summary-band" + (extraClass ? " " + extraClass : "") }, [
        el("header", { class: "lf-wr-summary-band-head" }, [el("strong", { text: title }), note ? el("small", { text: note }) : null]),
        kids
      ]);
    }
    dashboard.appendChild(el("section", { class: "lf-wr-summary-hero" }, [
      el("header", { class: "lf-wr-summary-brand" }, [
        el("span", { class: "lf-wr-summary-mark", text: "✦", "aria-hidden": "true" }),
        el("strong", { text: "LOREFY" }),
        el("span", { text: String(s.year) })
      ]),
      el("p", { class: "lf-wr-summary-kicker", text: "سنة قراءتك في صفحة واحدة" }),
      el("div", { class: "lf-wr-summary-primary" }, [
        el("strong", { text: wrNumber(s.chapters) }),
        el("span", { text: uiText("فصل في سجل القراءة","chapters in reading history") })
      ]),
      el("div", { class: "lf-wr-summary-hero-meta" }, [
        el("span", { text: "≈ " + wrNumber(s.hours) + " ساعة" }),
        el("span", { text: wrNumber(s.daysActive) + " يوم نشاط" }),
        el("span", { text: wrNumber(s.streak) + " يوم توالي" })
      ])
    ]));
    dashboard.appendChild(el("section", { class: "lf-wr-summary-kpis", "aria-label": "مؤشرات السنة" }, [
      wrMetric(wrNumber(s.total), "في المكتبة", "كل الأعمال", true),
      wrMetric(wrNumber(s.done), uiText("مكتملة","Completed"), uiText("في المكتبة الحالية","in the current library")),
      wrMetric(s.avg ? wrNumber(s.avg, 1) : "—", "متوسطك", wrNumber(s.reviews) + " مراجعة"),
      wrMetric(wrNumber(s.chars), "شخصية", "قيّمتها")
    ]));
    var goalLabel = el("strong", { text: s.goal ? wrPercent(s.goalProgress) : "لم تحدد هدفًا" });
    var goalDescription = el("small", { text: wrGoalCaption(s.chapters,s.goal) });
    var goalBar = el("i", { style: "width:" + s.goalProgress + "%" });
    var goalInput = el("input", { type: "number", min: "1", max: "1000000", step: "1", value: s.goal || "", "aria-label": "هدف الفصول السنوي", placeholder: "عدد الفصول" });
    var goalSave = el("button", { type: "button", text: "حفظ الهدف" });
    goalSave.addEventListener("click", function () {
      if (goalInput.value && !goalInput.checkValidity()) { goalInput.reportValidity(); return; }
      var value = Math.max(0, Math.floor(Number(goalInput.value) || 0));
      var goals = read("lorefy.user.readingGoal.v1", {}) || {}; goals[s.year] = value;
      write("lorefy.user.readingGoal.v1", goals);
      goalLabel.textContent = value ? wrPercent(Math.min(100, Math.round(s.chapters / value * 100))) : "لم تحدد هدفًا";
      goalDescription.textContent = wrGoalCaption(s.chapters,value);
      goalBar.style.width = (value ? Math.min(100, s.chapters / value * 100) : 0) + "%";
    });
    dashboard.appendChild(el("section", { class: "lf-wr-summary-goal" }, [
      el("div", { class: "lf-wr-summary-goal-copy" }, [
        el("span", { text: "هدفك السنوي" }), goalLabel, goalDescription,
        el("div", { class: "lf-wr-goal-controls" }, [goalInput, goalSave])
      ]),
      el("div", { class: "lf-wr-summary-goal-track" }, [goalBar])
    ]));
    dashboard.appendChild(summaryBand("إيقاعك", "آخر 12 أسبوع من سجل القراءة", el("div", { class: "lf-wr-summary-rhythm" }, [
      wrBuildTimeline(s.weekly),
      el("div", { class: "lf-wr-mini-labels" }, [el("span", { text: "قبل 12 أسبوع" }), el("span", { text: "اليوم" })]),
      el("div", { class: "lf-wr-summary-rhythm-stats" }, [
        wrAccuracyRow("أفضل يوم", s.bestDayLabel, s.bestDayValue ? wrNumber(s.bestDayValue) + " فصل" : "لا توجد قراءة موثقة"),
        wrAccuracyRow("متوسط اليوم النشط", wrNumber(s.avgPerActiveDay, 1), "فصل"),
        wrAccuracyRow("تواليك الحالي", wrNumber(s.streak), "يوم")
      ])
    ]), "is-rhythm"));
    var tasteContent = el("div", { class: "lf-wr-summary-taste" }, [
      el("div", { class: "lf-wr-taste-chips" }, [el("span", { class: "lf-wr-chip is-accent", text: s.topGenre }), el("span", { class: "lf-wr-chip", text: s.topType })]),
      el("p", { text: "يتكوّن ذوقك من الأعمال المحفوظة وتقييماتك، ويتحدث تلقائيًا مع كل إضافة." })
    ]);
    if (s.topWorks.length) {
      var strip = el("div", { class: "lf-wr-topworks" });
      s.topWorks.forEach(function (w, ix) {
        var src = mlCoverOf(w), cell = el("span", { class: "lf-wr-topcover" });
        if (src) {
          var im = doc.createElement("img"); im.src = src; im.alt = ""; im.loading = "lazy";
          im.addEventListener("error", function () { im.remove(); cell.textContent = mlTitleOf(w).slice(0, 1); });
          cell.appendChild(im);
        } else cell.textContent = mlTitleOf(w).slice(0, 1);
        cell.appendChild(el("b", { class: "lf-wr-toprank" + (ix === 0 ? " is-gold" : ""), text: String(ix + 1) }));
        strip.appendChild(el("span", { class: "lf-wr-topitem" }, [cell, el("span", { class: "lf-wr-topname", text: mlTitleOf(w) })]));
      });
      tasteContent.appendChild(el("strong", { class: "lf-wr-summary-top-label", text: "أعلى تقييماتك" }));
      tasteContent.appendChild(strip);
    }
    dashboard.appendChild(summaryBand("خريطة ذوقك", "النوع والتصنيف الأكثر حضورًا", tasteContent, "is-taste"));
    dashboard.appendChild(summaryBand("دفتر السنة", "صورة مختصرة لما أنجزته وحفظته", el("div", { class: "lf-wr-summary-ledger" }, [
      wrRow(wrNumber(s.reading), "أعمال تقرؤها حاليًا"),
      wrRow(wrNumber(s.done), "أعمال مكتملة"),
      wrRow(wrNumber(s.favs), "أعمال مفضلة"),
      wrRow(wrNumber(s.lists), "قوائم خاصة")
    ]), "is-ledger"));
    dashboard.appendChild(el("details", { class: "lf-wr-summary-data" }, [
      el("summary", { text: "كيف حُسب هذا الملخص؟" }),
      el("div", { class: "lf-wr-accuracy" }, [
        wrAccuracyRow("المكتبة", wrNumber(s.sources.library), "الأعمال المحفوظة"),
        wrAccuracyRow("سجل القراءة", wrNumber(s.sources.readDays), "أيام لها نشاط قراءة"),
        wrAccuracyRow("المراجعات", wrNumber(s.sources.reviews), "تدخل في المتوسط"),
        wrAccuracyRow("تقييم الشخصيات", wrNumber(s.sources.characterWorks), "أعمال فيها تقييمات شخصيات"),
        wrAccuracyRow("المفضلة والقوائم", wrNumber(s.sources.favorites + s.sources.lists), "لإشارات الذوق")
      ]),
      el("p", { class: "lf-wr-note", text: uiText("الفصول والنشاط من سجل القراءة لهذه السنة. أعداد الأعمال وحالاتها من المكتبة الحالية؛ قد يضم السجل أعمالًا أزلتها من المكتبة. الساعات تقديرية بمعدل 12 دقيقة للفصل.","Chapters and activity come from this year's reading history. Work counts and statuses reflect the current library; history may include removed works. Hours are estimated at 12 minutes per chapter.") })
    ]));
    var share = el("button", { type: "button", class: "lf-wr-share", text: "مشاركة الملخص كصورة" });
    share.addEventListener("click", function () { wrSharePoster(share, s); });
    dashboard.appendChild(share);
    ov.body.appendChild(dashboard);
  };

  /* ── IMPORT LIBRARY (AniList username · MAL export · Goodreads export) ── */
  var IM_READING = "أقرأ حالياً", IM_DONE = "تم القراءة", IM_WISH = "قائمة الأمنيات", IM_PAUSED = "توقف", IM_DROPPED = "توقف نهائي";
  function imNorm(t) { return String(t || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9\u0600-\u06FF]+/g, " ").trim(); }
  var imMaps = null;
  function imBuildMaps() {
    var catalog = mlWorks();
    if (imMaps && imMaps.catalog === catalog && imMaps.length === catalog.length) return imMaps;
    var byMal = new Map(), byTitle = new Map();
    function rank(w) {
      var source = String(w.id || '') + ' ' + String(w.pl || '');
      return (/^mal-|myanimelist/i.test(source) ? 100 : /^anilist-|anilist/i.test(source) ? 90 : 0) +
        (Number(w.ch || w.chapters) > 0 ? 20 : 0) + (Number(w.pop) > 0 ? 5 : 0);
    }
    function putTitle(key, w) {
      if (!key) return;
      var candidates = byTitle.get(key) || [];
      if (!candidates.some(function (item) { return String(item.id) === String(w.id); })) candidates.push(w);
      candidates.sort(function (a,b) { return rank(b)-rank(a) || String(a.id).localeCompare(String(b.id)); });
      byTitle.set(key,candidates);
    }
    catalog.forEach(function (w) {
      var m = /^mal-[a-z]+-(\d+)(?:-|$)/.exec(String(w.id));
      var mal = (w.mal || w.malId || (m && m[1]) || "") + "";
      if (mal && !byMal.has(mal)) byMal.set(mal, w);
      [w.title, w.titleEnglish, w.english, w.ar].concat(w.alternateTitles || []).forEach(function (title) { putTitle(imNorm(title), w); });
    });
    imMaps = { byMal: byMal, byTitle: byTitle, catalog:catalog, length:catalog.length };
    return imMaps;
  }
  function imFindByTitle(title) {
    var maps = imBuildMaps(), k = imNorm(title);
    if (!k) return null;
    if (maps.byTitle.has(k)) return maps.byTitle.get(k)[0];
    var head = k.split(" ").slice(0, 8).join(" ");
    var colon = String(title).split(":")[0];
    var k2 = imNorm(colon);
    if (k2 && k2 !== k && maps.byTitle.has(k2)) return maps.byTitle.get(k2)[0];
    var candidates = maps.byTitle.get(head);
    return candidates && candidates[0] || null;
  }
  /* rows: [{work, status, chapters, score(1-5|0), review?}] → merge into app storage */
  function imApply(rows, options) {
    var keys = ["lorefy.user.library.v2", "lorefy.user.progress.v2", "lorefy.user.privateReviews.v2"];
    var storage = global.localStorage;
    var previous = keys.map(function (key) { return storage.getItem(key); });
    var lib = read("lorefy.user.library.v2", {}) || {};
    var prog = read("lorefy.user.progress.v2", {}) || {};
    var revs = read("lorefy.user.privateReviews.v2", []) || [];
    var idn = read("lorefy.identity.v1", {}) || {};
    var added = 0, ratings = 0, reviewCount = 0, skipped = 0;
    var ownReviews = new Map();
    revs.forEach(function (r) { if (r && (!r.userId || r.userId === "me")) ownReviews.set(String(r.mid), r); });
    rows.forEach(function (row) {
      var mid = String(row.work.id);
      if (lib[mid]) skipped++;
      else {
        lib[mid] = row.status; added++;
        if (row.chapters > 0 && !prog[mid]) prog[mid] = { chapter: row.chapters, volume: 0, page: 0, note: "" };
      }
      var body = options && options.reviews === false ? "" : typeof row.review === "string" ? row.review.trim() : "";
      var existing = ownReviews.get(mid);
      if (existing) {
        // Fill only missing text; explicit ratings and authored reviews remain authoritative.
        if (body && (!existing.txt || String(existing.txt).trim() === "—")) { existing.txt = body; reviewCount++; }
      } else if (row.score > 0 || body) {
        var score = row.score > 0 ? row.score : null;
        var record = {
          id: "r" + (global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)),
          userId: "me", user: idn.name || "قارئ", un: idn.un || "reader", av: idn.avatar || "",
          mid: row.work.id, r: score, rec: score >= 4, recVal: score >= 4 ? "yes" : (score !== null && score <= 2 ? "no" : ""),
          premium: false, txt: body || "—", imgs: [], ts: Date.now(), likes: 0, comments: 0, isPublic: false,
          ratings: { overall: score }, moment: "", spoiler: false, chars: null
        };
        revs.unshift(record); ownReviews.set(mid, record);
        if (score !== null) ratings++;
        if (body) reviewCount++;
      }
    });
    var updates = [lib, prog, revs];
    try {
      keys.forEach(function (key, index) {
        if (!write(key, updates[index])) throw new Error("Import storage write failed.");
      });
    } catch (error) {
      var restored = true;
      keys.forEach(function (key, index) {
        try {
          if (storage.getItem(key) !== previous[index]) {
            if (previous[index] === null) storage.removeItem(key);
            else storage.setItem(key, previous[index]);
          }
          if (storage.getItem(key) !== previous[index]) restored = false;
        } catch (restoreError) { restored = false; }
      });
      var failure = new Error("Unable to save imported library.");
      failure.code = restored ? "LOREFY_IMPORT_SAVE_FAILED" : "LOREFY_IMPORT_PARTIAL_SAVE";
      throw failure;
    }
    keys.forEach(function (key) {
      global.dispatchEvent(new global.CustomEvent("lorefy:stored-state", { detail: { key: key } }));
    });
    return { added: added, ratings: ratings, reviews: reviewCount, skipped: skipped };
  }
  function imStatusFromAL(s) {
    if (s === "CURRENT" || s === "REPEATING") return IM_READING;
    if (s === "COMPLETED") return IM_DONE;
    if (s === "PLANNING") return IM_WISH;
    if (s === "DROPPED") return IM_DROPPED;
    return IM_PAUSED;
  }
  function imFetchAniList(userName) {
    var q = "query($name:String){MediaListCollection(userName:$name,type:MANGA){lists{entries{status score(format:POINT_10) progress media{idMal chapters title{romaji english}}}}}}";
    return withTimeout(fetch(growthCatalogUrl("anilist", "https://graphql.anilist.co"), {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: q, variables: { name: userName } })
    }), 9000).then(function (r) { return r.json(); }).then(function (j) {
      if (j.errors && j.errors.length) throw new Error(/not found/i.test(j.errors[0].message || "") ? "اسم المستخدم غير موجود في AniList" : "تعذر الجلب من AniList");
      var lists = (((j.data || {}).MediaListCollection || {}).lists) || [];
      var maps = imBuildMaps(), rows = [], misses = 0;
      lists.forEach(function (L) {
        (L.entries || []).forEach(function (e) {
          var med = e.media || {};
          var w = (med.idMal && maps.byMal.get(String(med.idMal))) ||
                  imFindByTitle((med.title && (med.title.english || med.title.romaji)) || "");
          if (!w) { misses++; return; }
          rows.push({ work: w, status: imStatusFromAL(e.status), chapters: Number(e.progress) || 0, score: Math.min(5, Math.max(0, Math.round((Number(e.score) || 0) * 2) / 4)) });
        });
      });
      return { rows: rows, misses: misses };
    });
  }
  function imParseMalXml(text) {
    var dp = new DOMParser(), xml = dp.parseFromString(text, "text/xml");
    var maps = imBuildMaps(), rows = [], misses = 0;
    var items = xml.querySelectorAll("manga");
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      function tx(tag) { var n = it.querySelector(tag); return n ? (n.textContent || "").trim() : ""; }
      var w = maps.byMal.get(tx("manga_mangadb_id")) || imFindByTitle(tx("manga_title"));
      if (!w) { misses++; continue; }
      var st = tx("my_status");
      var status = /Reading/i.test(st) ? IM_READING : /Completed/i.test(st) ? IM_DONE : /Plan/i.test(st) ? IM_WISH : /Dropped|^4$/i.test(st) ? IM_DROPPED : IM_PAUSED;
      rows.push({ work: w, status: status, chapters: Number(tx("my_read_chapters")) || 0, score: Math.min(5, Math.max(0, Math.round((Number(tx("my_score")) || 0) * 2) / 4)) });
    }
    if (!items.length) throw new Error("الملف لا يبدو تصدير مانجا من MAL");
    return { rows: rows, misses: misses };
  }
  function imParseCsvLine(line) {
    return imParseCsvRows(line, ",")[0] || [""];
  }
  function imParseCsvRows(text, separator) {
    text = String(text || "").replace(/^\uFEFF/, "").replace(/^(?:[ \t]*(?:\r\n|\r|\n))+/, "");
    if (!separator) {
      var quoted = false, commas = 0, tabs = 0;
      for (var h = 0; h < text.length; h++) {
        var headerChar = text[h];
        if (headerChar === '"') {
          if (quoted && text[h + 1] === '"') h++;
          else quoted = !quoted;
        } else if (!quoted) {
          if (headerChar === "\r" || headerChar === "\n") break;
          if (headerChar === ",") commas++;
          if (headerChar === "\t") tabs++;
        }
      }
      separator = tabs > commas ? "\t" : ",";
    }
    var records = [], record = [], field = "", inQuotes = false;
    function endRecord() {
      record.push(field); field = "";
      if (record.some(function (value) { return value.trim(); })) records.push(record);
      record = [];
    }
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === separator) { record.push(field); field = ""; }
      else if (ch === "\r" || ch === "\n") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        endRecord();
      } else field += ch;
    }
    if (inQuotes) throw new Error(uiText("ملف CSV غير صالح: علامة اقتباس غير مغلقة.", "Invalid CSV: an unfinished quoted field."));
    if (field.length || record.length) endRecord();
    return records;
  }
  function imParseGoodreads(text) {
    var lines = imParseCsvRows(text, ",");
    if (!lines.length) throw new Error("ملف فارغ");
    var head = lines[0].map(function (h) { return h.trim().toLowerCase(); });
    var iT = head.indexOf("title"), iR = head.indexOf("my rating"), iS = head.indexOf("exclusive shelf"), iV = head.indexOf("my review");
    if (iT < 0) throw new Error("الملف لا يبدو تصدير Goodreads (لا يوجد عمود Title)");
    var rows = [], misses = 0;
    for (var i = 1; i < lines.length; i++) {
      var c = lines[i];
      var w = imFindByTitle(c[iT] || "");
      if (!w) { misses++; continue; }
      var shelf = (iS >= 0 ? c[iS] : "") || "";
      var status = /currently/i.test(shelf) ? IM_READING : /to-read/i.test(shelf) ? IM_WISH : IM_DONE;
      rows.push({ work: w, status: status, chapters: 0, score: Math.min(5, Math.max(0, Number(iR >= 0 ? c[iR] : 0) || 0)), review: iV >= 0 ? c[iV] || "" : "" });
    }
    return { rows: rows, misses: misses };
  }
  /* status word → app status (order matters: to-read before read) */
  function imStatusWord(s) {
    s = String(s || "").toLowerCase();
    if (/to-read|to read|plan|want|wish/.test(s)) return IM_WISH;
    if (/currently|current|reading/.test(s)) return IM_READING;
    if (/drop|abandon|dnf/.test(s)) return IM_DROPPED;
    if (/hold|pause/.test(s)) return IM_PAUSED;
    if (/read|complete|finish|done/.test(s)) return IM_DONE;
    return "";
  }
  /* generic CSV: auto-detect title/status/rating columns — covers StoryGraph,
     LibraryThing, Anime-Planet, League of Comic Geeks وغيرها */
  function imParseGenericCsv(text, defStatus) {
    var lines = imParseCsvRows(text);
    if (lines.length < 2) throw new Error("ملف فارغ أو بلا صفوف");
    var head = lines[0].map(function (h) { return h.trim().toLowerCase(); });
    function col(cands) { for (var i = 0; i < cands.length; i++) { var at = head.indexOf(cands[i]); if (at >= 0) return at; } return -1; }
    var iT = col(["title", "name", "book title", "series", "manga", "work", "العنوان"]);
    if (iT < 0) throw new Error("لم أجد عمود العنوان (Title) في الملف");
    var iS = col(["read status", "exclusive shelf", "shelf", "status", "list"]);
    var iR = col(["star rating", "my rating", "rating", "score"]);
    var iV = col(["my review", "review", "review text", "المراجعة"]);
    var rows = [], misses = 0;
    for (var i = 1; i < lines.length; i++) {
      var c = lines[i];
      var w = imFindByTitle(c[iT] || "");
      if (!w) { misses++; continue; }
      var status = (iS >= 0 && imStatusWord(c[iS])) || defStatus || IM_DONE;
      var raw = iR >= 0 ? Number(String(c[iR] || "").trim()) : 0;
      var score = Number.isFinite(raw) ? Math.round((raw > 5 ? raw / 2 : raw) * 4) / 4 : 0;
      rows.push({ work: w, status: status, chapters: 0, score: Math.min(5, Math.max(0, score || 0)), review: iV >= 0 ? c[iV] || "" : "" });
    }
    return { rows: rows, misses: misses };
  }
  /* Kitsu — public JSON:API, one-tap by username */
  function imFetchKitsu(name) {
    var H = { Accept: "application/vnd.api+json" };
    function jget(u) { return withTimeout(fetch(u, { headers: H }), 9000).then(function (r) { if (!r.ok) throw new Error("kitsu " + r.status); return r.json(); }); }
    return jget("https://kitsu.io/api/edge/users?filter[slug]=" + encodeURIComponent(name)).then(function (j) {
      var u = j.data && j.data[0];
      if (u) return u.id;
      return jget("https://kitsu.io/api/edge/users?filter[name]=" + encodeURIComponent(name)).then(function (j2) {
        var u2 = j2.data && j2.data[0];
        if (!u2) throw new Error("اسم المستخدم غير موجود في Kitsu");
        return u2.id;
      });
    }).then(function (uid) {
      var rows = [], misses = 0, pages = new Set(), entries = new Set();
      var incomplete = "تعذر إكمال جلب مكتبة Kitsu. لم يتم استيراد أي بيانات. حاول مجددًا.";
      function pageLoad(url, n) {
        var target = new URL(url, "https://kitsu.io/api/edge/library-entries");
        if (target.protocol !== "https:" || (target.hostname !== "kitsu.io" && target.hostname !== "kitsu.app") || target.port || target.username || target.password || target.pathname !== "/api/edge/library-entries") throw new Error(incomplete);
        target.hash = "";
        target.searchParams.sort();
        var identity = target.pathname + target.search;
        // Reject broken pagination rather than presenting a truncated library as complete.
        if (pages.has(identity) || n >= 1000) throw new Error(incomplete);
        pages.add(identity);
        return jget(target.href).then(function (j) {
          if (!j || !Array.isArray(j.data) || (j.included != null && !Array.isArray(j.included))) throw new Error(incomplete);
          var inc = {}; (j.included || []).forEach(function (m) { inc[m.type + "/" + m.id] = m; });
          j.data.forEach(function (e) {
            if (e.id != null) {
              var identity = String(e.id);
              if (entries.has(identity)) return;
              entries.add(identity);
            }
            var a = e.attributes || {};
            var rel = e.relationships && e.relationships.manga && e.relationships.manga.data;
            var med = rel ? inc[rel.type + "/" + rel.id] : null;
            var at = (med && med.attributes) || {};
            var w = imFindByTitle(at.canonicalTitle || (at.titles && (at.titles.en || at.titles.en_jp)) || "");
            if (!w) { misses++; return; }
            var st = a.status === "current" ? IM_READING : a.status === "completed" ? IM_DONE : a.status === "planned" ? IM_WISH : a.status === "dropped" ? IM_DROPPED : IM_PAUSED;
            rows.push({ work: w, status: st, chapters: Number(a.progress) || 0, score: Math.min(5, Math.max(0, Math.round(Number(a.ratingTwenty) || 0) / 4)) });
          });
          var next = j.links && j.links.next;
          if (next != null) {
            if (typeof next === "object") next = next.href;
            if (typeof next !== "string" || !next.trim()) throw new Error(incomplete);
            return pageLoad(next, n + 1);
          }
        });
      }
      return pageLoad("https://kitsu.io/api/edge/library-entries?filter[userId]=" + encodeURIComponent(uid) + "&filter[kind]=manga&include=manga&page[limit]=500", 0)
        .catch(function () { throw new Error(incomplete); })
        .then(function () {
          if (!rows.length && !misses) throw new Error("لا توجد أعمال مانجا في هذا الحساب");
          return { rows: rows, misses: misses };
        });
    });
  }
  function imReadFileText(file, cb, onErr) {
    var isGz = /\.gz$/i.test(file.name || "");
    if (isGz && typeof DecompressionStream !== "undefined") {
      new Response(file.stream().pipeThrough(new DecompressionStream("gzip"))).text().then(cb).catch(function () { onErr("تعذر فك ضغط الملف — فك الضغط يدويًا وارفع ملف .xml"); });
    } else if (isGz) onErr("متصفحك لا يدعم فك الضغط — فك الضغط يدويًا وارفع ملف .xml");
    else { var fr = new FileReader(); fr.onload = function () { cb(String(fr.result || "")); }; fr.onerror = function () { onErr("تعذر قراءة الملف"); }; fr.readAsText(file); }
  }
  function openImport() {
    var ov = ovOpen("lf-im-page", uiText("استيراد مكتبتك", "Import your library"));
    var note = el("p", { class: "lf-im-note", text: uiText("مكتبتك الحالية محفوظة. راجع المطابقات قبل تأكيد الاستيراد.", "Your existing library is preserved. Review matches before confirming import.") });
    ov.body.appendChild(note);
    var result = el("div", { class: "lf-im-result", "aria-busy": "false" });
    ov.body.appendChild(result);
    function field(control, label) {
      var error = el("p", { class: "lf-im-field-error", role: "alert", hidden: "" });
      control._importError = error;
      return el("label", { class: "lf-im-field" }, [el("span", { text: label }), control, error]);
    }
    function validate(control, message) {
      var empty = !control.value.trim();
      control._importError.hidden = !empty;
      control._importError.textContent = empty ? message : "";
      if (empty) { control.setAttribute("aria-invalid", "true"); control.focus(); }
      else control.removeAttribute("aria-invalid");
      return !empty;
    }
    function focusResult(node) { node.focus(); }
    var openingContext = importContext(), attemptId = 0;
    function importContext() {
      var backend = global.LorefyBackend || null, active = "";
      try { active = global.localStorage.getItem("lorefy.activeUser.v1") || ""; } catch (e) {}
      return { backend:backend, client:backend && backend.client, mode:backend && backend.mode,
        epoch:backend && backend._communityEpoch, user:backend && backend.user && backend.user.id || "", active:active };
    }
    function currentAttempt(attempt) {
      if (attempt !== attemptId || !ov.page.isConnected || ov.page.inert) return false;
      var current = importContext();
      if (!Object.keys(openingContext).every(function (key) { return openingContext[key] === current[key]; })) {
        ov.close();
        toastSafe(uiText("تغير الحساب أو الجلسة. افتح الاستيراد مجددًا.", "Your account or session changed. Reopen import."));
        return false;
      }
      return true;
    }
    function beginImport() {
      if (!currentAttempt(attemptId)) return 0;
      attemptId++;
      result.textContent = "";
      result.setAttribute("aria-busy", "true");
      var pending = el("p", { class: "lf-im-loading", role: "status", tabindex: "-1", text: uiText("جارٍ تجهيز المطابقات…", "Preparing matches…") });
      result.appendChild(pending);
      focusResult(pending);
      return attemptId;
    }
    function finish(res, sourceLabel, attempt) {
      if (!currentAttempt(attempt)) return;
      result.textContent = "";
      result.setAttribute("aria-busy", "false");
      var selectedRows = res.rows.map(function (row) { return Object.assign({}, row); });
      var heading = el("h3", { tabindex: "-1", text: uiText("راجع المطابقات", "Review matches") });
      var preview = el("section", { class:"lf-im-preview" }, [
        heading,
        el("p", { text:uiText("لن تتغير مكتبتك قبل التأكيد. يمكنك تبديل النسخة أو استبعادها.", "Your library stays unchanged until you confirm. Change an edition or skip it.") })
      ]);
      var reviewToggle = null;
      var reviewsAvailable = selectedRows.filter(function (row) { return typeof row.review === "string" && row.review.trim(); }).length;
      if (reviewsAvailable) {
        reviewToggle = el("input", {type:"checkbox", class:"lf-im-include-reviews"});
        reviewToggle.checked = true;
        preview.appendChild(el("label", {class:"lf-im-review-option"}, [reviewToggle,
          el("span", {text:uiText("استيراد نصوص المراجعات", "Import written reviews") + " (" + reviewsAvailable + ")"})]));
        preview.appendChild(el("p", {text:uiText("نضيف النصوص المفقودة فقط، دون استبدال تقييماتك أو مراجعاتك الحالية. لا نشر عام تلقائيًا.", "Only missing text is added. Existing ratings and written reviews stay unchanged. Nothing is published automatically.")}));
      }
      var matches = el("div", { class:"lf-im-preview-list" });
      var visible = 0;
      var more = el("button", { type:"button", class:"lf-im-more", text:uiText("عرض المزيد", "Show more") });
      function paintMore() {
        if (!currentAttempt(attempt)) return;
        var end = Math.min(visible + 40, selectedRows.length);
        for (; visible < end; visible++) {
          (function (index) {
            var row = selectedRows[index], work = row.work;
            var alternatives = (imBuildMaps().byTitle.get(imNorm(work.title)) || []).slice();
            if (!alternatives.some(function (w) { return String(w.id) === String(work.id); })) alternatives.unshift(work);
            var select = el("select", { "aria-label":uiText("مطابقة ", "Match for ") + mlTitleOf(work) });
            alternatives.forEach(function (w) {
              var option = el("option", { value:String(w.id), text:mlTitleOf(w) + " · " + w.type + " · " + (w.pl || w.auth || '') + (w.ch ? " · " + w.ch + uiText(" فصل", " chapters") : '') });
              select.appendChild(option);
            });
            select.appendChild(el("option", { value:"", text:uiText("استبعاد", "Skip") }));
            select.value = String(work.id);
            select.addEventListener("change", function () { row.work = alternatives.find(function (w) { return String(w.id) === select.value; }) || null; });
            var matchRow = el("div", { class:"lf-im-preview-row" }, [mlResultCover(work), select]);
            if (typeof row.review === "string" && row.review.trim()) matchRow.appendChild(el("details", {class:"lf-im-review-preview"}, [
              el("summary", {text:uiText("نص المراجعة", "Review text")}), el("p", {dir:"auto", text:row.review.trim()})]));
            matches.appendChild(matchRow);
          })(visible);
        }
        more.hidden = visible >= selectedRows.length;
      }
      more.addEventListener("click", paintMore);
      paintMore();
      preview.appendChild(matches);
      preview.appendChild(more);
      preview.appendChild(el("p", { role:"status", text:selectedRows.length + uiText(" مطابقة", " matches") + (res.misses ? " · " + res.misses + uiText(" غير مطابق", " unmatched") : '') }));
      var confirm = el("button", { type:"button", class:"lf-im-confirm lf-im-go", text:uiText("تأكيد الاستيراد", "Confirm import") });
      var saveError = null;
      confirm.disabled = !selectedRows.length;
      confirm.addEventListener("click", function () {
        if (confirm.disabled || !currentAttempt(attempt)) return;
        confirm.disabled = true;
        selectedRows = selectedRows.filter(function (row) { return !!row.work; });
        if (saveError) saveError.hidden = true;
        var out;
        try { out = imApply(selectedRows, {reviews:!reviewToggle || reviewToggle.checked}); }
        catch (error) {
          if (!currentAttempt(attempt)) return;
          var partial = error && error.code === "LOREFY_IMPORT_PARTIAL_SAVE";
          confirm.disabled = !!partial;
          if (!saveError) {
            saveError = el("p", { class:"lf-im-error lf-im-save-error", role:"alert", tabindex:"-1" });
            preview.appendChild(saveError);
          }
          saveError.textContent = partial
            ? uiText("لم يكتمل الحفظ وقد بقيت بعض التغييرات. راجع مكتبتك قبل إعادة الاستيراد.", "Import was only partly saved. Check your library before importing again.")
            : uiText("تعذر تأكيد حفظ الاستيراد. حاول مجددًا.", "Unable to save your import. Please try again.");
          saveError.hidden = false;
          focusResult(saveError);
          return;
        }
        if (currentAttempt(attempt)) renderResult(out,res,sourceLabel);
      });
      preview.appendChild(confirm);
      result.appendChild(preview);
      focusResult(heading);
    }
    function renderResult(out, res, sourceLabel) {
      result.textContent = "";
      result.setAttribute("aria-busy", "false");
      var heading = el("h3", { tabindex: "-1", text: uiText("تم الاستيراد من ", "Imported from ") + sourceLabel });
      result.appendChild(el("div", { class: "lf-im-summary" }, [
        heading,
        el("span", { text: out.added + uiText(" عمل أُضيف إلى مكتبتك", " titles added to your library") }),
        out.ratings ? el("span", { text: out.ratings + uiText(" تقييم استُورد", " ratings imported") }) : null,
        out.reviews ? el("span", { text: out.reviews + uiText(" نص مراجعة استُورد", " written reviews imported") }) : null,
        out.skipped ? el("span", { text: out.skipped + uiText(" حالة قراءة موجودة (تُركت كما هي)", " existing reading statuses kept unchanged") }) : null,
        res.misses ? el("span", { text: res.misses + uiText(" عمل غير مطابق في الكتالوج", " titles not matched in the catalog") }) : null
      ]));
      var reload = el("button", { type: "button", class: "lf-im-reload", text: uiText("تم، العودة إلى التطبيق", "Done, return to the app") });
      reload.addEventListener("click", function () { ov.close(); });
      result.appendChild(reload);
      focusResult(heading);
    }
    function fail(msg, attempt) {
      if (!currentAttempt(attempt)) return;
      var messages = {
        "اسم المستخدم غير موجود في AniList": "AniList username was not found.",
        "اسم المستخدم غير موجود في Kitsu": "Kitsu username was not found.",
        "تعذر إكمال جلب مكتبة Kitsu. لم يتم استيراد أي بيانات. حاول مجددًا.": "Could not fetch the complete Kitsu library. No data was imported. Try again.",
        "تعذر الجلب من AniList": "Could not fetch from AniList. Try again.",
        "الملف لا يبدو تصدير مانجا من MAL": "This file is not a MAL manga export.",
        "الملف لا يبدو تصدير Goodreads (لا يوجد عمود Title)": "This Goodreads export has no Title column.",
        "ملف فارغ": "The file is empty.",
        "ملف فارغ أو بلا صفوف": "The file has no records.",
        "لم أجد عمود العنوان (Title) في الملف": "The file has no Title column.",
        "تعذر قراءة الملف": "Could not read the file.",
        "لا توجد أعمال مانجا في هذا الحساب": "This account has no manga entries.",
        "تعذر فك ضغط الملف — فك الضغط يدويًا وارفع ملف .xml": "Could not decompress the file. Choose an uncompressed XML file.",
        "متصفحك لا يدعم فك الضغط — فك الضغط يدويًا وارفع ملف .xml": "File decompression is unavailable. Choose an uncompressed XML file."
      };
      result.textContent = "";
      result.setAttribute("aria-busy", "false");
      var translated = Object.prototype.hasOwnProperty.call(messages, msg) ? messages[msg] : msg;
      var error = el("p", { class: "lf-im-error", role: "alert", tabindex: "-1", text: uiText(msg, translated) });
      result.appendChild(error);
      focusResult(error);
    }
    /* AniList — one-tap by username */
    var alInput = el("input", { class: "lf-ml-search", type: "text", "aria-label": uiText("اسم المستخدم في AniList", "AniList username"), placeholder: uiText("اسم المستخدم في AniList", "AniList username"), autocapitalize: "none", autocorrect: "off" });
    var alField = field(alInput, uiText("اسم المستخدم في AniList", "AniList username"));
    var alBtn = el("button", { type: "button", class: "lf-im-go", text: uiText("استيراد", "Import") });
    alBtn.addEventListener("click", function () {
      var name = alInput.value.trim();
      if (!validate(alInput, uiText("اكتب اسم المستخدم في AniList.", "Enter your AniList username."))) return;
      if (alBtn.disabled) return;
      var attempt = beginImport(); if (!attempt) return;
      alBtn.disabled = true; alBtn.textContent = uiText("جارٍ الجلب…", "Fetching…");
      imFetchAniList(name).then(function (res) { finish(res, "AniList", attempt); }).catch(function (e) { fail(e && e.message || uiText("تعذر الجلب من AniList", "Could not fetch from AniList"), attempt); }).then(function () { alBtn.disabled = false; alBtn.textContent = uiText("استيراد", "Import"); });
    });
    ov.body.appendChild(el("section", { class: "lf-im-card" }, [
      el("header", { class: "lf-im-card-head" }, [el("strong", { text: "AniList" }), el("em", { text: uiText("مكتبة الحساب العامة", "Public account library") })]),
      el("div", { class: "lf-im-row" }, [alField, alBtn])
    ]));
    /* MAL export file */
    var malFile = el("input", { type: "file", accept: ".xml,.gz,application/xml,text/xml,application/gzip", style: "display:none" });
    malFile.addEventListener("change", function () {
      var f = malFile.files && malFile.files[0]; if (!f) return;
      var attempt = beginImport(); if (!attempt) return;
      imReadFileText(f, function (text) {
        try { finish(imParseMalXml(text), "MyAnimeList", attempt); } catch (e) { fail(e.message || uiText("ملف غير صالح", "Invalid file"), attempt); }
      }, function (message) { fail(message, attempt); });
      malFile.value = "";
    });
    var malBtn = el("button", { type: "button", class: "lf-im-file", text: uiText("اختر ملف التصدير (.xml)", "Choose export file (.xml)") });
    malBtn.addEventListener("click", function () { malFile.click(); });
    ov.body.appendChild(el("section", { class: "lf-im-card" }, [
      el("header", { class: "lf-im-card-head" }, [el("strong", { text: "MyAnimeList" }), el("em", { text: uiText("ملف التصدير الرسمي", "Official library export") })]),
      el("p", { class: "lf-im-tip", text: "MAL · Settings / Export / Manga List · XML, XML.GZ" }),
      malBtn, malFile
    ]));
    /* Goodreads export file */
    var grFile = el("input", { type: "file", accept: ".csv,text/csv", style: "display:none" });
    grFile.addEventListener("change", function () {
      var f = grFile.files && grFile.files[0]; if (!f) return;
      var attempt = beginImport(); if (!attempt) return;
      imReadFileText(f, function (text) {
        try { finish(imParseGoodreads(text), "Goodreads", attempt); } catch (e) { fail(e.message || uiText("ملف غير صالح", "Invalid file"), attempt); }
      }, function (message) { fail(message, attempt); });
      grFile.value = "";
    });
    var grBtn = el("button", { type: "button", class: "lf-im-file", text: uiText("اختر ملف التصدير (.csv)", "Choose export file (.csv)") });
    grBtn.addEventListener("click", function () { grFile.click(); });
    ov.body.appendChild(el("section", { class: "lf-im-card" }, [
      el("header", { class: "lf-im-card-head" }, [el("strong", { text: "Goodreads" }), el("em", { text: uiText("للروايات والكتب", "Novels and books") })]),
      el("p", { class: "lf-im-tip", text: "Goodreads · My Books / Import and export / Export Library · CSV" }),
      grBtn, grFile
    ]));
    /* Kitsu — one-tap by username */
    var ktInput = el("input", { class: "lf-ml-search", type: "text", "aria-label": uiText("اسم المستخدم في Kitsu", "Kitsu username"), placeholder: uiText("اسم المستخدم في Kitsu", "Kitsu username"), autocapitalize: "none", autocorrect: "off" });
    var ktField = field(ktInput, uiText("اسم المستخدم في Kitsu", "Kitsu username"));
    var ktBtn = el("button", { type: "button", class: "lf-im-go", text: uiText("استيراد", "Import") });
    ktBtn.addEventListener("click", function () {
      var name = ktInput.value.trim();
      if (!validate(ktInput, uiText("اكتب اسم المستخدم في Kitsu.", "Enter your Kitsu username."))) return;
      if (ktBtn.disabled) return;
      var attempt = beginImport(); if (!attempt) return;
      ktBtn.disabled = true; ktBtn.textContent = uiText("جارٍ الجلب…", "Fetching…");
      imFetchKitsu(name).then(function (res) { finish(res, "Kitsu", attempt); }).catch(function (e) { fail(e && e.message || uiText("تعذر الجلب من Kitsu", "Could not fetch from Kitsu"), attempt); }).then(function () { ktBtn.disabled = false; ktBtn.textContent = uiText("استيراد", "Import"); });
    });
    ov.body.appendChild(el("section", { class: "lf-im-card" }, [
      el("header", { class: "lf-im-card-head" }, [el("strong", { text: "Kitsu" }), el("em", { text: uiText("مكتبة الحساب العامة", "Public account library") })]),
      el("div", { class: "lf-im-row" }, [ktField, ktBtn])
    ]));
    /* StoryGraph / any CSV — auto-detected columns */
    var anyFile = el("input", { type: "file", accept: ".csv,.tsv,text/csv", style: "display:none" });
    anyFile.addEventListener("change", function () {
      var f = anyFile.files && anyFile.files[0]; if (!f) return;
      var attempt = beginImport(); if (!attempt) return;
      imReadFileText(f, function (text) {
        try { finish(imParseGenericCsv(text, IM_DONE), uiText("ملف CSV", "CSV file"), attempt); } catch (e) { fail(e.message || uiText("ملف غير صالح", "Invalid file"), attempt); }
      }, function (message) { fail(message, attempt); });
      anyFile.value = "";
    });
    var anyBtn = el("button", { type: "button", class: "lf-im-file", text: uiText("اختر ملف CSV", "Choose CSV file") });
    anyBtn.addEventListener("click", function () { anyFile.click(); });
    ov.body.appendChild(el("section", { class: "lf-im-card" }, [
      el("header", { class: "lf-im-card-head" }, [el("strong", { text: uiText("StoryGraph ومصادر أخرى", "StoryGraph and other sources") }), el("em", { text: uiText("ملف CSV أو TSV", "CSV or TSV file") })]),
      el("p", { class: "lf-im-tip", text: "StoryGraph · LibraryThing · Anime-Planet · CSV / TSV" }),
      anyBtn, anyFile
    ]));
    /* paste a plain list of titles — works with ANY site (NovelUpdates, Webnovel…) */
    var pasteStatus = IM_DONE;
    var chipsWrap = el("div", { class: "lf-im-chips", role: "group", "aria-label": uiText("حالة القراءة للعناوين", "Reading status for titles") });
    [IM_DONE, IM_READING, IM_WISH, IM_PAUSED, IM_DROPPED].map(function (value) {
      return [value, global.LorefyI18n.readingStatusLabel(value, doc.documentElement.lang)];
    }).forEach(function (p, ix) {
      var chip = el("button", { type: "button", class: "lf-im-chip" + (ix === 0 ? " is-on" : ""), "aria-pressed": String(ix === 0), text: p[1] });
      chip.addEventListener("click", function () {
        pasteStatus = p[0];
        chipsWrap.querySelectorAll(".lf-im-chip").forEach(function (x) { x.classList.remove("is-on"); x.setAttribute("aria-pressed", "false"); });
        chip.classList.add("is-on");
        chip.setAttribute("aria-pressed", "true");
      });
      chipsWrap.appendChild(chip);
    });
    var pasteTa = el("textarea", { class: "lf-im-paste", rows: "5", "aria-label": uiText("عناوين الأعمال للاستيراد", "Titles to import"), placeholder: uiText("عنوان واحد في كل سطر", "One title per line") });
    var pasteField = field(pasteTa, uiText("عناوين الأعمال للاستيراد", "Titles to import"));
    var pasteBtn = el("button", { type: "button", class: "lf-im-go lf-im-go-wide", text: uiText("استيراد القائمة", "Import titles") });
    pasteBtn.addEventListener("click", function () {
      var lines = pasteTa.value.split(/\r?\n/).map(function (l) { return l.replace(/^\s*[\d\u0660-\u0669]+[).\-–]\s*/, "").trim(); }).filter(Boolean);
      if (!validate(pasteTa, uiText("أضف عنوانًا واحدًا على الأقل.", "Enter at least one title."))) return;
      var attempt = beginImport(); if (!attempt) return;
      var rows = [], misses = 0;
      lines.forEach(function (t) {
        var w = imFindByTitle(t);
        if (w) rows.push({ work: w, status: pasteStatus, chapters: 0, score: 0 });
        else misses++;
      });
      finish({ rows: rows, misses: misses }, uiText("قائمة العناوين", "Title list"), attempt);
    });
    ov.body.appendChild(el("section", { class: "lf-im-card" }, [
      el("header", { class: "lf-im-card-head" }, [el("strong", { text: uiText("قائمة عناوين", "Title list") }), el("em", { text: "NovelUpdates · Webnovel" })]),
      chipsWrap, pasteField, pasteBtn
    ]));
  }

  /* ── profile character taste ── */
  var K_REPLY_INBOX = "lorefy.user.replyInbox.v1";
  var K_PROFILE_TOP_CHARACTERS = "lorefy.user.profileTopCharacters.v1";
  var profileRatedCharacterCache = {};
  var profileRatedCharacterLoads = {};
  var profileRatedCharacterFailures = {};
  var profileRatedCharacterGallery = null;
  var profileRatedCharacterSection = null;
  var profileTopCharacterEditor = null;
  var homeReplyCloudItems = [];
  var homeReplyCloudLastFetch = 0;
  var homeReplyCloudFetching = false;
  var publicProfileParity = { id: "", profile: null, loading: false };

  function publicProfileSafeUrl(value) {
    value = String(value || "").trim();
    return /^(?:https?:|data:image\/)/i.test(value) ? value : "";
  }
  function publicProfileInitials(profile) {
    return String(profile && (profile.name || profile.username) || "L").trim().slice(0, 1).toUpperCase() || "L";
  }
  function publicProfileSocialUrl(kind, value) {
    value = String(value || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    value = value.replace(/^@/, "");
    var bases = {
      instagram: "https://instagram.com/",
      tiktok: "https://tiktok.com/@",
      twitter: "https://x.com/",
      youtube: "https://youtube.com/@",
      telegram: "https://t.me/"
    };
    return bases[kind] ? bases[kind] + encodeURIComponent(value) : "";
  }
  function publicProfileCharacterImage(ref) {
    var character = ref && ref.character || {};
    return publicProfileSafeUrl(character.image || character.img || character.cover || "");
  }
  function publicProfileConnectionRow(reader, overlay) {
    var row = el("button", {
      type: "button",
      class: "lf-public-profile-connection-row",
      "aria-label": "فتح حساب " + String(reader.name || reader.username || "قارئ")
    });
    var avatar = publicProfileSafeUrl(reader.avatar);
    var portrait = el("span", { class: "lf-public-profile-connection-avatar", text: avatar ? "" : publicProfileInitials(reader) });
    if (avatar) portrait.appendChild(el("img", { src: avatar, alt: "", loading: "lazy" }));
    row.appendChild(portrait);
    row.appendChild(el("span", { class: "lf-public-profile-connection-copy" }, [
      el("strong", { text: reader.name || reader.username || "قارئ Lorefy" }),
      el("small", { text: "@" + String(reader.username || "") })
    ]));
    row.addEventListener("click", function () {
      overlay.remove();
      root.dispatchEvent(new root.CustomEvent("lorefy:open-reader-profile", { detail: reader }));
    });
    return row;
  }
  async function openPublicProfileConnections(kind) {
    var profile = publicProfileParity.profile;
    var backend = root.LorefyBackend;
    if (!profile || !profile.id || !backend) return;
    var existing = doc.querySelector(".lf-public-profile-connections");
    if (existing) existing.remove();
    var overlay = el("div", { class: "lf-public-profile-connections", role: "dialog", "aria-modal": "true" });
    var sheet = el("section", { class: "lf-public-profile-connections-sheet" });
    var title = kind === "followers" ? "المتابعون" : "يتابع";
    var close = el("button", { type: "button", class: "lf-public-profile-connections-close", text: "×", "aria-label": "إغلاق" });
    var list = el("div", { class: "lf-public-profile-connections-list" }, [el("p", { class: "lf-public-profile-connections-state", text: "جارٍ التحميل..." })]);
    var restoreConnections;
    function closeConnections(){overlay.remove();if(restoreConnections)restoreConnections();}
    close.addEventListener("click", closeConnections);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) closeConnections(); });
    sheet.appendChild(el("header", { class: "lf-public-profile-connections-head" }, [close, el("strong", { text: title })]));
    sheet.appendChild(list);
    overlay.appendChild(sheet);
    (doc.getElementById("screen") || doc.body).appendChild(overlay);
    overlay.setAttribute("aria-label",title);
    restoreConnections=bindDialogKeys(overlay, closeConnections, close);
    try {
      var rows = kind === "followers"
        ? await backend.listProfileFollowers(profile.id, 200, 0)
        : await backend.listProfileFollowing(profile.id, 200, 0);
      if (!overlay.isConnected) return;
      list.textContent = "";
      if (!rows || !rows.length) list.appendChild(el("p", { class: "lf-public-profile-connections-state", text: "لا توجد حسابات بعد" }));
      else rows.forEach(function (reader) { list.appendChild(publicProfileConnectionRow(reader, overlay)); });
    } catch (error) {
      list.textContent = "";
      list.appendChild(el("p", { class: "lf-public-profile-connections-state is-error", text: "تعذر تحميل القائمة. حاول مجدداً." }));
    }
  }
  function syncPublicProfileSocials(page, profile) {
    var identity = page.querySelector(".lf-public-profile-identity");
    if (!identity) return;
    var existing = identity.querySelector(".lf-public-profile-socials");
    if (existing) existing.remove();
    var socials = profile.social_links && typeof profile.social_links === "object" ? profile.social_links : {};
    var names = { instagram: "Instagram", tiktok: "TikTok", twitter: "X", youtube: "YouTube", telegram: "Telegram" };
    var links = Object.keys(names).map(function (kind) {
      var href = publicProfileSocialUrl(kind, socials[kind]);
      return href ? el("a", { href: href, target: "_blank", rel: "noopener noreferrer", text: names[kind], "aria-label": names[kind] }) : null;
    }).filter(Boolean);
    if (!links.length) return;
    var row = el("div", { class: "lf-public-profile-socials", "aria-label": "روابط التواصل" }, links);
    var stats = page.querySelector(".lf-public-profile-stats");
    identity.insertBefore(row, stats || null);
  }
  function publicProfileFavoriteType(profile) {
    var counts = {};
    var ids = Array.isArray(profile.favorite_work_ids) ? profile.favorite_work_ids : [];
    ids.forEach(function (workId) {
      var work = profileWorkFor(workId);
      var type = work && work.type;
      if (type) counts[type] = (counts[type] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || "—";
  }
  function syncPublicProfileReadingSummary(page, profile) {
    var identity = page.querySelector(".lf-public-profile-identity");
    if (!identity) return;
    var oldSummary = page.querySelector(".lf-public-profile-reading-summary");
    var oldLibrary = page.querySelector(".lf-public-profile-library");
    if (oldSummary) oldSummary.remove();
    if (oldLibrary) oldLibrary.remove();

    var summary = el("section", { class: "lf-public-profile-reading-summary", "aria-label": "ملخص القراءة" });
    var summaryGrid = el("div", { class: "lf-public-profile-reading-summary-grid" });
    [
      [publicProfileFavoriteType(profile), "النوع المفضل"],
      [Number(profile.read_hours) || 0, "ساعات تقديرية"],
      [Number(profile.total_chapters) || 0, "فصل"],
      [Number(profile.completed_count) || 0, "مكتملة"]
    ].forEach(function (entry) {
      summaryGrid.appendChild(el("div", { class: "lf-public-profile-reading-stat" }, [
        el("strong", { text: String(entry[0]) }),
        el("span", { text: entry[1] })
      ]));
    });
    summary.appendChild(summaryGrid);
    var favorites = identity.querySelector(".lf-public-profile-favorites");
    identity.insertBefore(summary, favorites ? favorites.previousElementSibling : null);

    var libraryEntries = profile.library_entries && typeof profile.library_entries === "object"
      ? profile.library_entries : {};
    var workIds = Object.keys(libraryEntries).filter(function (workId) { return !!profileWorkFor(workId); }).slice(0, 6);
    if (!workIds.length) return;
    var rail = el("div", { class: "lf-public-profile-library-rail" });
    workIds.forEach(function (workId) {
      var work = profileWorkFor(workId);
      var card = el("button", {
        type: "button",
        class: "lf-public-profile-library-card",
        "aria-label": "فتح " + profileWorkTitle(workId)
      });
      var cover = mlCoverOf(work);
      var media = el("span", { class: "lf-public-profile-library-cover" });
      if (cover) media.appendChild(el("img", { src: cover, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }));
      card.appendChild(media);
      card.appendChild(el("strong", { text: profileWorkTitle(workId) }));
      card.appendChild(el("small", { text: String(libraryEntries[workId] || "") }));
      card.addEventListener("click", function () {
        var url = new URL(root.location.href);
        url.searchParams.set("route", "detail");
        url.searchParams.set("novel", workId);
        root.location.href = url.toString();
      });
      rail.appendChild(card);
    });
    var library = el("section", { class: "lf-public-profile-library" }, [
      el("h3", { text: "المكتبة" }), rail
    ]);
    var reviews = page.querySelector(".lf-public-profile-reviews");
    page.insertBefore(library, reviews || null);
  }
  function syncPublicProfileTopCharacters(page, profile) {
    var old = page.querySelector(".lf-public-profile-top-characters");
    if (old) old.remove();
    var refs = Array.isArray(profile.favorite_character_ids) ? profile.favorite_character_ids.filter(Boolean).slice(0, 4) : [];
    if (!refs.length) return;
    var grid = el("div", { class: "lf-public-profile-top-characters-grid" });
    refs.forEach(function (ref) {
      var character = ref.character || {};
      var name = character.name || character.latin || "شخصية";
      var tile = el("article", { class: "lf-public-profile-top-character", "aria-label": name });
      var image = publicProfileCharacterImage(ref);
      if (image) tile.appendChild(el("img", { src: image, alt: name, loading: "lazy", referrerpolicy: "no-referrer" }));
      else tile.appendChild(el("span", { text: String(name).slice(0, 1) }));
      tile.appendChild(el("strong", { text: name }));
      grid.appendChild(tile);
    });
    var section = el("section", { class: "lf-public-profile-top-characters" }, [
      el("h3", { text: "المفضلة" }), grid
    ]);
    var reviews = page.querySelector(".lf-public-profile-reviews");
    page.insertBefore(section, reviews || null);
  }
  function syncPublicProfileConnectionButtons(page) {
    var stats = page.querySelector(".lf-public-profile-stats");
    if (!stats || stats.children.length < 4) return;
    [[2, "followers"], [3, "following"]].forEach(function (entry) {
      var node = stats.children[entry[0]];
      if (!node || node.dataset.lfPublicConnections) return;
      node.dataset.lfPublicConnections = entry[1];
      node.classList.add("lf-public-profile-connection-trigger");
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.addEventListener("click", function () { openPublicProfileConnections(entry[1]); });
      node.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPublicProfileConnections(entry[1]);
        }
      });
    });
  }
  function syncPublicProfileParity() {
    var page = doc.querySelector(".lf-public-profile-page");
    var profile = publicProfileParity.profile;
    if (!page || page.dataset.profileRenderer === "full" || !profile || !profile.id) return false;
    page.setAttribute("data-lf-public-profile-id", String(profile.id));
    syncPublicProfileSocials(page, profile);
    syncPublicProfileReadingSummary(page, profile);
    syncPublicProfileTopCharacters(page, profile);
    syncPublicProfileConnectionButtons(page);
    return true;
  }
  async function loadPublicProfileParity(detail) {
    detail = detail || {};
    var id = String(detail.id || "");
    if (!id) return;
    publicProfileParity.id = id;
    publicProfileParity.profile = detail;
    syncPublicProfileParity();
    var backend = root.LorefyBackend;
    if (!backend || typeof backend.getPublicProfile !== "function" || publicProfileParity.loading) return;
    publicProfileParity.loading = true;
    try {
      var profile = await backend.getPublicProfile(id);
      if (profile && publicProfileParity.id === id) publicProfileParity.profile = profile;
    } catch (error) {
      console.warn("[Lorefy] public profile parity:", error);
    } finally {
      publicProfileParity.loading = false;
      syncPublicProfileParity();
    }
  }
  function installPublicProfileParity() {
    if (root.__lorefyPublicProfileParityInstalled) return;
    root.__lorefyPublicProfileParityInstalled = true;
    root.addEventListener("lorefy:open-reader-profile", function (event) {
      loadPublicProfileParity(event && event.detail || {});
      [0, 80, 240, 600].forEach(function (delay) { root.setTimeout(syncPublicProfileParity, delay); });
    });
  }

  function profileWorkFor(workId) { return mlWorkBy(workId) || findWork(workId) || null; }
  function profileWorkTitle(workId) {
    var work = profileWorkFor(workId);
    return mlTitleOf(work) || "عمل في مكتبتك";
  }
  function profileRatedScoreRows() {
    var all = read(K_SCORES, {}) || {}, rows = [];
    Object.keys(all).forEach(function (workId) {
      var scores = all[workId] || {};
      Object.keys(scores).forEach(function (characterKey) {
        var score = Math.max(0, Math.min(5, Number(scores[characterKey]) || 0));
        if (score) rows.push({ workId: String(workId), characterKey: String(characterKey), score: score });
      });
    });
    return rows;
  }
  function profileRatedCharacterEntries() {
    var rows = profileRatedScoreRows(), entries = [], missing = {};
    rows.forEach(function (row) {
      var cast = profileRatedCharacterCache[row.workId];
      if (!cast) { missing[row.workId] = true; return; }
      for (var i = 0; i < cast.length; i++) {
        if (String(castKey(cast[i])) !== row.characterKey) continue;
        entries.push({
          workId: row.workId,
          work: profileWorkFor(row.workId),
          workTitle: profileWorkTitle(row.workId),
          character: cast[i],
          score: row.score
        });
        break;
      }
    });
    entries.sort(function (a, b) { return b.score - a.score || String(a.character.name || "").localeCompare(String(b.character.name || ""), "ar"); });
    return { entries: entries, missing: Object.keys(missing), total: rows.length,
      workCount: new Set(rows.map(function (row) { return row.workId; })).size,
      average: rows.length ? rows.reduce(function (sum, row) { return sum + row.score; }, 0) / rows.length : 0,
      unresolved: rows.length - entries.length };
  }
  function profileCharacterEntries() {
    var allScores = read(K_SCORES, {}) || {}, entries = [], seen = {};
    Object.keys(profileRatedCharacterCache).forEach(function (workId) {
      var workScores = allScores[workId] || {};
      (profileRatedCharacterCache[workId] || []).forEach(function (character) {
        var characterKey = String(castKey(character));
        var key = String(workId) + "::" + characterKey;
        if (!characterKey || seen[key]) return;
        seen[key] = true;
        entries.push({
          workId: String(workId),
          work: profileWorkFor(workId),
          workTitle: profileWorkTitle(workId),
          character: character,
          score: Math.max(0, Math.min(5, Number(workScores[characterKey]) || 0))
        });
      });
    });
    entries.sort(function (a, b) {
      return b.score - a.score
        || String(a.workTitle || "").localeCompare(String(b.workTitle || ""), "ar")
        || String(a.character.name || a.character.latin || "").localeCompare(String(b.character.name || b.character.latin || ""), "ar");
    });
    return { entries: entries, missing: profileRatedCharacterEntries().missing };
  }
  function profileTopCharacterSearchText(value) {
    if (global.LorefyCatalogData) return global.LorefyCatalogData.normalizeQuery(value);
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function profileTopCharacterSearchWorks(query) {
    query = profileTopCharacterSearchText(query);
    if (query.length < 2) return [];
    var rows = [], works = mlWorks(), shared=typeof global !== "undefined" && global.LorefyCatalogData;
    for (var i = 0; i < works.length; i++) {
      var work = works[i], indexed=shared&&shared.getCatalogQueryIndex&&shared.getCatalogQueryIndex(work);
      var haystack=indexed ? indexed.fields.slice(0,4).filter(Boolean).join(" ") : profileTopCharacterSearchText([
        work&&work.title,work&&work.ar,work&&work.auth,work&&work.author
      ].filter(Boolean).join(" "));
      if(haystack.indexOf(query)<0&&!(shared&&shared.matchesCatalogQuery(work,query)))continue;
      // Normalize titles only for actual hits, reusing worker-prepared fields.
      var titles=indexed ? indexed.fields.slice(0,2).filter(Boolean) : [work&&work.title,work&&work.ar].filter(Boolean).map(profileTopCharacterSearchText);
      var score=titles.some(function(title){return title===query;})?4
        :titles.some(function(title){return title.indexOf(query)===0;})?3
        :titles.some(function(title){return title.indexOf(query)>=0;})?2:1;
      rows.push({work:work,score:score});
    }
    return rows.sort(function(a,b){return b.score-a.score;}).slice(0,12).map(function(row){return row.work;});
  }
  function profileRatedCharacterPortrait(item, retryHost) {
    var character = item.character || {}, portrait = el("span", { class: "lf-profile-rated-character-portrait" });
    var image = characterImageUrl(character);
    if (retryHost && global.LorefyPortraitMedia) {
      portrait._portraitMedia = global.LorefyPortraitMedia.mount(portrait, {
        src: image, alt: character.name || character.latin || "", initials: initials(character),
        language: doc.documentElement.lang, loading: "lazy", retry: true,
        focusTarget: function () { return portrait.parentElement && portrait.parentElement.querySelector('.lf-profile-character-open'); }
      });
      scheduleCharacterActionIcons();
      return portrait;
    }
    if (image) {
      var img = el("img", { src: image, alt: character.name || character.latin || "", loading: "lazy", referrerpolicy: "no-referrer" });
      img.addEventListener("error", function () { img.remove(); portrait.textContent = initials(character); });
      portrait.appendChild(img);
    } else portrait.textContent = initials(character);
    return portrait;
  }
  function profileRatedCharacterStars(item) {
    var score = Math.max(0, Math.min(5, Number(item.score) || 0));
    var stars = el("span", { class: "lf-profile-rated-character-stars", role: "img", "aria-label": item.score + uiText(" من 5", " out of 5") });
    for (var i = 0; i < 5; i++) {
      var fill = Math.max(0, Math.min(1, score - i));
      var star = el("span", { class: "lf-profile-rated-character-star", "aria-hidden": "true" }, el("i", { "data-lucide": "feather" }));
      if (fill) star.appendChild(el("span", { class: "lf-profile-rated-character-star-fill", style: "width:" + fill * 100 + "%" }, el("i", { "data-lucide": "feather" })));
      stars.appendChild(star);
    }
    scheduleCharacterActionIcons();
    return stars;
  }
  function profileRatedCharacterTile(item) {
    var character = item.character || {};
    var name = character.name || character.latin || uiText("شخصية", "Character");
    var tile = el("div", { class: "lf-profile-rated-character" }, [
      profileRatedCharacterPortrait(item, true),
      el("span", { class: "lf-profile-rated-character-copy" }, [
        el("strong", { text: character.name || character.latin || "شخصية" }),
        el("small", { text: item.workTitle }),
        profileRatedCharacterStars(item)
      ])
    ]);
    var open = el("button", { type: "button", class: "lf-profile-character-open", "aria-label": name + " · " + item.workTitle + " · " + Number(item.score).toFixed(2) + uiText(" من 5", " out of 5") });
    open.addEventListener("click", function () {
      openCharacterPage({ workId: item.workId, work: item.work, cast: profileRatedCharacterCache[item.workId] || [] });
    });
    tile.appendChild(open);
    return tile;
  }
  function profileRatedCharacterShelfCard(item) {
    var character = item.character || {};
    var name = character.name || character.latin || uiText("شخصية", "Character");
    var score = Number(item.score).toFixed(2);
    var card = el("div", { class: "lf-rated-character-shelf-card" }, [
      profileRatedCharacterPortrait(item, true),
      el("span", { class: "lf-character-rating-badge", "aria-hidden": "true" }, [
        el("i", { "data-lucide": "feather" }),
        el("strong", { class: "lf-character-rating-number", text: score, "data-no-translate": "" })
      ]),
      el("span", { class: "lf-rated-character-shelf-copy" }, [
        el("strong", { text: name }),
        el("small", { text: item.workTitle })
      ])
    ]);
    var open = el("button", { type: "button", class: "lf-profile-character-open", "aria-label": name + " · " + item.workTitle + " · " + score + uiText(" من 5", " out of 5") });
    open.addEventListener("click", function () {
      openCharacterPage({ workId: item.workId, work: item.work, cast: profileRatedCharacterCache[item.workId] || [] });
    });
    card.appendChild(open);
    return card;
  }
  function ratedCharacterGroups(entries, query, mode) {
    var needle = String(query || "").trim().toLocaleLowerCase();
    var groups = [], byKey = Object.create(null);
    entries.slice().sort(function (a, b) { return b.score - a.score; }).forEach(function (item) {
      var character = item.character || {};
      var haystack = [character.name, character.latin, item.workTitle].join(" ").toLocaleLowerCase();
      if (needle && haystack.indexOf(needle) === -1) return;
      var label = mode === "work" ? item.workTitle : Number(item.score).toFixed(2);
      var key = mode === "work" ? item.workId : label;
      if (!byKey[key]) { byKey[key] = { key: key, label: label, items: [] }; groups.push(byKey[key]); }
      byKey[key].items.push(item);
    });
    return groups;
  }
  function profileRatedCharacterOwner() {
    try {
      return String(global.localStorage.getItem("lorefy.activeUser.v1")
        || read("lorefy.session.v1", {}).userId || read("lorefy.identity.v1", {}).id
        || global.LorefyBackend && global.LorefyBackend.user && global.LorefyBackend.user.id || "");
    } catch (e) { return ""; }
  }
  function syncProfileRatedCharacterGallery() {
    var state = profileRatedCharacterGallery;
    if (!state) return;
    if (!state.page.isConnected) { releaseCharacterPortraits(state.page); profileRatedCharacterGallery = null; return; }
    if (state.owner !== profileRatedCharacterOwner()) {
      state.close(); profileRatedCharacterGallery = null; return;
    }
    if (state.page.inert) return;
    state.refresh();
  }
  function syncProfileTopCharacterEditor(refresh) {
    if (!profileTopCharacterEditor) return;
    if (!profileTopCharacterEditor.active()) profileTopCharacterEditor = null;
    else if (refresh) profileTopCharacterEditor.refresh();
  }
  function profileRatedCharacterStateChanged(event) {
    var key = event && (event.detail ? event.detail.key : event.key);
    if (!key || [K_SCORES, K_CHARCUSTOM, K_CHARIMG, "lorefy.activeUser.v1", "lorefy.session.v1", "lorefy.identity.v1"].indexOf(key) !== -1) {
      syncProfileRatedCharacterGallery();
      syncProfileTopCharacterEditor();
    }
  }
  function openProfileRatedCharacters() {
    if (profileRatedCharacterGallery) profileRatedCharacterGallery.close();
    var owner = profileRatedCharacterOwner(), signature = "";
    var ov = ovOpen("lf-profile-rated-characters-page", uiText("شخصيات قيّمتها", "Rated characters"));
    var overview = el("section", { class: "lf-rated-characters-overview" });
    ov.body.appendChild(overview);
    var mode = "rating", limit = 60;
    var search = el("input", { type: "search", placeholder: uiText("ابحث عن شخصية أو عمل…", "Search characters or works…"), "aria-label": uiText("البحث في شخصيات قيّمتها", "Search rated characters") });
    var modes = el("div", { class: "lf-character-atlas-modes", role: "tablist", "aria-label": uiText("ترتيب الشخصيات", "Character grouping") });
    var gallery = el("div", { class: "lf-character-atlas-gallery", role: "tabpanel", id: "lf-character-atlas-gallery" });
    var status = el("div", { class: "lf-profile-rated-characters-empty", role: "status", "aria-live": "polite" });
    var buttons = [];
    function render(force) {
      if (!ov.page.isConnected || ov.page.inert) return;
      if (owner !== profileRatedCharacterOwner()) { ov.close(); profileRatedCharacterGallery = null; return; }
      var data = profileRatedCharacterEntries();
      var nextSignature = JSON.stringify([doc.documentElement.lang, data.total, data.workCount, data.average,
        data.entries.map(function (item) { return [item.workId, castKey(item.character), item.score, item.character.name, characterImageUrl(item.character)]; }),
        data.missing.map(function (id) { return [id, !!profileRatedCharacterFailures[id], !!profileRatedCharacterLoads[id]]; })]);
      if (!force && signature === nextSignature) return;
      signature = nextSignature;
      overview.textContent = "";
      [[data.total, uiText("شخصية", "Characters")], [data.workCount, uiText("أعمال", "Works")], [data.average.toFixed(2), uiText("متوسطك", "Your average")]].forEach(function (stat) {
        overview.appendChild(el("div", { class: "lf-character-atlas-stat" }, [el("strong", { text: String(stat[0]), "data-no-translate": "" }), el("small", { text: stat[1] })]));
      });
      status.textContent = "";
      var failed = data.missing.filter(function (id) { return !!profileRatedCharacterFailures[id]; });
      if (!data.total) status.textContent = uiText("لم تقيّم أي شخصيات بعد", "No rated characters yet");
      else if (failed.length) {
        status.appendChild(el("p", { text: uiText("تعذّر تحميل بعض بيانات الشخصيات", "Some character details could not be loaded") }));
        var retry = el("button", { type: "button", class: "lf-character-atlas-more", text: uiText("إعادة المحاولة", "Retry") });
        retry.addEventListener("click", function () {
          if (owner !== profileRatedCharacterOwner()) { syncProfileRatedCharacterGallery(); return; }
          failed.forEach(function (id) { delete profileRatedCharacterFailures[id]; hydrateProfileRatedCharacters(id); });
          render(true);
        });
        status.appendChild(retry);
      } else if (data.missing.length) status.textContent = uiText("نجمع تقييمات الشخصيات", "Loading character ratings");
      else if (data.unresolved) status.textContent = uiText("بعض تفاصيل الشخصيات غير متاحة من المصدر", "Some character details are unavailable from the source");
      status.hidden = !status.textContent;
      releaseCharacterPortraits(gallery);
      gallery.textContent = "";
      var groups = ratedCharacterGroups(data.entries, search.value, mode), shown = 0, total = 0;
      if (mode === "rating" && groups.length) {
        groups = [{ label: uiText("تقييماتك", "Your ratings"), items: groups.reduce(function (all, group) { return all.concat(group.items); }, []) }];
      }
      groups.forEach(function (group) {
        total += group.items.length;
        var visible = group.items.slice(0, Math.max(0, limit - shown));
        if (!visible.length) return;
        shown += visible.length;
        var rail = el("div", { class: "lf-rated-character-shelf-rail" });
        visible.forEach(function (item) { rail.appendChild(profileRatedCharacterShelfCard(item)); });
        gallery.appendChild(el("section", { class: "lf-rated-character-shelf" }, [
          el("header", { class: "lf-rated-character-shelf-head" }, [
            el("div", { class: "lf-character-atlas-group-title" }, [
              el("i", { "data-lucide": mode === "rating" ? "feather" : "book-open", "aria-hidden": "true" }),
              el("strong", { text: group.label })
            ]),
            el("span", { text: String(group.items.length), "aria-label": group.items.length + uiText(" شخصية", " characters") })
          ]), rail
        ]));
      });
      if (!total && data.entries.length) gallery.appendChild(el("p", { class: "lf-character-atlas-empty", text: uiText("لا توجد شخصيات تطابق بحثك", "No matching characters") }));
      if (total > shown) {
        var more = el("button", { type: "button", class: "lf-character-atlas-more", text: uiText("عرض المزيد", "Show more") });
        more.addEventListener("click", function () { limit += 60; render(true); }); gallery.appendChild(more);
      }
      buttons.forEach(function (button) {
        button.setAttribute("aria-selected", String(button.dataset.mode === mode));
        button.setAttribute("tabindex", button.dataset.mode === mode ? "0" : "-1");
      });
      scheduleCharacterActionIcons();
      data.missing.forEach(function (id) { hydrateProfileRatedCharacters(id); });
    }
    [["rating", uiText("حسب التقييم", "By rating"), "feather"], ["work", uiText("حسب العمل", "By work"), "book-open"]].forEach(function (option) {
      var button = el("button", { type: "button", role: "tab", "data-mode": option[0], "aria-controls": "lf-character-atlas-gallery" }, [el("i", { "data-lucide": option[2], "aria-hidden": "true" }), el("span", { text: option[1] })]);
      button.addEventListener("click", function () { if(mode===option[0])return;mode = option[0]; limit = 60; render(true); }); buttons.push(button); modes.appendChild(button);
      button.addEventListener("keydown", function (event) {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) === -1) return;
        event.preventDefault();
        var rtl = doc.documentElement.dir === "rtl";
        var delta = event.key === "ArrowRight" ? (rtl ? -1 : 1) : (rtl ? 1 : -1);
        var index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (buttons.indexOf(button) + delta + buttons.length) % buttons.length;
        buttons[index].click(); buttons[index].focus();
      });
    });
    search.addEventListener("input", function () { limit = 60; render(true); });
    ov.body.appendChild(el("div", { class: "lf-character-atlas-toolbar" }, [el("label", { class: "lf-character-atlas-search" }, [el("i", { "data-lucide": "search", "aria-hidden": "true" }), search]), modes]));
    ov.body.appendChild(status); ov.body.appendChild(gallery);
    profileRatedCharacterGallery = { owner: owner, page: ov.page, close: ov.close, refresh: render };
    render(true);
  }
  function paintProfileRatedCharacters(section) {
    if (!section) return;
    var data = profileRatedCharacterEntries();
    var count = section.querySelector("[data-lf-rated-characters-count]");
    var rail = section.querySelector(".lf-profile-rated-characters-rail");
    var countText = data.total + uiText(" شخصية", " characters");
    if (count && count.textContent !== countText) count.textContent = countText;
    if (!rail) return;
    var signature = JSON.stringify([profileRatedCharacterOwner(), doc.documentElement.lang, data.entries.slice(0, 8).map(function (item) {
      var character = item.character || {};
      return [item.workId, character.id || character.name || character.latin || "", item.score, item.workTitle, characterImageUrl(character) || ""];
    })]);
    if (rail.dataset.ratedCharactersSignature !== signature) {
      rail.dataset.ratedCharactersSignature = signature;
      releaseCharacterPortraits(rail);
      rail.textContent = "";
      if (data.entries.length) data.entries.slice(0, 8).forEach(function (item) { rail.appendChild(profileRatedCharacterTile(item)); });
      else rail.appendChild(el("p", { class: "lf-profile-rated-characters-loading", text: "نجمع الشخصيات التي قيّمتها..." }));
    }
    data.missing.forEach(function (workId) { hydrateProfileRatedCharacters(workId); });
  }
  function profileTopCharacterSlotImage(item) {
    var character = item && item.character || {};
    var image = characterImageUrl(character);
    if (!image) return null;
    return el("img", {
      class: "lf-profile-top-character-image",
      src: image,
      alt: character.name || character.latin || "شخصية",
      loading: "lazy",
      referrerpolicy: "no-referrer"
    });
  }
  function profileTopCharacterSlotPlus() {
    var svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    var horizontal = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    var vertical = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    horizontal.setAttribute("d", "M5 12h14");
    vertical.setAttribute("d", "M12 5v14");
    svg.appendChild(horizontal);
    svg.appendChild(vertical);
    return svg;
  }
  function openProfileTopCharactersEditorFromControl(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }
    openProfileTopCharactersEditor();
  }
  function wireProfileTopCharacterEditorDelegation() {
    if (doc.__lorefyTopCharacterEditorDelegation) return;
    doc.__lorefyTopCharacterEditorDelegation = true;
    doc.addEventListener("click", function (event) {
      var target = event && event.target;
      var control = target && target.closest && target.closest('[data-lf-top-character-editor]');
      if (!control) return;
      openProfileTopCharactersEditorFromControl(event);
    }, true);
  }
  function profileTopCharacterTile(item, index) {
    var character = item && item.character || null;
    var name = character && (character.name || character.latin) || "شخصية";
    var tile = el("button", {
      type: "button",
      class: "lf-profile-top-character" + (character ? " is-filled" : " is-empty"),
      "data-lf-top-character-editor": "slot",
      "aria-label": character ? uiText("تعديل ", "Edit ") + name + uiText(" ضمن المفضلة", " in favorites") : uiText("اختيار شخصية للخانة ", "Choose character for slot ") + (index + 1)
    });
    tile.addEventListener("click", openProfileTopCharactersEditorFromControl, true);
    if (!character) {
      tile.appendChild(el("span", { class: "lf-profile-top-character-empty", "aria-hidden": "true" }, [profileTopCharacterSlotPlus()]));
    } else {
      var image = profileTopCharacterSlotImage(item);
      if (image) {
        image.addEventListener("error", function () {
          image.remove();
          tile.classList.add("has-fallback");
          tile.appendChild(el("span", { class: "lf-profile-top-character-fallback", text: initials(character), "aria-hidden": "true" }));
        });
        tile.appendChild(image);
      } else {
        tile.classList.add("has-fallback");
        tile.appendChild(el("span", { class: "lf-profile-top-character-fallback", text: initials(character), "aria-hidden": "true" }));
      }
    }
    return tile;
  }
  function profileTopCharacterSelection() {
    var saved = read(K_PROFILE_TOP_CHARACTERS, []);
    if (!Array.isArray(saved)) return [null, null, null, null];
    var seen = {}, changed = false;
    var selection = saved.slice(0, 4).map(function (ref) {
      if (!ref || typeof ref !== "object") return null;
      var workId = String(ref.workId || ""), characterKey = String(ref.characterKey || "");
      var key = workId + "::" + characterKey;
      if (!workId || !characterKey || seen[key]) return null;
      seen[key] = true;
      var workTitle = profileWorkTitle(workId) || (isSupportedDisplayTitle(ref.workTitle) ? String(ref.workTitle).trim() : "عمل في مكتبتك");
      if (workTitle !== String(ref.workTitle || "")) changed = true;
      return {
        workId: workId,
        characterKey: characterKey,
        character: ref.character || null,
        workTitle: workTitle,
        score: Math.max(0, Math.min(5, Number(ref.score) || 0))
      };
    }).concat([null, null, null, null]).slice(0, 4);
    if (changed) setProfileTopCharacterSelection(selection);
    return selection;
  }
  function setProfileTopCharacterSelection(selection) {
    return write(K_PROFILE_TOP_CHARACTERS, (selection || []).slice(0, 4).map(function (ref) {
      if (!ref) return null;
      return {
        workId: String(ref.workId),
        characterKey: String(ref.characterKey),
        character: ref.character || null,
        workTitle: profileWorkTitle(ref.workId) || (isSupportedDisplayTitle(ref.workTitle) ? String(ref.workTitle).trim() : "عمل في مكتبتك"),
        score: Math.max(0, Math.min(5, Number(ref.score) || 0))
      };
    }));
  }
  function profileTopCharacterRef(item) {
    if (!item) return null;
    var character = item.character || {};
    return {
      workId: String(item.workId),
      characterKey: String(castKey(character)),
      character: {
        id: character.id || "",
        key: character.key || "",
        name: character.name || "",
        latin: character.latin || "",
        role: character.role || "",
        image: character.image || character.img || character.cover || ""
      },
      workTitle: profileWorkTitle(item.workId) || (isSupportedDisplayTitle(item.workTitle) ? String(item.workTitle).trim() : "عمل في مكتبتي"),
      score: Math.max(0, Math.min(5, Number(item.score) || 0))
    };
  }
  function profileTopCharacterRefKey(ref) { return String(ref && ref.workId || "") + "::" + String(ref && ref.characterKey || ""); }
  function profileTopCharacterFromRef(ref, entries) {
    var key = profileTopCharacterRefKey(ref);
    for (var i = 0; i < entries.length; i++) if (profileTopCharacterRefKey(profileTopCharacterRef(entries[i])) === key) return entries[i];
    if (ref && ref.character && (ref.character.name || ref.character.latin)) {
      return {
        workId: String(ref.workId),
        work: profileWorkFor(ref.workId),
        workTitle: profileWorkTitle(ref.workId) || (isSupportedDisplayTitle(ref.workTitle) ? String(ref.workTitle).trim() : "عمل في مكتبتي"),
        character: ref.character,
        score: Math.max(0, Math.min(5, Number(ref.score) || 0))
      };
    }
    return null;
  }
  function openProfileTopCharactersEditor() {
    syncProfileTopCharacterEditor();
    var existing = doc.querySelector(".lf-profile-top-characters-editor");
    if (existing && existing.classList.contains("is-leaving")) { existing.remove(); existing = null; }
    if (existing) {
      var existingSearch = existing.querySelector(".lf-top-characters-editor-search");
      if (existingSearch) existingSearch.focus();
      return;
    }
    var ov = ovOpen("lf-profile-top-characters-editor", uiText("المفضلة", "Favorites"));
    var draft = profileTopCharacterSelection().slice(0, 4);
    while (draft.length < 4) draft.push(null);
    var activeSlot = 0, nameSearchTimer=null, nameSearchEpoch=0, nameSearchBusy=false, nameSearchFailed=false;
    var activeWorkId = "", loadingWorkId = "", pickerMode="characters";
    var editorOwner = profileRatedCharacterOwner(), editorInvalid = false;
    function editorActive() {
      if (!editorInvalid && ov.page.isConnected && !ov.page.inert && editorOwner === profileRatedCharacterOwner()) return true;
      if (!editorInvalid) {
        editorInvalid = true;
        ++nameSearchEpoch;
        clearTimeout(nameSearchTimer);
        if (search) clearTimeout(search.__renderTimer);
        if (ov.page.isConnected && !ov.page.inert) ov.close();
      }
      return false;
    }
    profileTopCharacterEditor = { active: editorActive, refresh: render };
    var slots = el("div", { class: "lf-top-characters-editor-slots" });
    var search = el("input", {
      type: "search",
      class: "lf-top-characters-editor-search",
      dir: "auto",
      style: "text-align: start",
      placeholder: uiText("ابحث عن عمل أو شخصية", "Search works or characters"),
      autocomplete: "off",
      "aria-label": uiText("ابحث عن عمل أو شخصية", "Search works or characters")
    });
    var clearSearch = el("button", { type: "button", class: "lf-top-characters-editor-search-clear", text: "×", "aria-label": uiText("مسح البحث", "Clear search") });
    var searchBox = el("div", { class: "lf-top-characters-editor-search-box" }, [
      el("span", { class: "lf-top-characters-editor-search-icon", text: "⌕", "aria-hidden": "true" }),
      search,
      clearSearch
    ]);
    var modes=el("div",{class:"lf-character-picker-modes",role:"tablist","aria-label":uiText("طريقة البحث","Search method")});
    [ ["characters",uiText("الشخصيات","Characters")],["works",uiText("حسب العمل","By work")] ].forEach(function(entry){
      var modeButton=el("button",{type:"button",role:"tab",tabindex:entry[0]===pickerMode?"0":"-1","aria-selected":entry[0]===pickerMode?"true":"false",text:entry[1]});
      modeButton.addEventListener("click",function(){if(pickerMode===entry[0])return;pickerMode=entry[0];++nameSearchEpoch;clearTimeout(nameSearchTimer);clearTimeout(search.__renderTimer);nameSearchBusy=false;nameSearchFailed=false;activeWorkId="";loadingWorkId="";search.value="";Array.from(modes.children).forEach(function(b){b.setAttribute("aria-selected",String(b===modeButton));b.setAttribute("tabindex",b===modeButton?"0":"-1");});search.placeholder=pickerMode==="works"?uiText("ابحث عن عمل","Search works"):uiText("ابحث عن شخصية","Search characters");search.setAttribute("aria-label",search.placeholder);render();search.focus();});modes.appendChild(modeButton);
    });
    modes.addEventListener("keydown",function(event){
      var buttons=Array.from(modes.children),index=buttons.indexOf(event.target),next=index,rtl=uiText("rtl","ltr")==="rtl";
      if(index<0)return;
      if(event.key==="Home")next=0;
      else if(event.key==="End")next=buttons.length-1;
      else if(event.key===(rtl?"ArrowLeft":"ArrowRight"))next=(index+1)%buttons.length;
      else if(event.key===(rtl?"ArrowRight":"ArrowLeft"))next=(index+buttons.length-1)%buttons.length;
      else return;
      event.preventDefault();buttons[next].click();buttons[next].focus();
    });
    search.placeholder=uiText("ابحث عن شخصية","Search characters");search.setAttribute("aria-label",search.placeholder);
    var workResults = el("div", { class: "lf-top-characters-editor-work-results", hidden: "" });
    var currentWork = el("div", { class: "lf-top-characters-editor-current-work", hidden: "" });
    var candidates = el("div", { class: "lf-top-characters-editor-list" });
    var save = el("button", { type: "button", class: "lf-top-characters-editor-save", text: uiText("حفظ المفضلة", "Save favorites") });
    var headingTitle = el("strong", { text: uiText("الشخصيات التي قيّمتها", "Characters you rated") });
    var headingMeta = el("small", { text: uiText("أو ابحث عن أي عمل لإظهار شخصياته", "Or search for a work to see its characters") });
    function dataNow() { return profileCharacterEntries(); }
    function selectionIndex(ref) {
      var wanted = profileTopCharacterRefKey(ref);
      for (var i = 0; i < draft.length; i++) {
        if (draft[i] && profileTopCharacterRefKey(draft[i]) === wanted) return i;
      }
      return -1;
    }
    function chooseCandidate(ref) {
      if (!editorActive()) return;
      var existingIndex = selectionIndex(ref);
      if (existingIndex === activeSlot) return;
      var displaced = draft[activeSlot] || null;
      draft[activeSlot] = ref;
      if (existingIndex >= 0) draft[existingIndex] = displaced;
      setProfileTopCharacterSelection(draft);
      syncProfileTopCharacters();
      render();
    }
    function candidateMatches(item, query) {
      if (!query) return true;
      if(global.LorefyCharacterSystem && global.LorefyCharacterSystem.characterMatches(item.character||{},query))return true;
      return profileTopCharacterSearchText([
        item.character && item.character.name,
        item.character && item.character.latin,
        item.workTitle
      ].filter(Boolean).join(" ")).indexOf(query) >= 0;
    }
    function candidateRows(data, query) {
      if(pickerMode==="works"&&!activeWorkId)return [];
      var selected = {};
      draft.forEach(function (ref) { if (ref) selected[profileTopCharacterRefKey(ref)] = true; });
      var rows = data.entries.filter(function (item) {
        if (activeWorkId) return String(item.workId) === String(activeWorkId) && candidateMatches(item, query);
        if (query) return candidateMatches(item, query);
        return !!item.score || !!selected[profileTopCharacterRefKey(profileTopCharacterRef(item))];
      });
      return activeWorkId ? rows : rows.slice(0, 120);
    }
    function renderWorkResults(query) {
      if(pickerMode!=="works"){workResults.hidden=true;workResults.replaceChildren();return;}
      var works = profileTopCharacterSearchWorks(query);
      workResults.textContent = "";
      if (!query || query.length < 2) {
        workResults.hidden = true;
        return;
      }
      workResults.hidden = false;
      if (!works.length) { workResults.hidden=true; return; }
      works.forEach(function (work) {
        var workId = String(work.id);
        var cover = el("span", { class: "lf-top-characters-editor-work-cover" });
        var coverUrl = mlCoverOf(work);
        if (coverUrl) {
          var img = el("img", { src: coverUrl, alt: mlTitleOf(work), loading: "lazy", referrerpolicy: "no-referrer" });
          img.addEventListener("error", function () { img.remove(); cover.textContent = uiText("ل", "L"); });
          cover.appendChild(img);
        } else cover.textContent = uiText("ل", "L");
        var button = el("button", { type: "button", class: "lf-top-characters-editor-work-result" }, [
          cover,
          el("span", { class: "lf-top-characters-editor-work-copy" }, [
            el("strong", { text: mlTitleOf(work) || work.title || uiText("عمل", "Work") }),
            el("small", { text: [work.type, work.auth || work.author].filter(Boolean).join(" · ") || uiText("عرض الشخصيات", "View characters") })
          ]),
          el("span", { class: "lf-top-characters-editor-work-action", text: uiText("عرض", "View") })
        ]);
        button.addEventListener("click", function () {
          if (!editorActive()) return;
          ++nameSearchEpoch;clearTimeout(nameSearchTimer);clearTimeout(search.__renderTimer);nameSearchBusy=false;
          activeWorkId = workId;
          loadingWorkId = workId;
          search.value = "";
          render();
          hydrateProfileRatedCharacters(workId, function () {
            if (!editorActive()) return;
            if (loadingWorkId === workId) loadingWorkId = "";
            render();
          });
        });
        workResults.appendChild(button);
      });
    }
    var selectionUpdates = [], slotNodes=[], candidateNodes=new Map();
    function selectSlot(index) {
      if (!editorActive() || index === activeSlot) return;
      activeSlot = index;
      selectionUpdates.forEach(function(update){update();});
    }
    function render() {
      if (!editorActive()) return;
      selectionUpdates = [];
      var data = dataNow(), selected = {}, query = profileTopCharacterSearchText(search.value);
      var missingWorkIds = data.missing.slice();
      if (activeWorkId && !profileRatedCharacterCache[activeWorkId] && missingWorkIds.indexOf(activeWorkId) < 0) missingWorkIds.push(activeWorkId);
      var failedWorkIds = missingWorkIds.filter(function (id) { return !!profileRatedCharacterFailures[id]; });
      var castLoading = missingWorkIds.some(function (id) { return !profileRatedCharacterFailures[id]; });
      draft.forEach(function (ref, index) { if (ref) selected[profileTopCharacterRefKey(ref)] = index + 1; });
      clearSearch.hidden = !search.value;

      for (var slot = 0; slot < 4; slot++) {
        (function (slotIndex) {
          var ref = draft[slotIndex], item = ref && profileTopCharacterFromRef(ref, data.entries);
          var slotKey=JSON.stringify([ref,item&&item.character,uiText("ar","en")]),previous=slotNodes[slotIndex];
          if(previous&&previous.key===slotKey){selectionUpdates.push(previous.update);previous.update();return;}
          var button = el("button", {
            type: "button",
            class: "lf-top-characters-editor-slot" + (item ? " is-filled" : " is-empty") + (slotIndex === activeSlot ? " is-active" : ""),
            "aria-pressed": String(slotIndex === activeSlot),
            "aria-label": item
              ? uiText("اختيار الخانة ", "Select slot ") + (slotIndex + 1) + uiText("، ", ", ") + (item.character.name || item.character.latin || uiText("شخصية", "Character"))
              : uiText("اختيار الخانة الفارغة ", "Select empty slot ") + (slotIndex + 1)
          });
          if (item) {
            button.appendChild(profileRatedCharacterPortrait(item));
            button.appendChild(el("span", { class: "lf-top-characters-editor-slot-rank", text: String(slotIndex + 1) }));
            button.appendChild(el("strong", { text: item.character.name || item.character.latin || uiText("شخصية", "Character") }));
          } else {
            button.appendChild(el("span", { text: "+" }));
            button.appendChild(el("small", { text: uiText("الخانة ", "Slot ") + (slotIndex + 1) }));
          }
          button.addEventListener("click", function () { selectSlot(slotIndex); });
          var remove=null;
          function updateSlot(){button.setAttribute("class","lf-top-characters-editor-slot"+(item?" is-filled":" is-empty")+(slotIndex===activeSlot?" is-active":""));button.setAttribute("aria-pressed",String(slotIndex===activeSlot));if(remove)remove.hidden=slotIndex!==activeSlot;}
          selectionUpdates.push(updateSlot);
          var slotCell=el("div",{class:"lf-top-characters-editor-slot-cell"+(item?" is-filled":"")});
          slotCell.appendChild(button);
          if(item){
            remove=el("button",{type:"button",class:"lf-top-characters-editor-slot-remove","aria-label":uiText("إزالة ","Remove ")+(item.character.name||item.character.latin||uiText("الشخصية","character"))+uiText(" من الخانة "," from slot ")+(slotIndex+1)},[el("span",{"aria-hidden":"true",text:"×"})]);
            remove.addEventListener("click",function(event){if(event)event.stopPropagation();if(!editorActive())return;draft[slotIndex]=null;setProfileTopCharacterSelection(draft);syncProfileTopCharacters();render();});
            remove.hidden=slotIndex!==activeSlot;

            slotCell.appendChild(remove);
          }
          if(previous)slots.replaceChild(slotCell,previous.cell);else slots.appendChild(slotCell);
          slotNodes[slotIndex]={key:slotKey,cell:slotCell,update:updateSlot};
        })(slot);
      }
      currentWork.textContent = "";
      if (activeWorkId) {
        var activeWork = profileWorkFor(activeWorkId);
        currentWork.hidden = false;
        currentWork.appendChild(el("span", null, [
          el("strong", { text: profileWorkTitle(activeWorkId) }),
          el("small", { text: loadingWorkId === activeWorkId ? uiText("جاري تحميل الشخصيات...", "Loading characters...") : uiText("اختر شخصيات هذا العمل", "Choose characters from this work") })
        ]));
        var changeWork = el("button", { type: "button", text: uiText("تغيير العمل", "Change work") });
        changeWork.addEventListener("click", function () {
          activeWorkId = "";
          loadingWorkId = "";
          search.value = "";
          render();
          search.focus();
        });
        currentWork.appendChild(changeWork);
        headingTitle.textContent = uiText("شخصيات ", "Characters: ") + (mlTitleOf(activeWork) || profileWorkTitle(activeWorkId));
        headingMeta.textContent = loadingWorkId === activeWorkId ? uiText("يتم الآن جلب طاقم العمل", "Loading this work's cast") : uiText("اضغط للإضافة أو الإزالة", "Select to add or remove");
      } else {
        currentWork.hidden = true;
        headingTitle.textContent = query ? uiText("الشخصيات المطابقة", "Matching characters") : uiText("الشخصيات التي قيّمتها", "Characters you rated");
        headingMeta.textContent = query ? (nameSearchBusy ? uiText("جاري البحث عن الشخصيات…","Searching characters…") : pickerMode==="works" ? uiText("اختر عملاً من نتائج البحث لعرض شخصياته", "Select a work to see its characters") : "") : pickerMode==="works" ? uiText("ابحث باسم العمل لإظهار شخصياته", "Search by work title to see its characters") : uiText("ابحث باسم شخصية، أو اختر «حسب العمل»", "Search by character name, or select By work");
      }
      renderWorkResults(query);
      var desiredCandidates=[], nextCandidates=new Map();
      var rows = candidateRows(data, query);
      if (!rows.length) {
        var emptyText = nameSearchBusy ? uiText("جاري البحث عن الشخصيات…","Searching characters…") : nameSearchFailed ? uiText("تعذر البحث الآن. جرّب مرة أخرى أو ابحث باسم العمل.","Character search unavailable. Try again or search by work title.") : failedWorkIds.length
          ? uiText("تعذر تحميل الشخصيات. يمكنك إعادة المحاولة.", "Could not load characters. You can retry.")
          : castLoading ? uiText("جاري تحميل الشخصيات التي قيّمتها…", "Loading rated characters…") : loadingWorkId === activeWorkId && activeWorkId
          ? uiText("جاري تحميل شخصيات العمل...", "Loading this work's characters...")
          : activeWorkId
            ? uiText("لم نجد شخصيات موثقة لهذا العمل. جرّب عملاً آخر.", "No verified characters found for this work. Try another work.")
            : query
              ? (pickerMode==="works" ? (!workResults.hidden ? uiText("اختر عملاً من نتائج البحث لعرض شخصياته.", "Select a work from search results to see its characters.") : uiText("لا توجد أعمال مطابقة. جرّب عنواناً آخر.", "No matching works. Try another title.")) : uiText("لا توجد شخصيات مطابقة. جرّب اسماً آخر.", "No matching characters. Try another name."))
              : pickerMode==="works" ? uiText("ابحث باسم العمل، ثم اختر شخصياتك المفضلة.", "Search by work title, then choose your favorite characters.") : uiText("ابحث باسم شخصية لإضافتها إلى المفضلة.", "Search by character name to add a favorite.");
        desiredCandidates.push(el("p", { class: "lf-profile-rated-characters-empty", role: "status", text: emptyText }));
      } else {
        rows.forEach(function (item) {
          var ref = profileTopCharacterRef(item), key = profileTopCharacterRefKey(ref), rank = selected[key] || 0;
          var fingerprint=JSON.stringify([item.character,item.score,item.workTitle,uiText("ar","en")]),cached=candidateNodes.get(key);
          if(cached&&cached.fingerprint===fingerprint){cached.update();selectionUpdates.push(cached.update);desiredCandidates.push(cached.node);nextCandidates.set(key,cached);return;}
          var isActiveSelection = rank === activeSlot + 1;
          var rating = item.score
            ? profileRatedCharacterStars(item)
            : el("span", { class: "lf-top-characters-editor-unrated", text: uiText("اختيار حر", "Unrated choice") });
          var button = el("button", {
            type: "button",
            class: "lf-top-characters-editor-candidate" + (rank ? " is-selected" : "") + (isActiveSelection ? " is-active" : ""),
            "aria-label": isActiveSelection
              ? (item.character.name || item.character.latin || uiText("شخصية", "Character")) + uiText(" محددة في الخانة ", " selected in slot ") + (activeSlot + 1)
              : uiText("استبدال الخانة ", "Replace slot ") + (activeSlot + 1) + uiText(" بـ ", " with ") + (item.character.name || item.character.latin || uiText("شخصية", "Character"))
          }, [
            profileRatedCharacterPortrait(item),
            el("span", { class: "lf-top-characters-editor-candidate-copy" }, [
              el("strong", { text: item.character.name || item.character.latin || uiText("شخصية", "Character") }),
              el("small", { text: item.workTitle }),
              rating
            ]),
            el("span", { class: "lf-top-characters-editor-candidate-action", text: isActiveSelection ? "✓" : uiText("تبديل", "Replace") })
          ]);
          button.addEventListener("click", function () {
            chooseCandidate(ref);
          });
          var action=button.children[2];
          function updateCandidate(){
            var rank=selectionIndex(ref)+1,active=rank===activeSlot+1;
            button.setAttribute("class","lf-top-characters-editor-candidate"+(rank?" is-selected":"")+(active?" is-active":""));
            button.setAttribute("aria-label",active ? (item.character.name||item.character.latin||uiText("شخصية","Character"))+uiText(" محددة في الخانة "," selected in slot ")+(activeSlot+1) : uiText("استبدال الخانة ","Replace slot ")+(activeSlot+1)+uiText(" بـ "," with ")+(item.character.name||item.character.latin||uiText("شخصية","Character")));
            action.textContent=active?"✓":uiText("تبديل","Replace");
          }
          selectionUpdates.push(updateCandidate);nextCandidates.set(key,{fingerprint:fingerprint,node:button,update:updateCandidate});
          desiredCandidates.push(button);
        });
      }
      if (failedWorkIds.length) {
        if (rows.length) desiredCandidates.push(el("p", { class: "lf-profile-rated-characters-empty", text: uiText("تعذر تحميل بعض الشخصيات.", "Some characters could not be loaded.") }));
        var retryCast = el("button", { type: "button", class: "lf-top-characters-editor-retry lf-character-atlas-more", text: uiText("إعادة المحاولة", "Retry") });
        retryCast.addEventListener("click", function () {
          if (!editorActive()) return;
          failedWorkIds.forEach(function (id) { delete profileRatedCharacterFailures[id]; });
          render();
        });
        desiredCandidates.push(retryCast);
      }
      var wantedCandidates=new Set(desiredCandidates);
      Array.from(candidates.children).forEach(function(node){if(!wantedCandidates.has(node))node.remove();});
      desiredCandidates.forEach(function(node,index){if(candidates.children[index]!==node)candidates.insertBefore(node,candidates.children[index]||null);});
      candidateNodes=nextCandidates;
      missingWorkIds.forEach(function (workId) { hydrateProfileRatedCharacters(workId); });
    }
    search.addEventListener("input",function(){
      if (!editorActive()) return;
      clearTimeout(nameSearchTimer);var epoch=++nameSearchEpoch,query=search.value.trim();nameSearchFailed=false;nameSearchBusy=false;
      var system=global.LorefyCharacterSystem;
      if(pickerMode==="characters"&&!activeWorkId && query.length>=2 && system && system.searchCharacters){
        nameSearchBusy=true;
        nameSearchTimer=setTimeout(function(){
          var loader=global.LorefyCatalogLoader;
          var workSearch=Promise.resolve();
          Promise.resolve(workSearch).catch(function(){}).then(function(){if(!editorActive() || epoch!==nameSearchEpoch)return [];return system.searchCharacters(query,mlWorks(),{active:function(){return editorActive()&&epoch===nameSearchEpoch;}});}).then(function(rows){
          if(!editorActive() || epoch!==nameSearchEpoch)return;
          rows.forEach(function(row){profileRatedCharacterCache[row.workId]=row.cast;});
        }).catch(function(){if(editorActive()&&epoch===nameSearchEpoch)nameSearchFailed=true;}).finally(function(){if(editorActive()&&epoch===nameSearchEpoch){nameSearchBusy=false;render();}});},450);
      }
      if(pickerMode==="works"&&!activeWorkId&&query.length>=2){nameSearchTimer=setTimeout(function(){if(!editorActive()||epoch!==nameSearchEpoch)return;var loader=global.LorefyCatalogLoader;if(loader&&loader.loadAuthor)loader.loadAuthor(query,function(){return editorActive()&&epoch===nameSearchEpoch;}).then(function(){if(editorActive()&&epoch===nameSearchEpoch)render();}).catch(function(){});},450);}
      clearTimeout(search.__renderTimer);search.__renderTimer=setTimeout(function(){if(ov.body.isConnected)render();},180);
    });
    clearSearch.addEventListener("click", function () { nameSearchEpoch++;clearTimeout(nameSearchTimer);clearTimeout(search.__renderTimer);nameSearchBusy=false;nameSearchFailed=false;search.value = ""; render(); search.focus(); });
    save.addEventListener("click", function () {
      if (!editorActive()) return;
      if(setProfileTopCharacterSelection(draft)===false){
        toastSafe(uiText("تعذر حفظ المفضلة على الجهاز. أعد المحاولة.","Could not save favorites on this device. Please try again."));
        return;
      }
      syncProfileTopCharacters();
      ov.close();
      toastSafe(uiText("تم حفظ المفضلة", "Favorites saved"));
    });
    ov.body.appendChild(slots);
    ov.body.appendChild(searchBox);
    ov.body.appendChild(modes);
    ov.body.appendChild(workResults);
    ov.body.appendChild(currentWork);
    ov.body.appendChild(el("header", { class: "lf-top-characters-editor-heading" }, [headingTitle, headingMeta]));
    ov.body.appendChild(candidates);
    ov.page.appendChild(save);
    render();
  }
  function renameProfileFavouriteWorksHeading(page) {
    var identity = page && page.querySelector(":scope > .lf-profile-identity");
    if (!identity) return;
    var labels = identity.querySelectorAll("span, strong");
    for (var i = labels.length - 1; i >= 0; i--) {
      if (labels[i].textContent.trim() !== "المفضلة") continue;
      labels[i].textContent = "المفضلة";
      break;
    }
  }
  function enhanceProfileFavouriteWorksEditor() {
    var sheets = doc.querySelectorAll(".nc-sheet");
    for (var sheetIndex = sheets.length - 1; sheetIndex >= 0; sheetIndex--) {
      var sheet = sheets[sheetIndex];
      if ((sheet.textContent || "").indexOf("تعديل المفضلة") < 0 && !sheet.classList.contains("lf-profile-top-works-editor")) continue;
      sheet.classList.add("lf-profile-top-works-editor");
      var labels = sheet.querySelectorAll("strong, h1, h2, h3, p, span");
      for (var labelIndex = 0; labelIndex < labels.length; labelIndex++) {
        var title = labels[labelIndex];
        if ((title.textContent || "").trim() === "تعديل المفضلة") title.textContent = "المفضلة";
      }
      var buttons = sheet.querySelectorAll("button");
      for (var buttonIndex = buttons.length - 1; buttonIndex >= 0; buttonIndex--) {
        var button = buttons[buttonIndex];
        if ((button.textContent || "").trim() !== "تم") continue;
        button.textContent = "حفظ المفضلة";
        button.setAttribute("aria-label", "حفظ المفضلة");
        break;
      }
      return true;
    }
    return false;
  }
  function openProfileFavouriteWorksEditor(initialSlot) {
    var existing = doc.querySelector(".lf-profile-top-works-editor");
    if (existing && existing.classList.contains("is-leaving")) { existing.remove(); existing = null; }
    if (existing) {
      var existingSearch = existing.querySelector(".lf-top-works-editor-search");
      if (existingSearch) existingSearch.focus();
      return true;
    }
    var ov = ovOpen("lf-profile-top-works-editor", uiText("المفضلة", "Favorites"));
    var saved = read("lorefy.user.favorites.v2", []);
    var draft = [];
    var seen = {};
    (Array.isArray(saved) ? saved : []).forEach(function (id) {
      id = String(id || "");
      if (id && !seen[id]) { seen[id] = true; draft.push(id); }
    });
    draft = draft.slice(0, 7);
    while (draft.length < 7) draft.push("");
    var activeSlot = Number.isInteger(initialSlot) ? Math.max(0, Math.min(6, initialSlot)) : 0;
    var search = el("input", {
      type: "search",
      class: "lf-top-works-editor-search",
      dir: "auto",
      style: "text-align: start",
      placeholder: uiText("ابحث عن عمل لإضافته...", "Search for a work to add..."),
      autocomplete: "off",
      "aria-label": uiText("ابحث عن عمل لإضافته", "Search for a work to add")
    });
    var slots = el("div", { class: "lf-top-works-editor-slots" });
    var results = el("div", { class: "lf-top-works-editor-results" });
    var meta = el("p", { class: "lf-top-works-editor-meta", text: uiText("اختر الخانة، ثم اضغط العمل لاستبداله. الترتيب هو ترتيب ظهوره في ملفك.", "Choose a slot, then select a replacement. This order appears on your profile.") });
    var save = el("button", { type: "button", class: "lf-top-works-editor-save", text: uiText("حفظ المفضلة", "Save favorites") });
    var visibleLimit = 12;
    var renderTimer = 0;
    function workFor(id) { return profileWorkFor(id); }
    function titleFor(id) {
      var work = workFor(id);
      return (work && (mlTitleOf(work) || work.title || work.ar)) || "عمل في مكتبتك";
    }
    function coverFor(work) { return work && (mlCoverOf(work) || work.sourceCover || work.cover); }
    function searchText(work) {
      return profileTopCharacterSearchText([work && work.title, work && work.ar, work && work.auth, work && work.author].filter(Boolean).join(" "));
    }
    function drawCover(wrap, work) {
      var cover = coverFor(work);
      if (!cover) { wrap.textContent = "ل"; return; }
      var image = el("img", { src: cover, alt: titleFor(String(work.id || "")), loading: "lazy", referrerpolicy: "no-referrer" });
      image.addEventListener("error", function () { image.remove(); wrap.textContent = "ل"; });
      wrap.appendChild(image);
    }
    function selectWork(id) {
      id = String(id || "");
      var previousIndex = draft.indexOf(id);
      if (previousIndex === activeSlot) return;
      var displaced = draft[activeSlot] || "";
      draft[activeSlot] = id;
      if (previousIndex >= 0) draft[previousIndex] = displaced;
      write("lorefy.user.favorites.v2", draft.filter(Boolean).slice(0, 7));
      global.dispatchEvent(new CustomEvent("lorefy:stored-state", { detail: { key: "lorefy.user.favorites.v2" } }));
      render();
    }
    var slotUpdates = [], slotNodes=[], resultNodes=new Map();
    function render() {
      slotUpdates = [];
      var query = profileTopCharacterSearchText(search.value);

      draft.forEach(function (id, index) {
        var work = id && workFor(id), slotKey=JSON.stringify([id,titleFor(id),coverFor(work),!!work]);
        var previous=slotNodes[index];
        if(previous&&previous.key===slotKey){slotUpdates.push(previous.update);previous.update();return;}
        var button = el("button", {
          type: "button",
          class: "lf-top-works-editor-slot" + (work ? " is-filled" : " is-empty") + (index === activeSlot ? " is-active" : ""),
          "aria-pressed": String(index === activeSlot),
          "aria-label": id ? uiText("اختيار الخانة ", "Select slot ") + (index + 1) + ", " + titleFor(id) : uiText("اختيار الخانة الفارغة ", "Select empty slot ") + (index + 1)
        });
        if (work) {
          var slotCover = el("span", { class: "lf-top-works-editor-cover" });
          drawCover(slotCover, work);
          button.appendChild(slotCover);
          button.appendChild(el("strong", { text: titleFor(id) }));
        } else if (id) {
          button.appendChild(el("strong", { text: uiText("عمل محفوظ", "Saved work") }));
          button.appendChild(el("small", { text: uiText("بانتظار بيانات العمل", "Waiting for work details") }));
        } else {
          button.appendChild(el("span", { class: "lf-top-works-editor-empty-mark", text: "+", "aria-hidden": "true" }));
          button.appendChild(el("small", { text: uiText("الخانة ", "Slot ") + (index + 1) }));
        }
        var update=function(){
          button.setAttribute("class","lf-top-works-editor-slot"+(work?" is-filled":" is-empty")+(index===activeSlot?" is-active":""));
          button.setAttribute("aria-pressed",String(index===activeSlot));
        };slotUpdates.push(update);
        button.addEventListener("click", function () {
          if (!ov.page.isConnected || ov.page.inert || activeSlot===index) return;
          activeSlot=index;slotUpdates.forEach(function(update){update();});
        });
        if(previous)slots.replaceChild(button,previous.button);else slots.appendChild(button);
        slotNodes[index]={key:slotKey,button:button,update:update};
      });
      var desired=[],nextResults=new Map();
      function commitResults(){
        var wanted=new Set(desired);
        Array.from(results.children).forEach(function(node){if(!wanted.has(node))node.remove();});
        desired.forEach(function(node,index){if(results.children[index]!==node)results.insertBefore(node,results.children[index]||null);});
        resultNodes=nextResults;
      }
      var matches = [];
      var catalog = mlWorks();
      for (var workIndex = 0; workIndex < catalog.length && matches.length <= visibleLimit; workIndex++) {
        var candidate = catalog[workIndex];
        if (!query || searchText(candidate).indexOf(query) >= 0) matches.push(candidate);
      }
      var hasMore = matches.length > visibleLimit;
      var works = matches.slice(0, visibleLimit);
      if (!works.length) {
        desired.push(el("p", { class: "lf-top-works-editor-empty", text: uiText("لا توجد أعمال مطابقة.", "No matching works.") }));
        commitResults();return;
      }
      works.forEach(function (work) {
        var id = String(work && work.id || "");
        if (!id) return;
        var rank = draft.indexOf(id), key=JSON.stringify([id,rank,titleFor(id),coverFor(work),work.type,work.auth,work.author,doc.documentElement.lang]);
        var cached=resultNodes.get(id);
        if(cached&&cached.key===key){desired.push(cached.node);nextResults.set(id,cached);return;}
        var cover = el("span", { class: "lf-top-works-editor-cover" });
        drawCover(cover, work);
        var button = el("button", {
          type: "button",
          class: "lf-top-works-editor-result" + (rank >= 0 ? " is-selected" : ""),
          "aria-label": rank >= 0 ? titleFor(id) + uiText(" محدد في الخانة ", " selected in slot ") + (rank + 1) : uiText("إضافة ", "Add ") + titleFor(id)
        }, [
          cover,
          el("span", { class: "lf-top-works-editor-result-copy" }, [
            el("strong", { text: titleFor(id) }),
            el("small", { text: [work.type, work.auth || work.author].filter(Boolean).join(" · ") || "عمل" })
          ]),
          el("span", { class: "lf-top-works-editor-result-action", text: rank >= 0 ? String(rank + 1) : uiText("اختيار", "Select") })
        ]);
        button.addEventListener("click", function () { selectWork(id); });
        desired.push(button);nextResults.set(id,{key:key,node:button});
      });
      if (hasMore) {
        var more = el("button", { type: "button", class: "lf-top-works-editor-more", text: "عرض المزيد" });
        more.addEventListener("click", function () {
          visibleLimit += 12;
          render();
        });
        desired.push(more);
      }
      commitResults();
    }
    function refreshCatalog() {
      if (ov.page.isConnected) render();
    }
    function stopCatalogRefresh() {
      global.removeEventListener("lorefy:catalog-ready", refreshCatalog);
    }
    global.addEventListener("lorefy:catalog-ready", refreshCatalog, { once: true });
    ov.head.querySelector(".lf-ov-back").addEventListener("click", stopCatalogRefresh);
    search.addEventListener("input", function () {
      visibleLimit = 12;
      clearTimeout(renderTimer);
      renderTimer = setTimeout(render, 120);
    });
    save.addEventListener("click", function () {
      stopCatalogRefresh();
      var compact = draft.filter(Boolean).slice(0, 7);
      write("lorefy.user.favorites.v2", compact);
      global.dispatchEvent(new CustomEvent("lorefy:stored-state", { detail: { key: "lorefy.user.favorites.v2" } }));
      ov.close();
      toastSafe(uiText("تم حفظ المفضلة", "Favorites saved"));
    });
    ov.body.appendChild(meta);
    ov.body.appendChild(slots);
    ov.body.appendChild(search);
    ov.body.appendChild(results);
    ov.page.appendChild(save);
    render();
    return true;
  }
  function syncProfileFavouriteWorksControls() {
    var favorites = doc.querySelector(".lf-profile-page > .lf-profile-favorites");
    var page = favorites && favorites.closest(".lf-profile-page");
    var identity = page && page.querySelector(":scope > .lf-profile-identity");
    if (!favorites || !page || !identity) return false;
    var favoriteIds = read("lorefy.user.favorites.v2", []);
    favoriteIds = Array.isArray(favoriteIds) ? favoriteIds.filter(Boolean).slice(0, 7) : [];
    var favoriteKey = JSON.stringify(favoriteIds);
    if (favorites.dataset.lfFavoriteCatalogRequested !== favoriteKey && global.LorefyCatalogLoader) {
      favorites.dataset.lfFavoriteCatalogRequested = favoriteKey;
      global.LorefyCatalogLoader.loadWorks(favoriteIds).catch(function () {});
    }
    favorites.classList.toggle("is-empty", !favorites.querySelector("[data-lorefy-book-cover],img"));
    renameProfileFavouriteWorksHeading(page);
    var labels = identity.querySelectorAll("span, strong");
    var header = null;
    for (var labelIndex = labels.length - 1; labelIndex >= 0; labelIndex--) {
      if (!/^(المفضلة|Favorites)$/.test((labels[labelIndex].textContent || "").trim())) continue;
      header = labels[labelIndex].parentElement;
      break;
    }
    if (header) {
      header.classList.add("lf-profile-top-works-head");
      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.setAttribute("aria-label", uiText("تعديل المفضلة", "Edit favorites"));
      var edit = header.querySelector("button");
      if (edit) edit.setAttribute("aria-label", uiText("تعديل المفضلة", "Edit favorites"));
      if (!header.dataset.lfTopWorksWired) {
        header.dataset.lfTopWorksWired = "1";
        header.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          openProfileFavouriteWorksEditor();
        });
        header.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          openProfileFavouriteWorksEditor();
        });
      }
    }
    Array.prototype.forEach.call(favorites.children, function (slot, index) {
      if (slot.classList.contains("lf-managed-cover-card")) {
        slot.removeAttribute("role");slot.removeAttribute("tabindex");slot.removeAttribute("aria-label");
      } else {
        slot.setAttribute("role", "button");
        slot.setAttribute("tabindex", "0");
        slot.setAttribute("aria-label", uiText("تعديل العمل رقم ", "Edit favorite work ") + (index + 1) + uiText(" ضمن المفضلة", ""));
      }
      if (!slot.dataset.lfTopWorksWired) {
        slot.dataset.lfTopWorksWired = "1";
        var openSlot = function (event) {
          if (event.target.closest(".lf-cover-open,.lf-cover-retry,.lf-profile-cover-edit")) return;
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          // React can reuse the initial empty slot when the catalog arrives.
          var index = Array.prototype.indexOf.call(slot.parentElement.children, slot);
          if (index >= 0) openProfileFavouriteWorksEditor(index);
        };
        slot.addEventListener("click", openSlot, true);
        slot.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") openSlot(event);
        }, true);
      }
    });
    return true;
  }
  function syncProfileTopCharacters() {
    var favorites = doc.querySelector(".lf-profile-favorites");
    var page = favorites && favorites.closest(".lf-profile-page");
    if (!favorites || !page) return false;
    renameProfileFavouriteWorksHeading(page);
    var topCharacters = page.querySelector(":scope > .lf-profile-top-characters");
    if (topCharacters && topCharacters.getAttribute("data-lf-top-characters-version") !== "5") {
      topCharacters.remove();
      topCharacters = null;
    }
    if (!topCharacters) {
      var showAll = el("span", { class: "lf-profile-top-characters-all", text: "تعديل" });
      var header = el("button", {
        type: "button",
        class: "lf-profile-top-characters-head",
        "data-lf-top-character-editor": "heading",
        "aria-label": "تعديل الشخصيات المفضلة"
      }, [
        showAll,
        el("div", null, [el("strong", { text: "الشخصيات المفضلة" })])
      ]);
      header.addEventListener("click", openProfileTopCharactersEditorFromControl, true);
      topCharacters = el("section", {
        class: "lf-profile-top-characters",
        "data-lf-top-characters-version": "5",
        "aria-label": "الشخصيات المفضلة"
      }, [
        header,
        el("div", { class: "lf-profile-favorites lf-profile-top-characters-grid" })
      ]);
    }
    var grid = topCharacters.querySelector(".lf-profile-top-characters-grid");
    var data = profileCharacterEntries();
    var selection = profileTopCharacterSelection();
    var items = [];
    for (var index = 0; index < 4; index++) items.push(profileTopCharacterFromRef(selection[index], data.entries));
    grid.classList.toggle("is-empty", !items.some(Boolean));
    var signature = JSON.stringify(items.map(function (item) {
      var character = item && item.character || {};
      return [
        item ? profileTopCharacterRefKey(profileTopCharacterRef(item)) : "",
        character.name || character.latin || "",
        characterImageUrl(character) || ""
      ];
    }));
    if (grid.children.length !== 4) grid.removeAttribute("data-lf-top-character-signature");
    if (grid.getAttribute("data-lf-top-character-signature") !== signature) {
      grid.textContent = "";
      items.forEach(function (item, itemIndex) { grid.appendChild(profileTopCharacterTile(item, itemIndex)); });
      grid.setAttribute("data-lf-top-character-signature", signature);
    }
    selection.forEach(function (ref) { if (ref && !profileRatedCharacterCache[ref.workId]) hydrateProfileRatedCharacters(ref.workId); });
    data.missing.forEach(function (workId) { hydrateProfileRatedCharacters(workId); });
    var recent = page.querySelector(":scope > .lf-profile-recent");
    var rated = page.querySelector(":scope > .lf-profile-rated-characters");
    if (recent && rated && recent.nextSibling !== rated) page.insertBefore(recent, rated);
    var readerStatistics = page.getAttribute('data-profile-layout') === 'reader'
      && page.querySelector(':scope > .lf-reader-layout-statistics');
    if (readerStatistics) {
      if (readerStatistics.nextSibling !== topCharacters) page.insertBefore(topCharacters, readerStatistics.nextSibling);
    } else if (favorites.nextSibling !== topCharacters) page.insertBefore(topCharacters, favorites.nextSibling);
    return true;
  }
  function hydrateProfileRatedCharacters(workId, onDone) {
    workId = String(workId || "");
    if (!workId) return Promise.resolve([]);
    var owner = profileRatedCharacterOwner();
    var pending = profileRatedCharacterLoads[workId];
    if (!pending && profileRatedCharacterFailures[workId] && !onDone) return Promise.resolve([]);
    if (!pending) {
      delete profileRatedCharacterFailures[workId];
      pending = Promise.resolve().then(function () {
        return loadCast(workContext({ workId: workId, work: profileWorkFor(workId) }));
      }).then(function (cast) {
        profileRatedCharacterCache[workId] = Array.isArray(cast) ? cast : [];
        return profileRatedCharacterCache[workId];
      }).catch(function () {
        profileRatedCharacterFailures[workId] = true;
        return [];
      });
      profileRatedCharacterLoads[workId] = pending;
      pending.then(function () {
        delete profileRatedCharacterLoads[workId];
        paintProfileRatedCharacters(doc.querySelector(".lf-profile-rated-characters"));
        syncProfileTopCharacters();
        syncProfileRatedCharacterGallery();
        syncProfileTopCharacterEditor(true);
      });
    }
    if (onDone) pending.then(function (cast) { if (owner === profileRatedCharacterOwner()) onDone(cast); });
    return pending;
  }
  function syncProfileRatedCharacters() {
    var favorites = doc.querySelector(".lf-profile-favorites");
    var section = doc.querySelector(".lf-profile-rated-characters");
    if (profileRatedCharacterSection && (profileRatedCharacterSection !== section || !favorites || !favorites.parentElement)) {
      releaseCharacterPortraits(profileRatedCharacterSection);
      var previousRail = profileRatedCharacterSection.querySelector('.lf-profile-rated-characters-rail');
      if (previousRail) delete previousRail.dataset.ratedCharactersSignature;
      profileRatedCharacterSection = null;
    }
    if (!favorites || !favorites.parentElement) return false;
    var rows = profileRatedScoreRows();
    if (!rows.length) { if (section) { releaseCharacterPortraits(section); section.remove(); } profileRatedCharacterSection = null; return true; }
    if (!section) {
      var showAll = el("button", { type: "button", class: "lf-profile-rated-characters-all", text: uiText("عرض الكل", "See all") });
      section = el("section", { class: "lf-profile-rated-characters", "aria-label": uiText("شخصيات قيّمتها", "Rated characters") }, [
        el("header", { class: "lf-profile-rated-characters-head" }, [
          el("div", null, [
            el("strong", { text: uiText("شخصيات قيّمتها", "Rated characters") })
          ]),
          el("div", { class: "lf-profile-rated-characters-meta" }, [el("small", { "data-lf-rated-characters-count": "" }), showAll])
        ]),
        el("div", { class: "lf-profile-rated-characters-rail" })
      ]);
      favorites.parentElement.insertBefore(section, favorites.nextSibling);
    }
    var showAll = section.querySelector(".lf-profile-rated-characters-all");
    if (showAll && !showAll.dataset.lfProfileRatedCharactersWired) {
      showAll.dataset.lfProfileRatedCharactersWired = "1";
      showAll.addEventListener("click", openProfileRatedCharacters);
    }
    profileRatedCharacterSection = section;
    paintProfileRatedCharacters(section);
    return true;
  }

  function syncProfileCommunitySummary() {
    var favorites = doc.querySelector(".lf-profile-favorites");
    if (!favorites || !favorites.parentElement) return false;
    var section = doc.querySelector(".lf-profile-community-summary");
    if (!section) {
      function summaryAction(kind, icon, label, action) {
        var mark = extraIcon(icon);
        mark.classList.add("lf-profile-community-action-icon");
        var button = el("button", { type: "button", class: "lf-profile-community-action", "data-lf-community-summary": kind }, [
          mark,
          el("strong", { text: label }),
          el("small", { "data-lf-community-summary-count": kind, text: "0" })
        ]);
        button.addEventListener("click", action);
        return button;
      }
      section = el("section", { class: "lf-profile-community-summary", "aria-label": "نشاط المجتمع" }, [
        el("header", { class: "lf-profile-community-head" }, [
          el("strong", { text: "نشاط المجتمع" })
        ]),
        el("div", { class: "lf-profile-community-actions" }, [
          summaryAction("replies", "message-circle", "الردود", openHomeReplyInbox),
          summaryAction("saved", "bookmark", "المحفوظات", openSavedReviews),
          summaryAction("characters", "feather", "الشخصيات", openProfileRatedCharacters)
        ])
      ]);
    }
    var rated = doc.querySelector(".lf-profile-rated-characters");
    var recent = doc.querySelector(".lf-profile-recent");
    var topCharacters = doc.querySelector(".lf-profile-top-characters");
    var anchor = doc.querySelector(".lf-profile-reading-results") || rated || recent || topCharacters || favorites;
    if (anchor.nextSibling !== section) anchor.parentElement.insertBefore(section, anchor.nextSibling);
    var counts = {
      replies: replyShelfItems().length,
      saved: Object.keys(savedReviews()).length + (global.LorefyCommunity ? Object.keys(global.LorefyCommunity.savedPosts()).length : 0),
      characters: profileRatedScoreRows().length
    };
    Object.keys(counts).forEach(function (kind) {
      var output = section.querySelector('[data-lf-community-summary-count="' + kind + '"]');
      if (output && output.textContent !== String(counts[kind])) output.textContent = String(counts[kind]);
    });
    return true;
  }

  /* ── Home reply inbox ── */
  function replyInbox() { var rows = read(K_REPLY_INBOX, []); return Array.isArray(rows) ? rows : []; }
  function replyTimestamp(value) { var time = Number(value) || Date.parse(value || "") || 0; return time || Date.now(); }
  function replyTimeLabel(value) {
    var age = Math.max(0, Date.now() - replyTimestamp(value));
    if (age < 60000) return "الآن";
    if (age < 3600000) return Math.max(1, Math.floor(age / 60000)) + " د";
    if (age < 86400000) return Math.max(1, Math.floor(age / 3600000)) + " س";
    return Math.max(1, Math.floor(age / 86400000)) + " ي";
  }
  function captureReplyActivity(input) {
    input = input || {};
    var body = String(input.body || "").replace(/\s+/g, " ").trim().slice(0, 2000);
    if (!body) return false;
    var rows = replyInbox();
    var fingerprint = String(input.reviewId || "") + "|" + body;
    if (rows.some(function (row) { return row.fingerprint === fingerprint && Date.now() - replyTimestamp(row.createdAt) < 30000; })) return false;
    rows.unshift({
      id: "local-" + Date.now() + "-" + Math.random().toString(16).slice(2),
      fingerprint: fingerprint,
      kind: "outgoing",
      body: body,
      reviewId: String(input.reviewId || ""),
      author: String(input.author || "قارئ Lorefy"),
      work: String(input.work || "مراجعة على Lorefy"),
      createdAt: Date.now()
    });
    write(K_REPLY_INBOX, rows.slice(0, 100));
    syncHomeReplyShelf();
    return true;
  }
  function replyShelfItems() {
    var community = global.LorefyCommunity;
    var rows = homeReplyCloudItems.concat(replyInbox(), community && community.replyActivity ? community.replyActivity() : []);
    return Array.from(new Map(rows.map(function (row) { return [row.id,row]; })).values())
      .sort(function (a, b) { return replyTimestamp(b.createdAt) - replyTimestamp(a.createdAt); });
  }
  function replyShelfItem(item, beforeOpen) {
    var inbound = item.kind === "incoming";
    var label = inbound ? uiText("رد جديد من ","New reply from ") + (item.author || uiText("قارئ Lorefy","Lorefy reader")) : uiText("رددت على ","You replied to ") + (item.author || uiText("مراجعة","a review"));
    var card = el("article", { class: "lf-home-reply-item " + (inbound ? "is-incoming" : "is-outgoing") }, [
      el("span", { class: "lf-home-reply-mark", text: inbound ? "↩" : "↗", "aria-hidden": "true" }),
      el("div", { class: "lf-home-reply-copy" }, [
        el("div", { class: "lf-home-reply-line" }, [el("strong", { text: label }), el("time", { text: replyTimeLabel(item.createdAt) })]),
        el("p", { "data-no-translate":"", text: item.body || uiText("رد على مراجعة","Reply to a review") }),
        el("small", { text: item.work || "Lorefy" })
      ])
    ]);
    if (item.postId) {
      var open = el("button", { type:"button", class:"lf-home-reply-open", text:uiText("فتح المحادثة", "Open conversation") });
      open.addEventListener("click", function () {
        if (!global.LorefyCommunity) return;
        if (beforeOpen) beforeOpen();
        global.LorefyCommunity.openThreadById(item.postId);
      });
      card.appendChild(open);
    }
    return card;
  }
  function openHomeReplyInbox() {
    var ov = ovOpen("lf-home-replies-page", "الردود");
    var items = replyShelfItems();
    if (global.LorefyCommunity && global.LorefyCommunity.refreshReplyActivity) {
      global.LorefyCommunity.refreshReplyActivity().then(function () {
        if (!ov.body.isConnected) return;
        var latest = replyShelfItems();
        if (!latest.length) return;
        ov.body.textContent = "";
        latest.forEach(function (item) { ov.body.appendChild(replyShelfItem(item, function () { ov.close(); })); });
        syncProfileCommunitySummary();
      }).catch(function () {});
    }
    if (!items.length) {
      ov.body.appendChild(el("div", { class: "lf-home-replies-empty" }, [
        el("strong", { text: "لا توجد ردود بعد" }),
        el("p", { text: "ستظهر هنا ردود المجتمع والمراجعات." })
      ]));
      return;
    }
    items.forEach(function (item) { ov.body.appendChild(replyShelfItem(item, function () { ov.close(); })); });
  }
  function refreshHomeRepliesFromCloud() {
    var backend = global.LorefyBackend;
    if (!backend || backend.mode !== "live" || homeReplyCloudFetching || Date.now() - homeReplyCloudLastFetch < 45000) return;
    homeReplyCloudFetching = true;
    Promise.resolve(backend.getSession && backend.getSession()).then(function (session) {
      var userId = session && (session.userId || (session.user && session.user.id));
      if (!userId || !backend.listReviews) return [];
      return backend.listReviews({ userId: userId, limit: 40 });
    }).then(function (reviews) {
      var items = [];
      (Array.isArray(reviews) ? reviews : []).forEach(function (review) {
        (Array.isArray(review.comments) ? review.comments : []).forEach(function (comment) {
          if (!comment || !comment.body || comment.user_id === review.user_id) return;
          items.push({
            id: "cloud-" + String(comment.id || comment.created_at || Math.random()),
            kind: "incoming",
            body: String(comment.body).slice(0, 2000),
            author: String((comment.profile && (comment.profile.name || comment.profile.username)) || "قارئ Lorefy"),
            work: profileWorkTitle(review.work_id),
            createdAt: comment.created_at || Date.now()
          });
        });
      });
      homeReplyCloudItems = items;
      homeReplyCloudLastFetch = Date.now();
      syncHomeReplyShelf();
    }).catch(function () {}).then(function () {
      homeReplyCloudFetching = false;
      homeReplyCloudLastFetch = Date.now();
    });
  }
  function syncHomeReplyShelf() {
    var home = doc.querySelector(".lf-home-screen") || doc.querySelector(".lf-home-page");
    if (!home) return false;
    var content = home.querySelector(".lf-home-content");
    if (!content) return false;
    var shelf = home.querySelector(".lf-home-reply-shelf");
    if (!shelf) {
      var all = el("button", { type: "button", class: "lf-home-reply-all", text: "عرض الكل" });
      all.addEventListener("click", openHomeReplyInbox);
      shelf = el("section", { class: "lf-home-reply-shelf", "aria-label": "الردود" }, [
        el("header", { class: "lf-home-reply-head" }, [
          el("strong", { text: "الردود" }),
          all
        ]),
        el("div", { class: "lf-home-reply-list" })
      ]);
      content.insertBefore(shelf, content.firstChild || null);
    }
    if (shelf.parentElement !== content) content.insertBefore(shelf, content.firstChild || null);
    var list = shelf.querySelector(".lf-home-reply-list");
    if (list) {
      var items = replyShelfItems();
      var fingerprint = JSON.stringify(items.slice(0, 3)) + "|" + Math.floor(Date.now() / 60000);
      if (list.dataset.replyFingerprint !== fingerprint) {
        list.dataset.replyFingerprint = fingerprint;
        list.textContent = "";
        if (items.length) items.slice(0, 3).forEach(function (item) { list.appendChild(replyShelfItem(item)); });
        else list.appendChild(el("p", { class: "lf-home-reply-empty", text: "ستظهر هنا ردودك والردود الجديدة على مراجعاتك." }));
      }
    }
    refreshHomeRepliesFromCloud();
    return true;
  }

  /* ── profile launcher row ── */
  function extraIcon(name) {
    return el("span", { class: "lf-extra-ic", "aria-hidden": "true" },
      el("i", { "data-lucide": name, width: "20", height: "20" }));
  }
  function extraChevron() {
    return el("span", { class: "lf-extra-chevron", "aria-hidden": "true" },
      el("i", { "data-lucide": doc.documentElement.lang === "en" ? "chevron-right" : "chevron-left", width: "16", height: "16" }));
  }
  function syncProfileExtras() {
    var anchor = doc.querySelector(".lf-profile-preference-boards");
    if (!anchor || !anchor.parentElement) return false;
    if (doc.querySelector(".lf-extras-row")) {
      syncProfileSavedCard();
      syncProfileRatedCharacters();
      syncProfileCommunitySummary();
      syncProfileSavedCard();
      return true;
    }
    var lists = mlLists();
    var c1 = el("button", { type: "button", class: "lf-extra-card lf-extra-lists" }, [
      extraIcon("list"),
      el("strong", { class: "lf-extra-name", text: "قوائمي" }),
      el("span", { class: "lf-extra-sub", text: lists.length ? lists.length + " قائمة" : "أنشئ قوائم خاصة وشاركها" }),
      extraChevron()
    ]);
    c1.addEventListener("click", openListsHub);
    var c2 = el("button", { type: "button", class: "lf-extra-card lf-extra-wrap" }, [
      extraIcon("chart-no-axes-column"),
      el("strong", { class: "lf-extra-name", text: "ملخّص " + new Date().getFullYear() }),
      el("span", { class: "lf-extra-sub", text: "إحصاءات سنتك القرائية" }),
      extraChevron()
    ]);
    c2.addEventListener("click", openWrapped);
    var c3 = el("button", { type: "button", class: "lf-extra-card lf-extra-import" }, [
      extraIcon("download"),
      el("strong", { class: "lf-extra-name", text: "استيراد مكتبتك" }),
      el("span", { class: "lf-extra-sub", text: "AniList · Kitsu · MAL · Goodreads · StoryGraph · أي موقع" }),
      extraChevron()
    ]);
    c3.addEventListener("click", openImport);
    anchor.parentElement.insertBefore(el("div", { class: "lf-extras-row" }, [c3]), anchor.nextSibling);
    syncProfileSavedCard();
    scheduleCharacterActionIcons();
    syncProfileRatedCharacters();
    syncProfileCommunitySummary();
    syncProfileSavedCard();
    return true;
  }

  /* ════════════════════════════════════════════════════════════════════
     REVIEW TOP-4 CHARACTERS  (optional picker inside the review composer)
     Additive: new localStorage key, decorates the app's review sheet.
     ════════════════════════════════════════════════════════════════════ */
  var K_TOP4 = "lorefy.reviewTop4.v1"; /* { [workId]: [{name,img}] } */
  function top4Get(mid) { var a = read(K_TOP4, {}); return (a && a[mid]) || []; }
  function top4Set(mid, list) { var a = read(K_TOP4, {}); a[mid] = list; write(K_TOP4, a); }

  global.__lorefyTop4Get = function (mid) { var l = top4Get(String(mid)); return l.length ? l.slice(0, 4) : null; };
  global.__lorefyTop4Gate = function () { return true; };

  var top4CastCache = {};
  function top4LoadCast(mid, cb) {
    if (top4CastCache[mid]) { cb(top4CastCache[mid]); return; }
    var ctx = workContext({ workId: mid });
    loadCast(ctx).then(function (cast) {
      top4CastCache[mid] = cast && cast.length ? cast : TEMPLATE_CAST.slice();
      cb(top4CastCache[mid]);
    }).catch(function () {
      top4CastCache[mid] = TEMPLATE_CAST.slice();
      cb(top4CastCache[mid]);
    });
  }

  function top4Portrait(item, size) {
    var wrap = el("span", { class: "lf-top4-portrait" });
    if (item && item.img) {
      var img = doc.createElement("img");
      img.src = item.img; img.alt = ""; img.loading = "lazy";
      img.addEventListener("error", function () { img.remove(); wrap.textContent = String(item.name || "?").slice(0, 1); });
      wrap.appendChild(img);
    } else {
      wrap.textContent = String((item && item.name) || "?").slice(0, 1);
    }
    return wrap;
  }

  function buildTop4Section(mid, language) {
    var labels = {"المفضلة":"Favorites","أفضل ٤ شخصيات":"Favorite characters","اختياري":"Optional","اختر الشخصيات الأربع الأقرب لقلبك — تظهر في مراجعتك.":"Choose up to four characters for your review.","ابحث عن شخصية…":"Search characters…","تحميل الشخصيات…":"Loading characters…","إضافة شخصية":"Add character","إضافة":"Add","لا نتائج":"No results"};
    function top4el(tag, attributes, children) {
      var props = Object.assign({}, attributes);
      if (language === "en") ["text","aria-label","placeholder"].forEach(function (key) {
        var value = props[key];
        if (typeof value !== "string") return;
        props[key] = labels[value] || value.replace(/^شخصية (\d+)$/, "Character $1").replace(/^إزالة /, "Remove ");
      });
      return el(tag, props, children);
    }
    var sec = top4el("section", { class: "lf-top4-section", "data-mid": mid, "aria-label": "المفضلة" });
    var head = top4el("div", { class: "lf-top4-head" }, [
      top4el("div", { class: "lf-top4-title" }, [
        top4el("strong", { text: "أفضل ٤ شخصيات" }),
        top4el("span", { class: "lf-top4-optional", text: "اختياري" })
      ]),
      top4el("span", { class: "lf-top4-count", "data-top4-count": "", text: "0/4" })
    ]);
    var hint = top4el("p", { class: "lf-top4-hint", text: "اختر الشخصيات الأربع الأقرب لقلبك — تظهر في مراجعتك." });
    var slots = top4el("div", { class: "lf-top4-slots" });
    var picker = top4el("div", { class: "lf-top4-picker", hidden: "" });
    var search = top4el("input", { class: "lf-top4-search", type: "search", placeholder: "ابحث عن شخصية…" });
    var list = top4el("div", { class: "lf-top4-list" }, [top4el("span", { class: "lf-top4-loading", text: "تحميل الشخصيات…" })]);
    picker.appendChild(search); picker.appendChild(list);
    sec.appendChild(head); sec.appendChild(hint); sec.appendChild(slots); sec.appendChild(picker);

    var castData = null;
    function paintCount() {
      var n = top4Get(mid).length;
      var c = sec.querySelector("[data-top4-count]");
      if (c) { c.textContent = n + "/4"; c.classList.toggle("is-done", n >= 4); }
    }
    var slotNodes=[];
    function putSlot(node,index,key){
      var previous=slotNodes[index];
      if(previous)slots.replaceChild(node,previous.node);else slots.appendChild(node);
      slotNodes[index]={node:node,key:key};
    }
    function paintSlots() {
      var cur = top4Get(mid);
      for (var i = 0; i < 4; i++) (function (i) {
        var item = cur[i], key=JSON.stringify(item||null);
        if(slotNodes[i]&&slotNodes[i].key===key)return;
        if (item) {
          var chip = top4el("div", { class: "lf-top4-slot is-filled" }, [
            top4Portrait(item),
            top4el("span", { class: "lf-top4-slot-name", text: item.name }),
            top4el("span", { class: "lf-top4-rank", text: "#" + (i + 1) })
          ]);
          var rm = top4el("button", { type: "button", class: "lf-top4-remove", "aria-label": "إزالة " + item.name, text: "×" });
          rm.addEventListener("click", function (e) {
            e.stopPropagation();
            var l = top4Get(mid); l.splice(i, 1); top4Set(mid, l);
            paintSlots(); paintCount(); updateCandidates();
          });
          chip.appendChild(rm);
          putSlot(chip,i,key);
        } else {
          var empty = top4el("button", { type: "button", class: "lf-top4-slot is-empty", "aria-label": "إضافة شخصية" }, [
            top4el("span", { class: "lf-top4-plus", text: "+" }),
            top4el("span", { class: "lf-top4-slot-name", text: "شخصية " + (i + 1) })
          ]);
          empty.addEventListener("click", function () { openPicker(); });
          putSlot(empty,i,key);
        }
      })(i);
    }
    var candidateUpdates = [];
    function updateCandidates(){candidateUpdates.forEach(function(update){update();});}
    function paintList() {
      candidateUpdates = [];
      if (!castData) return;
      var q = (search.value || "").trim().toLowerCase();
      var chosen = top4Get(mid).map(function (x) { return x.name; });
      list.textContent = "";
      var shown = 0;
      castData.forEach(function (c) {
        var nm = c.name || c.latin || "";
        if (!nm) return;
        if (q && nm.toLowerCase().indexOf(q) < 0 && String(c.latin || "").toLowerCase().indexOf(q) < 0) return;
        if (shown >= 24) return;
        shown++;
        var taken = chosen.indexOf(nm) >= 0;
        var row = top4el("button", { type: "button", class: "lf-top4-cand" + (taken ? " is-taken" : "") }, [
          top4Portrait({ name: nm, img: c.img || c.image }),
          top4el("span", { class: "lf-top4-cand-name", text: nm }),
          top4el("span", { class: "lf-top4-cand-add", text: taken ? "✓" : "إضافة" })
        ]);
        candidateUpdates.push(function(){
          var selected=top4Get(mid).some(function(item){return item.name===nm;});
          row.setAttribute("class","lf-top4-cand"+(selected?" is-taken":""));
          row.children[2].textContent=selected?"✓":(language==="en"?"Add":"إضافة");
        });
        row.addEventListener("click", function () {
          var l = top4Get(mid);
          var at = l.findIndex(function (x) { return x.name === nm; });
          if (at >= 0) l.splice(at, 1);
          else { if (l.length >= 4) return; l.push({ name: nm, img: c.img || c.image || "" }); }
          top4Set(mid, l);
          paintSlots(); paintCount(); updateCandidates();
          if (top4Get(mid).length >= 4) picker.hidden = true;
        });
        list.appendChild(row);
      });
      if (!shown) list.appendChild(top4el("span", { class: "lf-top4-loading", text: "لا نتائج" }));
    }
    function openPicker() {
      picker.hidden = false;
      if (!castData) top4LoadCast(mid, function (cast) { castData = cast; paintList(); });
      else paintList();
      try { search.focus(); } catch (e) {}
    }
    search.addEventListener("input", paintList);
    paintSlots(); paintCount();
    return sec;
  }

  function directChildOf(parent, node) {
    while (node && node.parentElement && node.parentElement !== parent) node = node.parentElement;
    return node && node.parentElement === parent ? node : null;
  }
  function findReviewSheet() {
    var sheet = doc.querySelector(".nc-sheet[data-review-mid]");
    if (sheet) return sheet;
    var sheets = doc.querySelectorAll(".nc-sheet");
    for (var s = 0; s < sheets.length; s++) {
      var txt = sheets[s].textContent || "";
      if (txt.indexOf("نشر المراجعة") >= 0 && txt.indexOf("المراجعة") >= 0) return sheets[s];
    }
    return null;
  }

  function reviewComposerCoverSource() {
    var images = doc.querySelectorAll('[data-screen-label="detail"] img');
    for (var i = 0; i < images.length; i++) {
      var rect = images[i].getBoundingClientRect();
      if (rect.width > 34 && rect.height > 52 && rect.height / rect.width > 1.12) {
        return images[i].currentSrc || images[i].src || "";
      }
    }
    return "";
  }

  function reviewComposerText(node) {
    return String((node && node.textContent) || "").replace(/\s+/g, " ").trim();
  }

  function reviewMetricMeta(text, index) {
    if (/القصة|السرد|العمق/.test(text)) return { kind: "story", icon: "book-open", hint: "الحبكة وتشويقها" };
    if (/الرسومات|الأسلوب/.test(text)) return { kind: "art", icon: "pen-tool", hint: "جودة الرسم والتصميم" };
    if (/الشخصيات/.test(text)) return { kind: "characters", icon: "users", hint: "تطور الشخصيات وعمقها" };
    if (/بناء العالم|الفائدة|التنظيم/.test(text)) return { kind: "world", icon: "globe", hint: "اتساع العالم وقواعده" };
    return { kind: "metric-" + index, icon: "feather", hint: "تقييم تفصيلي" };
  }
  function reviewMetricScore(metric) {
    if (!metric) return 0;
    var stored = Number(metric.getAttribute("data-lf-review-score")) || 0;
    if (stored) return stored;
    var buttons = metric.querySelectorAll("button");
    var score = 0;
    for (var i = 0; i < buttons.length; i++) {
      var controlFill = Number(buttons[i].getAttribute("data-rating-fill"));
      if (controlFill > 0) {
        score = i + Math.min(1, controlFill);
        continue;
      }
      var pressed = buttons[i].getAttribute("aria-pressed") === "true";
      var glyph = buttons[i].querySelector("span");
      var selected = glyph && String(glyph.style.transform || "").indexOf("scale(1)") >= 0;
      if (pressed || selected) {
        var overlay = glyph && glyph.querySelector("span[style]");
        var fill = overlay ? parseFloat(overlay.style.width) / 100 : 1;
        score = i + (fill > 0 && fill <= 1 ? fill : 1);
      }
    }
    return score;
  }
  function reviewPickValue(event, button, index) {
    var rect = button.getBoundingClientRect();
    return index + (event.detail === 0 ? 1 : event.clientX - rect.left < rect.width / 2 ? 0.5 : 1);
  }
  function reviewOverallState(scores) {
    var rated = scores.filter(function (score) { return score > 0; });
    return {
      complete: rated.length,
      value: scores.length && rated.length === scores.length
        ? rated.reduce(function (total, score) { return total + score; }, 0) / scores.length : null
    };
  }
  function paintReviewOverallSummary(sheet) {
    if (!sheet) return;
    var summary = sheet.querySelector(".lf-review-composer-overall-summary");
    if (!summary) return;
    var metrics = sheet.querySelectorAll(".lf-review-composer-metric");
    var state = reviewOverallState(Array.prototype.map.call(metrics, reviewMetricScore));
    var value = state.value;
    var label = value === null ? "قيّمت " + state.complete + " من " + metrics.length : "التقييم العام " + value.toFixed(1) + " من 5";
    var output = summary.querySelector("[data-lf-review-overall-value]");
    if (output) output.textContent = value === null ? "\u2014" : value.toFixed(1);
    var progress = summary.querySelector("[data-lf-review-overall-progress]");
    if (progress) progress.textContent = value === null ? label : "متوسط تقييماتك التفصيلية";
    var stars = summary.querySelectorAll(".lf-review-composer-overall-star");
    for (var s = 0; s < stars.length; s++) stars[s].classList.toggle("is-on", value !== null && (s + 1) <= Math.round(value));
    summary.setAttribute("aria-label", label);
  }
  function ensureReviewOverallSummary(sheet) {
    if (!sheet) return;
    var overall = sheet.querySelector(".lf-review-composer-overall");
    if (!overall) return;
    var summary = overall.querySelector(".lf-review-composer-overall-summary");
    if (!summary) {
      Array.prototype.slice.call(overall.children || []).forEach(function (child) { child.classList.add("lf-review-composer-overall-source"); });
      var stars = el("span", { class: "lf-review-composer-overall-stars", "aria-hidden": "true" });
      for (var i = 0; i < 5; i++) stars.appendChild(el("span", { class: "lf-review-composer-overall-star" }, extraIcon("feather")));
      summary = el("div", { class: "lf-review-composer-overall-summary", role: "status" }, [
        el("div", { class: "lf-review-composer-overall-copy" }, [
          el("strong", { text: "التقييم العام" }),
          el("span", { "data-lf-review-overall-progress": "", text: "قيّمت 0 من 4" }),
          stars
        ]),
        el("div", { class: "lf-review-composer-overall-score" }, [
          el("strong", { "data-lf-review-overall-value": "", text: "\u2014" }),
          el("small", { text: "من 5" })
        ])
      ]);
      overall.appendChild(summary);
    }
    paintReviewOverallSummary(sheet);
  }
  function paintReviewComposerProgress(sheet) {
    if (!sheet) return;
    var metrics = sheet.querySelectorAll(".lf-review-composer-metric");
    var complete = 0;
    for (var i = 0; i < metrics.length; i++) if (metrics[i].classList.contains("is-complete")) complete++;
    var steps = sheet.querySelectorAll(".lf-review-composer-steps span");
    var textarea = sheet.querySelector(".lf-review-composer-textarea");
    if (steps[0]) steps[0].classList.add("is-active");
    if (steps[1]) steps[1].classList.toggle("is-active", metrics.length > 0 && complete >= metrics.length);
    if (steps[2]) steps[2].classList.toggle("is-active", metrics.length > 0 && complete >= metrics.length && textarea && String(textarea.value || "").trim().length > 4);
    paintReviewOverallSummary(sheet);
  }
  function wireReviewComposerProgress(sheet) {
    if (!sheet || sheet.dataset.lfReviewComposerProgress) return;
    sheet.dataset.lfReviewComposerProgress = "1";
    sheet.addEventListener("click", function (event) {
      var target = event.target && event.target.closest ? event.target.closest("button") : null;
      var metric = target && target.closest ? target.closest(".lf-review-composer-metric") : null;
      if (!metric) return;
      var buttons = Array.prototype.slice.call(metric.querySelectorAll("button"));
      var score = reviewPickValue(event, target, buttons.indexOf(target));
      if (score > 0) metric.setAttribute("data-lf-review-score", String(score));
      metric.classList.add("is-complete");
      paintReviewComposerProgress(sheet);
    }, true);
    sheet.addEventListener("input", function (event) {
      if (event.target && event.target.matches && event.target.matches(".lf-review-composer-textarea")) paintReviewComposerProgress(sheet);
    }, true);
  }

  function enhanceReviewComposerSheet() {
    var sheet = findReviewSheet();
    if (!sheet) return false;
    if (sheet.classList.contains("lf-rating-sheet")) return false;
    sheet.classList.add("lf-review-composer", "lf-review-composer-v2");

    var children = Array.prototype.slice.call(sheet.children || []);
    var metricIndex = 0;
    children.forEach(function (node, index) {
      var text = reviewComposerText(node);
      var buttons = node.querySelectorAll ? node.querySelectorAll("button") : [];
      if (index === 0) node.classList.add("lf-review-composer-handle");
      if (index === 1) {
        node.classList.add("lf-review-composer-header");
        if (node.children[1]) node.children[1].classList.add("lf-review-composer-heading");
      }
      if (buttons.length === 5 && /^(القصة|الرسومات|السرد|الشخصيات|بناء العالم|الفائدة|الأسلوب|العمق|التنظيم)/.test(text)) {
        node.classList.add("lf-review-composer-metric");
        node.setAttribute("data-lf-metric-index", String(metricIndex++));
        var meta = reviewMetricMeta(text, metricIndex - 1);
        node.setAttribute("data-lf-metric-kind", meta.kind);
        if (!node.querySelector(".lf-review-composer-metric-icon")) node.insertBefore(el("span", { class: "lf-review-composer-metric-icon", "aria-hidden": "true" }, extraIcon(meta.icon)), node.firstChild || null);
        if (!node.querySelector(".lf-review-composer-metric-hint")) node.setAttribute("title", meta.hint);
      }
      if (text.indexOf("التقييم العام") === 0) node.classList.add("lf-review-composer-overall");
      if (node.tagName === "P" && /^(التقييمات التفصيلية|التوصية|المراجعة الشخصية|لحظة مميزة|صور المراجعة)/.test(text)) {
        node.classList.add("lf-review-composer-section-title");
      }
      if (buttons.length === 2 && text.indexOf("أنصح بها") >= 0) {
        node.classList.add("lf-review-composer-recommendation");
        buttons.forEach(function (button) {
          button.type = "button";
          if (!button.hasAttribute("aria-pressed")) button.setAttribute("aria-pressed", "false");
        });
        if (!node.hasAttribute("data-lf-recommendation-bound")) {
          node.setAttribute("data-lf-recommendation-bound", "true");
          node.addEventListener("click", function (event) {
            var selected = event.target && event.target.closest && event.target.closest("button");
            if (!selected || !node.contains(selected)) return;
            Array.prototype.forEach.call(node.querySelectorAll("button"), function (candidate) {
              candidate.setAttribute("aria-pressed", candidate === selected ? "true" : "false");
              candidate.classList.toggle("is-active", candidate === selected);
            });
          });
        }
      }
      if (node.tagName === "TEXTAREA") node.classList.add("lf-review-composer-textarea");
      if (/^[0-9٠-٩]+\/750/.test(text)) node.classList.add("lf-review-composer-counter");
      if (node.tagName === "BUTTON" && text.indexOf("أرفق لقطات") >= 0) node.classList.add("lf-review-composer-media");
      if (text === "يحتوي على حرق أحداث") node.classList.add("lf-review-composer-spoiler");
      if (node.tagName === "BUTTON" && (text === "نشر المراجعة" || text.indexOf("قيّم العناصر") === 0)) {
        node.classList.add("lf-review-composer-submit");
      }
      if (node.tagName === "BUTTON" && text === "إلغاء") node.classList.add("lf-review-composer-cancel");
    });

    if (!sheet.querySelector(".lf-review-composer-work")) {
      var header = sheet.querySelector(".lf-review-composer-header");
      var heading = sheet.querySelector(".lf-review-composer-heading");
      if (heading && !heading.querySelector(".lf-review-composer-intro")) heading.appendChild(el("span", { class: "lf-review-composer-intro", text: "شارك رأيك وساعد القرّاء على اكتشاف أعمال رائعة" }));
      var titleNodes = heading ? heading.querySelectorAll("p") : [];
      var workTitle = titleNodes[1] ? reviewComposerText(titleNodes[1]) : "عملك المختار";
      var typeBadge = heading && heading.querySelector(".lf-type-badge");
      var coverSrc = reviewComposerCoverSource();
      var cover = coverSrc
        ? el("img", { class: "lf-review-composer-cover", src: coverSrc, alt: "" })
        : el("span", { class: "lf-review-composer-cover is-placeholder", text: String(workTitle || "L").slice(0, 1) });
      var workCard = el("section", { class: "lf-review-composer-work", "aria-label": "العمل قيد المراجعة" }, [
        cover,
        el("div", { class: "lf-review-composer-work-copy" }, [
          el("span", { class: "lf-review-composer-kicker", text: "مسودة مراجعتك" }),
          el("strong", { text: workTitle }),
          el("span", { class: "lf-review-composer-work-meta", text: typeBadge ? reviewComposerText(typeBadge) : "Lorefy" })
        ]),
        el("span", { class: "lf-review-composer-pulse", "aria-hidden": "true" })
      ]);
      var steps = el("div", { class: "lf-review-composer-steps", "aria-label": "مراحل كتابة المراجعة" }, [
        el("span", { class: "is-active", text: "1  قيّم" }),
        el("span", { text: "2  اكتب" }),
        el("span", { text: "3  انشر" })
      ]);
      var anchor = header && header.nextSibling;
      sheet.insertBefore(workCard, anchor);
      sheet.insertBefore(steps, workCard.nextSibling);
    }
    var metricNodes = Array.prototype.slice.call(sheet.querySelectorAll(":scope > .lf-review-composer-metric"));
    if (metricNodes.length && !sheet.querySelector(".lf-review-composer-metrics-grid")) {
      var grid = el("div", { class: "lf-review-composer-metrics-grid", "aria-label": "التقييمات التفصيلية" });
      sheet.insertBefore(grid, metricNodes[0]);
      metricNodes.forEach(function (metric) { grid.appendChild(metric); });
    }
    ensureReviewOverallSummary(sheet);
    wireReviewComposerProgress(sheet);
    paintReviewComposerProgress(sheet);
    sheet.dataset.lfReviewComposer = "1";
    if (sheet.querySelector("i[data-lucide]")) scheduleCharacterActionIcons();
    return true;
  }

  function enhanceReviewSheet() {
    var sheet = findReviewSheet();
    if (!sheet) return false;
    if (sheet.classList.contains("lf-rating-sheet")) {
      var ranking = sheet.querySelector("[data-lf-review-ranking]");
      if (ranking && !ranking.querySelector(".lf-top4-section")) ranking.appendChild(buildTop4Section(sheet.getAttribute("data-review-mid"), sheet.closest('[dir="ltr"]') ? "en" : "ar"));
      return true;
    }
    enhanceReviewComposerSheet();
    var mid = sheet.getAttribute("data-review-mid") || (workContext({}).workId || "");
    if (!mid) return false;
    var existing = sheet.querySelector(".lf-top4-section");
    if (existing) { if (existing.getAttribute("data-mid") === mid) return true; existing.remove(); }
    /* insert right above the publish button */
    var btns = sheet.querySelectorAll("button");
    var pub = null;
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].textContent || "").trim();
      if (t === "نشر المراجعة" || t.indexOf("قيّم العناصر") === 0) { pub = btns[i]; break; }
    }
    var sec = buildTop4Section(mid);
    var anchor = pub ? directChildOf(sheet, pub) : null;
    if (anchor) sheet.insertBefore(sec, anchor);
    else sheet.appendChild(sec);
    return true;
  }
  function wireReviewSheetObserver() {
    if (!global.MutationObserver || doc.__lorefyTop4Observer) return;
    doc.__lorefyTop4Observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].addedNodes || [];
        for (var n = 0; n < nodes.length; n++) {
          var node = nodes[n];
          if (!node || node.nodeType !== 1) continue;
          if ((node.matches && node.matches(".nc-sheet[data-review-mid]")) ||
              (node.querySelector && node.querySelector(".nc-sheet[data-review-mid]"))) {
            enhanceReviewSheet();
            scheduleGrowthMaintenance();
            return;
          }
        }
      }
    });
    doc.__lorefyTop4Observer.observe(doc.body || doc.documentElement, { childList: true, subtree: true });
  }

  /* ════════════════════════════════════════════════════════════════════
     PROGRESS TRACKER ENHANCER  (steppers + quick chips on the save sheet)
     ════════════════════════════════════════════════════════════════════ */
  var nativeInputSetter = (function () {
    try { return Object.getOwnPropertyDescriptor(global.HTMLInputElement.prototype, "value").set; } catch (e) { return null; }
  })();
  function reactSetInput(input, val) {
    try {
      if (nativeInputSetter) nativeInputSetter.call(input, String(val));
      else input.value = String(val);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (e) {}
  }
  function stepBtn(label, cls) { return el("button", { type: "button", class: "lf-step-btn " + (cls || ""), text: label }); }

  function enhanceTrackerSheet() {
    var sheets = doc.querySelectorAll(".nc-sheet");
    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var txt = sheet.textContent || "";
      if (txt.indexOf("احفظ مكان توقفك") < 0 && txt.indexOf("عمل مستمر") < 0) continue;
      if (sheet.querySelector(".lf-step-btn")) return true;   /* already enhanced */
      var inputs = sheet.querySelectorAll('input[type="number"]');
      for (var i = 0; i < inputs.length; i++) (function (input) {
        var lab = input.closest("label"); if (!lab || lab.querySelector(".lf-step-btn")) return;
        lab.classList.add("lf-step-label");
        var minus = stepBtn("−", "lf-step-minus");
        var plus = stepBtn("+", "lf-step-plus");
        minus.addEventListener("click", function () { var v = parseInt(input.value, 10) || 0; if (v > 0) reactSetInput(input, v - 1); });
        plus.addEventListener("click", function () { var v = parseInt(input.value, 10) || 0; reactSetInput(input, v + 1); });
        lab.appendChild(minus); lab.appendChild(plus);
      })(inputs[i]);
      /* quick chips: bump the chapter (first number input) fast */
      if (inputs.length && !sheet.querySelector(".lf-step-chips")) {
        var target = inputs[0];
        var chips = el("div", { class: "lf-step-chips" });
        [1, 5, 10].forEach(function (n) {
          var c = el("button", { type: "button", class: "lf-step-chip", text: "+" + n });
          c.addEventListener("click", function () { var v = parseInt(target.value, 10) || 0; reactSetInput(target, v + n); });
          chips.appendChild(c);
        });
        var grid = target.closest("div[style]");
        if (grid && grid.parentElement) grid.parentElement.insertBefore(chips, grid.nextSibling);
      }
      return true;
    }
    return false;
  }

  /* ── boot ──────────────────────────────────────────────────────────── */
  function labelIconOnlyButtons(scope) {
    var root = scope || doc;
    var buttons = root.querySelectorAll ? root.querySelectorAll("button") : [];
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (!b || b.getAttribute("aria-label") || b.getAttribute("title")) continue;
      if ((b.textContent || "").trim()) continue;
      var html = b.innerHTML || "";
      var label = "";
      if (html.indexOf("M5 12h14") >= 0) label = "\u0625\u0636\u0627\u0641\u0629 \u0644\u0644\u0642\u0627\u0626\u0645\u0629";
      else if (html.indexOf("M18 6") >= 0 || html.indexOf("M6 18") >= 0) label = "\u0625\u063A\u0644\u0627\u0642";
      else if (html.indexOf("m21 21-4.3-4.3") >= 0) label = "\u0628\u062d\u062b \u0639\u0646 \u0623\u0634\u062e\u0627\u0635";
      if (label) b.setAttribute("aria-label", label);
    }
  }

  function enhanceReadingChoices(sheet) {
    var candidates=Array.from(sheet.querySelectorAll('div')).filter(function(option){
      return /^(أقرأ حالياً|تم القراءة|قائمة الأمنيات|أرغب بالقراءة|متوقف مؤقتًا|توقفت نهائيًا|Reading|Completed|Wishlist|Want to read|Paused|Dropped)$/.test(option.textContent.trim()) && option.children.length<=2 && !option.querySelector('button,input,select');
    });
    var options=candidates.filter(function(option){return !candidates.some(function(parent){return parent!==option&&parent.contains(option);});});
    if(options.length<3 || options.some(function(option){return option.parentElement!==options[0].parentElement;}))return;
    sheet.classList.add('lf-work-status-sheet');
    var group=options[0].parentElement;
    group.classList.add('lf-reading-options');group.setAttribute('role','radiogroup');group.setAttribute('aria-label',uiText('حالة القراءة','Reading status'));
    var selected=options.find(function(option){return !!option.querySelector('svg');})||options[0];
    options.forEach(function(option){
      option.setAttribute('role','radio');option.setAttribute('aria-checked',String(!!option.querySelector('svg')));option.tabIndex=option===selected?0:-1;
      if(option.dataset.lfReadingChoice)return;
      option.dataset.lfReadingChoice='1';
      option.addEventListener('keydown',function(event){
        if(event.target!==option)return;
        var index=options.indexOf(option),next=index;
        if(event.key==='Enter'||event.key===' '){event.preventDefault();option.click();return;}
        if(event.key==='ArrowDown')next=(index+1)%options.length;
        else if(event.key==='ArrowUp')next=(index+options.length-1)%options.length;
        else if(event.key==='Home')next=0;
        else if(event.key==='End')next=options.length-1;
        else return;
        event.preventDefault();options[next].click();options[next].focus();
      });
    });
  }

  var customizeDialogSequence = 0;
  function enhanceCustomizeNavigation(sheet) {
    var group = sheet.querySelector('.lf-customize-tabs');
    if (!group) return;
    var tabs = Array.from(group.querySelectorAll('button'));
    var panels = [sheet.querySelector('.lf-customize-profile-panel'), sheet.querySelector('.lf-customize-appearance-panel')];
    if (tabs.length !== 2 || panels.some(function (panel) { return !panel; })) return;
    var prefix = sheet.dataset.lfCustomizeId || (sheet.dataset.lfCustomizeId = 'lf-customize-' + (++customizeDialogSequence));
    function attr(node, name, value) { if (node.getAttribute(name) !== value) node.setAttribute(name, value); }
    tabs.forEach(function (tab, index) {
      var tabId = prefix + '-tab-' + index, panelId = prefix + '-panel-' + index;
      attr(tab, 'id', tabId); attr(tab, 'aria-controls', panelId);
      attr(panels[index], 'id', panelId); attr(panels[index], 'role', 'tabpanel'); attr(panels[index], 'aria-labelledby', tabId);
      var stop = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      if (tab.tabIndex !== stop) tab.tabIndex = stop;
      if (tab.dataset.lfCustomizeKeys) return;
      tab.dataset.lfCustomizeKeys = '1';
      tab.addEventListener('click', function () {
        tabs.forEach(function (item, position) {
          var stop = position === index ? 0 : -1;
          if (item.tabIndex !== stop) item.tabIndex = stop;
        });
      });
      tab.addEventListener('keydown', function (event) {
        if (event.target !== tab) return;
        var next, rtl = doc.documentElement.getAttribute('dir') === 'rtl';
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else if (event.key === 'ArrowRight') next = (index + (rtl ? tabs.length - 1 : 1)) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + (rtl ? 1 : tabs.length - 1)) % tabs.length;
        else return;
        event.preventDefault(); tabs[next].click(); tabs[next].focus();
      });
    });
  }
  function legacySheetLabel(sheet, heading) {
    var labels = [
      ['lf-settings-sheet', uiText('الإعدادات','Settings')],
      ['lf-customize-sheet', uiText('تخصيص حسابك','Customize your profile')],
      ['lf-work-cover-sheet', uiText('اختر الغلاف','Choose cover')],
      ['lf-work-status-sheet', uiText('حالة القراءة','Reading status')]
    ];
    for (var i = 0; i < labels.length; i++) if (sheet.classList.contains(labels[i][0])) return labels[i][1];
    return heading && heading.textContent.trim() || uiText('خيارات العمل','Work options');
  }

  function workReviewActionLabel(button){
    if(button.querySelector('path[d^="M7.9 20"]'))return uiText('الردود','Replies');
    if(button.querySelector('path[d^="M19 14"]'))return uiText('إعجاب','Like');
    if(button.querySelector('path[d^="M7 10"]'))return uiText('توصية','Recommend');
    if(button.querySelector('path[d^="M3 6h18"]'))return uiText('حذف','Delete');
    if(button.querySelector('circle[cx="18"][cy="5"]'))return uiText('مشاركة','Share');
    return '';
  }

  function enhanceInteractionAccessibility(scope) {
    var root = scope || doc;
    labelIconOnlyButtons(root);
    Array.from(root.querySelectorAll ? root.querySelectorAll('.nc-sheet') : []).forEach(enhanceReadingChoices);
    Array.from(root.querySelectorAll ? root.querySelectorAll('.lf-customize-sheet') : []).forEach(enhanceCustomizeNavigation);
    Array.from(root.querySelectorAll ? root.querySelectorAll('.nc-sheet:has(.lf-cover-choice)') : []).forEach(function(sheet){sheet.classList.add('lf-work-cover-sheet');});
    // Legacy React sheets close through their overlay handler; keep that
    // state transition instead of removing React-owned nodes directly.
    Array.from(root.querySelectorAll ? root.querySelectorAll('.nc-sheet:not([data-lf-dialog-wired])') : []).forEach(function (sheet) {
      if (sheet.closest('[role="dialog"]') || sheet.getAttribute('role') === 'dialog') return;
      sheet.dataset.lfDialogWired = '1';
      sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-modal','true');
      var heading = sheet.querySelector('h1,h2,h3,strong');
      sheet.setAttribute('aria-label', legacySheetLabel(sheet, heading));
      var overlay = sheet.parentElement;
      var initial = sheet.querySelector('[aria-label="إغلاق"],[aria-label="Close"]') || sheet.querySelector('button,input,select,textarea,[tabindex="0"]');
      var release = bindDialogKeys(sheet, function () {
        var close = sheet.matches('.lf-work-status-sheet,.lf-work-cover-sheet') && sheet.querySelector('[aria-label="إغلاق"],[aria-label="Close"]');
        if (close && close.isConnected) { if (!close.disabled) close.click(); }
        else if (overlay && overlay.isConnected) overlay.click();
      }, initial);
      var cleanup = new MutationObserver(function () {
        if (sheet.isConnected) return;
        cleanup.disconnect(); release();
      });
      cleanup.observe(overlay.parentElement || doc.body,{childList:true,subtree:true});
    });

    var links = root.querySelectorAll ? root.querySelectorAll("a[href]") : [];
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = String(link.getAttribute("href") || "").toLowerCase();
      var socialLabel = "";
      if (href.indexOf("instagram.com") >= 0) socialLabel = "Instagram";
      else if (href.indexOf("tiktok.com") >= 0) socialLabel = "TikTok";
      else if (href.indexOf("x.com") >= 0 || href.indexOf("twitter.com") >= 0) socialLabel = "X";
      else if (href.indexOf("youtube.com") >= 0 || href.indexOf("youtu.be") >= 0) socialLabel = "YouTube";
      if (!socialLabel) continue;
      link.classList.add("lf-social-touch-target");
      if (!link.getAttribute("aria-label")) link.setAttribute("aria-label", socialLabel);
      if (!link.getAttribute("title")) link.setAttribute("title", socialLabel);
    }

    var buttons = root.querySelectorAll ? root.querySelectorAll("button") : [];
    for (var bIndex = 0; bIndex < buttons.length; bIndex++) {
      var button = buttons[bIndex];
      var text = (button.textContent || "").replace(/\s+/g, " ").trim();
      var hasIcon = !!button.querySelector("svg");
      if(hasIcon&&button.closest('.lf-work-reader-tabs + div,.lf-work-status-sheet')){
        var actionLabel=workReviewActionLabel(button);
        if(actionLabel){button.setAttribute('aria-label',actionLabel+(text?' · '+text:''));button.setAttribute('title',actionLabel);}
      }
      var inRating = !!button.closest(".lf-rating-stars, [data-rating-control]");
      var ratingGroupButtons = button.parentElement && button.querySelector('svg path[d^="M12 2.6"]') ? button.parentElement.querySelectorAll(":scope > button") : [];
      var isReviewRating = ratingGroupButtons.length === 5 && !!button.querySelector('svg path[d^="M12 2.6"]');
      if (isReviewRating && !button.getAttribute("aria-label")) {
        var ratingLabelNode = button.parentElement.previousElementSibling;
        var ratingLabel = ratingLabelNode ? (ratingLabelNode.textContent || "").trim() : "\u0627\u0644\u062a\u0642\u064a\u064a\u0645";
        var ratingValue = Array.prototype.indexOf.call(ratingGroupButtons, button) + 1;
        button.setAttribute("aria-label", ratingLabel + " " + ratingValue + " \u0645\u0646 5");
        button.setAttribute("title", ratingLabel + " " + ratingValue + " \u0645\u0646 5");
      }
      if (hasIcon && !inRating && text.length < 2) button.classList.add("lf-touch-target");
      if (!inRating && !button.closest(".lf-character-rank-board") && !button.classList.contains("lf-touch-target")) {
        // CSS minimums preserve large controls without forcing synchronous layout.
        button.classList.add("lf-touch-target");
      }
      if (!button.getAttribute("aria-label") && !button.getAttribute("title") && !text) {
        var iconHtml = button.innerHTML || "";
        var inferred = "";
        if (/M18 6|M6 18|m18 6/i.test(iconHtml)) inferred = "\u0625\u063a\u0644\u0627\u0642";
        else if (/circle cx="18" cy="5"|circle cx="6" cy="12"/i.test(iconHtml)) inferred = "\u0645\u0634\u0627\u0631\u0643\u0629";
        else if (/M3 6h18|M19 6v14/i.test(iconHtml)) inferred = "\u062d\u0630\u0641";
        else if (button.closest(".lf-detail-action-row-with-characters")) inferred = "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u063a\u0644\u0627\u0641";
        else if (button.closest(".lf-search-result")) inferred = "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0639\u0645\u0644 \u0644\u0644\u0645\u0643\u062a\u0628\u0629";
        else if (button.closest(".lf-profile-favorites")) inferred = "\u062a\u062d\u0631\u064a\u0631 \u0627\u0644\u0645\u0641\u0636\u0644\u0629";
        if (inferred) {
          button.setAttribute("aria-label", inferred);
          button.setAttribute("title", inferred);
        }
      }
      if (button.getAttribute("aria-label") === "\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0641\u0635\u0648\u0644") {
        var syncChapterAlertState = function (target) {
          var background = String(target.style.background || target.style.backgroundColor || "").replace(/\s+/g, "");
          target.setAttribute("aria-pressed", background.indexOf("123,47,214") >= 0 ? "true" : "false");
        };
        syncChapterAlertState(button);
        if (!button.dataset.lfAlertStateWired) {
          button.dataset.lfAlertStateWired = "1";
          button.addEventListener("click", function (event) {
            var target = event.currentTarget;
            setTimeout(function () { syncChapterAlertState(target); }, 0);
          });
        }
      }
    }

    var inputs = root.querySelectorAll ? root.querySelectorAll("input, textarea, select") : [];
    for (var inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
      var input = inputs[inputIndex];
      if (!input.getAttribute("aria-label") && !input.getAttribute("aria-labelledby")) {
        var placeholder = (input.getAttribute("placeholder") || "").trim();
        if (placeholder) input.setAttribute("aria-label", placeholder);
      }
    }

    var cards = root.querySelectorAll ? root.querySelectorAll("article.lf-search-result, article.lf-library-card") : [];
    for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
      var card = cards[cardIndex];
      card.classList.add("lf-clickable-card");
      if (!card.getAttribute("role")) card.setAttribute("role", "button");
      if (!card.hasAttribute("tabindex")) card.setAttribute("tabindex", "0");
      if (!card.getAttribute("aria-label")) {
        var title = card.querySelector("strong, h2, h3, [data-title]");
        var titleText = title ? (title.textContent || title.getAttribute("data-title") || "").trim() : "";
        if (!titleText) titleText = (card.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90);
        card.setAttribute("aria-label", titleText ? "\u0641\u062a\u062d " + titleText : "\u0641\u062a\u062d \u0627\u0644\u0639\u0645\u0644");
      }
      if (!card.dataset.lfKeyboardWired) {
        card.dataset.lfKeyboardWired = "1";
        card.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (event.target && event.target.closest && event.target.closest("button, a, input")) return;
          event.preventDefault();
          event.currentTarget.click();
        });
      }
    }

    var libraryTabs = root.querySelectorAll ? root.querySelectorAll(".lf-library-tabs button") : [];
    for (var tabIndex = 0; tabIndex < libraryTabs.length; tabIndex++) {
      var tab = libraryTabs[tabIndex];
      var active = tab.classList.contains("is-active");
      tab.setAttribute("aria-pressed", active ? "true" : "false");
      if (active && tab.dataset.lfVisibleSelection !== "1") {
        tab.dataset.lfVisibleSelection = "1";
        try { tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: global.LorefyInterfacePreferences ? global.LorefyInterfacePreferences.scrollBehavior() : "smooth" }); } catch (e) {}
      } else if (!active) {
        delete tab.dataset.lfVisibleSelection;
      }
    }

    var sortButtons = root.querySelectorAll ? root.querySelectorAll(".lf-search-header > div:nth-of-type(3) > button") : [];
    for (var sortIndex = 0; sortIndex < sortButtons.length; sortIndex++) {
      var sortButton = sortButtons[sortIndex];
      var color = String(sortButton.style.color || "").replace(/\s+/g, "");
      var selected = color.indexOf("123,47,214") >= 0 || color.toLowerCase() === "#7b2fd6" || sortButton.classList.contains("is-active");
      sortButton.setAttribute("aria-pressed", selected ? "true" : "false");
    }
    return true;
  }
  var growthMaintenancePending = false;
  function growthIdle(cb, timeout) {
    if (global.requestIdleCallback) global.requestIdleCallback(cb, { timeout: timeout || 900 });
    else setTimeout(cb, 80);
  }

  var K_COMMUNITY_DISLIKES = "lorefy.communityDislikes.v1";
  var K_COMMUNITY_MY_DISLIKES = "lorefy.communityMyDislikes.v1";
  var K_COMMUNITY_MY_LIKES = "lorefy.communityMyLikes.v1";
  var K_COMMUNITY_LIKES = "lorefy.communityLikes.v1";
  var communityReactionJobs = new Map();
  var communityReactionKeys = [K_COMMUNITY_LIKES,K_COMMUNITY_DISLIKES,K_COMMUNITY_MY_LIKES,K_COMMUNITY_MY_DISLIKES];
  function communityReactionScope(key) {
    var backend=global.LorefyBackend;
    return String(backend && backend.user && backend.user.id || 'local')+'|'+key;
  }
  function communityReactionSnapshot(key) {
    return communityReactionKeys.map(function (name) { return read(name,{})[key]; });
  }
  function beginCommunityReaction(card,key) {
    var scope=communityReactionScope(key);
    if (communityReactionJobs.has(scope)) return null;
    var backend=global.LorefyBackend,request={key:key,scope:scope,backend:backend,
      owner:backend && backend.user && backend.user.id,client:backend && backend.client,
      epoch:backend && backend._communityEpoch,before:communityReactionSnapshot(key)};
    communityReactionJobs.set(scope,request);
    return request;
  }
  function communityReactionCurrent(request) {
    var backend=global.LorefyBackend;
    return backend===request.backend && request.owner===(backend && backend.user && backend.user.id)
      && request.client===(backend && backend.client) && request.epoch===(backend && backend._communityEpoch);
  }
  function syncCommunityServerReactions(card,key) {
    var raw=card.getAttribute && card.getAttribute('data-review-reactions');
    if (!raw || card.__lorefyReactionSnapshot===raw || communityReactionJobs.has(communityReactionScope(key))) return;
    try {
      var values=JSON.parse(raw);
      if (!Array.isArray(values) || values.length!==4) return;
      values=[Math.max(0,Number(values[0])||0),Math.max(0,Number(values[1])||0),values[2]===true,values[3]===true];
      communityReactionKeys.forEach(function (name,index) {
        var saved=read(name,{});if (saved[key]!==values[index]) { saved[key]=values[index];write(name,saved); }
      });
      card.__lorefyReactionSnapshot=raw;
    } catch (ignore) {}
  }
  function finishCommunityReaction(request,synced) {
    if (communityReactionJobs.get(request.scope)!==request) return;
    communityReactionJobs.delete(request.scope);
    if (!communityReactionCurrent(request)) return;
    if (!synced) {
      communityReactionKeys.forEach(function (name,index) {
        var saved=read(name,{});
        if (saved[request.key]!==request.after[index]) return;
        if (request.before[index]===undefined) delete saved[request.key]; else saved[request.key]=request.before[index];
        write(name,saved);
      });
      toastSafe(uiText('تعذر تأكيد حفظ التفاعل. حاول مجددًا.','Could not confirm your reaction. Please try again.'));
    }
    syncCommunityReactionViews(request.key);
  }
  var K_ACTIVE_REVIEW = "lorefy.communityActiveReview.v1";
  var K_ACTIVE_REVIEW_ID = "lorefy.communityActiveReviewId.v1";
  var K_REVIEW_DETAIL_DISLIKES = "lorefy.reviewDetailDislikes.v1";
  var K_REVIEW_DETAIL_MY_DISLIKES = "lorefy.reviewDetailMyDislikes.v1";
  var K_REVIEW_SAVED = "lorefy.review.saved.v1";

  function communityHash(text) {
    var h = 0;
    text = String(text || "");
    for (var i = 0; i < text.length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
    return "r" + Math.abs(h).toString(36);
  }
  function communityCardKey(card) {
    var reviewId = card && card.getAttribute && card.getAttribute("data-review-id");
    if (reviewId) return "review:" + String(reviewId).trim();
    try {
      var clone = card.cloneNode(true);
      var controls = clone.querySelectorAll("button, svg");
      for (var i = 0; i < controls.length; i++) controls[i].remove();
      return communityHash((clone.textContent || "").replace(/\s+/g, " ").trim().slice(0, 220));
    } catch (e) {
      return communityHash((card && card.textContent) || "");
    }
  }
  function cloudReviewId(node) {
    var value = node && node.getAttribute && node.getAttribute("data-review-id");
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")) ? value : "";
  }
  async function persistReviewReaction(node, kind, active) {
    var backend = global.LorefyBackend;
    var reviewId = cloudReviewId(node);
    if (!reviewId || !backend || backend.mode !== "live" || !backend.setReviewReaction) return false;
    var timer;
    try {
      await Promise.race([backend.setReviewReaction(reviewId, kind, active),new Promise(function (_,reject) {
        timer=global.setTimeout(function () { reject(new Error('Reaction timeout')); },14000);
      })]);
      return true;
    } catch (error) {
      console.warn("[Lorefy] reaction sync:", error);
      return false;
    } finally { global.clearTimeout(timer); }
  }
  function renderThumbsDownIcon() {
    return '<svg class="lf-community-dislike-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"></path></svg>';
  }
  function setCommunityActionLabel(btn, label, extraClass) {
    if (!btn) return;
    label = uiText(label, { "تعليق":"Reply", "حفظ":"Save", "لايك":"Like", "مشاركة":"Share", "حذف المراجعة":"Delete review" }[label] || label);
    btn.classList.add("lf-community-card-action");
    if (extraClass) btn.classList.add(extraClass);
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
    var visibleLabel = btn.querySelector(".lf-community-action-label");
    if (visibleLabel) visibleLabel.remove();
  }
  function setCommunityCountLabel(btn, label, count) {
    if (!btn) return;
    var value = Math.max(0, parseInt(count || 0, 10) || 0);
    var english = { "إعجاب":"Like", "عدم إعجاب":"Dislike" }[label] || label;
    var text = uiText(label, english) + uiText("، ", ", ") + new Intl.NumberFormat("en").format(value);
    var span = btn.querySelector("span:not(.lf-community-action-label)");
    var display = value >= 1000 ? new Intl.NumberFormat("en", { notation:"compact", maximumFractionDigits:1 }).format(value) : String(value);
    if (span && span.textContent !== display) span.textContent = display;
    btn.setAttribute("aria-label", text);
    btn.setAttribute("title", text);
  }
  function paintCommunityDislike(btn, key) {
    var counts = read(K_COMMUNITY_DISLIKES, {});
    var mine = read(K_COMMUNITY_MY_DISLIKES, {});
    var count = Math.max(0, parseInt(counts[key] || 0, 10) || 0);
    var span = btn.querySelector("span:not(.lf-community-action-label)");
    if (!span) {
      span = doc.createElement("span");
      btn.appendChild(span);
    }
    btn.classList.toggle("is-active", !!mine[key]);
    btn.setAttribute("aria-pressed", mine[key] ? "true" : "false");
    setCommunityCountLabel(btn, "عدم إعجاب", count);
  }
  function paintCommunityLike(btn, key) {
    var counts = read(K_COMMUNITY_LIKES, {});
    var mine = read(K_COMMUNITY_MY_LIKES, {});
    var count = Math.max(0, parseInt(counts[key] || 0, 10) || 0);
    var span = btn.querySelector("span:not(.lf-community-action-label)");
    if (!span) {
      span = doc.createElement("span");
      btn.appendChild(span);
    }
    btn.classList.toggle("is-active", !!mine[key]);
    btn.setAttribute("aria-pressed", mine[key] ? "true" : "false");
    setCommunityCountLabel(btn, "إعجاب", count);
  }
  function wireCommunityLike(btn, card, dislikeBtn) {
    if (!btn || !card) return;
    var key = communityCardKey(card);
    syncCommunityServerReactions(card,key);
    var counts = read(K_COMMUNITY_LIKES, {});
    if (counts[key] == null) {
      var initial = btn.querySelector("span:not(.lf-community-action-label)");
      counts[key] = Math.max(0, parseInt((initial && initial.textContent) || 0, 10) || 0);
      write(K_COMMUNITY_LIKES, counts);
    }
    paintCommunityLike(btn, key);
    if (btn.dataset.lfCommunityLikeWired) return;
    btn.dataset.lfCommunityLikeWired = "1";
    btn.addEventListener("click", async function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      if (btn.dataset.lfReactionSync === "1") return;
      var request=beginCommunityReaction(card,key);if (!request) return;
      var likes = read(K_COMMUNITY_MY_LIKES, {});
      var likeCounts = read(K_COMMUNITY_LIKES, {});
      var adding = !likes[key];
      btn.dataset.lfReactionSync="1";
      var hadDislike=!!read(K_COMMUNITY_MY_DISLIKES,{})[key];
      if (adding) likes[key] = true; else delete likes[key];
      likeCounts[key] = Math.max(0, (parseInt(likeCounts[key] || 0, 10) || 0) + (adding ? 1 : -1));
      write(K_COMMUNITY_MY_LIKES, likes);
      write(K_COMMUNITY_LIKES, likeCounts);
      if (adding) {
        var dislikes = read(K_COMMUNITY_DISLIKES, {});
        var myDislikes = read(K_COMMUNITY_MY_DISLIKES, {});
        if (myDislikes[key]) {
          myDislikes[key] = false;
          dislikes[key] = Math.max(0, (parseInt(dislikes[key] || 0, 10) || 0) - 1);
          write(K_COMMUNITY_DISLIKES, dislikes);
          write(K_COMMUNITY_MY_DISLIKES, myDislikes);
          paintCommunityDislike(dislikeBtn, key);
        }
      }
      syncCommunityReactionViews(key);
      request.after=communityReactionSnapshot(key);
      try{
        var synced = !request.backend || request.backend.mode!=='live' || !cloudReviewId(card) ? true : await persistReviewReaction(card, "like", adding);
        if(synced&&adding&&hadDislike&&request.backend&&request.backend.mode==='live'&&cloudReviewId(card)&&communityReactionCurrent(request))synced=(await persistReviewReaction(card,"dislike",false))&&synced;
      }finally{btn.dataset.lfReactionSync="0";finishCommunityReaction(request,synced);}
    }, true);
  }
  function wireCommunityDislike(btn, card) {
    if (!btn || !card) return;
    var key = communityCardKey(card);
    syncCommunityServerReactions(card,key);
    btn.classList.add("lf-community-card-action", "lf-community-dislike-button");
    btn.setAttribute("aria-label", "دسلايك");
    btn.setAttribute("title", "دسلايك");
    if (!btn.querySelector(".lf-community-dislike-icon")) {
      var count = btn.querySelector("span:not(.lf-community-action-label)");
      btn.innerHTML = renderThumbsDownIcon() + '<span>' + ((count && count.textContent) || "0") + '</span>';
    }
    var oldLabel = btn.querySelector(".lf-community-action-label");
    if (oldLabel) oldLabel.remove();
    paintCommunityDislike(btn, key);
    if (btn.dataset.lfCommunityDislikeWired) return;
    btn.dataset.lfCommunityDislikeWired = "1";
    btn.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (btn.dataset.lfReactionSync === "1") return;
      var request=beginCommunityReaction(card,key);if (!request) return;
      btn.dataset.lfReactionSync = "1";
      var counts = read(K_COMMUNITY_DISLIKES, {});
      var mine = read(K_COMMUNITY_MY_DISLIKES, {});
      var nowMine = !mine[key];
      var hadLike = !!read(K_COMMUNITY_MY_LIKES, {})[key];
      if (nowMine) {
        var myLikes = read(K_COMMUNITY_MY_LIKES, {});
        if (myLikes[key]) {
          delete myLikes[key];
          write(K_COMMUNITY_MY_LIKES, myLikes);
          var likeCounts = read(K_COMMUNITY_LIKES, {});
          likeCounts[key] = Math.max(0, (parseInt(likeCounts[key] || 0, 10) || 0) - 1);
          write(K_COMMUNITY_LIKES, likeCounts);
        }
      }
      if (nowMine) mine[key] = true; else delete mine[key];
      counts[key] = Math.max(0, (parseInt(counts[key] || 0, 10) || 0) + (nowMine ? 1 : -1));
      write(K_COMMUNITY_DISLIKES, counts);
      write(K_COMMUNITY_MY_DISLIKES, mine);
      syncCommunityReactionViews(key);
      request.after=communityReactionSnapshot(key);
      try {
        var synced = !request.backend || request.backend.mode!=='live' || !cloudReviewId(card) ? true : await persistReviewReaction(card, "dislike", nowMine);
        if (synced && nowMine && hadLike && request.backend && request.backend.mode==='live' && cloudReviewId(card) && communityReactionCurrent(request)) synced = (await persistReviewReaction(card, "like", false)) && synced;
      } finally { btn.dataset.lfReactionSync = "0"; finishCommunityReaction(request,synced); }
    }, true);
  }
  function updateCommunityHero(page, hero) {
    var cards = Array.prototype.slice.call(page.querySelectorAll(".lf-review-card"));
    var authors = {};
    var recommends = 0;
    for (var i = 0; i < cards.length; i++) {
      var text = cards[i].textContent || "";
      var user = (text.match(/@[\w_.-]+/) || [""])[0];
      if (user) authors[user] = true;
      if (text.indexOf("يوصي بها") >= 0 || text.indexOf("أنصح بها") >= 0) recommends++;
    }
    var reviews = hero.querySelector("[data-community-stat='reviews']");
    var readers = hero.querySelector("[data-community-stat='readers']");
    var recs = hero.querySelector("[data-community-stat='recs']");
    if (reviews) reviews.textContent = String(cards.length);
    if (readers) readers.textContent = String(Object.keys(authors).length || Math.min(cards.length, 1));
    if (recs) recs.textContent = String(recommends);
  }
  function buildCommunityHero() {
    return el("section", { class: "lf-community-hero", "aria-label": "موجز المجتمع" }, [
      el("div", { class: "lf-community-hero-copy" }, [
        el("span", { class: "lf-community-kicker", text: "Lorefy Pulse" }),
        el("h2", { text: "المجتمع" }),
        el("p", { text: "مراجعات القراء، ترشيحاتهم، ونقاشات الأعمال في مكان واحد." })
      ]),
      el("div", { class: "lf-community-stats" }, [
        el("span", { class: "lf-community-stat" }, [el("strong", { "data-community-stat": "reviews", text: "0" }), el("em", { text: "مراجعة" })]),
        el("span", { class: "lf-community-stat" }, [el("strong", { "data-community-stat": "readers", text: "0" }), el("em", { text: "قارئ" })]),
        el("span", { class: "lf-community-stat" }, [el("strong", { "data-community-stat": "recs", text: "0" }), el("em", { text: "توصية" })])
      ])
    ]);
  }
  function normalizeReviewTop4Labels(scope) {
    var root = scope || doc;
    var labels = root.querySelectorAll ? root.querySelectorAll(".lf-rev-top4-label") : [];
    for (var i = 0; i < labels.length; i++) {
      var label = labels[i];
      var text = (label.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || looksLikeBrokenReviewText(text) || /[ØÙÃÂâ]/.test(text)) {
        label.textContent = "أفضل الشخصيات";
        label.setAttribute("aria-label", "أفضل الشخصيات");
      }
    }
  }
  function communityActionSvgType(button) {
    var html = String((button && button.innerHTML) || "");
    if (/M7\.9 20A9 9/.test(html)) return "comment";
    if (/M19 21 12 17 5 21/.test(html)) return "bookmark";
    if (/M17 14V2|M9 18\.12 10 14/.test(html)) return "dislike";
    if (/M19 14c1\.49|M12 21\.35|A5\.5 5\.5/.test(html)) return "like";
    if (/circle cx=["']?18["']? cy=["']?5["']?|M22 2 11 13/.test(html)) return "share";
    if (/M3 6h18|M19 6v14|M10 11v6/.test(html)) return "delete";
    if (/M7 10v12|M15 5\.88 14 10/.test(html)) return "dislike";
    return "";
  }
  function communityActionType(button) {
    var svgType = communityActionSvgType(button);
    if (svgType) return svgType;
    var text = [
      button && button.getAttribute("aria-label"),
      button && button.getAttribute("title"),
      button && button.textContent,
      button && button.innerHTML
    ].join(" ").toLowerCase();
    if (/comment|reply|تعليق|رد/.test(text)) return "comment";
    if (/bookmark|save|حفظ/.test(text)) return "bookmark";
    if (/dislike|دسلايك|thumbs-down/.test(text)) return "dislike";
    if (/like|إعجاب|thumbs-up/.test(text)) return "like";
    if (/share|مشاركة/.test(text)) return "share";
    if (/delete|trash|حذف/.test(text)) return "delete";
    return "";
  }
  function renderCommunityBookmarkIcon() {
    return '<svg class="lf-community-bookmark-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
  }
  function ensureCommunityBookmarkAction(row, actions) {
    if (!row) return null;
    var bookmark = actions && actions.bookmark;
    if (bookmark) return bookmark;
    bookmark = el("button", {
      type: "button",
      class: "lf-community-card-action lf-community-save-button",
      "aria-label": "حفظ",
      title: "حفظ",
      html: renderCommunityBookmarkIcon()
    });
    if (actions && actions.share) row.insertBefore(bookmark, actions.share);
    else row.appendChild(bookmark);
    return bookmark;
  }
  function ensureCommunityDislikeAction(row, actions) {
    if (!row) return null;
    var dislike = actions && actions.dislike;
    if (dislike) return dislike;
    dislike = el("button", {
      type: "button",
      class: "lf-community-card-action lf-community-dislike-button",
      "aria-label": "دسلايك",
      title: "دسلايك",
      html: renderThumbsDownIcon() + "<span>0</span>"
    });
    if (actions && actions.bookmark) row.insertBefore(dislike, actions.bookmark);
    else if (actions && actions.share) row.insertBefore(dislike, actions.share);
    else row.appendChild(dislike);
    return dislike;
  }
  function wireCommunityComment(btn, card) {
    if (!btn || !card || btn.dataset.lfCommunityCommentWired) return;
    btn.dataset.lfCommunityCommentWired = "1";
    btn.addEventListener("click", function () {
      write(K_ACTIVE_REVIEW, communityCardKey(card));
      var reviewId = card.getAttribute("data-review-id") || "";
      if (reviewId) write(K_ACTIVE_REVIEW_ID, reviewId);
    }, true);
  }
  function communityRenderedStarRating(root) {
    if (!root || !root.querySelectorAll) return 0;
    var rails = root.querySelectorAll("span");
    for (var i = 0; i < rails.length; i++) {
      var wrappers = rails[i].children;
      if (!wrappers || wrappers.length !== 5) continue;
      var valid = 0, total = 0;
      for (var starIndex = 0; starIndex < wrappers.length; starIndex++) {
        var wrapper = wrappers[starIndex];
        if (!wrapper.querySelector || !wrapper.querySelector("svg")) break;
        valid += 1;
        var overlay = null;
        for (var childIndex = 0; childIndex < wrapper.children.length; childIndex++) {
          var child = wrapper.children[childIndex];
          if (child.tagName === "SPAN" && child.style && child.style.width) { overlay = child; break; }
        }
        if (overlay) {
          var width = Number(String(overlay.style.width || "0").replace("%", "")) || 0;
          total += Math.max(0, Math.min(100, width)) / 100;
        }
      }
      if (valid === 5 && total > 0) return Math.round(total * 10) / 10;
    }
    return 0;
  }
  function reviewDetailRating(root, authorLeaves) {
    var direct = root && root.getAttribute && root.getAttribute("data-review-rating");
    var directScore = Number(direct);
    if (direct != null && String(direct).trim() !== "" && Number.isFinite(directScore) && directScore >= 0 && directScore <= 5) return String(Math.round(directScore * 10) / 10);
    var rendered = communityRenderedStarRating(root);
    if (rendered > 0) {
      if (root && root.setAttribute) root.setAttribute("data-review-rating", String(rendered));
      return String(rendered);
    }
    var numeric = (authorLeaves || []).filter(function (node) { return /^[1-5](?:\.[0-9])?$/.test(node.textContent.trim()); })[0];
    return numeric ? numeric.textContent.trim() : "";
  }
  function reviewAvatarSource(root, author, handle) {
    var direct = author && author.querySelector("img");
    if (direct && (direct.currentSrc || direct.src)) return direct.currentSrc || direct.src;
    var rounded = root && root.querySelector('img[style*="border-radius: 50%"], img[style*="border-radius:50%"], .lf-avatar img');
    if (rounded && (rounded.currentSrc || rounded.src)) return rounded.currentSrc || rounded.src;
    var cleanHandle = String(handle || "").replace(/^@/, "").toLowerCase();
    var identity = read("lorefy.identity.v1", {}) || {};
    if (cleanHandle && cleanHandle === String(identity.un || "").replace(/^@/, "").toLowerCase() && identity.avatar) return identity.avatar;
    var authorRows = doc.querySelectorAll(".lf-community-author-row, .lf-review-detail-author");
    for (var i = 0; i < authorRows.length; i++) {
      if (String(authorRows[i].textContent || "").toLowerCase().indexOf("@" + cleanHandle) < 0) continue;
      var image = authorRows[i].querySelector("img");
      if (image && (image.currentSrc || image.src)) return image.currentSrc || image.src;
    }
    return "";
  }
  function createCommunityReviewSharePreview(card) {
    var item = reviewDetailSnapshot(card, communityCardKey(card));
    var cover = el("div", { class: "lf-work-share-cover" });
    var coverFallback = el("span", { class: "lf-work-share-cover-fallback", text: String(item.work || "ل").trim().slice(0, 2) || "ل", "aria-hidden": "true" });
    cover.appendChild(coverFallback);
    if (item.cover) {
      var coverImage = el("img", { src: item.cover, "data-share-src": item.cover, alt: item.work, referrerpolicy: "no-referrer" });
      coverImage.addEventListener("error", function () {
        coverImage.remove();
        cover.classList.add("has-fallback");
      });
      cover.appendChild(coverImage);
    } else cover.classList.add("has-fallback");
    var avatar = el("span", { class: "lf-work-share-avatar" });
    avatar.appendChild(el("span", { class: "lf-work-share-avatar-fallback", text: item.author.slice(0, 1) || "ل", "aria-hidden": "true" }));
    if (item.avatar) {
      var avatarImage = el("img", { src: item.avatar, "data-share-src": item.avatar, alt: item.author, referrerpolicy: "no-referrer" });
      avatarImage.addEventListener("error", function () { avatarImage.remove(); });
      avatar.appendChild(avatarImage);
    }
    return el("article", { class: "lf-work-share-card-new lf-share-shelf-preview lf-community-review-share-preview" }, [
      el("header", null, [el("strong", { text: "LOREFY" }), el("span", { text: "من رف القارئ" })]),
      cover,
      el("div", { class: "lf-work-share-shelf", "aria-hidden": "true" }),
      el("span", { class: "lf-work-share-type", text: "مراجعة" }),
      el("h3", { text: item.work }),
      el("p", { text: item.text }),
      el("div", { class: "lf-work-share-user" }, [
        avatar,
        el("span", { class: "lf-work-share-user-copy" }, [el("strong", { text: item.author }), el("small", { text: item.handle })]),
        el("b", { class: "lf-work-share-rating" }, [extraIcon("feather"), el("span", { text: item.rating || "—" })])
      ]),
      el("footer", null, [el("span", { text: "اكتشف · قيّم · شارك" }), el("b", { text: "#Lorefy" })])
    ]);
  }
  function openCommunityReviewShareSheet(card) {
    if (!card) return;
    if(global.LorefyShareComposer){var value=reviewDetailSnapshot(card,communityCardKey(card));return global.LorefyShareComposer.open({kind:'review',title:value.work,text:value.text,rating:value.rating===''?null:Number(value.rating),profile:{name:value.author,handle:value.handle,avatar:value.avatar},items:[{name:value.work,image:value.cover}]});}
    var old = doc.querySelector(".lf-review-share-overlay");
    if (old) old.remove();
    var overlay = el("div", { class: "lf-review-share-overlay", role: "dialog", "aria-modal": "true", "aria-label": "مشاركة المراجعة" });
    var backdrop = el("button", { type: "button", class: "lf-review-share-backdrop", "aria-label": "إغلاق المشاركة" });
    var close = el("button", { type: "button", class: "lf-review-share-close", "aria-label": "إغلاق", text: "×" });
    var sheet = el("section", { class: "lf-review-share-sheet-card" }, [
      el("span", { class: "lf-review-share-grabber", "aria-hidden": "true" }),
      el("header", { class: "lf-review-share-head" }, [el("strong", { text: "مشاركة المراجعة" }), close]),
      createCommunityReviewSharePreview(card)
    ]);
    function dismiss() { overlay.remove(); }
    backdrop.addEventListener("click", dismiss);
    close.addEventListener("click", dismiss);
    overlay.appendChild(backdrop);
    overlay.appendChild(sheet);
    (doc.querySelector(".lf-app") || doc.body).appendChild(overlay);
    if (global.LorefyShareStudio && global.LorefyShareStudio.scan) global.LorefyShareStudio.scan();
    setTimeout(function () { try { close.focus({ preventScroll: true }); } catch (e) { close.focus(); } }, 0);
  }
  function wireCommunityShare(btn, card) {
    if (!btn || !card || btn.dataset.lfCommunityShareWired) return;
    btn.dataset.lfCommunityShareWired = "1";
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      openCommunityReviewShareSheet(card);
    }, true);
  }
  function wireCommunityCardNavigation(card) {
    if (!card || card.dataset.lfCommunityNavigationWired) return;
    card.dataset.lfCommunityNavigationWired = "1";
    card.tabIndex = 0;
    function activate() {
      var comment = card.querySelector('.lf-community-comment-button');
      if (comment) comment.click();
    }
    card.addEventListener('keydown',function(event){
      if(event.target===card && (event.key==='Enter' || event.key===' ')){event.preventDefault();activate();}
    });
    card.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (target.closest("button, a, input, textarea, .lf-community-author-row, .lf-community-card > span, .lf-community-work-card")) return;
      if (global.getSelection && String(global.getSelection())) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      activate();
    }, true);
  }
  function syncCommunityReactionViews(key) {
    var nodes = doc.querySelectorAll(".lf-community-card, .lf-review-detail-enhanced");
    for (var i = 0; i < nodes.length; i++) {
      if (communityCardKey(nodes[i]) !== key) continue;
      syncCommunityServerReactions(nodes[i],key);
      var like = nodes[i].querySelector(".lf-community-like-button");
      var dislike = nodes[i].querySelector(".lf-community-dislike-button");
      var busy=communityReactionJobs.has(communityReactionScope(key));
      [like,dislike].filter(Boolean).forEach(function (button) { button.setAttribute('aria-busy',String(busy));button.setAttribute('aria-disabled',String(busy)); });
      if (like) paintCommunityLike(like, key);
      if (dislike) paintCommunityDislike(dislike, key);
    }
  }
  function wireCommunitySave(btn, card) {
    if (!btn || !card || btn.dataset.lfCommunitySaveWired) return;
    var key = communityCardKey(card);
    btn.dataset.lfCommunitySaveWired = "1";
    function paint() {
      var active = !!savedReviews()[key];
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
    paint();
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      var rows = savedReviews();
      if (rows[key]) {
        delete rows[key];
        toastSafe("أزيلت المراجعة من المحفوظات");
      } else {
        rows[key] = reviewDetailSnapshot(card, key);
        toastSafe("تم حفظ المراجعة في حسابك");
      }
      write(K_REVIEW_SAVED, rows);
      paint();
      syncProfileSavedCard();
    }, true);
  }
  function enhanceCommunityCards(page) {
    var cards = page.querySelectorAll(".lf-review-card");
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      card.classList.add("lf-community-card");
      card.classList.remove("lf-community-action-row");
      normalizeReviewTop4Labels(card);
      var menu = card.querySelector(".lf-product-review-menu");
      var buttons = Array.prototype.filter.call(card.querySelectorAll("button"), function (button) { return button !== menu; });
      var body = card.querySelector(":scope > div");
      if (body) {
        body.classList.add("lf-community-review-body");
        if (body.children[0]) body.children[0].classList.add("lf-community-author-row");
        Array.prototype.forEach.call(body.querySelectorAll(":scope > p"), function (copy) {
          if ((copy.textContent || "").trim().length > 8) copy.classList.add("lf-community-review-copy");
        });
      }
      var cardRating = communityRenderedStarRating(card);
      if (cardRating) card.setAttribute("data-review-rating", String(cardRating));
      var media = card.querySelector('div[style*="overflow-x"]');
      if (media) media.classList.add("lf-community-review-media");
      var workCard = card.querySelector('img[data-fallback]');
    if (workCard && workCard.parentElement) {
      workCard.parentElement.classList.add("lf-community-work-card");
      }
      if (buttons.length < 3) continue;
      var rowButton = buttons.find(function (button) { return button.parentElement !== card && communityActionType(button) === 'comment'; });
      var row = rowButton && rowButton.parentElement;
      if (!row) continue;
      if (row) row.classList.add("lf-community-action-row");
      var actionButtons = {};
      buttons.forEach(function (button) {
        var type = communityActionType(button);
        if (type && !actionButtons[type]) actionButtons[type] = button;
      });
      actionButtons.bookmark = ensureCommunityBookmarkAction(row, actionButtons);
      actionButtons.dislike = ensureCommunityDislikeAction(row, actionButtons);
      setCommunityActionLabel(actionButtons.comment, "تعليق", "lf-community-comment-button");
      wireCommunityComment(actionButtons.comment, card);
      setCommunityActionLabel(actionButtons.bookmark, "حفظ", "lf-community-save-button");
      wireCommunitySave(actionButtons.bookmark, card);
      wireCommunityDislike(actionButtons.dislike, card);
      setCommunityActionLabel(actionButtons.like, "لايك", "lf-community-like-button");
      wireCommunityLike(actionButtons.like, card, actionButtons.dislike);
      setCommunityActionLabel(actionButtons.share, "مشاركة", "lf-community-share-button");
      wireCommunityShare(actionButtons.share, card);
      setCommunityActionLabel(actionButtons.delete, "حذف المراجعة", "lf-community-delete-button");
      if (actionButtons.delete && actionButtons.delete.parentElement === row && card.firstChild !== actionButtons.delete) card.insertBefore(actionButtons.delete, card.firstChild || null);
      wireCommunityCardNavigation(card);
    }
  }
  function enhanceCommunityPage() {
    var page = doc.querySelector(".lf-community-page");
    if (!page) return false;
    page.classList.add("lf-community-enhanced");
    var home=page.closest(".lf-home-screen");
    var tabs=home&&home.querySelector(".lf-home-feed-tabs")||page.querySelector(":scope > .lf-community-tabs");
    if(tabs)tabs.classList.add("lf-community-tabs");
    var hero = page.querySelector(".lf-community-hero");
    if (hero) hero.remove();
    Array.prototype.forEach.call(page.querySelectorAll(".lf-community-feed-label"), function (label) { label.remove(); });
    enhanceCommunityCards(page);
    return true;
  }
  function renderReviewDetailDislikeIcon() {
    return '<svg class="lf-review-detail-dislike-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"></path></svg>';
  }
  function renderReviewDetailBookmarkIcon() {
    return '<svg class="lf-review-detail-bookmark-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
  }
  function renderReviewDetailThumbsUpIcon() {
    return '<svg class="lf-review-detail-like-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"></path></svg>';
  }
  function reviewDetailKey(root) {
    var reviewId = root && root.getAttribute && root.getAttribute("data-review-id");
    if (reviewId) return "review:" + String(reviewId).trim();
    var active = read(K_ACTIVE_REVIEW, "");
    if (active) return String(active);
    try {
      var clone = root.cloneNode(true);
      var controls = clone.querySelectorAll("button, input, textarea, svg");
      for (var i = 0; i < controls.length; i++) controls[i].remove();
      return communityHash((clone.textContent || "").replace(/\s+/g, " ").trim().slice(0, 260));
    } catch (e) {
      return communityHash((root && root.textContent) || "");
    }
  }
  function reviewDetailSnapshot(root, key) {
    var author = root.querySelector(".lf-review-detail-author, .lf-community-author-row");
    var authorLeaves = author ? Array.prototype.slice.call(author.querySelectorAll("*")).filter(function (node) { return node.childElementCount === 0 && node.textContent.trim(); }) : [];
    var handleNode = authorLeaves.filter(function (node) { return /^@[\w_.-]+$/.test(node.textContent.trim()); })[0];
    var ratingNode = authorLeaves.filter(function (node) { return /^[1-5](?:\.[0-9])?$/.test(node.textContent.trim()); })[0];
    var authorNode = authorLeaves.filter(function (node) {
      var text = node.textContent.trim();
      return node !== handleNode && node !== ratingNode && !/^يوصي بها$/.test(text) && !/^[★☆]+$/.test(text);
    })[0];
    var handle = handleNode ? handleNode.textContent.trim() : "@lorefy_reader";
    var authorName = authorNode ? authorNode.textContent.trim() : "قارئ Lorefy";
    var copy = root.querySelector(".lf-review-detail-copy, .lf-community-review-copy");
    var workCards = root.querySelectorAll(".lf-review-detail-work-card, .lf-community-work-card");
    var workCard = workCards.length ? workCards[workCards.length - 1] : null;
    var workTitleNode = workCard && workCard.querySelector("p");
    var workTitle = workTitleNode && workTitleNode.textContent.trim() || "عمل على Lorefy";
    var avatar = author && author.querySelector("img");
    var workImage = workCard && workCard.querySelector("img");
    return {
      id: key,
      author: authorName,
      handle: handle,
      avatar: reviewAvatarSource(root, author, handle),
      rating: reviewDetailRating(root, authorLeaves),
      text: copy && copy.textContent.trim() || "مراجعة محفوظة",
      work: workTitle,
      cover: workImage && (workImage.currentSrc || workImage.src) || "",
      savedAt: Date.now()
    };
  }
  function savedReviews() {
    var rows = read(K_REVIEW_SAVED, {});
    return rows && typeof rows === "object" && !Array.isArray(rows) ? rows : {};
  }
  function paintReviewDetailSave(save, key) {
    if (!save) return;
    var active = !!savedReviews()[key];
    save.classList.toggle("is-active", active);
    save.setAttribute("aria-pressed", active ? "true" : "false");
    save.setAttribute("aria-label", active ? "إزالة من المراجعات المحفوظة" : "حفظ المراجعة");
    save.setAttribute("title", active ? "إزالة من المراجعات المحفوظة" : "حفظ المراجعة");
  }
  function wireReviewDetailSave(root, row) {
    var save = row && row.querySelector(".lf-review-detail-save-button");
    if (!save) return;
    var key = reviewDetailKey(root);
    paintReviewDetailSave(save, key);
    if (save.dataset.lfReviewSaveWired) return;
    save.dataset.lfReviewSaveWired = "1";
    save.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      var rows = savedReviews();
      if (rows[key]) {
        delete rows[key];
        toastSafe("أزيلت المراجعة من المحفوظات");
      } else {
        rows[key] = reviewDetailSnapshot(root, key);
        toastSafe("تم حفظ المراجعة في حسابك");
      }
      write(K_REVIEW_SAVED, rows);
      paintReviewDetailSave(save, key);
      syncProfileSavedCard();
    }, true);
  }
  function reviewShareText(root) {
    var item = reviewDetailSnapshot(root, reviewDetailKey(root));
    return item.author + " عن " + item.work + "\n" + item.text + "\n#Lorefy";
  }
  function copyReviewText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var input = doc.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    doc.body.appendChild(input);
    input.select();
    try { doc.execCommand("copy"); } catch (e) {}
    input.remove();
    return Promise.resolve();
  }
  function wireReviewDetailShare(root, row) {
    var share = row && row.querySelector('button[aria-label="مشاركة"],button[aria-label="Share"]');
    if (!share || share.dataset.lfReviewShareWired) return;
    share.dataset.lfReviewShareWired = "1";
    share.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      openCommunityReviewShareSheet(root);
    }, true);
  }
  function wireReviewDetailComment(root, row) {
    var comment = row && row.querySelector('button[aria-label="تعليق"],button[aria-label="Comment"]');
    if (!comment || comment.dataset.lfReviewCommentWired) return;
    comment.dataset.lfReviewCommentWired = "1";
    comment.addEventListener("click", function () {
      setTimeout(function () {
        var field = root.querySelector('input[placeholder*="رد"], textarea[placeholder*="رد"]');
        if (!field) return;
        try { field.focus({ preventScroll: true }); } catch (e) { field.focus(); }
        try { field.scrollIntoView({ behavior: global.LorefyInterfacePreferences ? global.LorefyInterfacePreferences.scrollBehavior() : "smooth", block: "center" }); } catch (e) {}
      }, 0);
    });
  }
  function wireReviewReplyCapture(root) {
    var replyBar = root && root.querySelector(".lf-review-detail-replybar");
    if (!replyBar || replyBar.dataset.lfReviewReplyCapture) return;
    replyBar.dataset.lfReviewReplyCapture = "1";
    function capture() {
      var field = replyBar.querySelector('input[placeholder*="رد"], textarea[placeholder*="رد"], input[placeholder*="تعليق"], textarea[placeholder*="تعليق"]');
      var body = String((field && field.value) || "").trim();
      if (!body) return;
      var snapshot = reviewDetailSnapshot(root, reviewDetailKey(root));
      captureReplyActivity({ reviewId: reviewDetailKey(root), body: body, author: snapshot.author, work: snapshot.work });
    }
    replyBar.addEventListener("click", function (event) {
      var button = event.target && event.target.closest ? event.target.closest("button") : null;
      if (button && !button.disabled) capture();
    }, true);
    replyBar.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) capture();
    }, true);
  }
  function openSavedReviews() {
    var ov = ovOpen("lf-saved-reviews-page", "المحفوظات");
    var rows = savedReviews();
    var items = Object.keys(rows).map(function (key) { return rows[key]; }).sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
    var community = global.LorefyCommunity;
    var posts = community ? Object.values(community.savedPosts()) : [];
    posts.forEach(function (post) {
      var card = community.postCard(post,false,null,function () { ov.close(); });
      card.addEventListener("click", function () {
        if (!community.savedPosts()[post.id]) {
          card.remove();
          if (!ov.body.querySelector(".lf-saved-review-card,.lf-community-post-card")) {
            ov.body.appendChild(el("div", { class:"lf-saved-reviews-empty", text:uiText("لا توجد محفوظات بعد", "No saved posts yet") }));
          }
        }
      });
      ov.body.appendChild(card);
    });
    if (!items.length && !posts.length) {
      ov.body.appendChild(el("div", { class: "lf-saved-reviews-empty" }, [el("strong", { text: "لا توجد مراجعات محفوظة" }), el("p", { text: "اضغط علامة الحفظ في أي مراجعة لتجدها هنا." })]));
      return;
    }
    items.forEach(function (item) {
      var avatar = el("span", { class: "lf-saved-review-avatar" });
      if (item.avatar) avatar.appendChild(el("img", { src: item.avatar, alt: item.author || "", referrerpolicy: "no-referrer" }));
      else avatar.textContent = String(item.author || "L").slice(0, 1);
      var remove = el("button", { type: "button", class: "lf-saved-review-remove", "aria-label": "إزالة المراجعة", text: "إزالة" });
      var card = el("article", { class: "lf-saved-review-card" }, [
        el("header", null, [avatar, el("span", null, [el("strong", { text: item.author || "قارئ Lorefy" }), el("small", { text: item.handle || "@lorefy_reader" })]), item.rating ? el("b", null, [extraIcon("feather"), el("span", { text: item.rating })]) : null]),
        el("p", { text: item.text || "مراجعة محفوظة" }),
        el("footer", null, [el("span", { text: item.work || "عمل على Lorefy" }), remove])
      ]);
      remove.addEventListener("click", function () {
        var saved = savedReviews();
        delete saved[item.id];
        write(K_REVIEW_SAVED, saved);
        card.remove();
        syncProfileSavedCard();
        if (!ov.body.querySelector(".lf-saved-review-card,.lf-community-post-card")) ov.body.appendChild(el("div", { class: "lf-saved-reviews-empty" }, [el("strong", { text: "لا توجد مراجعات محفوظة" }), el("p", { text: "اضغط علامة الحفظ في أي مراجعة لتجدها هنا." })]));
      });
      ov.body.appendChild(card);
    });
  }
  function syncProfileSavedCard() {
    var row = doc.querySelector(".lf-extras-row");
    if (!row) return false;
    if(doc.querySelector('.lf-profile-community-summary [data-lf-community-summary="saved"]')){
      var duplicate=row.querySelector('.lf-extra-saved');if(duplicate)duplicate.remove();return true;
    }
    var count = Object.keys(savedReviews()).length + (global.LorefyCommunity ? Object.keys(global.LorefyCommunity.savedPosts()).length : 0);
    var card = row.querySelector(".lf-extra-saved");
    if (!card) {
      card = el("button", { type: "button", class: "lf-extra-card lf-extra-saved" }, [
        extraIcon("bookmark"),
        el("span", { class: "lf-extra-saved-copy" }, [el("strong", { class: "lf-extra-name", text: "المراجعات المحفوظة" }), el("span", { class: "lf-extra-sub" })]),
        extraChevron()
      ]);
      card.addEventListener("click", openSavedReviews);
      row.appendChild(card);
      scheduleCharacterActionIcons();
    }
    var sub = card.querySelector(".lf-extra-sub");
    if (sub) sub.textContent = count ? count + " مراجعة محفوظة" : "احفظ المراجعات للرجوع إليها";
    return true;
  }
  function findReviewDetailActionRow(root) {
    if (!root) return null;
    var rows = root.querySelectorAll("div");
    for (var i = 0; i < rows.length; i++) {
      var buttons = rows[i].querySelectorAll(":scope > button");
      if (buttons.length >= 4 && rows[i].querySelectorAll("input, textarea").length === 0) return rows[i];
    }
    return null;
  }
  function reviewDetailStatsRow(row) {
    var prev = row && row.previousElementSibling;
    return prev && /إعجاب|رد/.test(prev.textContent || "") ? prev : null;
  }
  function ensureReviewDetailStat(stats, key) {
    if (!stats) return null;
    var stat = stats.querySelector(".lf-review-detail-dislikes-stat");
    if (!stat) {
      stat = el("span", { class: "lf-review-detail-dislikes-stat" }, [
        el("b", { text: "0" }),
        el("em", { text: "دسلايك" })
      ]);
      stats.appendChild(stat);
    }
    return stat;
  }
  function paintReviewDetailDislike(btn, stats, key) {
    var counts = read(K_REVIEW_DETAIL_DISLIKES, {});
    var mine = read(K_REVIEW_DETAIL_MY_DISLIKES, {});
    var count = Math.max(0, parseInt(counts[key] || 0, 10) || 0);
    var span = btn.querySelector("span");
    if (!span) {
      span = doc.createElement("span");
      btn.appendChild(span);
    }
    span.textContent = String(count);
    btn.classList.toggle("is-active", !!mine[key]);
    var stat = ensureReviewDetailStat(stats, key);
    var statCount = stat && stat.querySelector("b");
    if (statCount) statCount.textContent = String(count);
  }
  function wireReviewDetailDislike(root, row) {
    if (!root || !row) return;
    var key = reviewDetailKey(root);
    var stats = reviewDetailStatsRow(row);
    if (stats) stats.classList.add("lf-review-detail-stats");
    var dislike = row.querySelector(".lf-review-detail-dislike-button");
    if (!dislike) {
      dislike = el("button", {
        type: "button",
        class: "lf-review-detail-action lf-review-detail-dislike-button",
        "aria-label": "دسلايك",
        title: "دسلايك",
        html: renderReviewDetailDislikeIcon() + "<span>0</span>"
      });
      var buttons = row.querySelectorAll(":scope > button");
      if (buttons[2]) row.insertBefore(dislike, buttons[2]); else row.appendChild(dislike);
    }
    paintReviewDetailDislike(dislike, stats, key);
    if (dislike.dataset.lfReviewDetailDislikeWired) return;
    dislike.dataset.lfReviewDetailDislikeWired = "1";
    dislike.addEventListener("click", async function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      var counts = read(K_REVIEW_DETAIL_DISLIKES, {});
      var mine = read(K_REVIEW_DETAIL_MY_DISLIKES, {});
      var nowMine = !mine[key];
      try { await persistReviewReaction(root, "dislike", nowMine); }
      catch (error) { console.warn("[Lorefy] detail dislike sync:", error); return; }
      if (nowMine) mine[key] = true; else delete mine[key];
      counts[key] = Math.max(0, (parseInt(counts[key] || 0, 10) || 0) + (nowMine ? 1 : -1));
      write(K_REVIEW_DETAIL_DISLIKES, counts);
      write(K_REVIEW_DETAIL_MY_DISLIKES, mine);
      paintReviewDetailDislike(dislike, stats, key);
    }, true);
  }
  function normalizeReviewDetailSaveButton(buttons) {
    var save = buttons && buttons[2];
    if (!save) return;
    save.classList.add("lf-review-detail-save-button");
    save.setAttribute("aria-label", "حفظ المراجعة");
    save.setAttribute("title", "حفظ المراجعة");
    if (!save.querySelector(".lf-review-detail-bookmark-icon")) save.innerHTML = renderReviewDetailBookmarkIcon();
  }
  function normalizeReviewDetailLikeButton(buttons) {
    if (!buttons) return;
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (!btn || btn.classList.contains("lf-review-detail-dislike-button") || btn.classList.contains("lf-review-detail-save-button")) continue;
      var html = btn.innerHTML || "";
      if (/M19 14c1\.49|A5\.5 5\.5|l7 7Z/.test(html)) {
        btn.classList.add("lf-review-detail-like-button");
        btn.setAttribute("aria-label", "إعجاب");
        btn.setAttribute("title", "إعجاب");
        if (!btn.querySelector(".lf-review-detail-like-icon")) btn.innerHTML = renderReviewDetailThumbsUpIcon();
      } else if (/M7\.9 20A9 9/.test(html)) {
        btn.setAttribute("aria-label", "تعليق");
        btn.setAttribute("title", "تعليق");
      } else if (/circle cx="?18"? cy="?5"?/.test(html)) {
        btn.setAttribute("aria-label", "مشاركة");
        btn.setAttribute("title", "مشاركة");
      }
    }
  }
  function looksLikeBrokenReviewText(text) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    if (text.length < 8) return false;
    if (/[ØÙÃÂâ]/.test(text)) return true;
    var arabicLetters = text.match(/[\u0600-\u06FF]/g) || [];
    if (arabicLetters.length < 8) return false;
    var mojibakeLetters = text.match(/[\u0637\u0638]/g) || [];
    var hasCommonArabicWord = /(^|[\s،.!؟:؛])(ال|في|من|على|عن|هذا|هذه|كان|كانت|قصة|القصة|شخصية|الشخصيات|عمل|رائع|جميل|سيئ|سيئة|أنصح|يوصي|أحداث|الرسم|النهاية|بداية|لا|نعم)(?=$|[\s،.!؟:؛])/.test(text);
    return !hasCommonArabicWord && mojibakeLetters.length / arabicLetters.length >= 0.18;
  }
  function decorateReviewDetailBody(root) {
    var body = root && root.children && root.children[1];
    if (!body) return;
    body.classList.add("lf-review-detail-body");
    if (body.children[0]) body.children[0].classList.add("lf-review-detail-author");
    for (var i = 0; i < body.children.length; i++) {
      var child = body.children[i];
      var text = (child.textContent || "").replace(/\s+/g, " ").trim();
      if (child.tagName === "P" && looksLikeBrokenReviewText(text)) {
        child.classList.add("lf-review-detail-broken-copy");
        child.setAttribute("aria-hidden", "true");
        continue;
      }
      if (child.tagName === "P" && !/الردود/.test(text) && text.length > 25) child.classList.add("lf-review-detail-copy");
      if (child.tagName === "P" && /الردود/.test(text)) child.classList.add("lf-review-detail-replies-title");
      if (child.tagName === "P" && /[0-9٠-٩].*(ص|م)|يوليو|يونيو|يناير|فبراير|مارس|أبريل|مايو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر/.test(text)) child.classList.add("lf-review-detail-time");
      if (child.tagName === "DIV" && child.querySelector("img") && child.querySelectorAll("button").length === 0 && i > 0) child.classList.add("lf-review-detail-work-card");
      if (child.tagName === "DIV" && text.indexOf("كن أول من يرد") >= 0) child.classList.add("lf-review-detail-empty-replies");
    }
  }
  function enhanceReviewDetailPage() {
    var root = doc.querySelector('[data-screen-label="review"] .lf-review-detail');
    if (!root) return false;
    root.classList.add("lf-review-detail-enhanced");
    var activeReviewId = read(K_ACTIVE_REVIEW_ID, "");
    if (activeReviewId && !root.getAttribute("data-review-id")) root.setAttribute("data-review-id", String(activeReviewId));
    normalizeReviewTop4Labels(root);
    if (root.children && root.children[0]) root.children[0].classList.add("lf-review-detail-header");
    if (root.children && root.children[2]) root.children[2].classList.add("lf-review-detail-replybar");
    decorateReviewDetailBody(root);
    var row = findReviewDetailActionRow(root);
    if (row) {
      row.classList.add("lf-review-detail-actions");
      var buttons = Array.prototype.slice.call(row.querySelectorAll(":scope > button"));
      var actions = {};
      buttons.forEach(function (button) {
        var type = communityActionType(button);
        if (type && !actions[type]) actions[type] = button;
      });
      actions.bookmark = ensureCommunityBookmarkAction(row, actions);
      actions.dislike = ensureCommunityDislikeAction(row, actions);
      Object.keys(actions).forEach(function (type) {
        if (actions[type]) actions[type].classList.add("lf-review-detail-action");
      });
      setCommunityActionLabel(actions.comment, "تعليق", "lf-community-comment-button");
      setCommunityActionLabel(actions.like, "لايك", "lf-community-like-button");
      setCommunityActionLabel(actions.dislike, "دسلايك", "lf-community-dislike-button");
      setCommunityActionLabel(actions.bookmark, "حفظ", "lf-community-save-button");
      setCommunityActionLabel(actions.share, "مشاركة", "lf-community-share-button");
      wireCommunityComment(actions.comment, root);
      wireCommunityLike(actions.like, root, actions.dislike);
      wireCommunityDislike(actions.dislike, root);
      wireCommunitySave(actions.bookmark, root);
      wireCommunityShare(actions.share, root);
    }
    wireReviewReplyCapture(root);
    return true;
  }
  function growthMaintenanceTick() {
    function run(name,fn){var probe=global.LorefyPerformanceProbe;return probe?probe.measure("growth."+name,fn):fn();}
    try { run("cleanupStrayCharButtons",function(){cleanupStrayCharButtons();}); } catch (e) {}
    try { run("injectCharacterLauncher",function(){injectCharacterLauncher();}); } catch (e) {}
    try { run("enhanceDetail",function(){enhanceDetail(doc);}); } catch (e) {}
    try { run("enhanceReviewSheet",function(){enhanceReviewSheet();}); } catch (e) {}
    try { run("enhanceTrackerSheet",function(){enhanceTrackerSheet();}); } catch (e) {}
    try { run("enhanceCommunityPage",function(){enhanceCommunityPage();}); } catch (e) {}
    try { run("enhanceReviewDetailPage",function(){enhanceReviewDetailPage();}); } catch (e) {}
    try { run("syncProfileExtras",function(){syncProfileExtras();}); } catch (e) {}
    try { run("syncProfileRatedCharacters",function(){syncProfileRatedCharacters();}); } catch (e) {}
    try { run("syncProfileRatedCharacterGallery",function(){syncProfileRatedCharacterGallery();}); } catch (e) {}
    try { run("syncProfileTopCharacterEditor",function(){syncProfileTopCharacterEditor();}); } catch (e) {}
    try { run("syncProfileFavouriteWorksControls",function(){syncProfileFavouriteWorksControls();}); } catch (e) {}
    try { run("syncProfileTopCharacters",function(){syncProfileTopCharacters();}); } catch (e) {}
    try { run("syncProfileCommunitySummary",function(){syncProfileCommunitySummary();}); } catch (e) {}
    try { run("syncHomeReplyShelf",function(){syncHomeReplyShelf();}); } catch (e) {}
    try { run("syncPublicProfileParity",function(){syncPublicProfileParity();}); } catch (e) {}
    try { run("labelIconOnlyButtons",function(){labelIconOnlyButtons(doc);}); } catch (e) {}
    try { run("enhanceInteractionAccessibility",function(){enhanceInteractionAccessibility(doc);}); } catch (e) {}
    try { run("enhanceReviewComposerSheet",function(){enhanceReviewComposerSheet();}); } catch (e) {}
  }
  function scheduleGrowthMaintenance() {
    if (growthMaintenancePending) return;
    growthMaintenancePending = true;
    growthIdle(function () {
      growthMaintenancePending = false;
      growthMaintenanceTick();
    }, 1200);
  }

  function boot() {
    global.addEventListener("lorefy:stored-state", profileRatedCharacterStateChanged);
    global.addEventListener("storage", profileRatedCharacterStateChanged);
    wireProfileTopCharacterEditorDelegation();
    installPublicProfileParity();
    startObserver();
    installPreviewAffordance();
    /* robust launcher injection: the app re-renders the profile asynchronously,
       so back the observer with a light periodic check (cheap no-ops otherwise) */
    try {
      injectCharacterLauncher();
      labelIconOnlyButtons(doc);
      enhanceInteractionAccessibility(doc);
      wireReviewSheetObserver();
      scheduleGrowthMaintenance();
      /* follow the active category instantly: the app rebuilds the hub rail on
         tab switch, so re-sync a few times right after any click inside the hub */
      doc.addEventListener("click", function (e) {
        var t = e.target;
        if (t && t.closest && t.closest(".lf-pref-board-hub, .lf-pref-board-launcher")) {
          [30, 120, 260, 460].forEach(function (ms) { setTimeout(function () { try { syncCharEmbed(); } catch (x) {} }, ms); });
        }
      }, true);
    } catch (e) {}
    if (qp("characters") === "preview") {
      setTimeout(function () { openCharacterPage({ cast: TEMPLATE_CAST.slice(), title: "ون بيس", preview: true }); }, 60);
    } else if (qp("characters") === "open") {
      setTimeout(function () { openCharacterPage({}); }, 60);
    }
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();

  /* ── public API ────────────────────────────────────────────────────── */
  global.LorefyGrowth = {
    version: "growth-v22-full-audit",
    openCharacterPage: openCharacterPage,
    closeCharacterPage: closePage,
    enhanceDetail: enhanceDetail,
    templateCast: function () { return TEMPLATE_CAST.slice(); },
    syncCharacterBoards: syncCharEmbed,
    injectCharacterLauncher: injectCharacterLauncher,
    labelIconOnlyButtons: labelIconOnlyButtons,
    enhanceInteractionAccessibility: enhanceInteractionAccessibility,
    enhanceCommunityPage: enhanceCommunityPage,
    enhanceReviewDetailPage: enhanceReviewDetailPage
  };
})(typeof window !== "undefined" ? window : this);
