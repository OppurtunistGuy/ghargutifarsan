// Wires config, store, sender and bot from environment variables.

import { Bot } from './bot.ts';
import { missingForLive, readConfig } from './config.ts';
import { createHandler } from './handler.ts';
import { MemoryStore, UpstashStore, type Store } from './store.ts';
import { graphSender, type Outbound, type Sender } from './whatsapp.ts';

/** Dry-run sender: prints what would be sent. */
export function logSender(print: (line: string) => void = console.log): Sender {
  return {
    async send(to: string, m: Outbound) {
      print(`-> ${to}: ${m.text}`);
      if (m.kind === 'buttons') m.buttons.forEach((b, i) => print(`   [${i + 1}] ${b.title}  (${b.id})`));
      if (m.kind === 'list') m.rows.forEach((r, i) => print(`   [${i + 1}] ${r.title}${r.description ? `: ${r.description}` : ''}  (${r.id})`));
    },
    async template(to: string, name: string, _language: string, params: string[]) {
      print(`-> ${to}: [template ${name}] ${params.join(' | ')}`);
    },
    async markRead() {},
  };
}

export function createApp(env: Record<string, string | undefined>, opts: { store?: Store; sender?: Sender } = {}) {
  const config = readConfig(env);
  // A dry run needs no secrets; a live deployment needs all of them.
  const missing = config.dryRun ? [] : missingForLive(config);
  const store = opts.store ?? (config.redis ? new UpstashStore(config.redis.url, config.redis.token) : new MemoryStore());
  const sender =
    opts.sender ??
    (config.dryRun || !config.token || !config.phoneNumberId
      ? logSender()
      : graphSender({ token: config.token, phoneNumberId: config.phoneNumberId, version: config.graphVersion }));
  const bot = new Bot({
    store,
    sender,
    ownerNumber: config.ownerNumber,
    ownerTemplate: config.ownerTemplate,
    customerTemplate: config.customerTemplate,
  });
  return { config, store, sender, bot, handle: createHandler({ config, store, sender, bot, missing }) };
}
