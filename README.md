# Gharguti Farsan

Phase 1 foundation for a Maharashtrian sweets and Faral storefront. React 19, TypeScript, Vite, Tailwind CSS v4, React Router and Zustand, with a local shadcn/ui-style Button and Lucide icons.

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
```

Browser tests use installed Chromium when `CHROMIUM_PATH` is supplied. On other machines, install the Playwright browser once with `npx playwright install chromium`, then run `npm run test:e2e`. Screenshots and traces are generated under ignored `test-results/`.

## Structure

| Directory | Responsibility |
| --- | --- |
| `src/app/` | Router, shared layout, page titles and navigation focus |
| `src/components/` | Shared container, branding, header, footer and headings |
| `src/components/ui/` | Locally owned Button and class utilities |
| `src/styles/` | Tailwind v4 theme, typography and accessibility defaults |
| `src/config/` | Business information and navigation |
| `src/types/`, `src/data/` | Product types and single catalog source |
| `src/stores/` | Zustand shopping state contract for Phase 4 |
| `src/assets/`, `public/images/` | Approved assets (currently empty) |
| `tests/` | Browser checks and accessibility scans |
| `docs/` | Phase status and outstanding inputs |

## Business configuration

Edit `src/config/business.ts` with approved public information only. `null` means not supplied; claims and contact destinations stay hidden until configured. A WhatsApp number must be digits-only international format including its country code. Never put credentials in frontend files.

Edit `src/data/products.ts` with approved descriptions, images, ingredients, allergens, storage guidance and variants. Prices are integer paise; `null` is an unknown price, not zero. Product/variant availability is explicitly typed. Product names in the supplied document have been seeded; pack sizes, prices, images and availability have not been fabricated. Marathi catalog names are translations to review alongside final business copy.

## Phase boundaries

The shared shell and routes run now. Page bodies are clearly temporary collection/story/contact scaffolds. Homepage composition is Phase 2; Faral catalog and filters are Phase 3; product details, cart mutations/persistence and WhatsApp order messages are Phase 4. The empty bag is a route scaffold, not completed shopping functionality.

No backend, credentials or payment service is required for this foundation. Production hosting must rewrite application routes to `index.html` for direct React Router navigation. No deployment has been performed.

See [Phase 1 report](docs/phase-1.md) for validation and missing inputs.
