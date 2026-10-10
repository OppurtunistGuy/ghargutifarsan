// Try the assistant in the terminal, no Meta account needed: `npm run bot:chat`.
// Type as the customer; a number picks a button or list row from the last
// message. Lines starting with "/owner " are sent from the owner's number.

import { createInterface } from 'node:readline';
import { Bot } from './bot.ts';
import { MemoryStore } from './store.ts';
import type { Inbound, Outbound, Sender } from './whatsapp.ts';

const CUSTOMER = '919800000001';
const OWNER = '919800000000';
let options: string[] = [];
let seq = 0;

const sender: Sender = {
  async send(to: string, m: Outbound) {
    console.log(`\n${to === OWNER ? 'bot -> owner' : 'bot'}: ${m.text}`);
    if (to === OWNER) return;
    const choices = m.kind === 'buttons' ? m.buttons : m.kind === 'list' ? m.rows : [];
    options = choices.map((c) => c.id);
    choices.forEach((c, i) => console.log(`  [${i + 1}] ${c.title}`));
  },
  async template(_to: string, name: string, _language: string, params: string[]) {
    console.log(`\nbot -> owner [template ${name}]: ${params.join(' | ')}`);
  },
  async markRead() {},
};

const bot = new Bot({ store: new MemoryStore(), sender, ownerNumber: OWNER });
const rl = createInterface({ input: process.stdin, output: process.stdout });
console.log('Customer chat with the assistant. Try "hi". "/owner help" talks as the owner, "/loc" shares a location, Ctrl+C quits.');

rl.setPrompt('\nyou: ');
rl.prompt();
for await (const raw of rl) {
  const line = raw.trim();
  if (line) {
    // Echo piped input so a scripted run reads like a transcript.
    if (!process.stdin.isTTY) console.log(line);
    const id = `local-${++seq}`;
    const picked = /^\d{1,2}$/.test(line) ? options[Number(line) - 1] : undefined;
    let m: Inbound;
    if (line.startsWith('/owner ')) m = { id, from: OWNER, type: 'text', text: line.slice(7) };
    else if (line === '/loc') m = { id, from: CUSTOMER, type: 'location', location: { latitude: 18.5204, longitude: 73.8567 } };
    else if (picked) m = { id, from: CUSTOMER, type: 'choice', choice: picked };
    else m = { id, from: CUSTOMER, profileName: 'Test Customer', type: 'text', text: line.replaceAll('\\n', '\n') };
    await bot.receive(m);
  }
  rl.prompt();
}
