/* QA-only hinged ear study. No app catalog or account mutation. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LorefyElfEarPreview = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const rigs = {
    '1A': [
      {pivot: [104, 251], polygon: [[0, 50], [70, 120], [128, 198], [124, 278], [105, 299], [0, 299]]},
      {pivot: [418, 250], polygon: [[516, 50], [446, 120], [388, 198], [392, 278], [411, 299], [516, 299]]}
    ],
    '1B': [
      {pivot: [108, 247], polygon: [[0, 50], [70, 120], [128, 198], [124, 278], [105, 299], [0, 299]]},
      {pivot: [402, 248], polygon: [[503, 50], [433, 120], [375, 198], [379, 278], [398, 299], [503, 299]]}
    ],
    '1C': [
      {pivot: [107, 249], polygon: [[0, 50], [70, 120], [128, 198], [124, 278], [105, 299], [0, 299]]},
      {pivot: [408, 249], polygon: [[517, 50], [447, 120], [389, 198], [393, 278], [412, 299], [517, 299]]}
    ]
  };
  function geometry(code) {
    if (!Object.hasOwn(rigs, code)) throw Error('Unknown elf ear rig');
    return rigs[code].map(ear => ({pivot: [...ear.pivot], polygon: ear.polygon.map(p => [...p])}));
  }
  function pulse(t, start, duration) {
    const q = (t - start) / duration;
    return q > 0 && q < 1 ? Math.sin(Math.PI * q) ** 2 * Math.sin(Math.PI * 2 * q) : 0;
  }
  function sample(code, seconds) {
    if (!Object.hasOwn(rigs, code)) throw Error('Unknown elf ear rig');
    const t = (((Number.isFinite(seconds) ? seconds : 0) % 12) + 12) % 12;
    const offset = ['1A', '1B', '1C'].indexOf(code) * .13;
    const movement = (delay, strength) => strength * (
      pulse(t, .8 + offset + delay, .72) +
      pulse(t, 4.7 + offset + delay, .58) * .7 +
      pulse(t, 9 + offset + delay, .78) * .6
    );
    return {left: movement(0, .069) || 0, right: movement(.11, -.062) || 0};
  }
  function polygon(c, points) {
    c.beginPath(); c.moveTo(...points[0]);
    for (const point of points.slice(1)) c.lineTo(...point);
    c.closePath();
  }
  function canvas(width, height) {
    const node = root.document.createElement('canvas'); node.width = width; node.height = height; return node;
  }
  function prepare(image, code, left, width) {
    const original = canvas(width, 1024), base = canvas(width, 1024);
    const scale = .95, dx = width * .025, dy = 1024 * .025;
    original.getContext('2d').drawImage(image, left, 0, width, 1024, dx, dy, width * scale, 1024 * scale);
    const c = base.getContext('2d'); c.drawImage(original, 0, 0);
    const ears = geometry(code).map(sourceEar => {
      const transform = ([x, y]) => [x * scale + dx, y * scale + dy];
      const ear = {pivot: transform(sourceEar.pivot), polygon: sourceEar.polygon.map(transform)};
      const piece = canvas(width, 1024), g = piece.getContext('2d');
      const mask = canvas(width, 1024), m = mask.getContext('2d');
      polygon(m, ear.polygon); m.fillStyle = '#fff'; m.fill();
      const fade = m.createLinearGradient(0, 200 * scale + dy, 0, 285 * scale + dy);
      fade.addColorStop(0, '#fff'); fade.addColorStop(1, 'rgba(255,255,255,0)');
      m.globalCompositeOperation = 'destination-in'; m.fillStyle = fade; m.fillRect(0, 0, width, 1024);
      g.drawImage(original, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, 0, 0);
      c.save(); c.globalCompositeOperation = 'destination-out'; c.drawImage(mask, 0, 0); c.restore();
      return {...ear, piece};
    });
    return {original, base, ears};
  }
  function paint(c, rig, code, seconds) {
    const pose = sample(code, seconds), width = rig.base.width;
    c.canvas.dataset.earState = Math.max(Math.abs(pose.left), Math.abs(pose.right)) > .02 ? 'active' : 'rest';
    c.clearRect(0, 0, width, 1024);
    if (pose.left === 0 && pose.right === 0) { c.drawImage(rig.original, 0, 0); return; }
    c.drawImage(rig.base, 0, 0);
    rig.ears.forEach((ear, index) => {
      c.save(); c.translate(...ear.pivot); c.rotate(index ? pose.right : pose.left);
      c.drawImage(ear.piece, -ear.pivot[0], -ear.pivot[1]); c.restore();
      // A fixed root cap keeps the joint attached while the tip arcs around it.
      c.save(); c.beginPath(); c.arc(...ear.pivot, 8, 0, Math.PI * 2); c.clip(); c.drawImage(rig.original, 0, 0); c.restore();
    });
  }
  const entries = new Set();
  let frame = 0, last = 0, playing = true, manualTime = 0;
  let started = root.performance ? root.performance.now() / 1000 : 0;
  function visible() { return playing && !root.document.hidden && Array.from(entries).some(e => e.visible); }
  function schedule() { if (!frame && visible()) frame = root.requestAnimationFrame(tick); }
  function tick(now) {
    frame = 0;
    if (!visible()) return;
    if (now - last >= 1000 / 30) {
      last = now;
      for (const entry of entries) if (entry.visible) paint(entry.context, entry.rig, entry.code, now / 1000 - started);
    }
    schedule();
  }
  function attach(container, image, code, left, width) {
    let disposed = false, entry = null, observer = null;
    const output = canvas(width, 1024); output.className = 'ear-canvas';
    output.setAttribute('role', 'img'); output.setAttribute('aria-label', image.alt + '؛ تجربة نفضة الأذن');
    function ready() {
      if (disposed) return;
      const rig = prepare(image, code, left, width), context = output.getContext('2d');
      paint(context, rig, code, playing ? root.performance.now() / 1000 - started : manualTime);
      container.append(output); container.classList.add('has-ear-motion');
      entry = {context, rig, code, visible: false}; entries.add(entry);
      observer = new root.IntersectionObserver(items => { entry.visible = items[0].isIntersecting; schedule(); });
      observer.observe(output);
    }
    if (image.complete && image.naturalWidth) ready(); else image.addEventListener('load', ready, {once: true});
    return () => {
      disposed = true; image.removeEventListener('load', ready);
      if (observer) observer.disconnect(); if (entry) entries.delete(entry);
      output.remove(); container.classList.remove('has-ear-motion');
      if (!visible() && frame) { root.cancelAnimationFrame(frame); frame = 0; }
    };
  }
  if (root.document) root.document.addEventListener('visibilitychange', () => {
    if (root.document.hidden && frame) { root.cancelAnimationFrame(frame); frame = 0; } else schedule();
  });
  function setPlaying(value) {
    if (playing && !value) manualTime = (root.performance.now() / 1000 - started) % 12;
    playing = Boolean(value);
    if (playing) { started = root.performance.now() / 1000 - manualTime; schedule(); }
    else if (frame) { root.cancelAnimationFrame(frame); frame = 0; }
    return manualTime;
  }
  function seek(value) {
    setPlaying(false); manualTime = Math.max(0, Math.min(12, Number(value) || 0));
    for (const entry of entries) paint(entry.context, entry.rig, entry.code, manualTime);
  }
  return {geometry, sample, prepare, paint, attach, setPlaying, seek};
});
