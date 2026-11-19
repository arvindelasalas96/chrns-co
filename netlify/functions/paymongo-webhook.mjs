// POST /.netlify/functions/paymongo-webhook
// PayMongo calls this when a checkout session is paid.
// 1. Verify the signature  2. Mark the order paid  3. Flip the watch to "sold" in GitHub  4. Email everyone
import { createHmac, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { json, peso, sendMail } from "./_lib.mjs";

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const raw = await req.text();
  if (!verify(req.headers.get("paymongo-signature"), raw)) {
    return json(401, { error: "Bad signature" });
  }

  const event = JSON.parse(raw);
  const type = event?.data?.attributes?.type;
  if (type !== "checkout_session.payment.paid") return json(200, { ignored: type });

  const session = event.data.attributes.data;
  const orderId = session?.attributes?.metadata?.orderId;
  const slug = session?.attributes?.metadata?.slug;
  const payment = session?.attributes?.payments?.[0]?.attributes;

  const orders = getStore("orders");
  const order = (await orders.get(orderId, { type: "json" })) || { id: orderId, slug };

  if (order.status === "paid") return json(200, { duplicate: true }); // PayMongo retries; be idempotent

  order.status = "paid";
  order.paidAt = new Date().toISOString();
  order.paymentMethod = payment?.source?.type || "unknown";
  order.paymentId = session?.attributes?.payments?.[0]?.id;
  await orders.setJSON(orderId, order);

  try {
    await markSold(slug, orderId);
  } catch (e) {
    console.error("GitHub update failed, mark sold manually in /admin:", e.message);
  }

  const b = order.buyer || {};
  await sendMail({
    to: process.env.ORDER_ALERT_TO,
    cc: process.env.ORDER_ALERT_CC,
    subject: `[chrns.co] PAID ✅ ${order.title} · ${peso(order.amount)} · ${orderId}`,
    html: `<h2>Paid: ${order.title}</h2>
      <p><b>${peso(order.amount)}</b> via ${order.paymentMethod}</p>
      <p>${b.name}<br>${b.phone}<br>${b.email}<br>${b.address}, ${b.city}, ${b.country}</p>
      <p>${order.shippingNote || ""}</p>
      <p>Next: pack it, ship via LBC/J&T/DHL, reply to the buyer with the tracking number.</p>`,
  });

  if (b.email) {
    await sendMail({
      to: b.email,
      subject: `Your chrns.co order ${orderId} is confirmed`,
      html: `<p>Hi ${b.name},</p>
        <p>Payment received for <b>${order.title}</b> (${peso(order.amount)}). Thank you.</p>
        <p>We'll message you the tracking number within 1 business day. ${order.shippingNote || ""}.</p>
        <p>Every watch is covered by our 7-day authenticity guarantee: proven fake, full refund.</p>
        <p>Questions? Reply to this email or message us on Viber/WhatsApp.</p>
        <p>chrns.co</p>`,
    });
  }

  return json(200, { ok: true });
};

/** Paymongo-Signature: t=<ts>,te=<test sig>,li=<live sig>. Signed string is `${t}.${rawBody}` */
function verify(header, raw) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=")));
  const sig = process.env.PAYMONGO_SECRET_KEY?.startsWith("sk_live") ? parts.li : parts.te;
  if (!parts.t || !sig) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${raw}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

/** Commit status: "sold" to data/watches/<slug>.json in GitHub. Netlify auto-redeploys. */
async function markSold(slug, orderId) {
  const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = "main" } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_REPO) throw new Error("GitHub env vars missing");
  const api = `https://api.github.com/repos/${GITHUB_REPO}/contents/data/watches/${slug}.json`;
  const headers = {
    authorization: `Bearer ${GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "user-agent": "chrns-co-webhook",
  };
  const cur = await fetch(`${api}?ref=${GITHUB_BRANCH}`, { headers }).then((r) => r.json());
  if (!cur.sha) throw new Error("watch file not found in repo");
  const watch = JSON.parse(Buffer.from(cur.content, "base64").toString("utf8"));
  watch.status = "sold";
  watch.sold_at = new Date().toISOString().slice(0, 10);
  const res = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `sold: ${slug} (${orderId})`,
      content: Buffer.from(JSON.stringify(watch, null, 2) + "\n").toString("base64"),
      sha: cur.sha,
      branch: GITHUB_BRANCH,
    }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
}
