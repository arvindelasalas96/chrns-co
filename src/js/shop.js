/* chrns.co — shop filter + sort (client side over /data/watches.json rendered into the grid) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const grid = $('#grid'); if (!grid) return;
  const cards = $$('.card', grid);
  const data = cards.map((el) => ({ el, ...JSON.parse(el.dataset.w) }));
  const state = { sort: 'new', brand: new Set(), dial: new Set(), price: new Set(), incl: new Set(), quick: null };

  const bands = { p1: [0, 9999], p2: [10000, 20000], p3: [20001, 35000], p4: [35001, 1e12] };
  const inBand = (p, ids) => !ids.size || [...ids].some((id) => p >= bands[id][0] && p <= bands[id][1]);
  const match = (w) => (!state.brand.size || state.brand.has(w.brand)) && (!state.dial.size || state.dial.has(w.dial)) && inBand(w.price, state.price) && (!state.incl.size || state.incl.has(w.incl)) && (!state.quick || state.quick(w));
  const sorters = {
    new: (a, b) => (b.added > a.added ? 1 : -1), old: (a, b) => (a.added > b.added ? 1 : -1),
    lo: (a, b) => a.price - b.price, hi: (a, b) => b.price - a.price,
    az: (a, b) => a.name.localeCompare(b.name), za: (a, b) => b.name.localeCompare(a.name),
  };
  const labels = { new: 'Newest', old: 'Oldest', lo: 'Price, low to high', hi: 'Price, high to low', az: 'A to Z', za: 'Z to A' };

  const apply = () => {
    const live = data.filter(match).sort((a, b) => (a.sold - b.sold) || sorters[state.sort](a, b));
    const seen = new Set(live);
    live.forEach((w, i) => { w.el.style.order = i; w.el.hidden = false; w.el.dataset.i = i; w.el.classList.add('in'); });
    data.forEach((w) => { if (!seen.has(w)) w.el.hidden = true; });
    $('#empty').hidden = live.length > 0;
    $$('[data-count]').forEach((n) => n.textContent = live.length);
    $$('.sortbtn .cur-sort').forEach((n) => n.textContent = labels[state.sort]);
    $$('[data-sort]').forEach((b) => b.setAttribute('aria-checked', b.dataset.sort === state.sort));
    const active = state.brand.size + state.dial.size + state.price.size + state.incl.size;
    $$('[data-active]').forEach((n) => n.textContent = active ? ` · ${active}` : '');
  };

  /* quick chips (top bar) */
  const chips = $$('.chips .chip');
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-pressed', x === c));
    const q = c.dataset.quick; state.brand.clear(); state.price.clear(); state.incl.clear(); state.quick = null;
    if (q === 'all') {} else if (q.startsWith('brand:')) state.brand.add(q.slice(6));
    else if (q === 'under15') state.quick = (w) => w.price < 15000;
    else if (q === 'fullset') state.incl.add('Full set');
    else if (q === 'new') state.quick = (w) => (Date.now() - new Date(w.added)) < 14 * 864e5;
    apply();
  }));

  /* desktop sort menu */
  const sb = $('.sortbtn'), sm = $('.sortmenu');
  sb?.addEventListener('click', () => { const o = !sm.classList.contains('open'); sm.classList.toggle('open', o); sb.setAttribute('aria-expanded', o); });
  document.addEventListener('click', (e) => { if (sm && !e.target.closest('.sortmenu, .sortbtn')) { sm.classList.remove('open'); sb?.setAttribute('aria-expanded', 'false'); } });
  $$('[data-sort]').forEach((b) => b.addEventListener('click', () => { state.sort = b.dataset.sort; sm?.classList.remove('open'); apply(); }));

  /* mobile sheet */
  const sheet = $('.sheet');
  const openSheet = (o) => { sheet.classList.toggle('open', o); document.body.style.overflow = o ? 'hidden' : ''; };
  $('.mobile-filter')?.addEventListener('click', () => openSheet(true));
  $$('[data-close-sheet]').forEach((b) => b.addEventListener('click', () => openSheet(false)));
  $$('.sheet .opt').forEach((b) => b.addEventListener('click', () => {
    const set = state[b.dataset.k]; const v = b.dataset.v;
    set.has(v) ? set.delete(v) : set.add(v); b.setAttribute('aria-pressed', set.has(v));
    chips.forEach((x) => x.setAttribute('aria-pressed', x.dataset.quick === 'all' && false)); state.quick = null; apply();
  }));
  $('[data-clear]')?.addEventListener('click', () => {
    ['brand', 'dial', 'price', 'incl'].forEach((k) => state[k].clear()); state.sort = 'new'; state.quick = null;
    $$('.sheet .opt').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    chips.forEach((x) => x.setAttribute('aria-pressed', x.dataset.quick === 'all')); apply();
  });
  apply();
})();
