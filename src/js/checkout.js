/* chrns.co — one-screen checkout */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const form = $('#co'); if (!form) return;
  const slug = new URLSearchParams(location.search).get('w');
  const all = JSON.parse($('#catalog').textContent);
  const settings = JSON.parse($('#settings').textContent);
  const w = all.find((x) => x.slug === slug) || all.find((x) => x.status === 'available');
  if (!w) { location.href = '/'; return; }
  const peso = window.CHRNS.peso;
  const price = w.sale_price || w.price;

  /* summary */
  $('#s-img').src = w.images[0]; $('#s-brand').textContent = `${w.brand} · ${w.year || ''}`; $('#s-name').textContent = w.name;
  $('#s-meta').textContent = `One of one · ${w.condition} · ${w.box_papers}`;
  $('#s-price').textContent = peso(price); $('#s-total').textContent = peso(price);
  $$('.p-amt').forEach((n) => n.textContent = peso(price));
  $('#s-ship').textContent = 'Free';
  $('input[name=slug]').value = w.slug;

  /* methods */
  const online = settings.payments_enabled;
  const methods = [
    ...(online ? [
      { id: 'gcash', label: 'GCash', note: 'Instant' }, { id: 'maya', label: 'Maya', note: 'Instant' },
      { id: 'card', label: 'Credit or debit card', note: 'Visa · Mastercard' }, { id: 'bank', label: 'Online banking / QR Ph', note: 'BPI · BDO · UnionBank' },
      { id: 'billease', label: 'Installments with BillEase', note: '3 to 12 months' },
    ] : [{ id: 'online', label: 'Pay online', note: 'GCash · Maya · Card · Bank, opening soon' }]),
    { id: 'cod', label: 'Cash on delivery or meetup', note: `${settings.meetup_areas || 'Cebu'} only` },
    { id: 'transfer', label: 'Direct bank transfer or GCash', note: 'We send details, you send proof' },
  ];
  const list = $('#methods'); let cur = online ? 'gcash' : 'cod';
  const cta = $('#cta span');
  const render = () => {
    list.innerHTML = methods.map((m) => `<button type="button" class="pay" role="radio" aria-checked="${m.id === cur}" data-m="${m.id}"><span class="r"></span>${m.label}<small>${m.note}</small></button>`).join('');
    const m = methods.find((x) => x.id === cur);
    cta.textContent = cur === 'cod' || cur === 'transfer' || cur === 'online' ? 'Reserve this watch' : `Pay ${peso(price)} with ${m.label}`;
    $('#country-note').textContent = /philippines/i.test($('select[name=country]').value) ? 'Free shipping within the Philippines.' : 'International shipping (DHL) billed separately after order.';
  };
  list.addEventListener('click', (e) => { const b = e.target.closest('.pay'); if (!b) return; cur = b.dataset.m; render(); });
  $('select[name=country]').addEventListener('change', render);
  render();

  /* country select pre-fills shipping line */
  $('select[name=country]').addEventListener('change', (e) => { $('#s-ship').textContent = /philippines/i.test(e.target.value) ? 'Free' : 'Quoted after order'; });

  /* submit */
  const err = $('#err'); const btn = $('#cta');
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true; cta.textContent = 'One moment';
    const body = Object.fromEntries(new FormData(form));
    body.method = (cur === 'cod' || cur === 'transfer' || cur === 'online') ? (cur === 'transfer' ? 'meetup' : cur === 'online' ? 'cod' : 'cod') : 'online';
    body.note = cur;
    try {
      const r = await fetch('/.netlify/functions/create-checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const out = await r.json();
      if (!r.ok) throw new Error(out.error || 'Something went wrong. Message us on Viber and we will sort it.');
      location.href = out.url || `/thank-you/?order=${out.orderId}&reserved=1`;
    } catch (ex) { err.textContent = ex.message; btn.disabled = false; render(); }
  });
})();
