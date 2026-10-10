// Entry for the Vercel function at /api/whatsapp, bundled by
// scripts/build-vercel.mjs into .vercel/output (Build Output API).

import { createApp } from './app.ts';
import { nodeHandler } from './node.ts';

export default nodeHandler(createApp(process.env).handle);
