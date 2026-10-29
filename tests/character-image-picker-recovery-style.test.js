const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('image retry has an independent touch target and follows the existing action typography',()=>{
 const css=fs.readFileSync('styles/lorefy-glass-materials.css','utf8');
 const rule=css.match(/\.lf-image-choice-sheet \.lf-image-choice-retry\s*\{([^}]+)\}/);
 assert.ok(rule);assert.match(rule[1],/min-height:44px !important/);assert.match(rule[1],/font-size:14px !important/);assert.match(rule[1],/border-radius:8px !important/);
});
