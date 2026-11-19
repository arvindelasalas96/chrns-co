// POST /.netlify/functions/create-checkout
// Body: { slug, name, email, phone, address, city, country, method }
// method: "online" (PayMongo hosted page) | "cod" | "meetup"
// Returns: { url } for online, or { ok: true, orderId } for COD/meetup.
import { getStore } from "@netlify/blobs";
import { json, paymongo, loadWatch, peso, sendMail } from "./_lib.mjs";

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { slug, name, email, phone, address, city, country = "Philippines", method = "online" } = body;
  if (!slug || !name || !email || !phone || !address) {
    return json(400, { error: "Missing required fields" });
  }

  const watch = await loadWatch(slug);
  if (!watch) return json(404, { error: "Watch not found" });
  if (watch.status !== "available") return json(409, { error: "This watch is no longer available" });

  // Philippines: we cover shipping. International: buyer pays, quoted by DHL after order.
  const isPH = /philippines/i.test(country);
  const shippingNote = isPH
    ? "Free shipping within the Philippines"
    : "International shipping billed separately (DHL)";

  const orderId = `CH-${Date.now().toString(36).toUpperCase()}`;
  const orders = getStore("orders");
  const order = {
    id: orderId,
    slug,
    title: `${watch.brand} ${watch.model}`,
    amount: watch.price,
    currency: "PHP",
    method,
    status: method === "online" ? "pending_payment" : "reserved",
    buyer: { name, email, phone, address, city, country },
    shippingNote,
    createdAt: new Date().toISOString(),
  };

  // COD / meetup: reserve now, Jafaith confirms by phone.
  if (method !== "online") {
    await orders.setJSON(orderId, order);
    await notify(order, watch, "RESERVED");
    return json(200, { ok: true, orderId });
  }

  // Online: create a PayMongo hosted checkout session.
  const site = process.env.SITE_URL;
  const session = await paymongo("/checkout_sessions", "POST", {
    line_items: [
      {
        name: `${watch.brand} ${watch.model}`,
        description: `${watch.condition} · ${watch.box_papers} · ${shippingNote}`,
        amount: Math.round(watch.price * 100), // centavos
        currency: "PHP",
        quantity: 1,
        images: watch.images?.[0] ? [`${site}${watch.images[0]}`] : [],
      },
    ],
    // Which buttons the buyer sees. Cards appear only once PayMongo approves them.
    payment_method_types: ["gcash", "paymaya", "qrph", "card", "dob", "billease", "grab_pay"],
    billing: { name, email, phone, address: { line1: address, city, country: isPH ? "PH" : country } },
    send_email_receipt: true,
    show_description: true,
    show_line_items: true,
    description: `Order ${orderId}`,
    reference_number: orderId,
    success_url: `${site}/thank-you?order=${orderId}`,
    cancel_url: `${site}/watch/${slug}?cancelled=1`,
    metadata: { orderId, slug },
  });

  order.checkoutSessionId = session.id;
  await orders.setJSON(orderId, order);

  return json(200, { url: session.attributes.checkout_url, orderId });
};

async function notify(order, watch, label) {
  const b = order.buyer;
  await sendMail({
    to: process.env.ORDER_ALERT_TO,
    cc: process.env.ORDER_ALERT_CC,
    subject: `[chrns.co] ${label}: ${order.title} · ${peso(order.amount)} · ${order.id}`,
    html: `<h2>${label}: ${order.title}</h2>
      <p><b>${peso(order.amount)}</b> · ${order.method.toUpperCase()}</p>
      <p>${b.name}<br>${b.phone}<br>${b.email}<br>${b.address}, ${b.city}, ${b.country}</p>
      <p>${order.shippingNote}</p>
      <p>Watch: ${watch.slug}</p>`,
  });
}
