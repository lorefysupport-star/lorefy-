const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('all original layouts get readable social labels and content section hierarchy',()=>{
 const css=fs.readFileSync('styles/lorefy-profile-refined.css','utf8');
 for(const layout of ['normal','immersive','reader'])assert.ok(css.includes(`[data-profile-layout='${layout}']`));
 assert.match(css,/\.lf-profile-connection-label\s*\{[^}]*display:inline/);
 assert.match(css,/\.lf-profile-reading-statuses\s*\{[^}]*overflow-x:auto/);
 assert.match(css,/\.lf-profile-community-action\s*\{[^}]*min-height:64px/);
 assert.doesNotMatch(css,/url\(|--ui-[\w-]+\s*:|\.lf-explore|\.lf-library-cinema/);
});
test('profile content refinement cannot resize or relocate banner, avatar or decoration art',()=>{
 const css=fs.readFileSync('styles/lorefy-profile-refined.css','utf8');
 assert.doesNotMatch(css,/\.lf-(?:profile|reader)-(?:banner|avatar)|\.lf-decoration|\.lf-frame/);
});
test('Overview tab and its panel have different IDs',()=>{
 const source=fs.readFileSync('modules/lorefy-profile-sections.js','utf8');
 assert.match(source,/'aria-controls':tab==='overview'\?id\+'-overview-panel'/);
});

test('favorite heading remains a full touch target in compact and shelf presentation',()=>{
 const css=fs.readFileSync('styles/lorefy-interface-settings.css','utf8');
 const rules=[...css.matchAll(/([^{}]+lf-profile-top-works-head[^{}]*)\{([^{}]*)\}/g)]
  .filter(match=>/min-height:/.test(match[2]));
 assert.equal(rules.length,2);
 for(const rule of rules)assert.match(rule[2],/min-height:\s*44px/);
 const sections=fs.readFileSync('styles/lorefy-profile-sections.css','utf8');
 assert.match(sections,/\.lf-profile-identity:has\(\.lf-profile-section-tabs\) > \.lf-profile-top-works-head\s*\{\s*min-height:\s*44px\s*!important/);
});
