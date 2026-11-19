// chrns.co static build. `node build.mjs` → public/
import { readFile, readdir, writeFile, mkdir, cp } from "node:fs/promises";
import path from "node:path";

const OUT = "public";
const read = async (p) => JSON.parse(await readFile(p, "utf8"));
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const peso = (n) => "₱" + Number(n).toLocaleString("en-PH");
const attr = (o) => esc(JSON.stringify(o));
const write = async (rel, html) => { const f = path.join(OUT, rel); await mkdir(path.dirname(f), { recursive: true }); await writeFile(f, html); };

const store = await read("data/settings/store.json");
const policies = await read("data/settings/policies.json");
const files = (await readdir("data/watches")).filter((f) => f.endsWith(".json"));
const watches = (await Promise.all(files.map((f) => read(`data/watches/${f}`))))
  .filter((w) => w.status !== "hidden" && !w.vip_only)
  .sort((a, b) => (b.added > a.added ? 1 : -1));
const avail = watches.filter((w) => w.status === "available" || w.status === "reserved");
const sold = watches.filter((w) => w.status === "sold");
const brands = [...new Set(watches.map((w) => w.brand))].sort();
const count = (f) => watches.filter(f).length;
const ago = (d) => { const days = Math.round((Date.now() - new Date(d)) / 864e5); return days < 1 ? "Today" : days < 7 ? `${days} day${days > 1 ? "s" : ""} ago` : days < 30 ? `${Math.round(days / 7)} week${days >= 14 ? "s" : ""} ago` : "A while ago"; };
const SITE = process.env.URL || process.env.SITE_URL || "https://chrns-co.netlify.app";

const ICON = {
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  burger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chev: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  chat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" stroke-width="3" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
  rotate: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
  lock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
};

const msgHref = store.whatsapp ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}` : store.viber ? `viber://chat?number=${encodeURIComponent(store.viber)}` : "/contact/";

