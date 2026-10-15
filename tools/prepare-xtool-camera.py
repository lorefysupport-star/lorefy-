"""Package unchanged ION camera PNGs without Apple's macOS asset compiler."""
import argparse
import hashlib
import json
import pathlib
import shutil

parser = argparse.ArgumentParser()
parser.add_argument('--working-copy', type=pathlib.Path, required=True)
args = parser.parse_args()
working = args.working_copy.resolve()
adapter = working / 'native-xtool'
resolved = json.loads((adapter / 'Package.resolved').read_text())
pin = next(item for item in resolved['pins'] if item['identity'] == 'ion-ios-camera')
assert pin['state'] == {'revision': '00c3dfdd6267f80db299d9c5a0bad522156b6cbc', 'version': '2.0.0'}, 'Review changed ION camera version before adapting assets.'
original = adapter / '.build/checkouts/ion-ios-camera'
vendor = adapter / 'Vendor/ion-ios-camera'
if not vendor.exists():
    shutil.copytree(original, vendor, ignore=shutil.ignore_patterns('.git'))
else:
    assert not (adapter / 'camera-resource-receipt.json').exists(), 'Camera adaptation already completed; preserved.'
sources = vendor / 'Sources/IONCameraLib'
catalog = sources / 'Interfaces/Editor/CameraLocal.xcassets'
pngs = sources / 'ResourcePNGs'
pngs.mkdir(exist_ok=True)
hashes = {}
for imageset in sorted(catalog.glob('*.imageset')):
    manifest = json.loads((imageset / 'Contents.json').read_text())
    for image in manifest['images']:
        assert image.get('idiom') == 'universal' and set(image) == {'filename', 'idiom', 'scale'}, 'Review non-universal or variant asset.'
        scale = image['scale']
        assert scale in ('1x', '2x', '3x') and pathlib.Path(image['filename']).suffix == '.png'
        name = imageset.stem + ('' if scale == '1x' else '@' + scale) + '.png'
        shutil.copyfile(imageset / image['filename'], pngs / name)
        hashes[name] = hashlib.sha256((pngs / name).read_bytes()).hexdigest()
assert len(hashes) == 6, 'Unexpected camera icon inventory.'
(vendor / 'Package.swift').chmod(0o644)
(vendor / 'Package.swift').write_text('''// swift-tools-version: 5.9
import PackageDescription
let package = Package(
    name: "IONCameraLib",
    platforms: [.iOS(.v15)],
    // Link the unchanged camera runtime into the app; xtool's Linux linker
    // cannot resolve its iOS 15 compatibility symbols as a separate dylib.
    products: [.library(name: "IONCameraLib", targets: ["IONCameraLib"])],
    targets: [.target(name: "IONCameraLib",
        exclude: ["Interfaces/Editor/CameraLocal.xcassets"],
        resources: [
''' + ''.join(f'            .copy("ResourcePNGs/{name}"),\n' for name in hashes) + '''        ]
    )]
)
''')
camera_manifest = working / 'node_modules/@capacitor/camera/Package.swift'
text = camera_manifest.read_text()
old = '.package(url: "https://github.com/ionic-team/ion-ios-camera.git", .upToNextMinor(from: "2.0.0"))'
assert old in text, 'Review changed Capacitor camera manifest.'
camera_manifest.write_text(text.replace(old, '.package(path: "../../../native-xtool/Vendor/ion-ios-camera")'))
root_manifest = adapter / 'Package.swift'
root_text = root_manifest.read_text()
root_pin = '        .package(url: "https://github.com/ionic-team/ion-ios-camera.git", exact: "2.0.0"),\n'
# After verifying the remote revision, the vendor owns this package identity.
root_manifest.write_text(root_text.replace(root_pin, ''))
(adapter / 'camera-resource-receipt.json').write_text(json.dumps({
    'upstream': pin, 'pngHashes': hashes,
    'runtimeSwiftSourceModified': False,
    'strategy': 'Same 1x/2x/3x PNG bytes, named flip/rotate in the SwiftPM resource bundle.',
}, indent=2) + '\n')
print('Staged unchanged ION camera runtime and six original PNG variants for Linux build.')
