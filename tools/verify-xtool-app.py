"""Check the built app, native plugin retention, and exact packaged resources."""
import argparse
import hashlib
import json
import pathlib
import plistlib
import struct
import tempfile
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--working-copy', type=pathlib.Path, required=True)
parser.add_argument('--receipt', type=pathlib.Path, required=True)
args = parser.parse_args()
working = args.working_copy.resolve()
adapter = working / 'native-xtool'
app = adapter / 'xtool/App.app'
ipa = adapter / 'xtool/App.ipa'
temporary = None
if not app.exists():
    temporary = tempfile.TemporaryDirectory(prefix='lorefy-ipa-verify-')
    unpacked = pathlib.Path(temporary.name)
    with zipfile.ZipFile(ipa) as archive:
        for name in archive.namelist():
            assert (unpacked / name).resolve().is_relative_to(unpacked), 'Unsafe IPA path.'
        archive.extractall(unpacked)
    app = unpacked / 'Payload/App.app'
with (app / 'Info.plist').open('rb') as stream:
    info = plistlib.load(stream)
assert info['CFBundleIdentifier'] == 'com.lorefy.app'
assert info['CFBundleExecutable'] == 'App'
assert info['UIApplicationSceneManifest']['UISceneConfigurations']['UIWindowSceneSessionRoleApplication'][0]['UISceneDelegateClassName'] == 'App.SceneDelegate'
assert info['MinimumOSVersion'] == '15.0'
binary = (app / 'App').read_bytes()
header = struct.unpack_from('<8I', binary)
assert header[0] == 0xfeedfacf and header[1] == 0x100000c, 'Expected ARM64 Mach-O executable.'
offset = 32
defined = set()
for _ in range(header[4]):
    command, size = struct.unpack_from('<II', binary, offset)
    if command == 2:  # LC_SYMTAB
        _, _, symoff, count, stroff, _ = struct.unpack_from('<6I', binary, offset)
        for index in range(count):
            string_index, kind, section, _, value = struct.unpack_from('<IBBHQ', binary, symoff + index * 16)
            if (kind & 0x0e) != 0x0e or not section or not value:
                continue
            start = stroff + string_index
            end = binary.index(b'\0', start)
            defined.add(binary[start:end].decode('utf-8', errors='replace'))
    offset += size
plugins = ['SecureStorage', 'SignInWithApple', 'AppPlugin', 'CAPBrowserPlugin', 'CAPCameraPlugin',
           'FilesystemPlugin', 'PushNotificationsPlugin', 'SharePlugin',
           'LorefyAuthCryptoPlugin', 'LorefyPurchasesPlugin']
for plugin in plugins:
    assert '_OBJC_CLASS_$_' + plugin in defined, f'Native plugin was removed by the linker: {plugin}'
for framework in ['Capacitor', 'Cordova']:
    assert (app / f'Frameworks/{framework}.framework/{framework}').is_file(), f'{framework} framework missing.'

source_public = working / 'ios/App/App/public'
public_hashes = {}
for source in sorted(source_public.rglob('*')):
    if not source.is_file():
        continue
    relative = source.relative_to(source_public).as_posix()
    assert not any(part in ('qa', 'tests') for part in source.relative_to(source_public).parts), 'QA fixture in native public bundle.'
    with source.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    with (app / 'public' / relative).open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == digest, f'Packaged web file changed: {relative}'
    public_hashes[relative] = digest
assert len(public_hashes) > 400
compiled = json.loads((adapter / 'compiled-resource-receipt.json').read_text())
for relative, digest in compiled['compiledResources'].items():
    with (app / relative).open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == digest, f'Compiled UI resource changed: {relative}'
camera = json.loads((adapter / 'camera-resource-receipt.json').read_text())
for name, digest in camera['pngHashes'].items():
    with (app / 'IONCameraLib_IONCameraLib.bundle' / name).open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == digest, f'Camera image changed: {name}'
for name in ['capacitor.config.json', 'config.xml', 'PrivacyInfo.xcprivacy']:
    assert (app / name).read_bytes() == (working / 'ios/App/App' / name).read_bytes()
assert not (app / 'embedded.mobileprovision').exists(), 'Unexpected provisioning profile in development artifact.'
assert not any(item.suffix in ('.p8', '.p12', '.mobileprovision') for item in app.rglob('*')), 'Private credential packaged.'
with ipa.open('rb') as stream:
    ipa_hash = hashlib.file_digest(stream, 'sha256').hexdigest()
record = {
    'bundleID': info['CFBundleIdentifier'], 'buildNumber': info['CFBundleVersion'],
    'minimumIOS': info['MinimumOSVersion'], 'architecture': 'arm64',
    'executableSHA256': hashlib.sha256(binary).hexdigest(),
    'nativePluginsDefinedInExecutable': plugins,
    'webFilesCompared': len(public_hashes), 'webFileHashes': public_hashes,
    'compiledUIFilesCompared': len(compiled['compiledResources']),
    'cameraPNGsCompared': len(camera['pngHashes']),
    'sourceVersions': json.loads((adapter / 'Package.resolved').read_text()),
    'ipa': str(ipa), 'ipaBytes': ipa.stat().st_size, 'ipaSHA256': ipa_hash,
    'signing': 'ad hoc only; no Apple development/store provisioning',
    'deviceInstalled': False, 'physicalDeviceTestsVerified': False,
    'releaseUploaded': False,
}
args.receipt.write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({key: value for key, value in record.items() if key not in ('webFileHashes', 'sourceVersions')}, indent=2))