function layout({ title, desc, body, path: p = "/", scripts = [], image, noindex = false, jsonld }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0A0A0A">
${noindex ? '<meta name="robots" content="noindex">' : ""}
<link rel="canonical" href="${SITE}${p}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:url" content="${SITE}${p}">${image ? `<meta property="og:image" content="${SITE}${image}">` : ""}
<link rel="icon" href="/images/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body>
${store.announcement ? `<div class="announce">${esc(store.announcement)}</div>` : ""}
<header class="header gutter">
  <button class="burger" aria-label="Menu">${ICON.burger}</button>
  <nav aria-label="Primary">
    <a href="/#shop"${p === "/" ? ' aria-current="page"' : ""}>Watches</a><a href="/sold/"${p === "/sold/" ? ' aria-current="page"' : ""}>Sold</a><a href="/#story">About</a><a href="/contact/"${p === "/contact/" ? ' aria-current="page"' : ""}>Contact</a>
  </nav>
  <a class="logo" href="/" aria-label="CHRNS home"><img src="/images/logo.png" alt="CHRNS Vintage Watch" width="553" height="469"></a>
  <div class="right"><a href="/#shop" aria-label="Search watches">${ICON.search}</a><span>PHP</span></div>
</header>
<div class="menu" aria-label="Menu">
  <button class="close" aria-label="Close menu">${ICON.close}</button>
  <a href="/#shop">Watches</a><a href="/sold/">Sold</a><a href="/#story">About</a><a href="/contact/">Contact</a><a href="/guarantee/">Guarantee</a>
</div>
<main>${body}</main>
<footer class="footer gutter">
  <div style="display:flex;flex-direction:column;gap:14px"><img src="/images/logo.png" alt="" width="553" height="469"><span>Cebu City, Philippines</span></div>
  <div class="cols">
    <div>${store.viber ? `<a href="viber://chat?number=${encodeURIComponent(store.viber)}">Viber</a>` : ""}${store.whatsapp ? `<a href="https://wa.me/${store.whatsapp.replace(/\D/g, "")}">WhatsApp</a>` : ""}<a href="https://instagram.com/chrns.co" rel="noopener">Instagram</a><a href="https://tiktok.com/@chrns.co" rel="noopener">TikTok</a><a href="mailto:${esc(store.email)}">Email</a></div>
    <div><a href="/guarantee/">Guarantee &amp; returns</a><a href="/shipping/">Shipping</a><a href="/terms/">Terms</a><a href="/privacy/">Privacy</a></div>
  </div>
  <span style="align-self:flex-end">© ${new Date().getFullYear()} CHRNS</span>
</footer>
<a class="fab" href="${msgHref}" aria-label="Message us">${ICON.chat}</a>
<script src="/assets/site.js" defer></script>
${scripts.map((s) => `<script src="/assets/${s}" defer></script>`).join("\n")}
</body>
</html>`;
}

const card = (w, i) => {
  const d = { slug: w.slug, name: w.name, brand: w.brand, price: w.sale_price || w.price, dial: w.dial_color, incl: w.box_papers, added: w.added, sold: w.status === "sold" ? 1 : 0 };
  const media = w.video
    ? `<video src="${w.video}" poster="${w.images[0]}" muted loop playsinline preload="none" autoplay></video>`
    : `<img src="${w.images[0]}" alt="" loading="lazy" decoding="async">`;
  const alt = w.images[1] ? `<img class="alt" src="${w.images[1]}" alt="" loading="lazy" decoding="async">` : "";
  return `<a class="card${w.status === "sold" ? " is-sold" : ""}" href="/watch/${w.slug}/" data-w="${attr(d)}" data-i="${i}" data-cursor="view">
  <div class="media">${media}${alt}${w.status === "sold" ? '<span class="badge">Sold</span>' : w.status === "reserved" ? '<span class="badge">Reserved</span>' : ""}</div>
  <div class="meta"><span class="title">${esc(w.name)}</span><span class="price num">${w.sale_price ? `<s>${peso(w.price)}</s>` : ""}${peso(w.sale_price || w.price)}</span></div>
</a>`;
};

/* ---------- HOME ---------- */
const heroTiles = [
  ...watches.filter((w) => w.video).slice(0, 3).map((w) => ({ v: w.video, p: w.images[0], w })),
  ...watches.filter((w) => !w.video).slice(0, 2).map((w) => ({ i: w.images[0], w })),
].sort(() => 0).slice(0, 5);
// interleave video / photo
const tiles = []; const vs = heroTiles.filter((t) => t.v), ps = heroTiles.filter((t) => t.i);
while (vs.length || ps.length) { if (vs.length) tiles.push(vs.shift()); if (ps.length) tiles.push(ps.shift()); }

const dials = [...new Set(watches.map((w) => w.dial_color))];
const dialHex = { Black: "#111", White: "#eee", Blue: "#2A4A7A", Green: "#2E5A45", Silver: "#C8C8C8", Grey: "#777", Gold: "#C9A96A", Brown: "#5A3A22", Champagne: "#D8C59A", Other: "#555" };
const incls = ["Full set", "Box only", "Papers only", "Watch only"].filter((x) => watches.some((w) => w.box_papers === x));
const opt = (k, v, label, n, sw) => `<button type="button" class="opt" data-k="${k}" data-v="${esc(v)}" aria-pressed="false"><span style="display:flex;align-items:center"><span class="box">${ICON.check}</span>${sw ? `<span class="sw" style="background:${sw}"></span>` : ""}${esc(label)}</span><small>${n}</small></button>`;

const home = layout({
  title: "CHRNS · Vintage watches, Cebu",
  desc: "Pre-owned and vintage watches, one of each, photographed honestly. Free shipping nationwide, 7-day authenticity guarantee. Cebu, Philippines.",
  path: "/",
  scripts: ["shop.js"],
  image: watches[0]?.images[0],
  jsonld: { "@context": "https://schema.org", "@type": "Store", name: "CHRNS Vintage Watch", url: SITE, address: { "@type": "PostalAddress", addressLocality: "Cebu City", addressCountry: "PH" }, email: store.email },
  body: `
<section class="hero" aria-label="Featured">
  ${tiles.map((t) => `<a class="tile" href="/watch/${t.w.slug}/" data-cursor="view">${t.v ? `<video src="${t.v}" poster="${t.p}" muted loop playsinline preload="metadata" autoplay></video>` : `<img src="${t.i}" alt="${esc(t.w.name)}" loading="eager" decoding="async">`}</a>`).join("")}
</section>

<section id="shop" class="gutter" style="padding-top:40px">
  <div class="filters">
    <div class="chips" role="group" aria-label="Quick filters">
      <button class="chip" data-quick="all" aria-pressed="true">All · <span data-count>${avail.length}</span></button>
      ${brands.map((b) => `<button class="chip" data-quick="brand:${esc(b)}" aria-pressed="false">${esc(b)} · ${count((w) => w.brand === b && w.status !== "sold")}</button>`).join("")}
      <button class="chip" data-quick="under15" aria-pressed="false">Under ₱15K</button>
      ${incls.includes("Full set") ? '<button class="chip" data-quick="fullset" aria-pressed="false">Full set</button>' : ""}
    </div>
    <button class="sortbtn" aria-expanded="false" aria-haspopup="menu"><span>Sort · <span class="cur-sort">Newest</span></span>${ICON.chev}</button>
    <button class="chip mobile-filter" style="gap:10px;align-items:center">${ICON.filter} Filter &amp; sort<span data-active></span></button>
    <div class="sortmenu" role="menu">
      ${Object.entries({ new: "Newest first", old: "Oldest first", lo: "Price, low to high", hi: "Price, high to low", az: "Name, A to Z", za: "Name, Z to A" }).map(([k, v]) => `<button role="menuitemradio" data-sort="${k}" aria-checked="${k === "new"}">${v}</button>`).join("")}
    </div>
  </div>
  <div id="grid" class="grid">
    ${watches.map(card).join("\n")}
    <p id="empty" class="empty" hidden>Nothing matches those filters yet. Join the drop list below and we'll tell you when one lands.</p>
  </div>
</section>

${sold.length ? `<section class="section gutter reveal">
  <div class="section-head"><span class="eyebrow">Just sold</span><a class="link" href="/sold/">Archive</a></div>
  <div class="row">${sold.slice(0, 8).map((w) => `<a class="soldcard" href="/watch/${w.slug}/"><div class="thumb"><img src="${w.images[0]}" alt="" loading="lazy"></div><span>${esc(w.name)}</span><small>Sold · ${ago(w.sold_at || w.added)}</small></a>`).join("")}</div>
</section>` : ""}

<section id="story" class="section gutter story">
  <div style="display:flex;flex-direction:column;gap:12px"><div class="photo"><img src="/images/founder.jpg" alt="Jafaith laying out watches from a travel case" loading="lazy"></div><span class="label" style="color:var(--ink-4)">Jafaith · Founder · Cebu</span></div>
  <div class="copy reveal">
    <span class="eyebrow">From the founder</span>
    <h1 class="h1">Watches that were made to be kept.</h1>
    <p class="lede">I find these one at a time. Each one gets opened, checked, serviced where it needs to be, and photographed exactly as it is. One of each. When it's gone, it's gone.</p>
    <p class="lede">If a watch is ever proven not to be what we said it is, you get your money back. That's the whole policy.</p>
    <a class="ulink" href="#shop">See what's available</a>
  </div>
</section>

<section class="section gutter reveal">
  <div class="section-head"><div style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Handovers</span><h2 class="h2">Watches that found their wrists.</h2></div><a class="link" href="https://instagram.com/chrns.co" rel="noopener">Instagram</a></div>
  <div class="handovers">
    ${[["Handover photo", "Name · City · Seiko Type II"], ["Meetup photo", "Name · Manila · Omega De Ville"], ["Unboxing video", "Name · Singapore · Technos"], ["Wrist shot from buyer", "Name · Davao · Seikomatic"]].map(([ph, who]) => `<div class="handover"><div class="ph">${ph}</div><p>“Placeholder. Buyer quote goes here, two lines max.”</p><small>${who}</small></div>`).join("")}
  </div>
</section>

<section class="section gutter strip reveal">
  <div><h3>Authenticated</h3><p>Inspected and opened before listing. Reference numbers photographed.</p></div>
  <div><h3>7-day guarantee</h3><p>Proven not authentic, full refund. We pay the return shipping.</p></div>
  <div><h3>Free PH shipping</h3><p>LBC or J&amp;T nationwide. COD and meetups in ${esc(store.meetup_areas || "Cebu")}. DHL worldwide.</p></div>
</section>

<section class="gutter alerts reveal">
  <h2 class="h2">Hear about new pieces before they're listed.</h2>
  <form data-stub style="display:flex;gap:24px;align-items:flex-end">
    <label class="field" style="flex:1"><span>Email or mobile</span><input type="text" name="contact" placeholder="you@email.com" required autocomplete="email"></label>
    <button class="btn" type="submit"><span>Notify me</span><span>Notify me</span></button>
  </form>
  <p class="vip"><i></i>VIP list sees every new piece 48 hours before it goes public. <a class="ulink" href="/contact/">Have a code?</a></p>
</section>

<div class="sheet" role="dialog" aria-label="Filter and sort">
  <div class="panel">
    <div class="top"><span class="label">Filter &amp; sort</span><div style="display:flex;gap:20px;align-items:center"><button class="label" data-clear style="color:var(--ink-3);font-size:11px">Clear all</button><button data-close-sheet aria-label="Close" style="width:44px;height:44px;display:flex;align-items:center;justify-content:flex-end">${ICON.close}</button></div></div>
    <div class="body">
      <div class="group"><span class="eyebrow">Sort by</span><div class="sortchips">${Object.entries({ new: "Newest", old: "Oldest", lo: "Price ↑", hi: "Price ↓", az: "A to Z", za: "Z to A" }).map(([k, v]) => `<button type="button" class="chip" data-sort="${k}" aria-pressed="${k === "new"}">${v}</button>`).join("")}</div></div>
      <div class="group"><span class="eyebrow">Price</span>${[["p1", "Under ₱10,000", (p) => p < 10000], ["p2", "₱10,000 to ₱20,000", (p) => p >= 10000 && p <= 20000], ["p3", "₱20,000 to ₱35,000", (p) => p > 20000 && p <= 35000], ["p4", "Over ₱35,000", (p) => p > 35000]].map(([id, l, f]) => opt("price", id, l, count((w) => f(w.sale_price || w.price)))).join("")}</div>
      <div class="group"><span class="eyebrow">Brand</span>${brands.map((b) => opt("brand", b, b, count((w) => w.brand === b))).join("")}</div>
      <div class="group"><span class="eyebrow">Dial colour</span>${dials.map((d) => opt("dial", d, d, count((w) => w.dial_color === d), dialHex[d] || "#555")).join("")}</div>
      <div class="group"><span class="eyebrow">Includes</span>${incls.map((x) => opt("incl", x, x, count((w) => w.box_papers === x))).join("")}</div>
    </div>
    <div class="foot"><button class="btn block" data-close-sheet><span>Show <span data-count>${avail.length}</span> watches</span></button></div>
  </div>
</div>`,
});
await write("index.html", home);

/* ---------- WATCH PAGES ---------- */
for (const w of watches) {
  const price = w.sale_price || w.price;
  const related = watches.filter((x) => x.slug !== w.slug && x.status !== "sold").sort((a, b) => (b.brand === w.brand) - (a.brand === w.brand)).slice(0, 4);
  const soldOut = w.status === "sold";
  const data = { slug: w.slug, images: w.images, spin: w.spin || [], case_size_mm: w.case_size_mm, lug_to_lug_mm: w.lug_to_lug_mm, fits_up_to_cm: w.fits_up_to_cm };
  const body = `
<div class="gutter crumb"><a href="/#shop">Watches</a> &nbsp;/&nbsp; <a href="/#shop">${esc(w.brand)}</a> &nbsp;/&nbsp; ${esc(w.model)}${w.ref ? " " + esc(w.ref) : ""}</div>
<section class="gutter pd">
  <div>
    <div class="stage">
      ${w.video ? `<div class="view" data-view="video"><video src="${w.video}" poster="${w.images[0]}" muted loop playsinline preload="metadata"></video></div>` : ""}
      <div class="view photo" data-view="photo" data-cursor="zoom">
        <img src="${w.images[0]}" alt="${esc(w.name)}" decoding="async">
        ${(w.hotspots || []).map((h, i) => `<button class="dot" style="left:${h.x}%;top:${h.y}%" data-photo="${h.photo}" data-note="${esc(h.note)}" aria-label="Condition note ${i + 1}" aria-expanded="false">${i + 1}</button>`).join("")}
        <div class="note" role="status"></div>
      </div>
      <div class="view spin" data-view="spin" data-cursor="drag"><img src="${(w.spin && w.spin[0]) || w.images[0]}" alt="360 view" draggable="false"><div class="hint">${ICON.rotate}Drag to rotate</div></div>
      ${w.wrist_video || w.images[0] ? `<div class="view" data-view="wrist">${w.wrist_video ? `<video src="${w.wrist_video}" poster="${w.images[0]}" muted loop playsinline preload="metadata"></video>` : `<img src="${w.images[0]}" alt="">`}<div class="wristbox"><label class="field"><span>Your wrist (cm)</span><input id="wrist" type="number" step="0.5" min="12" max="24" value="16.5" inputmode="decimal"></label><span id="wrist-out"></span></div></div>` : ""}
    </div>
    <div class="tabs" role="tablist">
      ${w.video ? '<button class="tab" role="tab" data-view="video">Video</button>' : ""}
      <button class="tab" role="tab" data-view="photo">Photos</button>
      <button class="tab" role="tab" data-view="spin">360°</button>
      <button class="tab" role="tab" data-view="wrist">On wrist</button>
    </div>
    <div class="thumbs">${w.images.map((s, i) => `<button class="thumb" aria-label="Photo ${i + 1}"><img src="${s}" alt="" loading="lazy"></button>`).join("")}</div>
  </div>

  <div class="buy">
    <div style="display:flex;flex-direction:column;gap:10px">
      <span class="eyebrow">${esc(w.brand)}${w.year ? ` · ${esc(w.year)}` : ""}</span>
      <h1 class="title">${esc(w.name.replace(/^\d{4}s?\s+/, "").replace(new RegExp("^" + w.brand + "\\s+", "i"), ""))}</h1>
      <div class="pricerow"><span class="big num">${w.sale_price ? `<s>${peso(w.price)}</s>` : ""}${peso(price)}</span><span class="label" style="color:var(--ink-3)">${soldOut ? "Sold" : "Free shipping · PH"}</span></div>
    </div>
    <div class="pills"><span class="pill">${esc(w.condition)}</span><span class="pill">${esc(w.box_papers)}</span><span class="pill accent">One of one</span></div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${soldOut
        ? `<a class="btn block" href="/contact/"><span>Sold · Ask for similar</span><span>Sold · Ask for similar</span></a>`
        : `<a id="buy-main" class="btn block" href="/checkout/?w=${w.slug}"><span>${store.payments_enabled ? "Buy now" : "Reserve"} · ${peso(price)}</span><span>${store.payments_enabled ? "Buy now" : "Reserve"} · ${peso(price)}</span></a>`}
      <a class="ghost" href="${msgHref}">${ICON.chat}Ask on Viber or WhatsApp</a>
      <div class="paylogos"><span>GCash</span><span>Maya</span><span>Card</span><span>Bank</span><span>BillEase</span><span>COD ${esc((store.meetup_areas || "Cebu").split(",")[0])}</span></div>
    </div>
    <dl class="spec">
      ${w.ref ? `<dt>Reference</dt><dd>${esc(w.ref)}</dd>` : ""}
      <dt>Movement</dt><dd>${esc(w.movement)}</dd>
      ${w.year ? `<dt>Year</dt><dd>${esc(w.year)}</dd>` : ""}
      <dt>Dial</dt><dd>${esc(w.dial_color)}</dd>
      <dt>Case</dt><dd>${w.case_size_mm}mm${w.lug_to_lug_mm ? `, ${w.lug_to_lug_mm}mm lug to lug` : ""}</dd>
      <dt>Strap</dt><dd>${esc(w.strap)}${w.fits_up_to_cm ? `, fits up to ${w.fits_up_to_cm}cm` : ""}</dd>
      <dt>Includes</dt><dd>${esc(w.box_papers)}</dd>
    </dl>
    <div class="cond"><span class="eyebrow">Condition, honestly</span><p>${esc(w.condition_notes)}</p></div>
    <div class="gbox">7-day guarantee. If this watch is ever proven not to be what we said it is, you get a full refund and we pay the return shipping. Change of mind within 7 days, unworn, is also fine.</div>
  </div>
</section>

${related.length ? `<section class="section gutter reveal" style="padding-bottom:96px">
  <div class="section-head"><h2 class="h2">${related.some((r) => r.brand === w.brand) ? "More " + esc(w.brand) : "You may also like"}</h2><a class="link" href="/#shop">View all</a></div>
  <div class="grid" style="padding-top:0">${related.map(card).join("")}</div>
</section>` : ""}

${!soldOut ? `<div class="mobilebar"><div class="p"><b class="num">${peso(price)}</b><small>Free shipping</small></div><a class="btn" href="/checkout/?w=${w.slug}"><span>${store.payments_enabled ? "Buy now" : "Reserve"}</span><span>${store.payments_enabled ? "Buy now" : "Reserve"}</span></a><a class="ico" href="${msgHref}" aria-label="Message us">${ICON.chat}</a></div>` : ""}
<script id="watch-data" type="application/json">${JSON.stringify(data)}</script>`;
  await write(`watch/${w.slug}/index.html`, layout({
    title: `${w.name} · CHRNS`, desc: w.condition_notes.split("\n")[0], path: `/watch/${w.slug}/`, scripts: ["watch.js"], image: w.images[0],
    jsonld: { "@context": "https://schema.org", "@type": "Product", name: w.name, image: w.images.map((i) => SITE + i), description: w.condition_notes, brand: { "@type": "Brand", name: w.brand }, itemCondition: "https://schema.org/UsedCondition", offers: { "@type": "Offer", price, priceCurrency: "PHP", availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock", url: `${SITE}/watch/${w.slug}/` } },
    body,
  }));
}

/* ---------- SOLD ---------- */
await write("sold/index.html", layout({
  title: "Sold archive · CHRNS", desc: "Watches that found their wrists.", path: "/sold/",
  body: `<section class="gutter" style="padding-top:48px;padding-bottom:96px"><span class="eyebrow">Archive</span><h1 class="h1" style="margin:12px 0 32px">Sold.</h1><div class="grid" style="padding-top:0">${sold.map(card).join("") || '<p class="empty">Nothing sold yet. Give it a week.</p>'}</div></section>`,
}));

/* ---------- CHECKOUT ---------- */
await write("checkout/index.html", layout({
  title: "Checkout · CHRNS", desc: "One screen. No account.", path: "/checkout/", scripts: ["checkout.js"], noindex: true,
  body: `
<section class="gutter co">
  <form id="co" novalidate>
    <input type="hidden" name="slug">
    <div style="display:flex;flex-direction:column;gap:24px">
      <h1 class="serif" style="font-size:clamp(30px,3.4vw,40px);line-height:1.1">Where should we send it?</h1>
      <div class="two"><label class="field"><span>Full name</span><input name="name" placeholder="Juan Dela Cruz" autocomplete="name" required></label><label class="field"><span>Mobile</span><input name="phone" placeholder="0917 000 0000" type="tel" autocomplete="tel" inputmode="tel" required></label></div>
      <label class="field"><span>Email</span><input name="email" placeholder="you@email.com" type="email" autocomplete="email" required></label>
      <label class="field"><span>Address</span><input name="address" placeholder="House, street, barangay" autocomplete="street-address" required></label>
      <div class="two"><label class="field"><span>City</span><input name="city" placeholder="Cebu City" autocomplete="address-level2" required></label><label class="field"><span>Country</span><select name="country" autocomplete="country-name"><option>Philippines</option><option>Singapore</option><option>Malaysia</option><option>Japan</option><option>Australia</option><option>United States</option><option>Other</option></select></label></div>
      <p id="country-note" class="fineprint"></p>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <h2 class="serif" style="font-size:28px;margin-bottom:8px">How would you like to pay?</h2>
      <div id="methods" role="radiogroup" style="display:flex;flex-direction:column;gap:10px"></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <button id="cta" class="btn block" type="submit"><span>Continue</span></button>
      <p id="err" class="err" role="alert"></p>
      <p class="fineprint" style="text-align:center">Online payments finish on PayMongo's secure page. We never see your card number.<br>7-day authenticity guarantee on every piece.</p>
    </div>
  </form>
  <aside class="sum">
    <div class="item"><div class="im"><img id="s-img" src="" alt=""></div><div style="display:flex;flex-direction:column;gap:6px"><span id="s-brand" class="eyebrow" style="font-size:11px"></span><span id="s-name" style="font-size:15px;line-height:1.35"></span><span id="s-meta" style="font-size:12px;color:var(--ink-3)"></span></div></div>
    <div class="lines"><div><span style="color:var(--ink-3)">Watch</span><span id="s-price" class="num"></span></div><div><span style="color:var(--ink-3)">Shipping</span><span id="s-ship"></span></div>
      <div style="display:flex;gap:12px;align-items:flex-end"><label class="field" style="flex:1"><span>Discount code</span><input name="code" placeholder="Optional" autocomplete="off"></label></div></div>
    <div class="total"><span class="label" style="color:var(--ink-3)">Total</span><b id="s-total" class="num"></b></div>
    <p class="fineprint">Held for you for 15 minutes while you pay. Ships within 1 business day via LBC or J&amp;T.</p>
  </aside>
</section>
<script id="catalog" type="application/json">${JSON.stringify(watches.map((w) => ({ slug: w.slug, name: w.name, brand: w.brand, year: w.year, price: w.price, sale_price: w.sale_price, condition: w.condition, box_papers: w.box_papers, images: w.images, status: w.status })))}</script>
<script id="settings" type="application/json">${JSON.stringify({ payments_enabled: !!store.payments_enabled, meetup_areas: store.meetup_areas })}</script>`,
}));

/* ---------- THANK YOU ---------- */
await write("thank-you/index.html", layout({
  title: "Thank you · CHRNS", desc: "Order received.", path: "/thank-you/", noindex: true,
  body: `<section class="gutter prose"><span class="eyebrow">Order received</span><h1>Salamat.</h1><p>We've got it. You'll hear from us within the day with either your tracking number or a message to confirm your meetup or payment details.</p><p>Questions in the meantime? <a class="ulink" href="${msgHref}">Message us</a> or reply to the confirmation email.</p><p><a class="ulink" href="/#shop">Back to the watches</a></p></section>`,
}));

/* ---------- CONTACT ---------- */
await write("contact/index.html", layout({
  title: "Contact · CHRNS", desc: "Ask about a watch, book a meetup in Cebu, or sell us yours.", path: "/contact/",
  body: `<section class="gutter" style="padding-top:48px;padding-bottom:128px;display:grid;grid-template-columns:1fr;gap:48px;max-width:1100px">
  <div style="display:flex;flex-direction:column;gap:16px;max-width:52ch"><span class="eyebrow">Contact</span><h1 class="h1">Talk to a person.</h1><p class="lede">Fastest on ${store.viber ? "Viber or " : ""}WhatsApp. Meetups in ${esc(store.meetup_areas || "Cebu")} by appointment. We also buy and trade.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">${store.viber ? `<a class="ghost" style="width:auto;padding:0 20px" href="viber://chat?number=${encodeURIComponent(store.viber)}">Viber</a>` : ""}${store.whatsapp ? `<a class="ghost" style="width:auto;padding:0 20px" href="https://wa.me/${store.whatsapp.replace(/\D/g, "")}">WhatsApp</a>` : ""}<a class="ghost" style="width:auto;padding:0 20px" href="mailto:${esc(store.email)}">Email</a></div></div>
  <form id="cf" data-contact style="display:flex;flex-direction:column;gap:24px;max-width:560px">
    <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
    <label class="field"><span>Your name</span><input name="name" required autocomplete="name"></label>
    <label class="field"><span>Mobile</span><input name="phone" type="tel" required autocomplete="tel"></label>
    <label class="field"><span>Email (optional)</span><input name="email" type="email" autocomplete="email"></label>
    <label class="field"><span>What's it about?</span><select name="topic"><option>Ask about a watch</option><option>Book a meetup / viewing</option><option>Sell or trade my watch</option><option>Order help</option><option>VIP access code</option><option>Other</option></select></label>
    <label class="field"><span>Watch (optional)</span><input name="watch" placeholder="e.g. Seiko Type II"></label>
    <label class="field"><span>Message</span><textarea name="message" rows="4" required></textarea></label>
    <button class="btn" type="submit"><span>Send</span><span>Send</span></button>
    <p id="cf-out" class="fineprint" role="status"></p>
  </form>
</section>
<script>
(()=>{const FORM_ENDPOINT="${esc(store.contact_endpoint || "")}";const f=document.getElementById('cf'),out=document.getElementById('cf-out');
f.addEventListener('submit',async e=>{e.preventDefault();const b=f.querySelector('button');b.disabled=true;out.textContent='';
if(!FORM_ENDPOINT){out.textContent='Form is being connected. For now, message us on WhatsApp or email ${esc(store.email)}.';b.disabled=false;return}
try{const r=await fetch(FORM_ENDPOINT,{method:'POST',body:new FormData(f)});const j=await r.json();if(!j.ok)throw new Error(j.error||'Please try again');out.textContent='Sent. We will get back to you within the day.';f.reset()}catch(err){out.textContent=err.message}b.disabled=false})})();
</script>`,
}));

/* ---------- POLICY PAGES ---------- */
const md = (s = "") => esc(s).split(/\n{2,}/).map((p) => p.startsWith("## ") ? `<h2>${p.slice(3)}</h2>` : p.startsWith("- ") ? `<ul>${p.split("\n").map((l) => `<li>${l.replace(/^- /, "")}</li>`).join("")}</ul>` : `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
for (const [slug, title, key] of [["guarantee", "Guarantee & returns", "returns"], ["shipping", "Shipping", "shipping"], ["terms", "Terms", "terms"], ["privacy", "Privacy", "privacy"]]) {
  await write(`${slug}/index.html`, layout({ title: `${title} · CHRNS`, desc: title, path: `/${slug}/`, body: `<section class="gutter prose"><h1>${title}</h1>${md(policies[key])}</section>` }));
}

/* ---------- assets + data ---------- */
await mkdir(`${OUT}/assets`, { recursive: true });
await cp("src/css/site.css", `${OUT}/assets/site.css`);
for (const f of await readdir("src/js")) await cp(`src/js/${f}`, `${OUT}/assets/${f}`);

await mkdir(`${OUT}/data`, { recursive: true });
await writeFile(`${OUT}/data/watches.json`, JSON.stringify(watches));
await writeFile(`${OUT}/_redirects`, `/watch/:slug /watch/:slug/ 301\n`);
console.log(`built ${watches.length} watches → ${OUT}/`);
