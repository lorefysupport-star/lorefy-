#!/bin/sh
# Local simulator only. Does not install, upload, or change project signing settings.
set -eu
taskRoot=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
simBuildDir=${1:-/tmp/lorefy-discover-reviewed-ios}
simEntitlements=$(mktemp /tmp/lorefy-simulator-entitlements.XXXXXX)
trap 'rm -f "$simEntitlements"' EXIT HUP INT TERM
cat > "$simEntitlements" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
<key>application-identifier</key><string>LOREFYTEST.com.lorefy.app</string>
<key>keychain-access-groups</key><array><string>LOREFYTEST.com.lorefy.app</string></array>
</dict></plist>
PLIST
xcodebuild -project "$taskRoot/ios/App/App.xcodeproj" -scheme App \
  -configuration Release -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath "$simBuildDir" \
  CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual \
  CODE_SIGN_ENTITLEMENTS="$simEntitlements" CURRENT_PROJECT_VERSION="${LOREFY_LOCAL_BUILD_NUMBER:-34}" build
# Keychain requires simulated entitlements embedded by the linker.
# Post-build codesign with these restricted entitlements breaks host validation.
otool -l "$simBuildDir/Build/Products/Release-iphonesimulator/App.app/App" | rg -q 'sectname __entitlements'
