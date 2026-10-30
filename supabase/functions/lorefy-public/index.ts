const SUPPORT_EMAIL = "lorefysupport@gmail.com";
const baseUrl = "https://qsroxmltioxqozmykens.supabase.co/functions/v1/lorefy-public";
const IMAGE_HOSTS = new Set([
  "s3.anilist.co", "s4.anilist.co", "cdn.myanimelist.net", "myanimelist.net", "media.kitsu.app",
  "covers.openlibrary.org", "images.ranobedb.org", "uploads.mangadex.org", "books.google.com",
  "books.googleusercontent.com", "lh3.googleusercontent.com", "m.media-amazon.com",
  "images-na.ssl-images-amazon.com", "commons.wikimedia.org", "upload.wikimedia.org",
  "images.weserv.nl", "wsrv.nl", "archive.org", "ak-asset.jarir.com", "freewebnovel.com"
]);
const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
const MAX_CATALOG_BYTES = 4 * 1024 * 1024;
const CATALOG_TARGETS: Record<string, string> = {
  "catalog-mangadex": "https://api.mangadex.org/manga",
  "catalog-mangadex-covers": "https://api.mangadex.org/cover",
  "catalog-openlibrary": "https://openlibrary.org/search.json",
  "catalog-openlibrary-editions": "https://openlibrary.org/works",
  "catalog-googlebooks": "https://www.googleapis.com/books/v1/volumes",
  "catalog-jikan": "https://api.tenrai.org/v1",
  "catalog-anilist": "https://graphql.anilist.co",
  "catalog-wikipedia": "https://en.wikipedia.org/w/api.php",
  "catalog-wikidata": "https://www.wikidata.org/w/api.php",
  "catalog-commons": "https://commons.wikimedia.org/w/api.php",
  "catalog-dc-fandom": "https://dc.fandom.com/api.php",
  "catalog-marvel-fandom": "https://marvel.fandom.com/api.php"
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "authorization,apikey,content-type,accept",
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "Access-Control-Expose-Headers": "Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset"
  };
}

async function catalogBytes(response: Response): Promise<Uint8Array> {
  function tooLarge(): never { throw new Error("Catalog response too large"); }
  if (Number(response.headers.get("content-length")) > MAX_CATALOG_BYTES) {
    if (response.body) void response.body.cancel().catch(function(){});
    return tooLarge();
  }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_CATALOG_BYTES) {
        void reader.cancel().catch(function(){});
        return tooLarge();
      }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

async function catalogProxy(request: Request, provider: string, url: URL) {
  const targetBase = CATALOG_TARGETS[provider];
  if (!targetBase) return new Response("Not Found", { status: 404, headers: corsHeaders() });
  const allowPost = provider === "catalog-anilist";
  if (!(request.method === "GET" || request.method === "HEAD" || (allowPost && request.method === "POST"))) {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
  }
  let body: string | undefined;
  if (request.method === "POST") {
    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 256 * 1024) {
      return new Response("Payload Too Large", { status: 413, headers: corsHeaders() });
    }
  }
  try {
    let target = targetBase;
    if (provider === "catalog-anilist") {
      target = targetBase;
    } else if (provider === "catalog-jikan") {
      const safePath = String(url.searchParams.get("path") || "").replace(/^\/+/, "");
      if (!/^(?:manga(?:\/\d+(?:\/(?:characters|pictures))?)?|characters(?:\/\d+\/pictures)?)$/.test(safePath)) {
        return new Response("Invalid catalog path", { status: 400, headers: corsHeaders() });
      }
      const search = new URLSearchParams(url.search);
      search.delete("path");
      target = targetBase + "/" + safePath + (search.toString() ? "?" + search.toString() : "");
    } else if (provider === "catalog-openlibrary-editions") {
      const workId = String(url.searchParams.get("work") || "").toUpperCase();
      if (!/^OL\d+W$/.test(workId)) return new Response("Invalid work id", { status: 400, headers: corsHeaders() });
      const search = new URLSearchParams(url.search);
      search.delete("work");
      target = targetBase + "/" + workId + "/editions.json" + (search.toString() ? "?" + search.toString() : "");
    } else if (provider === "catalog-dc-fandom" || provider === "catalog-marvel-fandom") {
      const action = String(url.searchParams.get("action") || "");
      const prop = String(url.searchParams.get("prop") || "");
      const generator = String(url.searchParams.get("generator") || "");
      const allowedProps = new Set(["pageimages", "images", "imageinfo"]);
      if (action !== "query" || !allowedProps.has(prop) || (generator && generator !== "search")) {
        return new Response("Invalid Fandom query", { status: 400, headers: corsHeaders() });
      }
      if (String(url.searchParams.get("titles") || "").length > 1800 ||
          String(url.searchParams.get("gsrsearch") || "").length > 120 ||
          !/^\d*$/.test(String(url.searchParams.get("pageids") || ""))) {
        return new Response("Invalid Fandom query", { status: 400, headers: corsHeaders() });
      }
      const search = new URLSearchParams(url.search);
      search.delete("origin");
      search.set("format", "json");
      target = targetBase + "?" + search.toString();
    } else {
      target = targetBase + (url.search || "");
    }
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    // Open Library accepts the platform default but rejects this service's
    // explicit User-Agent on its editions endpoint. Keep the identity header
    // for the other catalog providers while allowing verified book editions.
    if (provider !== "catalog-openlibrary" && provider !== "catalog-openlibrary-editions") {
      headers["User-Agent"] = "Lorefy/1.0 (lorefysupport@gmail.com)";
    }
    const upstream = await fetch(target, {
      method: request.method === "HEAD" ? "GET" : request.method,
      headers,
      body,
      signal: AbortSignal.timeout(10000)
    });
    let bytes: Uint8Array;
    try { bytes = await catalogBytes(upstream); }
    catch (error) {
      if (error instanceof Error && error.message === "Catalog response too large") return new Response("Response Too Large", { status: 413, headers: corsHeaders() });
      throw error;
    }
    const retryHeaders: Record<string, string> = {};
    for (const name of ["Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]) {
      const value = upstream.headers.get(name);
      if (value && value.length <= 128) retryHeaders[name] = value;
    }
    return new Response(request.method === "HEAD" || [204, 205, 304].includes(upstream.status) ? null : bytes, {
      status: upstream.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        ...retryHeaders,
        "Cache-Control": upstream.ok ? "public, max-age=300" : "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (_) {
    return new Response("Catalog source unavailable", { status: 502, headers: corsHeaders() });
  }
}

function approvedImageUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  const hostnameAllowed = IMAGE_HOSTS.has(host) || host.endsWith(".archive.org") || host.endsWith(".wikimedia.org") ||
      host.endsWith(".fandom.com") || host.endsWith(".wikia.nocookie.net");
    if (url.protocol !== "https:" || !hostnameAllowed) return null;
    return url;
  } catch (_) {
    return null;
  }
}

