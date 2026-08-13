(function (global) {
  "use strict";

  var doc = global.document;
  var factory = global.LorefyProductCore;
  if (!doc || !factory) return;
  var core = factory.createProductCore(global.localStorage);
  var pendingEnhance = false;

  var ICONS = {
    data: "database",
    correction: "badge-alert",
    safety: "shield-check",
    chevron: "chevron-left",
    close: "x",
    more: "ellipsis",
    download: "download",
    file: "file-json-2",
    table: "table-2"
  };

  var REPORT_LABELS = {
    spam: "محتوى مزعج أو دعائي",
    abuse: "إساءة أو خطاب كراهية",
    harassment: "تحرش أو استهداف شخصي",
    spoiler: "حرق غير معلّم",
    misinformation: "معلومة مضللة",
    copyright: "حقوق نشر"
  };
  var ISSUE_LABELS = {
    cover: "الغلاف غير صحيح",
    characters: "الشخصيات ناقصة أو خاطئة",
    metadata: "بيانات العمل غير دقيقة",
    duplicate: "العمل مكرر أو النسخة مرتبطة خطأ",
    translation: "الترجمة أو الاسم غير دقيق"
  };
  var VISIBILITY_LABELS = {
    private: "خاصة",
    unlisted: "برابط فقط",
    public: "عامة"
  };

  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value != null) node.setAttribute(key, value);
    });
    (Array.isArray(children) ? children : children ? [children] : []).forEach(function (child) {
      node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
    });
    return node;
  }

  function icon(name, size) {
    return el("i", { "data-lucide": name, width: String(size || 17), height: String(size || 17), "aria-hidden": "true" });
  }

  function refreshIcons(root) {
    try { if (global.lucide && global.lucide.createIcons) global.lucide.createIcons({ nodes: [root] }); } catch (error) {}
  }

  function safeRead(key, fallback) {
    try { return JSON.parse(global.localStorage.getItem(key) || "null") || fallback; } catch (error) { return fallback; }
  }

  function host() {
    return doc.getElementById("screen") || doc.body;
  }

  function toast(message) {
    var old = host().querySelector(".lf-product-toast");
    if (old) old.remove();
    var node = el("div", { class: "lf-product-toast", role: "status", text: message });
    host().appendChild(node);
    global.setTimeout(function () { node.remove(); }, 2600);
  }

  function closeSheet(overlay) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function openSheet(title, subtitle, build) {
    var existing = host().querySelector(".lf-product-overlay");
    if (existing) existing.remove();
    var overlay = el("div", { class: "lf-product-overlay", role: "presentation" });
    var sheet = el("section", { class: "lf-product-sheet", role: "dialog", "aria-modal": "true", "aria-label": title });
    var close = el("button", { class: "lf-product-icon-button", type: "button", "aria-label": "إغلاق", onclick: function () { closeSheet(overlay); } }, icon(ICONS.close, 18));
    var heading = el("div", {}, [el("h2", { text: title }), subtitle ? el("p", { text: subtitle }) : null].filter(Boolean));
    var head = el("header", { class: "lf-product-sheet-head" }, [close, heading, el("span")]);
    var body = el("div", { class: "lf-product-sheet-body" });
    sheet.appendChild(el("div", { class: "lf-product-grabber" }));
    sheet.appendChild(head);
    sheet.appendChild(body);
    overlay.appendChild(sheet);
    overlay.addEventListener("click", function (event) { if (event.target === overlay) closeSheet(overlay); });
    build(body, function () { closeSheet(overlay); });
    host().appendChild(overlay);
    refreshIcons(overlay);
    var focusable = overlay.querySelector("button,select,input,textarea,a");
    if (focusable) focusable.focus({ preventScroll: true });
    return overlay;
  }

  function section(title, description) {
    return el("section", { class: "lf-product-section" }, [
      el("h3", { text: title }),
      description ? el("p", { text: description }) : null
    ].filter(Boolean));
  }

  function button(label, className, handler, iconName) {
    var children = [];
    if (iconName) children.push(icon(iconName, 16));
    children.push(el("span", { text: label }));
    return el("button", { type: "button", class: className, onclick: handler }, children);
  }

  function downloadFile(name, text, type) {
    var blob = new Blob([text], { type: type || "application/octet-stream" });
    var url = URL.createObjectURL(blob);
    var link = el("a", { href: url, download: name });
    doc.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCell(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }

  function exportLibraryCsv() {
    var library = safeRead("lorefy.user.library.v2", {});
    var progress = safeRead("lorefy.user.progress.v2", {});
    var works = Array.isArray(global.LorefyMangaData) ? global.LorefyMangaData : [];
    var byId = new Map(works.map(function (work) { return [String(work.id), work]; }));
    var rows = [["id", "title", "type", "status", "chapter", "volume"]];
    Object.keys(library).forEach(function (id) {
      var work = byId.get(String(id)) || {};
      var itemProgress = progress[id] || {};
      rows.push([id, work.title || work.ar || "", work.type || "", library[id], itemProgress.ch || 0, itemProgress.vol || 0]);
    });
    var csv = "\ufeff" + rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
    downloadFile("lorefy-library.csv", csv, "text/csv;charset=utf-8");
    toast("تم تجهيز ملف المكتبة");
  }

  function allLists() {
    var workLists = safeRead("lorefy.customLists.v1", []);
    var characterLists = safeRead("lorefy.charTopLists.v1", []);
    return workLists.map(function (list) { return { id: list.id, name: list.name || "قائمة أعمال", kind: "أعمال" }; })
      .concat(characterLists.map(function (list) { return { id: list.id, name: list.title || "قائمة شخصيات", kind: "شخصيات" }; }));
  }

  function renderVisibilityRows(container) {
    var lists = allLists();
    if (!lists.length) {
      container.appendChild(el("div", { class: "lf-product-empty", text: "لا توجد قوائم مخصصة بعد. أي قائمة جديدة تبدأ كقائمة خاصة." }));
      return;
    }
    lists.forEach(function (list) {
      var select = el("select", { "aria-label": "خصوصية " + list.name });
      ["private", "unlisted", "public"].forEach(function (value) {
        var option = el("option", { value: value, text: VISIBILITY_LABELS[value] });
        if (core.privacy.getListVisibility(list.id) === value) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", function () {
        core.privacy.setListVisibility(list.id, select.value);
        toast("تم تحديث خصوصية القائمة");
      });
      container.appendChild(el("div", { class: "lf-product-list-row" }, [
        el("div", { class: "lf-product-list-copy" }, [el("strong", { text: list.name }), el("small", { text: list.kind })]),
        select
      ]));
    });
  }

  function openDataCenter() {
    openSheet("الخصوصية والبيانات", "تحكم واضح ببياناتك وقوائمك", function (body) {
      var exports = section("نسخة من بياناتك", "صدّر مكتبتك وتقييماتك وقوائمك. لا يتضمن الملف بيانات الجلسة أو حالة Premium.");
      var exportButtons = el("div", { class: "lf-product-inline-actions" });
      exportButtons.appendChild(button("تصدير JSON", "lf-product-secondary", function () {
        var data = core.exportPortable(new Date());
        downloadFile("lorefy-data.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
        toast("تم تجهيز نسخة بياناتك");
      }, ICONS.file));
      exportButtons.appendChild(button("المكتبة CSV", "lf-product-secondary", exportLibraryCsv, ICONS.table));
      exports.appendChild(exportButtons);
      if (global.LorefyMonitoring && global.LorefyMonitoring.getDiagnostics) {
        exports.appendChild(button("تصدير تقرير التشخيص", "lf-product-secondary", function () {
          downloadFile("lorefy-diagnostics.json", JSON.stringify(global.LorefyMonitoring.getDiagnostics(), null, 2), "application/json;charset=utf-8");
          toast("تم تجهيز تقرير التشخيص بدون بيانات الحساب");
        }, "activity"));
      }
      body.appendChild(exports);

      var privacy = section("خصوصية القوائم", "القوائم الجديدة خاصة تلقائياً. اختر عامة فقط عندما تريد ظهورها للآخرين.");
      renderVisibilityRows(privacy);
      body.appendChild(privacy);

      var legal = section("الثقة والدعم", "تفاصيل واضحة عن الخصوصية، استخدام البيانات، وكيفية طلب تصحيح.");
      legal.appendChild(el("div", { class: "lf-product-links" }, [
        el("a", { href: "privacy-policy.html", text: "سياسة الخصوصية" }),
        el("a", { href: "terms.html", text: "شروط الاستخدام" }),
        el("a", { href: "support.html", text: "الدعم وجودة البيانات" })
      ]));
      body.appendChild(legal);
    });
  }

  function correctionRow(item) {
    return el("div", { class: "lf-product-list-row" }, [
      el("div", { class: "lf-product-list-copy" }, [
        el("strong", { text: ISSUE_LABELS[item.issue] || item.issue }),
        el("small", { text: item.workId + " · " + new Date(item.createdAt).toLocaleDateString("ar-SA") })
      ]),
      el("span", { class: "lf-product-status", text: "قيد المراجعة" })
    ]);
  }

  function openCorrectionsCenter() {
    openSheet("مركز التصحيحات", "تتبّع الملاحظات المرسلة على بيانات الأعمال", function (body) {
      var items = core.corrections.list();
      var info = section("طلباتك", "التصحيح لا يغير بيانات العمل فوراً؛ يبقى في قائمة مراجعة لحماية المكتبة من التعديلات الخاطئة.");
      if (!items.length) info.appendChild(el("div", { class: "lf-product-empty", text: "لم ترسل أي تصحيح بعد. افتح صفحة أي عمل واختر تصحيح البيانات." }));
      items.slice(0, 30).forEach(function (item) { info.appendChild(correctionRow(item)); });
      body.appendChild(info);
    });
  }

  function safetyUserRow(userId, kind) {
    var remove = function () {
      if (kind === "blocked") core.safety.unblockUser(userId); else core.safety.unmuteUser(userId);
      toast(kind === "blocked" ? "تم إلغاء الحظر" : "تم إلغاء الكتم");
      openSafetyCenter();
    };
    return el("div", { class: "lf-product-list-row" }, [
      el("div", { class: "lf-product-list-copy" }, [el("strong", { text: "@" + userId }), el("small", { text: kind === "blocked" ? "محظور" : "مكتوم" })]),
      button("إلغاء", "lf-product-icon-button", remove)
    ]);
  }

  function openSafetyCenter() {
    openSheet("السلامة والمحتوى", "إدارة البلاغات والحسابات التي لا تريد رؤيتها", function (body) {
      var reports = core.safety.getReports();
      var reportSection = section("البلاغات المرسلة", "تُحفظ البلاغات في قائمة مراجعة، ولا يختفي المحتوى العام تلقائياً إلا إذا اخترت الكتم أو الحظر.");
      if (!reports.length) reportSection.appendChild(el("div", { class: "lf-product-empty", text: "لا توجد بلاغات مرسلة." }));
      reports.slice(0, 20).forEach(function (report) {
        reportSection.appendChild(el("div", { class: "lf-product-list-row" }, [
          el("div", { class: "lf-product-list-copy" }, [el("strong", { text: REPORT_LABELS[report.reason] || report.reason }), el("small", { text: report.targetId })]),
          el("span", { class: "lf-product-status", text: "قيد المراجعة" })
        ]));
      });
      body.appendChild(reportSection);

      var blocked = section("الحسابات المحظورة", "لن يظهر محتوى هذه الحسابات داخل المجتمع.");
      var blockedUsers = core.safety.getBlockedUsers();
      if (!blockedUsers.length) blocked.appendChild(el("div", { class: "lf-product-empty", text: "لا توجد حسابات محظورة." }));
      blockedUsers.forEach(function (user) { blocked.appendChild(safetyUserRow(user, "blocked")); });
      body.appendChild(blocked);

      var muted = section("الحسابات المكتومة", "يُخفى محتواها من الخلاصة بدون إشعارها.");
      var mutedUsers = core.safety.getMutedUsers();
      if (!mutedUsers.length) muted.appendChild(el("div", { class: "lf-product-empty", text: "لا توجد حسابات مكتومة." }));
      mutedUsers.forEach(function (user) { muted.appendChild(safetyUserRow(user, "muted")); });
      body.appendChild(muted);
    });
  }

  function currentWork() {
    var params = new URLSearchParams(global.location.search || "");
    var id = params.get("novel") || params.get("work") || "";
    var works = Array.isArray(global.LorefyMangaData) ? global.LorefyMangaData : [];
    return works.find(function (work) { return String(work.id) === String(id); }) || { id: id, title: id };
  }

  function openCorrectionForm(work) {
    work = work || currentWork();
    openSheet("تصحيح بيانات العمل", work.title || work.ar || work.id, function (body, close) {
      var form = section("ما الذي يحتاج إلى تصحيح؟", "أرسل وصفاً محدداً ومصدراً أو قيمة بديلة عندما تتوفر.");
      var issue = el("select", { id: "lf-correction-issue" });
      Object.keys(ISSUE_LABELS).forEach(function (value) { issue.appendChild(el("option", { value: value, text: ISSUE_LABELS[value] })); });
      var note = el("textarea", { placeholder: "اشرح المشكلة بدقة...", maxlength: "1000" });
      var proposed = el("input", { type: "url", placeholder: "رابط المصدر أو القيمة الصحيحة (اختياري)" });
      form.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { for: "lf-correction-issue", text: "نوع المشكلة" }), issue]));
      form.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { text: "التفاصيل" }), note]));
      form.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { text: "المصدر أو البديل" }), proposed]));
      form.appendChild(button("إرسال للمراجعة", "lf-product-primary", function () {
        if (!String(note.value || "").trim()) { toast("اكتب وصفاً واضحاً للمشكلة"); return; }
        core.corrections.submit({ workId: work.id, issue: issue.value, note: note.value, proposedValue: proposed.value });
        close();
        toast("تم إرسال التصحيح للمراجعة");
      }));
      body.appendChild(form);
    });
  }

  function hashText(text) {
    var hash = 2166136261;
    for (var index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function reviewContext(card) {
    var text = String(card.textContent || "").replace(/\s+/g, " ").trim();
    var handle = (text.match(/@([\w.-]+)/) || [])[1] || "reader-" + hashText(text.slice(0, 120));
    var liveReviewId = String(card.dataset.reviewId || "").trim();
    var liveUserId = String(card.dataset.userId || "").trim();
    return {
      userId: liveUserId || handle,
      targetId: liveReviewId || "review-" + hashText(text),
      targetType: "review",
      live: Boolean(liveReviewId || liveUserId),
      card: card
    };
  }

  function hideCardsFor(userId) {
    doc.querySelectorAll(".lf-review-card,.lf-review-detail").forEach(function (card) {
      if (reviewContext(card).userId === userId) card.style.display = "none";
    });
  }

  function openReviewSafety(context) {
    openSheet("خيارات المراجعة", "إدارة هذا المحتوى أو إخفاء محتوى القارئ", function (body, close) {
      var report = section("إرسال بلاغ", "اختر السبب الأقرب. يمكنك إضافة تفاصيل تساعد على المراجعة.");
      var reason = el("select", { id: "lf-report-reason" });
      Object.keys(REPORT_LABELS).forEach(function (value) { reason.appendChild(el("option", { value: value, text: REPORT_LABELS[value] })); });
      var note = el("textarea", { placeholder: "تفاصيل إضافية (اختياري)", maxlength: "800" });
      report.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { for: "lf-report-reason", text: "سبب البلاغ" }), reason]));
      report.appendChild(el("div", { class: "lf-product-form-row" }, [el("label", { text: "ملاحظة" }), note]));
      report.appendChild(button("إرسال البلاغ", "lf-product-primary", async function () {
        try {
          await Promise.resolve(core.safety.report({ targetId: context.targetId, targetType: context.targetType, reason: reason.value, note: note.value }));
        } catch (error) { toast(error && error.message || "Report submission failed"); return; }
        close();
        toast("تم إرسال البلاغ للمراجعة");
      }));
      body.appendChild(report);

      var controls = section("التحكم بما تراه", "الكتم يخفي محتواه فقط. الحظر يخفي المحتوى ويمنع التفاعل المحلي معه.");
      var actions = el("div", { class: "lf-product-inline-actions" });
      actions.appendChild(button("كتم القارئ", "lf-product-secondary", function () {
        core.safety.muteUser(context.userId); hideCardsFor(context.userId); close(); toast("تم كتم القارئ");
      }));
      actions.appendChild(button("حظر القارئ", "lf-product-danger", async function () {
        try {
          await Promise.resolve(core.safety.blockUser(context.userId));
        } catch (error) {
          toast(error && error.message || "Block request failed");
          return;
        }
        hideCardsFor(context.userId); close(); toast("تم حظر القارئ");
      }));
      controls.appendChild(actions);
      body.appendChild(controls);
    });
  }

  function profileAction(iconName, title, subtitle, handler) {
    return el("button", { class: "lf-product-action", type: "button", onclick: handler }, [
      el("span", { class: "lf-product-action-icon" }, icon(iconName, 17)),
      el("span", { class: "lf-product-action-copy" }, [el("strong", { text: title }), el("small", { text: subtitle })]),
      el("span", { class: "lf-product-chevron", "aria-hidden": "true", text: "‹" })
    ]);
  }

  function enhanceSettings() {
    doc.querySelectorAll(".lf-product-hub").forEach(function (oldHub) { oldHub.remove(); });
    var sheets = Array.prototype.slice.call(doc.querySelectorAll(".nc-sheet"));
    var settings = sheets.find(function (sheet) { return /الإعدادات|Settings/i.test(String(sheet.textContent || "")); });
    if (!settings || settings.querySelector(".lf-product-settings")) return;
    var content = settings.querySelector(":scope > div:last-child") || settings;
    var hub = el("section", { class: "lf-product-settings", "aria-label": "الخصوصية والسلامة" });
    hub.appendChild(el("header", { class: "lf-product-hub-head" }, [
      el("h2", { class: "lf-product-hub-title", text: "الخصوصية والسلامة" }),
      el("p", { class: "lf-product-hub-subtitle", text: "تحكم ببياناتك وتصحيحاتك والمحتوى الذي يظهر لك." })
    ]));
    hub.appendChild(profileAction(ICONS.data, "البيانات وخصوصية القوائم", "تصدير بياناتك وتحديد من يرى قوائمك", openDataCenter));
    hub.appendChild(profileAction(ICONS.correction, "مركز التصحيحات", "تابع أخطاء الأغلفة والشخصيات والبيانات", openCorrectionsCenter));
    hub.appendChild(profileAction(ICONS.safety, "السلامة والمحتوى", "البلاغات والحسابات المحظورة والمكتومة", openSafetyCenter));
    content.appendChild(hub);
    refreshIcons(hub);
  }

  function applyRecommendation(work, value, toolbar) {
    core.recommendations.setFeedback(work.id, value);
    work.rec = value === "more_like_this";
    toolbar.querySelectorAll("[data-feedback]").forEach(function (item) {
      item.classList.toggle("is-active", item.dataset.feedback === value);
    });
    try { if (typeof global.__lorefyRefresh === "function") global.__lorefyRefresh(); } catch (error) {}
    toast(value === "more_like_this" ? "سنقرب اقتراحات مشابهة" : "لن نعطي هذا العمل أولوية في اقتراحاتك");
  }

  function enhanceDetail() {
    var detail = doc.querySelector(".lf-detail-page");
    var content = detail && detail.querySelector(".lf-detail-content");
    if (!content || content.querySelector(".lf-product-detail-tools")) return;
    var work = currentWork();
    if (!work || !work.id) return;
    var toolbar = el("section", { class: "lf-product-detail-tools", "aria-label": "بيانات العمل والاقتراحات" });
    toolbar.appendChild(el("h3", { class: "lf-product-detail-tools-title", text: "بيانات العمل والاقتراحات" }));
    var segment = el("div", { class: "lf-product-segment" });
    var correction = button("تصحيح البيانات", "", function () { openCorrectionForm(work); });
    var more = button("المزيد مثل هذا", "", function () { applyRecommendation(work, "more_like_this", toolbar); });
    var less = button("غير مهتم", "", function () { applyRecommendation(work, "not_interested", toolbar); });
    more.dataset.feedback = "more_like_this";
    less.dataset.feedback = "not_interested";
    var feedback = core.recommendations.getFeedback()[String(work.id)];
    if (feedback && feedback.value === "more_like_this") more.classList.add("is-active");
    if (feedback && feedback.value === "not_interested") less.classList.add("is-active");
    segment.appendChild(correction); segment.appendChild(more); segment.appendChild(less);
    toolbar.appendChild(segment);
    content.appendChild(toolbar);
  }

  function enhanceReviews() {
    var hidden = new Set(core.safety.getBlockedUsers().concat(core.safety.getMutedUsers()).map(String));
    doc.querySelectorAll(".lf-review-card,.lf-review-detail").forEach(function (card) {
      var context = reviewContext(card);
      if (hidden.has(context.userId)) { card.style.display = "none"; return; }
      if (card.querySelector(":scope > .lf-product-review-menu")) return;
      var menu = el("button", { class: "lf-product-review-menu", type: "button", "aria-label": "خيارات المراجعة", onclick: function (event) {
        event.preventDefault(); event.stopPropagation(); openReviewSafety(context);
      } }, icon(ICONS.more, 18));
      card.insertBefore(menu, card.firstChild);
      refreshIcons(menu);
    });
  }

  function applyStoredRecommendations() {
    var feedback = core.recommendations.getFeedback();
    (global.LorefyMangaData || []).forEach(function (work) {
      var item = feedback[String(work.id)];
      if (item) work.rec = item.value === "more_like_this";
    });
  }

  function enhance() {
    pendingEnhance = false;
    enhanceSettings();
    enhanceDetail();
    enhanceReviews();
  }

  function scheduleEnhance() {
    if (pendingEnhance) return;
    pendingEnhance = true;
    global.requestAnimationFrame(enhance);
  }

  applyStoredRecommendations();
  var observer = new MutationObserver(scheduleEnhance);
  (doc.readyState === "loading" ? doc.addEventListener.bind(doc, "DOMContentLoaded") : function (fn) { fn(); })(function () {
    observer.observe(host(), { childList: true, subtree: true });
    scheduleEnhance();
  });
  global.addEventListener("lorefy:routechange", scheduleEnhance);
  global.addEventListener("lorefy:catalog-progress", function () { applyStoredRecommendations(); });

  global.LorefyProductTools = {
    core: core,
    openDataCenter: openDataCenter,
    openCorrectionsCenter: openCorrectionsCenter,
    openSafetyCenter: openSafetyCenter,
    openCorrectionForm: openCorrectionForm,
    enhance: enhance
  };
})(window);
