const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function proxy() {
  const window = {location: {href: 'capacitor://localhost/'}};
  vm.runInNewContext(fs.readFileSync('modules/lorefy-data-proxy.js','utf8'),{window,URL});
  return window.LorefyDataProxy;
}

test('legacy MAL provider URLs retain exact resource identity on the maintained endpoint',()=>{
  const api=proxy();
  for(const path of ['manga/26/characters','manga/26/pictures','characters/27/pictures','characters?q=Gon&limit=8']) {
    assert.equal(api.catalogUrl('jikan','https://api.jikan.moe/v4/'+path),'https://api.tenrai.org/v1/'+path);
  }
  assert.equal(api.catalogUrl('jikan','https://api.tenrai.org/v1/manga/26'),'https://api.tenrai.org/v1/manga/26');
  assert.equal(api.catalogUrl('jikan','https://api.jikan.moe.evil.invalid/v4/manga/26'),'https://api.jikan.moe.evil.invalid/v4/manga/26');
});

test('character lookups work without a gateway and preserve MAL identity and portraits',async()=>{
  const calls=[],window={};
  vm.runInNewContext(fs.readFileSync('modules/lorefy-character-system.js','utf8'),{
    window,URL,URLSearchParams,setTimeout,clearTimeout,
    fetch:async url=>{calls.push(String(url));return {ok:true,json:async()=>({data:[{
      character:{mal_id:27,name:'Gon Freecss',images:{jpg:{image_url:'https://cdn.myanimelist.net/gon.jpg'}}},role:'Main'
    }]})};}
  });
  const cast=await window.LorefyCharacterSystem.jikanCast(26);
  assert.equal(calls[0],'https://api.tenrai.org/v1/manga/26/characters');
  assert.equal(cast[0].id,'mal-27');
  assert.equal(cast[0].image,'https://cdn.myanimelist.net/gon.jpg');
  assert.equal(cast[0].source,'Tenrai');
});

test('chapter totals use the maintained endpoint without changing work IDs or MAL attribution',async()=>{
  const metadata=require('../modules/lorefy-chapter-metadata.js');
  const result=await metadata.loadCatalog('mal-manga-987654-migration-fixture',async url=>{
    assert.equal(url,'https://api.tenrai.org/v1/manga/987654');
    return {ok:true,json:async()=>({data:{mal_id:987654,chapters:42}})};
  });
  assert.equal(result.total,42);
  assert.equal(result.sourceUrl,'https://myanimelist.net/manga/987654');
});
