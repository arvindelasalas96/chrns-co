# chrns.co — payment backend

Static site on Netlify. Inventory = JSON files in `data/watches/`. Payments = PayMongo hosted checkout.
Orders = Netlify Blobs. Emails = store Gmail (swap to Resend once the domain is live).

## How a sale flows

1. Buyer fills the one-screen checkout and taps Continue.
2. `create-checkout` function checks the watch is still `available`, saves a pending order, asks PayMongo for a hosted checkout page, sends the buyer there.
3. Buyer pays with GCash / Maya / QR Ph / card / bank / BillEase on PayMongo's page. We never touch card numbers (PayMongo is PCI compliant, we are not, and we don't need to be).
4. PayMongo calls `paymongo-webhook`. We verify the signature, mark the order paid, commit `status: "sold"` to the watch file in GitHub (site rebuilds in ~1 min), email Jafaith + the buyer.
5. COD / meetup skip PayMongo: the order is saved as `reserved` and Jafaith gets an email to call the buyer.

## Setup (Arvin does once)

1. **PayMongo account**: sign up at dashboard.paymongo.com with chronos.cov1@gmail.com. Activate as Sole Proprietor, upload DTI cert + Jafaith's ID. Then request Visa/Mastercard under Payment Methods (5 to 10 business days).
2. **API keys**: Dashboard > Developers > API Keys. Copy the **test** secret key first. Put it in Netlify > Site > Environment variables as `PAYMONGO_SECRET_KEY`. Fill the rest from `.env.example`.
3. **Deploy** this repo to Netlify. Note the `*.netlify.app` URL and set `SITE_URL`.
4. **Register the webhook** (one curl, test mode first):
   ```bash
   curl -X POST https://api.paymongo.com/v1/webhooks \
     -u sk_test_xxx: \
     -H 'content-type: application/json' \
     -d '{"data":{"attributes":{"url":"https://chrns-co.netlify.app/.netlify/functions/paymongo-webhook","events":["checkout_session.payment.paid"]}}}'
   ```
   The response contains `secret_key` (starts with `whsk_`). Save it as `PAYMONGO_WEBHOOK_SECRET`. Redeploy.
5. **GitHub token**: fine-grained token on Arvin's account, this repo only, Contents: read/write. Save as `GITHUB_TOKEN`.
6. **Gmail app password**: Google Account (chronos.cov1) > Security > 2-Step Verification on > App passwords > create one. Save as `GMAIL_APP_PASSWORD`.
7. Open `/checkout-test.html`, run a test payment with PayMongo's test GCash / test card (`4343 4343 4343 4345`). Check the order email arrives and the watch file flips to `sold`.
8. Go live: swap test keys for live keys, re-run step 4 with the live key, update both env vars.

## Adding or editing watches

Phase 1: edit `data/watches/<slug>.json`, push. Phase 2: `/admin` (Decap CMS) does the same from a form.

Status values: `available` · `reserved` · `sold` · `hidden`

## Contact form (Google Apps Script)

1. Log in to script.google.com as chronos.cov1@gmail.com → New project → paste `scripts/contact-form.gs`.
2. Deploy → New deployment → Web app → Execute as **Me**, Who has access **Anyone** → Deploy → copy the URL.
3. Paste it into `public/contact.html` as `FORM_ENDPOINT`. Every submission emails the store + Jafaith, cc Arvin, and logs to a sheet if you bind one.

## Admin portal (`/admin`)

Decap CMS. Enable **Identity** and **Git Gateway** in Netlify > Site > Identity, set registration to Invite only, invite Jafaith and Arvin by email. Collections: Watches (add/edit/mark sold, sale price, VIP flag, condition hotspots), Discounts & Promos (codes), Store Settings (contact numbers, announcement bar, payments on/off, VIP code, policy text).

## Placeholders (to finish later)

- Payments: scaffold is wired but `payments_enabled` is `false` in Store Settings. The site shows **Reserve** instead of **Pay now** until PayMongo is approved.
- Policies: placeholder text in `data/settings/policies.json`, editable in /admin.

## Live

- Production: https://chrns-co.netlify.app (Netlify site id `b82f6567-363a-444d-baf3-6e1d87b8b2c7`, team arvindelasalas96)
- Deploys automatically from `main` on GitHub (`arvindelasalas96/chrns-co`). Build: `node build.mjs`, publish `public/`.
- Design spec: `DESIGN.md`. Mockups: https://claude.ai/artifact/5rSsBbBMuTSnJNN6Xgf8o7

## Still to switch on (in order)

1. Netlify > Identity: enable, Invite only, enable Git Gateway, invite Arvin + Jafaith → `/admin` works.
2. Gmail app password for chronos.cov1 → env `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ORDER_ALERT_TO`, `ORDER_ALERT_CC` → order emails fire.
3. Apps Script for the contact form → paste URL into /admin > Store Settings > Contact form endpoint.
4. Viber + WhatsApp numbers in /admin > Store Settings.
5. PayMongo keys + webhook → flip `payments_enabled` in /admin. Buttons change from Reserve to Buy now.
6. Real policies text in /admin > Policies (placeholders now).
7. Domain chrns.co → Netlify > Domain management, then Resend for orders@chrns.co.
