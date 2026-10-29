'use strict';
(async function () {
  const gallery = document.getElementById('gallery'), notice = document.getElementById('notice');
  const zoom = document.getElementById('zoom'), theme = document.getElementById('theme');
  theme.onchange = () => { document.documentElement.dataset.theme = theme.value; };
  const play = document.getElementById('motionPlay'), time = document.getElementById('motionTime');
  play.onchange = () => {
    time.value = LorefyElfEarPreview.setPlaying(play.checked).toFixed(2);
    time.disabled = play.checked;
  };
  time.oninput = () => { if (time.value !== '') LorefyElfEarPreview.seek(time.value); };
  document.getElementById('close').onclick = () => zoom.close();
  zoom.addEventListener('click', event => { if (event.target === zoom) zoom.close(); });
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  try {
    const response = await fetch('elf-concepts/concepts.json');
    if (!response.ok) throw Error('Could not load the local concept manifest');
    const data = await response.json();
    const families = data.families.filter(f => f.options.some(o => data.approvedCodes.includes(o.code)));
    for (const [index, family] of families.entries()) {
      const link = element('a', '', family.title); link.href = '#' + family.id;
      document.getElementById('families').append(link);
      const section = element('section', 'family'); section.id = family.id;
      const heading = element('div', 'family-title');
      heading.append(element('h2', '', `${index + 1}. ${family.title}`), element('span', '', family.english));
      const boardLink = element('a', 'board-link', 'اللوحة الكاملة');
      boardLink.href = 'elf-concepts/' + family.board; boardLink.target = '_blank'; boardLink.rel = 'noopener';
      heading.append(boardLink); section.append(heading);
      const choices = element('div', 'choices');
      for (const [column, option] of family.options.entries()) {
        if (!data.approvedCodes.includes(option.code)) continue;
        const card = element('article', 'concept'); card.dataset.code = option.code;
        const header = element('div', 'choice-header');
        const code = element('bdi', 'code', option.code);
        const enlarge = element('button', '', 'تكبير'); enlarge.type = 'button';
        enlarge.setAttribute('aria-label', 'تكبير ' + option.code + ' ' + option.title);
        const [left, right] = family.slices[column], sliceWidth = right - left;
        const art = element('div', 'art');
        art.style.setProperty('--slice-width', sliceWidth);
        art.style.setProperty('--image-width', (1536 / sliceWidth * 100) + '%');
        art.style.setProperty('--image-left', (-left / sliceWidth * 100) + '%');
        const image = element('img'); image.src = 'elf-concepts/' + family.board;
        image.alt = `${option.title}: إطار الصورة الشخصية وإطار الصفحة`; image.loading = index ? 'lazy' : 'eager';
        image.width = 1536; image.height = 1024; art.append(image);
        if (family.id === 'ears') LorefyElfEarPreview.attach(art, image, option.code, left, sliceWidth);
        enlarge.onclick = () => {
          document.getElementById('zoom-title').textContent = option.code + ' · ' + option.title;
          const largeArt = zoom.querySelector('.art'); largeArt.style.cssText = art.style.cssText;
          if (largeArt.disposeRig) largeArt.disposeRig();
          const largeImage = largeArt.querySelector('img'); largeImage.src = image.src; largeImage.alt = image.alt;
          if (family.id === 'ears') largeArt.disposeRig = LorefyElfEarPreview.attach(largeArt, largeImage, option.code, left, sliceWidth);
          zoom.showModal(); zoom.querySelector('.zoom-scroll').scrollTop = 0;
        };
        header.append(code, enlarge);
        const caption = element('div', 'caption');
        const english = element('div', 'english', option.english); english.lang = 'en';
        const motion = family.id === 'ears'
          ? 'نفضة خفيفة ومتباعدة من قاعدة الأذن، بتوقيت مختلف لكل جهة. الحلقة وإطار الصفحة ثابتان في هذه التجربة.'
          : option.motion;
        caption.append(element('h3', '', option.title), english, element('div', 'motion-label', family.id === 'ears' ? 'تجربة حركة الأذن' : 'الحركة المقترحة'), element('p', '', motion));
        card.append(header, art, caption); choices.append(card);
      }
      section.append(choices); gallery.append(section);
    }
    zoom.addEventListener('close', () => {
      const art = zoom.querySelector('.art');
      if (art.disposeRig) { art.disposeRig(); art.disposeRig = null; }
    });
    document.getElementById('count').textContent = data.approvedCodes.length;
    document.getElementById('download').disabled = false;
    document.getElementById('download').onclick = () => {
      const result = {stage: 'approved-art-ear-motion-preview', approvedCodes: data.approvedCodes, appliedToApp: false};
      const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], {type: 'application/json'}));
      const anchor = element('a'); anchor.href = url; anchor.download = 'lorefy-elf-approved.json'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  } catch (error) {
    notice.textContent = 'تعذّر فتح التصاميم. أعد تحميل المعرض المحلي.';
    console.error(error);
  } finally { gallery.setAttribute('aria-busy', 'false'); }
})();
