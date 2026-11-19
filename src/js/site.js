/* chrns.co — shared behaviour */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* sticky header + filter bar state */
  const header = $('.header');
  const filters = $('.filters');
  const onScroll = () => {
    const y = scrollY;
    header && header.classList.toggle('is-stuck', y > 24);
    if (filters) filters.classList.toggle('is-stuck', filters.getBoundingClientRect().top <= header.offsetHeight + 1 && y > 200);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobile menu */
  const menu = $('.menu');
  $('.burger')?.addEventListener('click', () => { menu.classList.add('open'); document.body.style.overflow = 'hidden'; });
  $('.menu .close')?.addEventListener('click', () => { menu.classList.remove('open'); document.body.style.overflow = ''; });

  /* reveal on scroll (cards stagger, sections fade) */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const i = el.dataset.i ? Math.min(+el.dataset.i % 4, 3) : 0;
      el.style.transitionDelay = (i * 70) + 'ms';
      el.classList.add('in'); io.unobserve(el);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.card, .reveal, .story').forEach((el, i) => { if (!el.dataset.i) el.dataset.i = i; io.observe(el); });
  } else { $$('.card, .reveal, .story').forEach((el) => el.classList.add('in')); }

  /* autoplay videos only when visible, cap concurrent on mobile */
  const vids = $$('video[autoplay]');
  if (vids.length && 'IntersectionObserver' in window) {
    const max = fine ? 12 : 6; let playing = 0;
    const vio = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting && playing < max) { v.play().then(() => { playing++; v.dataset.on = 1; }).catch(() => {}); }
      else if (!e.isIntersecting && v.dataset.on) { v.pause(); playing--; delete v.dataset.on; }
    }), { threshold: 0.25 });
    vids.forEach((v) => { v.muted = true; v.playsInline = true; vio.observe(v); });
  }

  /* hero: drag to scroll on desktop */
  const hero = $('.hero');
  if (hero && fine) {
    let down = false, sx = 0, sl = 0, moved = false;
    hero.addEventListener('pointerdown', (e) => { down = true; moved = false; sx = e.clientX; sl = hero.scrollLeft; hero.classList.add('dragging'); });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; hero.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; hero.classList.remove('dragging'); });
    hero.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);
  }

  /* watch-case cursor */
  if (fine && !reduce) {
    const cur = document.createElement('div');
    cur.className = 'cur'; cur.innerHTML = '<span class="crown"></span><span class="lbl"></span>';
    document.body.appendChild(cur); document.body.classList.add('cursor-on');
    const lbl = cur.querySelector('.lbl');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf;
    const loop = () => { x += (tx - x) * 0.22; y += (ty - y) * 0.22; cur.style.transform = `translate3d(${x}px,${y}px,0)`; raf = requestAnimationFrame(loop); };
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!raf) loop(); }, { passive: true });
    addEventListener('pointerdown', () => cur.classList.add('press'));
    addEventListener('pointerup', () => cur.classList.remove('press'));
    document.addEventListener('mouseleave', () => cur.style.opacity = 0);
    document.addEventListener('mouseenter', () => cur.style.opacity = 1);
    const over = (e) => {
      const t = e.target.closest('[data-cursor], a, button, label, input, select, .spin');
      cur.classList.remove('hover', 'media'); lbl.textContent = '';
      if (!t) return;
      const kind = t.dataset.cursor || (t.classList.contains('spin') ? 'drag' : '');
      if (kind === 'view' || kind === 'drag' || kind === 'zoom') { cur.classList.add('media'); lbl.textContent = kind; }
      else cur.classList.add('hover');
    };
    document.addEventListener('pointerover', over);
  }

  /* drop alerts + generic forms: friendly no-backend stub until wired */
  $$('form[data-stub]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault(); const b = f.querySelector('button'); const t = b.innerHTML;
    b.innerHTML = '<span>Saved. Salamat.</span>'; b.disabled = true; setTimeout(() => { b.innerHTML = t; b.disabled = false; f.reset(); }, 2600);
  }));

  /* tabular money helper exposed for other scripts */
  window.CHRNS = { peso: (n) => '₱' + Number(n).toLocaleString('en-PH'), fine, reduce };
})();
