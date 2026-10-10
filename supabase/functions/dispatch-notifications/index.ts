import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APNS_PRODUCTION_URL = "https://api.push.apple.com/3/device";
const APNS_SANDBOX_URL = "https://api.sandbox.push.apple.com/3/device";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});

function base64Url(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemBytes(value: string) {
  const normalized = value.replace(/\\n/g, "\n");
  const encoded = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
}

async function secureEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right))
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0 && left.length === right.length;
}

async function createApnsJwt(teamId: string, keyId: string, privateKey: string) {
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const claims = base64Url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  const unsigned = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBytes(privateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned)
  );
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

type WebhookPayload = {
  type?: string;
  schema?: string;
  table?: string;
  record?: { id?: string; user_id?: string };
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const webhookSecret = Deno.env.get("PUSH_WEBHOOK_SECRET") || "";
  const suppliedSecret = request.headers.get("x-lorefy-webhook-secret") || "";
  if (!webhookSecret || !suppliedSecret || !await secureEqual(webhookSecret, suppliedSecret)) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: WebhookPayload;
  try { payload = await request.json(); }
  catch { return json({ error: "invalid_json" }, 400); }
  if (payload.type !== "INSERT" || payload.schema !== "public" || payload.table !== "notifications") {
    return json({ error: "unsupported_webhook" }, 400);
  }

  const notificationId = String(payload.record?.id || "");
  const userId = String(payload.record?.user_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(notificationId) || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return json({ error: "invalid_notification" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const keyId = Deno.env.get("APNS_KEY_ID");
  const privateKey = Deno.env.get("APNS_PRIVATE_KEY");
  const topic = Deno.env.get("APNS_BUNDLE_ID") || "com.lorefy.app";
  const environment = Deno.env.get("APNS_ENVIRONMENT") === "development" ? "development" : "production";
  if (!supabaseUrl || !serviceRoleKey || !teamId || !keyId || !privateKey) {
    return json({ error: "server_not_configured" }, 503);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const [{ data: notification, error: notificationError }, { data: devices, error: deviceError }] = await Promise.all([
    admin.from("notifications")
      .select("id,user_id,kind,title,body,target_path,data,event_key")
      .eq("id", notificationId).eq("user_id", userId).maybeSingle(),
    admin.from("push_device_tokens")
      .select("id,token,environment")
      .eq("user_id", userId).eq("platform", "ios")
      .eq("environment", environment)
      .order("last_seen_at", { ascending: false }).limit(20)
  ]);
  if (notificationError || deviceError) return json({ error: "notification_lookup_failed" }, 502);
  if (!notification) return json({ error: "notification_not_found" }, 404);
  if (!devices?.length) return json({ delivered: 0, unavailable: 0 }, 202);

  let authorization: string;
  try { authorization = await createApnsJwt(teamId, keyId, privateKey); }
  catch { return json({ error: "apns_key_invalid" }, 503); }

  const invalidDeviceIds: string[] = [];
  let delivered = 0;
  let unavailable = 0;
  await Promise.all(devices.map(async (device) => {
    const endpoint = device.environment === "development" ? APNS_SANDBOX_URL : APNS_PRODUCTION_URL;
    const response = await fetch(`${endpoint}/${encodeURIComponent(device.token)}`, {
      method: "POST",
      headers: {
        "Authorization": `bearer ${authorization}`,
        "Content-Type": "application/json",
        "apns-topic": topic,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "apns-collapse-id": String(notification.event_key).slice(0, 64)
      },
      body: JSON.stringify({
        aps: {
          alert: { title: notification.title, body: notification.body },
          badge: 1,
          sound: "default"
        },
        notificationId: notification.id,
        kind: notification.kind,
        targetPath: notification.target_path,
        data: notification.data
      })
    });
    if (response.ok) { delivered += 1; return; }
    unavailable += 1;
    let reason = "";
    try { reason = String((await response.json())?.reason || ""); } catch {}
    if (response.status === 410 || ["BadDeviceToken", "Unregistered", "DeviceTokenNotForTopic"].includes(reason)) {
      invalidDeviceIds.push(device.id);
    }
  }));

  if (invalidDeviceIds.length) {
    await admin.from("push_device_tokens").delete().in("id", invalidDeviceIds);
  }
  return json({ delivered, unavailable }, 202);
});
