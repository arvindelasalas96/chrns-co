# chrns.co design spec

Reference: detimepieces.com (Shopify "Horizon" theme 4.1.1). We mirror its restraint, flipped to dark.
Rule for every decision: if it looks like a template, cut it.

## What DET actually does (measured)

| Element | DET value | chrns.co |
|---|---|---|
| Font | Inter, one family everywhere | Inter for UI + body. One serif for brand moments only (see Type). |
| Body | 14px / 400 / lh 1.6 | 15px / 400 / lh 1.6 |
| Nav links | 28px / 400 desktop (oversized, confident) | 22px / 400, letter-spacing -0.01em |
| Card title | 13px / 400 / lh 1.3 | 14px / 400 / lh 1.35 |
| Price | 12px / 500 | 14px / 500, tabular numerals |
| Announcement bar | 12px, centered, text only, no fill | same, 12px, 60% white on black |
| Header | ~68px tall, logo centered, nav left, utilities right | same layout, 64px, sticky, blurs on scroll |
| Grid | 4 columns desktop, gap 8px horizontal / 24px vertical | same. 2 columns mobile, gap 6px / 20px |
| Card | no radius, no border, no shadow, image + title + price | same. Nothing else on the card. |
| Card media | autoplay muted looping video, poster fallback, hover cycles to next frame | same, plus hover zoom (see Interactions) |
| Hero | 3 to 4 side-by-side autoplay video tiles, no text overlay | same, tiles bleed off the right edge to invite scroll |
| Sold out | small pill top-right on the card | same, "Sold" pill, white 10% fill, white text |
| Color | one navy #183D6E on white, nothing else | one bone white on black, one warm accent used sparingly |
| Product page | big image left, title / price / CTA right, plain-text spec list, honest condition paragraph, disclaimer | same structure, dark, plus 360 spin + wrist view |

## Color

```
--bg:        #0A0A0A   page
--bg-raised: #121212   cards on hover, drawers, admin
--line:      rgba(255,255,255,.08)   hairlines only, never boxes
--ink:       #EDEAE4   primary text (bone, not pure white)
--ink-2:     rgba(237,234,228,.62)   secondary text, prices on cards
--ink-3:     rgba(237,234,228,.38)   meta, captions, announcement
--accent:    #C9A96A   warm brass. Used for: Buy button text on hover, active filter chip, VIP badge. Nowhere else.
--danger:    #D96C5F   errors only
```

No gradients. No glows. No colored backgrounds behind sections. The dark is the design.

## Type

- **UI and body:** Inter (variable, self-hosted, weights 400 and 500 only). No 600 or 700 anywhere. Confidence comes from size and spacing, not bold.
- **Brand moments:** one serif, used only for the wordmark, the H1 on the home story block, and the big price on the product page. Candidate: Instrument Serif or Cormorant Garamond at 400. Pick after seeing the logo.
- Scale (desktop / mobile): display 56/36, h2 28/22, nav 22/18, body 15/15, card title 14/13, price 14/13, meta 12/12.
- Letter-spacing: display -0.02em, h2 -0.01em, meta +0.04em uppercase.
- Numbers: `font-variant-numeric: tabular-nums` on all prices.
- Max line length 60ch on text blocks.

## Layout

- Page gutter: 24px mobile, 48px tablet, 10vw desktop (DET sits at ~200px on 1840px, so about 11vw).
- Everything aligns to the gutter. No centered text blocks except the announcement bar.
- Vertical rhythm: 8px base. Section spacing 96px desktop, 64px mobile.
- Sticky header, 64px, background transitions from transparent to `#0A0A0A` at 90% with 12px blur after 40px scroll.
- Mobile: bottom-fixed action bar on product page (price + Buy), 64px, safe-area aware.

## Pages

### Home (= the shop)
1. Announcement bar (admin-editable, dismissible)
2. Header
3. Hero: horizontal row of 3.5 autoplay video tiles, 4:5, scroll-snap on mobile. No headline on top of them.
4. Filter + sort bar (sticky under header on scroll): brand chips, "Filter & Sort" button on mobile opens full-screen sheet
5. Grid: all available watches, newest first. Sold pieces drop to the bottom with the Sold pill, then into /sold after 30 days.
6. Story block: one serif H1 line, two short paragraphs, one wrist-shot video. Scroll-reveal only. This is the only "scrollytelling" on the home page.
7. Guarantee strip: three plain lines. Authenticated. 7-day money back if proven fake. Free PH shipping.
8. Drop alerts: one input, one button.
9. Footer: Viber, WhatsApp, Instagram, TikTok, policies, "Cebu, Philippines".

