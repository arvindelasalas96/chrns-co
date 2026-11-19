// Shared helpers for the chrns.co payment functions.
import { readFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

const PAYMONGO_API = "https://api.paymongo.com/v1";

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** PayMongo uses HTTP Basic auth: base64(secret_key + ":") */
export async function paymongo(endpoint, method = "GET", data) {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not set");
  const res = await fetch(`${PAYMONGO_API}${endpoint}`, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: "Basic " + Buffer.from(`${key}:`).toString("base64"),
    },
    body: data ? JSON.stringify({ data: { attributes: data } }) : undefined,
  });
  const out = await res.json();
  if (!res.ok) {
    const msg = out?.errors?.map((e) => e.detail).join("; ") || res.statusText;
    throw new Error(`PayMongo ${res.status}: ${msg}`);
  }
  return out.data;
}

/** Load a watch record from the repo-bundled data folder (bundled with the function by esbuild). */
export async function loadWatch(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(process.cwd(), "data", "watches", `${slug}.json`);
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

export function peso(n) {
  return "₱" + Number(n).toLocaleString("en-PH");
}

/** Send email through the store Gmail account. Swap for Resend once chrns.co is live. */
export async function sendMail({ to, cc, subject, html }) {
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_APP_PASSWORD not set, skipping email:", subject);
    return;
  }
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  await transport.sendMail({
    from: `"chrns.co" <${process.env.GMAIL_USER}>`,
    to,
    cc,
    subject,
    html,
  });
}
