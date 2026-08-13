(function (global) {
  "use strict";

  var doc = global.document;
  if (!doc || global.LorefyShareStudio) return;

  var SHARE_W = 1080;
  var SHARE_H = 1920;
  var scheduled = false;

  function toast(message) {
    try {
      if (global.LorefyToast) return global.LorefyToast(message);
    } catch (error) {}
    var current = doc.querySelector(".lf-share-studio-status.is-toast");
    if (current) current.remove();
    var el = doc.createElement("div");
    el.className = "lf-share-studio-status is-toast";
    el.textContent = message;
    (doc.getElementById("screen") || doc.body).appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  function sanitizeUrl() {
    var url = new URL(global.location.href);
    url.searchParams.delete("fresh");
    return url.href;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function trimText(ctx, text, maxWidth) {
    var raw = String(text || "");
    var value = raw;
    while (value.length > 1 && ctx.measureText(value + "…").width > maxWidth) value = value.slice(0, -1);
    return value === raw ? value : value + "…";
  }

  function canvasFile(canvas, name) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) return reject(new Error("share-image-empty"));
        resolve(new File([blob], name || "lorefy-story.png", { type: "image/png" }));
      }, "image/png", 0.94);
    });
  }

  function sourceToFile(src, name) {
    return fetch(src).then(function (response) { return response.blob(); }).then(function (blob) {
      return new File([blob], name || "lorefy-story.png", { type: blob.type || "image/png" });
    });
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function mediaProxySource(src) {
    var value = String(src || "").trim();
    if (!/^https:\/\//i.test(value)) return value;
    return "/api/media?url=" + encodeURIComponent(value);
  }

  function shareSourceCandidates(src) {
    var value = String(src || "").trim();
    if (!value) return [];
    if (/^(data:|blob:)/i.test(value)) return [value];
    try {
      var parsed = new URL(value, global.location.href);
      if (parsed.pathname === "/api/media") {
        var original = parsed.searchParams.get("url") || "";
        return [value, original].filter(Boolean);
      }
    } catch (error) {}
    if (/^https:\/\//i.test(value)) return [mediaProxySource(value), value];
    return [value];
  }

  function loadImage(src) {
    var candidates = shareSourceCandidates(src);
    return new Promise(function (resolve) {
      var index = 0;
      var seen = {};
      function next() {
        var candidate = candidates[index++];
        if (!candidate) return resolve(null);
        if (seen[candidate]) return next();
        seen[candidate] = true;
        var image = new Image();
        var settled = false;
        var finish = function (value) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (value) resolve(value);
          else next();
        };
        var timer = setTimeout(function () { finish(null); }, 4600);
        if (!/^(data:|blob:)/i.test(candidate)) image.crossOrigin = "anonymous";
        image.onload = function () { finish(image); };
        image.onerror = function () { finish(null); };
        image.src = candidate;
      }
      next();
    });
  }

  function drawCover(ctx, image, x, y, w, h, radius, seed) {
    ctx.save();
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
    if (image) {
      var scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
      var dw = image.naturalWidth * scale;
      var dh = image.naturalHeight * scale;
      ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else {
      var hue = Math.abs(String(seed || "Lorefy").split("").reduce(function (sum, char) { return sum * 31 + char.charCodeAt(0); }, 7)) % 360;
      var fill = ctx.createLinearGradient(x, y, x + w, y + h);
      fill.addColorStop(0, "hsl(" + hue + " 34% 50%)");
      fill.addColorStop(1, "hsl(" + ((hue + 28) % 360) + " 28% 28%)");
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.textAlign = "center";
      ctx.font = "800 56px Arial";
      ctx.fillText(String(seed || "L").trim().slice(0, 1).toUpperCase(), x + w / 2, y + h / 2 + 18);
    }
    ctx.restore();
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.16)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 14;
    ctx.strokeStyle = "rgba(28,28,30,.14)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, radius);
    ctx.stroke();
    ctx.restore();
  }

  function drawShelf(ctx, y) {
    ctx.fillStyle = "#d1d1d6";
    roundRect(ctx, 72, y, SHARE_W - 144, 18, 9);
    ctx.fill();
    ctx.fillStyle = "rgba(28,28,30,.08)";
    roundRect(ctx, 96, y + 18, SHARE_W - 192, 14, 7);
    ctx.fill();
  }

  function cardTitle(card) {
    var preferred = card.querySelector(".lf-work-share-card-new h3, .lf-cb-poster h3, .lf-pref-share-sheet-head strong, h2, h3");
    if (preferred && preferred.textContent.trim()) return preferred.textContent.trim();
    var text = card.textContent.replace(/\s+/g, " ").trim();
    return text.split(/مشاركة|حفظ|نسخ/).filter(Boolean)[0] || "رف Lorefy";
  }

  function shareText(card) {
    var title = cardTitle(card);
    return title + " — من رفّي على Lorefy\n#Lorefy";
  }

  function findWorkRating(original) {
    var ownText = original ? original.textContent.replace(/\s+/g, " ") : "";
    var beforeOwn = ownText.match(/([1-5](?:\.[0-9])?)\s*\/\s*5\s*(?:تقييمي الشخصي|تقييمي|تقييمك)/);
    if (beforeOwn) return beforeOwn[1];
    var explicit = ownText.match(/(?:تقييمي|تقييمك|التقييم)\s*([1-5](?:\.[0-9])?)/);
    if (explicit) return explicit[1];
    var candidates = Array.prototype.slice.call(doc.querySelectorAll(".lf-detail-page *")).filter(function (node) {
      return node.childElementCount === 0 && /^[1-5](?:\.[0-9])$/.test(node.textContent.trim());
    }).map(function (node) { return node.textContent.trim(); });
    return candidates[0] || "—";
  }

  function collectImages(card) {
    var seen = {};
    var preferred = card.querySelectorAll(".lf-work-share-cover img");
    if (!preferred.length) preferred = card.querySelectorAll(".lf-cb-poster-tile img");
    var images = preferred.length ? preferred : card.querySelectorAll("img");
    return Array.prototype.slice.call(images).map(function (img) { return img.getAttribute("data-share-src") || img.currentSrc || img.src || ""; }).filter(function (src) {
      if (!src || seen[src]) return false;
      seen[src] = true;
      return true;
    }).slice(0, 10);
  }

  function collectLabels(card, count) {
    var labels = Array.prototype.slice.call(card.querySelectorAll(".lf-cb-poster-name, .lf-pref-slot-cover + strong, h3, [style*='font-weight: 900']"))
      .map(function (node) { return node.textContent.replace(/\s+/g, " ").trim(); })
      .filter(Boolean);
    return Array.from({ length: count }).map(function (_, index) { return labels[index] || (index === 0 ? cardTitle(card) : "Lorefy"); });
  }

  function buildShelfStoryFile(card) {
    var canvas = doc.createElement("canvas");
    canvas.width = SHARE_W;
    canvas.height = SHARE_H;
    var ctx = canvas.getContext("2d");
    var title = cardTitle(card);
    var isCharacterBoard = !!card.querySelector(".lf-cb-poster-tile");
    var sources = collectImages(card);
    if (isCharacterBoard && sources.length < 10) {
      sources = sources.concat(new Array(10 - sources.length).fill(null));
    }
    var profileAvatar = card.querySelector(".lf-work-share-user img");
    var profileName = card.querySelector(".lf-work-share-user strong");
    var profileHandle = card.querySelector(".lf-work-share-user small");
    var profileRating = card.querySelector(".lf-work-share-rating");
    return Promise.all([Promise.all(sources.map(loadImage)), loadImage(profileAvatar && profileAvatar.src)]).then(function (result) {
      var images = result[0], avatarImage = result[1];
      var background = ctx.createLinearGradient(0, 0, 0, SHARE_H);
      background.addColorStop(0, "#ffffff");
      background.addColorStop(1, "#f0f0f5");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, SHARE_W, SHARE_H);
      ctx.fillStyle = "#007aff";
      ctx.fillRect(SHARE_W - 18, 0, 18, SHARE_H);
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#1c1c1e";
      ctx.textAlign = "right";
      ctx.direction = "rtl";
      ctx.font = "900 74px Cairo, Arial";
      ctx.fillText(trimText(ctx, title, 820), SHARE_W - 74, 226);
      ctx.fillStyle = "#6e6e73";
      ctx.font = "700 30px Cairo, Arial";
      ctx.fillText("اختيارات قارئ Lorefy", SHARE_W - 74, 286);
      ctx.direction = "ltr";
      ctx.textAlign = "left";
      ctx.fillStyle = "#1c1c1e";
      ctx.font = "900 25px Arial";
      ctx.fillText("LOREFY", 74, 100);
      ctx.fillStyle = "#007aff";
      ctx.fillRect(74, 126, 84, 8);

      if (profileName || profileRating) {
        ctx.fillStyle = "#f2f2f7";
        roundRect(ctx, 74, 330, SHARE_W - 148, 96, 24);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(SHARE_W - 126, 378, 32, 0, Math.PI * 2);
        ctx.clip();
        if (avatarImage) ctx.drawImage(avatarImage, SHARE_W - 158, 346, 64, 64);
        else { ctx.fillStyle = "#007aff"; ctx.fillRect(SHARE_W - 158, 346, 64, 64); }
        ctx.restore();
        ctx.direction = "rtl";
        ctx.textAlign = "right";
        ctx.fillStyle = "#1c1c1e";
        ctx.font = "900 27px Cairo, Arial";
        ctx.fillText((profileName && profileName.textContent.trim()) || "قارئ Lorefy", SHARE_W - 178, 374);
        ctx.fillStyle = "#8e8e93";
        ctx.font = "700 20px Arial";
        ctx.fillText((profileHandle && profileHandle.textContent.trim()) || "@lorefy_reader", SHARE_W - 178, 404);
        ctx.direction = "ltr";
        ctx.textAlign = "left";
        ctx.fillStyle = "#ff9500";
        ctx.font = "900 31px Arial";
        ctx.fillText("★ " + ((profileRating && profileRating.textContent.replace(/[^0-9.—]/g, "")) || "—"), 110, 389);
      }

      var useSingle = !isCharacterBoard && images.length <= 1;
      var labels = collectLabels(card, isCharacterBoard ? 10 : Math.max(1, images.length));
      if (useSingle) {
        var coverW = 430;
        var coverH = 650;
        var coverX = (SHARE_W - coverW) / 2;
        var coverY = 520;
        drawCover(ctx, images[0], coverX, coverY, coverW, coverH, 24, labels[0]);
        drawShelf(ctx, coverY + coverH + 34);
        ctx.direction = "rtl";
        ctx.textAlign = "center";
        ctx.fillStyle = "#1c1c1e";
        ctx.font = "900 50px Cairo, Arial";
        ctx.fillText(trimText(ctx, labels[0], 760), SHARE_W / 2, coverY + coverH + 130);
      } else {
        var cols = 5;
        var gap = 24;
        var coverWidth = 166;
        var coverHeight = 250;
        var startX = (SHARE_W - (coverWidth * cols + gap * (cols - 1))) / 2;
        var rowsY = [520, 1120];
        for (var i = 0; i < 10; i++) {
          var row = Math.floor(i / cols);
          var x = startX + (i % cols) * (coverWidth + gap);
          var y = rowsY[row];
          drawCover(ctx, images[i], x, y, coverWidth, coverHeight, 14, labels[i] || String(i + 1));
          ctx.fillStyle = i === 0 ? "#ff9f0a" : "#007aff";
          roundRect(ctx, x + coverWidth - 38, y + 10, 28, 28, 8);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.font = "900 17px Arial";
          ctx.fillText(String(i + 1), x + coverWidth - 24, y + 30);
          ctx.direction = "rtl";
          ctx.fillStyle = "#3a3a3c";
          ctx.font = "700 17px Cairo, Arial";
          ctx.fillText(trimText(ctx, labels[i] || "", coverWidth), x + coverWidth / 2, y + coverHeight + 36);
          ctx.direction = "ltr";
        }
        drawShelf(ctx, rowsY[0] + coverHeight + 58);
        drawShelf(ctx, rowsY[1] + coverHeight + 58);
      }

      ctx.direction = "rtl";
      ctx.textAlign = "right";
      ctx.fillStyle = "#6e6e73";
      ctx.font = "700 27px Cairo, Arial";
      ctx.fillText("اكتشف · قيّم · شارك", SHARE_W - 74, SHARE_H - 126);
      ctx.direction = "ltr";
      ctx.textAlign = "left";
      ctx.fillStyle = "#007aff";
      ctx.font = "900 30px Arial";
      ctx.fillText("#Lorefy", 74, SHARE_H - 126);
      return canvasFile(canvas, "lorefy-story.png");
    });
  }

  function previewFile(card) {
    var prepared = card.querySelector(".lf-pref-share-image-preview[src], .lf-character-story-preview[src]");
    if (prepared && prepared.src) return sourceToFile(prepared.src, "lorefy-story.png").catch(function () { return buildShelfStoryFile(card); });
    return buildShelfStoryFile(card);
  }

  function downloadFile(file) {
    var url = URL.createObjectURL(file);
    var link = doc.createElement("a");
    link.href = url;
    link.download = file.name || "lorefy-story.png";
    doc.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1600);
  }

  async function nativeFileShare(file, title, text) {
    if (navigator.share && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title: title, text: text, files: [file] });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ title: title, text: text, url: sanitizeUrl() });
      return true;
    }
    if (file) downloadFile(file);
    return false;
  }

  function openExternal(url) {
    global.open(url, "_blank", "noopener,noreferrer");
  }

  function icon(platform) {
    if (platform === "instagram") return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
    if (platform === "x") return '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg>';
    if (platform === "whatsapp") return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"/><path d="M8.6 8.3c.8 3.1 2.5 4.8 5.6 5.7"/></svg>';
    if (platform === "telegram") return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
  }

  function platformButton(platform, label) {
    return '<button type="button" class="lf-share-platform" data-platform="' + platform + '"><span class="lf-share-platform-icon">' + icon(platform) + '</span><small>' + label + '</small></button>';
  }

  var INSTAGRAM_PLATFORM_SELECTOR = '[data-platform="instagram"]';

  async function handlePlatform(card, platform, status) {
    var text = shareText(card);
    var title = cardTitle(card);
    if (platform === "x") {
      openExternal("https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) + "&url=" + encodeURIComponent(sanitizeUrl()));
      return;
    }
    if (platform === "whatsapp") {
      openExternal("https://wa.me/?text=" + encodeURIComponent(text + "\n" + sanitizeUrl()));
      return;
    }
    if (platform === "telegram") {
      openExternal("https://t.me/share/url?url=" + encodeURIComponent(sanitizeUrl()) + "&text=" + encodeURIComponent(text));
      return;
    }
    status.textContent = platform === "instagram" ? "اختر Instagram ثم قصتك من نافذة المشاركة." : "جاري تجهيز الصورة للمشاركة…";
    try {
      var file = await (card.__lfStoryFile || (card.__lfStoryFile = previewFile(card)));
      await nativeFileShare(file, title, text);
      status.textContent = "الصورة جاهزة للمشاركة.";
    } catch (error) {
      if (error && error.name === "AbortError") status.textContent = "تم إلغاء المشاركة.";
      else {
        status.textContent = "تم حفظ الصورة لأن المشاركة المباشرة غير متاحة هنا.";
        try { downloadFile(await (card.__lfStoryFile || previewFile(card))); } catch (fallbackError) {}
      }
    }
  }

  function addPlatformRail(card, beforeNode) {
    if (!card || card.querySelector(":scope > .lf-share-studio-platforms")) return;
    var section = doc.createElement("section");
    section.className = "lf-share-studio-platforms";
    section.innerHTML = '<strong>شارك إلى</strong><div class="lf-share-platform-row">' +
      platformButton("instagram", "ستوري") +
      platformButton("x", "X") +
      platformButton("whatsapp", "واتساب") +
      platformButton("telegram", "تيليجرام") +
      platformButton("more", "المزيد") +
      '</div><p class="lf-share-studio-status" aria-live="polite"></p>';
    card.insertBefore(section, beforeNode || null);
    var status = section.querySelector(".lf-share-studio-status");
    section.addEventListener("click", function (event) {
      var button = event.target.closest(".lf-share-platform");
      if (!button) return;
      handlePlatform(card, button.getAttribute("data-platform"), status);
    });
    card.__lfStoryFile = previewFile(card).catch(function () { return null; });
    var instagramButton = section.querySelector(INSTAGRAM_PLATFORM_SELECTOR);
    if (instagramButton) instagramButton.title = "مشاركة الصورة إلى ستوري Instagram";
  }

  function enhanceProfile() {
    var page = doc.querySelector(".lf-profile-page");
    if (!page) return;
    page.classList.add("lf-profile-merged");
    var favorites = page.querySelector(".lf-profile-favorites");
    if (!favorites) return;
    Array.prototype.forEach.call(favorites.children, function (slot, index) {
      var target = slot.firstElementChild;
      if (!target || target.__lfKeyboardReady) return;
      target.__lfKeyboardReady = true;
      target.setAttribute("role", "link");
      target.setAttribute("tabindex", "0");
      target.setAttribute("aria-label", "فتح العمل المفضل " + (index + 1));
      target.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          target.click();
        }
      });
    });
  }

  function enhancePreferenceShare() {
    Array.prototype.forEach.call(doc.querySelectorAll(".lf-pref-share-sheet-card"), function (card) {
      card.classList.add("lf-share-studio-card");
      addPlatformRail(card, card.querySelector(".lf-pref-share-sheet-actions"));
    });
  }

  function enhanceCharacterShare() {
    Array.prototype.forEach.call(doc.querySelectorAll(".lf-cb-share-card"), function (card) {
      card.classList.add("lf-share-studio-card");
      addPlatformRail(card, card.querySelector(".lf-cb-share-actions"));
      var preview = card.querySelector(".lf-cb-share-preview");
      var poster = preview && preview.querySelector(".lf-cb-poster");
      if (!preview || !poster) return;
      var signature = Array.prototype.map.call(poster.querySelectorAll("img"), function (image) { return image.getAttribute("data-share-src") || image.currentSrc || image.src; }).join("|");
      if (card.__lfCharacterPreviewSignature === signature && preview.querySelector(".lf-character-story-preview")) return;
      card.__lfCharacterPreviewSignature = signature;
      clearTimeout(card.__lfCharacterPreviewTimer);
      card.__lfCharacterPreviewTimer = setTimeout(function () {
        var loading = preview.querySelector(".lf-character-story-loading");
        if (!loading) {
          loading = doc.createElement("div");
          loading.className = "lf-character-story-loading";
          loading.textContent = "جاري تجهيز صور الشخصيات…";
          preview.appendChild(loading);
        }
        card.__lfStoryFile = null;
        buildShelfStoryFile(card).then(function (file) {
          card.__lfStoryFile = Promise.resolve(file);
          return fileToDataUrl(file);
        }).then(function (url) {
          var image = preview.querySelector(".lf-character-story-preview");
          if (!image) {
            image = doc.createElement("img");
            image.className = "lf-character-story-preview";
            image.alt = "صورة قائمة الشخصيات للمشاركة";
            preview.appendChild(image);
          }
          image.src = url;
          poster.classList.add("is-story-source-hidden");
          loading.remove();
        }).catch(function () { loading.textContent = "تعذر تجهيز بعض الصور. حاول مرة أخرى."; });
      }, 1200);
    });
  }

  function enhanceWorkShare() {
    Array.prototype.forEach.call(doc.querySelectorAll(".nc-fade"), function (fade) {
      if (fade.classList.contains("lf-work-share-sheet")) return;
      var text = fade.textContent.replace(/\s+/g, " ");
      if (text.indexOf("مشاركة العمل") < 0 || text.indexOf("نسخ الرابط") < 0) return;
      fade.classList.add("lf-work-share-sheet");
      var card = fade.querySelector(":scope > .nc-sheet");
      if (!card) return;
      card.classList.add("lf-share-studio-card");
      var children = card.children;
      if (children[2]) {
        var original = children[2];
        var lines = original.innerText.split("\n").map(function (line) { return line.trim(); }).filter(Boolean);
        var images = original.querySelectorAll("img");
        original.classList.add("lf-work-share-preview", "lf-work-share-original");
        var cover = images[1] || images[0];
        var avatar = images[2] || null;
        var type = lines[0] || "عمل";
        var title = lines[1] || "من رف Lorefy";
        var meta = lines[2] || "";
        var handle = lines.filter(function (line) { return line.charAt(0) === "@"; })[0] || "@lorefy_reader";
        var handleIndex = lines.indexOf(handle);
        var accountName = handleIndex > 0 ? lines[handleIndex - 1] : "قارئ Lorefy";
        var rating = findWorkRating(original);
        var preview = doc.createElement("article");
        preview.className = "lf-work-share-card-new lf-share-shelf-preview";
        preview.innerHTML = '<header><strong>LOREFY</strong><span>من رف القارئ</span></header><div class="lf-work-share-cover"></div><div class="lf-work-share-shelf" aria-hidden="true"></div><span class="lf-work-share-type"></span><h3></h3><p></p><div class="lf-work-share-user"><span class="lf-work-share-avatar"></span><span class="lf-work-share-user-copy"><strong></strong><small></small></span><b class="lf-work-share-rating"><i>★</i><span></span></b></div><footer><span>اكتشف · قيّم · شارك</span><b>#Lorefy</b></footer>';
        if (cover) {
          var cleanCover = doc.createElement("img");
          cleanCover.src = cover.currentSrc || cover.src;
          cleanCover.alt = title;
          cleanCover.referrerPolicy = "no-referrer";
          preview.querySelector(".lf-work-share-cover").appendChild(cleanCover);
        }
        preview.querySelector(".lf-work-share-type").textContent = type;
        preview.querySelector("h3").textContent = title;
        preview.querySelector("p").textContent = meta;
        if (avatar) {
          var avatarImage = doc.createElement("img");
          avatarImage.src = avatar.currentSrc || avatar.src;
          avatarImage.alt = accountName;
          preview.querySelector(".lf-work-share-avatar").appendChild(avatarImage);
        }
        preview.querySelector(".lf-work-share-user-copy strong").textContent = accountName;
        preview.querySelector(".lf-work-share-user-copy small").textContent = handle;
        preview.querySelector(".lf-work-share-rating span").textContent = rating;
        card.insertBefore(preview, original.nextSibling);
      }
      addPlatformRail(card, card.lastElementChild);
    });
  }

  function scan() {
    scheduled = false;
    enhanceProfile();
    enhancePreferenceShare();
    enhanceCharacterShare();
    enhanceWorkShare();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (global.requestAnimationFrame || global.setTimeout)(scan);
  }

  var observer = new MutationObserver(schedule);
  observer.observe(doc.getElementById("screen") || doc.body, { childList: true, subtree: true });
  global.addEventListener("popstate", schedule);
  global.addEventListener("hashchange", schedule);
  global.LorefyShareStudio = {
    scan: scan,
    buildShelfStoryFile: buildShelfStoryFile,
    nativeFileShare: nativeFileShare,
    saveFile: downloadFile
  };
  schedule();
})(window);
