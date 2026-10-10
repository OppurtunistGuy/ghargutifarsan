// The webhook endpoint as a web-standard fetch handler:
//   GET  /api/whatsapp  Meta's one-time verification (hub.challenge echo)
//   POST /api/whatsapp  signed message notifications -> Bot

import type { Bot } from './bot.ts';
import type { Config } from './config.ts';
import type { Store } from './store.ts';
import { parseWebhook, verifySignature, type Sender } from './whatsapp.ts';

export interface HandlerDeps {
  config: Config;
  store: Store;
  sender: Sender;
  bot: Bot;
  /** Non-empty when the deployment lacks secrets: POSTs are refused, nothing is sent. */
  missing: string[];
  log?: (...args: unknown[]) => void;
}

const SEEN_TTL = 2 * 86_400;
const text = (body: string, status = 200) => new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });

export function createHandler({ config, store, sender, bot, missing, log = console.error }: HandlerDeps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === 'GET') {
      const q = new URL(req.url).searchParams;
      if (q.get('hub.mode') === 'subscribe' && config.verifyToken && q.get('hub.verify_token') === config.verifyToken) {
        return text(q.get('hub.challenge') ?? '');
      }
      return text('forbidden', 403);
    }
    if (req.method !== 'POST') return text('method not allowed', 405);

    if (missing.length) {
      log(`whatsapp webhook not configured, missing: ${missing.join(', ')}`);
      return text('not configured', 503);
    }

    const raw = await req.text();
    if (!config.dryRun || config.appSecret) {
      if (!config.appSecret || !verifySignature(raw, req.headers.get('x-hub-signature-256'), config.appSecret)) {
        return text('invalid signature', 401);
      }
    }

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return text('bad request', 400);
    }

    // Meta retries until it gets a 200, so always answer 200 once the payload is
    // authentic; failures are logged, and the dedupe key stops double replies.
    for (const m of parseWebhook(payload)) {
      try {
        if (!(await store.setIfAbsent(`seen:${m.id}`, 1, SEEN_TTL))) continue;
        if (!config.dryRun) sender.markRead(m.id).catch((err) => log('mark read failed', err));
        await bot.receive(m);
      } catch (err) {
        log('message handling failed', m.id, err);
      }
    }
    return text('ok');
  };
}
