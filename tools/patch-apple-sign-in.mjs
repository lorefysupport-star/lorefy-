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

// The pinned plugin's source is compatible with Capacitor 8, but its upstream
// Swift manifest still constrains SPM to Capacitor 7 after a clean install.
export function patchApplePackage(source) {
  const dependency = '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "';
  if (source.includes(dependency + '8.0.0")')) return source;
  if (!source.includes(dependency + '7.0.0")')) {
    throw new Error('Apple sign-in Swift package changed; review compatibility before building.');
  }
  return source.replace(dependency + '7.0.0")', dependency + '8.0.0")');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const target = new URL('../node_modules/@capacitor-community/apple-sign-in/ios/Sources/SignInWithApple/Plugin.swift', import.meta.url);
  const source = await readFile(target, 'utf8');
  const patched = patchAppleSource(source);
  if (patched !== source) await writeFile(target, patched);
  const manifest = new URL('../node_modules/@capacitor-community/apple-sign-in/Package.swift', import.meta.url);
  const manifestSource = await readFile(manifest, 'utf8');
  const patchedManifest = patchApplePackage(manifestSource);
  if (patchedManifest !== manifestSource) await writeFile(manifest, patchedManifest);
  console.log('Apple native credential guards verified.');
}
