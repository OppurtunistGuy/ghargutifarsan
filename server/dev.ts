// Local webhook server: `npm run bot:dev` (http://localhost:8787/api/whatsapp).
// Dry run by default (prints replies, accepts unsigned posts). Set the real
// variables in .env.local to talk to Meta through a tunnel instead.

import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { createApp } from './app.ts';
import { nodeHandler } from './node.ts';

const env: Record<string, string | undefined> = { WHATSAPP_DRY_RUN: '1', ...process.env };
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const kv = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (kv?.[1] && kv[2] !== undefined) env[kv[1]] = kv[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const app = createApp(env);
const port = Number(env.PORT ?? 8787);
const handle = nodeHandler(app.handle);
createServer((req, res) => {
  if (!req.url?.startsWith('/api/whatsapp')) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  void handle(req, res);
}).listen(port, () => {
  console.log(`WhatsApp webhook on http://localhost:${port}/api/whatsapp (${app.config.dryRun ? 'dry run' : 'live'})`);
});
