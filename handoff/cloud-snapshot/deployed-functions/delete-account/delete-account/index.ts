import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { appleConfiguration, createAppleClientSecret } from "../_shared/apple.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  }
});

type StorageEntry = { name: string; id?: string | null; metadata?: unknown };
const MAX_AUTH_AGE_SECONDS = 10 * 60;
const MAX_STORAGE_FILES = 5000;
const MAX_STORAGE_FOLDERS = 1000;
const MAX_STORAGE_DEPTH = 8;
const UPSTREAM_TIMEOUT_MS = 10_000;

function jwtPayload(authorization: string) {
  try {
    const token = authorization.replace(/^Bearer\s+/i, "");
    const part = token.split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
  } catch {
    return null;
  }
}

async function listAllFiles(bucket: any, prefix: string) {
  const files: string[] = [];
  const pending = [prefix];
  let folders = 0;
  while (pending.length) {
    const folder = pending.pop()!;
    folders += 1;
    if (folders > MAX_STORAGE_FOLDERS) throw new Error("storage_folder_limit_exceeded");
    const depth = folder.split("/").filter(Boolean).length - prefix.split("/").filter(Boolean).length;
    if (depth > MAX_STORAGE_DEPTH) throw new Error("storage_depth_limit_exceeded");
    let offset = 0;
    for (;;) {
      const { data, error } = await bucket.list(folder, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      const entries = (data || []) as StorageEntry[];
      for (const entry of entries) {
        const fullPath = folder ? `${folder}/${entry.name}` : entry.name;
        if (entry.id) {
          files.push(fullPath);
          if (files.length > MAX_STORAGE_FILES) throw new Error("storage_file_limit_exceeded");
        } else {
          pending.push(fullPath);
        }
      }
      if (entries.length < 1000) break;
      offset += entries.length;
    }
  }
  return files;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: json(null).headers });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "unauthorized" }, 401);

  let payload: { confirm?: boolean };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (payload.confirm !== true) return json({ error: "confirmation_required" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  const user = userData.user;
  if (userError || !user) return json({ error: "unauthorized" }, 401);
  const claims = jwtPayload(authorization);
  const authenticatedAt = Number(claims && claims.iat);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authenticatedAt) || authenticatedAt > now + 60 || now - authenticatedAt > MAX_AUTH_AGE_SECONDS) {
    return json({ error: "recent_authentication_required" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const { data: refreshToken, error: authorizationError } = await admin
      .rpc("get_apple_authorization_for_deletion", { target_user_id: user.id });
    if (authorizationError) throw authorizationError;
    if (refreshToken) {
      const apple = appleConfiguration();
      if (!apple) return json({ error: "apple_revocation_not_configured" }, 503);
      const clientSecret = await createAppleClientSecret(apple);
      const revokeResponse = await fetch("https://appleid.apple.com/auth/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: apple.clientId,
          client_secret: clientSecret,
          token: refreshToken,
          token_type_hint: "refresh_token"
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      });
      if (!revokeResponse.ok) throw new Error(`apple_revocation_failed:${revokeResponse.status}`);
    }
    const { error: cleanupError } = await admin
      .rpc("delete_apple_authorization", { target_user_id: user.id });
    if (cleanupError) throw cleanupError;
  } catch (error) {
    console.error("delete-account apple revocation", error);
    return json({ error: "apple_revocation_failed" }, 502);
  }

  const { error: deletionStartError } = await admin
    .rpc("begin_account_deletion", { target_user_id: user.id });
  if (deletionStartError) {
    console.error("delete-account lock", deletionStartError);
    return json({ error: "account_deletion_failed" }, 500);
  }

  try {
    for (const bucketName of ["profile-media", "review-media", "custom-covers"]) {
      const bucket = admin.storage.from(bucketName);
      const files = await listAllFiles(bucket, user.id);
      for (let index = 0; index < files.length; index += 1000) {
        const { error } = await bucket.remove(files.slice(index, index + 1000));
        if (error) throw error;
      }
      const remaining = await listAllFiles(bucket, user.id);
      if (remaining.length) throw new Error(`storage_cleanup_incomplete:${bucketName}`);
    }
  } catch (error) {
    console.error("delete-account storage cleanup", error);
    return json({ error: "storage_cleanup_failed" }, 500);
  }

  // Deleting the auth user invalidates refresh tokens and prevents new sessions.

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json({ error: "account_deletion_failed" }, 500);

  return new Response(null, { status: 204 });
});

