# Gharguti Farsan

Storefront for Gharguti Farsan, a home-run Maharashtrian sweets and faral business: Home, Laddus & Modak, Faral, product details, Our Story, Contact and a persistent cart that turns into a WhatsApp order message. React 19, TypeScript, Vite, Tailwind CSS v4, React Router and Zustand, with a local shadcn/ui-style Button and Lucide icons.

**Before launch, read [docs/content-status.md](docs/content-status.md):** prices are prototype samples, several photos and all contact details are still placeholders.

## Branch workflow

- `main`: approved baseline and releases.
- `UAT`: development and acceptance testing before promotion to `main`.

The initial Phase 1 foundation is the shared baseline for both branches. Make future changes on `UAT` (or feature branches targeting `UAT`), run the checks and review the UI there, then open a pull request from `UAT` to `main` after approval. Do not push untested feature changes directly to `main`.

The GitHub Actions workflow checks pushes and pull requests targeting either branch: lint, unit tests, TypeScript, production build, browser interaction tests and accessibility scans. Passing checks support acceptance testing; they do not constitute business or visual approval. Branch protection and live website hosting are separate repository settings and have not been configured.

## Development

Use Node 22.12+ (Node 24 was verified) and npm. Run from this checkout:

```sh
npm ci
npm run dev
```

The npm cache uses `/workspace/.npm-cache` for the cloud environment. Outside this environment, override it with `npm ci --cache <your-writable-cache-directory>`.

```sh
npm run check       # ESLint, unit tests, TypeScript and production build
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
npm run preview    # serve the production build
npm run bot:chat   # chat with the WhatsApp assistant in the terminal (no Meta account)
npm run bot:dev    # dry-run WhatsApp webhook on http://localhost:8787/api/whatsapp
npm run build:vercel  # production build + Vercel Build Output (storefront + /api/whatsapp)
```

Visual QA captures (dev server running): `node scripts/screenshots.mjs <outDir> [baseUrl] [routes] [widths]`. Product photos are cut from the client's product sheet with `python scripts/crop-product-sheet.py assets-src/photos/product-sheet.webp public/images/products` (needs Pillow).

Browser tests use installed Chromium when `CHROMIUM_PATH` is supplied. On other machines, install the Playwright browser once with `npx playwright install chromium`, then run `npm run test:e2e`. Screenshots and traces are generated under ignored `test-results/`.

## Structure

| Directory | Responsibility |
| --- | --- |
| `src/app/` | Router, shared layout, page titles/meta, navigation focus, scroll reveal |
| `src/pages/` | Home, Laddus, Faral, Product, Our Story, Contact, Cart, Not found |
| `src/components/` | Header, footer, hero, product cards, cart drawer, trust strip, placeholders |
| `src/lib/` | Cart summary, WhatsApp message and link building |
| `src/components/ui/` | Locally owned Button and class utilities |
| `src/styles/` | Tailwind v4 theme, typography and accessibility defaults |
| `src/config/` | Business details and claims (`business.ts`), editorial photo slots (`media.ts`), navigation |
| `src/types/`, `src/data/` | Product types and single catalog source |
| `src/stores/` | Persistent cart and UI (drawer, toast) state |
| `public/images/products/` | Product photos cropped from the client's sheet (`assets-src/photos/`) |
| `server/` | WhatsApp assistant (Cloud API webhook): conversation, owner alerts and commands, Vercel function |
| `tests/` | Browser checks and accessibility scans |
| `docs/` | Phase status and outstanding inputs |

## Business configuration

Edit `src/config/business.ts` with approved public information only. `null` means not supplied and renders a visible placeholder. Each trust claim has `confirmed: false` until the client confirms it. The WhatsApp number is the dedicated business number the assistant runs on (never a personal number), digits-only international format including its country code; setting it enables sending from the cart and contact form. The assistant answers from this file too, so unknown facts stay `null` rather than guessed. Set `pricesConfirmed: true` once real prices are entered. Never put credentials in frontend files.

Edit `src/data/products.ts` for products, descriptions, prices (integer paise; `null` is unknown, never free), pack sizes, ingredients, allergens and storage. Editorial photos (heroes, kitchen) go in `src/config/media.ts`.

## Status

Phases 1 to 5 are implemented; see [docs/phase-1.md](docs/phase-1.md) and [docs/phases-2-5.md](docs/phases-2-5.md). No payment service is used. The only backend is the WhatsApp assistant webhook (`server/`, see [docs/whatsapp-assistant.md](docs/whatsapp-assistant.md)): customers order by chatting with it on a dedicated business number, and the owner's personal number stays a server secret. Hosting target is Vercel (`vercel.json`, `scripts/build-vercel.mjs`), which also rewrites application routes to `index.html`. No deployment has been performed.
