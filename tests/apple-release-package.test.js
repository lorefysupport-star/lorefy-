const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

test("configures a native iOS release shell", () => {
  assert.equal(exists("package.json"), true);
  assert.equal(exists("capacitor.config.json"), true);

  const pkg = JSON.parse(read("package.json"));
  const capacitor = JSON.parse(read("capacitor.config.json"));
  assert.equal(pkg.scripts["ios:prepare"], "node tools/prepare-ios-web.mjs");
  assert.equal(pkg.scripts["ios:sync"], "npm run ios:prepare && npx cap sync ios");
  assert.equal(pkg.dependencies["@capacitor/core"], "8.4.2");
  assert.equal(pkg.dependencies["@capacitor/app"], "8.1.1");
  assert.equal(pkg.dependencies["@capacitor/browser"], "8.0.4");
  assert.equal(pkg.dependencies["@capacitor-community/apple-sign-in"], "7.1.0");
  assert.equal(pkg.devDependencies["@capacitor/ios"], "8.4.2");
  assert.equal(capacitor.appId, "com.lorefy.app");
  assert.equal(capacitor.webDir, "ios-web");
  const nativePackages = read("ios/App/CapApp-SPM/Package.swift");
  assert.match(nativePackages, /CapacitorApp/);
  assert.match(nativePackages, /CapacitorBrowser/);
  assert.match(nativePackages, /AppleSignIn/);
  const index = read("index.html");
  assert.ok(index.indexOf("config/lorefy-runtime.js") < index.indexOf("config/lorefy-config.js"));
});

test("builds TestFlight from the complete Capacitor app instead of the Expo demo", () => {
  assert.equal(exists("app.json"), true);
  assert.equal(exists("eas.json"), true);
  assert.equal(exists("ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme"), true);
  assert.equal(exists("ios/Lorefy.xcworkspace/contents.xcworkspacedata"), true);
  assert.equal(exists("ios/Lorefy.xcworkspace/xcshareddata/xcschemes/App.xcscheme"), true);
  assert.equal(exists("ios/Lorefy.xcodeproj/xcshareddata/xcschemes/App.xcscheme"), true);
  assert.equal(exists("ios/Podfile"), true);
  assert.match(read("ios/Podfile"), /integrate_targets\s*=>\s*false/);
  assert.match(read("ios/Podfile"), /App\/App\.xcodeproj/);

  const app = JSON.parse(read("app.json")).expo;
  const eas = JSON.parse(read("eas.json"));
  const pkg = JSON.parse(read("package.json"));
  assert.equal(app.owner, "lorefy");
  assert.equal(app.extra.eas.projectId, "8438f5d2-3734-4ef7-8925-c8ffeb5a0cd5");
  assert.equal(app.extra.lorefy.releaseMode, "beta");
  assert.equal(app.extra.lorefy.guestMode, false);
  assert.equal(app.extra.lorefy.premiumUnlocked, true);
  assert.equal(app.extra.lorefy.appleSignInEnabled, true);
  assert.equal(app.ios.bundleIdentifier, "com.lorefy.app");
  assert.equal(app.ios.buildNumber, "6");
  assert.doesNotMatch(read("ios/App/App.xcodeproj/project.pbxproj"), /CURRENT_PROJECT_VERSION = 5;/);
  assert.match(read("ios/App/App.xcodeproj/project.pbxproj"), /CURRENT_PROJECT_VERSION = 6;/);
  assert.equal(eas.cli.appVersionSource, "local");
  assert.equal(eas.build.production.ios.image, "latest");
  assert.equal(eas.build.production.ios.scheme, "App");
  assert.match(eas.build.production.node, /^22\./);
  assert.equal(pkg.scripts["eas-build-post-install"], "npm run ios:sync");

  const dataParts = fs.readdirSync(path.join(root, "ios-web", "uploads"))
    .filter((name) => /^lorefy-data-part\d+\.js$/.test(name));
  const modules = fs.readdirSync(path.join(root, "ios-web", "modules"))
    .filter((name) => name.endsWith(".js"));
  assert.equal(dataParts.length, 17);
  assert.ok(modules.length >= 17);
  assert.match(read("ios-web/index.html"), /lorefy-character-system\.js/);
  assert.match(read("ios-web/index.html"), /lorefy-share-studio\.js/);
  assert.match(read("ios-web/index.html"), /lorefy-user-discovery\.js/);
});

