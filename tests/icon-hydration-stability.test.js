const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('icon hydration honors its scope and leaves already rendered SVG nodes intact',()=>{
 let replacements=0;
 const rendered={tagName:'svg',matches:()=>true,querySelectorAll:()=>[]};
 const placeholder={tagName:'I',attributes:[{name:'data-lucide',value:'test'}],getAttribute:()=> 'test',parentNode:{replaceChild(){replacements++;}}};
 let current=placeholder;
 const host={querySelectorAll:(selector)=>selector==='[icon-name]'?[]:[current]};
 const document={querySelectorAll:()=>{throw Error('must not scan unrelated document');},createElementNS:()=>({setAttribute(){},appendChild(){}})};
 const context={document,console};vm.runInNewContext(fs.readFileSync('vendor/lucide.js','utf8'),context);
 context.lucide.createIcons({icons:{Test:['svg',{},[]]},root:host});assert.equal(replacements,1);
 current=rendered;context.lucide.createIcons({icons:{Test:['svg',{},[]]},root:host});assert.equal(replacements,1);
 context.lucide.createIcons({icons:{Test:['svg',{},[]]},nodes:[rendered]});assert.equal(replacements,1);
});
