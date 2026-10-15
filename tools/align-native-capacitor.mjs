import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version = pkg.dependencies['@capacitor/core'];
if (!/^\d+\.\d+\.\d+$/.test(version) || pkg.devDependencies['@capacitor/ios'] !== version || pkg.devDependencies['@capacitor/cli'] !== version) {
  throw new Error('Capacitor core, iOS and CLI must have the same exact version.');
}
for (const relative of ['ios/App/CapApp-SPM/Package.swift', 'node_modules/@capacitor-community/apple-sign-in/Package.swift']) {
  const file = path.join(root, relative);
  const source = await readFile(file, 'utf8');
  const constraint = /\.package\(url: "https:\/\/github.com\/ionic-team\/capacitor-swift-pm\.git", (?:from|exact): "[\d.]+"\)/g;
  if ((source.match(constraint) || []).length !== 1) throw new Error('Review native Capacitor constraint in ' + relative);
  await writeFile(file, source.replace(constraint, `.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "${version}")`));
}
console.log('Native Capacitor manifests aligned to ' + version);
