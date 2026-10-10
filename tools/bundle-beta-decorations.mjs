import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(await readFile(path.join(root,'qa/frame-lab/collections.json'),'utf8'));
if (source.length !== 24) throw new Error('Expected all 24 decoration collections');
const target = path.join(root,'launch/decorations/pfpvibes');
await mkdir(target,{recursive:true});
const bundled = [];
for (const item of source) {
  if (!/^qa\/frame-lab\/[a-z-]+\.png$/.test(item.overlay)) throw new Error('Invalid decoration asset');
  const overlay = 'launch/decorations/pfpvibes/' + path.basename(item.overlay);
  await copyFile(path.join(root,item.overlay),path.join(root,overlay));
  bundled.push({...item,overlay});
}
await writeFile(path.join(target,'collections.json'),JSON.stringify(bundled,null,2)+'\n');
console.log(`Bundled ${bundled.length} complete decorations; source QA fixtures remain excluded.`);
