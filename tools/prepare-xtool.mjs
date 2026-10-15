import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Optional development adapter: all generated files stay in a new working copy.
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appPackage = JSON.parse(await readFile(path.join(source, 'package.json'), 'utf8'));
const capacitorVersion = appPackage.dependencies['@capacitor/core'];
if (!/^\d+\.\d+\.\d+$/.test(capacitorVersion) || appPackage.devDependencies['@capacitor/ios'] !== capacitorVersion) throw new Error('Review the exact native Capacitor version.');
const outputArg = process.argv.indexOf('--output');
if (outputArg < 0 || !process.argv[outputArg + 1]) throw new Error('Provide --output <new working directory>.');
const destination = path.resolve(process.argv[outputArg + 1]);
if (destination === source || destination.startsWith(source + path.sep)) throw new Error('Choose a working directory outside the application snapshot.');
try { await stat(destination); throw new Error('Destination already exists; preserved. Choose a new working directory.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const excluded = new Set(['node_modules', 'ios-web', '.git', '.build', 'xtool', 'qa']);
await cp(source, destination, { recursive: true, filter: file => {
  const relative = path.relative(source, file).split(path.sep);
  if (excluded.has(relative[0])) return false;
  if (relative.join('/') === 'ios/App/App/public') return false;
  return !/^(credentials\.json|\.env(?:\..*)?)$/.test(path.basename(file)) && !/\.(p8|p12|mobileprovision|ipa)$/i.test(file);
}});
const plugins = [
  ['@aparajita/capacitor-secure-storage', 'AparajitaCapacitorSecureStorage'],
  ['@capacitor-community/apple-sign-in', 'CapacitorCommunityAppleSignIn'],
  ['@capacitor/app', 'CapacitorApp'], ['@capacitor/browser', 'CapacitorBrowser'],
  ['@capacitor/camera', 'CapacitorCamera'], ['@capacitor/filesystem', 'CapacitorFilesystem'],
  ['@capacitor/push-notifications', 'CapacitorPushNotifications'], ['@capacitor/share', 'CapacitorShare'],
];
for (const [npmName] of plugins) {
  await cp(path.join(source, 'node_modules', npmName), path.join(destination, 'node_modules', npmName), {recursive: true});
}
// Its npm release predates Capacitor 8. Keep native source unchanged while
// aligning the working Swift manifest with the application's exact core pin.
const applePackage = path.join(destination, 'node_modules/@capacitor-community/apple-sign-in/Package.swift');
const appleManifest = await readFile(applePackage, 'utf8');
const oldConstraint = /\.package\(url: "https:\/\/github.com\/ionic-team\/capacitor-swift-pm\.git", (?:from|exact): "[\d.]+"\)/g;
if ((appleManifest.match(oldConstraint) || []).length !== 1) throw new Error('Review the Apple plugin Swift manifest before adapting it.');
await writeFile(applePackage, appleManifest.replace(oldConstraint, `.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "${capacitorVersion}")`));
execFileSync(process.execPath, [path.join(destination, 'tools/patch-apple-sign-in.mjs')], {stdio: 'inherit'});
execFileSync(process.execPath, [path.join(destination, 'tools/prepare-ios-web.mjs')], {stdio: 'inherit'});
await cp(path.join(destination, 'ios-web'), path.join(destination, 'ios/App/App/public'), {recursive: true});
// Capacitor's generated Cordova shims are independent of the web preparation.
for (const name of ['cordova.js', 'cordova_plugins.js']) {
  await cp(path.join(source, 'ios/App/App/public', name), path.join(destination, 'ios/App/App/public', name));
}
const adapter = path.join(destination, 'native-xtool');
await mkdir(path.join(adapter, 'Sources/App'), {recursive: true});
const hashes = {};
for (const name of await readdir(path.join(source, 'ios/App/App'))) {
  if (!name.endsWith('.swift')) continue;
  const content = await readFile(path.join(source, 'ios/App/App', name));
  await writeFile(path.join(adapter, 'Sources/App', name), content);
  hashes[name] = createHash('sha256').update(content).digest('hex');
}
// SwiftPM's linker otherwise removes plugins used only through ObjC discovery.
// Refer to their class metadata before Capacitor creates the bridge. Capacitor
// still performs its normal automatic registration exactly once.
await writeFile(path.join(adapter, 'Sources/App/LorefyXtoolPlugins.swift'), `import Foundation
import Capacitor
import SecureStoragePlugin
import SignInWithApple
import AppPlugin
import BrowserPlugin
import CameraPlugin
import FilesystemPlugin
import PushNotificationsPlugin
import SharePlugin

func retainLorefyXtoolPluginClasses() {
    let classes: [AnyClass] = [
        SecureStorage.self, SignInWithApple.self, AppPlugin.self,
        CAPBrowserPlugin.self, CameraPlugin.self, FilesystemPlugin.self,
        PushNotificationsPlugin.self, SharePlugin.self
    ]
    for pluginClass in classes {
        precondition(NSClassFromString(NSStringFromClass(pluginClass)) != nil,
                     "Native plugin class is unavailable")
    }
}
`);
const delegatePath = path.join(adapter, 'Sources/App/AppDelegate.swift');
const delegate = await readFile(delegatePath, 'utf8');
const delegateAnchor = '// Override point for customization after application launch.';
if (!delegate.includes(delegateAnchor)) throw new Error('Review the application delegate before adapting its plugin linkage.');
await writeFile(delegatePath, delegate.replace(delegateAnchor, 'retainLorefyXtoolPluginClasses()\n        ' + delegateAnchor));
await writeFile(path.join(adapter, 'Package.swift'), `// swift-tools-version: 5.9
import PackageDescription
let package = Package(
    name: "LorefyXtool",
    platforms: [.iOS(.v15)],
    products: [.library(name: "App", targets: ["App"])],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "${capacitorVersion}"),
        .package(url: "https://github.com/ionic-team/ion-ios-camera.git", exact: "2.0.0"),
        .package(url: "https://github.com/ionic-team/ion-ios-filesystem.git", exact: "1.1.4"),
        .package(url: "https://github.com/evgenyneu/keychain-swift.git", exact: "21.0.0"),
${plugins.map(([npmName, product]) => `        .package(name: "${product}", path: "../node_modules/${npmName}"),`).join('\n')}
    ],
    targets: [.target(name: "App", dependencies: [
        .product(name: "Capacitor", package: "capacitor-swift-pm"),
        .product(name: "Cordova", package: "capacitor-swift-pm"),
${plugins.map(([, product]) => `        .product(name: "${product}", package: "${product}"),`).join('\n')}
    ])],
    swiftLanguageVersions: [.v5]
)
`);
await writeFile(path.join(adapter, 'xtool.yml'), `version: 1
bundleID: com.lorefy.app
product: App
infoPath: Info.plist
entitlementsPath: App.entitlements
skipLSP: true
resources:
  - ../ios/App/App/public
  - ../ios/App/App/capacitor.config.json
  - ../ios/App/App/config.xml
  - ../ios/App/App/PrivacyInfo.xcprivacy
  - CompiledResources/Assets.car
  - CompiledResources/Base.lproj
`);
await writeFile(path.join(adapter, 'native-source-receipt.json'), JSON.stringify({source, destination, hashes, plugins: plugins.map(([name]) => name), releaseUploaded: false}, null, 2) + '\n');
console.log(`Prepared isolated Lorefy xtool working copy: ${destination}`);
console.log('Next: verify/extract unchanged compiled UI resources, resolve Info.plist, then run xtool dev build.');
