import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Keep the pinned native dependency from crashing when Apple omits a credential.
export function patchAppleSource(source) {
  if (source.includes('// Lorefy: validate optional Apple credentials.')) return source;
  const anchor = '        let result = [';
  if (!source.includes(anchor) || !source.includes('appleIDCredential.identityToken!') || !source.includes('appleIDCredential.authorizationCode!')) {
    throw new Error('Apple sign-in source changed; review the native credential patch before building.');
  }
  return source.replace(anchor, `        // Lorefy: validate optional Apple credentials.
        guard let tokenData = appleIDCredential.identityToken,
              let identityToken = String(data: tokenData, encoding: .utf8),
              !identityToken.isEmpty else {
            call.reject("Apple did not return an identity token", "LOREFY_APPLE_MISSING_TOKEN")
            self.bridge?.releaseCall(call)
            return
        }
        let authorizationCode = appleIDCredential.authorizationCode.flatMap { String(data: $0, encoding: .utf8) }

` + anchor)
    .replace('String(data: appleIDCredential.identityToken!, encoding: .utf8)', 'identityToken')
    .replace('String(data: appleIDCredential.authorizationCode!, encoding: .utf8)', 'authorizationCode');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = new URL('../node_modules/@capacitor-community/apple-sign-in/ios/Sources/SignInWithApple/Plugin.swift', import.meta.url);
  const source = await readFile(target, 'utf8');
  const patched = patchAppleSource(source);
  if (patched !== source) await writeFile(target, patched);
  console.log('Apple native credential guards verified.');
}
