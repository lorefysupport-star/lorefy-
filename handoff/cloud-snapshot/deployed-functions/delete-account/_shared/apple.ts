import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from "npm:jose@5.10.0";

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

const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export async function verifyAppleIdentityToken(identityToken: string, clientId: string) {
  const { payload } = await jwtVerify(identityToken, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
    algorithms: ["RS256"]
  });
  if (typeof payload.sub !== "string" || !payload.sub) throw new Error("apple_subject_missing");
  return payload.sub;
}

