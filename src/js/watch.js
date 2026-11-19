/* chrns.co — watch page: tabs, photos, hotspots, 360 spin, wrist fit, mobile bar */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('.stage'); if (!stage) return;
  const W = JSON.parse($('#watch-data').textContent);

  /* tabs */
  const views = $$('.stage > .view'); const tabs = $$('.tab');
  const show = (name) => {
    views.forEach((v) => v.classList.toggle('on', v.dataset.view === name));
    tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.view === name));
    const vid = $('.view[data-view="video"] video'); if (vid) name === 'video' ? vid.play().catch(() => {}) : vid.pause();
    const wv = $('.view[data-view="wrist"] video'); if (wv) name === 'wrist' ? wv.play().catch(() => {}) : wv.pause();
  };
  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.view)));
  show(tabs[0]?.dataset.view || 'photo');

  /* photos + thumbs + zoom */
  const img = $('.view.photo img'); const thumbs = $$('.thumb'); let idx = 0;
  const setPhoto = (i) => {
    idx = i; img.src = W.images[i]; thumbs.forEach((t, j) => j === i ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current'));
    $$('.dot').forEach((d) => d.hidden = +d.dataset.photo !== i + 1); closeNote(); $('.view.photo').classList.remove('zoom');
  };
  thumbs.forEach((t, i) => t.addEventListener('click', () => { show('photo'); setPhoto(i); }));
  const photoView = $('.view.photo');
  photoView.addEventListener('click', (e) => {
    if (e.target.closest('.dot, .note')) return;
    const z = photoView.classList.toggle('zoom');
    if (z) { const r = photoView.getBoundingClientRect(); img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; }
  });
  photoView.addEventListener('mousemove', (e) => { if (!photoView.classList.contains('zoom')) return; const r = photoView.getBoundingClientRect(); img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; });

  /* hotspots */
  const note = $('.note'); let openDot = null;
  const closeNote = () => { note.classList.remove('on'); openDot?.setAttribute('aria-expanded', 'false'); openDot = null; };
  $$('.dot').forEach((d) => d.addEventListener('click', (e) => {
    e.stopPropagation();
    if (openDot === d) return closeNote();
    openDot?.setAttribute('aria-expanded', 'false'); openDot = d; d.setAttribute('aria-expanded', 'true');
    note.textContent = d.dataset.note; note.classList.add('on');
  }));
  setPhoto(0);

  /* 360 spin */
  const spin = $('.spin');
  if (spin) {
    const frames = W.spin && W.spin.length ? W.spin : W.images; const n = frames.length;
    const fimg = $('img', spin); let f = 0, down = false, lx = 0, vel = 0, acc = 0, raf;
    frames.forEach((s) => { const i = new Image(); i.src = s; });
    const draw = () => { fimg.src = frames[((Math.round(f) % n) + n) % n]; };
    const pxPerFrame = Math.max(4, Math.round(400 / n));
    const start = (x) => { down = true; lx = x; vel = 0; spin.classList.add('dragging'); cancelAnimationFrame(raf); };
    const move = (x) => { if (!down) return; const dx = x - lx; lx = x; acc += dx; vel = dx; while (Math.abs(acc) >= pxPerFrame) { f += acc > 0 ? 1 : -1; acc -= Math.sign(acc) * pxPerFrame; } draw(); };
    const end = () => { if (!down) return; down = false; spin.classList.remove('dragging'); const inertia = () => { vel *= 0.92; if (Math.abs(vel) < 0.4) return; acc += vel; while (Math.abs(acc) >= pxPerFrame) { f += acc > 0 ? 1 : -1; acc -= Math.sign(acc) * pxPerFrame; } draw(); raf = requestAnimationFrame(inertia); }; raf = requestAnimationFrame(inertia); };
    spin.addEventListener('pointerdown', (e) => { spin.setPointerCapture(e.pointerId); start(e.clientX); });
    spin.addEventListener('pointermove', (e) => move(e.clientX));
    spin.addEventListener('pointerup', end); spin.addEventListener('pointercancel', end);
    draw();
  }

  /* wrist fit */
  const wrist = $('#wrist'); const out = $('#wrist-out');
  const fit = () => {
    const cm = parseFloat(wrist.value) || 16.5; const d = W.case_size_mm; const l2l = W.lug_to_lug_mm || Math.round(d * 1.15);
    const ratio = l2l / (cm * 10 / Math.PI); // lug span vs wrist diameter
    const verdict = ratio < 0.62 ? 'sits small and neat' : ratio < 0.74 ? 'sits like it should, classic proportion' : ratio < 0.84 ? 'wears large but flat' : 'will overhang the wrist';
    out.textContent = `${d}mm case, ${l2l}mm lug to lug, on a ${cm}cm wrist: ${verdict}.` + (W.fits_up_to_cm ? ` Bracelet fits up to ${W.fits_up_to_cm}cm.` : '');
  };
  if (wrist) { wrist.addEventListener('input', fit); fit(); }

  /* mobile buy bar appears once the desktop buy button scrolls past */
  const bar = $('.mobilebar'); const buy = $('#buy-main');
  if (bar && buy && 'IntersectionObserver' in window) {
    document.body.classList.add('has-mobilebar');
    new IntersectionObserver((es) => es.forEach((e) => bar.classList.toggle('show', !e.isIntersecting && e.boundingClientRect.top < 0 || (!e.isIntersecting && e.boundingClientRect.top > innerHeight))), { threshold: 0 }).observe(buy);
  }
})();
