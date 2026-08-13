import { SignJWT, importPKCS8 } from "npm:jose@5.10.0";

export type AppleConfiguration = {
  clientId: string;
  keyId: string;
  teamId: string;
  privateKey: string;
};

export function appleConfiguration(): AppleConfiguration | null {
  const clientId = Deno.env.get("APPLE_CLIENT_ID") || "";
  const keyId = Deno.env.get("APPLE_KEY_ID") || "";
  const teamId = Deno.env.get("APPLE_TEAM_ID") || "";
  const privateKey = (Deno.env.get("APPLE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
  if (!clientId || !keyId || !teamId || !privateKey) return null;
  return { clientId, keyId, teamId, privateKey };
}

export async function createAppleClientSecret(config: AppleConfiguration) {
  const key = await importPKCS8(config.privateKey, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.keyId })
    .setIssuer(config.teamId)
    .setSubject(config.clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(key);
}
