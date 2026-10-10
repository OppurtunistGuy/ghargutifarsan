# Phases 2 to 5: storefront build

Built on top of the Phase 1 foundation (2026-10-10), after the two approved prototypes and the
client's product sheet were supplied.

## Delivered

- **Design system:** tokens sampled from the prototypes (`src/styles/index.css`). Noto Serif
  Devanagari for Marathi headings with Noto Serif for English headings (one design family, so
  mixed-script headings align), Mukta for body text, Kalam for one handwritten note. Fraunces was
  removed. Shape rule: cards 0.75rem, card actions 0.375rem, page CTAs and filters full pills.
- **Home:** announcement bar, header with cart, split hero, trust strip, Our Laddus (4), kitchen
  story, Beyond the Laddus (modak, chakli, chivda), dark WhatsApp band, footer.
- **Faral:** hero, five-item trust strip, collection with working filters (All Faral, Chakli, Chivda,
  Sweet Snacks, Savoury Snacks, Festive Specials; state in `?filter=`), festive specials with View
  Details, Made with Love with claim list, WhatsApp band.
- **Laddus:** laddus and modak with a filter (`?type=`).
- **Product details:** photo, bilingual name, price, pack-size selector (appears when a product has
  more than one pack), quantity, Add to Cart, availability, ingredients, allergens, storage, combo
  contents, related products.
- **Our Story:** homemade positioning, festive calendar from real catalogue items, how ordering
  works. The family's own story is a marked placeholder.
- **Contact:** business details (placeholders), validated enquiry form that composes a WhatsApp
  message; sending is gated on a configured number; copy fallback.
- **Cart:** Zustand store persisted to localStorage (`gharguti-farsan-bag`, sanitised on load),
  slide-in drawer (native `<dialog>`), cart page with quantity, removal, clear, subtotal, empty
  state, add-to-cart toast.
- **WhatsApp checkout:** encoded message with products, packs, quantities, line prices, estimated
  total, unpriced items and a confirmation request. `wa.me` link only when
  `business.whatsappNumber` is valid.
- **Motion:** staggered hero entrance, fade-up reveal on cards (IntersectionObserver), drawer and
  toast transitions, card hover lift. All disabled under `prefers-reduced-motion`.
- **SEO:** per-route title and meta description, Open Graph basics.

## Dependencies

Added `@fontsource-variable/noto-serif`, `@fontsource-variable/noto-serif-devanagari` and
`@fontsource/kalam` (self-hosted fonts, OFL texts in `public/licenses/`). Removed
`@fontsource/fraunces`. React Hook Form, Zod, Motion and shadcn Sheet were not added: native
validation logic, CSS transitions and `<dialog>` cover the needs without extra JavaScript.

## Validation (Windows 11, Node 22.23)

- `npm run lint`, `npm run typecheck`: pass.
- `npm test`: 21 unit tests pass (catalogue integrity, sample prices, filters, price formatting,
  cart store, persisted-data sanitising, order message, WhatsApp URL gating).
- `npx playwright test`: 17 browser tests pass in Chromium: all routes, no contact links while
  unconfigured, placeholder marking, desktop and mobile navigation, skip link, Faral and Laddus
  filters, View Details, cart add/quantity/persistence/message/removal/empty state, product page
  quantity, contact validation, and no horizontal overflow plus no automated axe WCAG A/AA
  violations at 360, 390, 768, 1024 and 1440 px on seven routes; cart drawer and mobile menu scans.
- Screenshots inspected at 1440 and 390 px for every page (`node scripts/screenshots.mjs`).

Not done: Firefox/WebKit runs, real-device testing, Lighthouse, deployment. Automated accessibility
scans do not establish full WCAG conformance.

## Known limitations

See `docs/content-status.md` for every placeholder and sample value. Product photos are low
resolution. Hosting must rewrite all routes to `index.html`.
