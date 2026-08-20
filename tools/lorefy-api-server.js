const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { TYPE_SLUGS, normalizeText, normalizeType } = require("./catalog-expansion-core.js");

const packageRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(__dirname, "..", "outputs", "lorefy-local");
const root = fs.existsSync(path.join(packageRoot, "index.html")) ? packageRoot : workspaceRoot;
const port = Number(process.env.PORT || process.argv[2] || 8792);
const host = process.env.HOST || "127.0.0.1";
const expansionRoot = path.join(root, "output", "api-catalog");
const expansionCache = new Map();
const MAX_JSON_BODY_BYTES = 256 * 1024;
const MAX_JSON_RESPONSE_BYTES = 4 * 1024 * 1024;
const MAX_MEDIA_BYTES = 8 * 1024 * 1024;
const MAX_MEDIA_REDIRECTS = 3;
const MAX_ACTIVE_API_REQUESTS = 24;
const UPSTREAM_TIMEOUT_MS = 10_000;
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const DENIED_STATIC_SEGMENTS = new Set([".git", ".github", "ios", "node_modules", "supabase", "tests", "tools"]);
const DENIED_STATIC_FILES = new Set([
  "app.json", "capacitor.config.json", "eas.json", "package.json", "package-lock.json",
  "config/lorefy-build-public.json", "config/lorefy-release.json"
]);
let activeApiRequests = 0;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

const MEDIA_HOSTS = new Set([
  "s3.anilist.co",
  "s4.anilist.co",
  "cdn.myanimelist.net",
  "myanimelist.net",
  "covers.openlibrary.org",
  "ak-asset.jarir.com",
  "freewebnovel.com",
  "uploads.mangadex.org",
  "books.google.com",
  "books.googleusercontent.com",
  "lh3.googleusercontent.com",
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "commons.wikimedia.org",
  "upload.wikimedia.org",
  "en.wikipedia.org",
  "images.weserv.nl",
  "wsrv.nl",
  "picsum.photos"
]);

function isAllowedMediaHost(hostname) {
  hostname = String(hostname || "").toLowerCase();
  return MEDIA_HOSTS.has(hostname) ||
    hostname === "archive.org" || hostname.endsWith(".archive.org") ||
    hostname.endsWith(".fandom.com") || hostname.endsWith(".fandom.wikia.com") ||
    hostname.endsWith(".wikia.nocookie.net") || hostname.endsWith(".wikimedia.org");
}

function isAllowedRequestOrigin(origin) {
  if (!origin) return true;
  try {
    const value = new URL(origin);
    if (value.protocol === "capacitor:" && value.hostname === "localhost") return true;
    return (value.protocol === "http:" || value.protocol === "https:") &&
      (value.hostname === "localhost" || value.hostname === "127.0.0.1" || value.hostname === "::1");
  } catch {
    return false;
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,accept",
    "Cache-Control": status === 200 ? "no-store" : "no-store",
    ...headers
  });
  res.end(body);
}

function safeStaticPath(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null;
  }
  if (pathname.includes("\\")) return null;
  if (!pathname || pathname === "/") pathname = "/index.html";
  const full = path.resolve(root, "." + pathname);
  const relative = path.relative(root, full);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return relative === "" ? full : null;
  }
  const normalized = relative.split(path.sep).join("/");
  const normalizedLower = normalized.toLowerCase();
  const segments = normalizedLower.split("/");
  if (segments.some((segment) => DENIED_STATIC_SEGMENTS.has(segment)) || DENIED_STATIC_FILES.has(normalizedLower)) return null;
  return full;
}

function limitError(message) {
  const error = new Error(message);
  error.code = "LOREFY_PAYLOAD_TOO_LARGE";
  return error;
}

async function readBody(req, maxBytes = MAX_JSON_BODY_BYTES) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      req.resume();
      throw limitError("request body is too large");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readResponseBuffer(response, maxBytes) {
  const reader = response.body && typeof response.body.getReader === "function"
    ? response.body.getReader()
    : null;
  if (!reader) {
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length > maxBytes) throw limitError("upstream response is too large");
    return body;
  }
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      const chunk = Buffer.from(result.value);
      total += chunk.length;
      if (total > maxBytes) {
        await reader.cancel();
        throw limitError("upstream response is too large");
      }
      chunks.push(chunk);
    }
  } finally {
    try { reader.releaseLock(); } catch (error) {}
  }
  return Buffer.concat(chunks, total);
}

