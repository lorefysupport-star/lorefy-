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

const isCode = (value: unknown): value is string =>
  typeof value === "string" && value.length >= 10 && value.length <= 4096;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: json(null).headers });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "unauthorized" }, 401);
  let payload: { authorizationCode?: unknown };
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  if (!isCode(payload.authorizationCode)) return json({ error: "invalid_authorization_code" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apple = appleConfiguration();
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !apple) return json({ error: "server_not_configured" }, 503);

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  const user = userData.user;
  if (userError || !user) return json({ error: "unauthorized" }, 401);

  const linkedAppleIdentity = (user.identities || []).find((identity) => identity.provider === "apple");
  if (!linkedAppleIdentity) return json({ error: "apple_identity_required" }, 409);

  try {
    const clientSecret = await createAppleClientSecret(apple);
    const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: apple.clientId,
        client_secret: clientSecret,
        code: payload.authorizationCode,
        grant_type: "authorization_code"
      })
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || typeof tokens.refresh_token !== "string" || !tokens.refresh_token) {
      console.error("apple token exchange", tokenResponse.status, tokens.error || "missing_refresh_token");
      return json({ error: "apple_token_exchange_failed" }, 502);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const stored = await admin.rpc("store_apple_authorization", {
      target_user_id: user.id,
      refresh_token: tokens.refresh_token,
      apple_subject: linkedAppleIdentity.id
    });
    if (stored.error) throw stored.error;
    return json({ registered: true });
  } catch (error) {
    console.error("apple authorization storage", error);
    return json({ error: "apple_authorization_storage_failed" }, 500);
  }
});
