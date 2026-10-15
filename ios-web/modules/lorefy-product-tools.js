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
    if (name === ICONS.chevron && doc.documentElement.lang === "en") name = "chevron-right";
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
    if (overlay && overlay.__returnFocus && overlay.__returnFocus.isConnected) overlay.__returnFocus.focus({ preventScroll: true });
  }

  function openSheet(title, subtitle, build) {
    var existing = host().querySelector(".lf-product-overlay");
    if (existing) existing.remove();
    var overlay = el("div", { class: "lf-product-overlay", role: "presentation" });
    overlay.__returnFocus = doc.activeElement;
    var sheet = el("section", { class: "lf-product-sheet", role: "dialog", "aria-modal": "true", "aria-label": title });
    var close = el("button", { class: "lf-product-icon-button", type: "button", "aria-label": doc.documentElement.lang === 'en' ? 'Close' : 'إغلاق', onclick: function () { closeSheet(overlay); } }, icon(ICONS.close, 18));
    var heading = el("div", {}, [el("h2", { text: title }), subtitle ? el("p", { text: subtitle }) : null].filter(Boolean));
    var head = el("header", { class: "lf-product-sheet-head" }, [close, heading, el("span")]);
    var body = el("div", { class: "lf-product-sheet-body" });
    sheet.appendChild(el("div", { class: "lf-product-grabber" }));
    sheet.appendChild(head);
    sheet.appendChild(body);
    overlay.appendChild(sheet);
    overlay.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeSheet(overlay); return; }
      if (event.key !== "Tab") return;
      var controls = Array.from(sheet.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]'))
        .filter(function (control) { return control.getClientRects().length && !control.hidden; });
      var first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
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

  async function downloadFile(name, text, type) {
    var cap = global.Capacitor;
    var native = cap && (cap.isNativePlatform ? cap.isNativePlatform() : cap.getPlatform && cap.getPlatform() !== "web");
    if (native) {
      var filesystem = cap.Plugins && cap.Plugins.Filesystem;
      var share = cap.Plugins && cap.Plugins.Share;
      if (!filesystem || !filesystem.writeFile || !share || !share.share) throw new Error("native_export_unavailable");
      var saved = await filesystem.writeFile({ path: "Lorefy-exports/" + Date.now() + "-" + name, data: text, encoding: "utf8", directory: "CACHE", recursive: true });
      if (!saved || !saved.uri) throw new Error("native_export_file_missing");
      await share.share({ title: name, files: [saved.uri], dialogTitle: doc.documentElement.lang === "en" ? "Save or share your file" : "حفظ الملف أو مشاركته" });
      return;
    }
    var blob = new global.Blob([text], { type: type || "application/octet-stream" });
    var url = global.URL.createObjectURL(blob);
    var link = el("a", { href: url, download: name });
    doc.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(function () { global.URL.revokeObjectURL(url); }, 1000);
  }

  async function runExport(event, prepare, message) {
    var control = event && event.currentTarget;
    if (control) { control.disabled = true; control.setAttribute("aria-busy", "true"); }
    try { await prepare(); toast(message); }
    catch (error) {
      if (!/cancel/i.test(String(error && error.message || error))) toast(doc.documentElement.lang === "en" ? "Unable to export. Please try again." : "تعذر تصدير الملف. حاول مجددًا.");
    }
    finally { if (control) { control.disabled = false; control.removeAttribute("aria-busy"); } }
  }

  function csvCell(value) {
    var text = String(value == null ? "" : value);
    var formulaPrefix = /^\s*[=+@-]/.test(text);
    if (formulaPrefix) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function exportLibraryCsv() {
    var library = safeRead("lorefy.user.library.v2", {});
    var progress = safeRead("lorefy.user.progress.v2", {});
    var works = Array.isArray(global.LorefyMangaData) ? global.LorefyMangaData : [];
    var byId = new Map(works.map(function (work) { return [String(work.id), work]; }));
    var rows = [["id", "title", "type", "status", "chapter", "volume", "page", "note"]];
    Object.keys(library).forEach(function (id) {
      var work = byId.get(String(id)) || {};
      var itemProgress = progress[id] || {};
      rows.push([id, work.title || work.ar || "", work.type || "", library[id], itemProgress.chapter != null ? itemProgress.chapter : itemProgress.ch || 0, itemProgress.volume != null ? itemProgress.volume : itemProgress.vol || 0, itemProgress.page || 0, itemProgress.note || ""]);
    });
    var csv = "\ufeff" + rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
    return downloadFile("lorefy-library.csv", csv, "text/csv;charset=utf-8");
  }

  function allLists() {
    var workLists = safeRead("lorefy.customLists.v1", []);
    var characterLists = safeRead("lorefy.charTopLists.v1", []);
    var sections = global.LorefyProfileSections;
    var profileLists = sections ? sections.foldersFor({}, true, global.localStorage).map(function (list) {
      return { id: list.id, name: list.name, kind: list.kind === 'characters' ? 'شخصيات' : 'أعمال', profileList: true, isPublic: list.isPublic };
    }) : [];
    return profileLists.concat(workLists.map(function (list) { return { id: list.id, name: list.name || "قائمة أعمال", kind: "أعمال" }; })
      .concat(characterLists.map(function (list) { return { id: list.id, name: list.title || "قائمة شخصيات", kind: "شخصيات" }; })));
  }

  function accountStamp() {
    var backend = global.LorefyBackend;
    return JSON.stringify([global.localStorage.getItem('lorefy.activeUser.v1'), safeRead('lorefy.session.v1', {}).userId,
      safeRead('lorefy.identity.v1', {}).id, backend && backend.user && backend.user.id]);
  }

  function renderVisibilityRows(container) {
    var lists = allLists();
    var stamp = accountStamp(), sections = global.LorefyProfileSections;
    var owner = sections && sections.account(global.localStorage);
    if (!lists.length) {
      container.appendChild(el("div", { class: "lf-product-empty", text: "لا توجد قوائم مخصصة بعد. أي قائمة جديدة تبدأ كقائمة خاصة." }));
      return;
    }
    lists.forEach(function (list) {
      var select = el("select", { "aria-label": "خصوصية " + list.name });
      var selected = list.profileList ? (list.isPublic ? 'public' : 'private') : core.privacy.getListVisibility(list.id);
      (list.profileList ? ["private", "public"] : ["private", "unlisted", "public"]).forEach(function (value) {
        var option = el("option", { value: value, text: VISIBILITY_LABELS[value] });
        if (selected === value) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", async function () {
        if (select.disabled) return;
        if (stamp !== accountStamp()) { select.disabled = true; return; }
        select.disabled = true;
        try {
          var synced = true;
          if (list.profileList) {
            sections.setFolderVisibility(global.localStorage, owner, list.id, select.value === 'public');
            selected = select.value;
            var backend = global.LorefyBackend;
            if (backend && backend.mode === 'live') {
              try { synced = await backend.push() !== false; } catch (_) { synced = false; }
            }
          } else {
            core.privacy.setListVisibility(list.id, select.value);
            selected = select.value;
          }
          if (stamp !== accountStamp() || !container.isConnected) return;
          toast(synced ? (doc.documentElement.lang === 'en' ? 'List visibility updated' : 'تم تحديث خصوصية القائمة') : sections.labels(doc.documentElement.lang).syncPending);
        } catch (_) {
          if (stamp !== accountStamp() || !container.isConnected) return;
          select.value = selected;
          toast(doc.documentElement.lang === 'en' ? 'Could not update list visibility. Try again.' : 'تعذر تحديث خصوصية القائمة. حاول مجددًا.');
        } finally {
          if (stamp === accountStamp()) select.disabled = false;
        }
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
      exportButtons.appendChild(button("تصدير JSON", "lf-product-secondary", function (event) {
        var data = core.exportPortable(new Date());
        return runExport(event, function () { return downloadFile("lorefy-data.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8"); }, "تم تجهيز نسخة بياناتك");
      }, ICONS.file));
      exportButtons.appendChild(button("المكتبة CSV", "lf-product-secondary", function (event) { return runExport(event, exportLibraryCsv, "تم تجهيز ملف المكتبة"); }, ICONS.table));
      exports.appendChild(exportButtons);
      if (global.LorefyMonitoring && global.LorefyMonitoring.getDiagnostics) {
        exports.appendChild(button("تصدير تقرير التشخيص", "lf-product-secondary", function (event) {
          return runExport(event, function () { return downloadFile("lorefy-diagnostics.json", JSON.stringify(global.LorefyMonitoring.getDiagnostics(), null, 2), "application/json;charset=utf-8"); }, "تم تجهيز تقرير التشخيص بدون بيانات الحساب");
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
    var stamp = accountStamp();
    var remove = async function (event) {
      var control = event.currentTarget;
      if (control.disabled) return;
      if (stamp !== accountStamp()) { control.disabled = true; return; }
      control.disabled = true;
      try {
        if (kind === "blocked") await core.safety.unblockUser(userId); else core.safety.unmuteUser(userId);
        if (stamp !== accountStamp() || !control.isConnected) return;
        openSafetyCenter();
        toast(doc.documentElement.lang === 'en' ? (kind === 'blocked' ? 'User unblocked' : 'User unmuted') : (kind === "blocked" ? "تم إلغاء الحظر" : "تم إلغاء الكتم"));
      } catch (_) {
        if (stamp === accountStamp() && control.isConnected) toast(doc.documentElement.lang === 'en' ? 'Could not update. Try again.' : 'تعذر التحديث. حاول مجددًا.');
      } finally {
        if (stamp === accountStamp()) control.disabled = false;
      }
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
      own: Boolean(liveUserId && (liveUserId === 'me' || liveUserId === String(global.LorefyBackend && global.LorefyBackend.user && global.LorefyBackend.user.id || ''))),
      card: card
    };
  }

  function hideCardsFor(userId) {
    doc.querySelectorAll(".lf-review-card,.lf-review-detail").forEach(function (card) {
      if (reviewContext(card).userId === userId) card.style.display = "none";
    });
    global.dispatchEvent(new global.CustomEvent('lorefy:reader-safety-changed'));
  }

  function openReviewSafety(context) {
    if (context.own) return;
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
      el("span", { class: "lf-product-chevron", "aria-hidden": "true", text: doc.documentElement.lang === "en" ? "›" : "‹" })
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

  function enhanceAuthor(work, toolbar) {
    var author = work.auth || work.au || work.author;
    if (author && !toolbar.querySelector('.lf-product-author-link') && factory.authorWorks([work],author).length) {
      toolbar.appendChild(button(String(author),'lf-product-author-link',function () { openAuthor(author); },'library-big'));
      refreshIcons(toolbar);
    }
  }
  function enhanceDetail() {
    var detail = doc.querySelector(".lf-detail-page");
    var content = detail && detail.querySelector(".lf-detail-content");
    if (!content) return;
    var work = currentWork();
    if (!work || !work.id) return;
    var existing = content.querySelector('.lf-product-detail-tools');
    if (existing) { enhanceAuthor(work,existing); return; }
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
    enhanceAuthor(work,toolbar);
    content.appendChild(toolbar);
  }

  var authorRefresh = null;
  function openAuthor(author) {
    var en = doc.documentElement.lang === 'en';
    openSheet(String(author),en ? 'Works in the catalog' : 'الأعمال المتاحة في المكتبة',function (body) {
      var works = factory.authorWorks(global.LorefyMangaData || [],author,global.LorefyCatalogIdentity,global.LorefyCatalogAliases);
      var count = el('p',{class:'lf-author-count',text:works.length + (en ? ' works' : ' عمل')}); body.appendChild(count);
      var grid = el('div',{class:'lf-author-grid'}); body.appendChild(grid);
      var shown = 0;
      var more = button(en ? 'Load more' : 'عرض المزيد','lf-product-author-more',append,'chevron-down');
      body.appendChild(more);
      function append() {
        works.slice(shown,shown+24).forEach(function (item) {
          var query = new URLSearchParams(global.location.search);
          query.set('route','detail'); query.set('novel',String(item.id)); query.delete('search');
          var title = item.title || item.en || item.ar || String(item.id);
          var link = el('a',{class:'lf-author-work',href:global.location.pathname + '?' + query.toString(),'aria-label':title});
          var cover = global.LorefyCoverAPI && global.LorefyCoverAPI.primary ? global.LorefyCoverAPI.primary(item) : item.cover;
          if (cover) link.appendChild(el('img',{src:cover,alt:'',loading:'lazy',decoding:'async',onerror:function (event) { event.target.hidden=true; }}));
          link.appendChild(el('strong',{text:title,dir:'auto','data-no-translate':''}));
          link.appendChild(el('small',{text:[item.type,item.yr || item.year].filter(Boolean).join(' · ')}));
          grid.appendChild(link);
        });
        shown += 24; more.hidden = shown >= works.length; refreshIcons(body);
      }
      append();
      authorRefresh = function () {
        if (!body.isConnected) { authorRefresh = null; return; }
        var updated = factory.authorWorks(global.LorefyMangaData || [],author,global.LorefyCatalogIdentity,global.LorefyCatalogAliases);
        if (updated.length === works.length && updated.every(function (work,index) { return work.id === works[index].id; })) return;
        works = updated; shown = 0; grid.replaceChildren();
        count.textContent = works.length + (en ? ' works' : ' عمل'); append();
      };
      var status = el('p',{class:'lf-author-status',role:'status',text:en ? 'Finding this author’s works…' : 'جارٍ البحث عن أعمال الكاتب…'}); body.appendChild(status);
      var loader=global.LorefyCatalogLoader;
      var request=loader && loader.loadAuthor ? loader.loadAuthor(author,function(){ return body.isConnected; }) : Promise.resolve();
      request.then(function(){
        if (!body.isConnected) return;
        if (authorRefresh) authorRefresh();
        status.textContent=works.length ? '' : en ? 'No attributed works available yet.' : 'لا توجد أعمال موثقة لهذا المؤلف بعد.';
      }).catch(function(){ if (body.isConnected) status.textContent=en ? 'Some works could not be loaded. Reopen to retry.' : 'تعذر تحميل بعض الأعمال. أعد فتح الكاتب للمحاولة.'; });
    });
  }

  function enhanceReviews() {
    var hidden = new Set(core.safety.getBlockedUsers().concat(core.safety.getMutedUsers()).map(String));
    doc.querySelectorAll(".lf-review-card,.lf-review-detail").forEach(function (card) {
      var context = reviewContext(card);
      if (context.own) return;
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
  global.addEventListener("lorefy:catalog-progress", function () { applyStoredRecommendations(); scheduleEnhance(); if(authorRefresh) authorRefresh(); });
  global.addEventListener("lorefy:catalog-ingested", function () { scheduleEnhance(); if(authorRefresh) authorRefresh(); });

  global.LorefyProductTools = {
    core: core,
    openAuthor: openAuthor,
    openDataCenter: openDataCenter,
    openCorrectionsCenter: openCorrectionsCenter,
    openSafetyCenter: openSafetyCenter,
    openCorrectionForm: openCorrectionForm,
    enhance: enhance
  };
})(window);
