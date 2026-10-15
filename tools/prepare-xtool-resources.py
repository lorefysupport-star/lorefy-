"""Verify frozen UI inputs before reusing compiled storyboard/asset resources.

Linux has no Apple Interface Builder compiler. Reuse is allowed only while every
asset catalog and storyboard input matches the preserved signed Build 34 receipt.
No executable, profile, signature, framework, or old web content is extracted.
"""
import argparse
import hashlib
import json
import pathlib
import plistlib
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--working-copy', type=pathlib.Path, required=True)
parser.add_argument('--baseline-root', type=pathlib.Path, required=True)
args = parser.parse_args()
working = args.working_copy.resolve()
baseline = args.baseline_root.resolve()
adapter = working / 'native-xtool'
assert (adapter / 'Package.swift').is_file(), 'Prepare the isolated working copy first.'
ipa = baseline / 'build34/Lorefy-build34.ipa'
receipt = json.loads((baseline / 'verification/build34-ipa.json').read_text(encoding='utf-8-sig'))
assert hashlib.file_digest(ipa.open('rb'), 'sha256').hexdigest() == receipt['sha256'], 'Frozen IPA checksum mismatch.'
manifest = json.loads((baseline / 'ARCHIVE_MANIFEST.json').read_text(encoding='utf-8-sig'))
prefix = 'project/Lorefy-clean-app/ios/App/App/'
ui_inputs = [entry for entry in manifest if entry['path'].startswith(prefix) and
             (entry['path'][len(prefix):].startswith('Assets.xcassets/') or entry['path'].endswith('.storyboard'))]
assert len(ui_inputs) >= 9, 'Incomplete frozen UI input manifest.'
for entry in ui_inputs:
    relative = entry['path'][len('project/Lorefy-clean-app/'):]
    with (working / relative).open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == entry['sha256'], f'UI input changed; requires Apple compiler: {relative}'

compiled = adapter / 'CompiledResources'
assert not compiled.exists(), 'Compiled resource destination already exists; preserved.'
compiled.mkdir()
resource_hashes = {}
with zipfile.ZipFile(ipa) as archive:
    info_names = [name for name in archive.namelist() if name.startswith('Payload/') and name.count('/') == 2 and name.endswith('/Info.plist')]
    assert len(info_names) == 1, 'Expected one root application in frozen IPA.'
    app_prefix = info_names[0][:-len('Info.plist')]
    frozen_info = plistlib.loads(archive.read(info_names[0]))
    for name in archive.namelist():
        if not name.startswith(app_prefix) or name.endswith('/'):
            continue
        relative = name[len(app_prefix):]
        if relative != 'Assets.car' and not (relative.startswith('Base.lproj/') and '.storyboardc/' in relative):
            continue
        destination = compiled / relative
        assert destination.resolve().is_relative_to(compiled.resolve()), 'Unsafe ZIP path.'
        destination.parent.mkdir(parents=True, exist_ok=True)
        content = archive.read(name)
        destination.write_bytes(content)
        resource_hashes[relative] = hashlib.sha256(content).hexdigest()
assert 'Assets.car' in resource_hashes and any('LaunchScreen.storyboardc/' in item for item in resource_hashes), 'Compiled UI resources missing.'

app_config = json.loads((working / 'app.json').read_text(encoding='utf-8-sig'))['expo']
values = {
    'CAPACITOR_DEBUG': 'true', 'EXECUTABLE_NAME': 'App',
    'PRODUCT_BUNDLE_IDENTIFIER': app_config['ios']['bundleIdentifier'],
    'PRODUCT_NAME': 'App', 'PRODUCT_MODULE_NAME': 'App',
    'MARKETING_VERSION': frozen_info['CFBundleShortVersionString'],
    'CURRENT_PROJECT_VERSION': app_config['ios']['buildNumber'],
    'APS_ENVIRONMENT': 'development',
}
def resolve(value):
    if isinstance(value, str):
        for key, replacement in values.items():
            value = value.replace('$(' + key + ')', replacement)
        assert '$(' not in value, f'Unresolved Xcode setting: {value}'
    elif isinstance(value, dict):
        return {key: resolve(item) for key, item in value.items()}
    elif isinstance(value, list):
        return [resolve(item) for item in value]
    return value

with (working / 'ios/App/App/Info.plist').open('rb') as stream:
    info = resolve(plistlib.load(stream))
for key in ['CFBundleIcons', 'CFBundleIcons~ipad']:
    if key in frozen_info:
        info[key] = frozen_info[key]
info.update(app_config['ios'].get('infoPlist', {}))
with (adapter / 'Info.plist').open('wb') as stream:
    plistlib.dump(info, stream)
with (working / 'ios/App/App/App.entitlements').open('rb') as stream:
    entitlements = resolve(plistlib.load(stream))
with (adapter / 'App.entitlements').open('wb') as stream:
    plistlib.dump(entitlements, stream)
(adapter / 'compiled-resource-receipt.json').write_text(json.dumps({
    'baselineIPAHashVerified': receipt['sha256'],
    'unchangedUIInputs': ui_inputs, 'compiledResources': resource_hashes,
    'appModule': 'App', 'bundleID': info['CFBundleIdentifier'],
    'buildNumber': info['CFBundleVersion'], 'signed': False,
}, indent=2) + '\n', encoding='utf-8')
print(f'Verified {len(ui_inputs)} unchanged UI inputs; staged {len(resource_hashes)} compiled UI resources.')
