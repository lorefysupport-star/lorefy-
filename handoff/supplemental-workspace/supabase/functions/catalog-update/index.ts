type JsonRecord = Record<string, unknown>;

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-catalog-secret",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "content-type": "application/json; charset=utf-8"
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CATALOG_UPDATE_SECRET = Deno.env.get("CATALOG_UPDATE_SECRET") || "";
const BASE_CATALOG_VERSION = Deno.env.get("LOREFY_BASE_CATALOG_VERSION") || "20260703-dataclean-v1";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function slug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .slice(0, 80);
}

function weekVersion(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function statusFromAniList(status: string) {
  if (status === "FINISHED") return "مكتملة";
  if (status === "RELEASING") return "مستمرة";
  if (status === "HIATUS") return "متوقفة";
  if (status === "CANCELLED") return "متوقفة";
  return "مستمرة";
}

function typeFromFormat(format: string) {
  if (/NOVEL/i.test(format || "")) return "رواية";
  return "مانجا";
}

function workFromAniList(media: JsonRecord) {
  const title = (media.title || {}) as JsonRecord;
  const romaji = String(title.romaji || title.english || title.native || "").trim();
  const english = String(title.english || romaji).trim();
  const native = String(title.native || "").trim();
  const idMal = media.idMal ? String(media.idMal) : "";
  const id = idMal ? `mal-manga-${idMal}-${slug(english || romaji)}` : `anilist-${media.id}`;
  const cover = ((media.coverImage || {}) as JsonRecord).large || ((media.coverImage || {}) as JsonRecord).medium || "";
  const staffEdges = (((media.staff || {}) as JsonRecord).edges || []) as JsonRecord[];
  const author = staffEdges.map((edge) => {
    const node = (edge.node || {}) as JsonRecord;
    const name = (node.name || {}) as JsonRecord;
    return name.full || name.userPreferred || "";
  }).filter(Boolean).slice(0, 2).join(", ");
  return {
    id,
    anilist: media.id,
    mal: idMal || undefined,
    title: english || romaji || native || id,
    ar: native || english || romaji || id,
    type: typeFromFormat(String(media.format || "")),
    auth: author || "",
    yr: ((media.startDate || {}) as JsonRecord).year || undefined,
    ch: media.chapters || undefined,
    vol: media.volumes || undefined,
    st: statusFromAniList(String(media.status || "")),
    genres: Array.isArray(media.genres) ? media.genres.slice(0, 8) : [],
    cover: cover || undefined,
    source: "AniList",
    updatedAt: new Date().toISOString()
  };
}

async function fetchAniListRecent() {
  const query = `
    query($page:Int){
      Page(page:$page, perPage:50){
        media(type:MANGA, sort:UPDATED_AT_DESC){
          id
          idMal
          format
          status
          chapters
          volumes
          genres
          updatedAt
          startDate{year}
          title{romaji english native}
          coverImage{large medium}
          staff(sort:RELEVANCE, perPage:2){edges{node{name{full userPreferred}}}}
        }
      }
    }`;
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables: { page: 1 } })
  });
  if (!response.ok) throw new Error(`anilist ${response.status}`);
  const payload = await response.json();
  const media = payload?.data?.Page?.media;
  return Array.isArray(media) ? media.map(workFromAniList) : [];
}

async function adminFetch(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase admin env is not configured");
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      accept: "application/json",
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`supabase ${response.status}: ${text}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function latestManifest(req: Request) {
  const rows = await adminFetch("/rest/v1/catalog_manifest?select=*&id=eq.true&limit=1");
  const row = Array.isArray(rows) ? rows[0] : null;
  const bootstrapUrl = new URL(req.url);
  bootstrapUrl.search = "kind=delta&version=bootstrap";
  if (!row) {
    return {
      schema: 1,
      version: "bootstrap",
      generatedAt: new Date().toISOString(),
      baseCatalogVersion: BASE_CATALOG_VERSION,
      deltaUrl: bootstrapUrl.toString()
    };
  }
  return {
    schema: 1,
    version: row.version,
    generatedAt: row.generated_at,
    baseCatalogVersion: row.base_catalog_version,
    deltaUrl: row.delta_url,
    notes: row.notes || ""
  };
}

async function deltaByVersion(version: string) {
  const rows = await adminFetch(`/rest/v1/catalog_deltas?select=delta&version=eq.${encodeURIComponent(version)}&limit=1`);
  const row = Array.isArray(rows) ? rows[0] : null;
  return row?.delta || { schema: 1, version, upserts: [], patches: [], removeIds: [], aliases: {} };
}

async function createRun(trigger: string) {
  const rows = await adminFetch("/rest/v1/catalog_update_runs", {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify([{ trigger, status: "running" }])
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function finishRun(id: string, patch: JsonRecord) {
  if (!id) return;
  await adminFetch(`/rest/v1/catalog_update_runs?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch, finished_at: new Date().toISOString() })
  });
}

async function publishDelta(req: Request, runId: string, works: JsonRecord[]) {
  const version = weekVersion();
  const delta = {
    schema: 1,
    version,
    generatedAt: new Date().toISOString(),
    baseCatalogVersion: BASE_CATALOG_VERSION,
    sources: [{ id: "anilist-recent", count: works.length, fetchedAt: new Date().toISOString() }],
    upserts: works,
    patches: [],
    removeIds: [],
    aliases: {}
  };
  const url = new URL(req.url);
  url.search = `kind=delta&version=${encodeURIComponent(version)}`;
  await adminFetch("/rest/v1/catalog_deltas?on_conflict=version", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{ version, base_catalog_version: BASE_CATALOG_VERSION, delta, run_id: runId }])
  });
  await adminFetch("/rest/v1/catalog_manifest?on_conflict=id", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([{
      id: true,
      version,
      base_catalog_version: BASE_CATALOG_VERSION,
      delta_version: version,
      delta_url: url.toString(),
      notes: "Published by catalog-update Edge Function",
      updated_at: new Date().toISOString()
    }])
  });
  return delta;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const url = new URL(req.url);
    if (req.method === "GET") {
      if (url.searchParams.get("kind") === "delta") {
        return json(await deltaByVersion(url.searchParams.get("version") || "bootstrap"));
      }
      return json(await latestManifest(req));
    }
    if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
    if (!CATALOG_UPDATE_SECRET || req.headers.get("x-catalog-secret") !== CATALOG_UPDATE_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }
    const body = await req.json().catch(() => ({}));
    const run = await createRun(String(body.trigger || "manual"));
    try {
      const works = await fetchAniListRecent();
      const delta = await publishDelta(req, run?.id || "", works);
      await finishRun(run?.id || "", { status: "ready", source_counts: { anilist: works.length } });
      return json({ ok: true, version: delta.version, upserts: works.length });
    } catch (error) {
      await finishRun(run?.id || "", { status: "error", error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
