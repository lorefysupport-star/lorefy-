const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('empty profile work and character actions span every current layout grid',()=>{
 const css=fs.readFileSync('styles/lorefy-design-system.css','utf8');
 for(const selector of [".lf-profile-favorites.is-empty > [role=\"button\"]:first-child",".lf-profile-top-characters-grid.is-empty > .lf-profile-top-character:first-child"]){
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter(match=>match[1].includes(selector)).map(match=>match[2]).join('\n');
  assert.match(rules,/grid-column:\s*1\s*\/\s*-1\s*!important/);assert.match(rules,/box-sizing:\s*border-box/);assert.match(rules,/min-width:\s*0/);
 }
});
test('empty prompt labels wrap without changing the global font or filled-book geometry',()=>{
 const css=fs.readFileSync('styles/lorefy-design-system.css','utf8');
 const rules=[...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter(match=>match[1].includes('.is-empty')&&match[1].includes('::after')).map(match=>match[2]).join('\n');
 assert.match(rules,/white-space:\s*normal/);assert.match(rules,/overflow-wrap:\s*anywhere/);
 assert.match(css,/Choose your favorite works/);assert.match(css,/Choose your favorite characters/);
});
