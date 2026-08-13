import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releasePath = path.join(root, "config", "lorefy-release.json");
const args = new Set(process.argv.slice(2));
const isConfigured = (value) => typeof value === "string" && value.trim() !== "" && !/(YOUR_|example|placeholder)/i.test(value);
const isHttpsUrl = (value) => {
  if (!isConfigured(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};
const fileExists = (relativePath) => existsSync(path.join(root, relativePath));

let release = {};
if (existsSync(releasePath)) {
  try {
    release = JSON.parse(readFileSync(releasePath, "utf8"));
  } catch (error) {
    release = { _invalidConfig: error.message };
  }
}

const blockers = [];
const addBlocker = (id, title, resolution) => blockers.push({ id, title, resolution });
const nativeShell = fileExists("package.json") && fileExists("capacitor.config.json") && fileExists("tools/prepare-ios-web.mjs");
const deletionSource = fileExists("supabase/functions/delete-account/index.ts");
const privacyManifest = fileExists("apple/PrivacyInfo.xcprivacy");

if (!nativeShell) addBlocker("native-shell", "حزمة iOS الأصلية غير مكتملة.", "شغّل npm install ثم npm run ios:add على جهاز Mac فيه Xcode.");
if (!privacyManifest) addBlocker("privacy-manifest", "ملف Privacy Manifest غير موجود.", "أضف الملف إلى مشروع Xcode بعد إنشاء غلاف iOS.");
if (!isHttpsUrl(release.appUrl)) addBlocker("production-app-url", "رابط التطبيق العام HTTPS غير مضبوط.", "ضع appUrl الحقيقي في config/lorefy-release.json.");
if (!isHttpsUrl(release.privacyPolicyUrl)) addBlocker("privacy-policy-url", "رابط سياسة الخصوصية العام HTTPS غير مضبوط.", "انشر السياسة على نطاق عام وضع الرابط الحقيقي.");
if (!isHttpsUrl(release.supportUrl)) addBlocker("support-url", "رابط الدعم العام HTTPS غير مضبوط.", "انشر صفحة دعم تتضمن وسيلة اتصال فعلية.");
if (!isHttpsUrl(release.supabaseUrl) || !isConfigured(release.supabasePublishableKey)) addBlocker("supabase-production", "إعدادات Supabase الإنتاجية غير موجودة.", "أنشئ مشروع Supabase فعّالاً ثم أضف عنوانه ومفتاحه العام محلياً فقط.");
if (release.appleBundleId !== "com.lorefy.app" || release.appleServiceId !== "com.lorefy.app") addBlocker("apple-sign-in", "معرّفات Sign in with Apple لم تُعتمد بعد.", "فعّل Sign in with Apple للـ Bundle ID com.lorefy.app واضبطها في Apple Developer وSupabase.");
if (!deletionSource) addBlocker("account-deletion-source", "دالة حذف الحساب غير موجودة.", "أضف وانشر Supabase Edge Function delete-account.");
else if (!release.appReview?.appleTokenRevocationReady) addBlocker("apple-token-revocation", "إبطال رمز Sign in with Apple غير موثّق.", "فعّل Apple token revocation في مسار الحذف قبل التسليم.");
if (!release.appReview?.appleProviderEnabled) addBlocker("apple-provider", "Sign in with Apple غير مفعّل في Supabase.", "أنشئ مفتاح Sign in with Apple المخصص ثم فعّل Apple Provider في Supabase Auth.");
if (!release.appReview?.emailProviderDisabled) addBlocker("email-provider", "Email provider ما زال مفعّلاً خارج سياسة تسجيل Lorefy.", "عطّل Email provider في Supabase Auth لتبقى طرق الدخول Google وApple فقط.");
if (!release.appReview?.privacyNutritionLabelVerified) addBlocker("privacy-nutrition-label", "إجابات App Privacy لم تتحقق.", "راجع كل SDK وبيانات التطبيق في App Store Connect قبل الإرسال.");
if (!release.appReview?.contentRightsVerified) addBlocker("content-rights", "حقوق المحتوى والبيانات غير موثقة.", "أكد التراخيص لكل مصدر أغلفة وصور ونصوص قبل الإرسال.");
if (!release.appReview?.ugcModerationReady) addBlocker("ugc-moderation", "حماية محتوى المجتمع غير جاهزة.", "لا تطلق المجتمع العام قبل الإبلاغ والحجب والمراجعة وسياسة تواصل فعالة.");
if (!release.appReview?.reviewNotesProvidedInAppStoreConnect) addBlocker("review-access", "ملاحظات الوصول للمراجعة غير مؤكدة.", "أضف حساب الاختبار أو خطوات الدخول في App Store Connect.");
if (release.storeKit?.enabled && (!isConfigured(release.storeKit.monthlyProductId) || !isConfigured(release.storeKit.yearlyProductId))) addBlocker("storekit-products", "منتجات الاشتراك غير مضبوطة.", "أنشئ اشتراكات StoreKit في App Store Connect واربط تحقق الخادم.");
if (release._invalidConfig) addBlocker("release-config", "ملف إعداد الإصدار غير صالح.", "أصلح JSON في config/lorefy-release.json.");

const report = {
  ready: blockers.length === 0,
  generatedAt: new Date().toISOString(),
  sourceChecks: { nativeShell, privacyManifest, deletionSource },
  blockers
};

if (args.has("--json")) console.log(JSON.stringify(report));
else {
  console.log(report.ready ? "Apple release preflight passed." : `Apple release preflight blocked by ${blockers.length} item(s).`);
  blockers.forEach((blocker) => console.log(`- ${blocker.id}: ${blocker.resolution}`));
}
if (args.has("--strict") && !report.ready) process.exitCode = 1;