async function readResponseText(response, maxBytes) {
  return (await readResponseBuffer(response, maxBytes)).toString("utf8");
}

async function proxyJson(req, res, targetUrl, init = {}) {
  try {
    const requestHeaders = {
      accept: "application/json",
      "user-agent": "Lorefy/1.0 (lorefysupport@gmail.com)",
      ...(init.headers || {})
    };
    if (init.body) requestHeaders["content-type"] = "application/json";
    const response = await fetch(targetUrl, {
      ...init,
      headers: requestHeaders,
      signal: init.signal || AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
    const text = await readResponseText(response, MAX_JSON_RESPONSE_BYTES);
    send(res, response.status, text, {
      "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8"
    });
  } catch (error) {
    send(res, 502, JSON.stringify({ error: error && error.message || String(error) }), {
      "Content-Type": "application/json; charset=utf-8"
    });
  }
}

function isAllowedMediaTarget(value) {
  return value && value.protocol === "https:" && isAllowedMediaHost(value.hostname);
}

async function fetchMedia(target) {
  let current = new URL(target);
  for (let redirect = 0; redirect <= MAX_MEDIA_REDIRECTS; redirect += 1) {
    if (!isAllowedMediaTarget(current)) throw new Error("media redirect host is not allowed");
    const response = await fetch(current, {
      headers: {
        accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
        "user-agent": "Lorefy/1.0 (lorefysupport@gmail.com)"
      },
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
    if (!REDIRECT_STATUS.has(response.status)) return { response, finalUrl: current };
    const location = response.headers.get("location");
    if (!location || redirect === MAX_MEDIA_REDIRECTS) throw new Error("media redirect chain is invalid");
    current = new URL(location, current);
  }
  throw new Error("media redirect chain is invalid");
}

async function proxyMedia(req, res, targetUrl) {
  try {
    const target = new URL(targetUrl || "");
    if (!isAllowedMediaTarget(target)) {
      return send(res, 400, JSON.stringify({ error: "media host is not allowed" }), {
        "Content-Type": "application/json; charset=utf-8"
      });
    }
    const { response, finalUrl } = await fetchMedia(target);
    const contentType = response.headers.get("content-type") || "";
    const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
    if (!response.ok || !isAllowedMediaTarget(finalUrl) || !mediaType.startsWith("image/") || mediaType === "image/svg+xml") {
      return send(res, 502, JSON.stringify({ error: "invalid media response" }), {
        "Content-Type": "application/json; charset=utf-8"
      });
    }
    const body = await readResponseBuffer(response, MAX_MEDIA_BYTES);
    if (body.length > MAX_MEDIA_BYTES) {
      return send(res, 413, JSON.stringify({ error: "media response is too large" }), {
        "Content-Type": "application/json; charset=utf-8"
      });
    }
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
      "Content-Type": mediaType,
      "X-Content-Type-Options": "nosniff"
    });
    res.end(body);
  } catch (error) {
    send(res, 502, JSON.stringify({ error: error && error.message || String(error) }), {
      "Content-Type": "application/json; charset=utf-8"
    });
  }
}

function readExpansionType(type) {
  const normalized = normalizeType(type);
  const slug = TYPE_SLUGS[normalized];
  if (!slug) return null;
  const filePath = path.join(expansionRoot, `${slug}.json`);
  if (!fs.existsSync(filePath)) return { type: normalized, works: [], missing: true };
  const modifiedAt = fs.statSync(filePath).mtimeMs;
  const cached = expansionCache.get(normalized);
  if (cached && cached.modifiedAt === modifiedAt) return cached;
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const entry = {
    type: normalized,
    works: Array.isArray(payload) ? payload : payload.works || [],
    modifiedAt
  };
  expansionCache.set(normalized, entry);
  return entry;
}

function serveExpandedCatalog(res, url) {
  const entry = readExpansionType(url.searchParams.get("type") || "Manga");
  if (!entry || entry.missing) {
    return send(res, 404, JSON.stringify({ error: "expanded catalog is not built for this type" }), {
      "Content-Type": "application/json; charset=utf-8"
    });
  }
  const query = normalizeText(url.searchParams.get("q") || "");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit")) || 100));
  const filtered = query ? entry.works.filter((work) => {
    return normalizeText(`${work.title || ""} ${work.ar || ""} ${work.auth || ""}`).includes(query);
  }) : entry.works;
  const offset = (page - 1) * limit;
  const works = filtered.slice(offset, offset + limit);
  return send(res, 200, JSON.stringify({
    schema: 1,
    type: entry.type,
    page,
    limit,
    total: filtered.length,
    hasNext: offset + works.length < filtered.length,
    works
  }), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300"
  });
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") return send(res, 204, "");
  if (url.pathname === "/api/media") {
    return proxyMedia(req, res, url.searchParams.get("url"));
  }
  if (url.pathname === "/api/catalog/expanded") {
    return serveExpandedCatalog(res, url);
  }
  const query = url.searchParams.toString();
  if (url.pathname === "/api/catalog/mangadex") {
    return proxyJson(req, res, "https://api.mangadex.org/manga" + (query ? "?" + query : ""));
  }
  if (url.pathname === "/api/catalog/mangadex-covers") {
    return proxyJson(req, res, "https://api.mangadex.org/cover" + (query ? "?" + query : ""));
  }
  if (url.pathname === "/api/catalog/openlibrary") {
    return proxyJson(req, res, "https://openlibrary.org/search.json" + (query ? "?" + query : ""));
  }
  if (url.pathname === "/api/catalog/googlebooks") {
    return proxyJson(req, res, "https://www.googleapis.com/books/v1/volumes" + (query ? "?" + query : ""));
  }
  if (url.pathname === "/api/catalog/anilist") {
    const declaredLength = Number(req.headers["content-length"] || 0);
    if (declaredLength > MAX_JSON_BODY_BYTES) {
      return send(res, 413, JSON.stringify({ error: "request body is too large" }), {
        "Content-Type": "application/json; charset=utf-8"
      });
    }
    let body;
    try {
      body = await readBody(req, MAX_JSON_BODY_BYTES);
    } catch (error) {
      return send(res, error && error.code === "LOREFY_PAYLOAD_TOO_LARGE" ? 413 : 400, JSON.stringify({ error: error.message }), {
        "Content-Type": "application/json; charset=utf-8"
      });
    }
    return proxyJson(req, res, "https://graphql.anilist.co", { method: "POST", body });
  }
  return send(res, 404, JSON.stringify({ error: "unknown catalog endpoint" }), {
    "Content-Type": "application/json; charset=utf-8"
  });
}

function serveStatic(req, res, url) {
  const full = safeStaticPath(url.pathname);
  if (!full) return send(res, 403, "Forbidden");
  fs.stat(full, (error, stat) => {
    if (error || !stat.isFile()) return send(res, 404, "Not found");
    const ext = path.extname(full).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    fs.createReadStream(full).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);
  if (url.pathname.startsWith("/api/catalog/") || url.pathname === "/api/media") {
    if (!isAllowedRequestOrigin(req.headers.origin)) {
      send(res, 403, JSON.stringify({ error: "request origin is not allowed" }), { "Content-Type": "application/json; charset=utf-8" });
      return;
    }
    if (activeApiRequests >= MAX_ACTIVE_API_REQUESTS) {
      send(res, 429, JSON.stringify({ error: "server is busy" }), { "Content-Type": "application/json; charset=utf-8", "Retry-After": "1" });
      return;
    }
    activeApiRequests += 1;
    var released = false;
    var release = function () {
      if (released) return;
      released = true;
      activeApiRequests = Math.max(0, activeApiRequests - 1);
    };
    res.once("finish", release);
    res.once("close", release);
    Promise.resolve(handleApi(req, res, url)).catch(function (error) {
      if (!res.headersSent) send(res, 500, JSON.stringify({ error:error && error.message || "internal error" }), { "Content-Type":"application/json; charset=utf-8" });
      else res.destroy(error);
    });
    return;
  }
  serveStatic(req, res, url);
});

if (require.main === module) {
  if (!/^(127\.0\.0\.1|localhost|::1)$/.test(host) && process.env.LOREFY_ALLOW_PUBLIC_HOST !== "1") {
    throw new Error("Refusing a public bind. Set LOREFY_ALLOW_PUBLIC_HOST=1 only behind a hardened reverse proxy.");
  }
  server.listen(port, host, () => {
    console.log(`Lorefy API/static server running at http://${host}:${port}/`);
  });
}

module.exports = { safeStaticPath, isAllowedMediaHost, isAllowedRequestOrigin, server };
