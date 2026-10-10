'use strict';
const portraits = [
  { name: 'Guts', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b422-XTaiTuvRohsV.png' },
  { name: 'Griffith', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b424-Jfrsf8I7zBps.png' },
  { name: 'Casca', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b423-AmVFCaJJOBsc.png' },
  { name: 'Isidro', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b7859-ThWoSQUjRlKU.png' },
  { name: 'Serpico', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b5059-wWVkoasyfJNk.png' },
  { name: 'Zodd', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b600-nLLiWsK0GcVI.png' },
  { name: 'Rickert', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b598-2r2X1nQmr3qP.jpg' },
  { name: 'Pippin', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b597-9VvkEo8hmdxg.png' },
  { name: 'Luca', src: 'https://s4.anilist.co/file/anilistcdn/character/large/b26394-jH9uzZ3ViryM.jpg' },
  { name: 'Zodd Nosferatu', src: 'https://media.kitsu.app/characters/images/1198/original.jpg' }
];
const covers = [
  { name: 'Moby Dick', src: 'https://covers.openlibrary.org/b/id/10544254-L.jpg' },
  { name: 'War and Peace', src: 'https://covers.openlibrary.org/b/id/12621906-L.jpg' },
  { name: 'The Brothers Karamazov', src: 'https://covers.openlibrary.org/b/id/11263774-L.jpg' },
  { name: 'Hunter x Hunter', src: 'https://cdn.myanimelist.net/images/manga/2/253119l.jpg' }
];
function fixture(items, title) {
  const card = document.createElement('section');
  card.setAttribute('data-lf-share-layout', 'shelf');
  const heading = document.createElement('h3');
  heading.textContent = title;
  card.append(heading);
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'lf-cb-poster-tile';
    const image = document.createElement('img');
    image.src = item.src;
    const name = document.createElement('span');
    name.className = 'lf-cb-poster-name';
    name.textContent = item.name;
    row.append(image, name);
    card.append(row);
  });
  document.getElementById('fixtures').append(card);
  return card;
}
async function verify(file, expected, drawn, label) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  await image.decode();
  if (image.naturalWidth !== 1080 || image.naturalHeight !== 1920 || drawn !== expected || file.size < 100000) {
    throw new Error(label + ': incomplete PNG (' + drawn + '/' + expected + ' portraits)');
  }
  const result = { label, drawn, expected, bytes: file.size, width: image.naturalWidth, height: image.naturalHeight };
  const article = document.createElement('article');
  const heading = document.createElement('h2');
  heading.textContent = label;
  const link = document.createElement('a');
  link.textContent = 'Download ' + label;
  link.href = url;
  link.download = label + '.png';
  image.alt = label + ' exported PNG';
  article.append(heading, link, image);
  document.getElementById('results').append(article);
  return result;
}
document.getElementById('run').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  document.getElementById('results').replaceChildren();
  document.getElementById('fixtures').replaceChildren();
  window.Capacitor = { isNativePlatform: () => document.getElementById('native').checked };
  const original = CanvasRenderingContext2D.prototype.drawImage;
  let drawn = 0;
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    if (args[0] instanceof HTMLImageElement && args[0].naturalWidth > 0) drawn++;
    return original.apply(this, args);
  };
  const results = [];
  try {
    for (const [kind, pool] of [['characters', portraits], ['works', covers]]) {
      const ten = Array.from({ length: 10 }, (_, index) => pool[index % pool.length]);
      document.getElementById('status').textContent = 'Exporting ' + kind;
      drawn = 0;
      const shelf = await LorefyShareStudio.buildShelfStoryFile(fixture(ten, kind === 'characters' ? 'أفضل 10 شخصيات · Berserk' : 'أفضل 10 أعمال'));
      results.push(await verify(shelf, 10, drawn, kind + '-shelf'));
      drawn = 0;
      const post = await LorefyShareStudio.buildCommunityPostFile({
        kind: kind === 'characters' ? 'top' : 'list',
        profile: { name: 'Export verification', username: 'local_qa' },
        attachment: { title: kind === 'characters' ? 'أفضل شخصيات Berserk' : 'أفضل الأعمال', items: ten.map(item => ({ name: item.name, image: item.src })) }
      });
      results.push(await verify(post, 10, drawn, kind + '-post'));
    }
    document.getElementById('status').textContent = JSON.stringify({ passed: true, nativeImagePath: document.getElementById('native').checked, results }, null, 2);
  } catch (error) {
    document.getElementById('status').textContent = JSON.stringify({ passed: false, error: error.message, results }, null, 2);
  } finally {
    CanvasRenderingContext2D.prototype.drawImage = original;
    button.disabled = false;
  }
});