### Watch page
1. Media column (left desktop, top mobile): 
   - Default: the product video autoplaying
   - Tabs under it, text only: Photos · 360 · On wrist
   - **360:** 36 to 72 frame turntable sequence, drag to rotate, inertia, pinch zoom on mobile. This is how pre-owned one-of-ones get a "3D" view without modelling each watch. True glTF 3D is reserved for a hero/flagship piece only.
   - **On wrist:** the wrist-POV video, plus the wrist fit check (enter wrist cm, case drawn to scale on a wrist outline)
   - Condition hotspots overlay on photos (numbered dots, tap to read)
2. Buy column (right desktop, below mobile): title (serif), reference, price (serif, large), condition pill, Buy / Reserve button full width, payment logos row, "Message us on Viber" ghost button, spec list exactly like DET (Case code, Movement, Year, Dial, Case size, Case, Fits up to), Condition paragraph, Inclusions, Disclaimer, Guarantee line.
3. "You may also like": 4 cards, same brand or same price band.
4. Mobile: sticky bottom bar with price + Buy.

### Checkout
One screen. Dark. Order summary collapsed at top (tap to expand). Fields: name, mobile, email, address, city, country. Payment: large radio cards, GCash / Maya / Card / Bank / BillEase / COD (Cebu) / Meetup (Cebu). One button. No cart.

### /sold, /guarantee, /shipping, /terms, /privacy, /contact
Text pages, 60ch, serif H1, Inter body. Nothing decorative.

## Interactions

- **Card video:** `<video autoplay muted loop playsinline preload="metadata">` with poster. IntersectionObserver pauses off-screen videos (battery, data). Max 6 playing at once on mobile.
- **Card hover (desktop):** cursor becomes a small "+" circle; media scales to 1.04 over 600ms `cubic-bezier(.2,.8,.2,1)`; after 400ms hover, swaps to the macro dial photo (the "zoomed-in" shot). Title underlines with a 1px hairline that draws left to right.
- **Card tap (mobile):** no hover states. Tap goes straight to the watch page. Nothing hides behind hover.
- **Hero tiles:** horizontal scroll, scroll-snap, drag on desktop with momentum.
- **Page transitions:** View Transitions API, 350ms crossfade. Media element morphs from card to product page (shared element).
- **Scroll reveal:** text fades up 12px over 500ms, once, threshold 0.3. Never on cards, only on the story block and section headers.
- **360 viewer:** pointer drag, 1 frame per 6px, inertia decays over 900ms, cursor "grab/grabbing". Preload frames progressively (every 4th first).
- **Buy button:** no color change on hover. Text slides up 100% and the same text slides in from below (two spans). Brass text on hover.
- **Filter sheet (mobile):** slides up from bottom, 100dvh, blur backdrop, "Show 23 watches" button pinned at bottom.
- `prefers-reduced-motion`: all of the above become instant.

## Performance budget (non-negotiable for mobile PH)
- LCP under 2.5s on 4G. Hero videos: 720p, H.265 + VP9 fallback, under 1.5MB each, poster JPG under 60KB.
- Card videos: 480p, under 600KB, lazy. 
- Images: AVIF + WebP, `srcset`, blur-up placeholder.
- Fonts: Inter variable subset, `font-display: swap`, under 60KB.
- No animation library bigger than 10KB. Prefer CSS + IntersectionObserver. GSAP only if the 360 viewer needs it (it won't).
- Zero third-party scripts on the storefront except the payment redirect.

## What we will not copy from DET
- Oversized 28px nav on mobile (cramped). Ours drops to 18.
- PayPal button and "More payment options" link (clutter). One button.
- Quantity stepper (one-of-one, pointless).
- Account icon (no accounts).
- Country/currency dropdown with 90 countries. PHP only, with a single "International? Message us" line.
- "All sales are final" disclaimer. We lead with the 7-day guarantee instead.