async function mediaProxy(request: Request, rawUrl: string) {
  const target = approvedImageUrl(rawUrl);
  if (!target) return new Response("Invalid image source", { status: 400 });
  let upstream: Response;
  try {
    upstream = await fetch(target, { redirect: "follow" });
  } catch (_) {
    return new Response("Image source unavailable", { status: 502 });
  }
  if (!upstream.ok || !approvedImageUrl(upstream.url)) return new Response("Image source unavailable", { status: 502 });
  const contentType = String(upstream.headers.get("content-type") || "").toLowerCase().split(";")[0];
  const length = Number(upstream.headers.get("content-length") || 0);
  if (!/^image\/(?:avif|jpeg|png|webp|gif)$/.test(contentType) || (length && length > MAX_MEDIA_BYTES)) {
    return new Response("Unsupported image", { status: 415 });
  }
  const body = request.method === "HEAD" ? null : await upstream.arrayBuffer();
  if (body && body.byteLength > MAX_MEDIA_BYTES) return new Response("Image too large", { status: 413 });
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Origin"
    }
  });
}

const page = (title: string, body: string) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title} - Lorefy</title>
<style>:root{color-scheme:light dark;--bg:#f5f5f7;--surface:#fff;--text:#1d1d1f;--muted:#666;--line:#ddd;--accent:#7227d8}@media(prefers-color-scheme:dark){:root{--bg:#09080d;--surface:#15131a;--text:#f5f5f7;--muted:#aaa4b3;--line:#312e38;--accent:#bd83ff}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,sans-serif}.shell{width:min(100%,760px);min-height:100vh;margin:auto;padding:38px 24px 70px;background:var(--surface)}header{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid var(--line)}header strong{font-size:18px;letter-spacing:2px}.mark{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#251036;color:#c694ff;font-size:24px}h1{font-size:clamp(30px,8vw,44px);margin:34px 0 8px}h2{font-size:19px;margin:0 0 9px}p,li{color:var(--muted);font-size:15px;line-height:1.9}section{padding:23px 0;border-top:1px solid var(--line)}a{color:var(--accent);font-weight:700}.nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.nav a{display:inline-block;padding:10px 14px;border:1px solid var(--line);border-radius:10px;text-decoration:none}</style></head>
<body><main class="shell"><header><strong>LOREFY</strong><span class="mark">✦</span></header>${body}<nav class="nav"><a href="${baseUrl}/privacy">الخصوصية</a><a href="${baseUrl}/support">الدعم</a><a href="${baseUrl}/terms">الشروط</a><a href="${baseUrl}/community-guidelines">المجتمع</a></nav></main></body></html>`;

const pages: Record<string, string> = {
  "/": page("Lorefy", `<h1>مكتبتك. قصصك. عالمك.</h1><p>نظّم قراءاتك، قيّم الأعمال والشخصيات، وأنشئ قوائمك وشارك مراجعاتك في Lorefy.</p><section><h2>الدعم</h2><p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p></section>`),
  "/privacy": page("سياسة الخصوصية", `<h1>سياسة الخصوصية</h1><p>آخر تحديث: 13 أغسطس 2026</p><section><h2>البيانات</h2><p>ينشئ Lorefy حسابك باستخدام Google أو Apple. نعالج معرّف الحساب والبريد والاسم والصورة التي يوفرها مزود الدخول، إضافة إلى المكتبة وتقدم القراءة والتقييمات والمراجعات والقوائم والتفضيلات والصور التي ترفعها.</p></section><section><h2>الاستخدام والمشاركة</h2><p>نستخدم البيانات لتسجيل الدخول والمزامنة والبحث والمجتمع ومنع الإساءة. تعالج Supabase الحساب والمزامنة والتخزين، ويعالج Google أو Apple تسجيل الدخول. لا نبيع بياناتك ولا نستخدمها للتتبع عبر تطبيقات أخرى.</p></section><section><h2>المحتوى العام</h2><p>قد تظهر المراجعات والتعليقات والصور التي تنشرها للمستخدمين الآخرين. يمكنك حذف محتواك والإبلاغ والحظر والكتم.</p></section><section><h2>الحفظ والحذف</h2><p>نحتفظ بالبيانات ما دام الحساب قائماً. يمكنك حذف الحساب من داخل التطبيق؛ يحذف المسار حسابك وملفاتك الخاصة وبيانات المزامنة ويلغي تفويض Apple عندما ينطبق.</p></section><section><h2>التواصل</h2><p>لطلب الوصول أو التصحيح أو الحذف: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p></section>`),
  "/support": page("الدعم", `<h1>دعم Lorefy</h1><section><h2>تواصل معنا</h2><p>أرسل وصف المشكلة وإصدار التطبيق ونوع الجهاز إلى <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>. لا ترسل كلمة المرور أو رمز التحقق.</p></section><section><h2>الحساب والحذف</h2><p>استخدم Google أو Apple نفسه الذي بدأت به. لحذف الحساب افتح الإعدادات ← الخصوصية والبيانات ← حذف الحساب.</p></section><section><h2>محتوى مسيء</h2><p>استخدم الإبلاغ من قائمة المراجعة أو التعليق، ثم اكتم المستخدم أو احظره عند الحاجة. نعالج المخاطر المباشرة بأولوية.</p></section>`),
  "/terms": page("شروط الاستخدام", `<h1>شروط الاستخدام</h1><p>آخر تحديث: 13 أغسطس 2026</p><section><h2>الخدمة والحساب</h2><p>Lorefy لتنظيم القراءات والتقييمات والقوائم والمراجعات. يجب استخدام حساب Google أو Apple صالح وأنت مسؤول عن نشاط حسابك.</p></section><section><h2>المحتوى والحقوق</h2><p>تظل حقوق الأعمال والأغلفة والصور لأصحابها. لا تنشر مادة لا تملك حق استخدامها، وقد نحذف المحتوى المخالف عند تلقي بلاغ صحيح.</p></section><section><h2>السلوك</h2><p>يمنع التحرش والتهديد والكراهية والمحتوى الجنسي الصريح وانتحال الهوية والرسائل المزعجة وانتهاك الخصوصية أو الملكية الفكرية.</p></section><section><h2>التواصل</h2><p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p></section>`),
  "/community-guidelines": page("إرشادات المجتمع", `<h1>إرشادات المجتمع</h1><section><h2>الممنوع</h2><p>التحرش والتهديد والكراهية والتنمر والمحتوى الجنسي الصريح واستغلال القاصرين وانتحال الهوية وكشف المعلومات الشخصية والرسائل المزعجة وانتهاك الحقوق.</p></section><section><h2>الحرق</h2><p>استخدم علامة الحرق قبل ذكر الأحداث المهمة.</p></section><section><h2>الإبلاغ والحظر</h2><p>يمكن الإبلاغ عن أي مراجعة أو تعليق. استخدم الكتم لإخفاء المحتوى أو الحظر لإخفائه ومنع التفاعل. يراجع فريق Lorefy البلاغات ويتخذ الإجراء المناسب.</p></section><section><h2>التواصل</h2><p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p></section>`)
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSegment = segments.at(-1) || "";
  if (lastSegment.startsWith("catalog-")) return catalogProxy(request, lastSegment, url);
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
  if (lastSegment === "media") return mediaProxy(request, url.searchParams.get("url") || "");
  const functionPath = lastSegment === "lorefy-public" ? "/" : `/${lastSegment}`;
  const content = pages[functionPath];
  if (!content) return new Response("Not Found", { status: 404 });
  return new Response(request.method === "HEAD" ? null : content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    }
  });
});
