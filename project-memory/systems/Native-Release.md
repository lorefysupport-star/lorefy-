---
kind: system
status: source-reviewed
date: 2026-10-14
aliases: ["آيفون", "بيلد", "تست فلاي", "ios", "TestFlight", "safe area", "release"]
---
# غلاف iOS والتحزيم

المنتج الحالي HTML/CSS/JavaScript داخل Capacitor/Swift، وليس إعادة كتابة
Expo React Native. EAS للبناء والتقديم. لا تستنتج حالة Apple الحية من
ملف version أو من نجاح أمر محلي.

## سلسلة المصدر

source → [prepare-ios-web](../../tools/prepare-ios-web.mjs) → `ios-web/` →
Capacitor copy/sync → `ios/App/App/public/` → Xcode/EAS → معالجة Apple.
قائمة runtime مسموحة، وتولد إعداد العميل الآمن؛ خزنة الذاكرة وQA ليست runtime.
إذا كانت المهمة memory-only فلا حاجة إلى copy/sync أو IPA جديدة.

## الحدود الأصلية

[AppDelegate](../../ios/App/App/AppDelegate.swift)،
[SceneDelegate](../../ios/App/App/SceneDelegate.swift)،
[auth crypto](../../ios/App/App/LorefyAuthCrypto.swift)،
[native photos](../../backend/lorefy-native-photos.js)،
[native runtime](../../backend/lorefy-native-runtime.js) وجسور OAuth/StoreKit
تربط الأذونات والصور والدخول والروابط والإشعارات. safe areas تشمل الهيدر
والتنقل؛ معاينة الهاتف لا تحاكي كل keyboard/notch/OS presentation.

## الإصدار

- [app.json](../../app.json) و[Xcode project](../../ios/App/App.xcodeproj/project.pbxproj) يجب أن يتفقا في رقم build.
- [Info.plist](../../ios/App/App/Info.plist) و[privacy manifest](../../ios/App/App/PrivacyInfo.xcprivacy) ليستا وحدهما إقرار مراجعة خصوصية مكتملًا.
- [eas.json](../../eas.json) إعداد بناء؛ ليس إذن تشغيل upload.
- [archives](../../archives/) و[build34](../../build34/) مجمدان؛ لا تستبدلهما بإصدار جديد.
- Windows يتيح فحص JS وتحضير المصدر؛ native compilation يحتاج macOS/Xcode أو EAS.

الفحص: [release package](../../tests/apple-release-package.test.js)،
[build hygiene](../../tests/build-hygiene.test.js)،
[version consistency](../../tests/version-consistency.test.js)،
[native auth](../../tests/native-auth-flow.test.js).
الجهاز الحقيقي والنشر بوابتان مستقلتان في [[10-Open-Questions]].

[[systems/App-Boot]] | [[systems/Accounts-Sync]] |
[[systems/Community-Notifications]] | [[11-Organization-Plan]]
