const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve(__dirname, '..', 'modules', 'lorefy-product-tools.js');
let source = fs.readFileSync(target, 'utf8');
const call = 'core.safety.report({ targetId: context.targetId, targetType: context.targetType, reason: reason.value, note: note.value });';
const patched = 'await Promise.resolve(core.safety.report({ targetId: context.targetId, targetType: context.targetType, reason: reason.value, note: note.value }))';
if (!source.includes(patched)) {
  if (!source.includes(call)) throw new Error('Report call not found.');
  source = source.replace('function () {\n        ' + call + '\n        close();', 'async function () {\n        try {\n          await Promise.resolve(' + call.slice(0, -1) + ');\n        } catch (error) { toast(error && error.message || "Report submission failed"); return; }\n        close();');
}
fs.writeFileSync(target, source);
console.log('Cloud reporting UI patched.');
