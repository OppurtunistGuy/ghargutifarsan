// Packages the storefront and the WhatsApp webhook for Vercel's Build Output API v3:
//   .vercel/output/static/                       <- dist/ (run `npm run build` first)
//   .vercel/output/functions/api/whatsapp.func/  <- server/vercel.ts bundled to one ESM file
//   .vercel/output/config.json                   <- SPA fallback: app routes serve index.html
// Bundling here (Vite SSR build, already a dependency) inlines the catalogue and
// business config the assistant reads, so the function has no runtime file access.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}.vercel/output`;
const fn = `${out}/functions/api/whatsapp.func`;

if (!existsSync(`${root}dist/index.html`)) throw new Error('dist/ is missing: run `npm run build` first');
rmSync(out, { recursive: true, force: true });
mkdirSync(fn, { recursive: true });

cpSync(`${root}dist`, `${out}/static`, { recursive: true });

await build({
  root,
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  ssr: { noExternal: true, target: 'node' },
  build: {
    ssr: `${root}server/vercel.ts`,
    outDir: fn,
    emptyOutDir: false,
    target: 'node22',
    minify: false,
    rollupOptions: { output: { format: 'es', entryFileNames: 'index.mjs' } },
  },
});

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

writeFileSync(`${fn}/.vc-config.json`, json({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: false,
  maxDuration: 15,
  // Mumbai: the closest Vercel region to customers in Maharashtra.
  regions: ['bom1'],
}));

writeFileSync(`${out}/config.json`, json({
  version: 3,
  routes: [
    // Static files and the /api/whatsapp function first; everything else is a client route.
    { handle: 'filesystem' },
    { src: '^/api/(.*)$', status: 404 },
    { src: '^/(.*)$', dest: '/index.html' },
  ],
}));

console.log('Vercel output written to .vercel/output (storefront + /api/whatsapp)');