test("prepares a native runtime config without exposing server secrets", () => {
  execFileSync(process.execPath, ["tools/prepare-ios-web.mjs"], { cwd: root, encoding: "utf8" });
  const runtime = read("ios-web/config/lorefy-runtime.js");
  assert.match(runtime, /LOREFY_SUPABASE/);
  assert.match(runtime, /https:\/\/qsroxmltioxqozmykens\.supabase\.co/);
  assert.match(runtime, /sb_publishable_/);
  assert.match(runtime, /"betaGuestMode":false/);
  assert.match(runtime, /"betaPremiumUnlocked":true/);
  assert.match(runtime, /"nativeAppleSignInEnabled":true/);
  assert.doesNotMatch(runtime, /SERVICE_ROLE/);
});

test("EAS receives the browser-safe auth configuration without the editable release file", () => {
  assert.equal(exists("config/lorefy-build-public.json"), true);
  assert.doesNotMatch(read(".easignore"), /^config\/lorefy-build-public\.json$/m);
  assert.match(read(".easignore"), /^config\/lorefy-release\.json$/m);
});

test("uses the configured public API instead of a localhost-relative catalog path in native release", () => {
  const config = read("config/lorefy-config.js");
  assert.match(config, /LOREFY_RELEASE\.apiUrl/);
  assert.match(config, /lorefyCatalogProxyBase/);
});

test("includes Apple privacy, deletion, and review artifacts", () => {
  [
    "apple/PrivacyInfo.xcprivacy",
    "supabase/functions/delete-account/index.ts",
    "docs/app-store-submission.md",
    "docs/app-store-metadata.md",
    "config/lorefy-release.example.json",
    "tools/apple-release-audit.mjs",
    "tools/prepare-ios-web.mjs"
  ].forEach((relativePath) => assert.equal(exists(relativePath), true, relativePath));

  assert.match(read("apple/PrivacyInfo.xcprivacy"), /NSPrivacyTracking/);
  assert.match(read("supabase/functions/delete-account/index.ts"), /auth\.admin\.deleteUser/);
});

test("wires Apple privacy and mandatory Sign in with Apple", () => {
  assert.equal(exists("ios/App/App/PrivacyInfo.xcprivacy"), true);
  assert.equal(exists("ios/App/App/App.entitlements"), true);
  assert.match(read("ios/App/App/App.entitlements"), /com\.apple\.developer\.applesignin/);
  assert.match(read("ios/App/App/App.entitlements"), /<string>Default<\/string>/);

  const project = read("ios/App/App.xcodeproj/project.pbxproj");
  assert.match(project, /PrivacyInfo\.xcprivacy in Resources/);
  assert.match(project, /CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements/);
  assert.match(read("ios/App/App/Info.plist"), /com\.lorefy\.app/);
});

test("handles native Google OAuth through an app callback instead of localhost", () => {
  const bridge = read("backend/lorefy-ios-oauth.js");
  assert.match(bridge, /com\.lorefy\.app:\/\/auth\/callback/);
  assert.match(bridge, /skipBrowserRedirect/);
  assert.match(bridge, /exchangeCodeForSession/);
  assert.match(bridge, /plugins\.Browser/);
});

test("routes the Apple button through the native Apple credential bridge", () => {
  const bridge = read("backend/lorefy-ios-bridge.js");
  assert.match(bridge, /BE\.signInWithOAuth\s*=/);
  assert.match(bridge, /toLowerCase\(\) !== "apple"/);
  assert.match(bridge, /signInWithIdToken/);
  assert.match(bridge, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(bridge, /nonce:\s*hashedNonce/);
  assert.match(bridge, /nonce:\s*rawNonce/);
  assert.doesNotMatch(bridge, /Apple callback state mismatch/);
});

test("reports only the remaining App Store release blockers", () => {
  const output = execFileSync(process.execPath, ["tools/apple-release-audit.mjs", "--json"], {
    cwd: root,
    encoding: "utf8"
  });
  const report = JSON.parse(output);

  assert.equal(report.ready, false);
  assert.equal(report.sourceChecks.nativeShell, true);
  assert.ok(!report.blockers.some((blocker) => blocker.id === "production-app-url"));
  assert.ok(!report.blockers.some((blocker) => blocker.id === "privacy-policy-url"));
  assert.ok(!report.blockers.some((blocker) => blocker.id === "support-url"));
  assert.ok(!report.blockers.some((blocker) => blocker.id === "supabase-production"));
  assert.ok(!report.blockers.some((blocker) => blocker.id === "apple-sign-in"));
});
